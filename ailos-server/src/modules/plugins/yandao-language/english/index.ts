/**
 * 言道·英语插件 - 主入口
 *
 * 严格遵循标准插件接口规范
 * 不侵入基座逻辑
 * 所有AI调用通过引擎转发至AI Gateway
 */
import { englishPluginManifest } from './english-plugin.manifest';
import { englishKnowledgeGraph } from './english-knowledge.graph';
import { englishAssessmentRules } from './english-assessment.rules';
import { englishPromptTemplates } from './english-prompt.templates';
import { englishInteractionRules } from './english-interaction.rules';
import { englishMaterialsBase } from './english-materials.base';

export const englishPlugin = {
  manifest: englishPluginManifest,
  knowledgeGraph: englishKnowledgeGraph,
  assessmentRules: englishAssessmentRules,
  promptTemplates: englishPromptTemplates,
  interactionRules: englishInteractionRules,
  materialsBase: englishMaterialsBase,

  // 标准接口实现
  onLoad: () => {
    console.log(`[Plugin] 英语插件已加载`);
    return { success: true };
  },

  onUnload: () => {
    console.log(`[Plugin] 英语插件已卸载`);
    return { success: true };
  },

  onPause: () => {
    console.log(`[Plugin] 英语插件已暂停`);
    return { success: true };
  },

  onResume: () => {
    console.log(`[Plugin] 英语插件已恢复`);
    return { success: true };
  },

  getKnowledgeGraph: () => englishKnowledgeGraph,
  getAssessmentRules: () => englishAssessmentRules,
  getCustomPrompts: () => englishPromptTemplates,
  getMaterials: () => englishMaterialsBase,
  getInteractionRules: () => englishInteractionRules,
};

export default englishPlugin;
