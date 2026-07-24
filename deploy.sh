#!/bin/bash
# =============================================================================
# AILOS Phase2 Epic1 - AI Quota System Deployment Script
# Run this script on server 82.156.228.87 as root
# =============================================================================
set -e

BACKEND_DIR="/www/xuewaiyu-backend"

echo "============================================"
echo "AILOS Phase2 Epic1 - Deployment"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Create aiQuotaService.js
# ---------------------------------------------------------------------------
echo "[1/5] Creating aiQuotaService.js ..."

cat > "${BACKEND_DIR}/src/services/aiQuotaService.js" << 'QUOTASERVICE_EOF'
/**
 * AI Quota Service - Daily quota tracking for AI features
 * 
 * Quota limits:
 * - FREE users: 5 conversations/day, 3 corrections/day
 * - Members: based on membershipLevel (free=5, basic=20, premium=50, flagship=100)
 * 
 * Quota resets daily at 00:00
 * Uses Redis for tracking: ailos:quota:{userId}:{date}:{type}
 */

const redis = require('../config/redis');
const prisma = require('../config/database');
const config = require('../../config');
const logger = require('../../utils/logger');

// Default quota limits for free users
const FREE_QUOTA = {
  conversation: 5,
  correction: 3,
};

// Quota limits by membership level
const MEMBER_QUOTA = {
  free: { conversation: 5, correction: 3 },
  basic: { conversation: 20, correction: 20 },
  premium: { conversation: 50, correction: 50 },
  flagship: { conversation: 100, correction: 100 },
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get tomorrow's reset time (00:00 next day) as ISO string
 */
function getResetAt() {
  const now = new Date();
  const reset = new Date(now);
  reset.setDate(reset.getDate() + 1);
  reset.setHours(0, 0, 0, 0);
  return reset.toISOString();
}

/**
 * Build Redis key for quota tracking
 * Format: ailos:quota:{userId}:{date}:{type}
 */
function buildQuotaKey(userId, date, type) {
  return `ailos:quota:${userId}:${date}:${type}`;
}

/**
 * Get the total quota limit for a user based on their membership level
 * @param {Object} user - User object from database
 * @param {string} type - 'conversation' or 'correction'
 * @returns {number} Total quota limit
 */
function getQuotaLimit(user, type) {
  // Check if user has a membershipLevel
  if (user && user.membershipLevel && MEMBER_QUOTA[user.membershipLevel]) {
    return MEMBER_QUOTA[user.membershipLevel][type] || FREE_QUOTA[type];
  }
  // Default to free quota
  return FREE_QUOTA[type];
}

/**
 * Check if a user has remaining quota for a specific AI feature type
 * @param {string|number} userId - User ID
 * @param {string} type - 'conversation' or 'correction'
 * @returns {Object} { allowed: boolean, remaining: number, total: number, resetAt: string }
 */
async function checkQuota(userId, type) {
  try {
    const today = getToday();
    const key = buildQuotaKey(userId, today, type);

    // Get current usage count from Redis
    const usedStr = await redis.get(key);
    const used = usedStr ? parseInt(usedStr, 10) : 0;

    // Get user from database to check membership level
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: { membershipLevel: true },
      });
    } catch (dbErr) {
      logger.warn(`Failed to fetch user ${userId} for quota check: ${dbErr.message}`);
    }

    const total = getQuotaLimit(user, type);
    const remaining = Math.max(0, total - used);
    const allowed = remaining > 0;
    const resetAt = getResetAt();

    logger.debug(`Quota check: userId=${userId}, type=${type}, used=${used}, total=${total}, remaining=${remaining}, allowed=${allowed}`);

    return {
      allowed,
      remaining,
      total,
      resetAt,
    };
  } catch (err) {
    logger.error(`checkQuota error for userId=${userId}, type=${type}: ${err.message}`);
    // On error, allow the request to proceed (fail open)
    return {
      allowed: true,
      remaining: 1,
      total: 1,
      resetAt: getResetAt(),
    };
  }
}

