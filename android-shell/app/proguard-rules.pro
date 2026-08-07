# AILOS v3.2.0 ProGuard Rules
# WebView shell - minimal obfuscation, keep WebView bridge interfaces

# --- WebView Bridge ---
-keepclassmembers class ai.yandao.ailos.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class ai.yandao.ailos.WebAppInterface { *; }
-keep class ai.yandao.ailos.MainActivity { *; }

# --- AndroidX / Material ---
-keep class androidx.appcompat.** { *; }
-keep class com.google.android.material.** { *; }

# --- BuildConfig ---
-keep class ai.yandao.ailos.BuildConfig { *; }

# --- Remove debug logs in release ---
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
