# syntax=docker/dockerfile:1.7

FROM golang:1.24.11@sha256:e3fb71a958a346439626e5796d79749c7ed22e61f09f078f434486015285f432

RUN apt update \
    && apt --no-install-recommends -y install \
        build-essential=12.* \
        git=1:2.39.* \
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
