# GlamAR React Native

**GlamAR React Native SDK** – Seamless integration of the GlamAR Web SDK into React Native apps using WebView.

---

## 🚀 Features

- Loads GlamAR Web SDK inside a WebView
- Easy API: `init`, `applySku`, `applyByCategory`, `snapshot`, `reset`, etc.
- Event system: `photo-loaded`, `loaded`, `error`, etc.
- Handles permissions (Android/iOS)
- Fully customizable layout — WebView adapts to its container

---

## 📦 Installation

### 1. Add the SDK

```bash
# Using npm
npm i @glamario/core-react-native

# Using yarn
yarn add @glamario/core-react-native

# Using pnpm
pnpm add @glamario/core-react-native
```

or manually

Download glamAR react native <a href="https://github.com/pixelbin-io/glamar-react-native/releases">Package</a> And place it in your project root.

Then update your `package.json`:

```json
"dependencies": {
  "@glamario/core-react-native": "glamar-react-native.tgz"
}
```

### 2. Install Required Peer Dependencies

Ensure these exist in your app's `package.json`:

```json
 "react": ">=18 <20",
  "react-native": ">=0.68.0",
  "react-native-webview": ">=11.0.0",
  "react-native-device-info": ">=10.0.0",
  "react-native-permissions": ">=3.8.0"
```

Then run:

```bash
npm install
```

### 3. Metro Configuration

Update your `metro.config.js`:

```js
const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const projectRoot = __dirname;
const appNM = (p) => path.join(projectRoot, "node_modules", p);
const defaultConfig = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    nodeModulesPaths: [path.join(projectRoot, "node_modules")],
    extraNodeModules: {
      react: appNM("react"),
      "react/jsx-runtime": appNM("react/jsx-runtime"),
      "react/jsx-dev-runtime": appNM("react/jsx-dev-runtime"),
      "react-native": appNM("react-native"),
      "react-native-webview": appNM("react-native-webview"),
      scheduler: appNM("scheduler"),
      "@babel/runtime": appNM("@babel/runtime"),
    },
  },
});
```

---

## 📷 Camera Permissions

### Android

In `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-feature android:name="android.hardware.camera" android:required="true"/>
```

In `MainActivity.java`:

```java
@Override
public void onPermissionRequest(final PermissionRequest request) {
    runOnUiThread(() -> request.grant(request.getResources()));
}
```

### iOS

In `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app requires access to the camera for virtual try-on.</string>
```

---

## 🧠 SDK Usage

### Import

```tsx
import { GlamAr, GlamArProvider } from "@glamario/core-react-native";
```

### Initialize

```tsx
GlamAr.init({
  apiKey: "YOUR_API_KEY",
  platform: "react_native",
});
```

### Listen to Events

```tsx
useEffect(() => {
  const sub1 = GlamAr.on("photo-loaded", (data) => console.log(data));
  const sub2 = GlamAr.on("loaded", () => console.log("Loaded"));

  return () => {
    sub1?.remove?.();
    sub2?.remove?.();
  };
}, []);
```

---

## 🔁 Full Integration Example

```javascript
import React, { useEffect } from "react";
import { SafeAreaView, View, Button, StyleSheet } from "react-native";
import { GlamAr, GlamArProvider } from "@glamario/core-react-native";

export default function App() {
  useEffect(() => {
    GlamAr.init({
      apiKey: "YOUR_API_KEY",
      platform: "react_native",
    });

    const sub1 = GlamAr.on("photo-loaded", (data) => console.log(data));
    const sub2 = GlamAr.on("loaded", () => console.log("Loaded"));

    return () => {
      sub1?.remove?.();
      sub2?.remove?.();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.glamAR}>
        <GlamArProvider />
      </View>

      <View style={styles.controls}>
        <Button
          title="Apply"
          onPress={() => GlamAr.applyByCategory("sunglasses")}
        />
        <Button title="Snapshot" onPress={GlamAr.snapshot} />
        <Button title="Reset" onPress={GlamAr.reset} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glamAR: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    zIndex: 100,
  },
});
```

---

## Switch experiences

After the SDK's `loaded` event, use `setExperience` to switch the current experience:

```tsx
import { GlamAr } from "@glamario/core-react-native";
import type {
  VtoExperienceOptions,
  SkinAnalysisExperienceOptions,
} from "@glamario/core-react-native";

const vtoOptions: VtoExperienceOptions = { category: "makeup" };
GlamAr.setExperience("vto", vtoOptions);
GlamAr.setExperience("vto", { subCategory: "lipstick" });
GlamAr.setExperience("vto", { skuId: "YOUR_SKU_ID" });

const skinOptions: SkinAnalysisExperienceOptions = { appId: "YOUR_APP_ID" };
GlamAr.setExperience("skinAnalysis", skinOptions);

const failureSubscription = GlamAr.on("experience-change-failed", (payload) => {
  console.log(payload.experience, payload.error);
});
// Remove the subscription when no longer needed.
failureSubscription.remove();
```

Experience names are case-sensitive: `vto` or `skinAnalysis`. Skin Analysis requires a nonempty `appId`. VTO requires at least one of `category`, `subCategory`, or `skuId`; only the first nonempty selector in that order is sent. Values are trimmed, and the caller's options are not modified.

