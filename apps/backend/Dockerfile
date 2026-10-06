# Production image for the API (Railway, Fly.io, AWS ECS/App Runner, etc.).
# Build from the REPO ROOT so workspace packages are available:
#   docker build -f apps/backend/Dockerfile -t ember-oak-api .
FROM node:22-alpine AS build
WORKDIR /repo
RUN npm i -g pnpm@12
COPY . .
RUN pnpm install --frozen-lockfile --filter backend...
RUN pnpm --filter backend build
# Self-contained production node_modules for the backend only.
RUN pnpm --filter backend deploy --prod --legacy /out

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5000
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /repo/apps/backend/dist ./dist
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "dist/server.js"]
