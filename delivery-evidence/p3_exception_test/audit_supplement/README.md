# P3 Supplementary Archive
# Generated: 2026-07-28T11:25:18.597759

## 0.1 PM2 Full Status
```
┌────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ xuewaiyu-backend    │ default     │ 1.0.0   │ cluster │ 2775347  │ 91m    │ 143  │ online    │ 0%       │ 114.0mb  │ root     │ disabled │
└────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## 0.1b PM2 Describe (xuewaiyu-backend)
```
Describing process with id 0 - name xuewaiyu-backend 
┌────────────────────┬───────────────────────────────────────────┬─────────────┐
│ status             │ online                                    │
│ name               │ xuewaiyu-backend                          │
│ namespace          │ default                                   │
│ version            │ 1.0.0                                     │
│ restarts           │ 143                                       │
│ max memory restart │ 536870912                                 │
│ cron restart       │ 0 3 * * *                                 │
│ uptime             │ 91m                                       │
│ script path        │ /www/xuewaiyu-backend/src/server/index.js │
│ script args        │ N/A                                       │
│ error log path     │ /www/xuewaiyu-backend/logs/pm2-error.log  │
│ out log path       │ /www/xuewaiyu-backend/logs/pm2-out.log    │
│ pid path           │ /root/.pm2/pids/xuewaiyu-backend-0.pid    │
│ interpreter        │ node                                      │
│ interpreter args   │ --max-old-space-size=512                  │ --expose-gc │
│ script id          │ 0                                         │
│ exec cwd           │ /www/xuewaiyu-backend                     │
│ exec mode          │ cluster_mode                              │
│ node.js version    │ 22.23.0                                   │
│ node env           │ production                                │
│ watch & reload     │ ✘                                         │
│ unstable restarts  │ 0                                         │
│ created at         │ 2026-07-28T00:53:38.265Z                  │
└────────────────────┴───────────────────────────────────────────┴─────────────┘
Process configuration
┌──────────────────────┬─────────────┐
│ RATE_LIMIT_WHITELIST │ 13480010005 │
└──────────────────────┴─────────────┘
```

## 0.2 Health Full Response
```
{"success":true,"status":"healthy","timestamp":"2026-07-28T02:25:16.362Z"}
```

## 0.3 Core Fix Online Sampling (Billing Idempotency)
```
ERR:Invalid response body while trying to fetch http://localhost:3000/api/auth/password: Premature close
```

## 0.4 Test Account Cleanup
```
Error: column "%test_p3_%@xuewaiyu.local" does not exist
```
