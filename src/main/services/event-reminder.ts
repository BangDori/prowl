import type { LocalEvent } from "@shared/types";
import { Notification } from "electron";
import { getLocalEvents } from "./calendar";

const POLL_INTERVAL_MS = 30000; // 30초마다 확인

// 이미 발송된 알림 추적 (eventId_minutes 조합)
const firedReminders = new Set<string>();

let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 알림 키 생성 (중복 방지용)
 */
function reminderKey(eventId: string, minutes: number): string {
  return `${eventId}_${minutes}`;
}

/**
 * 알림 발송
 */
function sendEventReminder(event: LocalEvent, minutesBefore: number): void {
  if (!Notification.isSupported()) return;

  const title = minutesBefore === 0 ? `${event.summary} 시작!` : `${event.summary}`;

  let timeLabel: string;
  if (minutesBefore === 0) {
    timeLabel = "지금 시작";
  } else if (minutesBefore < 60) {
    timeLabel = `${minutesBefore}분 후 시작`;
  } else if (minutesBefore < 1440) {
    const hours = Math.floor(minutesBefore / 60);
    const mins = minutesBefore % 60;
    timeLabel = mins > 0 ? `${hours}시간 ${mins}분 후 시작` : `${hours}시간 후 시작`;
  } else {
    const days = Math.floor(minutesBefore / 1440);
    timeLabel = `${days}일 후 시작`;
  }

  const body = event.description ? `${timeLabel}\n${event.description}` : timeLabel;

  const notification = new Notification({
    title,
    body,
    silent: false,
  });

  notification.show();
}

/**
 * 알림 확인 및 발송
 */
function checkReminders(): void {
  const events = getLocalEvents();
  const now = Date.now();

  for (const event of events) {
    if (!event.reminders || event.reminders.length === 0) continue;

    const eventStart = new Date(event.dtstart).getTime();

    for (const reminder of event.reminders) {
      const key = reminderKey(event.id, reminder.minutes);

      // 이미 발송된 알림은 건너뛰기
      if (firedReminders.has(key)) continue;

      // 알림 시각 = 이벤트 시작 - 리마인더 분
      const reminderTime = eventStart - reminder.minutes * 60 * 1000;

      // 알림 시각이 지났고, 이벤트 시작 시간이 아직 안 지난 경우 (혹은 정각 알림은 시작 후 5분까지 허용)
      const gracePeriod = reminder.minutes === 0 ? 5 * 60 * 1000 : 0;
      if (now >= reminderTime && now <= eventStart + gracePeriod) {
        sendEventReminder(event, reminder.minutes);
        firedReminders.add(key);
      }

      // 이벤트가 이미 완전히 지났으면 fired에 추가 (발송하지 않고 무시)
      if (now > eventStart + gracePeriod) {
        firedReminders.add(key);
      }
    }
  }

  // 오래된 fired 항목 정리 (24시간 지난 이벤트)
  cleanupFiredReminders(events);
}

/**
 * 지난 이벤트의 fired 기록 정리
 */
function cleanupFiredReminders(events: LocalEvent[]): void {
  const eventIds = new Set(events.map((e) => e.id));
  const toDelete: string[] = [];

  for (const key of firedReminders) {
    const eventId = key.split("_")[0];
    if (!eventIds.has(eventId)) {
      toDelete.push(key);
    }
  }

  for (const key of toDelete) {
    firedReminders.delete(key);
  }
}

/**
 * 알림 스케줄러 시작
 */
export function startEventReminderScheduler(): void {
  if (pollTimer) return;

  // 즉시 한 번 실행
  checkReminders();

  // 주기적 확인
  pollTimer = setInterval(checkReminders, POLL_INTERVAL_MS);
}

/**
 * 알림 스케줄러 중지
 */
export function stopEventReminderScheduler(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * 이벤트 변경 시 호출 (즉시 알림 재확인)
 */
export function refreshReminders(): void {
  checkReminders();
}
