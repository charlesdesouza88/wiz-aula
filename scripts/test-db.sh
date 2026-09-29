#!/usr/bin/env bash
# Applies supabase/migrations and supabase/seed.sql to a throwaway Postgres
# cluster and runs the row-level-security tests in db/tests/rls.sql.
# Needs the Postgres server binaries (initdb, pg_ctl); set PG_BIN if they are
# not on PATH. No Docker required.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PG_BIN:$PATH"
command -v initdb >/dev/null || { echo "initdb not found; set PG_BIN" >&2; exit 1; }

work="$(mktemp -d)"
run() { "$@"; }
if [ "$(id -u)" = "0" ]; then
  # initdb refuses to run as root.
  chown postgres "$work"
  run() { runuser -u postgres -- "$@"; }
fi
cleanup() { run pg_ctl -D "$work/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

run initdb -D "$work/data" -U postgres -A trust --no-sync >/dev/null
run pg_ctl -D "$work/data" -o "-k $work -c listen_addresses='' -c fsync=off -c wal_level=logical" -l "$work/log" -w start >/dev/null

psql_run() { run psql -h "$work" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X "$@"; }

psql_run -f "$root/db/tests/supabase-stub.sql"
for f in "$root"/supabase/migrations/*.sql; do
  echo "migration: $(basename "$f")"
  psql_run -f "$f"
done
echo "seed: supabase/seed.sql"
psql_run -f "$root/supabase/seed.sql"
echo "tests: db/tests/rls.sql"
# Query results go to /dev/null; the ok/FAILED notices print on stderr.
psql_run -o /dev/null -f "$root/db/tests/rls.sql"
