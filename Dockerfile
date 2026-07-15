# Base image ships Chromium + all system deps, matching the installed playwright version.
FROM mcr.microsoft.com/playwright:v1.61.1-jammy

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies (dev deps needed for the build).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Build the app.
COPY . .
RUN npm run build

# Runtime configuration.
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Trust the reverse proxy (Coolify) for Auth.js host/callback resolution.
ENV AUTH_TRUST_HOST=true
# Render diplomas against the container itself (no external round-trip).
ENV PDF_RENDER_BASE_URL=http://127.0.0.1:3000

RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
