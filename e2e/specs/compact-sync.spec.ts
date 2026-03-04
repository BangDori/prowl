/** E2E — Compact View 완료 처리 → Dashboard Calendar 동기화 */
import { expect, test } from "@playwright/test";
import { getTodayDateString } from "../helpers";
import { CompactPage } from "../pages/CompactPage";
import { DashboardPage } from "../pages/DashboardPage";
import { launchApp } from "../runner";

test("Compact에서 완료 처리 → Dashboard Calendar에 완료 상태 반영", async () => {
  const { app, page: rawPage, cleanup } = await launchApp();
  const dashboard = new DashboardPage(rawPage, app);
  try {
    const taskTitle = `Compact 동기화 테스트 ${Date.now()}`;

    await dashboard.createTask(getTodayDateString(), {
      id: `e2e-compact-${Date.now()}`,
      title: taskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    const compactRawPage = await dashboard.openCompactView();
    const compact = new CompactPage(compactRawPage);
    await compact.waitForLoad();

    await expect(compact.taskLocator(taskTitle)).toBeVisible({ timeout: 5000 });
    await compact.toggleTask(taskTitle);
    await expect(compact.taskLocator(taskTitle)).not.toBeVisible({ timeout: 5000 });

    await compact.expandCompleted();
    await expect(compact.completedTaskLocator(taskTitle)).toBeVisible({ timeout: 5000 });

    await rawPage.waitForTimeout(1000);
    await dashboard.clickTodayCell();
    await rawPage.waitForTimeout(500);
    await dashboard.showCompletedTasks();
    await expect(dashboard.completedTaskLocator(taskTitle)).toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});
