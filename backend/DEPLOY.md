# Deploy

```bash
# 1. Pull changes
git pull

# 2. Rebuild & restart all containers
docker compose up --build -d

# 3. Check logs
docker compose logs -f --tail=50
```
