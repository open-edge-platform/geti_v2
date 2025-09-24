# syntax=docker/dockerfile:1.7

#############
# build_rest_api_specs
#############

FROM node:24.2-bookworm-slim@sha256:b30c143a092c7dced8e17ad67a8783c03234d4844ee84c39090c9780491aaf89 AS build_rest_api_specs

ARG LOCATION=/home/app/rest-api-specs/

WORKDIR ${LOCATION}

COPY --link ./package.json .
COPY --link --from=docs_context rest_api /home/app/docs/rest_api/
COPY --link --from=api_context schemas /home/app/interactive_ai/services/api/schemas/

RUN npm run build:rest-openapi-spec


#############
# web_ui_deps
#############
FROM node:24.2-bookworm-slim@sha256:b30c143a092c7dced8e17ad67a8783c03234d4844ee84c39090c9780491aaf89 AS web_ui_deps

ARG LOCATION=/home/app/web_ui/
WORKDIR ${LOCATION}

# The `GETI_VERSION` variable is send by the UI when it submits telemetry data
ARG REACT_APP_GETI_VERSION=development
ENV REACT_APP_GETI_VERSION=$REACT_APP_GETI_VERSION

COPY --link package.json ./
COPY --link package-lock.json ./
COPY --link packages/ packages/
RUN npm ci --audit=false

COPY --link ./eslint.config.js ./
COPY --link ./.prettierrc ./
COPY --link ./tsconfig.json ./
COPY --link ./rsbuild.config.ts ./
COPY --link ./dev-proxy.ts ./

COPY --link src/ src/
COPY --link public/ public/

COPY --from=docs_context rest_api /home/app/docs/rest_api/
COPY --from=api_context schemas /home/app/interactive_ai/services/api/schemas/

RUN npm run build

#######
# web_ui
#######

FROM nginx:1.29-bookworm@sha256:d5f28ef21aabddd098f3dbc21fe5b7a7d7a184720bc07da0b6c9b9820e97f25e AS web_ui

COPY --link --from=web_ui_deps /home/app/web_ui/build/app/ /usr/share/nginx/webui/
COPY --link --from=web_ui_deps /home/app/web_ui/build/admin/ /usr/share/nginx/admin-app/
RUN useradd -u 10001 webservice
COPY --link nginx.conf /etc/nginx/nginx.conf
COPY --link src/maintenance /maintenance
COPY --link --from=build_rest_api_specs /home/app/rest-api-specs/public/openapi-spec.json /usr/share/nginx/webui/openapi-spec.json

USER webservice
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
