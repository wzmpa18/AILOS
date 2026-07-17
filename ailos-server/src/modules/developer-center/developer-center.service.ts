import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Developer Center 开发者中心（内部版）
 */
@Injectable()
export class DeveloperCenterService {
  private readonly logger = new Logger(DeveloperCenterService.name);

  private apiKeys: Map<string, any> = new Map();
  private plugins: any[] = [];

  // API Key管理
  async generateApiKey(developerId: string, name: string) {
    const key = `ailos_sk_${uuidv4().replace(/-/g, '')}`;
    const record = { key, developerId, name, active: true, createdAt: new Date().toISOString() };
    this.apiKeys.set(key, record);
    return { key, name };
  }

  async revokeApiKey(key: string) {
    const record = this.apiKeys.get(key);
    if (record) record.active = false;
    return { success: true };
  }

  async listApiKeys(developerId: string) {
    return Array.from(this.apiKeys.values()).filter((k) => k.developerId === developerId);
  }

  // 插件管理
  async registerPlugin(manifest: any) {
    this.plugins.push({ ...manifest, registeredAt: new Date().toISOString() });
    return { success: true };
  }

  async getPlugins() {
    return this.plugins;
  }

  async getPluginConfig(pluginId: string) {
    return this.plugins.find((p) => p.id === pluginId) || null;
  }
}
