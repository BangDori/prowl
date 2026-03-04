/** Journey 3 E2E — AI 채팅 메시지 전송 → 응답 렌더링 + Tool Calling → Calendar 반영 */
import { expect, test } from "@playwright/test";
import { ChatPage } from "../pages/ChatPage";
import { DashboardPage } from "../pages/DashboardPage";
import { launchApp } from "../runner";

test.skip(!process.env.E2E_OPENAI_KEY, "E2E_OPENAI_KEY 환경변수 필요");

test("채팅 메시지 전송 → 어시스턴트 MessageBubble 렌더링", async () => {
  const { app, page: rawPage, cleanup } = await launchApp();
  const dashboard = new DashboardPage(rawPage, app);
  try {
    const chatRawPage = await dashboard.openChatView();
    const chat = new ChatPage(chatRawPage);
    await chat.waitForLoad();

    await chat.sendMessage("안녕!");
    await chat.waitForStreamingComplete();

    await expect(chat.assistantBubble()).toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();
  }
});

test("Tool Calling → 태스크 추가 → Dashboard Calendar에 반영", async () => {
  const { app, page: rawPage, cleanup } = await launchApp();
  const dashboard = new DashboardPage(rawPage, app);
  try {
    const taskTitle = `E2E 채팅 태스크 ${Date.now()}`;
    const chatRawPage = await dashboard.openChatView();
    const chat = new ChatPage(chatRawPage);
    await chat.waitForLoad();

    await chat.sendMessage(`오늘 일정에 '${taskTitle}' 이름으로 태스크를 추가해줘`);
    await chat.waitForStreamingComplete(60_000);

    await rawPage.waitForTimeout(1000);
    await dashboard.clickTodayCell();
    await expect(dashboard.taskLocator(taskTitle)).toBeVisible({ timeout: 10_000 });
  } finally {
    await cleanup();
  }
});
