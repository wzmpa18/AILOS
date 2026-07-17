/**
 * 言道·韩语插件 - 主入口
 *
 * 严格遵循标准插件接口规范
 * 不侵入基座逻辑
 * 所有AI调用通过引擎转发至AI Gateway
 */
import { koreanPluginManifest } from './korean-plugin.manifest';
import { koreanKnowledgeGraph } from './korean-knowledge.graph';
import { koreanAssessmentRules } from './korean-assessment.rules';
import { koreanPromptTemplates } from './korean-prompt.templates';
import { koreanInteractionRules } from './korean-interaction.rules';
import { koreanMaterialsBase } from './korean-materials.base';

export const koreanPlugin = {
  manifest: koreanPluginManifest,
  knowledgeGraph: koreanKnowledgeGraph,
  assessmentRules: koreanAssessmentRules,
  promptTemplates: koreanPromptTemplates,
  interactionRules: koreanInteractionRules,
  materialsBase: koreanMaterialsBase,

  // 标准接口实现
  onLoad: () => {
    console.log(`[Plugin] 韩语插件已加载`);
    return { success: true };
  },

  onUnload: () => {
    console.log(`[Plugin] 韩语插件已卸载`);
    return { success: true };
  },

  onPause: () => {
    console.log(`[Plugin] 韩语插件已暂停`);
    return { success: true };
  },

  onResume: () => {
    console.log(`[Plugin] 韩语插件已恢复`);
    return { success: true };
  },

  getKnowledgeGraph: () => koreanKnowledgeGraph,
  getAssessmentRules: () => koreanAssessmentRules,
  getCustomPrompts: () => koreanPromptTemplates,
  getMaterials: () => koreanMaterialsBase,
  getInteractionRules: () => koreanInteractionRules,
};

export default koreanPlugin;
