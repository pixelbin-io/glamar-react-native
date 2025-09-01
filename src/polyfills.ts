// src/ployfills.ts
import "react-native-url-polyfill/auto";
import { Buffer as NodeBuffer } from "buffer";

if (typeof globalThis !== "undefined" && (globalThis as any).Buffer == null) {
  (globalThis as any).Buffer = NodeBuffer;
}
