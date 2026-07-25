/**
 * AILOS Bottom Navigation — Shared Component
 * REQ-01: 底部导航栏全局常驻，5 Tab 统一组件
 * 所有一级页面（home/learn/chat/review/profile）必须挂载
 * 当前页激活态高亮，任意页面均可见底部导航
 * 
 * Usage: <script src="/xuewaiyu/public/js/bottom-nav.js"></script>
 *         <div id="bottomNavContainer"></div>
 */
(function() {
  'use strict';

  // ========== Configuration ==========
  var BASE_URL = '/xuewaiyu';

  var NAV_ITEMS = [
    { id: 'home',    href: BASE_URL + '/home',          icon: '🏠', label: '首页',   labelKey: 'nav_home' },
    { id: 'learn',   href: BASE_URL + '/learn.html',    icon: '📚', label: '学习',   labelKey: 'nav_learn' },
    { id: 'chat',    href: BASE_URL + '/chat.html',     icon: '💬', label: 'AI对话', labelKey: 'nav_chat' },
    { id: 'review',  href: BASE_URL + '/review.html',   icon: '🔄', label: '复习',   labelKey: 'nav_review' },
    { id: 'me',      href: BASE_URL + '/profile.html',  icon: '👤', label: '我的',   labelKey: 'nav_me' }
  ];

  // ========== Detect Current Page ==========
  function getCurrentPageId() {
    var path = window.location.pathname.replace(/\/$/, '');
    // Remove trailing .html for matching
    path = path.replace(/\.html$/, '');
    // Extract the page name
    var parts = path.split('/');
    var last = parts[parts.length - 1] || 'home';

    var pageMap = {
      'home': 'home',
      'learn': 'learn',
      'chat': 'chat',
      'review': 'review',
      'profile': 'me',
      'speaking': 'learn',   // 口语页高亮学习
      'placement': 'learn',  // 定级页高亮学习
      'discover': 'chat',    // 发现页高亮AI对话
      'partner': 'chat',     // 语伴页高亮AI对话
      'growth-center': 'me', // 成长中心高亮我的
      'rewards': 'me',       // 奖励页高亮我的
      'settings': 'me',      // 设置页高亮我的
      'guest': 'home'        // 游客页高亮首页
    };
    return pageMap[last] || null;
  }

  // ========== Inject CSS ==========
  function injectStyles() {
    var styleId = 'ailos-bottom-nav-styles';
    if (document.getElementById(styleId)) return;

    var css = [
      '/* AILOS Bottom Navigation — Shared Styles */',
      ':root {',
      '  --bn-primary: #4F46E5;',
      '  --bn-primary-hover: #4338CA;',
      '  --bn-text-muted: #9CA3AF;',
      '  --bn-text: #6B7280;',
      '  --bn-bg: #FFFFFF;',
      '  --bn-border: #E5E7EB;',
      '  --bn-shadow: 0 -2px 12px rgba(0,0,0,0.06);',
      '  --bn-height: 64px;',
      '}',
      '.ailos-bottom-nav {',
      '  position: fixed;',
      '  bottom: 0;',
      '  left: 0;',
      '  right: 0;',
      '  height: var(--bn-height);',
      '  background: var(--bn-bg);',
      '  border-top: 1px solid var(--bn-border);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-around;',
      '  z-index: 1000;',
      '  box-shadow: var(--bn-shadow);',
      '  padding-bottom: env(safe-area-inset-bottom, 0);',
      '  -webkit-backdrop-filter: blur(10px);',
      '  backdrop-filter: blur(10px);',
      '}',
      '.ailos-bottom-nav .bn-item {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 2px;',
      '  padding: 6px 12px;',
      '  cursor: pointer;',
      '  text-decoration: none;',
      '  color: var(--bn-text-muted);',
      '  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);',
      '  font-size: 11px;',
      '  font-weight: 500;',
      '  border: none;',
      '  background: none;',
      '  min-width: 56px;',
      '  position: relative;',
      '  padding-top: 10px;',
      '  font-family: inherit;',
      '  -webkit-tap-highlight-color: transparent;',
      '  user-select: none;',
      '}',
      '.ailos-bottom-nav .bn-item .bn-icon {',
      '  font-size: 22px;',
      '  line-height: 1;',
      '  transition: transform 0.2s ease;',
      '}',
      '.ailos-bottom-nav .bn-item:active .bn-icon {',
      '  transform: scale(0.9);',
      '}',
      '.ailos-bottom-nav .bn-item.active {',
      '  color: var(--bn-primary);',
      '  font-weight: 700;',
      '}',
      '.ailos-bottom-nav .bn-item.active::before {',
      '  content: "";',
      '  position: absolute;',
      '  top: 0;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  width: 24px;',
      '  height: 3px;',
      '  background: var(--bn-primary);',
      '  border-radius: 0 0 3px 3px;',
      '}',
      '.ailos-bottom-nav .bn-item .bn-badge {',
      '  position: absolute;',
      '  top: 2px;',
      '  right: 4px;',
      '  min-width: 16px;',
      '  height: 16px;',
      '  border-radius: 8px;',
      '  background: #EF4444;',
      '  color: #FFF;',
      '  font-size: 10px;',
      '  font-weight: 700;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 0 4px;',
      '  line-height: 1;',
      '}',
      '/* Ensure body has bottom padding for nav */',
      'body.has-bottom-nav {',
      '  padding-bottom: calc(var(--bn-height) + env(safe-area-inset-bottom, 0px) + 8px);',
      '}'
    ].join('\n');

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ========== Render ==========
  function render(containerId) {
    injectStyles();

    var currentPage = getCurrentPageId();
    var container = document.getElementById(containerId || 'bottomNavContainer');

    // If no container specified, try to find existing .bottom-nav or create one
    if (!container) {
      container = document.querySelector('.bottom-nav');
      if (container) {
        // Replace existing bottom nav with shared component
        container.className = 'ailos-bottom-nav';
      } else {
        container = document.createElement('nav');
        container.className = 'ailos-bottom-nav';
        container.id = 'bottomNavContainer';
        document.body.appendChild(container);
      }
    } else {
      container.className = 'ailos-bottom-nav';
    }

    // Build HTML
    var html = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      var isActive = item.id === currentPage ? ' active' : '';
      html += '<a class="bn-item' + isActive + '" href="' + item.href + '" data-page="' + item.id + '">';
      html += '<span class="bn-icon">' + item.icon + '</span>';
      html += '<span class="bn-label" data-i18n="' + item.labelKey + '">' + item.label + '</span>';
      html += '</a>';
    }
    container.innerHTML = html;

    // Add body class for bottom padding
    document.body.classList.add('has-bottom-nav');
  }

  // ========== Public API ==========
  window.AILOS_BottomNav = {
    render: render,
    getCurrentPage: getCurrentPageId,
    NAV_ITEMS: NAV_ITEMS
  };

  // ========== Auto-init on DOMContentLoaded ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      render('bottomNavContainer');
    });
  } else {
    render('bottomNavContainer');
  }
})();