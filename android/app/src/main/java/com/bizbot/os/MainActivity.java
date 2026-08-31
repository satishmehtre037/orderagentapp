package com.bizbot.os;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#0f172a"));

        // Physically offset the WebView below the status bar height
        View decorView = window.getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, insets) -> {
            Insets statusBarInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars());
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null && statusBarInsets.top > 0) {
                ViewGroup.LayoutParams lp = webView.getLayoutParams();
                if (lp instanceof ViewGroup.MarginLayoutParams) {
                    ViewGroup.MarginLayoutParams mlp = (ViewGroup.MarginLayoutParams) lp;
                    if (mlp.topMargin != statusBarInsets.top) {
                        mlp.topMargin = statusBarInsets.top;
                        webView.setLayoutParams(mlp);
                    }
                } else {
                    webView.setPadding(0, statusBarInsets.top, 0, 0);
                }
            }
            return insets;
        });

        // Configure WebView for Razorpay & Native UPI Intent deep linking
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);

            // Strip Android WebView specific markers (; wv and Version/4.0) so Razorpay
            // identifies the environment as standard Google Chrome Mobile and provides
            // all native UPI Apps (GPay, PhonePe, Paytm, BHIM) as well as UPI QR options.
            String defaultUA = settings.getUserAgentString();
            String chromeMobileUA = defaultUA
                .replace("; wv", "")
                .replaceAll("Version/\\d+\\.\\d+\\s*", "");
            settings.setUserAgentString(chromeMobileUA);

            Bridge bridge = getBridge();
            if (bridge != null) {
                webView.setWebViewClient(new BridgeWebViewClient(bridge) {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        if (uri != null) {
                            String scheme = uri.getScheme();
                            String urlStr = uri.toString();
                            if (scheme != null && (
                                scheme.equalsIgnoreCase("upi") ||
                                scheme.equalsIgnoreCase("tez") ||
                                scheme.equalsIgnoreCase("phonepe") ||
                                scheme.equalsIgnoreCase("paytmmp") ||
                                scheme.equalsIgnoreCase("bhim") ||
                                scheme.equalsIgnoreCase("credpay") ||
                                scheme.equalsIgnoreCase("whatsapp") ||
                                scheme.equalsIgnoreCase("market") ||
                                scheme.equalsIgnoreCase("intent")
                            )) {
                                try {
                                    Intent intent;
                                    if (scheme.equalsIgnoreCase("intent")) {
                                        intent = Intent.parseUri(urlStr, Intent.URI_INTENT_SCHEME);
                                    } else {
                                        intent = new Intent(Intent.ACTION_VIEW, uri);
                                    }
                                    if (intent != null) {
                                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        view.getContext().startActivity(intent);
                                        return true;
                                    }
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                        }
                        return super.shouldOverrideUrlLoading(view, request);
                    }
                });
            }
        }
    }
}

