/** Personalize 탭 Page Object Model — Memory / System Prompt / Tone & Manner */
import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export class PersonalizePage {
  constructor(private readonly page: Page) {}

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.page.locator("h3", { hasText: "Memory" }).first()).toBeVisible({
      timeout: 5000,
    });
  }

  // ── Memory ──────────────────────────────────────────────────────────────────

  /** 메모리 추가 버튼 → textarea 입력 → Enter */
  async addMemory(content: string): Promise<void> {
    await this.page.getByRole("button", { name: "추가" }).first().click();
    await this.page
      .locator('textarea[placeholder*="항상 한국어"]')
      .last()
      .fill(content);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(500);
  }

  /** 메모리 카드 hover → 연필 클릭 → 내용 수정 → Save */
  async editMemory(oldContent: string, newContent: string): Promise<void> {
    const card = this.memoryCard(oldContent);
    await card.hover();
    await card.locator("button").nth(0).click({ force: true });
    // MemoryCard textarea는 autoFocus — 편집 진입 직후 포커스됨
    // card 로케이터를 재사용하면 hasText 필터가 무효화될 수 있으므로 page 레벨에서 찾음
    const editArea = this.page.locator("textarea:focus");
    await editArea.fill(newContent);
    await this.page.getByRole("button", { name: "Save" }).last().click();
    await this.page.waitForTimeout(500);
  }

  /** 메모리 카드 hover → 삭제 클릭 → ConfirmDialog 확인 */
  async deleteMemory(content: string): Promise<void> {
    const card = this.memoryCard(content);
    await card.hover();
    await card.locator("button").nth(1).click({ force: true });
    // ConfirmDialog
    await this.page.getByRole("button", { name: "삭제" }).click();
    await this.page.waitForTimeout(500);
  }

  memoryLocator(content: string): Locator {
    return this.page.locator("p", { hasText: content }).first();
  }

  private memoryCard(content: string): Locator {
    // PersonalizeSection MemoryCard: border-b py-2 group 구조
    return this.page.locator(".py-2.group").filter({ hasText: content }).first();
  }

  // ── System Prompt ────────────────────────────────────────────────────────────

  private systemPromptCard(): Locator {
    return this.page
      .locator(".glass-card-3d")
      .filter({ has: this.page.locator("p", { hasText: "System Prompt" }) })
      .first();
  }

  async setSystemPrompt(content: string): Promise<void> {
    const textarea = this.systemPromptCard().locator("textarea");
    await textarea.clear();
    await textarea.fill(content);
  }

  async saveSystemPrompt(): Promise<void> {
    await this.systemPromptCard().getByRole("button", { name: "저장" }).click();
    await this.page.waitForTimeout(500);
  }

  async resetSystemPrompt(): Promise<void> {
    await this.systemPromptCard().getByRole("button", { name: "기본값으로" }).click();
    await this.page.waitForTimeout(500);
  }

  systemPromptSaveButton(): Locator {
    return this.systemPromptCard().getByRole("button", { name: "저장" });
  }

  // ── Tone & Manner ────────────────────────────────────────────────────────────

  private toneCard(): Locator {
    return this.page
      .locator(".glass-card-3d")
      .filter({ has: this.page.locator("p", { hasText: "Tone & Manner" }) })
      .first();
  }

  async setTone(content: string): Promise<void> {
    const textarea = this.toneCard().locator("textarea");
    await textarea.clear();
    await textarea.fill(content);
  }

  async saveTone(): Promise<void> {
    await this.toneCard().getByRole("button", { name: "저장" }).click();
    await this.page.waitForTimeout(500);
  }

  toneSaveButton(): Locator {
    return this.toneCard().getByRole("button", { name: "저장" });
  }
}
