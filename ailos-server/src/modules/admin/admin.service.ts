import { Injectable, Logger } from '@nestjs/common';

/**
 * Admin 后台管控系统
 *
 * 绝对禁区：
 * - 禁止直接修改用户核心学习数据、资产数据
 * - 所有操作全程留痕
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  private moduleSwitches: Map<string, boolean> = new Map();
  private systemConfig: Map<string, string> = new Map();
  private auditLogs: any[] = [];

  // 模块开关
  async setModuleSwitch(moduleName: string, enabled: boolean, operator: string) {
    this.moduleSwitches.set(moduleName, enabled);
    this.auditLogs.push({
      operator,
      operation: 'module_switch',
      detail: { moduleName, enabled },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  async getModuleSwitches() {
    const result: Record<string, boolean> = {};
    for (const [key, value] of this.moduleSwitches) {
      result[key] = value;
    }
    return result;
  }

  // 系统配置
  async setSystemConfig(key: string, value: string, operator: string) {
    this.systemConfig.set(key, value);
    this.auditLogs.push({
      operator,
      operation: 'config_change',
      detail: { key, value },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  async getSystemConfig(key?: string) {
    if (key) return { key, value: this.systemConfig.get(key) };
    const result: Record<string, string> = {};
    for (const [k, v] of this.systemConfig) result[k] = v;
    return result;
  }

  // 审计日志
  async getAuditLogs(operator?: string, limit: number = 100) {
    let logs = this.auditLogs;
    if (operator) logs = logs.filter((l) => l.operator === operator);
    return logs.slice(-limit);
  }

  // 用户管理
  async getUserList(page: number = 1, pageSize: number = 20) {
    return { users: [], total: 0, page, pageSize };
  }

  async freezeUser(userId: string, operator: string, reason: string) {
    this.auditLogs.push({
      operator,
      operation: 'freeze_user',
      detail: { userId, reason },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  // 成本看板
  async getCostDashboard() {
    return {
      today: { totalCost: 0, totalCalls: 0, byModule: {} },
      thisMonth: { totalCost: 0, totalCalls: 0 },
      alerts: [],
    };
  }

  // 灰度管理
  async setGrayscale(moduleName: string, rate: number, operator: string) {
    this.auditLogs.push({
      operator,
      operation: 'grayscale',
      detail: { moduleName, rate },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  // 内容审核
  async getPendingAudits(): Promise<any[]> {
    return [];
  }

  async approveContent(contentId: string, operator: string) {
    this.auditLogs.push({
      operator,
      operation: 'content_approve',
      detail: { contentId },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  async rejectContent(contentId: string, operator: string, reason: string) {
    this.auditLogs.push({
      operator,
      operation: 'content_reject',
      detail: { contentId, reason },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }
}
