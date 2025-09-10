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

const MsPerSecond = 1000

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

		// Use frame-based seeking without time-based conversions
		inputFlags := ffmpeg.KwArgs{}

		// CRITICAL: Use JPEG quality factor matching OpenCV's default (95) for consistency.
		// OpenCV quality 95 ≈ FFmpeg -q:v 2. Compression artifacts from different quality settings
		// can alter pixel values and lead to inconsistent model predictions across processing paths.
		outputFlags := ffmpeg.KwArgs{
			"vf":       selectFilter,
			"vsync":    "vfr",        // video sync for variable frame rate
			"f":        "image2pipe", // outputs to a pipe
			"c:v":      "mjpeg",
			"q:v":      "2",          // JPEG quality matching OpenCV default
			"an":       "",           // disable audio processing
		}

		// -format=image2pipe since it outputs frame bytes into pipe writer passed in params
		err := ffmpeg.Input(video.FilePath, inputFlags).
			Output("pipe:", outputFlags).
			WithOutput(writer).
			Silent(true).
			Run()

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
