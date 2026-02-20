/** 위험 도구 실행 전 사용자 승인 프로토콜 */

const APPROVAL_TIMEOUT_MS = 30_000;

interface PendingApproval {
  resolve: (approved: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingApproval>();

/**
 * 승인 대기 Promise 반환.
 * 사용자가 approve/reject하거나 30초 후 자동으로 false(거부) 반환.
 */
export function waitForApproval(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        resolve(false);
      }
    }, APPROVAL_TIMEOUT_MS);

    pending.set(id, { resolve, timer });
  });
}

/**
 * 승인 또는 거부 처리. IPC 핸들러에서 호출.
 * @returns 처리 성공 여부 (pending에 없으면 false)
 */
export function resolveApproval(id: string, approved: boolean): boolean {
  const entry = pending.get(id);
  if (!entry) return false;
  clearTimeout(entry.timer);
  pending.delete(id);
  entry.resolve(approved);
  return true;
}
