// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package request_processor

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestLoadAuthProxyConfiguration(t *testing.T) {
	if err := os.Setenv("ISS_INTERNAL", "internal_issuer"); err != nil {
		t.Fatalf("Failed to set environment variable ISS_INTERNAL: %v", err)
	}
	if err := os.Setenv("AUD_INTERNAL", "internal_audience"); err != nil {
		t.Fatalf("Failed to set environment variable AUD_INTERNAL: %v", err)
	}
	if err := os.Setenv("ISS_EXTERNAL", "external_issuer"); err != nil {
		t.Fatalf("Failed to set environment variable ISS_EXTERNAL: %v", err)
	}
	if err := os.Setenv("AUD_EXTERNAL", "external_audience"); err != nil {
		t.Fatalf("Failed to set environment variable AUD_EXTERNAL: %v", err)
	}
	if err := os.Setenv("REQUIRED_ROLES", "role1,role2"); err != nil {
		t.Fatalf("Failed to set environment variable REQUIRED_ROLES: %v", err)
	}

	config, err := LoadAuthProxyConfiguration()
	assert.NoError(t, err)
	assert.NotNil(t, config)
	assert.Equal(t, "internal_issuer", config.IssInternal)
	assert.Equal(t, "internal_audience", config.AudInternal)
	assert.Equal(t, "external_issuer", config.IssExternal)
	assert.Equal(t, "external_audience", config.AudExternal)
	assert.Equal(t, []string{"role1", "role2"}, config.RequiredRoles)
}

func TestGetJwtTtlGeti(t *testing.T) {
	if err := os.Setenv("JWT_TTL_GETI", "30m"); err != nil {
		t.Fatalf("Failed to set environment variable JWT_TTL_GETI: %v", err)
	}
	duration, err := GetJwtTtlGeti()
	assert.NoError(t, err)
	assert.Equal(t, 30*time.Minute, duration)
}

func TestGetCacheTtl(t *testing.T) {
	if err := os.Setenv("CACHE_TTL_SECONDS", "120"); err != nil {
		t.Fatalf("Failed to set environment variable CACHE_TTL_SECONDS: %v", err)
	}
	ttl, err := GetCacheTtl()
	assert.NoError(t, err)
	assert.Equal(t, 120, ttl)
}

func TestGetCacheSizeMB(t *testing.T) {
	if err := os.Setenv("CACHE_SIZE_MB", "20"); err != nil {
		t.Fatalf("Failed to set environment variable CACHE_SIZE_MB: %v", err)
	}
	size, err := GetCacheSizeMB()
	assert.NoError(t, err)
	assert.Equal(t, 20, size)
}

func TestGetUnauthorizedURLs(t *testing.T) {
	if err := os.Setenv("UNAUTHORIZED_URLS", "/api/v1/test1,/api/v1/test2"); err != nil {
		t.Fatalf("Failed to set environment variable UNAUTHORIZED_URLS: %v", err)
	}
	urls := GetUnauthorizedURLs()
	assert.Equal(t, []string{"/api/v1/test1", "/api/v1/test2"}, urls)
}
