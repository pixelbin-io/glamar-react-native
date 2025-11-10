// src/WebViewBridge.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import GlamArEmitter from "./GlamArEvents";
import { getGlamArConfig, waitForGlamArConfig } from "./GlamArConfig";
import { GlamArApi, VersionResponse } from "./GlamArApi";

let webViewInstance: (WebView & { injectJavaScript(js: string): void }) | null =
  null;
let isWebViewReady = false;

export const sendMessageToWebView = (message: any) => {
  const js = `
    (function() {
      try {
        const data = ${JSON.stringify(message)};
        try { window.postMessage && window.postMessage(data, '*'); } catch(e){}
        try { window.dispatchEvent && window.dispatchEvent(new MessageEvent('message', { data })); } catch(e){}
      } catch (e) {
        console.warn('[GlamAR] inject message failed:', e && e.message);
      }
    })();
    true;
  `;
  if (webViewInstance && isWebViewReady) {
    webViewInstance.injectJavaScript(js);
  }
};

const sendInit = () => {
  const cfg = getGlamArConfig();
  if (webViewInstance && cfg) {
    sendMessageToWebView({ type: "initialize", payload: cfg });
  }
};

// const BASE_URL = "https://cdn.glamarz0.de/sdk/";

async function resolveSdkUrl(sourceUrl: string): Promise<string> {
  let version = "1.0.0"; // default fallback
  const cfg = getGlamArConfig(); // at this point we know it's set

  if (cfg?.apiKey) {
    try {
      const api = new GlamArApi(cfg.apiKey, cfg.development ?? true);
      const v = await api.getVersion();
      console.log("resolveSdkUrl success", v);
      if (v?.sdkVersion) version = v.sdkVersion;
      else if (cfg.meta?.sdkVersion) version = cfg.meta.sdkVersion;
    } catch (e) {
      console.log("resolveSdkUrl fail", e);
      console.warn("[GlamAr] getVersion failed, using fallback:", e);
      if (cfg?.meta?.sdkVersion) version = cfg.meta.sdkVersion;
    }
  }
  return `${sourceUrl}v${version}?`;
}

export const WebViewBridge = ({ sourceUrl }: { sourceUrl: string }) => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const ref = useRef<WebView>(null);

  // Grab instance
  const setWebViewRef = (inst: WebView | null) => {
    ref.current = inst;
    webViewInstance = inst as any;
  };

  // 1) Wait for init/config, then resolve URL, then render WebView
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await waitForGlamArConfig(); // <-- waits until GlamAr.init() is called
      const url = await resolveSdkUrl(sourceUrl);
      if (!cancelled) setFinalUrl(url);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webViewInstance = null;
      isWebViewReady = false;
    };
  }, []);

  // WebView -> RN
  const handleMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    try {
      const data = JSON.parse(raw);
      if (data?.type) GlamArEmitter.emit(data.type, data.payload);
    } catch {
      console.warn("[GlamAR] Invalid message from WebView:", raw);
    }
  };

  const injectedBootstrap = useMemo(
    () => `
      (function(){
        try {
          if (!window.GlamARNative) {
            window.GlamARNative = {
              send: function(data) {
                try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); }
                catch (e) { console.warn('[GlamARNative.send] failed:', e && e.message); }
              }
            };
          }
        } catch (e) {
          console.warn('[GlamAR bootstrap] failed:', e && e.message);
        }
      })();
      true;
    `,
    []
  );

  // Don’t render WebView until we have both: config (awaited) and resolved URL
  if (!finalUrl) return null;

  return (
    <WebView
      ref={setWebViewRef}
      originWhitelist={["*"]}
      source={{ uri: finalUrl }}
      javaScriptEnabled
      injectedJavaScript={injectedBootstrap}
      onMessage={handleMessage}
      onLoadEnd={() => {
        isWebViewReady = true;
        sendInit(); // init sent only after page is loaded AND config exists
      }}
      onError={(e) => console.warn("WebView load error:", e.nativeEvent)}
    />
  );
};
