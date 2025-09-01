// scripts/minify.cjs
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");
const glob = require("glob");

const DIST = "dist";

(async () => {
  const files = glob.sync(`${DIST}/**/*.js`, { nodir: true });

  // Use aggressive but Metro/Hermes-safe options.
  const terserOptions = {
    module: true, // your output is ESM
    toplevel: true, // mangle top-level names
    compress: {
      passes: 3,
      dead_code: true,
      pure_getters: true,
      module: true,
      unsafe_arrows: true,
    },
    mangle: {
      toplevel: true,
      // Keep well-known RN/React identifiers out of caution
      reserved: [
        "React",
        "require",
        "__DEV__",
        "Global",
        "HermesInternal",
        "GlamARNative", // you use this in WebView bridge
      ],
    },
    format: {
      comments: false,
    },
    ecma: 2019,
  };

  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    const out = await minify(code, terserOptions);
    if (out.error) {
      console.error(`[terser] Failed on ${file}`, out.error);
      process.exit(1);
    }
    fs.writeFileSync(file, out.code, "utf8");
  }

  console.log(`Minified ${files.length} files in ${DIST}/`);
})();
