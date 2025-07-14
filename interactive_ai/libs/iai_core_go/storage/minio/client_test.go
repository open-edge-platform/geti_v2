// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

//go:build integration

package minio

import (
	"context"
	"os"
	"runtime"
	"testing"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMinio(t *testing.T) {
	ctx := context.Background()
	_ = os.Setenv("S3_CLIENT_CACHE_TTL", "1")
	manager, err := NewClientManager()
	require.NoError(t, err)
	defer manager.Close()

	tests := []struct {
		name   string
		bucket string
		action func(*testing.T) (*minio.Client, error)
	}{
		{
			name:   "GetClient",
			bucket: "get-bucket",
			action: func(_ *testing.T) (*minio.Client, error) {
				return manager.GetClient(ctx)
			},
		},
		{
			name:   "ResetClient",
			bucket: "reset-bucket",
			action: func(t *testing.T) (*minio.Client, error) {
				numGoroutines := runtime.NumGoroutine()
				_, err := manager.GetClient(ctx)
				assert.Equal(t, numGoroutines, runtime.NumGoroutine())
				require.NoError(t, err)

				// Expire TTL
				time.Sleep(1500 * time.Millisecond)

				// Trigger refresh
				client, err := manager.GetClient(ctx)
				// Old goroutines might be not cleaned up immediately, using Delta assertion
				assert.InDelta(t, numGoroutines, runtime.NumGoroutine(), 2)
				return client, err
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := tt.action(t)
			require.NoError(t, err)
			err = client.MakeBucket(ctx, tt.bucket, minio.MakeBucketOptions{})
			require.NoError(t, err)
			exists, err := client.BucketExists(ctx, tt.bucket)
			require.NoError(t, err)

			assert.True(t, exists, "Bucket %s doesn't exist", tt.bucket)
		})
	}
}
