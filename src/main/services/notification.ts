import { Notification } from "electron";
import { isNotificationsEnabled } from "./settings";

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
  if (!isNotificationsEnabled()) {
    return;
  }

  const title = success ? `${jobName} 완료냥!` : `${jobName} 실패냥...`;
  const catMessage = success
    ? getRandomMessage(SUCCESS_MESSAGES)
    : getRandomMessage(FAILURE_MESSAGES);
  const body = message ? `${catMessage}\n${message}` : catMessage;

  const notification = new Notification({
    title,
    body,
    silent: false,
  });

  notification.show();
}
