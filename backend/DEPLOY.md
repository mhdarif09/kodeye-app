# Deploy

```bash
# 1. Pull changes
git pull

# 2. Run database migrations (applies new tables like quiz_questions, user_quiz_attempts)
cd backend && node src/db/migrate.js && cd ..

# 3. Rebuild & restart all containers
docker compose -f backend/docker-compose.yml up --build -d

# 4. Check logs
docker compose -f backend/docker-compose.yml logs -f --tail=50
```

## Manual migration (if needed)

```bash
# Run inside backend container
docker exec -i kodeye_backend mysql -u root -p"$DB_PASSWORD" "$DB_NAME" < /app/src/db/migrations/023_create_quiz_tables.sql
```