// ============================================================
// src/server/middleware/sseStream.js
// Stage 11 子模块 3 — SSE 流式输出中间件
// 
// 用途：标准化 SSE（Server-Sent Events）响应管道，
//       供翻译流、AI 流式生成等场景复用。
// 合规：零侵入现有路由，纯工具模块。
// ============================================================

/**
 * 在 Express response 上建立 SSE 连接
 * 
 * 用法：
 *   const sse = createSSEStream(res);
 *   sse.send('token', { text: 'こんにちは' });
 *   sse.done();
 *   sse.error('LANG_OUTPUT_MISMATCH', '输出语种不匹配');
 * 
 * 自动处理：
 *   - 设置 text/event-stream 响应头
 *   - 禁用缓冲（nginx 需 proxy_buffering off）
 *   - 客户端断开检测（req.on('close')）
 *   - 心跳保活（30s 间隔，防止代理超时断开）
 */
function createSSEStream(res, req) {
  // === 1. SSE 响应头 ===
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
  });

  // 立即发送初始注释（触发浏览器 onopen）
  res.write(':ok\n\n');

  let closed = false;

  // === 2. 客户端断开检测 ===
  const onClose = () => {
    closed = true;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  };
  req.on('close', onClose);
  req.on('aborted', onClose);

  // === 3. 心跳保活（每 30s 发送注释行） ===
  const heartbeatInterval = setInterval(() => {
    if (closed) return;
    res.write(':heartbeat\n\n');
  }, 30000);

  /**
   * 发送一个 SSE 事件
   * @param {string} event - 事件类型 (token, sentence, done, error, billing, meta)
   * @param {any} data - JSON 可序列化的数据
   */
  function send(event, data) {
    if (closed) return false;
    try {
      const payload = JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * 发送 token 块（翻译流核心事件）
   * @param {object} chunk { text, index, isFirst, isLast }
   */
  function token(chunk) {
    return send('token', {
      t: chunk.text,        // 译文文本块
      i: chunk.index ?? 0,   // 块序号
      f: chunk.isFirst ?? false,
      l: chunk.isLast ?? false,
    });
  }

  /**
   * 发送完整句子（断句结算节点）
   * @param {object} sentence { index, sourceText, translatedText, durationMs }
   */
  function sentence(sentence) {
    return send('sentence', {
      si: sentence.index,
      src: sentence.sourceText,
      tgt: sentence.translatedText,
      dur: sentence.durationMs,
    });
  }

  /**
   * 发送计费信息
   * @param {object} billing { consumedSec, remainingSec, source, sentenceIndex }
   */
  function billing(billing) {
    return send('billing', {
      cs: billing.consumedSec,
      rs: billing.remainingSec,
      src: billing.source,
      si: billing.sentenceIndex,
    });
  }

  /**
   * 流正常结束
   * @param {object} meta { totalSentences, totalDurationMs, totalConsumedSec }
   */
  function done(meta = {}) {
    if (closed) return;
    send('done', {
      sentences: meta.totalSentences ?? 0,
      duration: meta.totalDurationMs ?? 0,
      consumed: meta.totalConsumedSec ?? 0,
    });
    res.end();
    closed = true;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  }

  /**
   * 异常终止（错误事件）
   * @param {string} code - 错误码 (LANG_OUTPUT_MISMATCH, TRANSLATION_TIME_EXHAUSTED, etc.)
   * @param {string} message - 人类可读的错误描述
   * @param {object} extra - 额外字段 { consumedSec, refundedSec, sentenceIndex }
   */
  function error(code, message, extra = {}) {
    if (closed) return;
    send('error', {
      code,
      message,
      ...extra,
    });
    // 短暂延迟后关闭连接，确保客户端收到错误事件
    setTimeout(() => {
      if (!closed) {
        res.end();
        closed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      }
    }, 100);
  }

  /**
   * 发送元信息（流建立时发送一次）
   * @param {object} meta { streamId, direction, sourceLang, targetLang }
   */
  function meta(meta) {
    return send('meta', {
      sid: meta.streamId,
      dir: meta.direction,
      src: meta.sourceLang,
      tgt: meta.targetLang,
    });
  }

  return {
    send,
    token,
    sentence,
    billing,
    done,
    error,
    meta,
    get closed() { return closed; },
  };
}

module.exports = { createSSEStream };
