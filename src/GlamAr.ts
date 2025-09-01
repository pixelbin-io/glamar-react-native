// src/GlamAr.ts

import { sendMessageToWebView } from "./WebViewBridge";
import GlamArEmitter from "./GlamArEvents";
import { GlamArConfig, setGlamArConfig } from "./GlamArConfig";
import { getAppBundleId } from "./AppMeta";

const GlamAr = {
  init(config: GlamArConfig) {
    // Fill parentDomain if not provided
    (async () => {
      let bundleId = await getAppBundleId();
      config.parentDomain = bundleId;
      console.log("init bundle id", bundleId);
      setGlamArConfig(config);
      // Send to the page (our WebViewBridge will queue until ready)
      // sendMessageToWebView({ type: "initialize", payload: enriched });
    })();
  },

  applySku(skuId: string) {
    sendMessageToWebView({ type: "applyBySku", payload: { skuId } });
  },

  applyByCategory(category: string) {
    sendMessageToWebView({ type: "applyByCategory", payload: category });
  },

  snapshot() {
    sendMessageToWebView({ type: "snapshot" });
  },

  reset() {
    sendMessageToWebView({ type: "clearSku" });
  },

  open(mode?: string, imgURL?: string) {
    sendMessageToWebView({
      type: "openLivePreview",
      payload: mode ? { mode, imgURL } : undefined,
    });
  },

  close() {
    sendMessageToWebView({ type: "closePreview" });
  },

  back() {
    sendMessageToWebView({ type: "backPreview" });
  },

  skinAnalysis(options: string) {
    sendMessageToWebView({ type: "skinAnalysis", payload: { options } });
  },

  eyePD(options: string) {
    sendMessageToWebView({ type: "eyePD", payload: { options } });
  },

  openUI(name: string) {
    sendMessageToWebView({ type: "openUi", payload: { name } });
  },

  on(event: string, callback: (data: any) => void) {
    return GlamArEmitter.addListener(event, callback);
  },
};

export default GlamAr;
