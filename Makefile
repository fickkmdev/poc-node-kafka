APP_NAME := poc-node-kafka
ENV_FILE ?= .env
PORT ?= 3000
COMPOSE_FILE ?= docker-compose.yml

.PHONY: help install dev build start lint clean docker-build docker-run docker-shell compose-up compose-down compose-logs compose-ps compose-restart

help:
	@echo "Available targets:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run app in development mode"
	@echo "  make build        - Compile TypeScript to dist/"
	@echo "  make start        - Run compiled app from dist/"
	@echo "  make lint         - Run ESLint"
	@echo "  make clean        - Remove dist/"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make docker-shell - Open shell in Docker image"
	@echo "  make compose-up   - Start app + Kafka + Kafka UI with Docker Compose"
	@echo "  make compose-down - Stop and remove Docker Compose stack"
	@echo "  make compose-logs - Tail logs from Docker Compose stack"
	@echo "  make compose-ps   - Show Docker Compose service status"
	@echo "  make compose-restart - Restart Docker Compose stack"

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

clean:
	rm -rf dist

docker-build:
	docker build -t $(APP_NAME) .

docker-run:
	docker run --rm -p $(PORT):3000 --env-file $(ENV_FILE) $(APP_NAME)

docker-shell:
	docker run --rm -it --env-file $(ENV_FILE) --entrypoint sh $(APP_NAME)

compose-up:
	docker compose -f $(COMPOSE_FILE) up --build -d

compose-down:
	docker compose -f $(COMPOSE_FILE) down

compose-logs:
	docker compose -f $(COMPOSE_FILE) logs -f --tail=200

compose-ps:
	docker compose -f $(COMPOSE_FILE) ps

compose-restart:
	docker compose -f $(COMPOSE_FILE) down
	docker compose -f $(COMPOSE_FILE) up --build -d
