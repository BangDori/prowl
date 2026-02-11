/** Claude 설정 파일 읽기 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs");
vi.mock("node:os", () => ({
  homedir: () => "/mock/home",
}));

import * as fs from "node:fs";
import { getClaudeConfig, getFileContent } from "./claude-config";

const mockFs = vi.mocked(fs);

describe("claude-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClaudeConfig", () => {
    describe("agents 스캔", () => {
      it("agents 폴더가 없으면 빈 배열을 반환한다", () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = getClaudeConfig();

        expect(result.agents).toEqual([]);
      });

      it("agents 폴더의 카테고리별 마크다운 파일을 스캔한다", () => {
        mockFs.existsSync.mockImplementation((path) => {
          const pathStr = String(path);
          // agents 폴더 존재
          if (pathStr.includes("agents")) return true;
          return false;
        });
        // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
        mockFs.readdirSync.mockImplementation((path, options) => {
          const pathStr = String(path);
          if (pathStr.endsWith("agents")) {
            // 카테고리 폴더 목록
            return [
              { name: "resume", isDirectory: () => true },
              { name: "coding", isDirectory: () => true },
            ] as unknown as fs.Dirent[];
          }
          if (pathStr.includes("resume")) {
            return ["resume-analyst.md", "cover-letter.md"];
          }
          if (pathStr.includes("coding")) {
            return ["code-reviewer.md"];
          }
          return [];
        });
        mockFs.readFileSync.mockImplementation((path) => {
          const pathStr = String(path);
          if (pathStr.includes("resume-analyst")) {
            return `---
name: Resume Analyst
description: Analyzes resumes
model: claude-3-opus
color: blue
---
# Resume Analyst

This agent analyzes resumes.`;
          }
          if (pathStr.includes("cover-letter")) {
            return `# Cover Letter Writer

Writes professional cover letters.`;
          }
          if (pathStr.includes("code-reviewer")) {
            return `---
name: Code Reviewer
---
# Code Reviewer

Reviews code for quality.`;
          }
          return "";
        });

        const result = getClaudeConfig();

        expect(result.agents).toHaveLength(3);

        // frontmatter가 있는 경우
        const resumeAgent = result.agents.find((a) => a.id === "resume/resume-analyst");
        expect(resumeAgent).toBeDefined();
        expect(resumeAgent?.meta.name).toBe("Resume Analyst");
        expect(resumeAgent?.meta.description).toBe("Analyzes resumes");
        expect(resumeAgent?.meta.model).toBe("claude-3-opus");
        expect(resumeAgent?.meta.color).toBe("blue");
        expect(resumeAgent?.category).toBe("resume");

        // frontmatter가 없는 경우 - 파일명과 본문에서 추출
        const coverAgent = result.agents.find((a) => a.id === "resume/cover-letter");
        expect(coverAgent).toBeDefined();
        expect(coverAgent?.meta.name).toBe("cover-letter");
        expect(coverAgent?.meta.description).toBe("Writes professional cover letters.");

        // frontmatter에 description이 없는 경우
        const codeAgent = result.agents.find((a) => a.id === "coding/code-reviewer");
        expect(codeAgent).toBeDefined();
        expect(codeAgent?.meta.name).toBe("Code Reviewer");
        expect(codeAgent?.meta.description).toBe("Reviews code for quality.");
      });

      it("빈 카테고리 폴더는 무시한다", () => {
        mockFs.existsSync.mockReturnValue(true);
        // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
        mockFs.readdirSync.mockImplementation((path, options) => {
          const pathStr = String(path);
          if (pathStr.endsWith("agents")) {
            return [{ name: "empty-category", isDirectory: () => true }] as unknown as fs.Dirent[];
          }
          return []; // 빈 폴더
        });

        const result = getClaudeConfig();

        expect(result.agents).toEqual([]);
      });
    });

    describe("commands 스캔", () => {
      it("commands 폴더가 없으면 빈 배열을 반환한다", () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = getClaudeConfig();

        expect(result.commands).toEqual([]);
      });

      it("commands 폴더의 마크다운 파일을 스캔한다", () => {
        mockFs.existsSync.mockImplementation((path) => {
          const pathStr = String(path);
          return pathStr.includes("commands");
        });
        // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
        mockFs.readdirSync.mockImplementation((path) => {
          const pathStr = String(path);
          if (pathStr.includes("commands")) {
            return ["commit.md", "review-pr.md", "not-markdown.txt"];
          }
          return [];
        });
        mockFs.readFileSync.mockImplementation((path) => {
          const pathStr = String(path);
          if (pathStr.includes("commit")) {
            return `# Commit Changes

Creates a well-formatted commit message.`;
          }
          if (pathStr.includes("review-pr")) {
            return `# Review Pull Request

Reviews PR for issues.`;
          }
          return "";
        });

        const result = getClaudeConfig();

        expect(result.commands).toHaveLength(2);

        const commitCmd = result.commands.find((c) => c.id === "commit");
        expect(commitCmd?.title).toBe("Commit Changes");
        expect(commitCmd?.description).toBe("Creates a well-formatted commit message.");

        const reviewCmd = result.commands.find((c) => c.id === "review-pr");
        expect(reviewCmd?.title).toBe("Review Pull Request");
        expect(reviewCmd?.description).toBe("Reviews PR for issues.");
      });

      it("제목이 없는 파일은 기본 제목을 사용한다", () => {
        mockFs.existsSync.mockImplementation((path) => String(path).includes("commands"));
        // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
        mockFs.readdirSync.mockReturnValue(["no-title.md"]);
        mockFs.readFileSync.mockReturnValue("Just some content without a title.");

        const result = getClaudeConfig();

        expect(result.commands[0].title).toBe("제목 없음");
      });
    });

    describe("hooks 스캔", () => {
      it("settings.json이 없으면 빈 배열을 반환한다", () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = getClaudeConfig();

        expect(result.hooks).toEqual([]);
      });

      it("settings.json에서 hooks를 파싱한다", () => {
        mockFs.existsSync.mockImplementation((path) => String(path).includes("settings.json"));
        mockFs.readFileSync.mockReturnValue(
          JSON.stringify({
            hooks: {
              SessionStart: [{ hooks: [{ type: "command", command: "echo start" }] }],
              PreToolUse: [
                { matcher: "Bash", hooks: [{ type: "command", command: "validate" }] },
                { matcher: "Write", hooks: [{ type: "command", command: "lint" }] },
              ],
            },
          }),
        );

        const result = getClaudeConfig();

        expect(result.hooks).toHaveLength(3);

        const sessionHook = result.hooks.find((h) => h.id === "SessionStart");
        expect(sessionHook?.event).toBe("SessionStart");
        expect(sessionHook?.matcher).toBeUndefined();

        const bashHook = result.hooks.find((h) => h.id === "PreToolUse:Bash");
        expect(bashHook?.event).toBe("PreToolUse");
        expect(bashHook?.matcher).toBe("Bash");
      });

      it("hooks 필드가 없으면 빈 배열을 반환한다", () => {
        mockFs.existsSync.mockImplementation((path) => String(path).includes("settings.json"));
        mockFs.readFileSync.mockReturnValue(JSON.stringify({ someOtherField: true }));

        const result = getClaudeConfig();

        expect(result.hooks).toEqual([]);
      });

      it("잘못된 JSON이면 빈 배열을 반환한다", () => {
        mockFs.existsSync.mockImplementation((path) => String(path).includes("settings.json"));
        mockFs.readFileSync.mockReturnValue("{ invalid json }");

        const result = getClaudeConfig();

        expect(result.hooks).toEqual([]);
      });

      it("hooks 값이 배열이 아니면 무시한다", () => {
        mockFs.existsSync.mockImplementation((path) => String(path).includes("settings.json"));
        mockFs.readFileSync.mockReturnValue(
          JSON.stringify({
            hooks: {
              SessionStart: "not an array",
              PreToolUse: [{ matcher: "Bash", hooks: [] }],
            },
          }),
        );

        const result = getClaudeConfig();

        expect(result.hooks).toHaveLength(1);
        expect(result.hooks[0].event).toBe("PreToolUse");
      });
    });

    describe("rules 스캔", () => {
      it("rules 폴더가 없으면 빈 배열을 반환한다", () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = getClaudeConfig();

        expect(result.rules).toEqual([]);
      });

      it("rules 폴더의 txt와 md 파일을 스캔한다", () => {
        mockFs.existsSync.mockImplementation((path) => String(path).includes("rules"));
        // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
        mockFs.readdirSync.mockReturnValue(["coding-standards.txt", "naming.md", "ignored.json"]);
        mockFs.readFileSync.mockImplementation((path) => {
          const pathStr = String(path);
          if (pathStr.includes("coding-standards")) return "Always write tests.";
          if (pathStr.includes("naming")) return "Use camelCase for variables.";
          return "";
        });

        const result = getClaudeConfig();

        expect(result.rules).toHaveLength(2);

        const codingRule = result.rules.find((r) => r.id === "coding-standards");
        expect(codingRule?.content).toBe("Always write tests.");

        const namingRule = result.rules.find((r) => r.id === "naming");
        expect(namingRule?.content).toBe("Use camelCase for variables.");
      });
    });

    describe("lastUpdated", () => {
      it("현재 시간을 반환한다", () => {
        mockFs.existsSync.mockReturnValue(false);

        const before = new Date();
        const result = getClaudeConfig();
        const after = new Date();

        expect(new Date(result.lastUpdated).getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(new Date(result.lastUpdated).getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });
  });

  describe("getFileContent", () => {
    it("파일이 존재하면 내용을 반환한다", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("file content here");

      const result = getFileContent("/mock/path/file.md");

      expect(result).toBe("file content here");
      expect(mockFs.readFileSync).toHaveBeenCalledWith("/mock/path/file.md", "utf-8");
    });

    it("파일이 없으면 안내 메시지를 반환한다", () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = getFileContent("/mock/path/nonexistent.md");

      expect(result).toBe("파일을 찾을 수 없습니다.");
    });
  });

  describe("parseFrontmatter (간접 테스트)", () => {
    it("frontmatter가 없는 파일을 처리한다", () => {
      mockFs.existsSync.mockImplementation((path) => String(path).includes("agents"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("agents")) {
          return [{ name: "test", isDirectory: () => true }] as unknown as fs.Dirent[];
        }
        return ["agent.md"];
      });
      mockFs.readFileSync.mockReturnValue(`# Simple Agent

Just content without frontmatter.`);

      const result = getClaudeConfig();

      expect(result.agents[0].meta.name).toBe("agent");
      expect(result.agents[0].meta.description).toBe("Just content without frontmatter.");
    });

    it("frontmatter만 있고 본문이 없는 파일을 처리한다", () => {
      mockFs.existsSync.mockImplementation((path) => String(path).includes("agents"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("agents")) {
          return [{ name: "test", isDirectory: () => true }] as unknown as fs.Dirent[];
        }
        return ["agent.md"];
      });
      mockFs.readFileSync.mockReturnValue(`---
name: Agent Name
description: Agent Description
---`);

      const result = getClaudeConfig();

      expect(result.agents[0].meta.name).toBe("Agent Name");
      expect(result.agents[0].meta.description).toBe("Agent Description");
    });
  });

  describe("extractDescription (간접 테스트)", () => {
    it("100자 이상의 설명은 잘라서 ...을 붙인다", () => {
      const longDescription = "A".repeat(150);
      mockFs.existsSync.mockImplementation((path) => String(path).includes("agents"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("agents")) {
          return [{ name: "test", isDirectory: () => true }] as unknown as fs.Dirent[];
        }
        return ["agent.md"];
      });
      mockFs.readFileSync.mockReturnValue(`# Title

${longDescription}`);

      const result = getClaudeConfig();

      expect(result.agents[0].meta.description).toBe("A".repeat(100) + "...");
    });

    it("제목과 리스트 항목은 설명에서 제외한다", () => {
      mockFs.existsSync.mockImplementation((path) => String(path).includes("agents"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("agents")) {
          return [{ name: "test", isDirectory: () => true }] as unknown as fs.Dirent[];
        }
        return ["agent.md"];
      });
      mockFs.readFileSync.mockReturnValue(`# Title
## Subtitle
- List item
Actual description here.`);

      const result = getClaudeConfig();

      expect(result.agents[0].meta.description).toBe("Actual description here.");
    });

    it("설명을 찾을 수 없으면 기본값을 반환한다", () => {
      mockFs.existsSync.mockImplementation((path) => String(path).includes("agents"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("agents")) {
          return [{ name: "test", isDirectory: () => true }] as unknown as fs.Dirent[];
        }
        return ["agent.md"];
      });
      mockFs.readFileSync.mockReturnValue(`# Title
## Subtitle
- List item`);

      const result = getClaudeConfig();

      expect(result.agents[0].meta.description).toBe("설명 없음");
    });
  });

  describe("content 미리보기", () => {
    it("agents content는 500자로 제한된다", () => {
      const longContent = "B".repeat(1000);
      mockFs.existsSync.mockImplementation((path) => String(path).includes("agents"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("agents")) {
          return [{ name: "test", isDirectory: () => true }] as unknown as fs.Dirent[];
        }
        return ["agent.md"];
      });
      mockFs.readFileSync.mockReturnValue(`---
name: Test
---
${longContent}`);

      const result = getClaudeConfig();

      expect(result.agents[0].content.length).toBe(500);
    });

    it("commands content는 500자로 제한된다", () => {
      const longContent = "C".repeat(1000);
      mockFs.existsSync.mockImplementation((path) => String(path).includes("commands"));
      // @ts-expect-error - readdirSync 모킹 시 타입 불일치 무시
      mockFs.readdirSync.mockReturnValue(["test.md"]);
      mockFs.readFileSync.mockReturnValue(`# Command\n${longContent}`);

      const result = getClaudeConfig();

      expect(result.commands[0].content.length).toBe(500);
    });
  });
});
