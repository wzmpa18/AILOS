package ai.yandao.ailos;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;

import androidx.core.content.ContextCompat;

/**
 * AILOS v3.2.0 WebAppInterface
 *
 * H5 与原生能力的 JS 桥接接口。
 * H5 通过 window.AndroidBridge.xxx() 调用原生能力。
 *
 * 安全规则：
 *   1. 所有方法都有 @JavascriptInterface 注解
 *   2. 不暴露任何敏感信息（密钥/数据库地址/文件路径）
 *   3. 权限请求方法仅负责弹窗，不自动授权
 */
public class WebAppInterface {

    private static final String TAG = "AILOS_WebAppInterface";
    private final Context context;

    public WebAppInterface(Context context) {
        this.context = context;
    }

    /**
     * 获取 APP 版本名称
     */
    @JavascriptInterface
    public String getAppVersion() {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionName;
        } catch (Exception e) {
            Log.e(TAG, "获取版本号失败", e);
            return "unknown";
        }
    }

    /**
     * 获取 APP 版本号（versionCode）
     */
    @JavascriptInterface
    public int getAppVersionCode() {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionCode;
        } catch (Exception e) {
            Log.e(TAG, "获取版本号失败", e);
            return 0;
        }
    }

    /**
     * 请求相机权限（拍照翻译/语音对话时 H5 调用）
     */
    @JavascriptInterface
    public void requestCameraPermission() {
        Log.d(TAG, "H5 请求相机权限");
        if (context instanceof MainActivity) {
            ((MainActivity) context).checkAndRequestPermissions(
                new String[]{ Manifest.permission.CAMERA });
        }
    }

    /**
     * 请求录音权限（语音对话时 H5 调用）
     */
    @JavascriptInterface
    public void requestMicrophonePermission() {
        Log.d(TAG, "H5 请求录音权限");
        if (context instanceof MainActivity) {
            ((MainActivity) context).checkAndRequestPermissions(
                new String[]{ Manifest.permission.RECORD_AUDIO });
        }
    }

    /**
     * 请求存储权限（文件上传时 H5 调用）
     */
    @JavascriptInterface
    public void requestStoragePermission() {
        Log.d(TAG, "H5 请求存储权限");
        if (context instanceof MainActivity) {
            ((MainActivity) context).checkAndRequestPermissions(
                new String[]{ Manifest.permission.READ_EXTERNAL_STORAGE });
        }
    }

    /**
     * 检查指定权限是否已授权
     */
    @JavascriptInterface
    public boolean hasPermission(String permission) {
        return ContextCompat.checkSelfPermission(context, permission)
            == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    /**
     * 调用系统分享面板（H5 分享时调用）
     */
    @JavascriptInterface
    public void shareText(String text) {
        Log.d(TAG, "H5 请求分享: " + text);
        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(android.content.Intent.EXTRA_TEXT, text);
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(android.content.Intent.createChooser(intent, "分享到"));
    }
}
