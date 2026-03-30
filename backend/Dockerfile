## ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Download dependencies first (layer cached unless go.mod/go.sum change)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o stocktrace-backend .

## ── Stage 2: minimal runtime ────────────────────────────────────────────────
FROM alpine:3.19

# ca-certificates for HTTPS outbound; tzdata for Asia/Taipei
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/stocktrace-backend .

EXPOSE 8888

CMD ["./stocktrace-backend"]