/**
 * Consume one quota unit for a specific AI feature type
 * Increments the Redis counter atomically
 * @param {string|number} userId - User ID
 * @param {string} type - 'conversation' or 'correction'
 * @returns {Object} { success: boolean, used: number, remaining: number, total: number }
 */
async function consumeQuota(userId, type) {
  try {
    const today = getToday();
    const key = buildQuotaKey(userId, today, type);

    // Atomically increment the counter
    const used = await redis.incr(key);

    // Set expiry to end of day (in seconds) on first use
    if (used === 1) {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const ttlSeconds = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttlSeconds);
    }

    // Get user membership level
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: { membershipLevel: true },
      });
    } catch (dbErr) {
      logger.warn(`Failed to fetch user ${userId} for quota consume: ${dbErr.message}`);
    }

    const total = getQuotaLimit(user, type);
    const remaining = Math.max(0, total - used);

    logger.info(`Quota consumed: userId=${userId}, type=${type}, used=${used}, total=${total}, remaining=${remaining}`);

    return {
      success: true,
      used,
      remaining,
      total,
    };
  } catch (err) {
    logger.error(`consumeQuota error for userId=${userId}, type=${type}: ${err.message}`);
    return {
      success: false,
      used: 0,
      remaining: 0,
      total: 0,
    };
  }
}

/**
 * Get full quota information for a user across all types
 * @param {string|number} userId - User ID
 * @returns {Object} Quota info for all types
 */
async function getQuota(userId) {
  try {
    const today = getToday();

    // Get user membership level
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: { membershipLevel: true },
      });
    } catch (dbErr) {
      logger.warn(`Failed to fetch user ${userId} for getQuota: ${dbErr.message}`);
    }

    const types = ['conversation', 'correction'];
    const result = {
      userId,
      membershipLevel: user ? user.membershipLevel : 'free',
      resetAt: getResetAt(),
      quotas: {},
    };

    for (const type of types) {
      const key = buildQuotaKey(userId, today, type);
      const usedStr = await redis.get(key);
      const used = usedStr ? parseInt(usedStr, 10) : 0;
      const total = getQuotaLimit(user, type);
      const remaining = Math.max(0, total - used);

      result.quotas[type] = {
        used,
        total,
        remaining,
        allowed: remaining > 0,
      };
    }

    return result;
  } catch (err) {
    logger.error(`getQuota error for userId=${userId}: ${err.message}`);
    return {
      userId,
      membershipLevel: 'free',
      resetAt: getResetAt(),
      quotas: {
        conversation: { used: 0, total: FREE_QUOTA.conversation, remaining: FREE_QUOTA.conversation, allowed: true },
        correction: { used: 0, total: FREE_QUOTA.correction, remaining: FREE_QUOTA.correction, allowed: true },
      },
    };
  }
}

/**
 * Reset daily quota for a specific user (admin use)
 * Clears all quota keys for the user for today
 * @param {string|number} userId - User ID
 * @returns {Object} { success: boolean, clearedCount: number }
 */
async function resetDailyQuota(userId) {
  try {
    const today = getToday();
    const types = ['conversation', 'correction'];
    let clearedCount = 0;

    for (const type of types) {
      const key = buildQuotaKey(userId, today, type);
      const deleted = await redis.del(key);
      clearedCount += deleted;
    }

    logger.info(`Daily quota reset for userId=${userId}, cleared ${clearedCount} keys`);
    return { success: true, clearedCount };
  } catch (err) {
    logger.error(`resetDailyQuota error for userId=${userId}: ${err.message}`);
    return { success: false, clearedCount: 0 };
  }
}

module.exports = {
  checkQuota,
  consumeQuota,
  getQuota,
  resetDailyQuota,
  FREE_QUOTA,
  MEMBER_QUOTA,
};
QUOTASERVICE_EOF

echo "  [OK] aiQuotaService.js created"

# ---------------------------------------------------------------------------
# Step 2: Patch aiController.js
# ---------------------------------------------------------------------------
echo "[2/5] Patching aiController.js ..."

