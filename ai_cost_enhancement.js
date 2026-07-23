/**
 * AI Cost Logging Enhancement (Phase2 Epic1 Task5)
 * Enhanced fields for aiRequestLog table:
 * userId, module, promptId, tokenUsed, estimatedCost, timestamp, status, requestId
 * 
 * This code replaces the basic cost log in aiController.js
 */

const COST_LOG_ENHANCEMENT = `
    // Phase2: Enhanced AI cost log with complete fields
    await quotaService.consumeQuota(req.userId, 'conversation');
    try {
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const totalTokens = inputTokens + outputTokens;
      // Estimated cost: $0.003 per 1K input tokens, $0.006 per 1K output tokens (Hunyuan hy3 pricing)
      const estimatedCost = ((inputTokens * 0.003) + (outputTokens * 0.006)) / 1000;
      
      await prisma.aiRequestLog.create({
        data: {
          userId: req.userId,
          module: 'conversation',
          promptId: 'conversation_default_v1',
          tokenUsed: totalTokens,
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          estimatedCost: estimatedCost,
          timestamp: new Date(),
          status: 'success',
          requestId: requestId,
          scene: 'conversation',
          requestType: 'conversation',
          model: 'hy3',
          latencyMs: latency,
          success: true,
        },
      });
      
      // Also write to Redis for real-time monitoring
      const dailyCostKey = 'ailos:cost:daily:' + new Date().toISOString().slice(0, 10);
      await redis.hincrbyfloat(dailyCostKey, 'totalCost', estimatedCost);
      await redis.hincrby(dailyCostKey, 'totalRequests', 1);
      await redis.hincrby(dailyCostKey, 'totalTokens', totalTokens);
      await redis.expire(dailyCostKey, 86400 * 7); // Keep 7 days
      
      // Per-user cost tracking
      const userCostKey = 'ailos:cost:user:' + req.userId + ':' + new Date().toISOString().slice(0, 10);
      await redis.hincrbyfloat(userCostKey, 'cost', estimatedCost);
      await redis.hincrby(userCostKey, 'requests', 1);
      await redis.expire(userCostKey, 86400 * 30); // Keep 30 days
      
    } catch (logErr) {
      logger.warn('AI cost log write failed:', logErr.message);
    }
`;

module.exports = { COST_LOG_ENHANCEMENT };