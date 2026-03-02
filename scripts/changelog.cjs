/**
 * Changesets 커스텀 changelog 함수
 * @changesets/changelog-github 출력을 재포맷하여
 * "- 요약 ([#PR](url), [@author](url)!)" 형식으로 생성
 */

/**
 * GitHub changelog 형식을 원하는 형식으로 변환
 *
 * 입력: "- [#120](pr_url) [`cbd15e1`](commit_url) Thanks [@BangDori](author_url)! - 요약"
 * 출력: "- 요약 ([#120](pr_url), [@BangDori](author_url)!)"
 *
 * @param {string} line
 * @returns {string}
 */
function reformatLine(line) {
  const match = line.match(
    /^-\s+\[#(\d+)\]\(([^)]+)\)\s+\[`[^`]+`\]\([^)]+\)\s+Thanks\s+\[@([^\]]+)\]\(([^)]+)\)!\s+-\s+(.+)$/s,
  );
  if (!match) return line;

  const [, prNum, prUrl, author, authorUrl, summary] = match;
  return `- ${summary} ([#${prNum}](${prUrl}), [@${author}](${authorUrl})!)`;
}

/**
 * @param {import('@changesets/types').NewChangeset} changeset
 * @param {import('@changesets/types').VersionType} type
 * @param {Record<string, unknown> | null} options
 */
async function getReleaseLine(changeset, type, options) {
  const { default: github } = await import("@changesets/changelog-github");
  const raw = await github.getReleaseLine(changeset, type, options);
  return reformatLine(raw);
}

/** @returns {Promise<string>} */
async function getDependencyReleaseLine() {
  return "";
}

module.exports = { getReleaseLine, getDependencyReleaseLine };
