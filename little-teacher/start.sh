#!/bin/bash
#LLM=deepseek-coder OLLAMA_BASE_URL=http://host.docker.internal:11434 go run main.go

HTTP_PORT=9999 LLM=deepseek-coder OLLAMA_BASE_URL=http://host.docker.internal:11434 docker compose --profile webapp up