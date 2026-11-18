# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build React application
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS build

WORKDIR /app

# Vite API URL
# Empty means frontend uses relative /api URLs.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package files first for Docker caching
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline

# Copy application source
COPY . .

# Build React application
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Nginx
# ─────────────────────────────────────────────────────────────────────────────

FROM nginx:1.27-alpine AS runtime

# Remove default Nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on 80 inside container
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
