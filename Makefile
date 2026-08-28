.PHONY: up down build setup backup restore logs

COMPOSE := $(shell docker info >/dev/null 2>&1 && (which docker-compose >/dev/null 2>&1 && echo "docker-compose" || echo "docker compose") || echo "podman-compose")

up:
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		SECRET=$$(openssl rand -hex 32); \
		sed -i.bak "s/changeme/$$SECRET/" .env && rm -f .env.bak; \
		echo "Generated NEXTAUTH_SECRET"; \
	fi
	@if grep -q "^OPENAI_API_KEY=$$" .env 2>/dev/null; then \
		echo "⚠️  OPENAI_API_KEY is not set in .env — bottle identification will not work."; \
		echo "   Add it manually: OPENAI_API_KEY=sk-proj-..."; \
	fi
	$(COMPOSE) up -d

down:
	@mkdir -p backups
	@$(COMPOSE) exec -T db pg_dump -U $$(grep POSTGRES_USER .env | cut -d= -f2) $$(grep POSTGRES_DB .env | cut -d= -f2) \
		> backups/collection_$$(date +%Y%m%d_%H%M%S).sql 2>/dev/null && echo "✓ Auto-backup saved to backups/" || true
	$(COMPOSE) down

build:
	$(COMPOSE) build --no-cache

setup:
	$(COMPOSE) exec app npx prisma db push
	$(COMPOSE) exec app npx prisma db seed

backup:
	@mkdir -p backups
	$(COMPOSE) exec db pg_dump -U $$(grep POSTGRES_USER .env | cut -d= -f2) $$(grep POSTGRES_DB .env | cut -d= -f2) \
		> backups/collection_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"

restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backups/file.sql"; exit 1; fi
	$(COMPOSE) exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d= -f2) \
		-c "SET session_replication_role = replica;" \
		$$(grep POSTGRES_DB .env | cut -d= -f2) < $(FILE)
	@echo "Restored from $(FILE)"

logs:
	$(COMPOSE) logs -f app
