/** CHANGELOG.md의 changeset 기본 출력을 정해진 형식으로 변환:
 *  - ## X.Y.Z → ## [X.Y.Z] - YYYY-MM-DD
 *  - ### Major/Minor/Patch Changes 헤더 제거
 *  - 버전 헤딩·목록 항목 사이 여분 빈 줄 제거
 */

const fs = require("fs");

const today = new Date().toISOString().slice(0, 10);
let content = fs.readFileSync("CHANGELOG.md", "utf8");

// 1. bare 버전 헤딩 변환: ## X.Y.Z → ## [X.Y.Z] - date
content = content.replace(
  /^## (\d+\.\d+\.\d+)$/gm,
  (_, v) => `## [${v}] - ${today}`,
);

// 2. ### Major/Minor/Patch Changes 헤더 제거
content = content.replace(/^### (?:Major|Minor|Patch) Changes$/gm, "");

// 3. 3개 이상 연속 줄바꿈 → 2개 (버전 간 빈 줄 1개 유지)
content = content.replace(/\n{3,}/g, "\n\n");

// 4. 버전 헤딩 바로 다음 빈 줄 제거
content = content.replace(
  /^(## \[[^\]]+\] - \d{4}-\d{2}-\d{2})\n\n(-)/gm,
  "$1\n$2",
);

// 5. 목록 항목 사이 빈 줄 제거 (여러 섹션 병합 시 반복)
let prev;
do {
  prev = content;
  content = content.replace(/^(- [^\n]*)\n\n(- )/gm, "$1\n$2");
} while (content !== prev);

fs.writeFileSync("CHANGELOG.md", content);
