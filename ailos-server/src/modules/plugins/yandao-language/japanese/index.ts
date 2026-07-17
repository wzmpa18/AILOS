/**
 * 言道·日语插件 - 主入口
 *
 * 严格遵循标准插件接口规范
 * 不侵入基座逻辑
 * 所有AI调用通过引擎转发至AI Gateway
 */
import { japanesePluginManifest } from './japanese-plugin.manifest';
import { japaneseKnowledgeGraph } from './japanese-knowledge.graph';
import { japaneseAssessmentRules } from './japanese-assessment.rules';
import { japanesePromptTemplates } from './japanese-prompt.templates';
import { japaneseInteractionRules } from './japanese-interaction.rules';
import { japaneseMaterialsBase } from './japanese-materials.base';

export const japanesePlugin = {
  manifest: japanesePluginManifest,
  knowledgeGraph: japaneseKnowledgeGraph,
  assessmentRules: japaneseAssessmentRules,
  promptTemplates: japanesePromptTemplates,
  interactionRules: japaneseInteractionRules,
  materialsBase: japaneseMaterialsBase,

  // 标准接口实现
  onLoad: () => {
    console.log(`[Plugin] 日语插件已加载`);
    return { success: true };
  },

  onUnload: () => {
    console.log(`[Plugin] 日语插件已卸载`);
    return { success: true };
  },

  onPause: () => {
    console.log(`[Plugin] 日语插件已暂停`);
    return { success: true };
  },

  onResume: () => {
    console.log(`[Plugin] 日语插件已恢复`);
    return { success: true };
  },

  getKnowledgeGraph: () => japaneseKnowledgeGraph,
  getAssessmentRules: () => japaneseAssessmentRules,
  getCustomPrompts: () => japanesePromptTemplates,
  getMaterials: () => japaneseMaterialsBase,
  getInteractionRules: () => japaneseInteractionRules,
};

export default japanesePlugin;
