# Multi-stage Dockerfile is overkill if you already build locally.
# This simple Dockerfile copies a pre-built `dist/` into nginx and uses
# the `nginx.conf` supplied alongside it.

FROM nginx:stable-alpine

# Replace default nginx config with our SPA-aware config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY dist/ /usr/share/nginx/html/

# Expose port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
