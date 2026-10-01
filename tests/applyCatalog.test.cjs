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

const methods = [
  ["applyByCategory", "category"],
  ["applyBySubCategory", "subCategory"],
];
const selector = "  eye'wear \"quoted\" \\\n;globalThis.injected = true;//  ";

for (const [method, selectorKey] of methods) {
  for (const [label, args] of [
    ["omitted", [selector]],
    ["undefined", [selector, undefined]],
    ["null", [selector, null]],
  ]) {
    test(`${method} preserves string payload when options are ${label}`, () => {
      const { GlamAr, commands } = loadSdk();
      assert.equal(GlamAr[method](...args), undefined);
      assert.deepEqual(commands, [{ type: method, payload: selector }]);
    });
  }

  const optionCases = [
    ["empty object", {}, {}],
    ["null storeFront", { storeFront: null }, {}],
    ["undefined storeFront", { storeFront: undefined }, {}],
    ["named storeFront", { storeFront: "catalog-1" }, { storeFront: "catalog-1" }],
    ["empty storeFront", { storeFront: "" }, { storeFront: "" }],
    ["whitespace storeFront", { storeFront: " \t\n " }, { storeFront: " \t\n " }],
  ];
  for (const [label, options, expectedOptions] of optionCases) {
    test(`${method} sends object payload with ${label}`, () => {
      const { GlamAr, commands, rawCommands } = loadSdk();
      const original = { ...options };
      assert.equal(GlamAr[method](selector, Object.freeze(options)), undefined);
      assert.deepEqual(commands, [{
        type: method,
        payload: { [selectorKey]: selector, options: expectedOptions },
      }]);
      assert.deepEqual(Object.keys(rawCommands[0].payload.options), Object.keys(expectedOptions));
      assert.deepEqual(options, original);
    });
  }

  test(`${method} copies only supported options without mutating the input`, () => {
    const { GlamAr, commands, rawCommands } = loadSdk();
    const options = Object.freeze({ storeFront: "  storefront  ", extra: "ignored" });
    GlamAr[method]("", options);
    assert.deepEqual(commands, [{
      type: method,
      payload: { [selectorKey]: "", options: { storeFront: "  storefront  " } },
    }]);
    assert.notEqual(rawCommands[0].payload.options, options);
    assert.deepEqual(options, { storeFront: "  storefront  ", extra: "ignored" });
  });

  test(`${method} safely serializes quoted values through the WebView bridge`, () => {
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
    // Simulate a mounted, ready WebView while exercising the real serializer.
    vm.runInNewContext(`${bridgeCode}\nwebViewInstance = { injectJavaScript: captureScript }; isWebViewReady = true;`, bridgeSandbox);
    const { GlamAr } = loadSdk(bridgeSandbox.exports);
    const storeFront = "store'\"front\\path\nnext";
    GlamAr[method](selector, { storeFront });
    assert.equal(scripts.length, 1);

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
    vm.runInNewContext(scripts[0], browserSandbox);
    const expected = [{
      type: method,
      payload: { [selectorKey]: selector, options: { storeFront } },
    }];
    assert.deepEqual(posted, expected);
    assert.deepEqual(dispatched, expected);
    assert.equal(browserSandbox.injected, undefined);
  });
}

test("ApplyCatalogOptions is exported and both method signatures typecheck", () => {
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram([path.join(__dirname, "applyCatalog.types.ts")], {
    ...parsed.options,
    noEmit: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => root,
    getNewLine: () => "\n",
  }));
});
