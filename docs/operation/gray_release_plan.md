# AILOS Gray Release Plan
Date: 2026-07-28T11:29:53.367237

## Strategy: Phased Rollout

### Phase 1: Internal (0-2 hours)
- **Users**: Admin + test accounts only
- **Ratio**: 0% public traffic
- **Duration**: 2 hours
- **Verification**: All health endpoints, billing flow, AI chat
- **Rollback trigger**: Any 500 errors or billing anomalies

### Phase 2: 10% Traffic (2-24 hours)
- **Users**: 10% of active users (random selection)
- **Duration**: 22 hours (overnight observation)
- **Verification**: Error rate < 1%, billing consistency, response times
- **Rollback trigger**: Error rate > 1%, any P0 defect found

### Phase 3: 50% Traffic (24-48 hours)
- **Users**: 50% of users
- **Duration**: 24 hours
- **Verification**: Full business metrics, user feedback
- **Rollback trigger**: Error rate > 0.5%, user complaints > 3

### Phase 4: 100% Full Release
- **Users**: All users
- **Duration**: Ongoing
- **Verification**: Production monitoring
- **Rollback ability**: Keep previous version tag for 72 hours

## Rollback Procedure
```bash
# Rollback to previous version
cd /www/xuewaiyu-backend
git checkout <previous-stable-tag>
bash deploy.sh
pm2 restart xuewaiyu-backend
curl http://localhost:3000/api/health
```
