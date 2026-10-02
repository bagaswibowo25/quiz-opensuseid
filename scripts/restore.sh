#!/usr/bin/env bash
# Restore database + uploads dari folder hasil scripts/backup.sh
# Pakai: ./scripts/restore.sh backups/20261003-090000
# Aman dipakai di server baru (database kosong) maupun untuk menimpa data yang ada.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${1:?Pakai: $0 <folder-backup>}"
[ -f "$SRC/db.dump" ] || { echo "Tidak ada $SRC/db.dump"; exit 1; }
COMPOSE="sudo docker compose -f docker-compose.prod.yml"

echo "-> Hentikan api/worker supaya tidak ada yang menulis ke database"
$COMPOSE stop api worker 2>/dev/null || true

echo "-> Nyalakan database"
$COMPOSE up -d db
until $COMPOSE exec -T db pg_isready -U postgres < /dev/null >/dev/null 2>&1; do sleep 2; done

echo "-> Restore database"
$COMPOSE exec -T db pg_restore -U postgres -d classquiz --clean --if-exists --no-owner < "$SRC/db.dump"

if [ -f "$SRC/uploads.tar.gz" ]; then
  echo "-> Restore uploads"
  sudo tar -xzf "$SRC/uploads.tar.gz"
fi

echo "-> Nyalakan semua service"
$COMPOSE up -d
echo "Selesai."
