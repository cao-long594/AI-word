const fs = require("fs");
const path = require("path");

const from = path.resolve(__dirname, "../public/assets");
const to = path.resolve(__dirname, "../dist/assets");

if (!fs.existsSync(from)) {
  process.exit(0);
}

fs.mkdirSync(to, { recursive: true });
fs.cpSync(from, to, { recursive: true, force: true });
