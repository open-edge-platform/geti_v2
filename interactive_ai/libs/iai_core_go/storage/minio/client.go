// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package minio

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/caarlos0/env/v11"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"geti.com/iai_core/logger"
)

const (
	healthcheckIntervalSeconds = 1
	local                      = "local"
	aws                        = "aws"
)

type CommonConfig struct {
	CacheTTL int `env:"S3_CLIENT_CACHE_TTL" envDefault:"3600"`
}

type onPremConfig struct {
	CommonConfig

	Endpoint    string `env:"S3_HOST,notEmpty"`
	AccessKeyID string `env:"S3_ACCESS_KEY,notEmpty"`
	SecretKey   string `env:"S3_SECRET_KEY,notEmpty"`
}

type awsConfig struct {
	CommonConfig

	Region            string `env:"AWS_REGION,notEmpty"`
	IdentityTokenFile string `env:"AWS_WEB_IDENTITY_TOKEN_FILE,notEmpty"`
	Role              string `env:"AWS_ROLE_ARN,notEmpty"`
}

type clientCacheEntry struct {
	client    *minio.Client
	expiresAt time.Time
	hcCancel  context.CancelFunc
	timer     *time.Timer
}

func (e *clientCacheEntry) isExpired() bool {
	return time.Now().After(e.expiresAt)
}

func (e *clientCacheEntry) cleanup() {
	if e.hcCancel != nil {
		e.hcCancel()
	}
	if e.timer != nil {
		e.timer.Stop()
	}
}

type ClientManager struct {
	mu         sync.RWMutex
	cacheEntry *clientCacheEntry
	closeOnce  sync.Once

	// Static config
	onPremCfg *onPremConfig
	awsCfg    *awsConfig
	provider  string
}

func NewClientManager() (*ClientManager, error) {
	provider := os.Getenv("S3_CREDENTIALS_PROVIDER")

	cm := &ClientManager{
		provider: provider,
	}

	switch provider {
	case local:
		cfg := &onPremConfig{}
		if err := env.Parse(cfg); err != nil {
			return nil, fmt.Errorf("failed to parse on-prem config: %w", err)
		}
		cm.onPremCfg = cfg
	case aws:
		cfg := &awsConfig{}
		if err := env.Parse(cfg); err != nil {
			return nil, fmt.Errorf("failed to parse AWS config: %w", err)
		}
		cm.awsCfg = cfg
	default:
		return nil, fmt.Errorf("invalid S3_CREDENTIALS_PROVIDER: %s", provider)
	}
	return cm, nil
}

func (cm *ClientManager) Close() {
	cm.closeOnce.Do(func() {
		cm.reset()
	})
}

func (cm *ClientManager) reset() {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	if cm.cacheEntry != nil {
		cm.cacheEntry.cleanup()
		cm.cacheEntry = nil
	}
}

func (cm *ClientManager) GetClient(ctx context.Context) (*minio.Client, error) {
	cm.mu.RLock()
	entry := cm.cacheEntry
	cm.mu.RUnlock()

	if entry != nil && !entry.isExpired() {
		return entry.client, nil
	}
	return cm.createNewClient(ctx)
}

func (cm *ClientManager) createNewClient(ctx context.Context) (*minio.Client, error) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if cm.cacheEntry != nil && !cm.cacheEntry.isExpired() {
		return cm.cacheEntry.client, nil
	}

	var (
		client   *minio.Client
		ttl      int
		err      error
		hcCancel context.CancelFunc
	)

	switch cm.provider {
	case local:
		logger.TracingLog(ctx).Infof("Initializing on-prem minio client.")
		client, ttl, err = newOnPremMinioClient(cm.onPremCfg)
	case aws:
		logger.TracingLog(ctx).Infof("Initializing saas minio client.")
		client, ttl, err = newAWSMinioClient(cm.awsCfg)
	}
	if err != nil {
		return nil, err
	}

	hcCancel, healthErr := client.HealthCheck(healthcheckIntervalSeconds * time.Second)
	if healthErr != nil {
		return nil, fmt.Errorf("failed to start health check: %w", healthErr)
	}

	expiresAt := time.Now().Add(time.Duration(ttl) * time.Second)
	timer := time.AfterFunc(time.Duration(ttl)*time.Second, func() {
		logger.TracingLog(ctx).Infof("S3 client expired. Resetting...")
		cm.reset()
	})

	cm.cacheEntry = &clientCacheEntry{
		client:    client,
		expiresAt: expiresAt,
		hcCancel:  hcCancel,
		timer:     timer,
	}

	logger.TracingLog(ctx).Infof("S3 client created. Expires at: %v", expiresAt)
	return client, nil
}

func newOnPremMinioClient(cfg *onPremConfig) (*minio.Client, int, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("on-prem client creation failed: %w", err)
	}
	return client, cfg.CacheTTL, nil
}

func newAWSMinioClient(cfg *awsConfig) (*minio.Client, int, error) {
	creds, err := credentials.NewIAM("").Get()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to retrieve AWS creds: %w", err)
	}

	client, err := minio.New("s3.amazonaws.com", &minio.Options{
		Creds:  credentials.NewStaticV4(creds.AccessKeyID, creds.SecretAccessKey, creds.SessionToken),
		Secure: true,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("AWS client creation failed: %w", err)
	}
	return client, cfg.CacheTTL, nil
}
