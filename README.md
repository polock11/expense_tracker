# Ledger — Daily Expense Tracker

A small full-stack app to learn the shape of a modern web project end-to-end:
a typed REST API, a versioned database schema, a typed frontend, containerized
builds, and a path to a real deployment on EC2.

```
expense-tracker/
├── backend/          Express + TypeScript API, Postgres access, migrations
├── frontend/         React + TypeScript UI (Vite), built as static assets
└── docker-compose.yml  Runs postgres + backend + frontend together locally
```

## How the pieces fit together

- **Postgres** stores one table, `expenses`.
- **Backend** (Node/Express/TypeScript) exposes a small REST API under `/api`
  and talks to Postgres via the `pg` driver. Schema changes are managed with
  **node-pg-migrate**, not by hand-editing the database.
- **Frontend** (React/TypeScript/Vite) is a static single-page app. It calls
  the backend's REST API and renders a monthly calendar, a day panel for
  adding/editing/deleting expenses, and a monthly category breakdown.
- In production, the frontend is compiled to static files and served by
  nginx; the backend runs as its own small Node process; Postgres runs as its
  own process/container. This separation — a stateless API, a static frontend
  build, and a stateful database — is the standard pattern for small modern
  web apps, and it's exactly what makes each piece independently deployable
  and scalable later.

## Running locally with Docker (recommended)

This is the fastest way to see the whole stack running together, and it
mirrors how you'll deploy it.

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend health check: http://localhost:4000/api/health
- Postgres: localhost:5432 (user/pass/db: `expense_user` / `expense_pass` / `expense_tracker`)

The backend container runs `npm run migrate:up` before starting the server,
so the schema is always up to date automatically. Data persists in the
`pgdata` Docker volume across restarts.

To stop everything: `docker compose down` (add `-v` to also wipe the database volume).

## Running locally without Docker

Useful if you want to iterate quickly with hot reload.

**1. Start Postgres** (any way you like — Docker is easiest even here):

```bash
docker run --name expense-postgres -p 5432:5432 \
  -e POSTGRES_USER=expense_user \
  -e POSTGRES_PASSWORD=expense_pass \
  -e POSTGRES_DB=expense_tracker \
  -d postgres:16-alpine
```

**2. Backend**

```bash
cd backend
cp .env.example .env
npm install
npm run migrate:up   # applies the schema
npm run dev           # starts the API on http://localhost:4000 with hot reload
```

**3. Frontend** (in a separate terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev           # starts Vite on http://localhost:5173
```

Open http://localhost:5173.

## Managing schema changes (migrations)

This is the `npm run migrate` pattern you mentioned. Schema changes live as
versioned files in `backend/migrations/`, and are applied/rolled back with
npm scripts instead of manually running SQL against the database:

```bash
cd backend
npm run migrate:create add-some-column   # scaffolds a new migration file
npm run migrate:up                       # applies all pending migrations
npm run migrate:down                     # rolls back the most recent migration
```

Each migration file has an `up` and a `down` function, so changes are
reversible and every environment (your laptop, CI, production) ends up with
an identical, auditable schema history — instead of "someone SSH'd into prod
and ran an ALTER TABLE once."

## API reference

| Method | Endpoint                  | Description                          |
|--------|----------------------------|---------------------------------------|
| GET    | `/api/expenses?month=YYYY-MM` | List expenses for a month + total |
| POST   | `/api/expenses`            | Create an expense                    |
| PUT    | `/api/expenses/:id`        | Update an expense                    |
| DELETE | `/api/expenses/:id`        | Delete an expense                    |
| GET    | `/api/health`               | Health check (used by deploy tooling) |

## Deploying to EC2

Below is a straightforward Docker-based deployment. It reuses the exact same
`docker-compose.yml` you already tested locally — a good illustration of why
containerizing early pays off: "works on my machine" becomes "works
everywhere the container runs."

### 1. Launch an instance

- Ubuntu 22.04/24.04 LTS, `t3.small` or larger (Postgres + Node + a browser
  build step want a bit more than the free-tier `t2.micro`, though it can
  work for a toy dataset).
- Security group: allow inbound **22** (SSH, ideally restricted to your IP),
  **80** (HTTP), and optionally **443** (HTTPS, if you add TLS later). Do
  **not** expose 5432 (Postgres) or 4000 (API) to the internet — only the
  frontend on 80 needs to be public; the browser talks to the API through a
  reverse proxy path instead of a raw port (see step 4).

### 2. Install Docker on the instance

```bash
ssh ubuntu@<your-ec2-ip>

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt-get install -y docker-compose-plugin
```

### 3. Ship the code

Either `git clone` your repo on the instance, or copy it up directly:

```bash
scp -r expense-tracker ubuntu@<your-ec2-ip>:~/expense-tracker
```

### 4. Point the frontend at the right API URL

Locally the frontend calls `http://localhost:4000/api`. On a real server, the
browser (on the visitor's laptop) needs a URL it can actually reach — so use
your EC2 instance's public DNS/IP, or better, put both frontend and API
behind a single nginx entrypoint on port 80 so the browser only ever talks to
one origin. The simplest fix for a first deploy: set the build arg to your
instance's public address before building the frontend image:

```bash
# in docker-compose.yml, change:
#   args: { VITE_API_URL: http://localhost:4000/api }
# to:
#   args: { VITE_API_URL: http://<your-ec2-public-ip>:4000/api }
```

and open port 4000 in the security group too for this simple version. (A
cleaner setup — recommended once this is working — is to add an nginx reverse
proxy in front that serves the frontend at `/` and proxies `/api` to the
backend container, so only port 80/443 is ever public. That also becomes the
place you'd terminate HTTPS with Let's Encrypt/certbot.)

### 5. Set real secrets

Don't ship `.env.example` values to production. Generate a strong Postgres
password and put it in `docker-compose.yml` (or better, an untracked
`.env` file referenced by compose) before running on the server.

### 6. Bring it up

```bash
cd expense-tracker
docker compose up --build -d
docker compose logs -f backend   # confirm migrations ran and the API is listening
```

Visit `http://<your-ec2-public-ip>:8080` (or port 80, if you set the frontend
container's published port to `80:80`).

### 7. Keep it running

- `docker compose up -d` already restarts containers on crash
  (`restart: unless-stopped`) and on instance reboot once Docker's systemd
  service is enabled (`sudo systemctl enable docker`, on by default with
  `get.docker.com`).
- For deploying updates: `git pull && docker compose up --build -d` re-builds
  only what changed and re-runs migrations automatically.
- Back up the `pgdata` volume regularly (`docker run --rm -v
  expense-tracker_pgdata:/data -v $(pwd):/backup alpine tar czf
  /backup/pgdata-backup.tar.gz /data`) — a database that only lives in one
  EC2 instance's disk is one bad `terminate-instance` away from gone.

### Alternative: no Docker on EC2

If you'd rather learn the more "traditional" ops path instead of containers:
install Postgres and Node directly on the instance, run the backend under a
process manager like **PM2** or a **systemd** unit (so it restarts on crash/
reboot), build the frontend locally (`npm run build`) and copy the static
`dist/` folder to `/var/www/…`, and use **nginx** to serve those static files
and reverse-proxy `/api` to the Node process on `localhost:4000`. This is
more manual but is worth doing once — it's what the Docker setup above is
automating for you.
