/**
 * 言道·日语插件 v1.0.0
 *
 * 标准插件接口实现
 * 所有AI调用通过引擎转发至AI Gateway
 * 禁止直连模型API
 */
export const japanesePluginManifest = {
  id: 'yandao-japanese',
  name: '言道·日语',
  domain: 'japanese',
  version: '1.0.0',
  description: '日语学习领域插件，提供完整的语言学习支持',
  enabled: true,
  grayscaleRate: 100,
  dependencies: ['learning-engine', 'ai-gateway', 'asset-center'],
};
