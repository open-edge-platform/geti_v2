# syntax=docker/dockerfile:1.7

# Builder image
FROM golang:1.24.10@sha256:7b13449f08287fdb53114d65bdf20eb3965e4e54997903b5cb9477df0ea37c12 AS build

WORKDIR /build/control_plane/auth_proxy

COPY --link --from=account_service_client . ../../../libs/grpc_interfaces/src/grpc_interfaces/account_service/go

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    go mod download -x

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=main.go,target=main.go \
    --mount=type=bind,source=app,target=app \
	CGO_ENABLED=0 go build -trimpath -mod=readonly -gcflags="all=-spectre=all" -asmflags="all=-spectre=all" -ldflags="all=-s -w" -a -o auth_proxy .

# Save Go third party package licenses
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=main.go,target=main.go \
    --mount=type=bind,source=app,target=app \
    go install github.com/google/go-licenses@v1.0.0 && \
    go-licenses save . --save_path /THIRD_PARTY_NOTICES || true

# Production image
FROM gcr.io/distroless/static-debian12:nonroot@sha256:a9329520abc449e3b14d5bc3a6ffae065bdde0f02667fa10880c49b35c109fd1 AS runtime

COPY --link --from=build /build/control_plane/auth_proxy/auth_proxy .
COPY --from=build /THIRD_PARTY_NOTICES /THIRD_PARTY_NOTICES

USER nonroot

ENV GRPC_SERVER_PORT=7001
EXPOSE $GRPC_SERVER_PORT

ENV HTTP_SERVER_PORT=7002
EXPOSE $HTTP_SERVER_PORT

ENTRYPOINT ["./auth_proxy"]
