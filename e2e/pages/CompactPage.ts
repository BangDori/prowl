/** Compact View 창 Page Object Model */
import type { Locator, Page } from "@playwright/test";

export class CompactPage {
  constructor(private readonly page: Page) {}

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(800);
  }

  async toggleTask(title: string): Promise<void> {
    const taskRow = this.page.locator(".group").filter({ hasText: title }).first();
    await taskRow.locator("button").first().click();
    await this.page.waitForTimeout(800);
  }

  async expandCompleted(): Promise<void> {
    await this.page.locator("button", { hasText: /완료됨/ }).click();
    await this.page.waitForTimeout(300);
  }

  taskLocator(title: string): Locator {
    return this.page.getByText(title);
  }

  completedTaskLocator(title: string): Locator {
    return this.page.locator("span.line-through", { hasText: title });
  }
}
