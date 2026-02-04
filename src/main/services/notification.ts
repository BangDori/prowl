import { Notification } from "electron";
import { isNotificationsEnabled } from "./settings";

// macOS 알림 권한 확인
function checkNotificationSupport(): boolean {
  if (!Notification.isSupported()) {
    console.log("[notification] Notifications not supported on this platform");
    return false;
  }
  return true;
}

interface JobNotificationParams {
  jobName: string;
  success: boolean;
  message?: string;
}

const SUCCESS_MESSAGES = [
  "냥~ 완벽하게 해냈다옹!",
  "뿌듯하다냥~ 성공이다옹!",
  "잘 돌아갔다냥~",
  "미션 완료다옹!",
];

const FAILURE_MESSAGES = [
  "어... 뭔가 잘못됐다냥...",
  "으앙... 실패했다옹 ㅠㅠ",
  "삐빅- 에러 발생이다냥!",
  "문제가 생겼다옹... 확인해줘냥!",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Job 완료 알림 발송
 */
export function sendJobNotification({ jobName, success, message }: JobNotificationParams): void {
  console.log(`[notification] sendJobNotification called for ${jobName}, success: ${success}`);

  if (!checkNotificationSupport()) {
    return;
  }

  if (!isNotificationsEnabled()) {
    console.log(`[notification] Notifications disabled, skipping`);
    return;
  }

  const title = success ? `${jobName} 완료냥!` : `${jobName} 실패냥...`;
  const catMessage = success
    ? getRandomMessage(SUCCESS_MESSAGES)
    : getRandomMessage(FAILURE_MESSAGES);
  const body = message ? `${catMessage}\n${message}` : catMessage;

  console.log(`[notification] Showing notification: ${title} - ${body}`);

  try {
    const notification = new Notification({
      title,
      body,
      silent: false,
    });

    notification.on("show", () => {
      console.log("[notification] Notification shown successfully");
    });

    notification.on("click", () => {
      console.log("[notification] Notification clicked");
    });

    notification.on("close", () => {
      console.log("[notification] Notification closed");
    });

    notification.show();
  } catch (error) {
    console.error("[notification] Failed to create/show notification:", error);
  }
}
