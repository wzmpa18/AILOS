/**
 * AILOS Page Header — Shared Component
 * REQ-02: 所有子页面统一左上角返回键
 * 非 5 Tab 一级页的子页面必须挂载 page-header，左上角 ← 返回上一级
 * 
 * Usage: <script src="/xuewaiyu/public/js/page-header.js"></script>
 *         <div id="pageHeaderContainer"></div>
 * 
 * Config via data attributes on container:
 *   data-title="页面标题"
 *   data-back-url="/xuewaiyu/home"  (optional, default: history.back())
 *   data-show-back="true"            (default: true)
 *   data-theme="light|dark|transparent" (default: light)
 */
(function() {
  'use strict';

  var BASE_URL = '/xuewaiyu';

  // ========== Inject CSS ==========
  function injectStyles() {
    var styleId = 'ailos-page-header-styles';
    if (document.getElementById(styleId)) return;

    var css = [
      '/* AILOS Page Header — Shared Styles */',
      ':root {',
      '  --ph-primary: #4F46E5;',
      '  --ph-text: #1F2937;',
      '  --ph-text-secondary: #6B7280;',
      '  --ph-bg: #FFFFFF;',
      '  --ph-border: #E5E7EB;',
      '  --ph-height: 48px;',
      '}',
      '.ailos-page-header {',
      '  position: sticky;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  height: var(--ph-height);',
      '  background: var(--ph-bg);',
      '  border-bottom: 1px solid var(--ph-border);',
      '  display: flex;',
      '  align-items: center;',
      '  padding: 0 12px;',
      '  z-index: 900;',
      '  gap: 8px;',
      '  -webkit-backdrop-filter: blur(10px);',
      '  backdrop-filter: blur(10px);',
      '  box-shadow: 0 1px 3px rgba(0,0,0,0.04);',
      '}',
      '.ailos-page-header .ph-back {',
      '  width: 36px;',
      '  height: 36px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  border-radius: 50%;',
      '  border: none;',
      '  background: #F3F4F6;',
      '  cursor: pointer;',
      '  font-size: 18px;',
      '  color: var(--ph-text-secondary);',
      '  transition: all 0.2s ease;',
      '  flex-shrink: 0;',
      '  text-decoration: none;',
      '  -webkit-tap-highlight-color: transparent;',
      '  user-select: none;',
      '}',
      '.ailos-page-header .ph-back:hover {',
      '  background: #E5E7EB;',
      '  color: var(--ph-primary);',
      '}',
      '.ailos-page-header .ph-back:active {',
      '  transform: scale(0.92);',
      '  background: #D1D5DB;',
      '}',
      '.ailos-page-header .ph-back svg {',
      '  width: 20px;',
      '  height: 20px;',
      '  stroke: currentColor;',
      '  stroke-width: 2.5;',
      '  fill: none;',
      '  stroke-linecap: round;',
      '  stroke-linejoin: round;',
      '}',
      '.ailos-page-header .ph-title {',
      '  font-size: 16px;',
      '  font-weight: 600;',
      '  color: var(--ph-text);',
      '  flex: 1;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  line-height: 1.4;',
      '}',
      '.ailos-page-header .ph-actions {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  flex-shrink: 0;',
      '}',
      '/* Dark theme */',
      '.ailos-page-header.theme-dark {',
      '  background: #1F2937;',
      '  border-bottom-color: #374151;',
      '}',
      '.ailos-page-header.theme-dark .ph-title {',
      '  color: #F9FAFB;',
      '}',
      '.ailos-page-header.theme-dark .ph-back {',
      '  background: #374151;',
      '  color: #D1D5DB;',
      '}',
      '.ailos-page-header.theme-dark .ph-back:hover {',
      '  background: #4B5563;',
      '  color: #FFFFFF;',
      '}',
      '/* Transparent theme */',
      '.ailos-page-header.theme-transparent {',
      '  background: transparent;',
      '  border-bottom: none;',
      '  box-shadow: none;',
      '}',
      '.ailos-page-header.theme-transparent .ph-back {',
      '  background: rgba(255,255,255,0.2);',
      '  color: #FFFFFF;',
      '  backdrop-filter: blur(4px);',
      '}',
      '.ailos-page-header.theme-transparent .ph-title {',
      '  color: #FFFFFF;',
      '}',
      '/* Body padding for page-header */',
      'body.has-page-header {',
      '  padding-top: 0;',
      '}'
    ].join('\n');

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ========== Back arrow SVG ==========
  function getBackArrowSVG() {
    return '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  }

  // ========== Render ==========
  function render(containerId) {
    injectStyles();

    var container = document.getElementById(containerId || 'pageHeaderContainer');
    if (!container) {
      // Try to find existing header
      container = document.querySelector('.page-header, .navbar');
      if (!container) return;
      container.className = 'ailos-page-header';
    } else {
      container.className = 'ailos-page-header';
    }

    var title = container.getAttribute('data-title') || 'AILOS';
    var backUrl = container.getAttribute('data-back-url') || '';
    var showBack = container.getAttribute('data-show-back') !== 'false';
    var theme = container.getAttribute('data-theme') || 'light';

    if (theme !== 'light') {
      container.classList.add('theme-' + theme);
    }

    var html = '';
    if (showBack) {
      var backHref = backUrl ? ' href="' + backUrl + '"' : '';
      var backOnClick = backUrl ? '' : ' onclick="window.history.back();return false;"';
      html += '<a class="ph-back"' + backHref + backOnClick + ' aria-label="返回上一页">';
      html += getBackArrowSVG();
      html += '</a>';
    }
    html += '<span class="ph-title" data-i18n="page_title">' + title + '</span>';
    html += '<div class="ph-actions"></div>';

    container.innerHTML = html;
    document.body.classList.add('has-page-header');
  }

  // ========== Public API ==========
  window.AILOS_PageHeader = {
    render: render,
    getBackArrowSVG: getBackArrowSVG
  };

  // ========== Auto-init on DOMContentLoaded ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      render('pageHeaderContainer');
    });
  } else {
    render('pageHeaderContainer');
  }
})();