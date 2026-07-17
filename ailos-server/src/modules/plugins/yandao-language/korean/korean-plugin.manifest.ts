/**
 * 言道·韩语插件 v1.0.0
 *
 * 标准插件接口实现
 * 所有AI调用通过引擎转发至AI Gateway
 * 禁止直连模型API
 */
export const koreanPluginManifest = {
  id: 'yandao-korean',
  name: '言道·韩语',
  domain: 'korean',
  version: '1.0.0',
  description: '韩语学习领域插件，提供完整的语言学习支持',
  enabled: true,
  grayscaleRate: 100,
  dependencies: ['learning-engine', 'ai-gateway', 'asset-center'],
};
