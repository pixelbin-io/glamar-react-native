const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2019,
  jsx: ts.JsxEmit.ReactJSX,
};
const sdkCode = ts.transpileModule(
  fs.readFileSync(path.join(root, "src/GlamAr.ts"), "utf8"),
  { compilerOptions },
).outputText;

function loadSdk(bridge) {
  const commands = [];
  const rawCommands = [];
  const sandbox = {
    exports: {},
    require(name) {
      if (name === "./WebViewBridge") {
        return bridge || {
          sendMessageToWebView(message) {
            rawCommands.push(message);
            commands.push(JSON.parse(JSON.stringify(message)));
          },
        };
      }
      if (name === "./GlamArEvents") return { default: { emit() {} } };
      if (name === "./GlamArConfig" || name === "./AppMeta") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(sdkCode, sandbox);
  return { GlamAr: sandbox.exports.default, commands, rawCommands };
}

for (const [state, options] of [[true, "start"], [false, "close"]]) {
  test(`setViewportMirrored(${state}) sends mirrorMode ${options}`, () => {
    const { GlamAr, commands } = loadSdk();
    assert.equal(GlamAr.setViewportMirrored(state), undefined);
    assert.deepEqual(commands, [{ type: "mirrorMode", payload: { options } }]);
  });
}

test("reset without usable selectors preserves the original clear-all command", () => {
  const cases = [
    [], [undefined], [null], [""], [{}],
    [{ subCategory: "", skuIds: [] }],
    [{ subCategory: null, skuIds: null }],
    [{ subCategory: undefined, skuIds: undefined }],
    [{ category: "eyewear", skuId: "sku-1" }],
  ];
  for (const args of cases) {
    const { GlamAr, commands, rawCommands } = loadSdk();
    assert.equal(GlamAr.reset(...args), undefined);
    assert.deepEqual(commands, [{ type: "clearSku" }], JSON.stringify(args));
    assert.equal(Object.hasOwn(rawCommands[0], "payload"), false);
  }
});

test("reset accepts a subcategory string without trimming", () => {
  for (const subCategory of ["sunglasses", "  sunglasses  ", " \t\n "]) {
    const { GlamAr, commands } = loadSdk();
    GlamAr.reset(subCategory);
    assert.deepEqual(commands, [{ type: "clearSku", payload: { subCategory } }]);
  }
});

test("reset supports each selector independently and both together", () => {
  const cases = [
    [{ subCategory: "sunglasses" }, { subCategory: "sunglasses" }],
    [{ skuIds: ["sku-1", "sku-2"] }, { skuIds: ["sku-1", "sku-2"] }],
    [{ subCategory: "sunglasses", skuIds: ["sku-1"] }, { subCategory: "sunglasses", skuIds: ["sku-1"] }],
    [{ subCategory: " \t ", skuIds: ["", "  sku-1  ", "sku-1", "sku-1"] }, { subCategory: " \t ", skuIds: ["", "  sku-1  ", "sku-1", "sku-1"] }],
    [{ subCategory: "sunglasses", extra: "ignored" }, { subCategory: "sunglasses" }],
  ];
  for (const [options, expected] of cases) {
    const { GlamAr, commands } = loadSdk();
    const original = JSON.parse(JSON.stringify(options));
    if (options.skuIds) Object.freeze(options.skuIds);
    GlamAr.reset(Object.freeze(options));
    assert.deepEqual(commands, [{ type: "clearSku", payload: expected }]);
    assert.deepEqual(options, original);
  }
});

test("reset rejects an entire invalid SKU list while retaining a valid subcategory", () => {
  for (const skuIds of [[], null, undefined, "sku-1", {}, new Array(2), ["sku-1", , "sku-2"], ["sku-1", 2], ["sku-1", null], ["sku-1", undefined], [true]]) {
    const { GlamAr, commands } = loadSdk();
    GlamAr.reset({ subCategory: "sunglasses", skuIds });
    assert.deepEqual(commands, [{ type: "clearSku", payload: { subCategory: "sunglasses" } }]);
  }
});

test("reset retains valid SKU lists when the subcategory is unusable", () => {
  for (const subCategory of ["", undefined, null, 123, false, {}, []]) {
    const { GlamAr, commands } = loadSdk();
    GlamAr.reset({ subCategory, skuIds: ["sku-1"] });
    assert.deepEqual(commands, [{ type: "clearSku", payload: { skuIds: ["sku-1"] } }]);
  }
});

test("reset falls back to clear-all for unsupported runtime inputs", () => {
  const arrayWithSelectors = Object.assign(["sku-1"], { subCategory: "sunglasses" });
  const cases = [
    0, 123, true, false, [], ["sku-1"], arrayWithSelectors,
    { subCategory: 1 }, { skuIds: ["sku-1", 2] }, { skuIds: "sku-1" },
    { subCategory: false, skuIds: {} }, { skuIds: new Array(2) },
  ];
  for (const value of cases) {
    const { GlamAr, commands } = loadSdk();
    assert.doesNotThrow(() => GlamAr.reset(value));
    assert.deepEqual(commands, [{ type: "clearSku" }], JSON.stringify(value));
  }
});

test("configChange preserves legacy calls and forwards optional selectors", () => {
  const cases = [
    [["opacity", 0.5], { type: "opacity", value: 0.5 }],
    [["opacity"], { type: "opacity" }],
    [["opacity", undefined, undefined, undefined], { type: "opacity" }],
    [["opacity", null, null, null], { type: "opacity" }],
    [["opacity", 0], { type: "opacity", value: 0 }],
    [["opacity", 0.8, "sku-1", "sunglasses"], { type: "opacity", value: 0.8, skuId: "sku-1", subCategory: "sunglasses" }],
    [["opacity", null, "sku-1"], { type: "opacity", skuId: "sku-1" }],
    [["opacity", undefined, null, "sunglasses"], { type: "opacity", subCategory: "sunglasses" }],
    [["opacity", null, "sku-1", "sunglasses"], { type: "opacity", skuId: "sku-1", subCategory: "sunglasses" }],
    [["", 0, "", ""], { type: "", value: 0, skuId: "", subCategory: "" }],
    [["  opacity  ", -0.25, " sku-1 ", " sunglasses "], { type: "  opacity  ", value: -0.25, skuId: " sku-1 ", subCategory: " sunglasses " }],
  ];
  for (const [args, expected] of cases) {
    const { GlamAr, commands, rawCommands } = loadSdk();
    assert.equal(GlamAr.configChange(...args), undefined);
    assert.deepEqual(commands, [{ type: "onConfigChange", payload: expected }]);
    assert.deepEqual(Object.keys(rawCommands[0].payload), Object.keys(expected));
  }
});

test("new commands safely round-trip through the real WebView serializer", () => {
  const scripts = [];
  const bridgeCode = ts.transpileModule(
    fs.readFileSync(path.join(root, "src/WebViewBridge.tsx"), "utf8"),
    { compilerOptions },
  ).outputText;
  const bridgeSandbox = {
    exports: {},
    captureScript: script => scripts.push(script),
    require(name) {
      if (["react", "react/jsx-runtime", "react-native-webview", "./GlamArEvents", "./GlamArConfig", "./GlamArApi"].includes(name)) return {};
      throw new Error(`Unexpected bridge import: ${name}`);
    },
  };
  vm.runInNewContext(`${bridgeCode}\nwebViewInstance = { injectJavaScript: captureScript }; isWebViewReady = true;`, bridgeSandbox);
  const { GlamAr } = loadSdk(bridgeSandbox.exports);
  const selector = "eye'wear \"quoted\" \\\n;globalThis.injected = true;//";
  GlamAr.reset();
  GlamAr.reset({ subCategory: selector, skuIds: [selector] });
  GlamAr.configChange(selector, null, selector, selector);
  GlamAr.setViewportMirrored(true);
  GlamAr.setViewportMirrored(false);

  const posted = [];
  const dispatched = [];
  const browserSandbox = {
    window: {
      postMessage: message => posted.push(JSON.parse(JSON.stringify(message))),
      dispatchEvent: event => dispatched.push(JSON.parse(JSON.stringify(event.data))),
    },
    MessageEvent: function MessageEvent(type, init) {
      this.type = type;
      this.data = init.data;
    },
  };
  for (const script of scripts) vm.runInNewContext(script, browserSandbox);
  const expected = [
    { type: "clearSku" },
    { type: "clearSku", payload: { subCategory: selector, skuIds: [selector] } },
    { type: "onConfigChange", payload: { type: selector, skuId: selector, subCategory: selector } },
    { type: "mirrorMode", payload: { options: "start" } },
    { type: "mirrorMode", payload: { options: "close" } },
  ];
  assert.equal(scripts.length, expected.length);
  assert.deepEqual(posted, expected);
  assert.deepEqual(dispatched, expected);
  assert.equal(browserSandbox.injected, undefined);
});

test("Android parity APIs and option types are available from the public entry point", () => {
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram([path.join(__dirname, "androidParity.types.ts")], {
    ...parsed.options,
    noEmit: true,
    strictNullChecks: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => root,
    getNewLine: () => "\n",
  }));
});
