import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, GatewayResponse, DegradationLevel } from './dto/gateway-request.dto';

/**
 * 全链路日志 + 结果回写服务
 * Step 9-12: 结果回写三级缓存 → 全链路日志归档 → 成本同步 → 返回结果
 *
 * 全链路可溯源：每次AI调用永久留痕，可对账
 */
@Injectable()
export class GatewayLoggerService {
  private readonly logger = new Logger(GatewayLoggerService.name);

  // 内存中的调用日志（生产环境应写入system_db.ai_call_logs）
  private callLogs: CallLogEntry[] = [];

  /**
   * 记录完整调用日志
   */
  async logCall(entry: CallLogEntry): Promise<void> {
    this.callLogs.push(entry);

    // 内存限制（最多保留10000条，生产环境应写入数据库）
    if (this.callLogs.length > 10000) {
      this.callLogs = this.callLogs.slice(-5000);
    }

    this.logger.log(
      `[CallLog] callId=${entry.callId} module=${entry.module} scene=${entry.scene} ` +
        `degradation=${entry.degradationLevel} cost=$${entry.cost.toFixed(6)} ` +
        `duration=${entry.durationMs}ms cacheHit=${entry.cacheHit} auditPassed=${entry.auditPassed}`,
    );
  }

  /**
   * 获取调用日志（供 Admin 查询）
   */
  getCallLogs(filters?: {
    userId?: string;
    module?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): CallLogEntry[] {
    let logs = [...this.callLogs];

    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.module) {
      logs = logs.filter((l) => l.module === filters.module);
    }
    if (filters?.startTime) {
      logs = logs.filter((l) => l.timestamp >= filters.startTime!);
    }
    if (filters?.endTime) {
      logs = logs.filter((l) => l.timestamp <= filters.endTime!);
    }

    return logs.slice(-(filters?.limit || 100));
  }

  /**
   * 获取成本统计
   */
  getCostStats(): { totalCost: number; totalCalls: number; byModule: Record<string, { cost: number; calls: number }> } {
    const totalCost = this.callLogs.reduce((sum, l) => sum + l.cost, 0);
    const totalCalls = this.callLogs.length;

    const byModule: Record<string, { cost: number; calls: number }> = {};
    for (const log of this.callLogs) {
      if (!byModule[log.module]) {
        byModule[log.module] = { cost: 0, calls: 0 };
      }
      byModule[log.module].cost += log.cost;
      byModule[log.module].calls++;
    }

    return { totalCost, totalCalls, byModule };
  }
}

export interface CallLogEntry {
  callId: string;
  module: string;
  scene: string;
  userId?: string;
  modelName?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  durationMs: number;
  cacheHit: boolean;
  degradationLevel: DegradationLevel;
  auditPassed: boolean;
  timestamp: number;
}
