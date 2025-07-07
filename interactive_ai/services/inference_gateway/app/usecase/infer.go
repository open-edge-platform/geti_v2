// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package usecase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"

	sdkentities "geti.com/iai_core/entities"
	"geti.com/iai_core/frames"
	"geti.com/iai_core/logger"
	"geti.com/iai_core/storage"
	"geti.com/iai_core/telemetry"
	"golang.org/x/sync/errgroup"

	"inference_gateway/app/entities"
	"inference_gateway/app/service"
)

const MaxConcurrentInferenceRequests = 100

type Infer interface {
	One(ctx context.Context, request *entities.PredictionRequestData, includeXAI bool) (string, error)
	Batch(ctx context.Context, request *entities.BatchPredictionRequestData, includeXAI bool) ([][]byte, error)
}

type InferImpl struct {
	modelAccess    service.ModelAccessService
	videoRepo      storage.VideoRepository
	frameExtractor frames.CLIFrameExtractor
	semaCh         chan struct{}
}

func NewInferImpl(
	modelAccess service.ModelAccessService,
	videoRepo storage.VideoRepository,
	frameExtractor frames.CLIFrameExtractor,
) *InferImpl {
	return &InferImpl{
		modelAccess:    modelAccess,
		videoRepo:      videoRepo,
		frameExtractor: frameExtractor,
		semaCh:         make(chan struct{}, MaxConcurrentInferenceRequests),
	}
}

func (uc *InferImpl) One(
	ctx context.Context,
	request *entities.PredictionRequestData,
	includeXAI bool,
) (string, error) {
	replacer := strings.NewReplacer("\n", "", "\r", "")
	modelName := replacer.Replace(request.ProjectID.String()) + "-" + replacer.Replace(request.ModelID.String())

	inferParams := service.NewInferParameters(
		request.Media,
		modelName,
		includeXAI,
		request.Roi,
		request.LabelOnly,
		request.HyperParameters,
	)
	response, err := uc.modelAccess.InferImageBytes(ctx, *inferParams)
	if errors.Is(err, service.ErrModelNotFound) {
		logger.TracingLog(ctx).Infof("`Model not found` error encountered, attempting to recover model `%s`", modelName)
		response, err = uc.modelAccess.TryRecoverModel(ctx, *inferParams)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}
	return response.GetParameters()["predictions"].GetStringParam(), nil
}

func (uc *InferImpl) Batch(
	ctx context.Context,
	request *entities.BatchPredictionRequestData,
	includeXAI bool,
) ([][]byte, error) {
	fullVideoID := sdkentities.NewFullVideoID(request.OrganizationID.String(),
		request.WorkspaceID.String(), request.ProjectID.String(),
		request.MediaInfo.DatasetID.String(), request.MediaInfo.VideoID.String())
	video, err := uc.videoRepo.LoadVideoByID(ctx, fullVideoID)
	if err != nil {
		return nil, err
	}

	c, span := telemetry.Tracer().Start(ctx, "inference-loop")
	defer span.End()
	totalRequests := (request.EndFrame-request.StartFrame)/request.FrameSkip + 1
	inferResults := make([][]byte, totalRequests)
	pr, pw := io.Pipe()
	doneCh := uc.frameExtractor.Start(c, video, request.StartFrame, request.EndFrame, request.FrameSkip, pw)
	g, gCtx := errgroup.WithContext(c)

	for frame := range uc.frameExtractor.Read(c, pr) {
		g.Go(func() error {
			select {
			case uc.semaCh <- struct{}{}:
				defer func() { <-uc.semaCh }()
			case <-gCtx.Done():
				return gCtx.Err()
			}

			req := request.ToSingleRequest()
			req.MediaInfo.FrameIndex = request.StartFrame + frame.Index*request.FrameSkip
			req.Media = bytes.NewBuffer(frame.Data)
			result, inferErr := uc.One(gCtx, req, includeXAI)
			if inferErr != nil {
				return inferErr
			}

			var (
				jsonData []byte
				reqErr   error
			)
			if includeXAI {
				jsonData, reqErr = req.ToExplainBytes(result)
			} else {
				jsonData, reqErr = req.ToPredictBytes(result)
			}
			if reqErr != nil {
				return fmt.Errorf("failed to construct JSON response from prediction string: %w", reqErr)
			}
			inferResults[frame.Index] = jsonData
			return nil
		})
	}

	err = <-doneCh
	if err != nil {
		telemetry.RecordError(span, err)
		return nil, fmt.Errorf("error during frame extraction process: %w", err)
	}
	if err = g.Wait(); err != nil {
		telemetry.RecordError(span, err)
		return nil, fmt.Errorf("error during one of the inference requests: %w", err)
	}

	return inferResults, nil
}
