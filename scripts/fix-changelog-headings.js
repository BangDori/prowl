/** CHANGELOG.md의 changeset 기본 헤딩 ## X.Y.Z를 ## [X.Y.Z] - YYYY-MM-DD 형식으로 변환 */

const fs = require("fs");

const today = new Date().toISOString().slice(0, 10);
const content = fs.readFileSync("CHANGELOG.md", "utf8");
const fixed = content.replace(
  /^## (\d+\.\d+\.\d+)$/gm,
  (_, v) => `## [${v}] - ${today}`,
);
fs.writeFileSync("CHANGELOG.md", fixed);
