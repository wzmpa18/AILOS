package com.yandao.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.Locale;

/**
 * JS桥接接口 - 仅暴露必要方法，严禁敏感能力
 * 前端通过 window.AilosNative.xxx() 调用
 *
 * 能力分组：
 *  1. 基础能力（分享/版本/退出/环境检测）
 *  2. 原生音频播放（MediaPlayer + TextToSpeech）—— 解决 WebView 内 speechSynthesis/Audio 不可用问题
 *  3. 登录态原生持久化（SharedPreferences MODE_PRIVATE）—— 解决进程被杀后登录态丢失
 */
public class AilosJsBridge {
    private static final String TAG = "AilosJsBridge";

    private Activity activity;
    private WebView webView;
    private Handler mainHandler = new Handler(Looper.getMainLooper());

    // ===== 音频播放 =====
    // 静态单例 MediaPlayer，避免反复创建导致内存泄漏
    private static volatile MediaPlayer sMediaPlayer;
    private static volatile boolean sAudioPlaying = false;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    // ===== TextToSpeech =====
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;

    // ===== 登录态持久化 =====
    private static final String PREFS_NAME = "ailos_native_prefs";
    private static final String KEY_LOGIN_STATE = "login_state_json";
    private SharedPreferences prefs;

    public AilosJsBridge(Activity activity) {
        this.activity = activity;
        Context ctx = activity.getApplicationContext();
        this.audioManager = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        this.prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        initTts(ctx);
    }

    /** 注入WebView引用，用于原生→JS回调 */
    public void setWebView(WebView webView) {
        this.webView = webView;
    }

    // ============================================================
    // 基础能力
    // ============================================================

