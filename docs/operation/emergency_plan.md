# AILOS Production Emergency Response Plan
Date: 2026-07-28T11:29:53.367237

## Scenario 1: Service Unavailable
- **Trigger**: Health check returns non-200, PM2 shows crashed/errored
- **Level**: P0
- **Response**:
  1. Check PM2 status: `pm2 status`
  2. Check recent logs: `pm2 logs xuewaiyu-backend --lines 100 --err`
  3. Attempt restart: `pm2 restart xuewaiyu-backend`
  4. If restart fails: `cd /www/xuewaiyu-backend && bash deploy.sh`
  5. Escalate if not recovered in 5 min
- **RTO**: 5 minutes

## Scenario 2: Data Anomaly
- **Trigger**: Incorrect billing balances, missing data, corruption detected
- **Level**: P0
- **Response**:
  1. Stop write operations: halt billing/consume endpoints
  2. Identify affected data scope
  3. Restore from latest backup if needed
  4. Verify: spot-check balances and key tables
  5. Resume operations after verification
- **RTO**: 10 minutes

## Scenario 3: Billing/Financial Risk
- **Trigger**: Unexpected balance deductions, trial abuse detected, abnormal charges
- **Level**: P0
- **Response**:
  1. Immediately suspend billing: `pm2 stop xuewaiyu-backend` if severe
  2. Audit billing logs and TranslationBillingBalance
  3. Identify affected users and amounts
  4. Fix root cause before resuming
  5. Process refunds/credits as needed
- **RTO**: 15 minutes

## Escalation Path
1. On-call engineer (15 min) -> 
2. Tech lead (30 min) -> 
3. Project owner (1 hour)
