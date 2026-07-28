# AILOS Production Operations Manual
Version: 1.0.0-rc
Date: 2026-07-28T11:29:53.367237
Status: Production Ready

## 1. Service Management

### Start
```bash
cd /www/xuewaiyu-backend
pm2 start ecosystem.config.js --env production
```

### Stop
```bash
pm2 stop xuewaiyu-backend
```

### Restart
```bash
pm2 restart xuewaiyu-backend
```

### Logs
```bash
pm2 logs xuewaiyu-backend
```

## 2. Deployment

### Standard Deploy
```bash
cd /www/xuewaiyu-backend
bash deploy.sh
```

### Verify Deploy
```bash
curl http://localhost:3000/api/health
pm2 status | grep xuewaiyu
```

## 3. Database Backup & Restore

### Backup
```bash
cd /www/xuewaiyu-backend
bash scripts/backup_db.sh
```

### Restore
```bash
gunzip -c /www/xuewaiyu-backend/backups/ailos_backup_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

## 4. Emergency Procedures

### Service Down
1. Check PM2: `pm2 status`
2. Check logs: `pm2 logs xuewaiyu-backend --lines 50`
3. Restart: `pm2 restart xuewaiyu-backend`
4. If still down: `cd /www/xuewaiyu-backend && bash deploy.sh`

### Data Corruption
1. Stop service: `pm2 stop xuewaiyu-backend`
2. Restore from latest backup
3. Verify: `curl http://localhost:3000/api/health`
4. Start service: `pm2 start xuewaiyu-backend`

### Billing Anomaly
1. Check billing logs: `pm2 logs xuewaiyu-backend | grep -i bill`
2. Check balances: query TranslationBillingBalance in DB
3. If needed: halt billing endpoint manually

## 5. Health Checks

| Check | Command | Expected |
|---|---|---|
| API Health | curl localhost:3000/api/health | 200, status=healthy |
| PM2 | pm2 status | online |
| DB | npx prisma db push --dry-run | No changes needed |
| Redis | redis-cli ping | PONG |
| Disk | df -h / | < 80% used |

## 6. Contacts
- Emergency: Project Lead
- Escalation: See /docs/emergency_contacts.md
