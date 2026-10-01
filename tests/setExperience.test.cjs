const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const code = ts.transpileModule(
  fs.readFileSync(path.join(root, "src/GlamAr.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } },
).outputText;

function loadSdk() {
  const commands = [];
  const events = [];
  const sandbox = {
    exports: {},
    require(name) {
      if (name === "./WebViewBridge") {
        return { sendMessageToWebView: message => commands.push(JSON.parse(JSON.stringify(message))) };
      }
      if (name === "./GlamArEvents") {
        return { default: { emit: (event, payload) => events.push({ event, payload: JSON.parse(JSON.stringify(payload)) }) } };
      }
      if (name === "./GlamArConfig" || name === "./AppMeta") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(code, sandbox);
  return { GlamAr: sandbox.exports.default, commands, events };
}

const validCases = [
  ["skinAnalysis", { appId: " app-123 " }, { appId: "app-123" }],
  ["vto", { category: " makeup " }, { category: "makeup" }],
  ["vto", { subCategory: " lipstick " }, { subCategory: "lipstick" }],
  ["vto", { skuId: " sku-123 " }, { skuId: "sku-123" }],
  ["vto", { category: " makeup ", subCategory: "lipstick", skuId: "sku-123" }, { category: "makeup" }],
  ["vto", { category: " \n ", subCategory: " lipstick ", skuId: "sku-123" }, { subCategory: "lipstick" }],
  ["vto", { category: null, subCategory: "\t", skuId: " sku-123 " }, { skuId: "sku-123" }],
];

for (const [experience, options, expected] of validCases) {
  test(`sends normalized ${experience} options ${JSON.stringify(expected)} from ${JSON.stringify(options)}`, () => {
    const { GlamAr, commands, events } = loadSdk();
    const original = { ...options };
    assert.equal(GlamAr.setExperience(experience, Object.freeze(options)), undefined);
    assert.deepEqual(commands, [{ type: "setExperience", payload: { experience, options: expected } }]);
    assert.deepEqual(events, []);
    assert.deepEqual(options, original);
  });
}

const skinError = "SkinAnalysis experience requires a valid appId";
const vtoError = "VTO experience requires category, subCategory, or skuId";
const invalidCases = [
  ["skinAnalysis", {}, skinError],
  ["skinAnalysis", { appId: " \n " }, skinError],
  ["skinAnalysis", { appId: null }, skinError],
  ["skinAnalysis", { appId: 123 }, skinError],
  ["skinAnalysis", { category: "makeup" }, skinError],
  ["skinAnalysis", null, skinError],
  ["vto", undefined, vtoError],
  ["vto", { category: " ", subCategory: null, skuId: "\t" }, vtoError],
  ["vto", { category: 123, subCategory: {}, skuId: false }, vtoError],
  ["vto", { appId: "app-123" }, vtoError],
  ["skinanalysis", { appId: "app-123" }, "Experience must be either vto or skinAnalysis"],
  ["other", { category: "makeup" }, "Experience must be either vto or skinAnalysis"],
];

for (const [experience, options, error] of invalidCases) {
  test(`rejects ${experience} with ${JSON.stringify(options)} without sending a command`, () => {
    const { GlamAr, commands, events } = loadSdk();
    assert.doesNotThrow(() => GlamAr.setExperience(experience, options));
    assert.deepEqual(commands, []);
    assert.deepEqual(events, [
      { event: "error", payload: error },
      { event: "experience-change-failed", payload: { experience, error } },
    ]);
  });
}

test("public option exports and experience overloads typecheck", () => {
  const configPath = path.join(root, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram([path.join(__dirname, "setExperience.types.ts")], {
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
