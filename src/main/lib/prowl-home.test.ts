/** Prowl 데이터 홈 경로 해석 유닛 테스트 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { getPath: vi.fn().mockReturnValue("/home/user") },
}));

import { app } from "electron";
import { getDataHome } from "./prowl-home";

describe("getDataHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PROWL_DATA_HOME;
  });

  afterEach(() => {
    delete process.env.PROWL_DATA_HOME;
  });

  it("PROWL_DATA_HOME env가 없으면 app.getPath('home')을 반환한다", () => {
    expect(getDataHome()).toBe("/home/user");
    expect(app.getPath).toHaveBeenCalledWith("home");
  });

  it("PROWL_DATA_HOME env가 설정되어 있으면 그 값을 우선 사용한다", () => {
    process.env.PROWL_DATA_HOME = "/tmp/prowl-e2e";
    expect(getDataHome()).toBe("/tmp/prowl-e2e");
    expect(app.getPath).not.toHaveBeenCalled();
  });
});
