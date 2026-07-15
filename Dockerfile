# Base image ships Chromium + all system deps, matching the installed playwright version.
FROM mcr.microsoft.com/playwright:v1.61.1-jammy

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies. --include=dev forces devDependencies even when the platform
# (e.g. Coolify) injects NODE_ENV=production at build time — the build needs tailwindcss,
# typescript, prisma CLI, etc. The runtime seed also uses tsx from devDependencies.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

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
