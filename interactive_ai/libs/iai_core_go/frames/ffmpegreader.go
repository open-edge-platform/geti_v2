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

// ReadFrameToBuffer Reads a frame from a video into memory.
func (s FramerReaderImpl) ReadFrameToBuffer(path string, frameNum int) (*bytes.Buffer, error) {
	buf := bytes.NewBuffer(nil)
	err := ffmpeg.Input(path).
		Filter("select", ffmpeg.Args{fmt.Sprintf("eq(n,%d)", frameNum)}).
		Output("pipe:", ffmpeg.KwArgs{"vframes": 1, "format": "image2", "vcodec": "mjpeg"}).
		WithOutput(buf).
		Run()
	if err != nil {
		return nil, err
	}
	return buf, nil
}

// ReadFrameToBufferFps Reads a frame from a video into memory using frame-based selection.
// The fps parameter is kept for backward compatibility but is no longer used for time-based seeking.
// Frame selection is now purely index-based for consistency.
func (s FramerReaderImpl) ReadFrameToBufferFps(path string, frameNum int, fps float64) (*bytes.Buffer, error) {
	// Use frame-based selection instead of time-based seeking for consistency
	return s.ReadFrameToBuffer(path, frameNum)
}
