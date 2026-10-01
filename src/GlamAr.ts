// src/GlamAr.ts

import { sendMessageToWebView } from "./WebViewBridge";
import GlamArEmitter from "./GlamArEvents";
import { GlamArConfig, setGlamArConfig } from "./GlamArConfig";
import { getAppBundleId } from "./AppMeta";

export type ConfigChangePayload = {
  type: string;
  value?: number;
  skuId?: string;
  subCategory?: string;
};

export type ResetOptions = {
  subCategory?: string | null;
  skuIds?: string[] | null;
};

function normalizeClearSkuPayload(value: unknown): ResetOptions | null {
  if (typeof value === "string") {
    return value.length > 0 ? { subCategory: value } : null;
  }
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const { subCategory, skuIds } = value as ResetOptions;
  const payload: ResetOptions = {};
  if (typeof subCategory === "string" && subCategory.length > 0) {
    payload.subCategory = subCategory;
  }
  if (
    Array.isArray(skuIds) &&
    skuIds.length > 0 &&
    Array.from(skuIds).every((skuId) => typeof skuId === "string")
  ) {
    payload.skuIds = [...skuIds];
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

export type ApplyCatalogOptions = {
  storeFront?: string | null;
};

export type VtoExperienceOptions = {
  category?: string | null;
  subCategory?: string | null;
  skuId?: string | null;
};

export type SkinAnalysisExperienceOptions = {
  appId?: string | null;
};

export type ExperienceOptions =
  | VtoExperienceOptions
  | SkinAnalysisExperienceOptions;

function normalizeExperienceValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function failExperienceChange(experience: string, error: string): void {
  GlamArEmitter.emit("error", error);
  GlamArEmitter.emit("experience-change-failed", { experience, error });
}

function setExperience(experience: "vto", options: VtoExperienceOptions): void;
function setExperience(
  experience: "skinAnalysis",
  options: SkinAnalysisExperienceOptions,
): void;
function setExperience(experience: string, options: ExperienceOptions): void {
  if (experience === "skinAnalysis") {
    const appId = normalizeExperienceValue(
      (options as SkinAnalysisExperienceOptions)?.appId,
    );
    if (!appId) {
      failExperienceChange(
        experience,
        "SkinAnalysis experience requires a valid appId",
      );
      return;
    }
    sendMessageToWebView({
      type: "setExperience",
      payload: { experience, options: { appId } },
    });
    return;
  }

  if (experience !== "vto") {
    failExperienceChange(
      experience,
      "Experience must be either vto or skinAnalysis",
    );
    return;
  }

  const vtoOptions = options as VtoExperienceOptions;
  for (const key of ["category", "subCategory", "skuId"] as const) {
    const value = normalizeExperienceValue(vtoOptions?.[key]);
    if (value) {
      sendMessageToWebView({
        type: "setExperience",
        payload: { experience, options: { [key]: value } },
      });
      return;
    }
  }

  failExperienceChange(
    experience,
    "VTO experience requires category, subCategory, or skuId",
  );
}

const GlamAr = {
  setExperience,

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

  applyByCategory(category: string, options?: ApplyCatalogOptions | null) {
    const payload =
      options == null
        ? category
        : {
            category,
            options:
              options.storeFront != null ? { storeFront: options.storeFront } : {},
          };
    sendMessageToWebView({ type: "applyByCategory", payload });
  },

  applyBySubCategory(subCategory: string, options?: ApplyCatalogOptions | null) {
    const payload =
      options == null
        ? subCategory
        : {
            subCategory,
            options:
              options.storeFront != null ? { storeFront: options.storeFront } : {},
          };
    sendMessageToWebView({ type: "applyBySubCategory", payload });
  },

  applyByMultipleConfigData(config: any) {
    sendMessageToWebView({
      type: "applyByMultipleConfigData",
      payload: config,
    });
  },

  configChange(
    type: string,
    value?: number | null,
    skuId?: string | null,
    subCategory?: string | null,
  ) {
    const payload: ConfigChangePayload = { type };
    if (value != null) payload.value = value;
    if (skuId != null) payload.skuId = skuId;
    if (subCategory != null) payload.subCategory = subCategory;
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

  reset(value?: string | ResetOptions | null) {
    const payload = normalizeClearSkuPayload(value);
    sendMessageToWebView(
      payload ? { type: "clearSku", payload } : { type: "clearSku" },
    );
  },

  setViewportMirrored(state: boolean) {
    sendMessageToWebView({
      type: "mirrorMode",
      payload: { options: state ? "start" : "close" },
    });
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
