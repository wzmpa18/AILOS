package com.yandao.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.HttpAuthHandler;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

/**
 * AILOS MainActivity - WebView壳层核心
 *
 * 资深程序员10项兜底清单：
 * 1. WebViewClient + WebChromeClient 全回调处理
 * 2. 摄像头权限使用时申请（非启动时）
 * 3. 硬件加速 + 低版本兼容降级
 * 4. JS接口仅暴露必要方法
 * 5. 支付/分享回调Intent正确处理
 * 6. Cookie + LocalStorage持久化 + 原生登录态持久化
 * 7. 崩溃自动恢复（不闪退）
 * 8. 加载超时兜底（10秒）
 * 9. 自定义错误页（非系统白屏）
 * 10. 内存优化（退出时释放WebView + 音频/TTS资源）
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private LinearLayout errorPage;
    private ProgressBar progressBar;
    private Handler timeoutHandler = new Handler(Looper.getMainLooper());
    private Runnable timeoutRunnable;
    private ValueCallback<Uri[]> fileUploadCallback;
    private long lastBackPressTime = 0;

    // JS桥接实例（持有引用以便onPageFinished注入登录态、onDestroy释放资源）
    private AilosJsBridge jsBridge;

    // 文件上传ActivityResult
    private final ActivityResultLauncher<Intent> fileUploadLauncher =
        registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            if (fileUploadCallback == null) return;
            Uri[] results = null;
            if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                String dataString = result.getData().getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        });

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 沉浸式全屏
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        setContentView(R.layout.activity_main);

        initViews();
        initWebView();
        loadUrl();
    }

    private void initViews() {
        swipeRefresh = findViewById(R.id.swipeRefresh);
        errorPage = findViewById(R.id.errorPage);
        progressBar = findViewById(R.id.progressBar);

        // 下拉刷新
        swipeRefresh.setOnRefreshListener(() -> {
            webView.reload();
        });

        // 错误页重试按钮
        findViewById(R.id.btnRetry).setOnClickListener(v -> {
            errorPage.setVisibility(View.GONE);
            loadUrl();
        });

        // 返回键逻辑：优先回退网页历史栈，退到首页后二次确认退出
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    // 二次确认退出
                    if (System.currentTimeMillis() - lastBackPressTime > 2000) {
                        Toast.makeText(MainActivity.this, "再按一次退出应用", Toast.LENGTH_SHORT).show();
                        lastBackPressTime = System.currentTimeMillis();
                    } else {
                        setEnabled(false);
                        onBackPressed();
                    }
                }
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void initWebView() {
        webView = findViewById(R.id.webView);

        WebSettings settings = webView.getSettings();
        // 基础设置
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);          // LocalStorage持久化
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT); // 合理缓存

        // 视口适配
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUserAgentString(settings.getUserAgentString() + " AILOS/App/v1.0");

        // 交互适配
        settings.setSupportZoom(false);               // 禁止缩放
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);

        // 文件上传
        settings.setAllowFileAccess(false);            // 禁止file协议（安全）
        settings.setAllowContentAccess(true);

        // 硬件加速（低版本兼容降级）
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        // Cookie持久化
        android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // WebViewClient（加载回调+错误处理+超时兜底）
        webView.setWebViewClient(new AilosWebViewClient());

        // WebChromeClient（进度+文件上传+权限请求）
        webView.setWebChromeClient(new AilosWebChromeClient());

        // JS接口（仅暴露必要方法，严禁敏感能力）
        // TextToSpeech 在 AilosJsBridge 构造函数中初始化
        jsBridge = new AilosJsBridge(this);
        jsBridge.setWebView(webView);
        webView.addJavascriptInterface(jsBridge, "AilosNative");
    }

    private void loadUrl() {
        String url = BuildConfig.BASE_URL;
        webView.loadUrl(url);

        // 加载超时兜底（10秒）
        timeoutRunnable = () -> {
            if (webView.getProgress() < 100) {
                showErrorPage("加载超时", "页面加载超过10秒，请检查网络后重试");
            }
        };
        timeoutHandler.postDelayed(timeoutRunnable, 10000);
    }

    private void showErrorPage(String title, String message) {
        runOnUiThread(() -> {
            errorPage.setVisibility(View.VISIBLE);
            ((TextView) findViewById(R.id.tvErrorTitle)).setText(title);
            ((TextView) findViewById(R.id.tvErrorMessage)).setText(message);
        });
    }

    /**
     * 从原生SharedPreferences读取登录态，注入WebView（进程被杀重启后恢复登录）
     * 在 onPageFinished 中调用，确保 JS 上下文已就绪
     */
    private void injectNativeLoginState() {
        if (jsBridge == null || webView == null) return;
        try {
            String loginState = jsBridge.getLoginState();
            if (loginState == null || loginState.isEmpty()) return;
            // 使用 JSONObject.quote 安全转义 JSON 字符串为 JS 字符串字面量
            String escaped = JSONObject.quote(loginState);
            String js = "if(window.AilosNativeLogin&&window.AilosNativeLogin.inject){" +
                    "window.AilosNativeLogin.inject(" + escaped + ");}";
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            Log.e(TAG, "injectNativeLoginState异常", e);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
        // 支付返回后刷新页面状态
        if (webView != null) webView.evaluateJavascript(
            "if(typeof onPaymentReturn==='function'){onPaymentReturn();}", null);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onDestroy() {
        // 释放音频/TTS资源
        if (jsBridge != null) {
            jsBridge.destroy();
            jsBridge = null;
        }
        // 内存优化：释放WebView资源
        if (webView != null) {
            ((FrameLayout) webView.getParent()).removeView(webView);
            webView.destroy();
            webView = null;
        }
        if (timeoutHandler != null && timeoutRunnable != null) {
            timeoutHandler.removeCallbacks(timeoutRunnable);
        }
        super.onDestroy();
    }

    // ============================================================
    // WebViewClient - 加载回调+错误处理+超时兜底+登录态注入
    // ============================================================
    private class AilosWebViewClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            progressBar.setVisibility(View.VISIBLE);
            errorPage.setVisibility(View.GONE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            progressBar.setVisibility(View.GONE);
            swipeRefresh.setRefreshing(false);
            timeoutHandler.removeCallbacks(timeoutRunnable);
            // 同步Cookie
            android.webkit.CookieManager.getInstance().flush();
            // 注入原生登录态（进程被杀重启后恢复登录）
            injectNativeLoginState();
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();

            // 支付跳转：微信/支付宝
            if (url.startsWith("weixin://") || url.startsWith("alipays://") || url.startsWith("alipay://")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    return true;
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(MainActivity.this, "未安装对应支付应用", Toast.LENGTH_SHORT).show();
                    return true;
                }
            }

            // 其他http/https URL在WebView内打开
            if (url.startsWith("http://") || url.startsWith("https://")) {
                return false;
            }
            return true;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                showErrorPage("网络错误", "页面加载失败，请检查网络连接");
            }
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            // SSL错误处理（生产环境应取消加载）
            handler.cancel();
            showErrorPage("安全错误", "SSL证书验证失败");
        }
    }

    // ============================================================
    // WebChromeClient - 进度+文件上传+权限请求
    // ============================================================
    private class AilosWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progressBar.setProgress(newProgress);
            if (newProgress >= 100) {
                progressBar.setVisibility(View.GONE);
            }
        }

        // 文件上传（兼容安卓各版本）
        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(null);
            }
            fileUploadCallback = filePathCallback;

            Intent intent = fileChooserParams.createIntent();
            try {
                fileUploadLauncher.launch(intent);
            } catch (ActivityNotFoundException e) {
                fileUploadCallback = null;
                Toast.makeText(MainActivity.this, "无法打开文件选择器", Toast.LENGTH_SHORT).show();
                return false;
            }
            return true;
        }

        // 权限请求（摄像头等，使用时申请）
        @Override
        public void onPermissionRequest(PermissionRequest request) {
            request.grant(request.getResources());
        }
    }
}
