/* ============================================================
 * AILOS 统一前端引擎 (common.js) v3.1
 * 职责：
 *  1. 全局"当前学习语言"单一真值源 (localStorage: yandao_study_lang)
 *     —— 解决 learn / chat / profile / language 四处目标语言不一致(串语)问题
 *  2. 全局"界面语言"单一真值源 (localStorage: yandao_ui_lang_v1)
 *     —— 底部导航、返回按钮、硬阻断提示的文案本地化
 *  3. 统一底部导航(7 项)，含社交中心/定制伴读，自动高亮当前页
 *  4. 语言变更事件广播 (languageChanged CustomEvent)
 *  5. 原生音频播放适配 (v3.1新增)
 *     —— 原生App环境通过 window.AilosNative 桥接播放音频/TTS
 *     —— 自动 shim window.speechSynthesis，现有页面无需改动
 *  6. 登录态原生持久化 (v3.1新增)
 *     —— 进程被杀后从原生存储恢复登录态到 localStorage
 *     —— 登录成功后同步登录态到原生存储
 * 约束：纯前端、无框架；不在本文件改任何认证/会员逻辑。
 * 路径：/xuewaiyu/assets/common.js
 * 版本：v3.1 — 原生音频适配 + 登录态原生持久化
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
    zh: { home: '首页', friends: '好友', messages: '消息', trend: '动态' },
    en: { home: 'Home', friends: 'Friends', messages: 'Messages', trend: 'Trends' },
    ja: { home: 'ホーム', friends: '友達', messages: 'メッセージ', trend: '動向' },
    ko: { home: '홈', friends: '친구', messages: '메시지', trend: '트렌드' },
    fr: { home: 'Accueil', friends: 'Amis', messages: 'Messages', trend: 'Tendances' },
    es: { home: 'Inicio', friends: 'Amigos', messages: 'Mensajes', trend: 'Tendencias' },
    de: { home: 'Start', friends: 'Freunde', messages: 'Nachrichten', trend: 'Trends' }
  };

  var COMMUNITY_NAV_ITEMS = [
    { key: 'home',     icon: '🏠', href: '/xuewaiyu/home' },
    { key: 'friends',  icon: '👥', href: '/xuewaiyu/community-friends.html' },
    { key: 'messages', icon: '💬', href: '/xuewaiyu/community-messages.html' },
    { key: 'trend',    icon: '📰', href: '/xuewaiyu/community-trend.html' }
  ];

  function isValidLang(c) { return !!(c && LANG_NAMES[c]); }

  // 后端存储编码 -> 前端编码（zh-CN -> zh），用于解析 API 响应
  function normalizeApiCode(code) {
    if (!code) return '';
    if (typeof code !== 'string') code = String(code);
    return code === 'zh-CN' ? 'zh' : code;
  }

  function getStudyLang() {
    try {
      var s = localStorage.getItem(STUDY_KEY);
      if (s) return s; // 接受自定义语言编码，不限于预定义列表
    } catch (e) {}
    try {
      var t = localStorage.getItem(LEGACY_KEY);
      if (t) { setStudyLang(t); return t; }
    } catch (e) {}
    return 'en';
  }

  function setStudyLang(code) {
    if (!code) return;
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
    if (isValidLang(sl)) return sl;
    return 'en';
  }

  function setUILang(code) {
    if (!code) return;
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

  // 已登录时，从后端同步学习语言和界面语言到 localStorage
  // 修复 Issue C：读取 languageCode 字段，始终更新（移除仅首次设置的限制）
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
            // 优先读取 code 字段（新版后端），回退到 languageCode（旧版后端）
            var rawCode = list[0].code || list[0].languageCode;
            if (rawCode && typeof rawCode === 'object' && rawCode.code) rawCode = rawCode.code;
            if (rawCode) rawCode = String(rawCode);
            var code = normalizeApiCode(rawCode);
            if (code) {
              setStudyLang(code);
            }
          }
          // 同步界面语言（始终更新）
          var uiLang = d.interfaceLanguage || (d.data && d.data.interfaceLanguage) || null;
          if (uiLang) {
            var normalizedUi = normalizeApiCode(uiLang);
            if (normalizedUi) {
              try {
                localStorage.setItem(UI_LANG_KEY, normalizedUi);
                window.dispatchEvent(new CustomEvent('uiLanguageChanged', { detail: { lang: normalizedUi } }));
              } catch (e) {}
            }
          }
        })
        .catch(function () {});
    } catch (e) {}
  }

  // 每次页面加载时从服务端同步语言设置（封装入口，供外部调用）
  function syncLangFromServer() {
    syncStudyLangFromApi();
  }

  var NAV_ITEMS = [
    { key: 'home',      icon: '🏠', label: '首页',   href: '/xuewaiyu/home' },
    { key: 'learn',     icon: '📚', label: '学习',   href: '/xuewaiyu/learn.html' },
    { key: 'chat',      icon: '💬', label: 'AI对话', href: '/xuewaiyu/chat.html' },
    { key: 'review',    icon: '🔄', label: '复习',   href: '/xuewaiyu/review.html' },
    { key: 'discover',  icon: '🌐', label: '社交',   href: '/xuewaiyu/community-friends.html' },
    { key: 'companion', icon: '🤝', label: '伴读',   href: '/xuewaiyu/ai-companion-builder.html' },
    { key: 'profile',   icon: '👤', label: '我的',   href: '/xuewaiyu/profile.html' }
  ];

  // ===== Stage9 M5: 社群页面检测 =====
  function isCommunityPage() {
    var p = location.pathname;
    return p.indexOf('community-friends') >= 0 ||
           p.indexOf('community-messages') >= 0 ||
           p.indexOf('community-groups') >= 0 ||
           p.indexOf('community-trend') >= 0;
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

  // ============================================================
  // v3.1: 原生音频播放适配
  // ============================================================

  /** 检测是否运行在原生App环境中 */
  function isNativeApp() {
    try {
      return !!(window.AilosNative && typeof window.AilosNative.isApp === 'function' && window.AilosNative.isApp());
    } catch (e) {
      return false;
    }
  }

  /** 检测原生音频播放是否可用 */
  function isNativeAudioAvailable() {
    try {
      return isNativeApp() && typeof window.AilosNative.isNativeAudioAvailable === 'function'
        && window.AilosNative.isNativeAudioAvailable();
    } catch (e) {
      return false;
    }
  }

  /**
   * 全局音频播放函数（URL音频文件）
   * 原生环境走 AilosNative.playAudio，浏览器环境走 Web Audio API
   * @param {string} url 音频文件URL
   */
  function playPronunciation(url) {
    if (!url) return;
    if (isNativeAudioAvailable() && window.AilosNative.playAudio) {
      try {
        window.AilosNative.playAudio(url);
        return;
      } catch (e) {
        // 原生调用失败，降级到Web Audio
      }
    }
    // 降级：Web Audio API
    try {
      var audio = new Audio(url);
      audio.play().catch(function () {});
    } catch (e) {}
  }

  /** 停止所有音频播放（原生+TTS） */
  function stopAllAudio() {
    if (isNativeApp()) {
      try { window.AilosNative.stopAudio(); } catch (e) {}
      try { window.AilosNative.stopTts(); } catch (e) {}
    }
  }

  // ===== 原生回调接收器（native → JS）=====
  // 原生侧通过 window.AilosNativeCallback.onXxx() 回调
  var _currentUtterance = null;

  window.AilosNativeCallback = {
    onAudioError: function (msg) {},
    onAudioComplete: function () {},
    onTtsStart: function () {
      if (window._ailosSpeechShim) {
        window._ailosSpeechShim.speaking = true;
        window._ailosSpeechShim.pending = false;
      }
      if (_currentUtterance && _currentUtterance.onstart) {
        try { _currentUtterance.onstart({ type: 'start' }); } catch (e) {}
      }
    },
    onTtsComplete: function () {
      if (window._ailosSpeechShim) {
        window._ailosSpeechShim.speaking = false;
        window._ailosSpeechShim.pending = false;
      }
      if (_currentUtterance && _currentUtterance.onend) {
        try { _currentUtterance.onend({ type: 'end' }); } catch (e) {}
      }
      _currentUtterance = null;
    },
    onTtsError: function (msg) {
      if (window._ailosSpeechShim) {
        window._ailosSpeechShim.speaking = false;
        window._ailosSpeechShim.pending = false;
      }
      if (_currentUtterance && _currentUtterance.onerror) {
        try { _currentUtterance.onerror({ type: 'error', error: msg || 'native_tts_error' }); } catch (e) {}
      }
      _currentUtterance = null;
    }
  };

  /**
   * 安装 speechSynthesis 垫片（仅原生环境）
   * 使现有使用 window.speechSynthesis / SpeechSynthesisUtterance 的页面
   * 自动走原生 TTS，无需逐页修改。
   */
  function installNativeSpeechShim() {
    if (!isNativeAudioAvailable()) return;
    if (window._ailosSpeechShimInstalled) return;
    window._ailosSpeechShimInstalled = true;

    // SpeechSynthesisUtterance 垫片构造函数
    function NativeUtterance(text) {
      this.text = text || '';
      this.lang = '';
      this.voice = null;
      this.volume = 1;
      this.rate = 1;
      this.pitch = 1;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
      this.onpause = null;
      this.onresume = null;
      this.onmark = null;
      this.onboundary = null;
    }

    // 如果原生不支持 speechSynthesis 或不存在，用垫片替换
    var hasNativeSynthesis = typeof window.speechSynthesis === 'object' && window.speechSynthesis !== null;
    if (!hasNativeSynthesis) {
      window.SpeechSynthesisUtterance = NativeUtterance;
    } else {
      // 保留原生构造函数（部分WebView有speechSynthesis对象但不工作）
      if (!window.SpeechSynthesisUtterance) {
        window.SpeechSynthesisUtterance = NativeUtterance;
      }
    }

    var shim = {
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      speak: function (utterance) {
        if (!utterance) return;
        _currentUtterance = utterance;
        shim.pending = true;
        try {
          window.AilosNative.speakText(utterance.text || '', utterance.lang || '');
        } catch (e) {
          shim.speaking = false;
          shim.pending = false;
          if (utterance.onerror) {
            try { utterance.onerror({ type: 'error', error: e.message }); } catch (ee) {}
          }
          _currentUtterance = null;
        }
      },
      cancel: function () {
        try { window.AilosNative.stopTts(); } catch (e) {}
        shim.speaking = false;
        shim.pending = false;
        if (_currentUtterance && _currentUtterance.onend) {
          try { _currentUtterance.onend({ type: 'end' }); } catch (e) {}
        }
        _currentUtterance = null;
      },
      pause: function () {
        // 原生TTS不支持暂停，静默处理
        shim.paused = true;
      },
      resume: function () {
        shim.paused = false;
      },
      getVoices: function () { return []; },
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return true; }
    };

    window._ailosSpeechShim = shim;
    // 覆盖 speechSynthesis（无论原生是否有，在App环境中都用垫片确保可用）
    window.speechSynthesis = shim;
  }

  // 立即安装垫片（不等 DOMContentLoaded，确保在页面脚本调用前就绪）
  installNativeSpeechShim();

  // ============================================================
  // v3.1: 登录态原生持久化
  // ============================================================

  /**
   * 将 localStorage 中的登录态同步到原生存储
   * 登录成功后调用，确保进程被杀后仍可恢复
   */
  function saveLoginStateToNative() {
    if (!isNativeApp()) return;
    try {
      var token = localStorage.getItem('yandao_token_v1');
      if (!token) return;
      var refreshToken = localStorage.getItem('yandao_refresh_token_v1') || '';
      var userInfo = {
        refreshToken: refreshToken,
        savedAt: Date.now()
      };
      // 尝试读取已有的用户信息
      try {
        var authTokens = localStorage.getItem('auth_tokens');
        if (authTokens) userInfo.authTokens = JSON.parse(authTokens);
      } catch (e) {}
      window.AilosNative.saveLoginState(token, JSON.stringify(userInfo));
    } catch (e) {}
  }

  /**
   * 从原生存储恢复登录态到 localStorage
   * 页面加载时调用，进程被杀重启后自动恢复
   */
  function restoreLoginStateFromNative() {
    if (!isNativeApp()) return;
    try {
      var raw = window.AilosNative.getLoginState();
      if (!raw) return;
      var state = JSON.parse(raw);
      if (!state.token) return;
      // 仅在 localStorage 无 token 时恢复（避免覆盖更新的 token）
      var existingToken = localStorage.getItem('yandao_token_v1');
      if (!existingToken) {
        localStorage.setItem('yandao_token_v1', state.token);
        localStorage.setItem('auth_tokens', JSON.stringify({ accessToken: state.token }));
        if (state.refreshToken) {
          localStorage.setItem('yandao_refresh_token_v1', state.refreshToken);
        }
      }
    } catch (e) {}
  }

  /**
   * 原生→JS 登录态注入接口
   * MainActivity.onPageFinished 通过 evaluateJavascript 调用此方法
   * @param {string} loginStateJson 登录态JSON字符串
   */
  window.AilosNativeLogin = {
    inject: function (loginStateJson) {
      try {
        var state = typeof loginStateJson === 'string' ? JSON.parse(loginStateJson) : loginStateJson;
        if (!state || !state.token) return;
        // 仅在 localStorage 无 token 时恢复（避免覆盖更新的 token）
        var existingToken = null;
        try { existingToken = localStorage.getItem('yandao_token_v1'); } catch (e) {}
        if (!existingToken) {
          try {
            localStorage.setItem('yandao_token_v1', state.token);
            localStorage.setItem('auth_tokens', JSON.stringify({ accessToken: state.token }));
            if (state.refreshToken) {
              localStorage.setItem('yandao_refresh_token_v1', state.refreshToken);
            }
          } catch (e) {}
          // 触发页面刷新事件，让页面知道登录态已恢复
          try {
            window.dispatchEvent(new CustomEvent('ailosLoginRestored', { detail: { token: state.token } }));
          } catch (e) {}
        }
      } catch (e) {}
    }
  };

  // 清除原生登录态（退出登录时调用）
  function clearNativeLoginState() {
    if (!isNativeApp()) return;
    try { window.AilosNative.clearLoginState(); } catch (e) {}
  }

  // 监听 localStorage 变化，自动同步到原生存储（跨标签页登录/退出时生效）
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('storage', function (e) {
      if (!isNativeApp()) return;
      // token 被设置 → 同步到原生
      if (e.key === 'yandao_token_v1' && e.newValue) {
        saveLoginStateToNative();
      }
      // token 被清除 → 清除原生登录态
      if (e.key === 'yandao_token_v1' && !e.newValue) {
        clearNativeLoginState();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // 恢复原生登录态（页面加载时）
    restoreLoginStateFromNative();
    // 原生音频垫片已在脚本加载时安装，此处确保 DOM 就绪后状态正确
    enforceOnboarding();
    injectStyle();
    ensureNav();
    ensureBackBtn();
    syncLangFromServer();
    // 若已有 token，同步到原生存储（覆盖更新）
    if (getToken()) saveLoginStateToNative();
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
    syncLangFromServer: syncLangFromServer,
    renderNav: renderNav,
    reloadNav: reloadNav,
    isCommunityPage: isCommunityPage,
    NAV_ITEMS: NAV_ITEMS,
    // v3.1 新增：原生音频 + 登录态
    isNativeApp: isNativeApp,
    isNativeAudioAvailable: isNativeAudioAvailable,
    playPronunciation: playPronunciation,
    stopAllAudio: stopAllAudio,
    saveLoginStateToNative: saveLoginStateToNative,
    restoreLoginStateFromNative: restoreLoginStateFromNative,
    clearNativeLoginState: clearNativeLoginState
  };

  // 全局函数暴露（供未引用 window.AILOS 的页面直接调用）
  window.playPronunciation = playPronunciation;
  window.stopAllAudio = stopAllAudio;
})();
