/**
 * AI Routes - Incremental Modification Guide
 * 
 * File to modify: /www/xuewaiyu-backend/src/server/routes/ai.js
 * 
 * IMPORTANT: Only ADD the new route. Do NOT remove any existing code.
 * 
 * ============================================================================
 * MODIFICATION: Add ONE new route for quota
 * ============================================================================
 * 
 * Add this line alongside your existing routes (before module.exports):
 */

// --- ADD THIS ROUTE ---
router.get('/quota', authenticate, aiController.getQuota);
// --- END ADDITION ---

/**
 * Example of what the routes file should look like after modification:
 * 
 * const router = express.Router();
 * const aiController = require('../controllers/aiController');
 * const { authenticate } = require('../middleware/auth');
 * 
 * router.post('/chat', authenticate, aiController.chat);
 * router.get('/quota', authenticate, aiController.getQuota);  // <-- NEW
 * // ... other existing routes remain unchanged ...
 * 
 * module.exports = router;
 */