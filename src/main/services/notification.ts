/** macOS 네이티브 알림 발송 */
import { Notification } from "electron";
import { formatNotificationBody } from "./notification-format";
import { isNotificationsEnabled } from "./settings";

// macOS 알림 권한 확인
function checkNotificationSupport(): boolean {
  return Notification.isSupported();
}

/**
 * 채팅 새 메시지 알림 발송
 */
export function sendChatNotification(message: string): void {
  if (!checkNotificationSupport() || !isNotificationsEnabled()) {
    return;
  }

  const body = formatNotificationBody(message);
  if (!body) return;

  const notification = new Notification({
    title: "Prowl",
    body,
    silent: false,
  });

  notification.show();
}
