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

# 保留JS接口 (package: com.yandao.app)
-keepclassmembers class com.yandao.app.AilosJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# 保留BuildConfig
-keep class com.yandao.app.BuildConfig { *; }

# 移除调试日志
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
    public static int i(...);
}

# 保留AppCompatActivity
-keep class androidx.appcompat.app.AppCompatActivity { *; }