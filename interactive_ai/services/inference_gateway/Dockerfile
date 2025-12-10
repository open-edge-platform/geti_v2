# syntax=docker/dockerfile:1.7

# Builder image
FROM golang:1.24.11@sha256:e3fb71a958a346439626e5796d79749c7ed22e61f09f078f434486015285f432 AS build

WORKDIR /build/interactive_ai/service

COPY --link --from=iai_core . ../../libs/iai_core_go
COPY --link --from=modelmesh . ../../../libs/grpc_interfaces/src/grpc_interfaces/model_mesh/go/pb
COPY --link --from=modelregistration . ../../../libs/grpc_interfaces/src/grpc_interfaces/model_registration/go/pb
COPY --link --from=predict . ../../../libs/grpc_interfaces/src/grpc_interfaces/predict/go/pb

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    go mod download -x

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=main.go,target=main.go \
    --mount=type=bind,source=app,target=app \
	CGO_ENABLED=0 go build -trimpath -mod=readonly -gcflags="all=-spectre=all" -asmflags="all=-spectre=all" -ldflags="all=-s -w" -a -o inference_gateway . 

    # Save Go third party package licenses
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=main.go,target=main.go \
    --mount=type=bind,source=app,target=app \
    go install github.com/google/go-licenses@v1.0.0 && \
    go-licenses save . --save_path /THIRD_PARTY_NOTICES || true

# Production image
FROM debian:bookworm-slim@sha256:b4aa902587c2e61ce789849cb54c332b0400fe27b1ee33af4669e1f7e7c3e22f AS runtime

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg=7:5.1.*-0+deb12u1 && \
    rm -rf /var/lib/apt/lists/*

COPY --link --from=build /build/interactive_ai/service/inference_gateway .
COPY --from=build /THIRD_PARTY_NOTICES /THIRD_PARTY_NOTICES

RUN useradd -l -u 10001 non-root
USER non-root

ENV GIN_MODE=release
ENV INFERENCE_GATEWAY_PORT=7000
EXPOSE $INFERENCE_GATEWAY_PORT

ENTRYPOINT ["./inference_gateway"]
