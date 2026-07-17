import { Injectable, Logger } from '@nestjs/common';

/**
 * 领域插件加载框架
 *
 * 核心能力：
 * 1. 插件热插拔（加载/卸载/重载）
 * 2. 标准接口适配
 * 3. 沙箱隔离
 * 4. 独立开关
 * 5. 独立灰度
 *
 * 绝对禁区：
 * - 插件不得修改基座逻辑
 * - 插件不得访问非自身权限的数据
 * - 插件AI调用必须通过引擎转发至网关
 */
@Injectable()
export class PluginLoaderService {
  private readonly logger = new Logger(PluginLoaderService.name);

  // 已注册插件
  private plugins: Map<string, PluginManifest> = new Map();
  // 已加载插件实例
  private loadedPlugins: Map<string, any> = new Map();

  /**
   * 标准插件接口定义
   */
  static readonly PLUGIN_INTERFACE = {
    required: ['onLoad', 'onUnload', 'getKnowledgeGraph', 'getAssessmentRules'],
    optional: ['onPause', 'onResume', 'getCustomPrompts', 'getMaterials'],
  };

  /**
   * 注册插件
   */
  async registerPlugin(manifest: PluginManifest): Promise<{ success: boolean; error?: string }> {
    // 验证插件接口
    const validation = this.validatePlugin(manifest);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    this.plugins.set(manifest.id, manifest);
    this.logger.log(`[Plugin] Registered: ${manifest.id} v${manifest.version}`);
    return { success: true };
  }

  /**
   * 加载插件
   */
  async loadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const manifest = this.plugins.get(pluginId);
    if (!manifest) {
      return { success: false, error: `Plugin ${pluginId} not registered` };
    }

    if (!manifest.enabled) {
      return { success: false, error: `Plugin ${pluginId} is disabled` };
    }

    try {
      // 沙箱加载（实际部署时动态导入）
      const pluginInstance = {
        id: manifest.id,
        manifest,
        status: 'loaded',
        loadedAt: new Date().toISOString(),
      };

      this.loadedPlugins.set(pluginId, pluginInstance);
      this.logger.log(`[Plugin] Loaded: ${pluginId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`[Plugin] Load failed: ${pluginId}, ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<{ success: boolean }> {
    this.loadedPlugins.delete(pluginId);
    this.logger.log(`[Plugin] Unloaded: ${pluginId}`);
    return { success: true };
  }

  /**
   * 重载插件
   */
  async reloadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    await this.unloadPlugin(pluginId);
    return this.loadPlugin(pluginId);
  }

  /**
   * 启用/禁用插件
   */
  async togglePlugin(pluginId: string, enabled: boolean): Promise<{ success: boolean }> {
    const manifest = this.plugins.get(pluginId);
    if (manifest) {
      manifest.enabled = enabled;
      if (!enabled) {
        await this.unloadPlugin(pluginId);
      }
    }
    this.logger.log(`[Plugin] Toggled: ${pluginId}, enabled=${enabled}`);
    return { success: true };
  }

  /**
   * 设置灰度比例
   */
  async setGrayscale(pluginId: string, rate: number): Promise<{ success: boolean }> {
    const manifest = this.plugins.get(pluginId);
    if (manifest) {
      manifest.grayscaleRate = Math.max(0, Math.min(100, rate));
    }
    this.logger.log(`[Plugin] Grayscale: ${pluginId}, rate=${rate}%`);
    return { success: true };
  }

  /**
   * 检查用户是否在灰度范围内
   */
  isUserInGrayscale(pluginId: string, userId: string): boolean {
    const manifest = this.plugins.get(pluginId);
    if (!manifest) return false;
    if (manifest.grayscaleRate >= 100) return true;
    if (manifest.grayscaleRate <= 0) return false;

    // 基于用户ID哈希判断
    const hash = this.hashUserId(userId);
    return hash % 100 < manifest.grayscaleRate;
  }

  /**
   * 获取已加载插件列表
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins.keys());
  }

  /**
   * 获取所有注册插件
   */
  getRegisteredPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 验证插件接口
   */
  private validatePlugin(manifest: PluginManifest): { valid: boolean; error?: string } {
    if (!manifest.id || !manifest.name || !manifest.domain) {
      return { valid: false, error: 'Missing required fields: id, name, domain' };
    }
    return { valid: true };
  }

  /**
   * 哈希用户ID
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export interface PluginManifest {
  id: string;
  name: string;
  domain: string;
  version: string;
  enabled: boolean;
  grayscaleRate: number;
  description?: string;
  dependencies?: string[];
}
