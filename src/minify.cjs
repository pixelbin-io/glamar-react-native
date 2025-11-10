/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const targetDir = process.argv[2] || "dist/esm";
if (!fs.existsSync(targetDir)) {
  console.log(`[terser] ${targetDir} not found, skipping.`);
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

const isEsm = targetDir.includes("/esm");
const terserOptions = {
  ecma: 2019,
  module: isEsm, // ESM only for dist/esm
  toplevel: true,
  compress: {
    passes: 3,
    dead_code: true,
    pure_getters: true,
    module: isEsm,
    unsafe_arrows: true,
  },
  mangle: {
    toplevel: true,
    reserved: [
      "React",
      "__DEV__",
      "HermesInternal",
      "require",
      "GlamAr",
      "GlamArProvider",
      "GlamARNative",
    ],
  },
  format: { comments: false },
};

(async () => {
  const files = [...walk(targetDir)];
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    const out = await minify(code, terserOptions);
    if (out.error) {
      console.error(`[terser] Failed on ${file}`, out.error);
      process.exit(1);
    }
    fs.writeFileSync(file, out.code, "utf8");
  }
  console.log(`[terser] Minified ${files.length} files in ${targetDir}`);
})();