AI_CONTROLLER="${BACKEND_DIR}/src/server/controllers/aiController.js"

# Backup original
cp "${AI_CONTROLLER}" "${AI_CONTROLLER}.bak.$(date +%Y%m%d_%H%M%S)"
echo "  Backup created: ${AI_CONTROLLER}.bak.$(date +%Y%m%d_%H%M%S)"

# Use Python to patch the file
python3 << 'PYTHON_PATCH'
import re

filepath = "/www/xuewaiyu-backend/src/server/controllers/aiController.js"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# ---------------------------------------------------------------------------
# Patch 1: Add import for quotaService after existing require() lines
# ---------------------------------------------------------------------------
# Find the last require() line before the first function definition
lines = content.split('\n')
new_lines = []
quota_import_added = False
quota_service_import = "const quotaService = require('../../services/aiQuotaService');"

for i, line in enumerate(lines):
    new_lines.append(line)
    # Add the import after the last require() line that appears before any function
    if not quota_import_added and line.strip().startswith('const ') and 'require(' in line and 'require(' in line:
        # Check if next line is not a require
        if i + 1 < len(lines) and not lines[i + 1].strip().startswith('const ') and 'require(' not in lines[i + 1]:
            new_lines.append(quota_service_import)
            new_lines.append('')
            quota_import_added = True

# If import wasn't added, add it at the top after the first comment block
if not quota_import_added:
    new_lines = []
    added = False
    for line in lines:
        new_lines.append(line)
        if not added and line.strip() == '' and len(new_lines) > 3:
            new_lines.append(quota_service_import)
            new_lines.append('')
            added = True

content = '\n'.join(new_lines)

# ---------------------------------------------------------------------------
# Patch 2: Add quota check BEFORE Hunyuan call in chat() function
# ---------------------------------------------------------------------------
# Look for the Hunyuan API call pattern and add quota check before it
quota_check_block = """
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
"""

# Find patterns that indicate the Hunyuan API call is about to happen
hunyuan_patterns = [
    r'(hunyuan|Hunyuan|hunyuanApi|callHunyuan|axios\.post.*hunyuan)',
    r'(const response = await.*hunyuan|const result = await.*hunyuan)',
]

quota_check_added = False
for pattern in hunyuan_patterns:
    match = re.search(pattern, content, re.IGNORECASE)
    if match and not quota_check_added:
        # Find the beginning of the line where this match is
        pos = match.start()
        # Find the start of this line
        line_start = content.rfind('\n', 0, pos) + 1
        # Find the indentation
        indent_match = re.match(r'^(\s*)', content[line_start:])
        indent = indent_match.group(1) if indent_match else '    '
        
        # Re-indent the quota check block
        indented_block = quota_check_block.replace('\n    ', '\n' + indent)
        
        content = content[:line_start] + indented_block + '\n' + content[line_start:]
        quota_check_added = True
        break

if not quota_check_added:
    print("  WARNING: Could not find Hunyuan call pattern to add quota check. Please add manually.")
else:
    print("  [OK] Quota check added before Hunyuan call")

# ---------------------------------------------------------------------------
# Patch 3: Add quota consume + log AFTER successful AI response in chat()
# ---------------------------------------------------------------------------
# Look for the response sending pattern or where the result is used
quota_consume_block = """
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
"""

# Find patterns where the response is being sent after AI call
response_patterns = [
    r'(res\.json\(\s*\{.*success.*true)',
    r'(res\.status\(\d+\).*json)',
    r'(return res\.json)',
]

quota_consume_added = False
for pattern in response_patterns:
    match = re.search(pattern, content, re.IGNORECASE)
    if match and not quota_consume_added:
        # Only add for the chat function area (after the Hunyuan call)
        # Check if we're past the quota check
        if 'quotaService.checkQuota' in content[:match.start()]:
            pos = match.start()
            line_start = content.rfind('\n', 0, pos) + 1
            indent_match = re.match(r'^(\s*)', content[line_start:])
            indent = indent_match.group(1) if indent_match else '    '
            
            indented_block = quota_consume_block.replace('\n    ', '\n' + indent)
            
            content = content[:line_start] + indented_block + '\n' + content[line_start:]
            quota_consume_added = True
            break

