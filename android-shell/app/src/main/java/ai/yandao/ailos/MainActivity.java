package ai.yandao.ailos;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.ArrayList;
import java.util.List;

/**
 * AILOS v3.2.0 MainActivity
 *
 * WebView 容器，加载线上 H5 页面，提供原生能力桥接。
 * 核心特性：
 *   1. 隐私协议弹窗（首次启动，用户同意后再加载 H5）
 *   2. WebView 全屏无标题栏/地址栏，与 H5 视觉无缝衔接
 *   3. 返回键适配（页面可返回时返回上一页，首页二次确认退出）
 *   4. 相机/相册/文件上传桥接（与浏览器端行为一致）
 *   5. 支持外部链接跳转、系统分享面板
 *   6. 禁止注入第三方统计 SDK / 广告 SDK
 *   7. 下拉刷新
 *   8. 网络异常友好提示（不白屏）
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "AILOS_MainActivity";
    private static final String PREFS_NAME = "ailos_prefs";
    private static final String KEY_PRIVACY_AGREED = "privacy_agreed_v3";
    private static final String KEY_FIRST_LAUNCH = "first_launch_v3";
    private static final long DOUBLE_BACK_PRESS_INTERVAL = 2000;

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private SharedPreferences prefs;
    private boolean isPrivacyAgreed = false;
    private long lastBackPressTime = 0;

    // 文件上传回调
    private ValueCallback<Uri[]> fileUploadCallback;
    private final ActivityResultLauncher<Intent> fileChooserLauncher =
        registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            if (fileUploadCallback == null) return;
            Uri[] results = null;
            if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                String dataString = result.getData().getDataString();
                if (dataString != null) {
                    results = new Uri[]{ Uri.parse(dataString) };
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        });

    // 权限请求回调
    private final ActivityResultLauncher<String[]> permissionLauncher =
        registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
            // 权限结果由 H5 端自行处理，原生仅负责弹窗
            Log.d(TAG, "Permission result: " + result);
        });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        isPrivacyAgreed = prefs.getBoolean(KEY_PRIVACY_AGREED, false);

        // 隐藏 ActionBar，全屏展示
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        setContentView(R.layout.activity_main);

        swipeRefresh = findViewById(R.id.swipe_refresh);
        webView = findViewById(R.id.web_view);

        // 下拉刷新
        swipeRefresh.setOnRefreshListener(() -> {
            if (webView != null) {
                webView.reload();
            }
        });

        // 隐私协议弹窗（首次启动）
        if (!isPrivacyAgreed) {
            showPrivacyDialog();
        } else {
            initWebView();
            loadUrl();
        }

        // 返回键适配
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    // 首页二次确认退出
                    if (System.currentTimeMillis() - lastBackPressTime < DOUBLE_BACK_PRESS_INTERVAL) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                    } else {
                        lastBackPressTime = System.currentTimeMillis();
                        // 使用原生 Toast（不依赖 H5）
                        android.widget.Toast.makeText(MainActivity.this,
                            "再按一次返回键退出", android.widget.Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }

    /**
     * 隐私协议弹窗（首次启动）
     * 用户同意后才加载 H5 页面，符合工信部上架要求
     */
    private void showPrivacyDialog() {
        new AlertDialog.Builder(this)
            .setTitle("隐私政策与用户协议")
            .setMessage("欢迎使用「言道外语」！我们非常重视您的隐私保护。\n\n" +
                "在您使用本应用前，请仔细阅读《用户协议》和《隐私政策》。\n\n" +
                "本应用需要以下权限：\n" +
                "• 网络访问：加载学习内容\n" +
                "• 相机：拍照翻译功能\n" +
                "• 录音：语音对话功能\n" +
                "• 相册读取：图片上传\n\n" +
                "点击「同意并继续」表示您已阅读并同意以上协议。")
            .setPositiveButton("同意并继续", (dialog, which) -> {
                prefs.edit().putBoolean(KEY_PRIVACY_AGREED, true).putBoolean(KEY_FIRST_LAUNCH, false).apply();
                isPrivacyAgreed = true;
                initWebView();
                loadUrl();
            })
            .setNegativeButton("不同意", (dialog, which) -> {
                finish();
            })
            .setCancelable(false)
            .show();
    }

    /**
     * 初始化 WebView 配置
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void initWebView() {
        WebSettings settings = webView.getSettings();
        // JavaScript 必须开启（H5 依赖）
        settings.setJavaScriptEnabled(true);
        // DOM Storage（H5 本地缓存依赖）
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // 缓存策略
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        // 视口缩放
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        // 禁止用户手动缩放（与 H5 设计一致）
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        // 混合内容（HTTPS 页面加载 HTTP 资源，应避免但需兼容）
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // 文件访问
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        // JS 弹窗
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        // WebViewClient：页面导航控制
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // HTTPS 内部链接：在 WebView 内加载
                if (url.startsWith("https://yandao.vip") || url.startsWith("https://127.0.0.1")) {
                    return false;
                }
                // 外部链接：调用系统浏览器
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }
                // 其他 scheme（tel: mailto: weixin: 等）
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    Log.w(TAG, "无法打开链接: " + url);
                    return true;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (swipeRefresh.isRefreshing()) {
                    swipeRefresh.setRefreshing(false);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                // 主页面加载失败时显示友好提示（不白屏）
                if (request.isForMainFrame()) {
                    view.loadDataWithBaseURL(null,
                        "<html><body style='text-align:center;padding-top:40vh;font-size:16px;color:#666;'>" +
                        "网络连接失败，请检查网络后下拉刷新重试" +
                        "</body></html>",
                        "text/html", "UTF-8", null);
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // SSL 错误：禁止继续加载（安全优先）
                handler.cancel();
                Log.e(TAG, "SSL Error: " + error.toString());
            }
        });

        // WebChromeClient：文件上传、全屏等
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                // 确保前一个回调被处理
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                // 检查相机权限（拍照翻译需要）
                boolean needCamera = false;
                if (fileChooserParams.isAcceptTypeAvailable("image/*")) {
                    needCamera = true;
                }

                Intent contentIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentIntent.setType("image/*");
                contentIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);

                Intent chooserIntent = Intent.createChooser(contentIntent, "选择图片");
                if (needCamera) {
                    // 添加拍照选项
                    Intent cameraIntent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);
                    chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{ cameraIntent });
                }

                try {
                    fileChooserLauncher.launch(chooserIntent);
                } catch (Exception e) {
                    fileUploadCallback.onReceiveValue(null);
                    fileUploadCallback = null;
                    Log.e(TAG, "文件选择器启动失败", e);
                }
                return true;
            }
        });

        // JS 桥接接口
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");
    }

    /**
     * 加载 H5 首页
     */
    private void loadUrl() {
        String baseUrl = BuildConfig.BASE_URL;
        Log.i(TAG, "Loading URL: " + baseUrl);
        webView.loadUrl(baseUrl);
    }

    /**
     * 检查并请求权限（H5 调用时触发）
     */
    public void checkAndRequestPermissions(String[] permissions) {
        List<String> needed = new ArrayList<>();
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                needed.add(perm);
            }
        }
        if (!needed.isEmpty()) {
            permissionLauncher.launch(needed.toArray(new String[0]));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidBridge");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
