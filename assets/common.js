/* ============================================================
 * AILOS 统一前端引擎 (common.js) v3.0
 * 职责：
 *  1. 全局"当前学习语言"单一真值源 (localStorage: yandao_study_lang)
 *     —— 解决 learn / chat / profile / language 四处目标语言不一致(串语)问题
 *  2. 全局"界面语言"单一真值源 (localStorage: yandao_ui_lang_v1)
 *     —— 底部导航、返回按钮、硬阻断提示的文案本地化
 *  3. 统一底部导航(7 项)，含社交中心/定制伴读，自动高亮当前页
 *  4. 语言变更事件广播 (languageChanged CustomEvent)
 * 约束：纯前端、无框架；不在本文件改任何认证/会员逻辑。
 * 路径：/xuewaiyu/assets/common.js
 * 版本：v3.0 — Phase4 语言收口：底部导航全7语种本地化 + UI语言读写入口
 * ============================================================ */
(function () {
  'use strict';

  var STUDY_KEY = 'yandao_study_lang';      // 统一学习语言(新真值源)
  var LEGACY_KEY = 'yandao_target_lang_v1'; // learn.html 旧 key(向后兼容)
  var UI_LANG_KEY = 'yandao_ui_lang_v1';    // 界面语言(底部导航/提示文案)

  // 语言 code -> 本地化展示名（用于 UI 展示，如语言选择下拉框）
  var LANG_NAMES = {
    zh: '中文', en: 'English', ja: '日本語', ko: '한국어',
    fr: 'Français', es: 'Español', de: 'Deutsch'
  };

  var CODE_TO_LABEL = {
    en: '英语', zh: '中文', ja: '日本語', ko: '한국어',
    fr: 'Français', es: 'Español', de: 'Deutsch'
  };

  var LABEL_TO_CODE = {
    '英语': 'en', '中文': 'zh', '日本語': 'ja', '한국어': 'ko',
    'Français': 'fr', 'Español': 'es', 'Deutsch': 'de'
  };

  // ===== Phase4: 底部导航全7语种本地化 =====
  var NAV_LABELS = {
    zh: { home: '首页', learn: '学习', chat: 'AI对话', review: '复习', discover: '社交', companion: '伴读', profile: '我的' },
    en: { home: 'Home', learn: 'Learn', chat: 'AI Chat', review: 'Review', discover: 'Social', companion: 'Buddy', profile: 'Me' },
    ja: { home: 'ホーム', learn: '学習', chat: 'AI会話', review: '復習', discover: '交流', companion: 'パートナー', profile: 'マイ' },
    ko: { home: '홈', learn: '학습', chat: 'AI대화', review: '복습', discover: '소셜', companion: '파트너', profile: '내정보' },
    fr: { home: 'Accueil', learn: 'Apprendre', chat: 'Chat IA', review: 'Réviser', discover: 'Social', companion: 'Partenaire', profile: 'Moi' },
    es: { home: 'Inicio', learn: 'Aprender', chat: 'Chat IA', review: 'Repasar', discover: 'Social', companion: 'Amigo', profile: 'Yo' },
    de: { home: 'Start', learn: 'Lernen', chat: 'KI-Chat', review: 'Wiederholen', discover: 'Sozial', companion: 'Partner', profile: 'Ich' }
  };

  // ===== Stage9 M5: 社群模块 4Tab 导航本地化 =====
  var COMMUNITY_NAV_LABELS = {
    zh: { home: '首页', friends: '好友', messages: '消息', discover: '搭子' },
    en: { home: 'Home', friends: 'Friends', messages: 'Messages', discover: 'Partners' },
    ja: { home: 'ホーム', friends: '友達', messages: 'メッセージ', discover: 'パートナー' },
    ko: { home: '홈', friends: '친구', messages: '메시지', discover: '파트너' },
    fr: { home: 'Accueil', friends: 'Amis', messages: 'Messages', discover: 'Partenaires' },
    es: { home: 'Inicio', friends: 'Amigos', messages: 'Mensajes', discover: 'Amigos' },
    de: { home: 'Start', friends: 'Freunde', messages: 'Nachrichten', discover: 'Partner' }
  };

  var COMMUNITY_NAV_ITEMS = [
    { key: 'home',     icon: '🏠', href: '/xuewaiyu/home' },
    { key: 'friends',  icon: '👥', href: '/xuewaiyu/community-friends.html' },
    { key: 'messages', icon: '💬', href: '/xuewaiyu/community-messages.html' },
    { key: 'discover', icon: '🌐', href: '/xuewaiyu/discover.html' }
  ];

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
    var changed = false;
    try {
      var old = getStudyLang();
      if (old !== code) changed = true;
      localStorage.setItem(STUDY_KEY, code);
      localStorage.setItem(LEGACY_KEY, code); // 向后兼容 learn.html
    } catch (e) {}
    // 广播语言变更事件（所有内容页面监听此事件自动重拉数据，杜绝串语）
    if (changed) {
      try {
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: code } }));
      } catch (e) {}
    }
  }

  // ===== Phase4: 界面语言读写（独立于学习语言） =====
  function getUILang() {
    try {
      var v = localStorage.getItem(UI_LANG_KEY);
      if (v && isValidLang(v)) return v;
    } catch (e) {}
    // 兜底：浏览器语言 > 学习语言映射 > 英文
    var navLang = (navigator.language || '').split('-')[0];
    if (navLang && isValidLang(navLang)) return navLang;
    var sl = getStudyLang();
    if (sl === 'zh') return 'zh';
    return 'en';
  }

  function setUILang(code) {
    if (!isValidLang(code)) return;
    var changed = false;
    try {
      var old = getUILang();
      if (old !== code) changed = true;
      localStorage.setItem(UI_LANG_KEY, code);
    } catch (e) {}
    if (changed) {
      try {
        window.dispatchEvent(new CustomEvent('uiLanguageChanged', { detail: { lang: code } }));
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: getStudyLang(), uiLang: code } }));
      } catch (e) {}
    }
  }

  function getNavLabel(key) {
    var ui = getUILang();
    var map = NAV_LABELS[ui] || NAV_LABELS['en'];
    return map[key] || NAV_LABELS['zh'][key] || key;
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

  // ===== Stage9 M5: 社群页面检测 =====
  function isCommunityPage() {
    var p = location.pathname;
    return p.indexOf('community-friends') >= 0 ||
           p.indexOf('community-messages') >= 0 ||
           p.indexOf('community-groups') >= 0;
  }

  function getCommunityNavLabel(key) {
    var ui = getUILang();
    var map = COMMUNITY_NAV_LABELS[ui] || COMMUNITY_NAV_LABELS['en'];
    return map[key] || COMMUNITY_NAV_LABELS['zh'][key] || key;
  }

  function detectActive() {
    var p = location.pathname;
    // Community pages (M5)
    if (p.indexOf('community-friends') >= 0) return 'friends';
    if (p.indexOf('community-messages') >= 0) return 'messages';
    if (p.indexOf('community-groups') >= 0) return 'home'; // groups accessed via home
    // Global pages
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
    var inCommunity = isCommunityPage();
    var items = inCommunity ? COMMUNITY_NAV_ITEMS : NAV_ITEMS;
    var navs = document.querySelectorAll('.bottom-nav');
    for (var n = 0; n < navs.length; n++) {
      var nav = navs[n];
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var act = (it.key === activeKey) ? ' active' : '';
        var label = inCommunity ? getCommunityNavLabel(it.key) : getNavLabel(it.key);
        html += '<a class="nav-item' + act + '" href="' + it.href + '">' +
                  '<span class="nav-icon">' + it.icon + '</span>' +
                  '<span>' + label + '</span>' +
                '</a>';
      }
      nav.innerHTML = html;
    }
  }

  // ===== 自动注入底部导航 + 左上角返回键（覆盖所有引入本文件的页面）=====
  var NAV_CSS =
    '.bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:#fff;border-top:1px solid #E5E7EB;display:flex;justify-content:space-around;align-items:center;z-index:1000;box-shadow:0 -2px 10px rgba(0,0,0,.05);padding-bottom:env(safe-area-inset-bottom,0)}' +
    '.bottom-nav .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;cursor:pointer;text-decoration:none;color:#9CA3AF;font-size:11px;font-weight:500;border:none;background:none;min-width:48px;position:relative}' +
    '.bottom-nav .nav-item .nav-icon{font-size:22px;line-height:1}' +
    '.bottom-nav .nav-item.active{color:#4F46E5;font-weight:700}' +
    '.bottom-nav .nav-item.active::before{content:"";position:absolute;top:0;width:24px;height:3px;background:#4F46E5;border-radius:0 0 3px 3px}' +
    'body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0) + 20px)}' +
    '.ailos-back-btn{position:fixed;top:calc(env(safe-area-inset-top,0) + 12px);left:12px;z-index:2000;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 2px 8px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:#4F46E5;text-decoration:none;cursor:pointer;border:1px solid rgba(0,0,0,.06)}' +
    '.ailos-back-btn:active{transform:scale(.94)}';

  function injectStyle() {
    if (document.getElementById('ailosNavStyle')) return;
    var s = document.createElement('style');
    s.id = 'ailosNavStyle';
    s.textContent = NAV_CSS;
    document.head.appendChild(s);
  }

  function ensureNav() {
    if (document.querySelector('.bottom-nav')) { renderNav(detectActive()); return; }
    var nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.id = 'bottomNav';
    document.body.appendChild(nav);
    renderNav(detectActive());
  }

  function isRootPage() {
    var p = location.pathname;
    return p.endsWith('/home') || p.endsWith('home.html') ||
           p.endsWith('/') || p.indexOf('landing') >= 0 ||
           p.indexOf('guest') >= 0;
  }

  function hasBackAffordance() {
    return !!document.querySelector('.nav-back,.back-link,.header-back,.back-btn,.chat-back,.cp-back,a[title="返回"],[data-i18n*="back"]');
  }

  function ensureBackBtn() {
    if (isRootPage()) return;
    if (hasBackAffordance()) return;
    if (document.getElementById('ailosBackBtn')) return;
    var a = document.createElement('a');
    a.id = 'ailosBackBtn';
    a.className = 'ailos-back-btn';
    a.innerHTML = '&#8592;';
    a.setAttribute('aria-label', '返回上一级');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.history.length > 1 && document.referrer && document.referrer.indexOf(location.origin) === 0) {
        history.back();
      } else {
        location.href = '/xuewaiyu/home';
      }
    });
    document.body.appendChild(a);
  }

  // ===== onboarding 强制守卫（宪法 Chapter 9：未完成双语言配置禁入业务页）=====
  // 业务页白名单外的页面 + 已登录 + /api/onboarding/status 显示语言未配置 → 强制跳引导页
  var GUARD_EXEMPT = ['login', 'register', 'onboarding', 'landing', 'guest',
                      'terms', 'privacy', '404', 'placement'];
  var GUARD_KEY = 'yandao_onboarding_ok_v1'; // 会话级缓存，减少重复请求

  function isExemptPage() {
    var p = location.pathname.toLowerCase();
    for (var i = 0; i < GUARD_EXEMPT.length; i++) {
      if (p.indexOf(GUARD_EXEMPT[i]) >= 0) return true;
    }
    return false;
  }

  function enforceOnboarding() {
    if (isExemptPage()) return;
    var token = getToken();
    if (!token) return; // 未登录由各页自身鉴权处理
    try {
      if (sessionStorage.getItem(GUARD_KEY) === '1') return;
    } catch (e) {}
    fetch('/api/onboarding/status', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.data) return; // 接口异常不误伤（后端仍有 LANG_CONFIG_INCOMPLETE 硬阻断兜底）
        var s = d.data;
        var langOk = !!(s.language && s.language.code) && !!s.nativeLanguage;
        if (langOk) {
          try { sessionStorage.setItem(GUARD_KEY, '1'); } catch (e) {}
          return;
        }
        // 双语言未配置 → 强制重定向引导页（禁止加载业务内容）
        location.replace('/xuewaiyu/onboarding.html');
      })
      .catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    enforceOnboarding();
    injectStyle();
    ensureNav();
    ensureBackBtn();
    syncStudyLangFromApi();
  });

  // Stage9 M5: 语言切换时重新渲染导航标签
  window.addEventListener('languageChanged', function () {
    renderNav(detectActive());
  });

  // Stage9 M5: 社群模式公共方法
  function reloadNav() {
    renderNav(detectActive());
  }

  window.AILOS = {
    STUDY_KEY: STUDY_KEY,
    LEGACY_KEY: LEGACY_KEY,
    UI_LANG_KEY: UI_LANG_KEY,
    LANG_NAMES: LANG_NAMES,
    CODE_TO_LABEL: CODE_TO_LABEL,
    LABEL_TO_CODE: LABEL_TO_CODE,
    NAV_LABELS: NAV_LABELS,
    COMMUNITY_NAV_LABELS: COMMUNITY_NAV_LABELS,
    COMMUNITY_NAV_ITEMS: COMMUNITY_NAV_ITEMS,
    getStudyLang: getStudyLang,
    setStudyLang: setStudyLang,
    getUILang: getUILang,
    setUILang: setUILang,
    getNavLabel: getNavLabel,
    getCommunityNavLabel: getCommunityNavLabel,
    getToken: getToken,
    syncStudyLangFromApi: syncStudyLangFromApi,
    renderNav: renderNav,
    reloadNav: reloadNav,
    isCommunityPage: isCommunityPage,
    NAV_ITEMS: NAV_ITEMS
  };
})();
