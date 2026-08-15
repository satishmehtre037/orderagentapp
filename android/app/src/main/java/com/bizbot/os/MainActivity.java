package com.bizbot.os;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
