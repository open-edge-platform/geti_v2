# syntax=docker/dockerfile:1.7

FROM golang:1.24.10@sha256:7b13449f08287fdb53114d65bdf20eb3965e4e54997903b5cb9477df0ea37c12

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
