# syntax=docker/dockerfile:1.7

# Builder image
FROM golang:1.24.10@sha256:7b13449f08287fdb53114d65bdf20eb3965e4e54997903b5cb9477df0ea37c12 AS build

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
FROM debian:bookworm-slim@sha256:e899040a73d36e2b36fa33216943539d9957cba8172b858097c2cabcdb20a3e2 AS runtime

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
