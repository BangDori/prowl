/**
 * Changesets 커스텀 changelog 함수
 * @changesets/changelog-github 출력을 재포맷하여
 * "- 요약 ([#PR](url), [@author](url)!)" 형식으로 생성
 */

/**
 * GitHub changelog 형식을 원하는 형식으로 변환
 *
 * 입력: "\n\n- [#120](pr_url) [`cbd15e1`](commit_url) Thanks [@BangDori](author_url)! - 요약\n"
 * 출력: "\n\n- 요약 ([#120](pr_url), [@BangDori](author_url))\n"
 *
 * getReleaseLine이 반환하는 raw string에는 앞뒤 \n\n이 포함되어 있어
 * m 플래그(multiline)를 써서 줄 경계에서 매칭해야 함
 *
 * @param {string} raw
 * @returns {string}
 */
function reformatLine(raw) {
  return raw.replace(
    /^-\s+\[#(\d+)\]\(([^)]+)\)\s+\[`[^`]+`\]\([^)]+\)\s+Thanks\s+\[@([^\]]+)\]\(([^)]+)\)!\s+-\s+(.+)$/m,
    (_, prNum, prUrl, author, authorUrl, summary) =>
      `- ${summary} ([#${prNum}](${prUrl}), [@${author}](${authorUrl}))`,
  );
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
