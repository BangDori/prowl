/**
 * OpenAI OAuth 인증 서비스
 * PKCE (Proof Key for Code Exchange)를 사용한 보안 OAuth 2.0 flow 구현
 */

import { createHash, randomBytes } from "node:crypto";
import http from "node:http";
import type {
  ApiKeyCredential,
  OAuthAuthorization,
  OAuthCallbackResult,
  OAuthCredential,
} from "@shared/types";
import { BrowserWindow, shell } from "electron";

// OAuth 설정 (opencode와 동일한 Client ID와 포트 사용)
const OAUTH_CONFIG = {
  authorizationEndpoint: "https://auth.openai.com/oauth/authorize",
  tokenEndpoint: "https://auth.openai.com/oauth/token",
  clientId: "app_EMoamEEZ73f0CkXaXp7hrann", // OpenAI에 등록된 Client ID
  redirectUri: "http://localhost:1455/auth/callback", // opencode와 동일한 포트와 경로
  scope: "openid profile email offline_access",
};

// PKCE를 위한 코드 verifier 생성 (128자, [A-Z]/[a-z]/[0-9]/"-"/"."/_"/"~")
function generateCodeVerifier(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = randomBytes(128);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

// Code verifier로부터 code challenge 생성 (BASE64URL(SHA256(ASCII(code_verifier))))
function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

// Buffer를 base64url로 인코딩
function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// CSRF 방지를 위한 random state 생성
function generateState(): string {
  return randomBytes(32).toString("base64url");
}

// 보류 중인 OAuth 요청 관리
interface PendingOAuthRequest {
  codeVerifier: string;
  state: string;
  resolve: (result: OAuthCallbackResult) => void;
  timeout: NodeJS.Timeout;
}

const pendingRequests = new Map<string, PendingOAuthRequest>();

/** OAuth 이벤트를 모든 열려있는 renderer windows로 전송 */
function sendToOAuthWindows(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  });
}

// OAuth 콜백 서버
let callbackServer: http.Server | null = null;
const CALLBACK_PORT = 1455; // opencode와 동일한 포트

/** OAuth 콜백 서버 시작 */
export function startOAuthCallbackServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (callbackServer) {
      resolve();
      return;
    }

    callbackServer = http.createServer((req, res) => {
      // CORS 헤더
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // 콜백 처리
      if (req.url?.startsWith("/auth/callback?")) {
        const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        // HTML 응답
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

        if (error) {
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Authentication Failed</title></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
              <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #e53e3e; margin-top: 0;">Authentication Failed</h2>
                <p style="color: #666;">Error: ${error}</p>
                <p style="color: #999; font-size: 14px;">You can close this window.</p>
              </div>
            </body>
            </html>
          `);

          // 에러 처리
          if (state) {
            const pending = pendingRequests.get(state);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingRequests.delete(state);
              pending.resolve({
                type: "failed",
                error: error || "Authentication failed",
              });
            }
          }
        } else if (code && state) {
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Authentication Successful</title></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
              <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: #48bb78; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 style="color: #2f855a; margin-top: 0;">Authentication Successful!</h2>
                <p style="color: #666;">You have successfully authenticated with OpenAI.</p>
                <p style="color: #999; font-size: 14px;">You can close this window and return to Prowl.</p>
              </div>
            </body>
            </html>
          `);

          // 비동기적으로 콜백 처리
          setImmediate(async () => {
            console.log("[OAuth] Callback received, processing...", {
              code: `${code?.substring(0, 10)}...`,
              state,
            });
            try {
              const result = await handleOAuthCallback(code, state);
              console.log("[OAuth] Callback result:", result);
              // 모든 열려있는 renderer windows로 IPC 이벤트 전송
              sendToOAuthWindows("oauth:callback-result", result);
              console.log("[OAuth] IPC event sent to all windows");
            } catch (error) {
              console.error("[OAuth] Callback error:", error);
              const errorResult: OAuthCallbackResult = {
                type: "failed",
                error: error instanceof Error ? error.message : String(error),
              };
              sendToOAuthWindows("oauth:callback-result", errorResult);
            }
          });
        } else {
          res.writeHead(400);
          res.end("Missing required parameters");
        }
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    callbackServer.listen(CALLBACK_PORT, () => {
      console.log(`OAuth callback server listening on port ${CALLBACK_PORT}`);
      resolve();
    });

    callbackServer.on("error", (err) => {
      console.error("OAuth callback server error:", err);
      callbackServer = null;
      reject(err);
    });
  });
}

