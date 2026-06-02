#!/usr/bin/env bash
# Apply demo seed (admin/admin123) on production stack. Run once after first deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from .env.prod.example" >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --profile seed \
  run --rm seed

echo "Seed done. Login: admin / admin123"
