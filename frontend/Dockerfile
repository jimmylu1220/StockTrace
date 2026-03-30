## ── Stage 1: build React app ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cached unless package-lock.json changes)
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build          # outputs to /app/dist

## ── Stage 2: serve with nginx ───────────────────────────────────────────────
FROM nginx:1.25-alpine

# Replace default config with ours (includes /api proxy to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
