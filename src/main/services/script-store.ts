/** Prowl 내부 스크립트 영속 저장소 (electron-store 기반) */
import type { ProwlScript, ScriptRunInfo } from "@shared/types";
import Store from "electron-store";

interface ScriptStoreSchema {
  scripts: ProwlScript[];
}

const store = new Store<ScriptStoreSchema>({
  name: "prowl-scripts",
  defaults: { scripts: [] },
});

export function getAllScripts(): ProwlScript[] {
  return store.get("scripts");
}

export function getScriptById(id: string): ProwlScript | null {
  return getAllScripts().find((s) => s.id === id) ?? null;
}

export function saveScript(script: ProwlScript): void {
  const scripts = getAllScripts();
  const idx = scripts.findIndex((s) => s.id === script.id);
  if (idx >= 0) {
    scripts[idx] = script;
  } else {
    scripts.push(script);
  }
  store.set("scripts", scripts);
}

export function deleteScriptById(id: string): void {
  const scripts = getAllScripts().filter((s) => s.id !== id);
  store.set("scripts", scripts);
}

export function updateLastRun(id: string, run: ScriptRunInfo): void {
  const script = getScriptById(id);
  if (!script) return;
  script.lastRun = run;
  saveScript(script);
}

export function toggleScriptEnabled(id: string): boolean {
  const script = getScriptById(id);
  if (!script) return false;
  script.isEnabled = !script.isEnabled;
  saveScript(script);
  return script.isEnabled;
}
