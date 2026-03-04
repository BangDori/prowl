/** 위험 도구 승인 프로토콜 유닛 테스트 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveApproval, waitForApproval } from "./approval";

describe("approval 서비스", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolveApproval(true) 시 Promise가 true로 resolve된다", async () => {
    const promise = waitForApproval("id-approve");
    resolveApproval("id-approve", true);
    expect(await promise).toBe(true);
  });

  it("resolveApproval(false) 시 Promise가 false로 resolve된다", async () => {
    const promise = waitForApproval("id-reject");
    resolveApproval("id-reject", false);
    expect(await promise).toBe(false);
  });

  it("30초 타임아웃 후 자동으로 false 반환 (자동 거부)", async () => {
    const promise = waitForApproval("id-timeout");
    vi.advanceTimersByTime(30_000);
    expect(await promise).toBe(false);
  });

  it("없는 id로 resolveApproval 호출 시 false 반환", () => {
    expect(resolveApproval("not-exist", true)).toBe(false);
  });

  it("이미 resolve된 id는 두 번 resolve 불가 (pending에서 제거됨)", async () => {
    const promise = waitForApproval("id-double");
    resolveApproval("id-double", true);
    await promise;
    expect(resolveApproval("id-double", false)).toBe(false);
  });

  it("서로 다른 id는 독립적으로 resolve된다", async () => {
    const p1 = waitForApproval("id-a");
    const p2 = waitForApproval("id-b");
    resolveApproval("id-b", false);
    resolveApproval("id-a", true);
    expect(await p1).toBe(true);
    expect(await p2).toBe(false);
  });
});
