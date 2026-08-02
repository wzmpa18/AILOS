package com.yandao.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

/**
 * P0 FIX: Custom SwipeRefreshLayout that correctly checks WebView scroll state
 *
 * Root cause: Default SwipeRefreshLayout.canChildScrollUp() checks its direct child
 * (FrameLayout), which always returns false. This causes upward scroll gestures
 * to be intercepted as pull-to-refresh, preventing users from scrolling up.
 *
 * Fix: Override canChildScrollUp() to find the WebView inside the FrameLayout
 * and check its scroll state instead.
 */
public class CustomSwipeRefreshLayout extends SwipeRefreshLayout {

    private WebView webView;

    public CustomSwipeRefreshLayout(Context context) {
        super(context);
    }

    public CustomSwipeRefreshLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public void setWebView(WebView webView) {
        this.webView = webView;
    }

    @Override
    public boolean canChildScrollUp() {
        if (webView != null) {
            // Check if WebView can scroll up (content is above current position)
            return webView.canScrollVertically(-1);
        }
        // Fallback: try to find WebView in child views
        View child = getChildAt(0);
        if (child instanceof FrameLayout) {
            FrameLayout frame = (FrameLayout) child;
            for (int i = 0; i < frame.getChildCount(); i++) {
                View v = frame.getChildAt(i);
                if (v instanceof WebView) {
                    return v.canScrollVertically(-1);
                }
            }
        }
        return super.canChildScrollUp();
    }
}
