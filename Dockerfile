# One container: the built app and the API on the same origin.
#
# The frontend only ever calls /api/* relative paths, so serving both from one
# process means there is no CORS surface, no second deployment to keep in step,
# and the metadata URLs written on chain always point at the origin that serves
# them.

FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/sdk/package.json packages/sdk/
RUN npm ci --no-audit --no-fund

COPY . .
# The launchpad address is compiled into the bundle, so it is a build argument
# rather than a runtime env var.
ARG VITE_LAUNCHPAD=""
ENV VITE_LAUNCHPAD=$VITE_LAUNCHPAD
RUN npm run build --workspace @clink/web

FROM node:22-alpine AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --no-audit --no-fund --workspace @clink/api --include-workspace-root

COPY apps/api/src ./apps/api/src
COPY --from=build /src/apps/web/dist ./web

RUN addgroup -S clink && adduser -S clink -G clink \
	&& mkdir -p /data && chown -R clink:clink /data /app
USER clink

ENV NODE_ENV=production \
	PORT=8080 \
	CLINK_DATA_DIR=/data \
	CLINK_WEB_DIR=/app/web

EXPOSE 8080
CMD ["node", "apps/api/src/server.js"]
