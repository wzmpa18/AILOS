/**
 * 言道·西班牙语插件 - 主入口
 *
 * 严格遵循标准插件接口规范
 * 不侵入基座逻辑
 * 所有AI调用通过引擎转发至AI Gateway
 */
import { spanishPluginManifest } from './spanish-plugin.manifest';
import { spanishKnowledgeGraph } from './spanish-knowledge.graph';
import { spanishAssessmentRules } from './spanish-assessment.rules';
import { spanishPromptTemplates } from './spanish-prompt.templates';
import { spanishInteractionRules } from './spanish-interaction.rules';
import { spanishMaterialsBase } from './spanish-materials.base';

export const spanishPlugin = {
  manifest: spanishPluginManifest,
  knowledgeGraph: spanishKnowledgeGraph,
  assessmentRules: spanishAssessmentRules,
  promptTemplates: spanishPromptTemplates,
  interactionRules: spanishInteractionRules,
  materialsBase: spanishMaterialsBase,

  // 标准接口实现
  onLoad: () => {
    console.log(`[Plugin] 西班牙语插件已加载`);
    return { success: true };
  },

  onUnload: () => {
    console.log(`[Plugin] 西班牙语插件已卸载`);
    return { success: true };
  },

  onPause: () => {
    console.log(`[Plugin] 西班牙语插件已暂停`);
    return { success: true };
  },

  onResume: () => {
    console.log(`[Plugin] 西班牙语插件已恢复`);
    return { success: true };
  },

  getKnowledgeGraph: () => spanishKnowledgeGraph,
  getAssessmentRules: () => spanishAssessmentRules,
  getCustomPrompts: () => spanishPromptTemplates,
  getMaterials: () => spanishMaterialsBase,
  getInteractionRules: () => spanishInteractionRules,
};

export default spanishPlugin;
