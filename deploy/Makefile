.PHONY: build up down logs ps

build:
	docker compose --project-name slm-demo -f docker-compose.yml build

up:
	docker compose --project-name slm-demo -f docker-compose.yml --env-file ./env.sample up -d

down:
	docker compose --project-name slm-demo -f docker-compose.yml down

logs:
	docker compose --project-name slm-demo -f docker-compose.yml logs -f --tail=200

ps:
	docker compose --project-name slm-demo -f docker-compose.yml ps


