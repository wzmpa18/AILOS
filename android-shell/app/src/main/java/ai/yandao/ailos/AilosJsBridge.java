package ai.yandao.ailos;

import android.app.Activity;
import android.content.Intent;
import android.webkit.JavascriptInterface;

/**
 * JS桥接接口 - 仅暴露必要方法，严禁敏感能力
 * 前端通过 window.AilosNative.xxx() 调用
 */
public class AilosJsBridge {
    private Activity activity;

    public AilosJsBridge(Activity activity) {
        this.activity = activity;
    }

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
}
