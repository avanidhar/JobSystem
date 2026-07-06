.PHONY: build up test stop clean

build:
	docker compose build

up:
	docker compose up -d

test: up
	docker compose --profile e2e run --rm e2e

stop:
	docker compose stop

clean:
	docker compose down -v --remove-orphans
