.PHONY: help build build-prod build-dev run run-prod run-dev stop logs shell test lint clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make build        - Build the production Docker image"
	@echo "  make build-dev    - Build the development Docker image"
	@echo "  make run          - Run the production container"
	@echo "  make run-dev      - Run the development container with hot reload"
	@echo "  make stop         - Stop running containers"
	@echo "  make logs         - Show container logs"
	@echo "  make shell        - Open a shell in the running container"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linting"
	@echo "  make clean        - Remove Docker images and containers"

# Variables
IMAGE_NAME = radarr-in-cinemas
CONTAINER_NAME = radarr-in-cinemas
PORT = 3000

# Build commands
build: build-prod

build-prod:
	docker build -f docker/node/Dockerfile --target prod -t $(IMAGE_NAME):prod .

build-dev:
	docker build -f docker/node/Dockerfile --target dev -t $(IMAGE_NAME):dev .

build-test:
	docker build -f docker/node/Dockerfile --target test -t $(IMAGE_NAME):test .

# Run commands
run: run-prod

run-prod: build-prod
	docker run -d --rm \
		--name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		-e TMDB_API_KEY=$(TMDB_API_KEY) \
		$(IMAGE_NAME):prod
	@echo "Container started at http://localhost:$(PORT)"
	@echo "Dashboard available at http://localhost:$(PORT)/"

run-dev: build-dev
	docker run -d --rm \
		--name $(CONTAINER_NAME)-dev \
		-p $(PORT):3000 \
		-e TMDB_API_KEY=$(TMDB_API_KEY) \
		-v $(PWD)/src:/app/src \
		$(IMAGE_NAME):dev
	@echo "Dev container started at http://localhost:$(PORT)"

run-local:
	bun run start

run-local-watch:
	bun run start:watch

# Container management
stop:
	-docker stop $(CONTAINER_NAME) 2>/dev/null || true
	-docker stop $(CONTAINER_NAME)-dev 2>/dev/null || true

logs:
	docker logs -f $(CONTAINER_NAME) 2>/dev/null || docker logs -f $(CONTAINER_NAME)-dev

shell:
	docker exec -it $(CONTAINER_NAME) sh 2>/dev/null || docker exec -it $(CONTAINER_NAME)-dev sh

# Testing and linting
test:
	bun test

test-docker: build-test
	docker run --rm $(IMAGE_NAME):test bun test

lint:
	bun run lint

lint-fix:
	bun run lint:fix

# Cleanup
clean: stop
	-docker rmi $(IMAGE_NAME):prod 2>/dev/null || true
	-docker rmi $(IMAGE_NAME):dev 2>/dev/null || true
	-docker rmi $(IMAGE_NAME):test 2>/dev/null || true

# Health check
health:
	@curl -s http://localhost:$(PORT)/api/dashboard/stats | python3 -m json.tool || echo "Container not running or not healthy"

# Trigger a movie fetch and show results
fetch-movies:
	@echo "Fetching movies..."
	@curl -s http://localhost:$(PORT)/api/movies | python3 -m json.tool | head -50

# Show dashboard data
dashboard:
	@curl -s http://localhost:$(PORT)/api/dashboard | python3 -m json.tool

