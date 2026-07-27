/**
 * src/services/deviceRiskService.js
 * 第三阶段 P1 — 设备指纹风控（免费试用防薅）
 *
 * 防线设计（服务端强制，前端指纹仅作为信号输入）：
 *  1) 设备维度：浏览器特征指纹（X-Device-Fp 头，服务端 SHA-256 归一化）
 *  2) IP 维度：/24 前缀日频控（无指纹请求的兜底防线，防绕过）
 *  3) 绑定规则：单设备最多绑定 2 个账号；超限账号在该设备上不可领取试用
 *  4) 试用规则：每设备终身一次 —— 首个在该设备实际消耗试用时长的账号成为 owner，
 *     同设备切换其他账号不可再领（owner 本人不受影响，可继续用完自己的试用）
 *  5) 兼容规则：仅限制免费试用领取；订阅/按量包/正常多设备登录完全不受影响
 *  6) 降级规则：Redis 故障 fail-open（记告警，不阻断业务）
 */
const crypto = require('crypto');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const MAX_ACCOUNTS_PER_DEVICE = 2; // 单设备最多绑定账号数
const IP_PREFIX_DAILY_TRIAL_LIMIT = 5; // 单 /24 IP 前缀每日试用领取上限（兜底）
const DEVICE_KEY_TTL_SEC = 180 * 86400; // 设备键 180 天滑动过期
const IPQ_TTL_SEC = 2 * 86400; // IP 频控键 2 天过期

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

class DeviceRiskService {
  /** 归一化前端指纹：非空字符串 → sha256 截断；无效 → null */
  normalizeFp(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const s = raw.trim().slice(0, 256);
    if (s.length < 8) return null;
    return crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);
  }

  /** 提取客户端 IP 前缀（nginx X-Forwarded-For 优先；IPv4 → /24） */
  ipPrefixFrom(req) {
    const xff = String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim();
    const ip = xff || req.ip || (req.socket && req.socket.remoteAddress) || '';
    const v4 = ip.replace(/^::ffff:/, '');
    const m = v4.match(/^(\d+\.\d+\.\d+)\.\d+$/);
    if (m) return m[1] + '.0/24';
    return v4 || 'unknown';
  }

  /**
   * 风控评估（authenticate 之后的中间件调用）
   * @returns {Promise<{fpHash, ipPrefix, trialAllowed, reason, boundAccounts}>}
   */
  async evaluate(userId, fpHash, ipPrefix) {
    const out = { fpHash: fpHash || null, ipPrefix, trialAllowed: true, reason: null, boundAccounts: 0 };
    try {
      const ipqKey = `dfp:ipq:${ipPrefix}:${dayKey()}`;
      const ipCount = Number(await redis.get(ipqKey)) || 0;

      if (!fpHash) {
        // 无指纹（老客户端/接口直连）：仅 IP 前缀兜底
        if (ipCount >= IP_PREFIX_DAILY_TRIAL_LIMIT) {
          out.trialAllowed = false;
          out.reason = 'IP_PREFIX_LIMIT';
          logger.warn('[DeviceRisk] 无指纹请求命中 IP 前缀日频控，试用禁止', { userId, ipPrefix, ipCount });
        }
        return out;
      }

      // 1) 设备-账号绑定（上限 2；仅影响试用领取，不影响登录使用）
      const accKey = `dfp:acc:${fpHash}`;
      const isMember = (await redis.sismember(accKey, userId)) === 1;
      let size = Number(await redis.scard(accKey)) || 0;
      if (!isMember) {
        if (size >= MAX_ACCOUNTS_PER_DEVICE) {
          out.trialAllowed = false;
          out.reason = 'DEVICE_ACCOUNT_LIMIT';
          logger.warn('[DeviceRisk] 设备绑定账号数超限，试用禁止', { userId, fpHash, ipPrefix, boundAccounts: size });
        } else {
          await redis.sadd(accKey, userId);
          await redis.expire(accKey, DEVICE_KEY_TTL_SEC);
          size += 1;
        }
      }
      out.boundAccounts = size;

      // 2) 设备试用终身一次（owner 判定）
      if (out.trialAllowed) {
        const owner = await redis.get(`dfp:trial:${fpHash}`);
        if (owner && owner !== userId) {
          out.trialAllowed = false;
          out.reason = 'DEVICE_TRIAL_CLAIMED';
          logger.warn('[DeviceRisk] 同设备试用已被其他账号领取，试用禁止', {
            userId,
            ownerUserId: owner,
            fpHash,
            ipPrefix,
          });
        } else if (!owner && ipCount >= IP_PREFIX_DAILY_TRIAL_LIMIT) {
          // 3) 新设备首领取叠加 IP 前缀日频控（防批量伪造指纹）
          out.trialAllowed = false;
          out.reason = 'IP_PREFIX_LIMIT';
          logger.warn('[DeviceRisk] IP 前缀当日试用领取超限，试用禁止', { userId, fpHash, ipPrefix, ipCount });
        }
      }
    } catch (err) {
      // fail-open：风控不可用时不阻断业务（可用性优先），仅记录
      out.trialAllowed = true;
      out.reason = 'RISK_CHECK_UNAVAILABLE';
      logger.warn('[DeviceRisk] 风控检查降级(fail-open)', { userId, error: err.message });
    }
    return out;
  }

  /** 试用实际扣减成功后登记设备 owner + IP 前缀计数（NX，仅首领取生效） */
  async registerTrialClaim(userId, device) {
    if (!device || !device.ipPrefix) return;
    try {
      let firstClaim = false;
      if (device.fpHash) {
        const r = await redis.set(`dfp:trial:${device.fpHash}`, userId, 'EX', DEVICE_KEY_TTL_SEC, 'NX');
        firstClaim = r === 'OK';
      } else {
        // 无指纹：按 IP 前缀 + 用户/日 去重计数
        const markKey = `dfp:ipm:${device.ipPrefix}:${userId}:${dayKey()}`;
        const r = await redis.set(markKey, '1', 'EX', IPQ_TTL_SEC, 'NX');
        firstClaim = r === 'OK';
      }
      if (firstClaim) {
        const ipqKey = `dfp:ipq:${device.ipPrefix}:${dayKey()}`;
        await redis.incr(ipqKey);
        await redis.expire(ipqKey, IPQ_TTL_SEC);
        logger.info('[DeviceRisk] 设备试用领取登记', { userId, fpHash: device.fpHash, ipPrefix: device.ipPrefix });
      }
    } catch (err) {
      logger.warn('[DeviceRisk] 试用领取登记失败(不阻断)', { userId, error: err.message });
    }
  }
}

let instance = null;
function getDeviceRiskService() {
  if (!instance) instance = new DeviceRiskService();
  return instance;
}

module.exports = {
  DeviceRiskService,
  getDeviceRiskService,
  MAX_ACCOUNTS_PER_DEVICE,
  IP_PREFIX_DAILY_TRIAL_LIMIT,
};
