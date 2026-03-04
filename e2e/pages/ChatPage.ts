/** Chat View 창 Page Object Model */
import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export class ChatPage {
  constructor(private readonly page: Page) {}

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.page.locator("textarea")).toBeVisible({ timeout: 5000 });
  }

  async sendMessage(content: string): Promise<void> {
    await this.page.locator("textarea").fill(content);
    await this.page.keyboard.press("Enter");
  }

  /** 스트리밍 완료 대기 — 로딩 인디케이터(bounce dot) 소멸 기준 */
  async waitForStreamingComplete(timeout = 60_000): Promise<void> {
    // 스트리밍 시작 대기 (최대 10s)
    try {
      await expect(this.loadingDot()).toBeVisible({ timeout: 10_000 });
    } catch {
      // 이미 응답이 완료됐거나 매우 빠르게 시작된 경우
    }
    // 스트리밍 종료 대기
    await expect(this.loadingDot()).not.toBeVisible({ timeout });
  }

  loadingDot(): Locator {
    return this.page.locator(".animate-bounce").first();
  }

  assistantBubble(): Locator {
    return this.page.locator('img[alt="Prowl"]').first();
  }

  userBubble(text: string): Locator {
    return this.page.locator(".bg-accent", { hasText: text });
  }
}
