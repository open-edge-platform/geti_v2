# syntax=docker/dockerfile:1.7

FROM golang:1.23.11@sha256:080fb3462a60d926829ddcf0626acf0533eeeee934fea6c160d85565281ddc0a

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
