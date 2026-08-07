
/* ============================================================
 * AILOS 统一前端引擎 (common.js) v3.3
 * 职责：
 *  1. 全局"当前学习语言"单一真值源 (localStorage: yandao_study_lang)
 *     —— 解决 learn / chat / profile / language 四处目标语言不一致(串语)问题
 *  2. 全局"界面语言"单一真值源 (localStorage: yandao_ui_lang_v1)
 *     —— 底部导航、返回按钮、硬阻断提示的文案本地化
 *  3. 统一底部导航(7 项)，含社交中心/定制伴读，自动高亮当前页
 *  4. 语言变更事件广播 (languageChanged CustomEvent)
 *  5. 原生音频播放适配 (v3.1新增)
 *  6. 登录态原生持久化 (v3.1新增)
 *  7. Token 无感刷新机制 (v3.2 P3新增)
 *  8. AILOS.ready() 异步就绪机制 (v3.3 P3新增)
 *     —— 所有页面必须 await AILOS.ready() 后再调用业务接口
 *     —— 解决"AILOS 未就绪就调用 API 导致 language 为空"的根因
 * 约束：纯前端、无框架；不在本文件改任何认证/会员逻辑。
 * 路径：/xuewaiyu/assets/common.js
 * 版本：v3.3 — P3 异步就绪 + SSOT 强化
 * ============================================================ */
