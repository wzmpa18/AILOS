/**
 * home.html AI Quota Display Patch (Phase2 Epic1 Task4)
 * Insert into home.html after existing dashboard stats section
 * Calls GET /api/ai/quota and renders AI quota card
 */

// --- CSS to add (inside <style> tag) ---
const HOME_QUOTA_CSS = `
  /* AI Quota Card */
  .ai-quota-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 20px;
    color: white;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  .ai-quota-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .ai-quota-title {
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
  }
  .ai-quota-icon {
    font-size: 20px;
  }
  .ai-quota-numbers {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 8px;
  }
  .ai-quota-remaining {
    font-size: 32px;
    font-weight: 700;
  }
  .ai-quota-total {
    font-size: 14px;
    opacity: 0.8;
  }
  .ai-quota-bar {
    height: 6px;
    background: rgba(255,255,255,0.25);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .ai-quota-fill {
    height: 100%;
    background: rgba(255,255,255,0.9);
    border-radius: 3px;
    transition: width 0.5s ease;
  }
  .ai-quota-reset {
    font-size: 11px;
    opacity: 0.75;
  }
  .ai-quota-upgrade {
    display: inline-block;
    margin-top: 10px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.2);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.3);
    transition: all 0.2s;
  }
  .ai-quota-upgrade:hover {
    background: rgba(255,255,255,0.35);
  }
  .ai-quota-exhausted {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  }
`;

// --- HTML to add (after dashboard header or in stats grid) ---
const HOME_QUOTA_HTML = `
  <!-- Phase2: AI Quota Card -->
  <div class="ai-quota-card" id="aiQuotaCard">
    <div class="ai-quota-header">
      <span class="ai-quota-title">今日AI额度</span>
      <span class="ai-quota-icon">AI</span>
    </div>
    <div class="ai-quota-numbers">
      <span class="ai-quota-remaining" id="homeQuotaRemaining">-</span>
      <span class="ai-quota-total" id="homeQuotaTotal">/ - 次对话</span>
    </div>
    <div class="ai-quota-bar">
      <div class="ai-quota-fill" id="homeQuotaFill" style="width:100%"></div>
    </div>
    <div class="ai-quota-reset" id="homeQuotaReset">00:00 自动重置</div>
    <div class="ai-quota-upgrade" id="homeQuotaUpgrade" style="display:none" onclick="window.location.href='/xuewaiyu/growth-center.html'">
      升级会员获取更多额度
    </div>
  </div>
`;

// --- JavaScript to add (inside existing script or new script block) ---
const HOME_QUOTA_JS = `
  // Phase2: Fetch and display AI quota
  async function fetchHomeQuota() {
    const token = localStorage.getItem('yandao_token_v1');
    if (!token) return;
    try {
      const resp = await fetch('/api/ai/quota', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data.success || !data.data) return;
      
      const conv = data.data.quotas.conversation;
      const remaining = conv.remaining;
      const total = conv.total;
      const resetAt = new Date(data.data.resetAt);
      
      document.getElementById('homeQuotaRemaining').textContent = remaining;
      document.getElementById('homeQuotaTotal').textContent = '/ ' + total + ' 次对话';
      
      const pct = total > 0 ? (remaining / total) * 100 : 0;
      document.getElementById('homeQuotaFill').style.width = pct + '%';
      
      const resetStr = resetAt.getHours().toString().padStart(2,'0') + ':' + resetAt.getMinutes().toString().padStart(2,'0');
      document.getElementById('homeQuotaReset').textContent = resetStr + ' 自动重置';
      
      const card = document.getElementById('aiQuotaCard');
      if (remaining === 0) {
        card.classList.add('ai-quota-exhausted');
        document.getElementById('homeQuotaUpgrade').style.display = 'inline-block';
      } else {
        card.classList.remove('ai-quota-exhausted');
        document.getElementById('homeQuotaUpgrade').style.display = 'none';
      }
    } catch (e) {
      console.warn('fetchHomeQuota error:', e);
    }
  }
  
  // Call on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchHomeQuota);
  } else {
    fetchHomeQuota();
  }
`;

module.exports = { HOME_QUOTA_CSS, HOME_QUOTA_HTML, HOME_QUOTA_JS };