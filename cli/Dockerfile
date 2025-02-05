FROM golang:1.23 AS builder

WORKDIR /app

COPY .env.prod go.mod go.sum ./cli ./
COPY src/storage/database/migrations/ /app/src/storage/database/migrations/

RUN go build -o cli && chmod +x /app/cli

ENTRYPOINT ["/app/cli"]
