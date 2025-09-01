package io.glamar.reactnative

import com.facebook.react.bridge.*

class AppMetaModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AppMeta"

  @ReactMethod
  fun getBundleId(promise: Promise) {
    try {
      val pkg = reactApplicationContext.packageName // e.g. com.glam
      promise.resolve(pkg)
    } catch (e: Exception) {
      promise.reject("ERR_BUNDLE_ID", e)
    }
  }
}
