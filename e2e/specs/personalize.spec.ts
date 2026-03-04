/** E2E — Personalize 탭: Memory CRUD / System Prompt / Tone & Manner */
import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { PersonalizePage } from "../pages/PersonalizePage";
import { launchApp } from "../runner";

// ── Memory ────────────────────────────────────────────────────────────────────

test("메모리 추가 → 목록에 표시된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  const personalize = new PersonalizePage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await personalize.waitForLoad();

    const content = `E2E 메모리 ${Date.now()}`;
    await personalize.addMemory(content);

    await expect(personalize.memoryLocator(content)).toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});

test("메모리 편집 → 내용이 변경된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  const personalize = new PersonalizePage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await personalize.waitForLoad();

    const original = `편집 전 메모리 ${Date.now()}`;
    const updated = `편집 후 메모리 ${Date.now()}`;

    await personalize.addMemory(original);
    await expect(personalize.memoryLocator(original)).toBeVisible({ timeout: 5000 });

    await personalize.editMemory(original, updated);

    await expect(personalize.memoryLocator(updated)).toBeVisible({ timeout: 5000 });
    await expect(personalize.memoryLocator(original)).not.toBeVisible();
  } finally {
    await cleanup();
  }
});

test("메모리 삭제 → 목록에서 사라진다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  const personalize = new PersonalizePage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await personalize.waitForLoad();

    const content = `삭제 메모리 ${Date.now()}`;
    await personalize.addMemory(content);
    await expect(personalize.memoryLocator(content)).toBeVisible({ timeout: 5000 });

    await personalize.deleteMemory(content);

    await expect(personalize.memoryLocator(content)).not.toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});

// ── System Prompt ─────────────────────────────────────────────────────────────

test("System Prompt 수정 후 저장 → 저장 버튼이 비활성화된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  const personalize = new PersonalizePage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await personalize.waitForLoad();

    await personalize.setSystemPrompt("E2E 커스텀 시스템 프롬프트");
    // 변경 후에는 저장 버튼이 활성화
    await expect(personalize.systemPromptSaveButton()).toBeEnabled();

    await personalize.saveSystemPrompt();
    // 저장 후에는 저장 버튼 비활성화 (isDirty=false)
    await expect(personalize.systemPromptSaveButton()).toBeDisabled();
  } finally {
    await cleanup();
  }
});

test("System Prompt 기본값으로 복원 → 저장 버튼이 비활성화된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  const personalize = new PersonalizePage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await personalize.waitForLoad();

    await personalize.setSystemPrompt("임시 프롬프트");
    await personalize.saveSystemPrompt();

    await personalize.resetSystemPrompt();
    // 기본값으로 복원 후 저장 버튼은 비활성화 (override가 ""로 초기화됨)
    await expect(personalize.systemPromptSaveButton()).toBeDisabled();
  } finally {
    await cleanup();
  }
});

// ── Tone & Manner ─────────────────────────────────────────────────────────────

test("Tone & Manner 저장 → 저장 버튼이 비활성화된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  const personalize = new PersonalizePage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await personalize.waitForLoad();

    await personalize.setTone("항상 친근하고 간결하게 답변해");
    await expect(personalize.toneSaveButton()).toBeEnabled();

    await personalize.saveTone();
    await expect(personalize.toneSaveButton()).toBeDisabled();
  } finally {
    await cleanup();
  }
});
