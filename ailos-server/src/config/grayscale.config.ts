/**
 * AILOS 灰度上线配置 v2.0.0
 * 按用户ID哈希分流，逐步放量
 */

interface FeatureConfig {
  enabled: boolean;
  rate: number;
  whitelist: string[];
}

interface GrayscaleFeatures {
  [key: string]: FeatureConfig;
}

export const GRAYSCALE_CONFIG = {
  // 灰度阶段定义
  stages: {
    canary: {
      rate: 0.01, // 1% 金丝雀
      duration: 86400, // 24小时
      autoPromote: true,
    },
    beta: {
      rate: 0.1, // 10% Beta
      duration: 172800, // 48小时
      autoPromote: true,
    },
    gradual_50: {
      rate: 0.5, // 50%
      duration: 86400,
      autoPromote: true,
    },
    full: {
      rate: 1.0, // 100% 全量
      duration: 0,
      autoPromote: false,
    },
  },

  // 功能灰度
  features: {
    new_ui: {
      enabled: true,
      rate: 0.0,
      whitelist: [] as string[],
    },
    ai_tutor: {
      enabled: true,
      rate: 0.0,
      whitelist: [] as string[],
    },
    community_v2: {
      enabled: false,
      rate: 0.0,
      whitelist: [] as string[],
    },
  } as GrayscaleFeatures,

  // Hash 参数
  hashSalt: 'AILOS_GRAYSCALE_SALT_V2',
};

/**
 * 判断用户是否在灰度范围内
 * 使用一致性哈希确保同一用户始终在同一组
 */
export function isUserInGrayscale(userId: string, featureKey: string): boolean {
  const features = GRAYSCALE_CONFIG.features;
  const feature = features[featureKey];
  if (!feature || !feature.enabled) return false;

  // 白名单用户直接放行
  if (feature.whitelist.includes(userId)) return true;

  // 一致性哈希
  const hash = simpleHash(userId + GRAYSCALE_CONFIG.hashSalt + featureKey);
  return (hash % 10000) / 10000 < feature.rate;
}

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}
