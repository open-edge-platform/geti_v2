# syntax=docker/dockerfile:1.7

FROM golang:1.25.11@sha256:00feed335fe561979f2cdcc30a5191231977c5631fe79c40f7d3ab63b4fa222f

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
