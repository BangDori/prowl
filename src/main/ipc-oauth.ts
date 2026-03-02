/**
 * OpenAI OAuth 관련 IPC 핸들러
 */

import type { OAuthAuthorization, OAuthCallbackResult } from "@shared/types";
import { handleIpc } from "./ipc-utils";
import {
  createOAuthAuthorization,
  handleOAuthCallback,
  isOAuthCredentialExpired,
  isValidApiKeyCredential,
  isValidOAuthCredential,
  openOAuthUrlInBrowser,
  refreshAccessToken,
  startOAuthCallbackServer,
} from "./services/oauth";

/** OAuth 핸들러 등록 */
export function registerOAuthHandlers(): void {
  // OAuth 콜백 서버 시작
  handleIpc("oauth:start-server", async () => {
    try {
      await startOAuthCallbackServer();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // OAuth 인증 URL 생성
  handleIpc("oauth:create-authorization", async (): Promise<OAuthAuthorization> => {
    return createOAuthAuthorization();
  });

  // OAuth 인증 URL을 브라우저에서 열기
  handleIpc("oauth:open-url", async (url: string) => {
    openOAuthUrlInBrowser(url);
    return { success: true };
  });

  // OAuth callback 처리
  handleIpc(
    "oauth:callback",
    async (input: { code: string; state: string }): Promise<OAuthCallbackResult> => {
      return handleOAuthCallback(input.code, input.state);
    },
  );

  // Access token 갱신
  handleIpc("oauth:refresh-token", async (refreshToken: string) => {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      return { success: true, credential: refreshed };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // OAuth credential 만료 확인
  handleIpc("oauth:is-expired", async (credential: unknown) => {
    if (!isValidOAuthCredential(credential)) {
      return { valid: false, expired: false };
    }
    return { valid: true, expired: isOAuthCredentialExpired(credential) };
  });

  // Credential 타입 검증
  handleIpc("oauth:validate-credential", async (credential: unknown) => {
    const isValidOAuth = isValidOAuthCredential(credential);
    const isValidApiKey = isValidApiKeyCredential(credential);
    return {
      isValid: isValidOAuth || isValidApiKey,
      type: isValidOAuth ? "oauth" : isValidApiKey ? "api" : null,
    };
  });
}
