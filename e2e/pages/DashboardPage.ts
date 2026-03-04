/** Dashboard 창 Page Object Model */
import { expect } from "@playwright/test";
import type { ElectronApplication, Locator, Page } from "@playwright/test";

interface TaskData {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export class DashboardPage {
  constructor(
    private readonly page: Page,
    private readonly app?: ElectronApplication,
  ) {}

  async waitForLoad(): Promise<void> {
    await expect(this.page.locator('button[title="새로고침"]')).toBeVisible();
  }

  async navigateTo(section: "Task Manager" | "Personalize" | "Settings"): Promise<void> {
    await this.page.getByRole("button", { name: section }).click();
  }

  async createTask(dateStr: string, task: TaskData): Promise<void> {
    await this.page.evaluate(
      async ({ date, t }) => {
        await (
          window as Window & {
            electronAPI: { addDateTask: (d: string, task: object) => Promise<void> };
          }
        ).electronAPI.addDateTask(date, t);
      },
      { date: dateStr, t: task },
    );
    await this.page.waitForTimeout(1000);
  }

  async clickTodayCell(): Promise<void> {
    const todayNum = new Date().getDate().toString();
    await this.page
      .locator("button")
      .filter({ has: this.page.locator(`span.bg-accent:has-text("${todayNum}")`) })
      .click();
  }

  async toggleTask(title: string): Promise<void> {
    const taskRow = this.page.locator(".group").filter({ hasText: title }).first();
    await taskRow.locator("button").first().click();
    await this.page.waitForTimeout(1000);
  }

  async showCompletedTasks(): Promise<void> {
    await this.page.locator('button[title="완료 표시"]').click();
    await this.page.waitForTimeout(500);
  }

  async openCompactView(): Promise<Page> {
    if (!this.app) throw new Error("openCompactView에는 app 레퍼런스가 필요합니다");
    const compactPagePromise = this.app.waitForEvent("window");
    await this.page.evaluate(() => {
      (
        window as Window & { electronAPI: { toggleCompactView: () => void } }
      ).electronAPI.toggleCompactView();
    });
    return compactPagePromise;
  }

  async openChatView(): Promise<Page> {
    if (!this.app) throw new Error("openChatView에는 app 레퍼런스가 필요합니다");
    const chatPagePromise = this.app.waitForEvent("window");
    await this.page.evaluate(() => {
      (
        window as Window & { electronAPI: { toggleChatWindow: () => void } }
      ).electronAPI.toggleChatWindow();
    });
    return chatPagePromise;
  }

  taskLocator(title: string): Locator {
    return this.page.getByText(title);
  }

  completedTaskLocator(title: string): Locator {
    return this.page.locator("span.line-through", { hasText: title });
  }
}
