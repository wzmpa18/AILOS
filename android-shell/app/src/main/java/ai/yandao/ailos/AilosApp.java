package ai.yandao.ailos;

import android.app.Application;
import android.webkit.WebView;

/**
 * Application - 全局初始化
 */
public class AilosApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // WebView预加载（加速首次启动）
        new WebView(this).destroy();
    }
}
