// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package frames

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"strings"

	ffmpeg "github.com/u2takey/ffmpeg-go"
	"go.opentelemetry.io/otel/attribute"

	"geti.com/iai_core/entities"
	"geti.com/iai_core/logger"
	"geti.com/iai_core/telemetry"
)


type CLIFrameExtractor interface {
	Start(ctx context.Context, video *entities.Video, start, end, skip int, writer io.WriteCloser) <-chan error
	Read(ctx context.Context, pr io.ReadCloser) <-chan *FrameData
}

type FFmpegCLIFrameExtractor struct {
	jpegStartMarker []byte
	jpegEndMarker   []byte
}

func NewFFmpegCLIFrameExtractor() *FFmpegCLIFrameExtractor {
	return &FFmpegCLIFrameExtractor{
		jpegStartMarker: []byte{0xFF, 0xD8},
		jpegEndMarker:   []byte{0xFF, 0xD9},
	}
}

    // calculateAdaptiveBuffer calculates an adaptive buffer time based on frame number and video characteristics
func (s *FFmpegCLIFrameExtractor) calculateAdaptiveBuffer(frameNum int, fps float64) float64 {
	// Adaptive buffer calculation:
	// - Minimum 2 seconds for basic seeking
	// - Add 10% of target time for variable frame rate tolerance
	// - Cap at maximum 10 seconds to avoid excessive seeking overhead
	
	targetSeconds := float64(frameNum) / fps
	bufferSeconds := 2.0 // Base buffer
	
	// Add percentage-based buffer for VFR tolerance
	bufferSeconds += targetSeconds * 0.1 // 10% of target time
	
	// Cap the buffer at 10 seconds maximum
	if bufferSeconds > 10.0 {
		bufferSeconds = 10.0
	}
	
	return bufferSeconds
}

type FrameData struct {
	Index int
	Data  []byte
}

func (s *FFmpegCLIFrameExtractor) Start(
	ctx context.Context,
	video *entities.Video,
	start, end, skip int,
	writer io.WriteCloser,
) <-chan error {
	logger.TracingLog(ctx).Infof("Starting frame extraction process for %q, frames requested start=%d, end=%d, "+
		"skip=%d, video fps %g...", video.FilePath, start, end, skip, video.FPS)
	done := make(chan error)
	go func() {
		_, span := telemetry.Tracer().Start(ctx, "ffmpeg-extract-frames")
		defer span.End()

		// Build frame selection string for frame-based extraction
		var frameSelections []string
		for frameIndex := start; frameIndex <= end; frameIndex += skip {
			frameSelections = append(frameSelections, fmt.Sprintf("eq(n\\,%d)", frameIndex))
		}
		selectFilter := fmt.Sprintf("select=%s", strings.Join(frameSelections, "+"))

		// Prepare input arguments with adaptive seeking for high frame numbers
		var inputArgs ffmpeg.KwArgs
		var usesSeeking bool = false
		
		// For high frame numbers (start > 100), use adaptive temporal seeking to jump close to target frames
		// This dramatically improves performance for accessing frames later in the video
		if start > 100 {
			// Calculate adaptive buffer based on frame number and video characteristics
			targetSeconds := float64(start) / video.FPS
			bufferSeconds := s.calculateAdaptiveBuffer(start, video.FPS)
			seekSeconds := targetSeconds - bufferSeconds
			
			if seekSeconds < 0 {
				seekSeconds = 0
			}
			
			inputArgs = ffmpeg.KwArgs{
				"ss": fmt.Sprintf("%.3f", seekSeconds),
				"accurate_seek": "", // Use accurate seeking for better precision
			}
			usesSeeking = true
		} else {
			// For low frame numbers, direct selection is efficient
			inputArgs = ffmpeg.KwArgs{}
		}

		// CRITICAL: Use JPEG quality factor matching OpenCV's default (95) for consistency.
		// OpenCV quality 95 ≈ FFmpeg -q:v 2. Compression artifacts from different quality settings
		// can alter pixel values and lead to inconsistent model predictions across processing paths.
		err := ffmpeg.Input(video.FilePath, inputArgs).
			Output("pipe:", ffmpeg.KwArgs{
				"vf":       selectFilter,
				"vsync":    "vfr",        // video sync for variable frame rate
				"f":        "image2pipe", // outputs to a pipe
				"c:v":      "mjpeg",
				"q:v":      "2",          // JPEG quality matching OpenCV default
				"an":       "",           // disable audio processing
			}).
			WithOutput(writer).
			Silent(true).
			Run()
		
		// Fallback strategy: if seeking failed, retry without seeking
		if err != nil && usesSeeking {
			logger.TracingLog(ctx).Warnf("Adaptive seeking failed for frames %d-%d, retrying without seeking: %v", start, end, err)
			
			// Retry without seeking
			err = ffmpeg.Input(video.FilePath).
				Output("pipe:", ffmpeg.KwArgs{
					"vf":       selectFilter,
					"vsync":    "vfr",        // video sync for variable frame rate
					"f":        "image2pipe", // outputs to a pipe
					"c:v":      "mjpeg",
					"q:v":      "2",          // JPEG quality matching OpenCV default
					"an":       "",           // disable audio processing
				}).
				WithOutput(writer).
				Silent(true).
				Run()
		}

		_ = writer.Close()
		done <- err
		close(done)
	}()
	return done
}

// Read reads frame bytes from the provided pipe reader.
// It continuously reads from the pipe and processes the data to detect complete JPEG frames.
// When a complete JPEG frame is detected, it extracts the frame bytes and sends them as a byte slice to the output channel.
// A JPEG frame is identified by the start marker (0xFFD8) and end marker (0xFFD9).
// The function ensures that each detected JPEG frame is properly formed before sending it to the output channel.
func (s *FFmpegCLIFrameExtractor) Read(ctx context.Context, pr io.ReadCloser) <-chan *FrameData {
	frameCh := make(chan *FrameData)

	go func() {
		_, span := telemetry.Tracer().Start(ctx, "ffmpeg-read-frames")
		defer span.End()

		defer func() {
			_ = pr.Close()
			close(frameCh)
		}()

		reader := bufio.NewReader(pr)
		cnt := 0
		for {
			_, err := reader.ReadBytes(s.jpegStartMarker[0])
			if err == io.EOF {
				break
			}
			if err != nil {
				logger.TracingLog(ctx).Errorf("Error reading from pipe: %s", err)
				break
			}

			var jpegBuffer bytes.Buffer
			jpegBuffer.Write([]byte{s.jpegStartMarker[0]})

			for {
				b, readErr := reader.ReadByte()
				if readErr != nil {
					logger.TracingLog(ctx).Errorf("Error reading JPEG data %s", readErr)
					break
				}
				jpegBuffer.WriteByte(b)
				if jpegBuffer.Len() >= 2 && bytes.HasSuffix(jpegBuffer.Bytes(), s.jpegEndMarker) {
					break
				}
			}
			frameCh <- &FrameData{
				Index: cnt,
				Data:  jpegBuffer.Bytes(),
			}
			cnt++
		}
		span.SetAttributes(attribute.Int("frames", cnt))
	}()

	return frameCh
}
