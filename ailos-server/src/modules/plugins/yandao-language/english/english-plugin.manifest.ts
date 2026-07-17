/**
 * 言道·英语插件 v1.0.0
 *
 * 标准插件接口实现
 * 所有AI调用通过引擎转发至AI Gateway
 * 禁止直连模型API
 */
export const englishPluginManifest = {
  id: 'yandao-english',
  name: '言道·英语',
  domain: 'english',
  version: '1.0.0',
  description: '英语学习领域插件，提供完整的语言学习支持',
  enabled: true,
  grayscaleRate: 100,
  dependencies: ['learning-engine', 'ai-gateway', 'asset-center'],
};
