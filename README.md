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

### 1. Add the SDK tarball

Place `glamar-react-native-2.0.0.tgz` in your project root.

Then update your `package.json`:

```json
"dependencies": {
  "glamar-react-native": "file:./glamar-react-native-2.0.0.tgz"
}
```

### 2. Install Required Peer Dependencies

Ensure these exist in your app's `package.json`:

```json
"react-native": "0.80.0",
"react-native-webview": "13.15.0",
"react-native-device-info": "^14.0.4",
"react-native-permissions": "5.4.2"
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
import { GlamAr, GlamArProvider } from "glamar-react-native";

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

## 📡 API Reference

| Method                             | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `GlamAr.init(config)`              | Initializes the SDK                              |
| `GlamAr.applySku(skuId)`           | Applies a specific SKU                           |
| `GlamAr.applyByCategory(category)` | Applies the first SKU from a category            |
| `GlamAr.snapshot()`                | Captures a snapshot (fires `photo-loaded` event) |
| `GlamAr.reset()`                   | Clears current applied items                     |
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

Proprietary – All rights reserved by GlamAR.
