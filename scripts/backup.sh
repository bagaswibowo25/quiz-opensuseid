#!/usr/bin/env bash
# Backup database + uploaded files ClassQuiz ke ./backups/<timestamp>/
# Pakai: ./scripts/backup.sh   (jalankan dari root repo, butuh sudo untuk docker)
# PENTING: salin hasilnya ke luar server (laptop / object storage), backup di server yang sama
# tidak menolong kalau servernya yang rusak.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="sudo docker compose -f docker-compose.prod.yml"
DEST="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

echo "-> Dump database ke $DEST/db.dump"
$COMPOSE exec -T db pg_dump -U postgres -Fc classquiz < /dev/null > "$DEST/db.dump"

echo "-> Arsip uploads ke $DEST/uploads.tar.gz"
sudo tar -czf "$DEST/uploads.tar.gz" uploads

ls -lh "$DEST"
echo
echo "Selesai. Salin ke laptop, misalnya:"
echo "  scp -r $(whoami)@$(hostname -f 2>/dev/null || hostname):$(pwd)/$DEST ./"
