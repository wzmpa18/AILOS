# Sprint_V6.2_Fault_SOP.md
> 配套文档：AILOS_MASTER_LEDGER.md V7.1 Enterprise Freeze
> 定位：故障排查操作手册，集中存放bash/curl/sql长脚本，总账第20.7章引用
> 使用方式：故障发生时复制对应命令块到服务器终端执行

=============================================================
## 1. PM2 故障排查
### 1.1 PM2状态检查
```bash
pm2 status
pm2 list
pm2 describe xuewaiyu-backend
```

### 1.2 PM2启动/重启
```bash
cd /www/xuewaiyu-backend
pm2 start ecosystem.config.js --env production
pm2 restart xuewaiyu-backend
pm2 save
pm2 startup systemd -u root --hp /root
```

### 1.3 PM2日志查看
```bash
pm2 logs xuewaiyu-backend --lines 100
pm2 logs xuewaiyu-backend --err --lines 50
```

### 1.4 PM2内存超限处置
```bash
pm2 reload xuewaiyu-backend --max-memory-restart 512M
```

=============================================================
## 2. Nginx 故障排查
### 2.1 Nginx状态检查
```bash
systemctl status nginx --no-pager
nginx -t
ss -tlnp | grep -E '80|443'
```

### 2.2 Nginx重载/重启
```bash
systemctl reload nginx
systemctl restart nginx
```

### 2.3 Nginx日志查看
```bash
tail -n 100 /var/log/nginx/access.log
tail -n 100 /var/log/nginx/error.log
```

### 2.4 Nginx配置备份
```bash
cp /etc/nginx/sites-enabled/default /etc/nginx/backup/default.bak.$(date +%Y%m%d_%H%M%S)
```

=============================================================
## 3. Redis 故障排查
### 3.1 Redis状态检查
```bash
redis-cli ping
redis-cli INFO memory
redis-cli INFO stats
```

### 3.2 Redis内存满处置
```bash
redis-cli INFO keyspace
redis-cli --bigkeys
redis-cli FLUSHDB  # 谨慎：仅清空当前DB临时数据
```

### 3.3 Redis Key检查
```bash
redis-cli KEYS "ailos:*"
redis-cli TTL "ailos:quota:USERID:DATE:conversation"
```

=============================================================
## 4. PostgreSQL 故障排查
### 4.1 数据库状态检查
```bash
systemctl status postgresql --no-pager
```

### 4.2 数据库连接检查
```bash
psql -U postgres -d xuewaiyu -c "SELECT count(*) FROM users;"
psql -U postgres -d xuewaiyu -c "SELECT count(*) FROM aiRequestLog;"
```

### 4.3 数据库迁移
```bash
cd /www/xuewaiyu-backend
npx prisma migrate deploy
npx prisma migrate status
```

### 4.4 数据库备份
```bash
pg_dump -U postgres xuewaiyu > /backup/postgres/xuewaiyu_$(date +%Y%m%d_%H%M%S).sql
```

=============================================================
## 5. 后端API全链路诊断
### 5.1 端口监听检查
```bash
ss -tlnp | grep -E '3000|80|443|22|5432|6379'
```

### 5.2 健康检查
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
```

### 5.3 登录API测试
```bash
curl -s -X POST http://localhost:3000/api/auth/password \
  -H "Content-Type: application/json" \
  -d '{"account":"+8613480010005","password":"Test123456"}'
```

### 5.4 配额API测试
```bash
TOKEN="YOUR_TOKEN_HERE"
curl -s http://localhost:3000/api/ai/quota -H "Authorization: Bearer $TOKEN"
```

### 5.5 外部全链路测试
```bash
curl -s -X POST https://www.yandao.vip/api/auth/password \
  -H "Content-Type: application/json" \
  -d '{"account":"+8613480010005","password":"Test123456"}'
```

=============================================================
## 6. SSH故障排查
### 6.1 SSH服务状态
```bash
systemctl status sshd --no-pager
ss -tlnp | grep :22
```

### 6.2 SSH配置检查
```bash
cat /etc/ssh/sshd_config | grep -E "^Port|^ListenAddress|^MaxStartups|^UseDNS|^PermitRootLogin|^PasswordAuthentication" | grep -v "^#"
```

### 6.3 SSH连接测试
```bash
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@localhost "echo SSH_LOCAL_OK"
```

### 6.4 SSH端口修改（如需要）
```bash
sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config
systemctl restart sshd
```

=============================================================
## 7. 磁盘/内存/CPU诊断
### 7.1 磁盘使用
```bash
df -h
du -sh /www/xuewaiyu-backend
du -sh /var/log
```

### 7.2 内存使用
```bash
free -h
pm2 status
```

### 7.3 CPU使用
```bash
top -bn1 | head -20
```

### 7.4 日志清理
```bash
pm2 flush
journalctl --vacuum-size=100M
```

=============================================================
## 8. BUG-010 登录跳转异常专项排查
### 8.1 Nginx重定向规则检查
```bash
cat /etc/nginx/sites-enabled/default | grep -A 10 "location"
```

### 8.2 login.html跳转逻辑检查
```bash
grep -n "window.location\|redirect\|/home" /www/xuewaiyu/login.html
```

### 8.3 后端中间件鉴权检查
```bash
grep -rn "redirect\|/login" /www/xuewaiyu-backend/src/server/middleware/
grep -rn "redirect\|/login" /www/xuewaiyu-backend/src/server/index.js
```

### 8.4 其他页面auth guard检查
```bash
grep -rn "yandao_token\|redirect\|/login" /www/xuewaiyu/home.html | head -10
grep -rn "yandao_token\|redirect\|/login" /www/xuewaiyu/chat.html | head -10
```

=============================================================
End of Sprint_V6.2_Fault_SOP.md