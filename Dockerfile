# ---- Base ----
FROM node:20-slim AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- Deps (only prod deps into final) ----
FROM base AS deps
# Install OS deps Prisma/Next may need
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Build (generates Prisma client + Next build) ----
FROM base AS build
# Need dev deps for TypeScript/Vite/Webpack etc. during build
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Ensure production Prisma client is generated before building Next
# build script already runs "db:generate:prod && next build"
ENV NODE_ENV=production
RUN npm run build

# ---- Runner (small image, non-root) ----
FROM node:20-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
WORKDIR /app
RUN groupadd -r nextjs && useradd -r -g nextjs nextjs

# Copy only the minimal artifacts to run the app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

# Prisma runtime needs the generated client already in node_modules
# Add a tiny entrypoint to run migrations against Neon before start
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
USER nextjs
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start"]