(function () {
  'use strict';

  var STUDY_KEY = 'yandao_study_lang';      // 统一学习语言(新真值源)
  var LEGACY_KEY = 'yandao_target_lang_v1'; // learn.html 旧 key(向后兼容)
  var UI_LANG_KEY = 'yandao_ui_lang_v1';    // 界面语言(底部导航/提示文案)

  // 语言 code -> 本地化展示名（用于 UI 展示，如语言选择下拉框）
  var LANG_NAMES = {
    zh: '中文', 'zh-TW': '繁體中文', en: 'English', ja: '日本語', ko: '한국어',
    fr: 'Français', es: 'Español', de: 'Deutsch'
  };

  var CODE_TO_LABEL = {
    en: '英语', zh: '中文', 'zh-TW': '繁體中文', ja: '日本語', ko: '한국어',
    fr: 'Français', es: 'Español', de: 'Deutsch'
  };

  var LABEL_TO_CODE = {
    '英语': 'en', '中文': 'zh', '繁體中文': 'zh-TW', '日本語': 'ja', '한국어': 'ko',
    'Français': 'fr', 'Español': 'es', 'Deutsch': 'de'
  };

  // 繁体中文显示映射
  var TRADITIONAL_I18N = {
    'zh-TW': {
      '首页': '首頁', '学习': '學習', 'AI对话': 'AI對話', '复习': '複習',
      '社交': '社交', '伴读': '伴讀', '我的': '我的',
      '返回': '返回', '退出': '退出', '加载中': '載入中', '保存': '儲存',
      '取消': '取消', '确定': '確定', '关闭': '關閉', '登录': '登入',
      '注册': '註冊', '完成': '完成', '下一步': '下一步', '上一步': '上一步',
      '开始': '開始', '设置': '設定', '个人中心': '個人中心',
      '我的二维码': '我的二維碼', '编辑昵称': '編輯暱稱',
      '界面语言': '介面語言', '母语': '母語', '目标学习语言': '目標學習語言',
      '开始学习': '開始學習', '生成': '生成', '选择': '選擇',
      '水平测试': '水平測試', '快速入口': '快速入口', '实时翻译': '即時翻譯',
      '口语速成': '口語速成', '词库': '詞庫', '翻译': '翻譯',
      '社区': '社區', '好友': '好友', '消息': '訊息',
      '动态': '動態', '查看更多': '查看更多', '加载失败': '載入失敗',
      '请稍后再试': '請稍後再試', '提交': '提交', '自定义强化': '自訂強化',
      '自定义': '自訂', '退出登录': '退出登入', '性别': '性別',
      '昵称': '暱稱', '语言偏好': '語言偏好',
      '页面和按钮的显示语言': '頁面和按鈕的顯示語言',
      '你的第一语言': '你的第一語言', '你在学习的语言': '你在學習的語言',
      '你的学习搭子': '你的學習搭子', 'AI对话': 'AI對話',
    }
  };

  function toTraditional(text, lang) {
    if (lang !== 'zh-TW' || !text) return text;
    if (typeof text !== 'string') return text;
    return TRADITIONAL_I18N['zh-TW'][text] || text;
  }

  // ===== Phase4: 底部导航全8语种本地化（含繁体中文） =====
  var NAV_LABELS = {
    zh: { home: '首页', learn: '学习', chat: 'AI对话', review: '复习', discover: '社交', companion: '伴读', profile: '我的' },
    'zh-TW': { home: '首頁', learn: '學習', chat: 'AI對話', review: '複習', discover: '社交', companion: '伴讀', profile: '我的' },
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
    'zh-TW': { home: '首頁', friends: '好友', messages: '訊息', trend: '動態' },
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

  function isValidLang(c) {
    if (!c) return false;
    if (LANG_NAMES[c]) return true;
    // 繁体中文特殊处理
    if (c === 'zh-TW' || c === 'zh-HK' || c === 'zh-TW-CN') return true;
    return false;
  }

  // 后端存储编码 -> 前端编码（zh-CN -> zh），用于解析 API 响应
  function normalizeApiCode(code) {
    if (!code) return '';
    if (typeof code !== 'string') code = String(code);
    return code === 'zh-CN' ? 'zh' : code;
  }

  function getStudyLang() {
    try {
      var s = localStorage.getItem(STUDY_KEY);
      if (s && s !== 'undefined' && s !== 'null' && s !== '') return s;
    } catch (e) {}
    try {
      var t = localStorage.getItem(LEGACY_KEY);
      if (t && t !== 'undefined' && t !== 'null' && t !== '') { setStudyLang(t); return t; }
    } catch (e) {}
    try {
      if (typeof URLSearchParams !== 'undefined') {
        var urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang && urlLang !== 'undefined' && urlLang !== 'null' && urlLang !== '') return urlLang;
      }
    } catch (e) {}
    return 'ja';
  }

  // P2 整改：前端 SSOT — 写操作必须走后端接口校验
  function setStudyLang(code) {
    if (!code) return;
    // ① 先走后端接口（SSOT 真值源）
    var token = getToken();
    if (token) {
      fetch('/api/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ targetLanguage: code }),
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.success) {
            // ② 后端成功后同步更新本地缓存（只读副本）
            try {
              localStorage.setItem(STUDY_KEY, code);
              localStorage.setItem(LEGACY_KEY, code);
            } catch (e) {}
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: code } }));
          }
        }).catch(function() {
          // ③ 后端不可用时，仅更新本地缓存（离线兜底）
          try {
            localStorage.setItem(STUDY_KEY, code);
            localStorage.setItem(LEGACY_KEY, code);
          } catch (e) {}
          window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: code } }));
        });
    } else {
      // 未登录时仅本地缓存
      try {
        localStorage.setItem(STUDY_KEY, code);
        localStorage.setItem(LEGACY_KEY, code);
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: code } }));
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

  // P2 整改：前端 SSOT — setUILang 走后端校验
  function setUILang(code) {
    if (!code) return;
    var token = getToken();
    if (token) {
      fetch('/api/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ uiLanguage: code }),
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.success) {
            try { localStorage.setItem(UI_LANG_KEY, code); } catch (e) {}
            window.dispatchEvent(new CustomEvent('uiLanguageChanged', { detail: { lang: code } }));
            try { window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: getStudyLang(), uiLang: code } })); } catch (e) {}
          }
        }).catch(function() {
          try { localStorage.setItem(UI_LANG_KEY, code); } catch (e) {}
          window.dispatchEvent(new CustomEvent('uiLanguageChanged', { detail: { lang: code } }));
          try { window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: getStudyLang(), uiLang: code } })); } catch (e) {}
        });
    } else {
      try { localStorage.setItem(UI_LANG_KEY, code); } catch (e) {}
      window.dispatchEvent(new CustomEvent('uiLanguageChanged', { detail: { lang: code } }));
      try { window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: getStudyLang(), uiLang: code } })); } catch (e) {}
    }
  }

  function getNavLabel(key) {
    var ui = getUILang();
    var map = NAV_LABELS[ui] || NAV_LABELS['en'];
    return map[key] || NAV_LABELS['zh'][key] || key;
  }

  // ============================================================
  // 登录态统一真值源（v1.1.0 模块一-2）
  // 历史上各页面自行使用了不同键名，这里统一收口：
  //   主键 yandao_token_v1，兼容读取 auth_tokens / ailos_token / token。
  // 严禁各页面再自行 removeItem token，一律走 AILOS.clearToken()。
  // ============================================================
  var TOKEN_KEY = 'yandao_token_v1';
  var REFRESH_KEY = 'yandao_refresh_token_v1';
  var LEGACY_TOKEN_KEYS = ['auth_tokens', 'ailos_token', 'token', 'accessToken'];

  function getToken() {
    try {
      var t = localStorage.getItem(TOKEN_KEY);
      if (t && t !== 'null' && t !== 'undefined') return t;
      // 兼容历史键名，读到后回迁到主键，逐步收敛
      for (var i = 0; i < LEGACY_TOKEN_KEYS.length; i++) {
        var raw = localStorage.getItem(LEGACY_TOKEN_KEYS[i]);
        if (!raw || raw === 'null' || raw === 'undefined') continue;
        var val = raw;
        if (raw.charAt(0) === '{') {
          try {
            var p = JSON.parse(raw);
            val = p.accessToken || p.token || null;
          } catch (e) { val = raw; }
        }
        if (val) {
          try { localStorage.setItem(TOKEN_KEY, val); } catch (e) {}
          return val;
        }
      }
    } catch (e) {}
    return null;
  }

  /** 统一写入登录态（登录/刷新后调用） */
  function setToken(token, refreshToken) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch (e) {}
  }

  /** 统一清除登录态（仅退出登录/注销账号/校验失败时调用） */
  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      for (var i = 0; i < LEGACY_TOKEN_KEYS.length; i++) {
        localStorage.removeItem(LEGACY_TOKEN_KEYS[i]);
      }
    } catch (e) {}
    try { clearLoginStateFromNative(); } catch (e) {}
  }

  // ============================================================
  // P3 任务二：Token 无感刷新机制
  // JWT 到期前 24h 自动触发续期，用户无感知
  // ============================================================
  var _refreshTimer = null;
  var _REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 每6小时检查一次
  var _REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 到期前24h续期

  function getTokenExpiry(token) {
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp || 0) * 1000; // JWT exp 是秒
    } catch (e) { return 0; }
  }

  function tryRefreshToken() {
    var token = getToken();
    if (!token) return;
    var expMs = getTokenExpiry(token);
    if (!expMs) return;
    var nowMs = Date.now();
    // 还有超过24h才过期，不需要刷新
    if (expMs - nowMs > _REFRESH_THRESHOLD) return;

    var refreshToken = null;
    try { refreshToken = localStorage.getItem(REFRESH_KEY); } catch (e) {}
    if (!refreshToken) return;

    fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken })
    })
    .then(function(r) {
      if (!r.ok) throw new Error('refresh failed');
      return r.json();
    })
    .then(function(data) {
      if (data && data.tokens) {
        setToken(data.tokens.accessToken, data.tokens.refreshToken);
        console.log('[AILOS] Token 已自动续期');
      }
    })
    .catch(function(e) {
      console.warn('[AILOS] Token 续期失败:', e.message);
    });
  }

  function startAutoRefresh() {
    if (_refreshTimer) clearInterval(_refreshTimer);
    tryRefreshToken(); // 立即检查一次
    _refreshTimer = setInterval(tryRefreshToken, _REFRESH_INTERVAL);
  }

  function stopAutoRefresh() {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  }

  // 登录态恢复时自动启动刷新
  if (getToken()) { startAutoRefresh(); }
  window.addEventListener('ailosLoginRestored', function() { startAutoRefresh(); });

  /**
   * P3 任务二：登录态持久化验证 — 页面可见性变化时校验
   * 浏览器标签页切换回来时，快速校验 token 有效性
   */
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      var token = getToken();
      if (!token) return;
      // 快速校验：发轻量请求确认 token 仍有效
      fetch('/api/user/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(function(r) {
        if (r.status === 401) {
          // Token 已失效，尝试静默刷新
          tryRefreshToken().then(function() {
            // 刷新后重新校验
            var newToken = getToken();
            if (!newToken) {
              window.dispatchEvent(new CustomEvent('ailosSessionExpired'));
            }
          });
        }
      })
      .catch(function() { /* 网络异常，静默忽略 */ });
    }
  });

  /**
   * P3 改造：统一鉴权请求封装 — 自动带 token + 401 时尝试无感刷新
   * 仅在刷新也失败时才判定登录失效，其余错误一律不清登录态
   * P3 修复：没有 token 时不要广播过期事件（游客态下 401 是正常的）
   */
  function authFetch(url, options) {
    var opt = options || {};
    opt.headers = opt.headers || {};
    var token = getToken();
    if (token) opt.headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, opt).then(function(r) {
      // P3 修复：没token时不触发刷新逻辑（游客401属正常）
      if (r.status === 401 && token) {
        // 尝试无感刷新
        var refreshToken = null;
        try { refreshToken = localStorage.getItem(REFRESH_KEY); } catch (e) {}
        if (refreshToken) {
          return fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshToken })
          }).then(function(refreshR) {
            if (refreshR.ok) {
              return refreshR.json().then(function(data) {
                if (data && data.tokens) {
                  setToken(data.tokens.accessToken, data.tokens.refreshToken);
                  // 用新 token 重试原请求
                  opt.headers['Authorization'] = 'Bearer ' + data.tokens.accessToken;
                  return fetch(url, opt);
                }
                // 刷新失败，广播登录过期
                window.dispatchEvent(new CustomEvent('ailosSessionExpired'));
                return r;
              });
            }
            // 刷新接口也失败了
            window.dispatchEvent(new CustomEvent('ailosSessionExpired'));
            return r;
          });
        }
        // 无 refreshToken，直接判定过期
        window.dispatchEvent(new CustomEvent('ailosSessionExpired'));
      }
      return r;
    });
  }

  // P3 任务一：AILOS.ready() 异步就绪 Promise
  // 所有页面必须 await AILOS.ready() 后再调用业务接口
  // 解决：AILOS 已加载但用户配置（language）未从服务端同步完成
  var _readyPromise = null;
  var _readyResolved = false;
  var _readyStartedAt = 0;

  function ready() {
    if (_readyResolved) return Promise.resolve();
    if (_readyPromise) return _readyPromise;
    _readyStartedAt = Date.now();

    _readyPromise = new Promise(function(resolve) {
      var resolved = false;
      function done() {
        if (resolved) return;
        resolved = true;
        _readyResolved = true;
        // 从服务端同步学习语言（带 3s 超时）
        var syncP = syncStudyLangFromApi();
        if (!syncP || typeof syncP.then !== 'function') {
          resolve();
          return;
        }
        var timeoutP = new Promise(function(r) { setTimeout(r, 3000); });
        Promise.race([syncP, timeoutP]).then(function() { resolve(); }).catch(function() { resolve(); });
      }
      // 立即触发（AILOS 加载完成时立即可同步）
      done();
      // 1.5s 兜底超时：防止极端情况下 syncStudyLangFromApi 永久挂起
      setTimeout(done, 1500);
    });

    return _readyPromise;
  }

  // 已登录时，从后端同步学习语言和界面语言到 localStorage
  // P0-5修复：本地缓存优先 + 服务端异步对齐，禁止接口反向污染本地选择
  // P3 任务一改造：返回 Promise，让 AILOS.ready() 可以等待
  function syncStudyLangFromApi() {
    var token = getToken();
    if (!token) return Promise.resolve();
    return new Promise(function(resolve) {
      try {
        fetch('/api/user/languages', { headers: { 'Authorization': 'Bearer ' + token } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (!d) { resolve(); return; }
            // 学习语言：仅当 localStorage 无值时初始化，有值时保持用户选择不变
            var localStudy = getStudyLang();
            var hasLocal = localStudy && localStudy !== 'null' && localStudy !== 'undefined';
            if (!hasLocal) {
              var list = d.targetLanguages || (d.data && d.data.targetLanguages) || null;
              if (list && list.length) {
                var rawCode = list[0].code || list[0].languageCode;
                if (rawCode && typeof rawCode === 'object' && rawCode.code) rawCode = rawCode.code;
                if (rawCode) rawCode = String(rawCode);
                var code = normalizeApiCode(rawCode);
                if (code) {
                  setStudyLang(code);
                }
              }
            }
            // 界面语言：同样本地优先，仅空时初始化
            var localUi = getUILang();
            var hasLocalUi = localUi && localUi !== 'null' && localUi !== 'undefined';
            if (!hasLocalUi) {
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
            }
            resolve();
          })
          .catch(function () { resolve(); });
      } catch (e) { resolve(); }
    });
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

  /**
   * TTS 文本朗读（vocabulary / translate 等页面调用）
   * 原生环境走 AilosNative.speakText，浏览器环境走 Web Speech API (speechSynthesis)
   * @param {string} text 要朗读的文本
   * @param {string} lang 语言代码（可选，如 'ja', 'en'）
   * @param {object} opts 回调 { onStart, onEnd, onError }
   */
  function playTTS(text, lang, opts) {
    if (!text) { if (opts && opts.onError) opts.onError('无文本'); return; }
    opts = opts || {};
    lang = lang || 'ja';

    // 原生 App 环境：走 AilosNative 桥接
    if (isNativeApp() && window.AilosNative && window.AilosNative.speakText) {
      try {
        window.AilosNative.speakText(text, lang || '');
        if (opts.onStart) opts.onStart();
        // 原生回调通过 AilosNativeCallback.onTtsComplete 触发 onEnd
        _currentUtterance = { onend: opts.onEnd || null };
        return;
      } catch (e) {
        if (opts.onError) opts.onError(e.message);
        return;
      }
    }

    // 浏览器环境：走 Web Speech API
    if ('speechSynthesis' in window) {
      try {
        // 取消之前的朗读
        window.speechSynthesis.cancel();

        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ja' ? 'ja-JP' :
                         lang === 'en' ? 'en-US' :
                         lang === 'ko' ? 'ko-KR' :
                         lang === 'fr' ? 'fr-FR' :
                         lang === 'de' ? 'de-DE' :
                         lang === 'es' ? 'es-ES' : 'zh-CN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // 防止 speak() 被浏览器静默拒绝（autoplay 策略）→ 超时兜底触发后端 TTS
        var webSpeechStarted = false;
        var fallbackTimer = setTimeout(function() {
          if (!webSpeechStarted) {
            if (opts.onError) opts.onError('TTS_TIMEOUT');
          }
        }, 1500);

        if (opts.onStart) utterance.onstart = function () { webSpeechStarted = true; clearTimeout(fallbackTimer); opts.onStart(); };
        utterance.onend = function () { clearTimeout(fallbackTimer); if (opts.onEnd) opts.onEnd(); };
        utterance.onerror = function (e) { clearTimeout(fallbackTimer); if (opts.onError) opts.onError('TTS错误: ' + e.error); };

        window.speechSynthesis.speak(utterance);
        // 立即检查是否真的在排队/播放（部分浏览器 speak 后无 onstart 也不报错）
        setTimeout(function() {
          if (!webSpeechStarted && window.speechSynthesis.speaking) {
            webSpeechStarted = true;
            clearTimeout(fallbackTimer);
            if (opts.onStart) opts.onStart();
          }
        }, 200);
      } catch (e) {
        if (opts.onError) opts.onError('TTS不可用');
      }
    } else {
      if (opts.onError) opts.onError('浏览器不支持语音合成');
    }
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

  // ============================================================
  // v1.1.0 深度穿透审计 · 漏洞5 修复：底部导航「尽早同步注入」
  //   原实现一律等 DOMContentLoaded，页面从解析到 DOM 就绪的数百毫秒里，
  //   底部是一片空白/塌陷，用户体感为「闪一下」。
  //   现改为：脚本执行时若 body 已可用（common.js 通常置于 body 末尾或 defer），
  //   立即注入样式与导航；否则再退回 DOMContentLoaded，保证任何引入方式都不漏。
  // ============================================================
  function bootNavEarly() {
    try {
      if (!document.body) return false;
      injectStyle();
      ensureNav();
      // 注意：此处「刻意不调用」ensureBackBtn()。
      // 它依赖 hasBackAffordance() 扫描页面自带的返回控件，若在 DOM 未完整解析时执行，
      // 会误判为「页面没有返回按钮」而多插一个，造成双返回键。返回键不影响首屏闪烁，
      // 因此保留在 DOMContentLoaded 阶段执行。
      return true;
    } catch (e) {
      return false;
    }
  }

  var navBootedEarly = bootNavEarly();

  // 宪法 1.4：头像加载失败兜底——任何 <img> 加载出错且非默认头像时，
  // 自动回退到统一默认头像，杜绝破图图标。
  var DEFAULT_AVATAR_URL = '/xuewaiyu/assets/images/default_avatar.png';
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && el.src && el.src.indexOf('default_avatar') === -1) {
      el.src = DEFAULT_AVATAR_URL;
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    // 恢复原生登录态（页面加载时）
    restoreLoginStateFromNative();
    // 原生音频垫片已在脚本加载时安装，此处确保 DOM 就绪后状态正确
    enforceOnboarding();
    // 若早期注入已完成，这里的调用是幂等的（ensureNav 内部会复用已存在的 .bottom-nav）
    injectStyle();
    ensureNav();
    ensureBackBtn();
    syncLangFromServer();
    // 若已有 token，同步到原生存储（覆盖更新）
    if (getToken()) saveLoginStateToNative();

    // P2 终验：前端 SSOT 篡改检测
    // 监听 localStorage 被外部（控制台）修改，自动恢复后端真值
    installTamperDetection();
  });

  // ============================================================
  // P2: 全局异常兜底 — 网络异常、接口失败、页面加载失败
  // ============================================================
  (function() {
    var errorToastTimer = null;
    function showGlobalError(msg) {
      if (errorToastTimer) return; // 5秒内不重复弹出
      var existing = document.querySelector('.ailos-global-error');
      if (existing) existing.remove();
      var el = document.createElement('div');
      el.className = 'ailos-global-error';
      el.innerHTML = '<span>' + (msg || '网络异常，请检查连接') + '</span>';
      el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:24px;background:#fee2e2;color:#991b1b;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:fadeInDown .3s ease;cursor:pointer;';
      el.onclick = function() { el.remove(); };
      document.body.appendChild(el);
      errorToastTimer = setTimeout(function() {
        if (el.parentNode) el.remove();
        errorToastTimer = null;
      }, 5000);
    }

    // 离线检测
    window.addEventListener('offline', function() {
      showGlobalError('网络已断开，请检查连接后重试');
    });
    window.addEventListener('online', function() {
      var el = document.querySelector('.ailos-global-error');
      if (el && el.textContent.indexOf('断开') > -1) el.remove();
    });

    // 全局未捕获异常
    window.addEventListener('error', function(e) {
      console.error('[AILOS] Unhandled error:', e.error || e.message);
      // 不弹toast，避免用户困扰，仅console记录
    });

    // 全局未处理 Promise rejection
    window.addEventListener('unhandledrejection', function(e) {
      console.error('[AILOS] Unhandled rejection:', e.reason);
      if (e.reason && e.reason.message && e.reason.message.indexOf('Failed to fetch') > -1) {
        showGlobalError('网络请求失败，请检查网络连接');
      }
    });

    // 导出全局错误提示
    window.AILOS_SHOW_ERROR = showGlobalError;
  })();

  // Stage9 M5: 语言切换时重新渲染导航标签
  window.addEventListener('languageChanged', function () {
    renderNav(detectActive());
  });

  // Stage9 M5: 社群模式公共方法
  function reloadNav() {
    renderNav(detectActive());
  }

  // ===== P2 终验：前端 SSOT 篡改检测 =====
  // P3 审计：5 大类核心配置全覆盖防护
  var TAMPER_PROTECTED_KEYS = [
    STUDY_KEY, LEGACY_KEY, UI_LANG_KEY,                // 语言配置
    'yandao_native_lang', 'yandao_level_assessment',    // 母语 + 学习等级
    'yandao_ai_quota', 'yandao_quota_used',             // AI 额度
    'yandao_membership', 'yandao_member_expire',        // 会员状态
    'yandao_points', 'yandao_xp_total'                  // 积分
  ];

  function installTamperDetection() {
    // ① 页面初始化：比对本地缓存与后端真值（P3 审计：5 大类全覆盖）
    var token = getToken();
    if (token) {
      fetch('/api/user/profile', {
        headers: { 'Authorization': 'Bearer ' + token },
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.success && data.user) {
            // 语言配置
            var serverLang = data.user.targetLanguage || data.user.studyLanguage;
            if (serverLang) {
              try { localStorage.setItem(STUDY_KEY, serverLang); } catch(e) {}
              try { localStorage.setItem(LEGACY_KEY, serverLang); } catch(e) {}
            }
            if (data.user.uiLanguage) {
              try { localStorage.setItem(UI_LANG_KEY, data.user.uiLanguage); } catch(e) {}
            }
            // 学习等级
            if (data.user.level || data.user.studyLevel) {
              try { localStorage.setItem('yandao_level_assessment', JSON.stringify({ level: data.user.level || data.user.studyLevel, at: Date.now() })); } catch(e) {}
            }
          }
        }).catch(function() { /* 网络不可用，使用本地缓存 */ });

      // AI 额度同步
      fetch('/api/ai/quota', {
        headers: { 'Authorization': 'Bearer ' + token },
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.success) {
            try { localStorage.setItem('yandao_ai_quota', String(data.total || data.dailyTotal || '')); } catch(e) {}
            try { localStorage.setItem('yandao_quota_used', String(data.used || '')); } catch(e) {}
          }
        }).catch(function() {});

      // 会员状态同步
      fetch('/api/membership/status', {
        headers: { 'Authorization': 'Bearer ' + token },
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.success) {
            try { localStorage.setItem('yandao_membership', data.planType || data.membership || ''); } catch(e) {}
            if (data.expireAt) {
              try { localStorage.setItem('yandao_member_expire', data.expireAt); } catch(e) {}
            }
          }
        }).catch(function() {});
    }

    // ② storage 事件监听：检测 localStorage 被外部修改
    try {
      window.addEventListener('storage', function(e) {
        if (e.key && TAMPER_PROTECTED_KEYS.indexOf(e.key) >= 0) {
          // 检测到核心配置被篡改，触发同步刷新
          if (token) {
            syncLangFromServer();
          }
        }
      });
    } catch (e) {}

    // ③ 定时巡检（每30秒）：检测核心字段是否被控制台修改
    setInterval(function() {
      var needsSync = false;
      for (var i = 0; i < TAMPER_PROTECTED_KEYS.length; i++) {
        var key = TAMPER_PROTECTED_KEYS[i];
        var current = localStorage.getItem(key);
        if (window['__ailos_ssot_' + key] && current !== window['__ailos_ssot_' + key]) {
          needsSync = true;
          break;
        }
        if (current) window['__ailos_ssot_' + key] = current;
      }
      if (needsSync && getToken()) {
        syncLangFromServer();
      }
    }, 30000);
  }

  window.AILOS = {
    STUDY_KEY: STUDY_KEY,
    LEGACY_KEY: LEGACY_KEY,
    UI_LANG_KEY: UI_LANG_KEY,
    LANG_NAMES: LANG_NAMES,
    CODE_TO_LABEL: CODE_TO_LABEL,
    LABEL_TO_CODE: LABEL_TO_CODE,
    TRADITIONAL_I18N: TRADITIONAL_I18N,
    toTraditional: toTraditional,
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
    setToken: setToken,
    clearToken: clearToken,
    authFetch: authFetch,
    TOKEN_KEY: TOKEN_KEY,
    syncStudyLangFromApi: syncStudyLangFromApi,
    syncLangFromServer: syncLangFromServer,
    renderNav: renderNav,
    reloadNav: reloadNav,
    isCommunityPage: isCommunityPage,
    NAV_ITEMS: NAV_ITEMS,
    isNativeApp: isNativeApp,
    isNativeAudioAvailable: isNativeAudioAvailable,
    playPronunciation: playPronunciation,
    playTTS: playTTS,
    stopAllAudio: stopAllAudio,
    saveLoginStateToNative: saveLoginStateToNative,
    restoreLoginStateFromNative: restoreLoginStateFromNative,
    clearNativeLoginState: clearNativeLoginState,
    startAutoRefresh: startAutoRefresh,
    stopAutoRefresh: stopAutoRefresh,
    tryRefreshToken: tryRefreshToken,
    // P3 任务一：异步就绪 Promise
    ready: ready,
    isReady: function() { return _readyResolved; }
  };

  // 全局函数暴露（供未引用 window.AILOS 的页面直接调用）
  window.playPronunciation = playPronunciation;
  window.playTTS = playTTS;
  window.stopAllAudio = stopAllAudio;
})();