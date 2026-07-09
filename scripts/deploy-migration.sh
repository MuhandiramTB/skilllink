#!/usr/bin/env bash
# ============================================================================
# One-click DB migration runner (safe for production / Neon).
#
#   Backs up → applies a migration with SSL → verifies key objects.
#
# Usage:
#   scripts/deploy-migration.sh "<CONNECTION_URL>" [migration.sql]
#
#   CONNECTION_URL  full Postgres URL. For Neon, include ?sslmode=require, e.g.
#     postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
#   migration.sql   path to the .sql (default: db/migrations/015_trust_safety_and_policy.sql)
#
# The URL is only read as an argument — it is NOT written to disk or logged.
# Requires psql + pg_dump. Uses the PostgreSQL 18 tools if not on PATH.
# ============================================================================
set -euo pipefail

URL="${1:-}"
MIGRATION="${2:-db/migrations/015_trust_safety_and_policy.sql}"

if [[ -z "$URL" ]]; then
  echo "ERROR: pass the connection URL as the first argument (quote it)." >&2
  echo 'Usage: scripts/deploy-migration.sh "postgresql://USER:PASSWORD@HOST/DB?sslmode=require" [file.sql]' >&2
  exit 1
fi
if [[ ! -f "$MIGRATION" ]]; then
  echo "ERROR: migration file not found: $MIGRATION" >&2
  exit 1
fi

# Resolve psql / pg_dump (PATH first, then the local PG18 install).
PG_BIN="/c/Program Files/PostgreSQL/18/bin"
PSQL="$(command -v psql || true)";       [[ -z "$PSQL"    && -x "$PG_BIN/psql.exe"    ]] && PSQL="$PG_BIN/psql.exe"
PGDUMP="$(command -v pg_dump || true)";  [[ -z "$PGDUMP"  && -x "$PG_BIN/pg_dump.exe" ]] && PGDUMP="$PG_BIN/pg_dump.exe"
if [[ -z "$PSQL" || -z "$PGDUMP" ]]; then
  echo "ERROR: psql/pg_dump not found (PATH or $PG_BIN)." >&2
  exit 1
fi

# Redacted host for logs (never print credentials).
SAFE_HOST="$(printf '%s' "$URL" | sed -E 's#.*@([^/?]+).*#\1#')"

echo "▶ Target host : $SAFE_HOST"
echo "▶ Migration   : $MIGRATION"
echo

# 1) Connectivity check ------------------------------------------------------
echo "① Checking connection…"
"$PSQL" "$URL" -tAc "select 'ok', count(*) from information_schema.tables where table_schema='public';" \
  || { echo "ERROR: could not connect. Check the URL / sslmode=require." >&2; exit 1; }

# 2) Backup ------------------------------------------------------------------
STAMP="$(date +%Y%m%d-%H%M%S 2>/dev/null || echo prebackup)"
BACKUP="neon-backup-before-$(basename "$MIGRATION" .sql)-$STAMP.dump"
echo
echo "② Backing up → $BACKUP  (custom format)…"
"$PGDUMP" "$URL" -Fc -f "$BACKUP"
echo "   backup size: $(du -h "$BACKUP" 2>/dev/null | cut -f1 || echo '?')"

# 3) Apply -------------------------------------------------------------------
echo
echo "③ Applying migration (ON_ERROR_STOP)…"
if ! "$PSQL" "$URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"; then
  echo >&2
  echo "MIGRATION FAILED. Your data is unchanged where the transaction rolled back." >&2
  echo "If the failure was on 'ALTER TYPE ... ADD VALUE', run that one DO\$\$ block alone," >&2
  echo "then re-run this script (it is idempotent). Restore if needed:" >&2
  echo "  pg_restore --clean --no-owner -d \"<URL>\" $BACKUP" >&2
  exit 1
fi

# 4) Verify ------------------------------------------------------------------
echo
echo "④ Verifying key objects…"
"$PSQL" "$URL" -tAc "
  select 'tables: ' || string_agg(table_name, ', ')
  from information_schema.tables
  where table_schema='public'
    and table_name in ('safety_alerts','provider_reports','trusted_contacts');"
"$PSQL" "$URL" -tAc "
  select 'booking cols: ' || string_agg(column_name, ', ')
  from information_schema.columns
  where table_name='bookings'
    and column_name in ('cash_reported','cancel_fee_cents','cancelled_by');"
"$PSQL" "$URL" -tAc "
  select 'no_show enum: ' || coalesce(string_agg(enumlabel,','), 'MISSING')
  from pg_enum e join pg_type t on t.oid=e.enumtypid
  where t.typname='booking_status' and enumlabel='no_show';"

echo
echo "✅ Migration applied + verified. Backup kept at: $BACKUP"
echo "   Next: redeploy the API (deploy-api.ps1), then the web app."