Invalid input sends no WebView command. It emits `error` with the validation message string, followed by `experience-change-failed` with `{ experience, error }`. The method returns `void`; dispatching a command does not confirm the hosted SDK has completed the switch. `ExperienceOptions`, `VtoExperienceOptions`, and `SkinAnalysisExperienceOptions` are exported types.

## Apply by category or subcategory

Both methods accept an optional `ApplyCatalogOptions` object:

```tsx
import { GlamAr } from "@glamario/core-react-native";
import type { ApplyCatalogOptions } from "@glamario/core-react-native";

// Without options, the payload remains a category/subcategory string.
GlamAr.applyByCategory("eyewear");
GlamAr.applyBySubCategory("sunglasses");

const options: ApplyCatalogOptions = { storeFront: "YOUR_STOREFRONT" };
GlamAr.applyByCategory("eyewear", options);
GlamAr.applyBySubCategory("sunglasses", options);
```

Omitting options, or passing `undefined` or `null`, sends the string payload. Passing an options object sends `{ category, options }` or `{ subCategory, options }`. Only `storeFront` is forwarded; it is omitted when null or undefined. An empty options object still sends the object payload with `options: {}`. Category, subcategory and storefront values are passed through without trimming.

## Viewport mirroring, reset, and configuration changes

Call these methods after the SDK's `loaded` event:

```tsx
GlamAr.setViewportMirrored(true);  // Start mirroring.
GlamAr.setViewportMirrored(false); // Stop mirroring.

GlamAr.reset(); // Clear all applied items.
GlamAr.reset("sunglasses");
GlamAr.reset({ skuIds: ["SKU_ID_1", "SKU_ID_2"] });
GlamAr.reset({ subCategory: "sunglasses", skuIds: ["SKU_ID_1"] });

// Existing two-argument calls still work.
GlamAr.configChange("YOUR_CONFIG_TYPE", 0.5);
GlamAr.configChange("YOUR_CONFIG_TYPE", 0.5, "SKU_ID", "sunglasses");
// Use null or undefined to skip a positional argument.
GlamAr.configChange("YOUR_CONFIG_TYPE", null, "SKU_ID");
GlamAr.configChange("YOUR_CONFIG_TYPE", undefined, undefined, "sunglasses");
GlamAr.configChange("YOUR_CONFIG_TYPE");
```

`setViewportMirrored` sends `mirrorMode` with `{ options: "start" }` for true and `{ options: "close" }` for false.

`reset` accepts a subcategory string or `ResetOptions` (`subCategory?: string | null`, `skuIds?: string[] | null`). A nonempty string becomes `{ subCategory }`. For an object, only a nonempty string `subCategory` and a nonempty array consisting entirely of string `skuIds` are included. Strings are not trimmed. An invalid `skuIds` array is omitted as a whole; a valid subcategory is still retained. Null, undefined, an empty string, or an object with no valid fields sends `clearSku` without a payload, clearing all items, matching Android.

`configChange(type, value?, skuId?, subCategory?)` sends `onConfigChange`. `type` is required; `value` is an optional number, and `skuId` and `subCategory` are optional strings. Null and undefined optional arguments are omitted; zero and empty strings are preserved. The `ResetOptions` and `ConfigChangePayload` types are exported from the package.

## 📡 API Reference

| Method                             | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `GlamAr.setExperience(experience, options)` | Switches to VTO or Skin Analysis |
| `GlamAr.init(config)`              | Initializes the SDK                              |
| `GlamAr.applySku(skuId)`           | Applies a specific SKU                           |
| `GlamAr.applyByCategory(category, options?)` | Applies by category with optional storefront |
| `GlamAr.applyBySubCategory(subCategory, options?)` | Applies by subcategory with optional storefront |
| `GlamAr.configChange(type, value?, skuId?, subCategory?)` | Sends a configuration change with optional SKU/subcategory |
| `GlamAr.comparison(state, skus)`   | Sends comparison state and SKU list              |
| `GlamAr.onNailColorEvents(options, value)` | Sends nail color options and value      |
| `GlamAr.snapshot()`                | Captures a snapshot (fires `photo-loaded` event) |
| `GlamAr.reset(value?)` | Clears all items or targets a subcategory / SKU IDs |
| `GlamAr.setViewportMirrored(state)` | Starts or stops viewport mirroring |
| `GlamAr.open()` / `close()`        | Opens or closes the live preview mode            |
| `GlamAr.on(event, cb)`             | Registers event listeners                        |

---

## 🔔 Supported Events

| Event                  | Description                  |
| ---------------------- | ---------------------------- |
| `loaded`               | SDK initialized              |
| `opened`, `closed`     | Widget opened or closed      |
| `photo-loaded`         | Snapshot captured            |
| `camera-opened`        | Camera successfully accessed |
| `camera-closed`        | Camera stopped               |
| `camera-failed`        | Error accessing camera       |
| `subscription-invalid` | API key expired or invalid   |
| `experience-change-failed` | Experience change failed; payload contains `experience` and `error` |
| `skin-analysis`        | Skin analysis data received  |
| `error`                | Any error from SDK           |

---

Detailed documentation available at https://www.glamar.io/docs/

## 🧪 Troubleshooting

- **WebView not loading**: Ensure internet is available on device.
- **Camera not working**: Check Android/iOS permissions.
- **Events not firing**: Log inside `handleMessage` or `GlamAr.on(...)`.

---

## ✅ License

MIT
