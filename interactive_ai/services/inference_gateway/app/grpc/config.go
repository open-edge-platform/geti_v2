// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package grpc

import (
	"fmt"
	"time"

	"github.com/caarlos0/env/v11"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/retry"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

const (
	retryBackoffDurationMs = 200
	maxRetryAttempts       = 5
	keepAliveTimeSec       = 10
)

type grpcConfig struct {
	// Timeout specifies the maximum duration (in seconds) to wait for a gRPC call to complete.
	Timeout int `env:"INFERENCE_TIMEOUT" envDefault:"10"`
}

func NewGRPCClient(address string) (*grpc.ClientConn, error) {
	cfg := grpcConfig{}
	if err := env.Parse(&cfg); err != nil {
		return nil, fmt.Errorf("failed to parse gRPC config: %w", err)
	}

	keepAlive := keepalive.ClientParameters{
		Time:                keepAliveTimeSec * time.Second,
		Timeout:             time.Second,
		PermitWithoutStream: true,
	}

	retryOpts := []retry.CallOption{
		retry.WithMax(maxRetryAttempts),
		retry.WithBackoff(retry.BackoffExponential(retryBackoffDurationMs * time.Millisecond)),
		retry.WithCodes(codes.Unavailable, codes.DeadlineExceeded),
	}

	serviceCfg := `{
		"methodConfig": [{
			"name": [{}],
			"timeout": "%ds"
		}]
	}`

	return grpc.NewClient(
		address,
		grpc.WithUnaryInterceptor(retry.UnaryClientInterceptor(retryOpts...)),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultServiceConfig(fmt.Sprintf(serviceCfg, cfg.Timeout)),
		grpc.WithKeepaliveParams(keepAlive),
	)
}
