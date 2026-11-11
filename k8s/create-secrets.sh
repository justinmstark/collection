#!/bin/sh
# Create the collection namespace secrets with random values. Idempotent: existing
# secrets are left untouched, so re-running never rotates live credentials.
#
#   TUNNEL_TOKEN=eyJ... OPENAI_API_KEY=sk-... ./k8s/create-secrets.sh
#
# TUNNEL_TOKEN is the Cloudflare Tunnel token (Zero Trust -> Networks -> Tunnels).
# OPENAI_API_KEY is optional (bottle identification). Values are never printed.
# NEXTAUTH_URL is deliberately unset: AUTH_TRUST_HOST derives the origin per request,
# so login works both via the tunnel (https) and the LAN NodePort (http).
set -eu
NS=collection

rand() { openssl rand -hex 24; }
exists() { kubectl -n "$NS" get secret "$1" >/dev/null 2>&1; }

if ! exists collection-db; then
  DB_PASS=$(rand)
  kubectl -n "$NS" create secret generic collection-db \
    --from-literal=POSTGRES_USER=collection \
    --from-literal=POSTGRES_DB=collection \
    --from-literal=POSTGRES_PASSWORD="$DB_PASS"
else
  DB_PASS=$(kubectl -n "$NS" get secret collection-db -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
  echo "collection-db exists, keeping it"
fi

if ! exists collection-minio; then
  MINIO_PASS=$(rand)
  kubectl -n "$NS" create secret generic collection-minio \
    --from-literal=MINIO_ROOT_USER=collection \
    --from-literal=MINIO_ROOT_PASSWORD="$MINIO_PASS"
else
  MINIO_PASS=$(kubectl -n "$NS" get secret collection-minio -o jsonpath='{.data.MINIO_ROOT_PASSWORD}' | base64 -d)
  echo "collection-minio exists, keeping it"
fi

if ! exists collection-app; then
  kubectl -n "$NS" create secret generic collection-app \
    --from-literal=DATABASE_URL="postgresql://collection:${DB_PASS}@postgres:5432/collection" \
    --from-literal=NEXTAUTH_SECRET="$(openssl rand -hex 32)" \
    --from-literal=AUTH_TRUST_HOST=true \
    --from-literal=MINIO_ENDPOINT=minio \
    --from-literal=MINIO_PORT=9000 \
    --from-literal=MINIO_ACCESS_KEY=collection \
    --from-literal=MINIO_SECRET_KEY="$MINIO_PASS" \
    --from-literal=MINIO_BUCKET=collection-images \
    --from-literal=MINIO_PUBLIC_URL=/minio \
    --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY:-}"
else
  echo "collection-app exists, keeping it"
fi

if [ -n "${TUNNEL_TOKEN:-}" ]; then
  kubectl -n "$NS" create secret generic cloudflared-token \
    --from-literal=TUNNEL_TOKEN="$TUNNEL_TOKEN" --dry-run=client -o yaml | kubectl apply -f -
elif ! exists cloudflared-token; then
  echo "NOTE: cloudflared-token not created (set TUNNEL_TOKEN). cloudflared pods will wait for it."
fi
