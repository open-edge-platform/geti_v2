// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package usecase

import (
	"context"
	"fmt"
	"testing"

	sdkentities "geti.com/iai_core/entities"
	"geti.com/iai_core/frames"
	"geti.com/iai_core/storage"
	pb "geti.com/predict"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"inference_gateway/app/entities"
	"inference_gateway/app/service"
)

func MockDoneCh() <-chan error {
	done := make(chan error)
	go func() {
		done <- nil
		close(done)
	}()
	return done
}

func MockFrameCh(total int) <-chan *frames.FrameData {
	frameCh := make(chan *frames.FrameData)
	go func() {
		for i := range total {
			frameCh <- &frames.FrameData{
				Index: i,
				Data:  []byte("test"),
			}
		}
		close(frameCh)
	}()
	return frameCh
}

func TestInferBatch(t *testing.T) {
	ctx := context.Background()
	fullVideoID := sdkentities.GetFullVideoID(t)
	start, end, skip := 0, 199, 10
	total := (end-start)/skip + 1
	video := &sdkentities.Video{FilePath: "video_path", FPS: 25}
	// Prepare test variables
	mediaInfo := entities.MediaInfo{
		VideoID:   fullVideoID.VideoID,
		DatasetID: fullVideoID.DatasetID,
	}
	hyperParams := "{'confidence_treshold':0.35}"
	batchRequest := entities.BatchPredictionRequestData{
		OrganizationID:  fullVideoID.OrganizationID,
		WorkspaceID:     fullVideoID.WorkspaceID,
		ProjectID:       fullVideoID.ProjectID,
		ModelID:         sdkentities.ID{ID: "000000000000000000000003"},
		MediaInfo:       &mediaInfo,
		StartFrame:      start,
		EndFrame:        end,
		FrameSkip:       skip,
		HyperParameters: &hyperParams,
	}

	mockModelAccess := service.NewMockModelAccessService(t)
	mockVideoRepo := storage.NewMockVideoRepository(t)
	mockFrameExtractor := frames.NewMockCLIFrameExtractor(t)

	tests := []struct {
		name            string
		setupMocks      func()
		actionAndAssert func(t *testing.T)
	}{
		{
			name: "Explain",
			setupMocks: func() {
				mockVideoRepo.EXPECT().
					LoadVideoByID(ctx, fullVideoID).
					Return(video, nil).
					Once()

				mockFrameExtractor.EXPECT().
					Start(mock.AnythingOfType("*context.valueCtx"), video, start, end, skip, mock.AnythingOfType("*io.PipeWriter")).
					Return(MockDoneCh())
				mockFrameExtractor.EXPECT().
					Read(mock.AnythingOfType("*context.valueCtx"), mock.AnythingOfType("*io.PipeReader")).
					Return(MockFrameCh(total))

				respParams := map[string]*pb.InferParameter{"predictions": {
					ParameterChoice: &pb.InferParameter_StringParam{StringParam: `{"score": 0.7}`}}}
				inferResp := &pb.ModelInferResponse{Parameters: respParams}
				mockModelAccess.EXPECT().
					InferImageBytes(mock.AnythingOfType("*context.cancelCtx"), mock.AnythingOfType("InferParameters")).
					Return(inferResp, nil).
					Times(total)
			},
			actionAndAssert: func(t *testing.T) {
				infer := NewInferImpl(mockModelAccess, mockVideoRepo, mockFrameExtractor)
				result, err := infer.Batch(ctx, &batchRequest, true)
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Len(t, result, total)
				for i, item := range result {
					assert.NotNil(t, item)
					assert.Contains(t, string(item), "maps")
					assert.Contains(t, string(item), fmt.Sprintf("\"frame_index\":%d", i*skip))
				}
			},
		},
		{
			name: "Predict",
			setupMocks: func() {
				mockVideoRepo.EXPECT().
					LoadVideoByID(ctx, fullVideoID).
					Return(video, nil).
					Once()

				mockFrameExtractor.EXPECT().
					Start(mock.AnythingOfType("*context.valueCtx"), video, start, end, skip, mock.AnythingOfType("*io.PipeWriter")).
					Return(MockDoneCh())
				mockFrameExtractor.EXPECT().
					Read(mock.AnythingOfType("*context.valueCtx"), mock.AnythingOfType("*io.PipeReader")).
					Return(MockFrameCh(total))

				respParams := map[string]*pb.InferParameter{"predictions": {
					ParameterChoice: &pb.InferParameter_StringParam{StringParam: `{"score": 0.7}`}}}
				inferResp := &pb.ModelInferResponse{Parameters: respParams}
				mockModelAccess.EXPECT().
					InferImageBytes(mock.AnythingOfType("*context.cancelCtx"), mock.AnythingOfType("InferParameters")).
					Return(inferResp, nil).
					Times(total)
			},
			actionAndAssert: func(t *testing.T) {
				infer := NewInferImpl(mockModelAccess, mockVideoRepo, mockFrameExtractor)
				result, err := infer.Batch(ctx, &batchRequest, false)
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Len(t, result, total)
				for i, item := range result {
					assert.NotNil(t, item)
					assert.Contains(t, string(item), "predictions")
					assert.Contains(t, string(item), fmt.Sprintf("\"frame_index\":%d", start+i*skip))
				}
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMocks()
			tt.actionAndAssert(t)

			mockVideoRepo.ExpectedCalls = nil
			mockModelAccess.ExpectedCalls = nil
			mockFrameExtractor.ExpectedCalls = nil
		})
	}
}