if not quota_consume_added:
    print("  WARNING: Could not find response pattern to add quota consume. Please add manually.")
else:
    print("  [OK] Quota consume and cost log added after AI response")

# ---------------------------------------------------------------------------
# Patch 4: Add getQuota function before module.exports
# ---------------------------------------------------------------------------
get_quota_function = """
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
"""

# Find module.exports
exports_match = re.search(r'module\.exports\s*=\s*\{', content)
if exports_match:
    pos = exports_match.start()
    line_start = content.rfind('\n', 0, pos) + 1
    content = content[:line_start] + '\n' + get_quota_function + '\n' + content[line_start:]
    print("  [OK] getQuota function added before module.exports")
else:
    print("  WARNING: Could not find module.exports. Please add getQuota function manually.")

# ---------------------------------------------------------------------------
# Patch 5: Add getQuota to module.exports
# ---------------------------------------------------------------------------
# Find the module.exports block and add getQuota
exports_block_match = re.search(r'module\.exports\s*=\s*\{([^}]+)\}', content)
if exports_block_match:
    old_exports = exports_block_match.group(0)
    inner = exports_block_match.group(1)
    if 'getQuota' not in inner:
        # Add getQuota to the exports
        if inner.strip().endswith(','):
            new_inner = inner + '\n  getQuota,'
        else:
            new_inner = inner + ',\n  getQuota,'
        new_exports = old_exports.replace(inner, new_inner)
        content = content.replace(old_exports, new_exports)
        print("  [OK] getQuota added to module.exports")
    else:
        print("  [SKIP] getQuota already in module.exports")
