# Multi-stage Dockerfile for Node.js application with Neon Database
# Supports both development and production environments

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (if you have a build step)
RUN npm run build 2>/dev/null || echo "No build script found, skipping..."

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=app:nodejs /app/dist ./dist 2>/dev/null || true
COPY --from=builder --chown=app:nodejs /app/build ./build 2>/dev/null || true

# Copy source code (for apps that don't have a build step)
COPY --chown=app:nodejs . .

# Remove unnecessary files
RUN rm -rf .git .gitignore README.md docker-compose*.yml Dockerfile*

# Switch to non-root user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install nodemon globally for development
RUN npm install -g nodemon

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port for development
EXPOSE 3000

# Start with nodemon for hot reloading
CMD ["npm", "run", "dev"]