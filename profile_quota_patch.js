/**
 * profile.html AI Quota Display Patch (Phase2 Epic1 Task4)
 * Insert into profile.html in the personal info section
 * Calls GET /api/ai/quota and renders AI quota section
 */

// --- CSS to add (inside <style> tag) ---
const PROFILE_QUOTA_CSS = `
  /* AI Quota Section in Profile */
  .profile-quota-section {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px;
    margin: 16px 0;
    border: 1px solid var(--border);
  }
  .profile-quota-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .profile-quota-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .profile-quota-item {
    text-align: center;
    padding: 10px;
    background: var(--bg-secondary);
    border-radius: 8px;
  }
  .profile-quota-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
  }
  .profile-quota-label {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
  .profile-quota-reset {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 10px;
    text-align: center;
  }
  .profile-quota-bar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
  }
  .profile-quota-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    transition: width 0.5s ease;
  }
  .profile-quota-fill.low { background: var(--warning); }
  .profile-quota-fill.exhausted { background: var(--error); }
`;

// --- HTML to add (in profile info section, after VIP card or before logout) ---
const PROFILE_QUOTA_HTML = `
  <!-- Phase2: AI Quota Section -->
  <div class="profile-quota-section" id="profileQuotaSection">
    <div class="profile-quota-title">
      <span>AI额度</span>
    </div>
    <div class="profile-quota-grid">
      <div class="profile-quota-item">
        <div class="profile-quota-value" id="profileQuotaTotal">-</div>
        <div class="profile-quota-label">今日总额度</div>
      </div>
      <div class="profile-quota-item">
        <div class="profile-quota-value" id="profileQuotaUsed">-</div>
        <div class="profile-quota-label">已使用</div>
      </div>
      <div class="profile-quota-item">
        <div class="profile-quota-value" id="profileQuotaRemaining">-</div>
        <div class="profile-quota-label">剩余</div>
      </div>
    </div>
    <div class="profile-quota-bar">
      <div class="profile-quota-fill" id="profileQuotaFill" style="width:100%"></div>
    </div>
    <div class="profile-quota-reset" id="profileQuotaReset">下次重置: 00:00</div>
  </div>
`;

// --- JavaScript to add ---
const PROFILE_QUOTA_JS = `
  // Phase2: Fetch and display AI quota in profile
  async function fetchProfileQuota() {
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
      const used = conv.used;
      const resetAt = new Date(data.data.resetAt);
      
      document.getElementById('profileQuotaTotal').textContent = total;
      document.getElementById('profileQuotaUsed').textContent = used;
      document.getElementById('profileQuotaRemaining').textContent = remaining;
      
      const pct = total > 0 ? (remaining / total) * 100 : 0;
      const fillEl = document.getElementById('profileQuotaFill');
      fillEl.style.width = pct + '%';
      fillEl.classList.remove('low', 'exhausted');
      if (remaining === 0) fillEl.classList.add('exhausted');
      else if (pct <= 20) fillEl.classList.add('low');
      
      const resetStr = resetAt.getHours().toString().padStart(2,'0') + ':' + resetAt.getMinutes().toString().padStart(2,'0');
      document.getElementById('profileQuotaReset').textContent = '下次重置: ' + resetStr;
    } catch (e) {
      console.warn('fetchProfileQuota error:', e);
    }
  }
  
  // Call on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchProfileQuota);
  } else {
    fetchProfileQuota();
  }
`;

module.exports = { PROFILE_QUOTA_CSS, PROFILE_QUOTA_HTML, PROFILE_QUOTA_JS };