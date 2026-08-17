package com.bizbot.os;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // CRITICAL: Force the WebView to NOT draw behind the status bar.
        // This ensures Razorpay checkout modal and all fixed-position elements
        // render below the system status bar, not behind it.
        Window window = getWindow();

        // Tell the system our app content should NOT extend behind system bars
        WindowCompat.setDecorFitsSystemWindows(window, true);

        // Set an opaque dark status bar so nothing renders behind it
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#0f172a"));

        // Ensure WebView settings are configured for checkout.js
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
        }
        // UPI Intent handling is done by Capacitor's BridgeWebViewClient.shouldOverrideUrlLoading
        // which calls Bridge.launchIntent → Intent.ACTION_VIEW for upi:// scheme URLs.
        // No native Razorpay SDK needed — checkout.js with webview_intent:true handles everything.
    }
}
