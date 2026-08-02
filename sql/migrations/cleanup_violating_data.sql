-- ============================================================
-- AILOS 违规动态数据清理脚本
-- 在服务器 82.156.228.87 上执行
-- 数据库: PostgreSQL (xuewaiyu)
-- 执行方式: sudo -u postgres psql -d xuewaiyu -f cleanup_violating_data.sql
-- ============================================================

-- 1. 先备份相关表（安全第一）
CREATE TABLE IF NOT EXISTS "SocialTimeline_backup_$(date +%Y%m%d)" AS SELECT * FROM "SocialTimeline";
CREATE TABLE IF NOT EXISTS "SocialTimelineLike_backup_$(date +%Y%m%d)" AS SELECT * FROM "SocialTimelineLike";

-- 2. 查看违规内容（先查不删，确认范围）
SELECT id, "actorId", content, "createdAt" FROM "SocialTimeline"
WHERE content ~ '(法轮功|falun|六四|邪教|台独|港独|藏独|反华|反共|暴动|暴力|恐怖主义|炸弹|杀人|武器|弹药|色情|淫秽|嫖娼|卖淫|黄色|裸体|性服务|一夜情|约炮|毒品|吸毒|贩毒|大麻|冰毒|海洛因|可卡因|摇头丸|赌博|赌场|下注|诈骗|洗钱|传销|走私|贿赂|黑客|木马|钓鱼|盗号|自杀|自残|傻逼|操你|fuck|shit|bitch|去死|垃圾|白痴|脑残|弱智)'
ORDER BY "createdAt" DESC;

-- 3. 删除违规动态的关联点赞数据
DELETE FROM "SocialTimelineLike"
WHERE "postId" IN (
  SELECT id FROM "SocialTimeline"
  WHERE content ~ '(法轮功|falun|六四|邪教|台独|港独|藏独|反华|反共|暴动|暴力|恐怖主义|炸弹|杀人|武器|弹药|色情|淫秽|嫖娼|卖淫|黄色|裸体|性服务|一夜情|约炮|毒品|吸毒|贩毒|大麻|冰毒|海洛因|可卡因|摇头丸|赌博|赌场|下注|诈骗|洗钱|传销|走私|贿赂|黑客|木马|钓鱼|盗号|自杀|自残|傻逼|操你|fuck|shit|bitch|去死|垃圾|白痴|脑残|弱智)'
);

-- 4. 删除违规动态记录
DELETE FROM "SocialTimeline"
WHERE content ~ '(法轮功|falun|六四|邪教|台独|港独|藏独|反华|反共|暴动|暴力|恐怖主义|炸弹|杀人|武器|弹药|色情|淫秽|嫖娼|卖淫|黄色|裸体|性服务|一夜情|约炮|毒品|吸毒|贩毒|大麻|冰毒|海洛因|可卡因|摇头丸|赌博|赌场|下注|诈骗|洗钱|传销|走私|贿赂|黑客|木马|钓鱼|盗号|自杀|自残|傻逼|操你|fuck|shit|bitch|去死|垃圾|白痴|脑残|弱智)';

-- 5. 清理测试账号数据（识别测试账号：用户名包含test/测试/临时等）
-- 先查看测试账号
SELECT id, username, phone, email, "isGuest", "createdAt"
FROM "User"
WHERE username ~* '(test|测试|临时|demo|fake|guest|debug)'
   OR phone ~* '(1234|0000|9999|test)'
   OR email ~* '(test|example|fake|temp)'
ORDER BY "createdAt" DESC;

-- 6. 删除测试账号发布的动态
DELETE FROM "SocialTimeline"
WHERE "actorId" IN (
  SELECT id FROM "User"
  WHERE username ~* '(test|测试|临时|demo|fake|guest|debug)'
     OR phone ~* '(1234|0000|9999|test)'
     OR email ~* '(test|example|fake|temp)'
);

-- 7. 删除测试账号的点赞
DELETE FROM "SocialTimelineLike"
WHERE "userId" IN (
  SELECT id FROM "User"
  WHERE username ~* '(test|测试|临时|demo|fake|guest|debug)'
     OR phone ~* '(1234|0000|9999|test)'
     OR email ~* '(test|example|fake|temp)'
);

-- 8. 更新已有用户的默认头像为鹦鹉头像
UPDATE "User"
SET avatar = '/assets/images/default_avatar.png',
    "updatedAt" = NOW()
WHERE avatar IS NULL
   OR avatar = ''
   OR avatar = 'null';

-- 9. 验证清理结果
SELECT '=== 清理后违规动态数量 ===' AS info;
SELECT COUNT(*) AS violating_count FROM "SocialTimeline"
WHERE content ~ '(法轮功|falun|六四|邪教|台独|港独|藏独|反华|反共|暴动|暴力|恐怖主义|炸弹|杀人|武器|弹药|色情|淫秽|嫖娼|卖淫|黄色|裸体|性服务|一夜情|约炮|毒品|吸毒|贩毒|大麻|冰毒|海洛因|可卡因|摇头丸|赌博|赌场|下注|诈骗|洗钱|传销|走私|贿赂|黑客|木马|钓鱼|盗号|自杀|自残|傻逼|操你|fuck|shit|bitch|去死|垃圾|白痴|脑残|弱智)';

SELECT '=== 清理后测试账号动态数量 ===' AS info;
SELECT COUNT(*) AS test_posts FROM "SocialTimeline"
WHERE "actorId" IN (
  SELECT id FROM "User"
  WHERE username ~* '(test|测试|临时|demo|fake|guest|debug)'
     OR phone ~* '(1234|0000|9999|test)'
     OR email ~* '(test|example|fake|temp)'
);

SELECT '=== 无头像用户数量 ===' AS info;
SELECT COUNT(*) AS no_avatar FROM "User" WHERE avatar IS NULL OR avatar = '';

-- 10. 重启后端服务使敏感词过滤生效
-- \! cd /www/xuewaiyu-backend && pm2 restart xuewaiyu-backend
