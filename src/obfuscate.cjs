/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

// Only run if explicitly enabled
if (!process.env.OBFUSCATE) {
  console.log("[obfuscate] OBFUSCATE not set -> skipping.");
  process.exit(0);
}

// Try to load obfuscator, skip if not installed
let obfuscate;
try {
  ({ obfuscate } = require("javascript-obfuscator"));
} catch (e) {
  console.log("[obfuscate] 'javascript-obfuscator' not installed -> skipping.");
  process.exit(0);
}

// Choose the files you truly care about.
// Start with a small set to keep perf good.
const targets = [
  // adjust these to real outputs in dist:
  "dist/GlamArApi.js",
  "dist/WebViewBridge.js",
  // "dist/sensitive-core.js", // only if you have it
].filter((p) => fs.existsSync(p));

if (targets.length === 0) {
  console.log("[obfuscate] No target files found -> skipping.");
  process.exit(0);
}

for (const file of targets) {
  const code = fs.readFileSync(file, "utf8");
  const result = obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    stringArray: true,
    stringArrayRotate: true,
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    simplify: true,
    target: "node", // fine for Metro/Hermes input
  });
  fs.writeFileSync(file, result.getObfuscatedCode(), "utf8");
  console.log(`[obfuscate] Obfuscated ${file}`);
}

console.log(`[obfuscate] Done (${targets.length} files).`);
