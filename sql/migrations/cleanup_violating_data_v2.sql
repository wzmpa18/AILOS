-- ============================================================
-- 言道 AILOS - 违规动态全量清理脚本 v2.0
-- 执行方式: sudo -u postgres psql -d xuewaiyu -f cleanup_violating_data_v2.sql
-- 日期: 2026-08-02
-- 说明: 全量扫描 SocialTimeline 表，删除所有包含违规内容的动态
-- ============================================================

BEGIN;

-- Step 1: 备份完整表（安全措施）
CREATE TABLE IF NOT EXISTS "SocialTimeline_backup_20260802_v2" AS SELECT * FROM "SocialTimeline";
SELECT 'Backup created: ' || count(*) || ' rows' FROM "SocialTimeline_backup_20260802_v2";

-- Step 2: 统计违规动态数量（执行前检查）
SELECT 'Before cleanup: ' || count(*) || ' violating posts found' AS info
FROM "SocialTimeline"
WHERE
  -- 政治/邪教类
  content ~* '(法轮功|falungong|falun|法輪功|六四|天安门|天安門|邪教|反共|反党|颠覆|煽动|分裂国家)'
  -- 色情类
  OR content ~* '(色情|porn|sex|成人|黄色|裸体|卖淫|賣淫|淫秽|淫穢|av女优|一夜情|约炮|約砲)'
  -- 暴力类
  OR content ~* '(暴力|杀人|殺人|砍人|炸弹|炸彈|恐怖袭击|恐怖襲擊|自杀|自殺|自残|自殘)'
  -- 毒品类
  OR content ~* '(毒品|大麻|冰毒|海洛因|可卡因|摇头丸|吸毒|贩毒|販毒)'
  -- 赌博类
  OR content ~* '(赌博|賭博|博彩|彩票|赌场|賭場|下注|押注|外围彩)'
  -- 诈骗类
  OR content ~* '(诈骗|詐騙|骗子|騙子|刷单|刷單|代刷|兼职刷|兼職刷|网赚|網賺|传销|傳銷)'
  -- 测试脏数据
  OR content ~* '(test|测试|測試|aaa|bbb|ccc|ddd|eee|fff|ggg|hhh|测试数据|測試數據|test123|asdf|qwerty)'
  OR content ~ '^(test|测试|測試|aaa|bbb|ccc|123|abcdef)'
  -- 无意义内容
  OR content ~* '(弱智|傻逼|sb|草泥马|操你|滚蛋|废物|廢物|垃圾|去死|滚|媽的|妈的|他妈|她妈)'
  -- 广告引流
  OR content ~* '(加微信|加v信|加V|微信号|微信號|扫码|掃碼|加群|私聊|代购|代購|低价|低價|免费领|免費領)'
  -- 联系方式（纯数字11位手机号）
  OR content ~ '1[3-9][0-9]{9}'
  -- QQ号
  OR content ~* '(qq群|QQ群|加qq|加QQ|qq号|QQ号)'
  -- URL外链
  OR content ~* '(https?://[^\s]+)';

-- Step 3: 删除违规动态的点赞记录（外键约束）
DELETE FROM "SocialTimelineLike"
WHERE "postId" IN (
  SELECT id FROM "SocialTimeline"
  WHERE
    content ~* '(法轮功|falungong|falun|法輪功|六四|天安门|天安門|邪教|反共|反党|颠覆|煽动|分裂国家)'
    OR content ~* '(色情|porn|sex|成人|黄色|裸体|卖淫|賣淫|淫秽|淫穢|av女优|一夜情|约炮|約砲)'
    OR content ~* '(暴力|杀人|殺人|砍人|炸弹|炸彈|恐怖袭击|恐怖襲擊|自杀|自殺|自残|自殘)'
    OR content ~* '(毒品|大麻|冰毒|海洛因|可卡因|摇头丸|吸毒|贩毒|販毒)'
    OR content ~* '(赌博|賭博|博彩|彩票|赌场|賭場|下注|押注|外围彩)'
    OR content ~* '(诈骗|詐騙|骗子|騙子|刷单|刷單|代刷|兼职刷|兼職刷|网赚|網賺|传销|傳銷)'
    OR content ~* '(test|测试|測試|aaa|bbb|ccc|ddd|eee|fff|ggg|hhh|测试数据|測試數據|test123|asdf|qwerty)'
    OR content ~ '^(test|测试|測試|aaa|bbb|ccc|123|abcdef)'
    OR content ~* '(弱智|傻逼|sb|草泥马|操你|滚蛋|废物|廢物|垃圾|去死|滚|媽的|妈的|他妈|她妈)'
    OR content ~* '(加微信|加v信|加V|微信号|微信號|扫码|掃碼|加群|私聊|代购|代購|低价|低價|免费领|免費領)'
    OR content ~ '1[3-9][0-9]{9}'
    OR content ~* '(qq群|QQ群|加qq|加QQ|qq号|QQ号)'
    OR content ~* '(https?://[^\s]+)'
);

-- Step 4: 删除违规动态（硬删除）
DELETE FROM "SocialTimeline"
WHERE
  content ~* '(法轮功|falungong|falun|法輪功|六四|天安门|天安門|邪教|反共|反党|颠覆|煽动|分裂国家)'
  OR content ~* '(色情|porn|sex|成人|黄色|裸体|卖淫|賣淫|淫秽|淫穢|av女优|一夜情|约炮|約砲)'
  OR content ~* '(暴力|杀人|殺人|砍人|炸弹|炸彈|恐怖袭击|恐怖襲擊|自杀|自殺|自残|自殘)'
  OR content ~* '(毒品|大麻|冰毒|海洛因|可卡因|摇头丸|吸毒|贩毒|販毒)'
  OR content ~* '(赌博|賭博|博彩|彩票|赌场|賭場|下注|押注|外围彩)'
  OR content ~* '(诈骗|詐騙|骗子|騙子|刷单|刷單|代刷|兼职刷|兼職刷|网赚|網賺|传销|傳銷)'
  OR content ~* '(test|测试|測試|aaa|bbb|ccc|ddd|eee|fff|ggg|hhh|测试数据|測試數據|test123|asdf|qwerty)'
  OR content ~ '^(test|测试|測試|aaa|bbb|ccc|123|abcdef)'
  OR content ~* '(弱智|傻逼|sb|草泥马|操你|滚蛋|废物|廢物|垃圾|去死|滚|媽的|妈的|他妈|她妈)'
  OR content ~* '(加微信|加v信|加V|微信号|微信號|扫码|掃碼|加群|私聊|代购|代購|低价|低價|免费领|免費領)'
  OR content ~ '1[3-9][0-9]{9}'
  OR content ~* '(qq群|QQ群|加qq|加QQ|qq号|QQ号)'
  OR content ~* '(https?://[^\s]+)';

-- Step 5: 统计清理后的剩余动态数量
SELECT 'After cleanup: ' || count(*) || ' posts remaining' AS info FROM "SocialTimeline";

COMMIT;

-- 验证：检查是否还有违规内容残留
SELECT 'Verification: ' || count(*) || ' violating posts still exist' AS warning
FROM "SocialTimeline"
WHERE
  content ~* '(法轮功|falungong|falun|六四|邪教|色情|porn|暴力|杀人|毒品|大麻|赌博|诈骗|刷单|弱智|傻逼|加微信|微信号)'
  OR content ~ '^(test|测试|aaa|bbb|ccc|123)';
