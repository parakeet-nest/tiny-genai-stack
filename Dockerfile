FROM golang:1.23.2-alpine AS buildernext
WORKDIR /app
COPY main.go .
COPY go.mod .
COPY go.sum .
RUN go build

FROM scratch
WORKDIR /app
COPY public ./public
COPY --from=buildernext /app/parakeet-webapp .
CMD ["./parakeet-webapp"]
