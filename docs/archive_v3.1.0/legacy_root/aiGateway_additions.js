/**
 * AI Gateway Service - Modification Guide
 * 
 * File to modify: /www/xuewaiyu-backend/src/services/aiGateway.js
 * 
 * ============================================================================
 * MODIFICATION: Replace the _callAI method to use axios instead of fetch
 * ============================================================================
 * 
 * 1. ADD this import at the top of the file (near other require() statements):
 */

const axios = require('axios');
const config = require('../../config');

/**
 * 2. REPLACE the existing _callAI method with the following:
 * 
 * IMPORTANT: Keep the SAME method signature. Only change the implementation.
 * The existing _callAI method uses fetch() to call a local proxy.
 * Replace it with axios to call Hunyuan API directly.
 */

// --- REPLACE the _callAI method with this ---
async _callAI(messages, options = {}) {
  const {
    model = 'hunyuan-lite',
    temperature = 0.7,
    maxTokens = 2048,
    stream = false,
  } = options;

  const apiUrl = config.hunyuan.apiUrl;
  const apiKey = config.hunyuan.apiKey;

  if (!apiUrl || !apiKey) {
    throw new Error('Hunyuan API configuration is missing. Please check config.hunyuan.apiUrl and config.hunyuan.apiKey');
  }

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  try {
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      data: requestBody,
      timeout: 30000,
      responseType: 'json',
    });

    const data = response.data;

    // Extract usage information if available
    const usage = data.usage || {};

    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
      raw: data,
    };
  } catch (err) {
    // Handle axios errors
    if (err.response) {
      // Server responded with error status
      const status = err.response.status;
      const errorData = err.response.data;
      throw new Error(`Hunyuan API error (${status}): ${JSON.stringify(errorData)}`);
    } else if (err.request) {
      // Request was made but no response received
      throw new Error(`Hunyuan API timeout or network error: ${err.message}`);
    } else {
      // Something else went wrong
      throw new Error(`Hunyuan API call failed: ${err.message}`);
    }
  }
}
// --- END REPLACEMENT ---

/**
 * ============================================================================
 * SUMMARY OF CHANGES:
 * ============================================================================
 * 
 * 1. Added: const axios = require('axios'); at top
 * 2. Added: const config = require('../../config'); at top (if not already present)
 * 3. Replaced _callAI method body:
 *    - No longer uses fetch() to local proxy
 *    - Now uses axios to call Hunyuan API directly via config.hunyuan.apiUrl
 *    - Uses config.hunyuan.apiKey for Authorization header
 *    - Added 30000ms timeout
 *    - Added proper error handling for axios errors (response errors, network errors, other errors)
 *    - Extracts usage info (prompt_tokens, completion_tokens, total_tokens)
 *    - Return format: { success, content, model, usage, raw }
 * 
 * The method signature remains the same: _callAI(messages, options)
 */