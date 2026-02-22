/** ~/.prowl/ 파일 시스템 AI 툴 — 디렉터리 탐색 및 파일 읽기 */

import { tool } from "ai";
import { z } from "zod";
import { listProwlDir, readProwlFile } from "./prowl-fs";
import { toolRegistry } from "./tool-registry";

const list_prowl_dir = tool({
  description:
    "List files and directories inside ~/.prowl/. Pass a relative path to explore a subdirectory, or omit to list the root. Use this first to discover what data exists before reading files.",
  inputSchema: z.object({
    path: z
      .string()
      .optional()
      .describe(
        'Relative path inside ~/.prowl/ (e.g. "economic-freedom", "scripts"). Omit for root.',
      ),
  }),
  execute: async ({ path }) => {
    try {
      const entries = listProwlDir(path ?? "");
      return { directory: path ? `~/.prowl/${path}` : "~/.prowl/", entries };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const read_prowl_file = tool({
  description:
    "Read the content of a file inside ~/.prowl/. Provide the relative path from ~/.prowl/ root. Use list_prowl_dir first to discover available files.",
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        'Relative path to the file inside ~/.prowl/ (e.g. "scripts.json", "economic-freedom/config.json")',
      ),
  }),
  execute: async ({ path }) => {
    try {
      const content = readProwlFile(path);
      return { path: `~/.prowl/${path}`, content };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

// Prowl 파일 시스템 툴 등록
toolRegistry.register(
  { name: "prowl-fs", label: "Prowl 파일 탐색", dangerLevel: "safe" },
  { list_prowl_dir, read_prowl_file },
);
