# Build stage
FROM node:20-alpine AS builder

# Install dependencies required for building
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (legacy peer deps required for react-qr-scanner)
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
RUN npm ci

# Provide a placeholder database URL so Prisma Client can be instantiated during build
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies required by Prisma (OpenSSL, glibc compatibility)
RUN apk add --no-cache libc6-compat openssl ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start application with a schema sync against the configured database
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
