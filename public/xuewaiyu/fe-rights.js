/**
 * Stage 10 阶段4: 前端权益控制模块
 * 统一管理付费功能入口的权限校验与显隐控制
 * 使用方式: 在付费功能元素上添加 data-right="ai_screenshot" 属性
 */

const RightsControl = {
  userRights: null,

  // 获取用户权益（复用已加载的用户数据，避免重复请求）
  async loadRights() {
    // 优先使用已缓存的用户数据
    if (this.userRights) return this.userRights;

    try {
      var token = localStorage.getItem('yandao_token_v1') || localStorage.getItem('ailos_token') || '';
      if (!token) {
        try { token = JSON.parse(localStorage.getItem('auth_tokens') || '{}').accessToken || ''; } catch(e) {}
      }
      if (!token) return { level: 0, levelCode: 'free', features: [], expired: true };

      var resp = await fetch('/xuewaiyu/api/membership/status', {
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
      });
      var data = await resp.json();
      if (data.success && data.data && data.data.rights) {
        this.userRights = data.data.rights;
        return this.userRights;
      }
    } catch(e) {
      console.warn('[RightsControl] loadRights error:', e.message);
    }
    return { level: 0, levelCode: 'free', features: ['basic_tools', 'ai_text_free', 'group_30', 'discover_text', 'client_limit_10'], expired: true };
  },

  // 检查是否有某项权益
  hasRight(rightCode) {
    if (!this.userRights || this.userRights.expired) return false;
    return (this.userRights.features || []).includes(rightCode);
  },

  // 拦截付费功能点击
  async checkAccess(rightCode, featureName) {
    await this.loadRights();
    if (this.hasRight(rightCode)) {
      return true; // 有权限，放行
    }
    // 无权限，弹出升级提示
    this.showUpgradePrompt(rightCode, featureName);
    return false;
  },

  // 升级提示弹窗
  showUpgradePrompt(rightCode, featureName) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:#fff;border-radius:12px;padding:24px;max-width:320px;text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:12px;">🔒</div>' +
      '<h3 style="font-size:18px;margin:0 0 8px;color:#333;">' + (featureName || '此功能') + '需要升级会员</h3>' +
      '<p style="font-size:14px;color:#666;margin:0 0 16px;">当前会员等级无法使用此功能，升级会员即可解锁全部权益</p>' +
      '<a href="/xuewaiyu/membership.html" style="display:block;padding:10px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;">立即升级</a>' +
      '<a href="javascript:void(0)" onclick="this.closest(\'div[style*=fixed]\').remove()" style="display:block;margin-top:8px;color:#999;font-size:13px;text-decoration:none;">稍后再说</a>' +
      '</div>';
    document.body.appendChild(modal);
  },

  // 扫描页面所有data-right元素，绑定拦截
  async init() {
    await this.loadRights();
    if (!this.userRights) {
      console.warn('[RightsControl] No user rights loaded, skipping init');
      return;
    }
    var elements = document.querySelectorAll('[data-right]');
    var self = this;
    elements.forEach(function(el) {
      var rightCode = el.getAttribute('data-right');
      var featureName = el.getAttribute('data-feature-name') || '此功能';

      // 绑定点击拦截
      el.addEventListener('click', function(e) {
        if (!self.hasRight(rightCode)) {
          e.preventDefault();
          e.stopPropagation();
          self.showUpgradePrompt(rightCode, featureName);
          return false;
        }
      }, true);
    });

    console.log('[RightsControl] Initialized: ' + elements.length + ' protected elements');
  }
};

// 自动初始化（页面加载完成后）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { RightsControl.init(); });
} else {
  RightsControl.init();
}

window.RightsControl = RightsControl;