import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';

/**
 * 腾讯混元 API 适配器
 * OpenAI 兼容 Chat Completions 协议
 *
 * 职责：
 * - 封装 HTTP 请求与响应解析
 * - 支持主用/备用双接口切换
 * - 密钥脱敏日志输出
 * - 不掺杂任何业务逻辑
 *
 * 密钥仅通过 ConfigService 从环境变量读取
 * 绝对禁止硬编码API Key、接口地址
 */
@Injectable()
export class HunyuanAdapterService {
  private readonly logger = new Logger(HunyuanAdapterService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 调用混元 Chat Completions API
   * @param messages - OpenAI 格式消息数组
   * @param options - 可选参数
   * @returns 模型响应
   */
  async chatCompletions(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    },
  ): Promise<{
    success: boolean;
    content?: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    model?: string;
    error?: string;
    latencyMs?: number;
  }> {
    const startTime = Date.now();
    const config = this.configService.getHunyuanConfig();

    if (!config.apiKey || !config.apiEndpoint) {
      this.logger.error('[HunyuanAdapter] API Key or Endpoint not configured');
      return { success: false, error: 'API not configured' };
    }

    const maskedKey = this.configService.maskApiKey(config.apiKey);
    const url = `${config.apiEndpoint}/chat/completions`;
    const model = config.activeModel;

    const body = {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 0.9,
    };

    this.logger.log(
      `[HunyuanAdapter] Calling ${url} | model=${model} | key=${maskedKey} | msgCount=${messages.length}`,
    );

    try {
      const response = await this.httpPost(url, config.apiKey, body);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await this.readResponseText(response);
        this.logger.error(`[HunyuanAdapter] HTTP ${response.status} | latency=${latencyMs}ms | error=${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          latencyMs,
        };
      }

      const data = await this.readResponseJson(response);
      const content = data?.choices?.[0]?.message?.content || '';
      const usage = data?.usage;

      this.logger.log(
        `[HunyuanAdapter] Success | latency=${latencyMs}ms | model=${data.model || model} | ` +
          `tokens_in=${usage?.prompt_tokens || 0} | tokens_out=${usage?.completion_tokens || 0} | ` +
          `total=${usage?.total_tokens || 0}`,
      );

      return {
        success: true,
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        model: data.model || model,
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      this.logger.error(`[HunyuanAdapter] Exception | latency=${latencyMs}ms | error=${error.message}`);
      return {
        success: false,
        error: error.message,
        latencyMs,
      };
    }
  }

  /**
   * 连通性测试
   */
  async ping(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    const result = await this.chatCompletions(
      [{ role: 'user', content: 'Hello, this is a connectivity test. Reply "OK".' }],
      { maxTokens: 10 },
    );

    return {
      ok: result.success,
      latencyMs: result.latencyMs || Date.now() - startTime,
      error: result.error,
    };
  }

  /**
   * HTTP POST 请求
   */
  private async httpPost(url: string, apiKey: string, body: any): Promise<any> {
    const https = await import('https');
    const http = await import('http');

    const bodyStr = JSON.stringify(body);
    const isHttps = url.startsWith('https://');
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyStr).toString(),
      },
      timeout: 30000,
    };

    const lib = isHttps ? https : http;

    return new Promise<any>((resolve, reject) => {
      const req = lib.request(options, (res) => {
        resolve(res);
      });

      req.on('error', (err: Error) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(bodyStr);
      req.end();
    });
  }

  private readResponseText(response: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      response.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      response.on('end', () => resolve(data));
      response.on('error', (err: Error) => reject(err));
    });
  }

  private async readResponseJson(response: any): Promise<any> {
    const text = await this.readResponseText(response);
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
