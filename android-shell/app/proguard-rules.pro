# AILOS ProGuard Rules
# 代码混淆 + 资源压缩 + 安全加固

# 保留WebView相关类
-keep class android.webkit.** { *; }
-keepclassmembers class * extends android.webkit.WebViewClient {
    public *;
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public *;
}

# 保留JS接口
-keepclassmembers class ai.yandao.ailos.AilosJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# 保留BuildConfig
-keep class ai.yandao.ailos.BuildConfig { *; }

# 移除调试日志
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
    public static int i(...);
}

# 保留AppCompatActivity
-keep class androidx.appcompat.app.AppCompatActivity { *; }
