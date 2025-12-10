# syntax=docker/dockerfile:1.7

# Builder image
FROM golang:1.24.11@sha256:e3fb71a958a346439626e5796d79749c7ed22e61f09f078f434486015285f432 AS build

WORKDIR /build/interactive_ai/service

COPY --link --from=iai_core . ../../libs/iai_core_go

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    go mod download -x

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=main.go,target=main.go \
    --mount=type=bind,source=app,target=app \
	CGO_ENABLED=0 go build -trimpath -mod=readonly -gcflags="all=-spectre=all" -asmflags="all=-spectre=all" -ldflags="all=-s -w" -a -o media_ms .

# Save Go third party package licenses
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=main.go,target=main.go \
    --mount=type=bind,source=app,target=app \
    go install github.com/google/go-licenses@v1.0.0 && \
    go-licenses save . --save_path /THIRD_PARTY_NOTICES || true

# Production image
FROM gcr.io/distroless/static-debian12:nonroot@sha256:e8a4044e0b4ae4257efa45fc026c0bc30ad320d43bd4c1a7d5271bd241e386d0 AS runtime

COPY --link --from=build /build/interactive_ai/service/media_ms .
COPY --from=build /THIRD_PARTY_NOTICES /THIRD_PARTY_NOTICES

USER nonroot

ENV GIN_MODE=release
ENV PORT=5002
EXPOSE $PORT

ENTRYPOINT ["./media_ms"]
