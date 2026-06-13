# syntax=docker/dockerfile:1.7

FROM golang:1.24.13@sha256:d2d2bc1c84f7e60d7d2438a3836ae7d0c847f4888464e7ec9ba3a1339a1ee804

RUN apt update \
    && apt --no-install-recommends -y install \
        build-essential=12.* \
        git=1:2.47.* \
    && apt clean all \
    && rm -rf /var/cache/apt/*

ENV GOPATH="/go"
ENV PATH=$PATH:/usr/local/go/bin

RUN useradd -l -m -u 1001 builder \
    && mkdir -p /go/bin /go/src /go/pkg \
    && chown -R builder:builder /go \
    && chmod -R 755 /go

WORKDIR /app
USER builder
