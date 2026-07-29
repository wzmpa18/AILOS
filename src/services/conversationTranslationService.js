// ============================================================
// src/services/conversationTranslationService.js
// Stage 11 子模块 3 — 对话翻译流式编排服务
//
// 统一管线：SSE连接 → 计费预扣 → 流式翻译 → 逐块校验 → 断句结算 → 多退少补
// 合规：双语言从DB解析 / AI网关唯一入口 / 先扣后用 / 断句结算
// ============================================================

const { getAIGateway } = require('./aiGateway');
const { getBillingService } = require('./billingService');
const { getLanguageGuard } = require('./languageGuard');
const { createSSEStream } = require('../server/middleware/sseStream');

const EST_SEC_PER_REQUEST = 60; // 每次翻译流预估 60 秒

/**
 * 对话翻译流式接口处理函数（用于 Express 路由）
 * 
 * SSE 事件：
 *   event: meta     → { sid, dir, src, tgt }
 *   event: token    → { t, i, f, l }
 *   event: sentence → { si, src, tgt, dur }
 *   event: billing  → { cs, rs, si }   (每句结算后)
 *   event: done     → { sentences, duration, consumed }
 *   event: error    → { code, message, consumedSec, refundedSec }
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
async function handleConversationStream(req, res) {
  const userId = req.user?.id || req.user?.userId;
  const { text, direction = 'native_to_target' } = req.body || {};

  // === 0. 参数校验 ===
  if (!userId) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: '未登录或 Token 无效' });
  }
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'INVALID_PARAMS', message: 'text 不能为空' });
  }
  if (!['native_to_target', 'target_to_native'].includes(direction)) {
    return res.status(400).json({ error: 'INVALID_DIRECTION', message: 'direction 必须是 native_to_target 或 target_to_native' });
  }

  // === 1. 建立 SSE 连接 ===
  const sse = createSSEStream(res, req);
  if (sse.closed) return;

  const gateway = getAIGateway();
  const billing = getBillingService();
  const guard = getLanguageGuard();

  let preDeductResult = null;
  let sentenceIndex = 0;
  let totalConsumedSec = 0;
  const sentenceStartTimes = [];
  const streamStartTime = Date.now();

  try {
    // === 2. 计费预扣 ===
    preDeductResult = await billing.streamPreDeduct(userId, {
      scene: 'conversation_translate',
      estSec: EST_SEC_PER_REQUEST,
    });
    totalConsumedSec = preDeductResult.consumedSec || 0;

  } catch (err) {
    if (err.code === 'TRANSLATION_TIME_EXHAUSTED') {
      sse.error('TRANSLATION_TIME_EXHAUSTED', '翻译时长已用完，请购买套餐', {
        consumedSec: 0, refundedSec: 0,
      });
    } else {
      sse.error('BILLING_ERROR', '计费服务异常: ' + (err.message || 'unknown'), {
        consumedSec: 0, refundedSec: 0,
      });
    }
    return;
  }

  // === 3. 流式翻译 ===
  const sentenceTimings = []; // [{startTime, endTime, sourceText, translatedText}]
  let currentSentence = '';
  let currentSentenceStart = streamStartTime;

  try {
    const result = await gateway.translateStream(userId, {
      text: text.trim(),
      direction,
    }, {
      onMeta: (meta) => {
        if (!sse.closed) sse.meta(meta);
      },

      onToken: (chunkText, index, extras = {}) => {
        if (sse.closed) return;

        // 发送 token
        sse.token({
          text: chunkText,
          index,
          isFirst: index === 0,
          isLast: false,
        });

        // 积累当前句子
        currentSentence += chunkText;

        // 断句检测
        if (extras?.isSentenceEnd) {
          const sentenceEndTime = Date.now();
          const sentenceDurationMs = sentenceEndTime - currentSentenceStart;

          sentenceTimings.push({
            text: currentSentence,
            durationMs: sentenceDurationMs,
          });

          // 发送句子事件
          sse.sentence({
            index: sentenceIndex,
            sourceText: text, // 原文不变
            translatedText: currentSentence,
            durationMs: sentenceDurationMs,
          });

          sentenceIndex++;

          // === 4. 余额检查 ===
          billing.streamBalanceCheck(userId).then((check) => {
            // 发送计费信息（非阻塞，异步）
            if (!sse.closed) {
              sse.billing({
                consumedSec: totalConsumedSec,
                remainingSec: check.remainingSec,
                source: preDeductResult?.source || 'unknown',
                sentenceIndex,
              });
            }

            if (check.exhausted) {
              // 余额耗尽 → 中断流
              sse.error('TRANSLATION_TIME_EXHAUSTED', '翻译时长已用完', {
                consumedSec: totalConsumedSec,
                refundedSec: 0,
                sentenceIndex,
              });
              // 流已在 translateStream 内部处理中断
            }
          }).catch(() => {});

          // 重置当前句子
          currentSentence = '';
          currentSentenceStart = Date.now();
        }
      },

      onDone: async (fullText) => {
        if (sse.closed) return;

        // 处理最后一个不完整句子
        if (currentSentence.trim()) {
          sentenceTimings.push({
            text: currentSentence,
            durationMs: Date.now() - currentSentenceStart,
          });
        }

        const totalDurationMs = Date.now() - streamStartTime;
        const actualSec = Math.ceil(totalDurationMs / 1000);

        // === 5. 流式结算（多退少补） ===
        try {
          const settleResult = await billing.streamSettle(userId, {
            requestId: preDeductResult?.requestId,
            actualSec,
            sentenceCount: sentenceIndex,
          });

          totalConsumedSec = settleResult.finalConsumedSec || actualSec;

          sse.done({
            totalSentences: sentenceTimings.length,
            totalDurationMs,
            totalConsumedSec,
          });

        } catch (settleErr) {
          // 结算失败不影响用户体验，记录日志
          console.error('[translateStream] Settle failed:', settleErr.message);
          sse.done({
            totalSentences: sentenceTimings.length,
            totalDurationMs,
            totalConsumedSec,
          });
        }
      },

      onError: async (code, message) => {
        if (sse.closed) return;

        const elapsedMs = Date.now() - streamStartTime;
        const elapsedSec = Math.ceil(elapsedMs / 1000);
        let refundedSec = 0;

        // === 6. 异常退费 ===
        try {
          if (preDeductResult?.requestId) {
            const settleResult = await billing.streamSettle(userId, {
              requestId: preDeductResult.requestId,
              actualSec: elapsedSec,
              sentenceCount: Math.max(0, sentenceIndex),
            });
            refundedSec = settleResult.refundedSec || 0;
          } else if (preDeductResult && elapsedSec < totalConsumedSec) {
            // 简化退费：直接退款未使用部分
            const refundResult = await billing.streamRefund(userId, {
              seconds: totalConsumedSec - elapsedSec,
              source: preDeductResult.source || 'admin',
              settleRequestId: preDeductResult?.requestId,
            });
            refundedSec = refundResult.refundedSec || 0;
          }
        } catch (refundErr) {
          console.error('[translateStream] Refund failed:', refundErr.message);
        }

        sse.error(code, message, {
          consumedSec: Math.min(elapsedSec, totalConsumedSec),
          refundedSec,
          sentenceIndex,
        });
      },
    });

  } catch (err) {
    // 意外异常兜底
    if (!sse.closed) {
      const elapsedMs = Date.now() - streamStartTime;
      const elapsedSec = Math.ceil(elapsedMs / 1000);

      // 尝试退款
      try {
        if (preDeductResult) {
          await billing.streamSettle(userId, {
            requestId: preDeductResult?.requestId,
            actualSec: elapsedSec,
            sentenceCount: sentenceIndex,
          });
        }
      } catch (_) {}

      sse.error('INTERNAL_ERROR', '翻译服务内部异常', {
        consumedSec: elapsedSec,
        refundedSec: 0,
      });
    }
  }
}

module.exports = { handleConversationStream };