    /** 系统分享 */
    @JavascriptInterface
    public void share(String title, String text, String url) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_SUBJECT, title);
        intent.putExtra(Intent.EXTRA_TEXT, text + "\n" + url);
        activity.startActivity(Intent.createChooser(intent, "分享到"));
    }

    /** 获取App版本号 */
    @JavascriptInterface
    public String getAppVersion() {
        return BuildConfig.VERSION_NAME;
    }

    /** 获取App构建号 */
    @JavascriptInterface
    public int getBuildNumber() {
        return BuildConfig.VERSION_CODE;
    }

    /** 退出应用 */
    @JavascriptInterface
    public void exitApp() {
        activity.finishAffinity();
    }

    /** 检查是否为App环境 */
    @JavascriptInterface
    public boolean isApp() {
        return true;
    }

    /** 检查原生音频播放是否可用（前端据此决定走原生还是Web Audio） */
    @JavascriptInterface
    public boolean isNativeAudioAvailable() {
        return true;
    }

    // ============================================================
    // 原生音频播放 - MediaPlayer（URL音频文件）
    // ============================================================

    /**
     * 播放网络/本地音频文件
     * @param url 音频URL（http/https）
     */
    @JavascriptInterface
    public void playAudio(final String url) {
        if (url == null || url.trim().isEmpty()) {
            callbackToJs("onAudioError", "音频地址为空");
            return;
        }
        mainHandler.post(() -> {
            try {
                stopAudioInternal();
                if (!requestAudioFocus()) {
                    callbackToJs("onAudioError", "无法获取音频焦点");
                    return;
                }
                final MediaPlayer mp = new MediaPlayer();
                mp.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build());
                mp.setDataSource(url.trim());
                mp.setOnPreparedListener(player -> {
                    try {
                        player.start();
                        sAudioPlaying = true;
                    } catch (Exception e) {
                        Log.e(TAG, "播放启动失败", e);
                        callbackToJs("onAudioError", "播放启动失败: " + e.getMessage());
                        releaseMediaPlayer();
                    }
                });
                mp.setOnCompletionListener(player -> {
                    sAudioPlaying = false;
                    releaseMediaPlayer();
                    callbackToJs("onAudioComplete", null);
                });
                mp.setOnErrorListener((player, what, extra) -> {
                    sAudioPlaying = false;
                    releaseMediaPlayer();
                    String msg = "播放错误 (what=" + what + ", extra=" + extra + ")";
                    callbackToJs("onAudioError", msg);
                    return true;
                });
                mp.prepareAsync();
                sMediaPlayer = mp;
            } catch (Exception e) {
                Log.e(TAG, "playAudio异常", e);
                sAudioPlaying = false;
                releaseMediaPlayer();
                callbackToJs("onAudioError", "音频加载失败: " + e.getMessage());
            }
        });
    }

    /** 停止当前音频播放 */
    @JavascriptInterface
    public void stopAudio() {
        mainHandler.post(this::stopAudioInternal);
    }

    /** 检查音频是否正在播放 */
    @JavascriptInterface
    public boolean isAudioPlaying() {
        return sAudioPlaying;
    }

    // ============================================================
    // 原生语音合成 - TextToSpeech（TTS）
    // ============================================================

    /**
     * 使用Android TTS朗读文本（替代WebView不可用的 speechSynthesis）
     * @param text 要朗读的文本
     * @param lang 语言代码（支持 en/zh/ja/ko/fr/es/de 及 BCP-47 如 en-US/zh-CN/ja-JP/ko-KR）
     */
    @JavascriptInterface
    public void speakText(final String text, final String lang) {
        if (text == null || text.trim().isEmpty()) {
            callbackToJs("onTtsError", "朗读文本为空");
            return;
        }
        mainHandler.post(() -> {
            try {
                if (tts == null) {
                    callbackToJs("onTtsError", "语音引擎未初始化");
                    return;
                }
                if (!ttsReady) {
                    callbackToJs("onTtsError", "语音引擎尚未就绪，请稍后重试");
                    return;
                }
                // 按语言切换TTS引擎
                setTtsLanguage(lang);
                // 停止当前音频播放，避免混音
                stopAudioInternal();
                int result = tts.speak(text.trim(), TextToSpeech.QUEUE_FLUSH, null,
                        "ailos_tts_" + System.currentTimeMillis());
                if (result != TextToSpeech.SUCCESS) {
                    callbackToJs("onTtsError", "语音合成失败 (code=" + result + ")");
                }
            } catch (Exception e) {
                Log.e(TAG, "speakText异常", e);
                callbackToJs("onTtsError", "朗读失败: " + e.getMessage());
            }
        });
    }

    /** 停止TTS朗读 */
    @JavascriptInterface
    public void stopTts() {
        mainHandler.post(() -> {
            try {
                if (tts != null) tts.stop();
            } catch (Exception e) {
                Log.e(TAG, "stopTts异常", e);
            }
        });
    }

    /** 检查TTS是否就绪 */
    @JavascriptInterface
    public boolean isTtsReady() {
        return ttsReady;
    }

    // ============================================================
    // 登录态原生持久化 - SharedPreferences (MODE_PRIVATE)
    // ============================================================

    /**
     * 保存登录态到原生存储（进程被杀后仍可恢复）
     * @param token 访问令牌
     * @param userInfo 用户信息JSON字符串（可含 refreshToken / userId / username 等）
     */
    @JavascriptInterface
    public void saveLoginState(String token, String userInfo) {
        try {
            JSONObject obj = new JSONObject();
            obj.put("token", token != null ? token : "");
            // userInfo 可能是 JSON 字符串或普通字符串，统一存储
            if (userInfo != null && !userInfo.trim().isEmpty()) {
                try {
                    obj.put("userInfo", new JSONObject(userInfo));
                } catch (Exception e) {
                    obj.put("userInfo", userInfo);
                }
                // 尝试从 userInfo 中提取 refreshToken
                try {
                    JSONObject ui = new JSONObject(userInfo);
                    if (ui.has("refreshToken")) {
                        obj.put("refreshToken", ui.optString("refreshToken", ""));
                    }
                } catch (Exception ignored) {}
            }
            obj.put("savedAt", System.currentTimeMillis());
            prefs.edit().putString(KEY_LOGIN_STATE, obj.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "saveLoginState异常", e);
        }
    }

    /**
     * 读取原生存储的登录态
     * @return JSON字符串 {token, refreshToken, userInfo, savedAt}，无数据返回 null
     */
    @JavascriptInterface
    public String getLoginState() {
        try {
            String raw = prefs.getString(KEY_LOGIN_STATE, null);
            if (raw == null || raw.isEmpty()) return null;
            // 校验JSON有效性
            new JSONObject(raw);
            return raw;
        } catch (Exception e) {
            Log.e(TAG, "getLoginState异常", e);
            return null;
        }
    }

    /** 清除原生登录态（退出登录时调用） */
    @JavascriptInterface
    public void clearLoginState() {
        try {
            prefs.edit().remove(KEY_LOGIN_STATE).apply();
        } catch (Exception e) {
            Log.e(TAG, "clearLoginState异常", e);
        }
    }

    // ============================================================
    // 内部方法
    // ============================================================

    /** 初始化TextToSpeech，支持多语言 */
    private void initTts(Context ctx) {
        try {
            tts = new TextToSpeech(ctx, status -> {
                if (status == TextToSpeech.SUCCESS) {
                    ttsReady = true;
                    // 默认设为英文，实际朗读时按 lang 动态切换
                    setTtsLanguage("en-US");
                    // 注册朗读进度监听，回调JS以更新speaking状态
                    tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override
                        public void onStart(String utteranceId) {
                            callbackToJs("onTtsStart", null);
                        }

                        @Override
                        public void onDone(String utteranceId) {
                            callbackToJs("onTtsComplete", null);
                        }

                        @Override
                        public void onError(String utteranceId) {
                            callbackToJs("onTtsError", "朗读过程中发生错误");
                        }
                    });
                } else {
                    ttsReady = false;
                    Log.w(TAG, "TextToSpeech初始化失败 status=" + status);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "initTts异常", e);
            ttsReady = false;
        }
    }

    /** 根据语言代码设置TTS语言，返回是否可用 */
    private boolean setTtsLanguage(String lang) {
        if (tts == null || lang == null) return false;
        Locale locale = langToLocale(lang);
        int result = tts.setLanguage(locale);
        return result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED;
    }

    /** 语言代码 → Locale 映射（支持短码与BCP-47） */
    private Locale langToLocale(String lang) {
        if (lang == null || lang.isEmpty()) return Locale.US;
        String l = lang.trim().toLowerCase();
        // BCP-47 处理：en-US / zh-CN / ja-JP / ko-KR / fr-FR / es-ES / de-DE
        if (l.contains("-")) {
            String[] parts = l.split("-");
            if (parts.length >= 2) {
                return new Locale(parts[0], parts[1]);
            }
        }
        switch (l) {
            case "zh": return Locale.SIMPLIFIED_CHINESE;
            case "en": return Locale.US;
            case "ja": return Locale.JAPANESE;
            case "ko": return Locale.KOREAN;
            case "fr": return Locale.FRENCH;
            case "es": return new Locale("es", "ES");
            case "de": return Locale.GERMAN;
            default:   return Locale.US;
        }
    }

    /** 释放MediaPlayer资源 */
    private void releaseMediaPlayer() {
        try {
            if (sMediaPlayer != null) {
                try { sMediaPlayer.stop(); } catch (Exception ignored) {}
                sMediaPlayer.release();
                sMediaPlayer = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "releaseMediaPlayer异常", e);
        }
        abandonAudioFocus();
    }

    /** 停止音频播放（内部，须在主线程） */
    private void stopAudioInternal() {
        sAudioPlaying = false;
        releaseMediaPlayer();
    }

    /** 请求音频焦点 */
    private boolean requestAudioFocus() {
        if (audioManager == null) return true; // 无AudioManager时不阻断
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build();
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(attrs)
                        .setOnAudioFocusChangeListener(focusChange -> {
                            // 失去焦点时停止播放
                            if (focusChange == AudioManager.AUDIOFOCUS_LOSS
                                    || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                                stopAudioInternal();
                            }
                        })
                        .build();
                return audioManager.requestAudioFocus(audioFocusRequest)
                        == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
            } else {
                @SuppressWarnings("deprecation")
                int result = audioManager.requestAudioFocus(
                        focusChange -> {
                            if (focusChange == AudioManager.AUDIOFOCUS_LOSS
                                    || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                                stopAudioInternal();
                            }
                        },
                        AudioManager.STREAM_MUSIC,
                        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
                return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
            }
        } catch (Exception e) {
            Log.e(TAG, "requestAudioFocus异常", e);
            return true; // 异常时不阻断播放
        }
    }

    /** 释放音频焦点 */
    private void abandonAudioFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
                audioFocusRequest = null;
            } else {
                audioManager.abandonAudioFocus(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "abandonAudioFocus异常", e);
        }
    }

    /** 原生→JS回调（安全调用，webView可能为null） */
    private void callbackToJs(final String method, final String message) {
        if (webView == null) return;
        mainHandler.post(() -> {
            try {
                String js;
                if (message != null) {
                    js = "if(window.AilosNativeCallback&&window.AilosNativeCallback." + method
                            + "){window.AilosNativeCallback." + method + "("
                            + JSONObject.quote(message) + ");}";
                } else {
                    js = "if(window.AilosNativeCallback&&window.AilosNativeCallback." + method
                            + "){window.AilosNativeCallback." + method + "();}";
                }
                webView.evaluateJavascript(js, null);
            } catch (Exception e) {
                Log.e(TAG, "callbackToJs异常", e);
            }
        });
    }

    /** 释放所有资源（MainActivity.onDestroy 调用） */
    public void destroy() {
        mainHandler.post(() -> {
            stopAudioInternal();
            try {
                if (tts != null) {
                    tts.stop();
                    tts.shutdown();
                    tts = null;
                }
            } catch (Exception e) {
                Log.e(TAG, "destroy tts异常", e);
            }
            ttsReady = false;
        });
    }
}
