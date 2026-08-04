# syntax=docker/dockerfile:1.7

FROM golang:1.25.11@sha256:f188e8c16ea47a8b22d2bdcf6d9bcd07b63ea7876c199749c07bf31e0ab33bad

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