/** OAuth 콜백 서버 중지 */
export function stopOAuthCallbackServer(): void {
  if (callbackServer) {
    callbackServer.close(() => {
      console.log("OAuth callback server stopped");
      callbackServer = null;
    });
  }
}

/**
 * OAuth 인증 URL 생성 (opencode 방식)
 */
export async function createOAuthAuthorization(): Promise<OAuthAuthorization> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  // PKCE 파라미터 (opencode와 동일)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;

  // 5분 타이머와 함께 대기
  const timeout = setTimeout(
    () => {
      pendingRequests.delete(state);
    },
    5 * 60 * 1000,
  );

  // 보류 중인 요청 저장
  pendingRequests.set(state, {
    codeVerifier,
    state,
    resolve: () => {},
    timeout,
  });

  return {
    url: authUrl,
    method: "code",
    instructions: "Complete authorization in your browser. This window will close automatically.",
  };
}

/**
 * OAuth callback 처리
 */
export async function handleOAuthCallback(
  code: string,
  state: string,
): Promise<OAuthCallbackResult> {
  console.log("[OAuth] handleOAuthCallback called");
  const pending = pendingRequests.get(state);

  if (!pending) {
    console.error("[OAuth] No pending request found for state:", state);
    return {
      type: "failed",
      error: "Invalid or expired state parameter",
    };
  }

  // 타이머 정리
  clearTimeout(pending.timeout);
  pendingRequests.delete(state);

  try {
    console.log("[OAuth] Exchanging code for token...");
    // 토큰 엔드포인트로 code 교환
    const tokenResponse = await exchangeCodeForToken(code, pending.codeVerifier);
    console.log("[OAuth] Token exchange successful");

    return {
      type: "success",
      access: tokenResponse.access_token,
      refresh: tokenResponse.refresh_token,
      expires: Math.floor(Date.now() / 1000) + (tokenResponse.expires_in || 0),
      accountId: tokenResponse.account_id,
    };
  } catch (error) {
    console.error("[OAuth] Token exchange failed:", error);
    return {
      type: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Authorization code를 access token으로 교환
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  id_token?: string;
  account_id?: string;
}> {
  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      client_id: OAUTH_CONFIG.clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // JWT claims에서 account_id 추출 (opencode 방식)
  let accountId: string | undefined;
  if (data.id_token) {
    const claims = parseJwtClaims(data.id_token);
    accountId =
      claims?.chatgpt_account_id ||
      claims?.["https://api.openai.com/auth"]?.chatgpt_account_id ||
      claims?.organizations?.[0]?.id;
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    id_token: data.id_token,
    account_id: accountId,
  };
}

/**
 * JWT claims 파싱 (opencode 방식)
 */
interface IdTokenClaims {
  chatgpt_account_id?: string;
  organizations?: Array<{ id: string }>;
  email?: string;
  "https://api.openai.com/auth"?: {
    chatgpt_account_id?: string;
  };
}

function parseJwtClaims(token: string): IdTokenClaims | undefined {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return undefined;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch {
    return undefined;
  }
}

/**
 * Access token 갱신
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthCredential> {
  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: OAUTH_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    type: "oauth",
    access: data.access_token,
    refresh: data.refresh_token || refreshToken, // 새 refresh_token이 없으면 기존 것 재사용
    expires: Math.floor(Date.now() / 1000) + (data.expires_in || 0),
  };
}

/**
 * OAuth 인증 URL을 브라우저에서 열기
 */
export function openOAuthUrlInBrowser(url: string): void {
  shell.openExternal(url);
}

/**
 * OAuth credential이 만료되었는지 확인
 */
export function isOAuthCredentialExpired(credential: OAuthCredential): boolean {
  // 5분 미만으로 유효 기간 간주 (실제 만료 5분 전에 갱신 권장)
  const expiryBuffer = 5 * 60;
  return credential.expires < Date.now() / 1000 - expiryBuffer;
}

/**
 * OAuth credential 타입 검증
 */
export function isValidOAuthCredential(credential: unknown): credential is OAuthCredential {
  return (
    typeof credential === "object" &&
    credential !== null &&
    (credential as OAuthCredential).type === "oauth" &&
    typeof (credential as OAuthCredential).access === "string" &&
    typeof (credential as OAuthCredential).refresh === "string" &&
    typeof (credential as OAuthCredential).expires === "number"
  );
}

/**
 * API Key credential 타입 검증
 */
export function isValidApiKeyCredential(credential: unknown): credential is ApiKeyCredential {
  return (
    typeof credential === "object" &&
    credential !== null &&
    (credential as ApiKeyCredential).type === "api" &&
    typeof (credential as ApiKeyCredential).key === "string"
  );
}
