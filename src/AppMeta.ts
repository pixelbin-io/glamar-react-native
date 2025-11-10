// import { NativeModules } from "react-native";

// type AppMetaModule = {
//   getBundleId: () => Promise<string>;
// };

// const { AppMeta } = NativeModules as { AppMeta?: AppMetaModule };

// export async function getAppBundleId(): Promise<string> {
//   if (AppMeta?.getBundleId) {
//     try {
//       return await AppMeta.getBundleId();
//     } catch {}
//   }
//   return "unknown";
// }
import DeviceInfo from "react-native-device-info";

export async function getAppBundleId(): Promise<string> {
  try {
    return DeviceInfo.getBundleId(); // e.g. "com.glam"
  } catch {
    return "unknown";
  }
}
