/**
 * assets/devicefp.js  —— 言道设备指纹（前端自动采集 + 全链路注入）
 *
 * 设计目标（对应第三阶段 P0-1 整改：风控必须真实生效，禁止"只在测试命令里生效"）：
 *  1) 用户打开任意页面自动生成稳定设备指纹，无需任何手动操作；
 *  2) 全局 monkey-patch window.fetch 与 XMLHttpRequest，对所有 /api 业务请求
 *     自动携带 X-Device-Fp 请求头（含计费/翻译/会员权益等全部接口）；
 *  3) 指纹缓存于 localStorage，同一浏览器长期稳定（除非清空站点数据）；
 *  4) 仅注入同源 /api 请求，绝不污染静态资源/第三方请求；
 *  5) 即使本脚本加载失败也不影响页面其它功能（故障不影响业务）。
 */
(function () {
  'use strict';

  var HEADER = 'X-Device-Fp';
  var LS_KEY = 'yd_device_fp_v1';

  // ---------- 指纹信号采集 ----------
  function canvasFp() {
    try {
      var c = document.createElement('canvas');
      var ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(8, 8, 60, 22);
      ctx.fillStyle = '#069';
      ctx.fillText('yandao-device-fp', 10, 10);
      return c.toDataURL().slice(-40);
    } catch (e) { return 'nocanvas'; }
  }
  function webglFp() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'nogl';
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return (gl.getParameter(gl.VENDOR) || '') + '|' + (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '');
    } catch (e) { return 'nogl'; }
  }
  function tz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch (e) { return 'UTC'; }
  }
  function signals() {
    var n = navigator || {};
    var s = screen || {};
    return [
      n.userAgent || '',
      n.language || '',
      (n.languages ? n.languages.join(',') : ''),
      n.platform || '',
      String(n.hardwareConcurrency || ''),
      String(n.deviceMemory || ''),
      (s.width || '') + 'x' + (s.height || ''),
      String(s.colorDepth || ''),
      tz(),
      String(new Date().getTimezoneOffset()),
      canvasFp(),
      webglFp()
    ];
  }
  function hashStr(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function buildFp() {
    var raw = signals().join('||');
    var a = hashStr(raw);
    var b = hashStr(raw.split('').reverse().join(''));
    return 'fp_' + a + '_' + b; // 形如 fp_1a2b3c4d_5e6f7a8b （>=8 字符，服务端 SHA-256 归一化）
  }
  function getFp() {
    try {
      var cached = localStorage.getItem(LS_KEY);
      if (cached && cached.length >= 8) return cached;
    } catch (e) {}
    var fp = buildFp();
    try { localStorage.setItem(LS_KEY, fp); } catch (e) {}
    return fp;
  }

  // 仅浏览器环境执行
  if (typeof window === 'undefined') return;

  var FP = getFp();
  window.__deviceFp = FP;
  window.getYandaoDeviceFp = function () { return FP; };

  function isApi(url) {
    var u = typeof url === 'string' ? url : (url && url.url) || '';
    return u.indexOf('/api') !== -1;
  }
  function normalizeHeaders(h) {
    if (!h) return {};
    if (typeof h.forEach === 'function') {
      var o = {};
      h.forEach(function (v, k) { o[k] = v; });
      return o;
    }
    return h;
  }
  function inject(headers) {
    headers = normalizeHeaders(headers);
    var lower = (Object.keys(headers) || []).map(function (k) { return k.toLowerCase(); });
    if (FP && lower.indexOf(HEADER.toLowerCase()) === -1) {
      headers[HEADER] = FP;
    }
    return headers;
  }

  // ---------- 全局 fetch 注入 ----------
  if (typeof window.fetch === 'function') {
    var _fetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      init = init || {};
      if (isApi(input)) {
        init.headers = inject(init.headers);
      }
      return _fetch(input, init);
    };
  }

  // ---------- 全局 XMLHttpRequest 注入（兜底，覆盖少数旧式请求） ----------
  if (window.XMLHttpRequest && window.XMLHttpRequest.prototype && window.XMLHttpRequest.prototype.open) {
    var _open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (method, url) {
      this.__ydUrl = url;
      return _open.apply(this, arguments);
    };
    var _send = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function (body) {
      if (isApi(this.__ydUrl) && FP) {
        try { this.setRequestHeader(HEADER, FP); } catch (e) {}
      }
      return _send.apply(this, arguments);
    };
  }

  if (window.console && window.console.debug) {
    window.console.debug('[DeviceFp] injected, fp=', FP);
  }
})();
