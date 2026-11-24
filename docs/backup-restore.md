# Database Backup and Restoration

Back up before migrations, upgrades, or infrastructure changes. Store backups encrypted off the VPS with restricted access. These files contain private inventory and financial history; never commit them to Git.

The examples use the default `accstacks` database and user. Adjust them to the production environment.

## Create a logical backup

```bash
mkdir -p backups
docker compose -f compose.prod.yaml exec -T db \
  pg_dump -U accstacks -d accstacks --format=plain --no-owner \
  > "backups/accstacks-$(date -u +%Y%m%dT%H%M%SZ).sql"
```

Verify that the new file exists, has nonzero size, and contains expected schema/data statements. Periodically test restoration on an isolated PostgreSQL instance.

## Restore into a new isolated database

Do not overwrite an active production database as a routine restore method. First create a fresh database with an appropriate name:

```bash
docker compose -f compose.prod.yaml exec -T db \
  createdb -U accstacks accstacks_restore
cat backups/accstacks-TIMESTAMP.sql | docker compose -f compose.prod.yaml exec -T db \
  psql -U accstacks -d accstacks_restore
```

Validate account, listing, sale, and expense counts and run the application against the restored database in an isolated environment. A production cutover, if required, should use a reviewed maintenance plan and a fresh backup.

## Delete local backups safely

Local backup deletion is a destructive operation. Confirm the filename and verify offsite retention before deleting anything. Do not place backup files inside the repository.
