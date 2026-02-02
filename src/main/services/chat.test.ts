import { describe, expect, it } from "vitest";
import { sendChatMessage } from "./chat";

describe("chat 서비스", () => {
  describe("sendChatMessage", () => {
    it("백엔드 미연결 에러를 반환한다", async () => {
      const result = await sendChatMessage("안녕", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("백엔드가 아직 연결되지 않았습니다");
    });
  });
});
