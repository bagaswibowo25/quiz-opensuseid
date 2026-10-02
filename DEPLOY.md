# quiz.opensuse.id — ClassQuiz deployment

Fork [ClassQuiz](https://github.com/mawoka-myblock/ClassQuiz) (MPL-2.0) untuk openSUSE.Asia Summit 2026,
dengan tema openSUSE dan setup Docker Compose produksi.

## Isi repo

| File | Fungsi |
|---|---|
| `docker-compose.prod.yml` | Stack produksi: frontend (build lokal), api, worker, Postgres, Valkey, Meilisearch, Caddy |
| `Caddyfile.prod` | Reverse proxy + HTTPS otomatis (Let's Encrypt) untuk `quiz.opensuse.id`; halaman publik dialihkan ke `/play` |
| `.env.example` | Template secret (`SECRET_KEY`, `POSTGRES_PASSWORD`). `.env` asli **tidak** ada di git |
| `scripts/backup.sh` | Dump database + arsip `uploads/` ke `backups/<timestamp>/` |
| `scripts/restore.sh` | Restore dari folder backup |
| `frontend/` | Frontend ClassQuiz yang sudah dimodifikasi (lihat "Perubahan" di bawah) |

Data (akun, kuis, gambar) **tidak** ada di git — itu yang dicakup `scripts/backup.sh`.

## Deploy dari nol (server baru)

Butuh: Linux dengan Docker + Docker Compose v2, port 80/443 terbuka, DNS `quiz.opensuse.id` mengarah ke server.

```bash
git clone https://github.com/bagaswibowo25/quiz-opensuseid.git ClassQuiz
cd ClassQuiz

cp .env.example .env
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$(openssl rand -hex 32)/; s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" .env
chmod 600 .env
mkdir -p uploads

sudo docker compose -f docker-compose.prod.yml up -d --build
```

Build frontend pertama kali ~5–10 menit. Cek: `sudo docker compose -f docker-compose.prod.yml ps` dan buka https://quiz.opensuse.id/play.

Domain lain? Ganti `quiz.opensuse.id` di `Caddyfile.prod` dan `ROOT_ADDRESS` di `docker-compose.prod.yml`.

## Restore data dari backup

```bash
# di server baru, setelah langkah "Deploy dari nol"
scp -r backups/20261003-090000 user@server:ClassQuiz/backups/
./scripts/restore.sh backups/20261003-090000
```

## Backup rutin

```bash
./scripts/backup.sh
scp -r user@quiz.opensuse.id:ClassQuiz/backups/<timestamp> ./   # simpan di luar server
```

## Operasional

```bash
C="sudo docker compose -f docker-compose.prod.yml"
$C ps                       # status
$C logs -f api              # log backend (socket.io, game)
$C restart                  # restart semua
$C build frontend && $C up -d frontend   # deploy ulang setelah ubah frontend
```

**Admin:** login di https://quiz.opensuse.id/account/login. Registrasi ditutup (`REGISTRATION_DISABLED`
di compose + `VITE_REGISTRATION_DISABLED` di `frontend/Dockerfile`). Untuk menambah admin, hapus sementara
baris `REGISTRATION_DISABLED: "True"`, `$C up -d`, daftar, lalu pasang lagi.

## Perubahan dari upstream

- Tema openSUSE: font Source Sans 3 (self-host), palet resmi openSUSE, logo Geeko, favicon.
- Tampilan "stage" untuk layar game (motif kawung + gelombang), responsif untuk HP.
- Layar peserta: kartu soal, tile jawaban berikon ▲◆●■, feedback benar/salah layar penuh, podium akhir + confetti.
- Layar host: lobby dengan PIN/QR besar, leaderboard, suara countdown (bisa di-mute 🔊/🔇).
- Kick tidak lagi mem-ban browser; pemain bisa masuk lagi dengan nama lain.
- Registrasi ditutup; halaman publik selain `/play` dialihkan.

Backend memakai image upstream `ghcr.io/mawoka-myblock/classquiz-backend:master` (tidak dimodifikasi).
