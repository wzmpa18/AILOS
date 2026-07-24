/* ============================================================
 * AILOS 统一前端引擎 (common.js)
 * 职责：
 *  1. 全局"当前学习语言"单一真值源 (localStorage: yandao_study_lang)
 *     —— 解决 learn / chat / profile / language 四处目标语言不一致(串语)问题
 *  2. 统一底部导航(7 项)，含社交中心/定制伴读，自动高亮当前页
 * 约束：纯前端、无框架；不在本文件改任何认证/会员逻辑。
 * 路径：/xuewaiyu/assets/common.js
 * ============================================================ */
(function () {
  'use strict';

  var STUDY_KEY = 'yandao_study_lang';      // 统一学习语言(新真值源)
  var LEGACY_KEY = 'yandao_target_lang_v1'; // learn.html 旧 key(向后兼容)

  // 语言 code -> 中文展示名
  var LANG_NAMES = {
    zh: '中文', en: 'English', ja: '日本語', ko: '한국어',
    fr: 'Français', es: 'Español', de: 'Deutsch'
  };
  // 语言 code -> chat.html 下拉用的中文 label
  var CODE_TO_LABEL = {
    en: '英语', zh: '中文', ja: '日本語', ko: '한국어',
    fr: 'Français', es: 'Español', de: 'Deutsch'
  };
  // chat.html 下拉中文 label -> code
  var LABEL_TO_CODE = {
    '英语': 'en', '中文': 'zh', '日本語': 'ja', '한국어': 'ko',
    'Français': 'fr', 'Español': 'es', 'Deutsch': 'de'
  };

  function isValidLang(c) { return !!(c && LANG_NAMES[c]); }

  function getStudyLang() {
    try {
      var s = localStorage.getItem(STUDY_KEY);
      if (isValidLang(s)) return s;
    } catch (e) {}
    try {
      var t = localStorage.getItem(LEGACY_KEY);
      if (isValidLang(t)) { setStudyLang(t); return t; }
    } catch (e) {}
    return 'en';
  }

  function setStudyLang(code) {
    if (!isValidLang(code)) return;
    try {
      localStorage.setItem(STUDY_KEY, code);
      localStorage.setItem(LEGACY_KEY, code); // 向后兼容 learn.html
    } catch (e) {}
  }

  function getToken() {
    try {
      var t = localStorage.getItem('yandao_token_v1');
      if (t) return t;
      var a = localStorage.getItem('auth_tokens');
      if (a) {
        try { var p = JSON.parse(a); return p.accessToken || p.token || a; } catch (e) { return a; }
      }
    } catch (e) {}
    return null;
  }

  // 已登录时，从后端用户信息同步学习语言(若本地未设置)
  function syncStudyLangFromApi() {
    var token = getToken();
    if (!token) return;
    try {
      fetch('/api/user/languages', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          var list = d.targetLanguages || (d.data && d.data.targetLanguages) || null;
          if (list && list.length) {
            var code = (list[0].code || list[0]).toString();
            if (isValidLang(code) && !localStorage.getItem(STUDY_KEY)) setStudyLang(code);
          }
        })
        .catch(function () {});
    } catch (e) {}
  }

  var NAV_ITEMS = [
    { key: 'home',      icon: '🏠', label: '首页',   href: '/xuewaiyu/home' },
    { key: 'learn',     icon: '📚', label: '学习',   href: '/xuewaiyu/learn.html' },
    { key: 'chat',      icon: '💬', label: 'AI对话', href: '/xuewaiyu/chat.html' },
    { key: 'review',    icon: '🔄', label: '复习',   href: '/xuewaiyu/review.html' },
    { key: 'discover',  icon: '🌐', label: '社交',   href: '/xuewaiyu/discover.html' },
    { key: 'companion', icon: '🤝', label: '伴读',   href: '/xuewaiyu/ai-companion-builder.html' },
    { key: 'profile',   icon: '👤', label: '我的',   href: '/xuewaiyu/profile.html' }
  ];

  function detectActive() {
    var p = location.pathname;
    if (p.indexOf('/home') >= 0 || p.endsWith('home.html')) return 'home';
    if (p.indexOf('learn') >= 0) return 'learn';
    if (p.indexOf('chat') >= 0) return 'chat';
    if (p.indexOf('review') >= 0) return 'review';
    if (p.indexOf('discover') >= 0) return 'discover';
    if (p.indexOf('ai-companion') >= 0) return 'companion';
    if (p.indexOf('placement') >= 0) return 'profile';
    if (p.indexOf('profile') >= 0) return 'profile';
    return '';
  }

  function renderNav(activeKey) {
    var navs = document.querySelectorAll('.bottom-nav');
    for (var n = 0; n < navs.length; n++) {
      var nav = navs[n];
      var html = '';
      for (var i = 0; i < NAV_ITEMS.length; i++) {
        var it = NAV_ITEMS[i];
        var act = (it.key === activeKey) ? ' active' : '';
        html += '<a class="nav-item' + act + '" href="' + it.href + '">' +
                  '<span class="nav-icon">' + it.icon + '</span>' +
                  '<span>' + it.label + '</span>' +
                '</a>';
      }
      nav.innerHTML = html;
    }
  }

  function autoRenderNav() { renderNav(detectActive()); }

  document.addEventListener('DOMContentLoaded', function () {
    autoRenderNav();
    syncStudyLangFromApi();
  });

  window.AILOS = {
    STUDY_KEY: STUDY_KEY,
    LEGACY_KEY: LEGACY_KEY,
    LANG_NAMES: LANG_NAMES,
    CODE_TO_LABEL: CODE_TO_LABEL,
    LABEL_TO_CODE: LABEL_TO_CODE,
    getStudyLang: getStudyLang,
    setStudyLang: setStudyLang,
    getToken: getToken,
    syncStudyLangFromApi: syncStudyLangFromApi,
    renderNav: renderNav,
    NAV_ITEMS: NAV_ITEMS
  };
})();
