/** 태스크 / Backlog IPC 핸들러 */
import { handleIpc } from "./ipc-utils";
import { refreshReminders } from "./services/task-reminder";
import {
  addDateTask,
  addTaskToBacklog,
  deleteBacklogTask,
  deleteTask,
  listBacklogTasks,
  listTasksByDateRange,
  listTasksByMonth,
  moveOverdueTasksToBacklog,
  scanDates,
  toggleBacklogComplete,
  toggleTaskComplete,
  updateBacklogTask,
  updateTask,
} from "./services/tasks";

export function registerTaskHandlers(): void {
  // 월 단위 태스크 조회
  handleIpc("tasks:list-month", async (year, month) => {
    moveOverdueTasksToBacklog();
    return listTasksByMonth(year, month);
  });

  // 날짜 범위 태스크 조회
  handleIpc("tasks:list-date-range", async (startDate, endDate) => {
    moveOverdueTasksToBacklog();
    return listTasksByDateRange(startDate, endDate);
  });

  // 태스크 수정
  handleIpc("tasks:update-task", async (date, task) => {
    try {
      updateTask(date, task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 태스크 완료 토글
  handleIpc("tasks:toggle-complete", async (date, taskId) => {
    try {
      toggleTaskComplete(date, taskId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 태스크 삭제
  handleIpc("tasks:delete-task", async (date, taskId) => {
    try {
      deleteTask(date, taskId);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 태스크 추가
  handleIpc("tasks:add-task", async (date, task) => {
    try {
      addDateTask(date, task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 날짜 파일 목록 조회
  handleIpc("tasks:scan-dates", async () => {
    return scanDates();
  });

  // ── Backlog ──────────────────────────────────────────

  handleIpc("tasks:list-backlog", async () => {
    moveOverdueTasksToBacklog();
    return listBacklogTasks();
  });

  handleIpc("tasks:add-backlog", async (task) => {
    try {
      addTaskToBacklog(task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("tasks:update-backlog", async (task) => {
    try {
      updateBacklogTask(task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("tasks:toggle-backlog-complete", async (taskId) => {
    try {
      toggleBacklogComplete(taskId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("tasks:delete-backlog", async (taskId) => {
    try {
      deleteBacklogTask(taskId);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
