import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "node:child_process";
import { executeCommand } from "./command";

const mockExecSync = vi.mocked(execSync);

describe("executeCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("성공 시 successMessage를 반환한다", () => {
    mockExecSync.mockReturnValue("");

    const result = executeCommand('launchctl load "test.plist"', {
      successMessage: "활성화 완료",
      errorPrefix: "활성화 실패",
    });

    expect(result).toEqual({ success: true, message: "활성화 완료" });
    expect(mockExecSync).toHaveBeenCalledWith('launchctl load "test.plist"', {
      encoding: "utf-8",
    });
  });

  it("실패 시 errorPrefix와 에러 메시지를 반환한다", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("command not found");
    });

    const result = executeCommand("invalid-command", {
      successMessage: "성공",
      errorPrefix: "실행 실패",
    });

    expect(result).toEqual({
      success: false,
      message: "실행 실패: command not found",
    });
  });

  it("Error가 아닌 값이 throw되면 String으로 변환한다", () => {
    mockExecSync.mockImplementation(() => {
      throw "string error";
    });

    const result = executeCommand("bad-command", {
      successMessage: "성공",
      errorPrefix: "실패",
    });

    expect(result).toEqual({
      success: false,
      message: "실패: string error",
    });
  });
});
