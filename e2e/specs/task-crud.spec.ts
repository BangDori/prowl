/** Journey 4 E2E — 태스크 인라인 편집 / 삭제 */
import { expect, test } from "@playwright/test";
import { getTodayDateString } from "../helpers";
import { DashboardPage } from "../pages/DashboardPage";
import { launchApp } from "../runner";

test("태스크 제목 인라인 편집 → 새 제목이 목록에 표시된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    const originalTitle = `편집 전 태스크 ${Date.now()}`;
    const updatedTitle = `편집 후 태스크 ${Date.now()}`;

    await dashboard.createTask(getTodayDateString(), {
      id: `e2e-edit-${Date.now()}`,
      title: originalTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    await dashboard.clickTodayCell();
    await expect(dashboard.taskLocator(originalTitle)).toBeVisible({ timeout: 5000 });

    await dashboard.editTask(originalTitle, updatedTitle);

    await expect(dashboard.taskLocator(updatedTitle)).toBeVisible({ timeout: 5000 });
    await expect(dashboard.taskLocator(originalTitle)).not.toBeVisible();
  } finally {
    await cleanup();
  }
});

test("태스크 삭제 → 목록에서 사라진다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    const taskTitle = `삭제 테스트 태스크 ${Date.now()}`;

    await dashboard.createTask(getTodayDateString(), {
      id: `e2e-delete-${Date.now()}`,
      title: taskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    await dashboard.clickTodayCell();
    await expect(dashboard.taskLocator(taskTitle)).toBeVisible({ timeout: 5000 });

    await dashboard.deleteTask(taskTitle);

    await expect(dashboard.taskLocator(taskTitle)).not.toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});