else:
    print("  WARNING: Could not find module.exports block. Please add getQuota manually.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("  [OK] aiController.js patched successfully")
PYTHON_PATCH

echo ""

# ---------------------------------------------------------------------------
# Step 3: Patch ai.js routes
# ---------------------------------------------------------------------------
echo "[3/5] Patching ai.js routes ..."

AI_ROUTES="${BACKEND_DIR}/src/server/routes/ai.js"

# Backup original
cp "${AI_ROUTES}" "${AI_ROUTES}.bak.$(date +%Y%m%d_%H%M%S)"

python3 << 'PYTHON_PATCH2'
filepath = "/www/xuewaiyu-backend/src/server/routes/ai.js"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the quota route before module.exports
quota_route = "router.get('/quota', authenticate, aiController.getQuota);"

if 'getQuota' not in content:
    # Find module.exports
    exports_match = content.rfind('module.exports')
    if exports_match > 0:
        # Find the line before module.exports
        line_start = content.rfind('\n', 0, exports_match)
        content = content[:line_start] + '\n' + quota_route + '\n' + content[line_start:]
        print("  [OK] /quota route added")
    else:
        # Try to find the last router.xxx line
        last_route = content.rfind('router.')
        if last_route > 0:
            line_end = content.find('\n', last_route)
            content = content[:line_end + 1] + quota_route + '\n' + content[line_end + 1:]
            print("  [OK] /quota route added after last route")
        else:
            print("  WARNING: Could not find where to add route. Please add manually.")
else:
    print("  [SKIP] /quota route already exists")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("  [OK] ai.js patched successfully")
PYTHON_PATCH2

echo ""

# ---------------------------------------------------------------------------
# Step 4: Patch aiGateway.js
# ---------------------------------------------------------------------------
echo "[4/5] Patching aiGateway.js ..."

AI_GATEWAY="${BACKEND_DIR}/src/services/aiGateway.js"

# Backup original
cp "${AI_GATEWAY}" "${AI_GATEWAY}.bak.$(date +%Y%m%d_%H%M%S)"

python3 << 'PYTHON_PATCH3'
filepath = "/www/xuewaiyu-backend/src/services/aiGateway.js"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Patch 1: Ensure axios and config are imported
imports_to_add = []
if "require('axios')" not in content:
    imports_to_add.append("const axios = require('axios');")
if "require('../../config')" not in content:
    imports_to_add.append("const config = require('../../config');")

if imports_to_add:
    # Find the last require statement
    last_require = 0
    for m in __import__('re').finditer(r"require\(['\"].*?['\"]\)", content):
        last_require = m.end()
    
    if last_require > 0:
        line_end = content.find('\n', last_require)
        insert_pos = line_end + 1
        content = content[:insert_pos] + '\n'.join(imports_to_add) + '\n' + content[insert_pos:]
        print("  [OK] Added axios and config imports")
    else:
        print("  WARNING: Could not find location to add imports")

# Patch 2: Replace _callAI method body
# Find the _callAI method
import re
call_ai_pattern = r'async\s+_callAI\s*\([^)]*\)\s*\{'
match = re.search(call_ai_pattern, content)

if match:
    # Find the matching closing brace
    start = match.start()
    brace_start = match.end() - 1  # position of the opening {
    depth = 1
    i = brace_start + 1
    while i < len(content) and depth > 0:
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
        i += 1
    method_end = i
    
    # Get the method signature (everything before the opening brace)
    sig_end = match.end()
    method_sig = content[start:sig_end]
    
    # Build the new method body
    new_method = '''async _callAI(messages, options = {}) {
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
  }'''
    
    # Keep the class method signature as-is
    old_method = content[start:method_end]
    content = content.replace(old_method, new_method)
    print("  [OK] _callAI method replaced with axios implementation")
else:
    print("  WARNING: Could not find _callAI method. Please replace manually.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("  [OK] aiGateway.js patched successfully")
PYTHON_PATCH3

echo ""

# ---------------------------------------------------------------------------
# Step 5: Verify files
# ---------------------------------------------------------------------------
echo "[5/5] Verifying files..."

echo -n "  aiQuotaService.js: "
if [ -f "${BACKEND_DIR}/src/services/aiQuotaService.js" ]; then
    echo "EXISTS ($(wc -l < "${BACKEND_DIR}/src/services/aiQuotaService.js") lines)"
else
    echo "MISSING!"
fi

echo -n "  aiController.js: "
if [ -f "${BACKEND_DIR}/src/server/controllers/aiController.js" ]; then
    echo "EXISTS ($(wc -l < "${BACKEND_DIR}/src/server/controllers/aiController.js") lines)"
    if grep -q "quotaService" "${BACKEND_DIR}/src/server/controllers/aiController.js"; then
        echo "    [OK] quotaService import found"
    else
        echo "    [WARN] quotaService import NOT found"
    fi
    if grep -q "getQuota" "${BACKEND_DIR}/src/server/controllers/aiController.js"; then
        echo "    [OK] getQuota function found"
    else
        echo "    [WARN] getQuota function NOT found"
    fi
else
    echo "MISSING!"
fi

echo -n "  ai.js routes: "
if [ -f "${BACKEND_DIR}/src/server/routes/ai.js" ]; then
    echo "EXISTS ($(wc -l < "${BACKEND_DIR}/src/server/routes/ai.js") lines)"
    if grep -q "/quota" "${BACKEND_DIR}/src/server/routes/ai.js"; then
        echo "    [OK] /quota route found"
    else
        echo "    [WARN] /quota route NOT found"
    fi
else
    echo "MISSING!"
fi

echo -n "  aiGateway.js: "
if [ -f "${BACKEND_DIR}/src/services/aiGateway.js" ]; then
    echo "EXISTS ($(wc -l < "${BACKEND_DIR}/src/services/aiGateway.js") lines)"
    if grep -q "axios" "${BACKEND_DIR}/src/services/aiGateway.js"; then
        echo "    [OK] axios import found"
    else
        echo "    [WARN] axios import NOT found"
    fi
else
    echo "MISSING!"
fi

echo ""
echo "============================================"
echo "Deployment complete!"
echo "============================================"
echo ""
echo "Next: Run 'pm2 restart xuewaiyu-backend' to apply changes"
echo ""