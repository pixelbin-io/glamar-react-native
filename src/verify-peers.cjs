/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const checks = ["react", "react-native"];
let ok = true;

for (const mod of checks) {
  const p = path.join(root, "node_modules", mod);
  if (fs.existsSync(p)) {
    console.error(`❌ Found disallowed peer installed in library: ${mod}`);
    ok = false;
  }
}

if (!ok) {
  console.error(
    "Abort publish. Remove peers from node_modules (use `npm ci` or `npm i --omit=peer`)."
  );
  process.exit(1);
}

console.log("✅ Peer check passed (no react / react-native installed in lib).");
