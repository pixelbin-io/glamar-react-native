const fs = require("fs");
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.cjs", "module.exports = require('./index.js');\n");
