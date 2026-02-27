# OpenAI OAuth 시퀀스 다이어그램 (Pure OAuth Flow)

Electron IPC 레이어를 제외한 순수 OAuth 2.0 PKCE 프로토콜 흐름.

---

## 1. 인증 (Authorization Code + PKCE)

```mermaid
sequenceDiagram
    participant App as Prowl App
    participant Browser as System Browser
    participant Auth as auth.openai.com
    participant CB as Callback Server<br>(localhost:1455)

    Note over App: 1. PKCE 파라미터 생성
    App->>App: code_verifier = random(128자)<br>[A-Za-z0-9\-._~]
    App->>App: code_challenge = BASE64URL(SHA256(code_verifier))
    App->>App: state = random(32bytes).base64url

    Note over App: 2. 콜백 서버 기동
    App->>CB: http.createServer() on :1455

    Note over App,Browser: 3. 브라우저에서 인증 페이지 열기
    App->>Browser: shell.openExternal(authUrl)
    Browser->>Auth: GET /oauth/authorize?<br>response_type=code<br>&client_id=app_EMoamEEZ73f0CkXaXp7hrann<br>&redirect_uri=http://localhost:1455/auth/callback<br>&scope=openid profile email offline_access<br>&code_challenge={code_challenge}<br>&code_challenge_method=S256<br>&state={state}

    Note over Browser,Auth: 4. 사용자 로그인
    Auth->>Auth: 로그인 페이지 표시
    Browser->>Auth: 사용자가 ID/PW 입력 후 승인

    Note over Auth,CB: 5. Authorization Code 전달
    Auth->>CB: 302 Redirect →<br>GET /auth/callback?code={auth_code}&state={state}
    CB->>CB: state 검증 (pendingRequests에서 조회)
    CB->>Browser: 200 OK "Authentication Successful!" (HTML)

    Note over CB,Auth: 6. Code → Token 교환
    CB->>Auth: POST /oauth/token<br>Content-Type: application/x-www-form-urlencoded<br><br>grant_type=authorization_code<br>&code={auth_code}<br>&redirect_uri=http://localhost:1455/auth/callback<br>&client_id=app_EMoamEEZ73f0CkXaXp7hrann<br>&code_verifier={code_verifier}
    Auth-->>CB: 200 OK<br>{<br>  access_token: "eyJhbGci...",<br>  refresh_token: "r_abc123...",<br>  id_token: "eyJ...",<br>  expires_in: 3600<br>}

    Note over CB: 7. JWT에서 Account ID 추출
    CB->>CB: id_token.split(".")[1]<br>→ Base64 디코드<br>→ claims.chatgpt_account_id<br>  또는 claims["https://api.openai.com/auth"].chatgpt_account_id

    Note over CB,App: 8. Credential 저장
    CB->>App: OAuthCredential {<br>  type: "oauth",<br>  access: access_token,<br>  refresh: refresh_token,<br>  expires: now + expires_in,<br>  accountId: chatgpt_account_id<br>}
    App->>App: electron-store에 persist
```

---

## 2. 토큰 갱신 (Refresh Token Grant)

```mermaid
sequenceDiagram
    participant App as Prowl App
    participant Auth as auth.openai.com

    App->>App: credential.expires < (now - 300)?<br>(만료 5분 전 갱신)

    alt 토큰 유효
        App->>App: 기존 access_token 그대로 사용
    else 토큰 만료 임박/만료
        App->>Auth: POST /oauth/token<br>Content-Type: application/x-www-form-urlencoded<br><br>grant_type=refresh_token<br>&refresh_token={refresh_token}<br>&client_id=app_EMoamEEZ73f0CkXaXp7hrann
        Auth-->>App: 200 OK<br>{<br>  access_token: "새 토큰",<br>  refresh_token: "새 refresh (또는 없음)",<br>  expires_in: 3600<br>}
        App->>App: credential 업데이트<br>refresh_token이 없으면 기존 것 재사용
    end
```

---

## 3. Codex API 호출 (OAuth 토큰 사용)

```mermaid
sequenceDiagram
    participant App as Prowl App
    participant Codex as chatgpt.com<br>/backend-api/codex/responses

    Note over App: 요청 구성
    App->>App: Headers:<br>  Authorization: Bearer {access_token}<br>  ChatGPT-Account-Id: {accountId}<br>  Content-Type: application/json

    App->>Codex: POST /backend-api/codex/responses<br><br>{<br>  model: "gpt-5.3-codex",<br>  instructions: "system prompt",<br>  input: [{ role: "user", content: "..." }],<br>  store: false,<br>  stream: true<br>}

    Codex-->>App: 200 OK (SSE stream)<br>data: {"type":"response.output_text.delta","delta":"Hello"}<br>data: {"type":"response.output_text.delta","delta":" world"}<br>data: {"type":"response.completed","response":{...}}
```

---

## 4. 전체 흐름 요약 (End-to-End)

```mermaid
sequenceDiagram
    participant U as User
    participant App as Prowl App
    participant B as Browser
    participant Auth as auth.openai.com
    participant Codex as chatgpt.com/codex

    rect rgb(240, 248, 255)
        Note over U,Auth: Phase 1 — 인증 (최초 1회)
        U->>App: OAuth 로그인 요청
        App->>App: PKCE 생성 (verifier, challenge, state)
        App->>B: 인증 URL 열기
        B->>Auth: /oauth/authorize (PKCE params)
        U->>Auth: 로그인 승인
        Auth->>App: callback → code + state
        App->>Auth: POST /oauth/token (code + verifier)
        Auth-->>App: access_token + refresh_token + id_token
        App->>App: JWT → accountId 추출 → 저장
    end

    rect rgb(255, 248, 240)
        Note over App,Codex: Phase 2 — API 호출 (매 요청)
        U->>App: 채팅 메시지 전송
        App->>App: 토큰 만료 확인 (5분 버퍼)
        opt 만료 시
            App->>Auth: POST /oauth/token (refresh_token)
            Auth-->>App: 새 access_token
        end
        App->>Codex: POST /backend-api/codex/responses<br>Bearer {access_token}<br>ChatGPT-Account-Id: {accountId}
        Codex-->>App: SSE stream (응답)
        App-->>U: 응답 표시
    end
```

---

## OAuth 파라미터 요약

| 파라미터 | 값 |
|---------|-----|
| Grant Type | Authorization Code + PKCE |
| Client ID | `app_EMoamEEZ73f0CkXaXp7hrann` |
| Auth Endpoint | `https://auth.openai.com/oauth/authorize` |
| Token Endpoint | `https://auth.openai.com/oauth/token` |
| Redirect URI | `http://localhost:1455/auth/callback` |
| Scope | `openid profile email offline_access` |
| PKCE Method | S256 (SHA-256) |
| Code Verifier | 128자 랜덤 (`[A-Za-z0-9\-._~]`) |
| State | 32바이트 랜덤 (base64url) |
| Token Refresh | 만료 5분 전 자동 갱신 |
