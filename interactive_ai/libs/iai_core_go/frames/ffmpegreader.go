// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package frames

import (
	"bytes"
	"fmt"

	ffmpeg "github.com/u2takey/ffmpeg-go"
)


// FrameReader provides methods to read a single frame.
type FrameReader interface {
	ReadFrameToBuffer(path string, frameNum int) (*bytes.Buffer, error)
	ReadFrameToBufferFps(path string, frameNum int, fps float64) (*bytes.Buffer, error)
}

type FramerReaderImpl struct {
}

// getCommonOutputArgs returns common FFmpeg output arguments for frame extraction
func getCommonOutputArgs() ffmpeg.KwArgs {
	return ffmpeg.KwArgs{
		"vframes": 1,
		"format":  "image2",
		"vcodec":  "mjpeg",
		"q:v":     "2",    // High quality JPEG (matching Python's approach)
		"an":      "",     // Disable audio processing
		"threads": "1",    // Single thread for consistency
		"avoid_negative_ts": "make_zero", // Handle timestamp issues
	}
}


// calculateAdaptiveBuffer calculates an adaptive buffer time based on frame number and video characteristics
func (s FramerReaderImpl) calculateAdaptiveBuffer(frameNum int, fps float64) float64 {
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

// ReadFrameToBuffer Reads a frame from a video into memory without seeking optimization.
// This method provides the basic fallback functionality when FPS is not available.
func (s FramerReaderImpl) ReadFrameToBuffer(path string, frameNum int) (*bytes.Buffer, error) {
	buf := bytes.NewBuffer(make([]byte, 0, 1024*1024)) // 1MB initial capacity
	
	err := ffmpeg.Input(path).
		Filter("select", ffmpeg.Args{fmt.Sprintf("eq(n,%d)", frameNum)}).
		Output("pipe:", getCommonOutputArgs()).
		WithOutput(buf).
		Silent(true).
		Run()
	
	return buf, err
}

// ReadFrameToBufferFps Reads a frame from a video into memory with adaptive seeking optimization using the provided fps.
// This method uses the passed fps parameter for seeking optimization and falls back to ReadFrameToBuffer on failure.
func (s FramerReaderImpl) ReadFrameToBufferFps(path string, frameNum int, fps float64) (*bytes.Buffer, error) {
	// If fps is invalid or frameNum is low, use basic frame extraction
	if fps <= 0 || frameNum <= 100 {
		return s.ReadFrameToBuffer(path, frameNum)
	}
	
	// Pre-allocate buffer with reasonable capacity
	buf := bytes.NewBuffer(make([]byte, 0, 1024*1024)) // 1MB initial capacity
	
	// Calculate adaptive buffer based on frame number and video characteristics
	targetSeconds := float64(frameNum) / fps
	bufferSeconds := s.calculateAdaptiveBuffer(frameNum, fps)
	seekSeconds := targetSeconds - bufferSeconds
	
	if seekSeconds < 0 {
		seekSeconds = 0
	}
	
	inputArgs := ffmpeg.KwArgs{
		"ss": fmt.Sprintf("%.3f", seekSeconds),
		"accurate_seek": "", // Use accurate seeking for better precision
	}
	
	// Optimized FFmpeg parameters for performance
	err := ffmpeg.Input(path, inputArgs).
		Filter("select", ffmpeg.Args{fmt.Sprintf("eq(n,%d)", frameNum)}).
		Output("pipe:", getCommonOutputArgs()).
		WithOutput(buf).
		Silent(true). // Reduce FFmpeg output
		Run()
	
	// Fallback strategy: check if buffer is empty (could indicate seeking overshot), retry with ReadFrameToBuffer
	if err != nil || buf.Len() == 0 {
		return s.ReadFrameToBuffer(path, frameNum)
	}
	
	return buf, nil
}
