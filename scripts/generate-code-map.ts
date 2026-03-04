/** 코드베이스 구조를 분석해 .context/code-map.md를 자동 생성하는 스크립트 */

import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, basename, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SERVICES_DIR = join(ROOT, "src/main/services");
const RENDERER_DIR = join(ROOT, "src/renderer");
const IPC_SCHEMA = join(ROOT, "src/shared/ipc-schema.ts");
const OUTPUT = join(ROOT, ".context/code-map.md");

// 파일 헤더 JSDoc 추출 — 파일 맨 앞의 /** ... */ 블록만 읽음 (내부 함수 JSDoc 제외)
async function extractJsDoc(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  // ^ + m 플래그 없이 → 파일 시작부터의 첫 번째 /** ... */ 블록만 매칭
  const block = content.match(/^\/\*\*([\s\S]*?)\*\//);
  if (!block) return "(설명 없음)";
  const lines = block[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l.length > 0);
  return lines[0] ?? "(설명 없음)";
}

// ipc-schema.ts에서 특정 prefix로 시작하는 채널명 추출
function extractChannels(ipcContent: string, prefixes: string[]): string[] {
  const all = [...ipcContent.matchAll(/"([a-z][a-z0-9-]+:[a-z][a-z0-9-]+)"/g)].map(
    (m) => m[1],
  );
  return [...new Set(all.filter((ch) => prefixes.some((p) => ch.startsWith(p))))];
}

interface FileInfo {
  filename: string;
  relPath: string; // src/ 기준 상대 경로
  description: string;
}

async function collectServices(
  match: (name: string) => boolean,
): Promise<FileInfo[]> {
  const files = await readdir(SERVICES_DIR);
  const results: FileInfo[] = [];
  for (const file of files) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
    if (!match(basename(file, ".ts"))) continue;
    results.push({
      filename: file,
      relPath: `src/main/services/${file}`,
      description: await extractJsDoc(join(SERVICES_DIR, file)),
    });
  }
  return results.sort((a, b) => a.filename.localeCompare(b.filename));
}

// src/renderer/ 하위를 재귀 탐색해 use*.ts 파일 수집
async function collectAllHooks(): Promise<{ name: string; absPath: string; relPath: string }[]> {
  const result: { name: string; absPath: string; relPath: string }[] = [];
  async function walk(dir: string) {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const abs = join(dir, entry);
      const s = await stat(abs);
      if (s.isDirectory()) {
        await walk(abs);
      } else if (entry.startsWith("use") && entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
        result.push({
          name: basename(entry, ".ts"),
          absPath: abs,
          relPath: `src/renderer/${relative(RENDERER_DIR, abs)}`,
        });
      }
    }
  }
  await walk(RENDERER_DIR);
  return result;
}

async function collectHooks(
  allHooks: { name: string; absPath: string; relPath: string }[],
  match: (name: string) => boolean,
): Promise<FileInfo[]> {
  const results: FileInfo[] = [];
  for (const hook of allHooks) {
    if (!match(hook.name)) continue;
    results.push({
      filename: basename(hook.absPath),
      relPath: hook.relPath,
      description: await extractJsDoc(hook.absPath),
    });
  }
  return results.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

// 도메인 그룹 정의
const DOMAINS = [
  {
    label: "채팅 (Chat)",
    serviceMatch: (n: string) => n === "chat" || n.startsWith("chat-"),
    hookMatch: (n: string) => n.startsWith("useChat"),
    ipcPrefixes: ["chat:", "chat-rooms:"],
  },
  {
    label: "태스크 (Tasks)",
    serviceMatch: (n: string) =>
      n === "tasks" || n.startsWith("task-") || n === "categories",
    hookMatch: (n: string) =>
      n.startsWith("useTask") ||
      n.startsWith("useAgenda") ||
      n.startsWith("useBacklog") ||
      n.startsWith("useUpcoming") ||
      n === "useCategories",
    ipcPrefixes: ["tasks:", "categories:"],
  },
  {
    label: "설정 (Settings)",
    serviceMatch: (n: string) => n === "settings",
    hookMatch: (n: string) => n === "useSettings",
    ipcPrefixes: ["settings:"],
  },
  {
    label: "메모리 (Memory)",
    serviceMatch: (n: string) => n === "memory" || n === "personalize",
    hookMatch: (n: string) => n === "useMemory",
    ipcPrefixes: ["memory:"],
  },
  {
    label: "인증 (OAuth)",
    serviceMatch: (n: string) => n === "oauth" || n === "approval",
    hookMatch: () => false,
    ipcPrefixes: ["oauth:"],
  },
  {
    label: "파일 시스템 (Prowl FS)",
    serviceMatch: (n: string) => n === "prowl-fs",
    hookMatch: (n: string) => n === "useProwlFiles",
    ipcPrefixes: ["prowl-files:"],
  },
  {
    label: "시스템 (System)",
    serviceMatch: (n: string) =>
      [
        "shortcuts",
        "notification",
        "update-checker",
        "brew-updater",
        "tool-registry",
      ].includes(n),
    hookMatch: (n: string) => n === "useUpdate" || n === "useAutoResize",
    ipcPrefixes: ["app:", "shell:", "window:", "nav:", "compact:"],
  },
];

async function main() {
  const ipcContent = await readFile(IPC_SCHEMA, "utf-8");
  const allHooks = await collectAllHooks();

  let out = `<!-- AUTO-GENERATED by scripts/generate-code-map.ts — DO NOT EDIT -->
<!-- 재생성: bun run codegen:map -->
<!-- ${new Date().toISOString()} -->

# Prowl Code Map

기능 이름으로 관련 파일을 즉시 찾기 위한 탐색 지도.
AI 코딩 에이전트가 세션 시작 시 참조하는 인덱스.

`;

  for (const domain of DOMAINS) {
    const services = await collectServices(domain.serviceMatch);
    const hooks = await collectHooks(allHooks, domain.hookMatch);
    const channels = extractChannels(ipcContent, domain.ipcPrefixes);

    out += `## ${domain.label}\n\n`;

    if (services.length > 0) {
      out += `**Main (서비스)**\n`;
      for (const s of services) {
        out += `- \`${s.relPath}\` — ${s.description}\n`;
      }
      out += "\n";
    }

    if (channels.length > 0) {
      out += `**IPC 채널** (${channels.length}개)\n`;
      out += `\`${channels.join("`, `")}\`\n\n`;
    }

    if (hooks.length > 0) {
      out += `**Renderer (훅)**\n`;
      for (const h of hooks) {
        out += `- \`${h.relPath}\` — ${h.description}\n`;
      }
      out += "\n";
    }

    out += "---\n\n";
  }

  out += `> 스키마: \`src/shared/ipc-schema.ts\`\n`;
  out += `> 타입: \`src/shared/types.ts\`\n`;

  await mkdir(join(ROOT, ".context"), { recursive: true });
  await writeFile(OUTPUT, out, "utf-8");

  const domainCount = DOMAINS.length;
  const serviceCount = (
    await Promise.all(DOMAINS.map((d) => collectServices(d.serviceMatch)))
  ).flat().length;
  const hookCount = (
    await Promise.all(DOMAINS.map((d) => collectHooks(allHooks, d.hookMatch)))
  ).flat().length;

  console.log(`✅ code-map 생성 완료 → .context/code-map.md`);
  console.log(`   도메인 ${domainCount}개 | 서비스 ${serviceCount}개 | 훅 ${hookCount}개`);
  console.log(`   ${new Date().toLocaleString("ko-KR")}`);
}

main().catch(console.error);
