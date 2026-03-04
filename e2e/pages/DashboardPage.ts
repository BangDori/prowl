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

  /** 태스크 hover → pencil 클릭 → 제목 수정 → Enter 저장 */
  async editTask(title: string, newTitle: string): Promise<void> {
    const taskRow = this.page.locator(".group").filter({ hasText: title }).first();
    await taskRow.hover();
    // checkbox=nth(0), pencil=nth(1), trash=nth(2) after hover reveals hidden buttons
    await taskRow.locator("button").nth(1).click();
    const input = this.page.locator("input[type='text']").last();
    await input.clear();
    await input.fill(newTitle);
    await input.press("Enter");
    await this.page.waitForTimeout(500);
  }

  /** 태스크 hover → trash 클릭 → ConfirmDialog 확인 */
  async deleteTask(title: string): Promise<void> {
    const taskRow = this.page.locator(".group").filter({ hasText: title }).first();
    await taskRow.hover();
    // trash button is last in the hidden div
    await taskRow.locator("button").last().click();
    await this.page.getByRole("button", { name: "삭제" }).click();
    await this.page.waitForTimeout(500);
  }

  taskLocator(title: string): Locator {
    return this.page.getByText(title);
  }

  completedTaskLocator(title: string): Locator {
    return this.page.locator("span.line-through", { hasText: title });
  }
}
