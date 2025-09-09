/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
let JavaScriptObfuscator;
try {
  JavaScriptObfuscator = require("javascript-obfuscator");
} catch {
  console.log("[obfuscate] 'javascript-obfuscator' not installed -> skipping.");
  process.exit(0);
}

const targetDir = process.argv[2] || "dist/esm";
if (!fs.existsSync(targetDir)) {
  console.log(`[obfuscate] ${targetDir} not found -> skipping.`);
  process.exit(0);
}

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (p.endsWith(".js")) yield p;
  }
}

// RN/Hermes-friendly profile:
const options = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: false, // enable only if you measure perf
  stringArrayThreshold: 0.2,
  transformObjectKeys: false,
  simplify: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  target: "browser",
  reservedNames: [
    "^GlamAr$",
    "^GlamArProvider$",
    "^React$",
    "^__DEV__$",
    "^HermesInternal$",
  ],
};

let count = 0;
for (const file of walk(targetDir)) {
  const code = fs.readFileSync(file, "utf8");
  const result = JavaScriptObfuscator.obfuscate(code, options);
  fs.writeFileSync(file, result.getObfuscatedCode(), "utf8");
  count++;
}
console.log(`[obfuscate] Obfuscated ${count} files in ${targetDir}`);
