/**
 * AI Controller - Incremental Modification Guide
 * 
 * File to modify: /www/xuewaiyu-backend/src/server/controllers/aiController.js
 * 
 * IMPORTANT: This file shows ONLY the additions. Do NOT remove any existing code.
 * 
 * ============================================================================
 * MODIFICATION 1: Add import at the TOP of the file (after existing imports)
 * ============================================================================
 * 
 * Add this line after your existing require() statements:
 */

const quotaService = require('../../services/aiQuotaService');

/**
 * ============================================================================
 * MODIFICATION 2: In the chat() function, BEFORE the Hunyuan API call
 * ============================================================================
 * 
 * Find the existing chat() function. Before the code that calls the Hunyuan API,
 * add the following quota check block:
 */

// --- BEGIN QUOTA CHECK (add this before Hunyuan call) ---
    // Check daily AI quota
    const quota = await quotaService.checkQuota(req.userId, 'conversation');
    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        error: 'AI-CONNECTION-PENDING',
        code: 'QUOTA_EXCEEDED',
        message: '今日AI额度已用完，请在明天00:00后重试，或升级会员获取更多额度',
        quota,
      });
    }
// --- END QUOTA CHECK ---

/**
 * ============================================================================
 * MODIFICATION 3: In the chat() function, AFTER the successful Hunyuan response
 * ============================================================================
 * 
 * After the Hunyuan API call returns successfully and BEFORE you send the response
 * back to the client, add the following:
 */

// --- BEGIN QUOTA CONSUME & LOG (add this after successful Hunyuan response) ---
    // Consume quota after successful AI response
    await quotaService.consumeQuota(req.userId, 'conversation');

    // Save cost log to aiRequestLog table via Prisma
    try {
      await prisma.aiRequestLog.create({
        data: {
          userId: parseInt(req.userId, 10),
          type: 'conversation',
          model: result.model || 'hunyuan',
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0,
          cost: result.usage?.cost || 0,
          createdAt: new Date(),
        },
      });
    } catch (logErr) {
      logger.warn(`Failed to save aiRequestLog for userId=${req.userId}: ${logErr.message}`);
    }
// --- END QUOTA CONSUME & LOG ---

/**
 * ============================================================================
 * MODIFICATION 4: Add a NEW getQuota function at the end of the file
 * ============================================================================
 * 
 * Add this new function before the module.exports at the bottom of the file:
 */

// --- BEGIN NEW FUNCTION: getQuota ---
/**
 * Get current AI quota for the authenticated user
 * GET /api/ai/quota
 */
async function getQuota(req, res) {
  try {
    const quota = await quotaService.getQuota(req.userId);
    return res.json({
      success: true,
      data: quota,
    });
  } catch (err) {
    logger.error(`getQuota error for userId=${req.userId}: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to get quota information',
      message: err.message,
    });
  }
}
// --- END NEW FUNCTION: getQuota ---

/**
 * ============================================================================
 * MODIFICATION 5: Add getQuota to module.exports
 * ============================================================================
 * 
 * Find the existing module.exports at the bottom of the file and add getQuota:
 * 
 * module.exports = {
 *   chat,          // existing
 *   // ... other existing exports ...
 *   getQuota,      // <-- ADD THIS LINE
 * };
 */