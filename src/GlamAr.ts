// src/GlamAr.ts

import { sendMessageToWebView } from "./WebViewBridge";
import GlamArEmitter from "./GlamArEvents";
import { GlamArConfig, setGlamArConfig } from "./GlamArConfig";
import { getAppBundleId } from "./AppMeta";

type ConfigChangePayload = {
  type: string;
  value: number;
};

const GlamAr = {
  init(config: GlamArConfig) {
    // Fill parentDomain if not provided
    (async () => {
      let bundleId = await getAppBundleId();
      config.parentDomain = bundleId;
      setGlamArConfig(config);
    })();
  },

  applySku(skuId: string) {
    sendMessageToWebView({ type: "applyBySku", payload: { skuId } });
  },

  applyByCategory(category: string) {
    sendMessageToWebView({ type: "applyByCategory", payload: category });
  },

  applyByMultipleConfigData(config: any) {
    sendMessageToWebView({
      type: "applyByMultipleConfigData",
      payload: config,
    });
  },

  configChange(type: string, value: number) {
    const payload: ConfigChangePayload = { type, value };
    sendMessageToWebView({ type: "onConfigChange", payload });
  },

  comparison(state: string, skus: string[]) {
    sendMessageToWebView({
      type: "comparison",
      payload: { state, skus },
    });
  },

  onNailColorEvents(options?: string | null, value?: unknown) {
    const payload: { options?: string; value?: unknown } = {};
    if (options != null) payload.options = options;
    if (value != null) payload.value = value;

    sendMessageToWebView({
      type: "nailColor",
      payload,
    });
  },

  onAddedToCart(skuId: string) {
    sendMessageToWebView({ type: "addedToCart", payload: skuId });
  },

  onAddedToWishlist(skuId: string) {
    sendMessageToWebView({ type: "addedToWishlist", payload: skuId });
  },

  applyPatternId(myPatternId: string) {
    sendMessageToWebView({
      type: "applyPatternByID",
      payload: { patternId: myPatternId },
    });
  },

  snapshot() {
    sendMessageToWebView({ type: "snapshot" });
  },

  reset() {
    sendMessageToWebView({ type: "clearSku" });
  },

  open(mode?: string, imgURL?: string) {
    if (mode)
      sendMessageToWebView({
        type: "openLivePreview",
        payload: mode ? { mode, imgURL } : undefined,
      });
    else
      sendMessageToWebView({
        type: "openLivePreview",
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
