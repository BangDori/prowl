import * as fs from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import type {
  ClaudeAgent,
  ClaudeAgentMeta,
  ClaudeCommand,
  ClaudeConfig,
  ClaudeHook,
  ClaudeRule,
} from "@shared/types";

// Constants
const CLAUDE_DIR = path.join(homedir(), ".claude");
const AGENTS_DIR = path.join(CLAUDE_DIR, "agents");
const COMMANDS_DIR = path.join(CLAUDE_DIR, "commands");
const RULES_DIR = path.join(CLAUDE_DIR, "rules");
const SETTINGS_FILE = path.join(CLAUDE_DIR, "settings.json");

const PREVIEW_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 100;

/**
 * YAML frontmatter 파싱
 * ---
 * name: xxx
 * description: xxx
 * ---
 */
function parseFrontmatter(content: string): { meta: ClaudeAgentMeta; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      meta: { name: "", description: "" },
      body: content,
    };
  }

  const [, yaml, body] = match;
  const meta: ClaudeAgentMeta = { name: "", description: "" };

  // 간단한 YAML 파싱 (키: 값 형태만)
  for (const line of yaml.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (key === "name") meta.name = value;
    if (key === "description") meta.description = value;
    if (key === "model") meta.model = value;
    if (key === "color") meta.color = value;
  }

  return { meta, body };
}

/**
 * 마크다운 파일에서 첫 번째 제목 추출
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "제목 없음";
}

/**
 * 마크다운에서 첫 문단 추출 (설명용)
 */
function extractDescription(content: string, maxLength = DESCRIPTION_MAX_LENGTH): string {
  // # 제목 제거 후 첫 비어있지 않은 문단
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("-")) {
      return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
    }
  }
  return "설명 없음";
}

/**
 * ~/.claude/agents/ 폴더 재귀 스캔
 */
function scanAgents(): ClaudeAgent[] {
  const agents: ClaudeAgent[] = [];

  if (!fs.existsSync(AGENTS_DIR)) {
    return agents;
  }

  const categories = fs
    .readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(AGENTS_DIR, category);
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".md"));

    for (const filename of files) {
      const filePath = path.join(categoryPath, filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { meta, body } = parseFrontmatter(content);

      agents.push({
        id: `${category}/${filename.replace(".md", "")}`,
        filename,
        category,
        filePath,
        meta: {
          name: meta.name || filename.replace(".md", ""),
          description: meta.description || extractDescription(body),
          model: meta.model,
          color: meta.color,
        },
        content: body.slice(0, PREVIEW_LENGTH),
      });
    }
  }

  return agents;
}

/**
 * ~/.claude/commands/ 폴더 스캔
 */
function scanCommands(): ClaudeCommand[] {
  const commands: ClaudeCommand[] = [];

  if (!fs.existsSync(COMMANDS_DIR)) {
    return commands;
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".md"));

  for (const filename of files) {
    const filePath = path.join(COMMANDS_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");

    commands.push({
      id: filename.replace(".md", ""),
      filename,
      filePath,
      title: extractTitle(content),
      description: extractDescription(content),
      content: content.slice(0, PREVIEW_LENGTH),
    });
  }

  return commands;
}

/**
 * settings.json에서 hooks 파싱
 */
function scanHooks(): ClaudeHook[] {
  const hooks: ClaudeHook[] = [];

  if (!fs.existsSync(SETTINGS_FILE)) {
    return hooks;
  }

  try {
    const content = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(content);

    if (!settings.hooks) {
      return hooks;
    }

    for (const [event, hookConfigs] of Object.entries(settings.hooks)) {
      if (!Array.isArray(hookConfigs)) continue;

      for (const config of hookConfigs) {
        const hookConfig = config as {
          matcher?: string;
          hooks?: Array<{ type: string; command: string }>;
        };
        const matcher = hookConfig.matcher;
        const id = matcher ? `${event}:${matcher}` : event;

        hooks.push({
          id,
          event,
          matcher,
          hooks: hookConfig.hooks ?? [],
        });
      }
    }
  } catch {
    // JSON 파싱 실패 시 빈 배열 반환
  }

  return hooks;
}

/**
 * ~/.claude/rules/ 폴더 스캔
 */
function scanRules(): ClaudeRule[] {
  const rules: ClaudeRule[] = [];

  if (!fs.existsSync(RULES_DIR)) {
    return rules;
  }

  const files = fs.readdirSync(RULES_DIR).filter((f) => f.endsWith(".txt") || f.endsWith(".md"));

  for (const filename of files) {
    const filePath = path.join(RULES_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");

    rules.push({
      id: filename.replace(/\.(txt|md)$/, ""),
      filename,
      filePath,
      content,
    });
  }

  return rules;
}

/**
 * Claude Config 전체 조회
 */
export function getClaudeConfig(): ClaudeConfig {
  return {
    agents: scanAgents(),
    commands: scanCommands(),
    hooks: scanHooks(),
    rules: scanRules(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 특정 파일의 전체 내용 조회
 */
export function getFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return "파일을 찾을 수 없습니다.";
  }
  return fs.readFileSync(filePath, "utf-8");
}
