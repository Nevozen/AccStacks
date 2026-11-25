# Self-Hosting AccStacks

AccStacks is designed for self-hosting on a VPS using Docker Compose and PostgreSQL. Each user owns their private workspace. No external deployment is performed by the project automation.

## Requirements

- A VPS with Docker Engine and Docker Compose.
- A domain pointing to the VPS for HTTPS.
- Strong, unique secrets and a verified database backup process.

The production Compose configuration:

- Runs Next.js as a non-root user with a read-only filesystem and dropped capabilities.
- Keeps PostgreSQL on a private Docker network with no published database port.
- Persists PostgreSQL in a named volume.
- Persists private account thumbnails in the `accstacks-uploads` volume at `/data/uploads`; images are served only through authenticated, ownership-checked routes.
- Publishes the app only on `127.0.0.1:3000` for a reverse proxy.
- Provides app and database health checks.

## 1. Configure environment

Copy `.env.example` to `.env` and set production values:

```dotenv
POSTGRES_DB=accstacks
POSTGRES_USER=accstacks
POSTGRES_PASSWORD=use-a-unique-strong-database-password
PRODUCTION_DATABASE_URL=postgresql://accstacks:use-a-unique-strong-database-password@db:5432/accstacks?schema=public
AUTH_SECRET=use-an-independent-long-random-secret
AUTH_URL=https://accounts.example.com
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=use-another-independent-random-key
APP_PORT=3000
OWNER_NAME=Your Name
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=use-a-unique-strong-owner-password
```

Replace `accounts.example.com` with the real HTTPS origin. URL-encode special characters in the database password inside `PRODUCTION_DATABASE_URL`. Generate independent secrets with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Keep `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stable across deployments. Never commit `.env` or use the example passwords.

## 2. Build and migrate

Back up an existing database before applying new migrations. Review migration SQL before upgrading production.

```bash
docker compose -f compose.prod.yaml --profile migrate build
docker compose -f compose.prod.yaml --profile migrate run --rm migrator
```

The `migrator` profile is explicit; starting the app does not silently migrate the database.

Optional: provision a specific workspace owner instead of using browser registration. This command starts a temporary migrator-container environment with production dependencies:

```bash
docker compose -f compose.prod.yaml --profile migrate run --rm \
  -e OWNER_NAME -e OWNER_EMAIL -e OWNER_PASSWORD \
  migrator pnpm auth:create-owner
```

Re-running owner provisioning updates the password of the account with the configured email; use it carefully.

## 3. Start and verify

```bash
docker compose -f compose.prod.yaml up -d db app
docker compose -f compose.prod.yaml ps
curl --fail http://127.0.0.1:3000/api/health
```

A healthy response is `{"status":"ok","database":"connected"}`. Inspect logs with:

```bash
docker compose -f compose.prod.yaml logs --tail=100 app db
```

The public landing page at `/` links to `/register` and `/login`. To limit who can register on a private installation, restrict network access to the app at the reverse proxy or VPN. Registration does not verify email ownership or offer self-service password recovery.

## 4. HTTPS reverse proxy

### Caddy

Caddy can obtain and renew certificates automatically:

```caddyfile
accounts.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Reload Caddy after updating the Caddyfile. Keep ports 80 and 443 accessible only as required by the proxy.

### Nginx

Configure Nginx as an HTTPS reverse proxy to `http://127.0.0.1:3000`, forwarding `Host` and `X-Forwarded-Proto`. Set `proxy_set_header X-Forwarded-For $remote_addr;` so authentication throttling uses the connecting address, not a client-supplied header. If there is another trusted load balancer in front, configure Nginx's real IP handling for that balancer first. Obtain certificates using the organization's certificate process or Certbot. Do not expose PostgreSQL through Nginx.

After configuring HTTPS, sign in using the public `AUTH_URL`, then verify sign-out, Server Actions, and CSV downloads. Do not add a broad Server Actions `allowedOrigins` setting unless the deployment actually crosses origins.

## Upgrades

1. Create and verify a database backup.
2. Review application and migration changes.
3. Rebuild images.
4. Run the explicit migration service.
5. Recreate `db` and `app` and check `/api/health` plus core workflows.

```bash
docker compose -f compose.prod.yaml --profile migrate build
docker compose -f compose.prod.yaml --profile migrate run --rm migrator
docker compose -f compose.prod.yaml up -d --build db app
```

## Development versus production

`compose.yaml` starts only the development PostgreSQL container on `127.0.0.1:5432`. `compose.prod.yaml` starts the production app stack, uses the private `db` hostname, and does not publish PostgreSQL. Development seed data is never inserted automatically and is blocked when `NODE_ENV=production`.
