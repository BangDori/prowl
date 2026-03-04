/** E2E — 태스크 생성 → Calendar 표시 → 완료 처리 */
import { expect, test } from "@playwright/test";
import { getTodayDateString } from "../helpers";
import { DashboardPage } from "../pages/DashboardPage";
import { launchApp } from "../runner";

test("대시보드가 열리고 Calendar 섹션이 표시된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    await dashboard.waitForLoad();
    await expect(page.getByRole("button", { name: "Task Manager" })).toBeVisible();
  } finally {
    await cleanup();
  }
});

test("사이드바 네비게이션이 동작한다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    await dashboard.navigateTo("Personalize");
    await expect(page.getByRole("button", { name: "Personalize" })).toBeVisible();

    await dashboard.navigateTo("Settings");
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();

    await dashboard.navigateTo("Task Manager");
    await dashboard.waitForLoad();
  } finally {
    await cleanup();
  }
});

test("태스크 생성 → Calendar 날짜 클릭 시 목록에 표시된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    const taskTitle = `E2E 태스크 ${Date.now()}`;

    await dashboard.createTask(getTodayDateString(), {
      id: `e2e-${Date.now()}`,
      title: taskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    await dashboard.clickTodayCell();
    await expect(dashboard.taskLocator(taskTitle)).toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});

test("체크박스 클릭 → 태스크가 완료 스타일로 변경된다", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    const taskTitle = `완료 테스트 태스크 ${Date.now()}`;

    await dashboard.createTask(getTodayDateString(), {
      id: `e2e-done-${Date.now()}`,
      title: taskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    await dashboard.clickTodayCell();
    await expect(dashboard.taskLocator(taskTitle)).toBeVisible({ timeout: 5000 });

    await dashboard.toggleTask(taskTitle);
    await expect(dashboard.taskLocator(taskTitle)).not.toBeVisible({ timeout: 5000 });

    await dashboard.showCompletedTasks();
    await expect(dashboard.completedTaskLocator(taskTitle)).toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});
