/**
 * 言道·德语插件 - 主入口
 *
 * 严格遵循标准插件接口规范
 * 不侵入基座逻辑
 * 所有AI调用通过引擎转发至AI Gateway
 */
import { germanPluginManifest } from './german-plugin.manifest';
import { germanKnowledgeGraph } from './german-knowledge.graph';
import { germanAssessmentRules } from './german-assessment.rules';
import { germanPromptTemplates } from './german-prompt.templates';
import { germanInteractionRules } from './german-interaction.rules';
import { germanMaterialsBase } from './german-materials.base';

export const germanPlugin = {
  manifest: germanPluginManifest,
  knowledgeGraph: germanKnowledgeGraph,
  assessmentRules: germanAssessmentRules,
  promptTemplates: germanPromptTemplates,
  interactionRules: germanInteractionRules,
  materialsBase: germanMaterialsBase,

  // 标准接口实现
  onLoad: () => {
    console.log(`[Plugin] 德语插件已加载`);
    return { success: true };
  },

  onUnload: () => {
    console.log(`[Plugin] 德语插件已卸载`);
    return { success: true };
  },

  onPause: () => {
    console.log(`[Plugin] 德语插件已暂停`);
    return { success: true };
  },

  onResume: () => {
    console.log(`[Plugin] 德语插件已恢复`);
    return { success: true };
  },

  getKnowledgeGraph: () => germanKnowledgeGraph,
  getAssessmentRules: () => germanAssessmentRules,
  getCustomPrompts: () => germanPromptTemplates,
  getMaterials: () => germanMaterialsBase,
  getInteractionRules: () => germanInteractionRules,
};

export default germanPlugin;
