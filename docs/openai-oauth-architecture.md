# Prowl OpenAI OAuth 아키텍처

## 개요

Prowl은 OpenAI의 ChatGPT OAuth를 통해 사용자 인증 후, Codex 엔드포인트로 AI 채팅을 제공한다.
API Key 방식도 병행 지원하며, 인증 타입에 따라 엔드포인트/모델/요청 포맷이 분기된다.

## 인증 방식 비교

| 항목 | OAuth (Codex) | API Key |
|------|--------------|---------|
| 엔드포인트 | `chatgpt.com/backend-api/codex/responses` | `api.openai.com/v1/chat/completions` |
| API 포맷 | Responses API (`instructions` + `input`) | Chat Completions (`system` + `messages`) |
| SDK 메서드 | `openai.responses(modelId)` | `openai.chat(modelId)` |
| 인증 헤더 | `Bearer {access_token}` + `ChatGPT-Account-Id` | `Bearer {api_key}` |
| 토큰 갱신 | 자동 (5분 전 refresh) | 불필요 |
| 모델 | Codex 전용 (gpt-5.3-codex 등) | 범용 (gpt-5.2, gpt-5-mini 등) |
| store | `false` (필수) | 기본값 사용 |
| web_search | 미지원 (제외) | 지원 |

## 파일 구조

```
src/
├── shared/
│   ├── types/common.ts          # OAuthCredential, ApiKeyCredential, OpenAICredential 타입
│   └── ipc-schema.ts            # oauth:* IPC 채널 스키마 (7 invoke + 1 event)
├── main/
│   ├── services/
│   │   ├── oauth.ts             # PKCE OAuth flow, 콜백 서버, 토큰 교환/갱신
│   │   ├── chat.ts              # 채팅 스트리밍 (OAuth/API Key 분기)
│   │   └── settings.ts          # electron-store 기반 credential 저장
│   ├── ipc-oauth.ts             # OAuth IPC 핸들러 등록
│   └── ipc.ts                   # registerOAuthHandlers() 호출
├── preload/
│   └── index.ts                 # OAuth API 노출 (invokeIpc + onOAuthCallbackResult)
└── renderer/
    └── components/sections/
        └── SettingsSection.tsx   # OAuth Connect/Disconnect UI
```

## 핵심 데이터 타입

```typescript
// OAuth 자격 증명 (ChatGPT 계정 로그인)
interface OAuthCredential {
  type: "oauth";
  access: string;       // access_token (Bearer 토큰)
  refresh: string;      // refresh_token (갱신용)
  expires: number;      // 만료 시각 (Unix timestamp, seconds)
  accountId?: string;   // ChatGPT-Account-Id (JWT에서 추출)
}

// API Key 자격 증명
interface ApiKeyCredential {
  type: "api";
  key: string;          // sk-proj-... API 키
}

// 통합 타입 (chat.ts에서 사용)
type OpenAICredential = OAuthCredential | ApiKeyCredential;
```

## 시퀀스 다이어그램

### 1. OAuth 로그인 Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as Renderer<br>(SettingsSection)
    participant P as Preload<br>(IPC Bridge)
    participant M as Main<br>(ipc-oauth.ts)
    participant O as OAuth Service<br>(oauth.ts)
    participant S as Callback Server<br>(:1455)
    participant A as auth.openai.com
    participant B as Browser

    U->>R: "Connect" 버튼 클릭
    R->>P: startOAuthServer()
    P->>M: invoke("oauth:start-server")
    M->>O: startOAuthCallbackServer()
    O->>S: http.createServer() on :1455
    S-->>M: listening
    M-->>R: { success: true }

    R->>P: createOAuthAuthorization()
    P->>M: invoke("oauth:create-authorization")
    M->>O: createOAuthAuthorization()
    Note over O: PKCE 생성<br>code_verifier (128자)<br>code_challenge = SHA256(verifier)<br>state = random(32)
    O->>O: pendingRequests.set(state, { codeVerifier, ... })
    O-->>M: { url, method: "code" }
    M-->>R: OAuthAuthorization

    R->>P: openOAuthUrl(url)
    P->>M: invoke("oauth:open-url")
    M->>B: shell.openExternal(url)
    B->>A: GET /oauth/authorize?<br>client_id=app_EMo...&<br>code_challenge=...&<br>response_type=code&<br>scope=openid+profile+email+offline_access

    Note over U,B: 사용자가 브라우저에서<br>OpenAI 로그인 완료

    A->>S: GET /auth/callback?code=xxx&state=yyy
    S->>S: HTML 응답 "Authentication Successful!"
    S->>O: handleOAuthCallback(code, state)

    O->>O: pendingRequests.get(state) → codeVerifier
    O->>A: POST /oauth/token<br>grant_type=authorization_code<br>code=xxx&code_verifier=...
    A-->>O: { access_token, refresh_token, id_token, expires_in }

    Note over O: JWT 파싱<br>id_token → chatgpt_account_id 추출

    O-->>S: OAuthCallbackResult { type: "success", access, refresh, expires, accountId }
    S->>R: IPC event "oauth:callback-result"

    R->>R: onOAuthCallbackResult(result)
    R->>P: setSettings({ openaiCredential: { type: "oauth", ... } })
    P->>M: invoke("settings:set")
    M->>M: electron-store 저장

    Note over R: UI 업데이트<br>"OAuth 연결됨" 표시
```

### 2. 채팅 메시지 전송 Flow (OAuth)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Renderer<br>(ChatWindow)
    participant P as Preload
    participant M as Main<br>(ipc.ts)
    participant C as Chat Service<br>(chat.ts)
    participant O as OAuth Service<br>(oauth.ts)
    participant SDK as @ai-sdk/openai<br>(createOpenAI)
    participant CDX as chatgpt.com<br>/backend-api/codex

    U->>R: 메시지 입력 + 전송
    R->>P: sendChatMessage(roomId, content, history)
    P->>M: invoke("chat:send")
    M->>C: streamChatMessage(roomId, content, history, config)

    C->>C: getOpenAiCredential()
    Note over C: settings에서 credential 조회<br>OAuth 우선, 없으면 API Key

    alt OAuth 토큰 만료
        C->>O: isOAuthCredentialExpired(credential)
        O-->>C: true (5분 이내 만료)
        C->>O: refreshAccessToken(refresh_token)
        O->>O: POST auth.openai.com/oauth/token<br>grant_type=refresh_token
        O-->>C: 갱신된 OAuthCredential
        C->>C: setSettings({ openaiCredential: refreshed })
    end

    C->>SDK: createOpenAI({<br>  apiKey: "prowl-oauth-dummy-key",<br>  fetch: customFetchWrapper<br>})
    Note over SDK: dummy API key 전달<br>실제 인증은 custom fetch에서 처리

    C->>SDK: openai.responses(modelId)
    Note over C: .responses() = Responses API 포맷<br>.chat() = Chat Completions 포맷

    C->>SDK: streamText({<br>  model,<br>  providerOptions: {<br>    openai: {<br>      instructions: systemPrompt,<br>      store: false<br>    }<br>  },<br>  messages,<br>  tools: { ...chatTools }<br>})

    SDK->>SDK: POST api.openai.com/v1/responses<br>(SDK 기본 URL)

    Note over SDK,CDX: Custom Fetch 인터셉트

    SDK->>CDX: Custom fetch 실행:<br>1. Authorization 헤더 제거 (dummy key)<br>2. Bearer {access_token} 설정<br>3. ChatGPT-Account-Id 설정<br>4. URL rewrite →<br>chatgpt.com/backend-api/codex/responses

    CDX-->>SDK: SSE stream (text chunks)

    loop 스트리밍 청크 수신
        SDK-->>C: textStream chunk
        C->>C: buffer += chunk
    end

    C->>C: ChatMessage 생성
    C->>R: IPC "chat:stream-message" (roomId, msg)
    C->>R: IPC "chat:stream-done" (roomId)
    C->>C: persistAfterStream() → saveChatMessages()
```

### 3. 채팅 메시지 전송 Flow (API Key)

```mermaid
sequenceDiagram
    participant C as Chat Service
    participant SDK as @ai-sdk/openai
    participant API as api.openai.com<br>/v1/chat/completions

    C->>SDK: createOpenAI({ apiKey: "sk-proj-..." })
    C->>SDK: openai.chat(modelId)
    C->>SDK: streamText({<br>  model,<br>  system: systemPrompt,<br>  messages,<br>  tools: {<br>    ...chatTools,<br>    web_search: openai.tools.webSearch()<br>  }<br>})

    SDK->>API: POST /v1/chat/completions<br>Authorization: Bearer sk-proj-...<br>{ model, messages, tools, stream: true }
    API-->>SDK: SSE stream
    SDK-->>C: textStream chunks
```

### 4. Custom Fetch Wrapper 상세

```mermaid
sequenceDiagram
    participant SDK as AI SDK
    participant FW as Custom Fetch<br>Wrapper
    participant CDX as chatgpt.com<br>/backend-api/codex

    SDK->>FW: fetch("https://api.openai.com/v1/responses", {<br>  headers: { Authorization: "Bearer prowl-oauth-dummy-key" },<br>  body: { model, input, instructions, store, tools }<br>})

    FW->>FW: 1. headers.delete("Authorization")<br>   headers.delete("authorization")
    FW->>FW: 2. headers.set("Authorization",<br>   "Bearer eyJhbGci...{access_token}")
    FW->>FW: 3. headers.set("ChatGPT-Account-Id",<br>   "f878ddf7-...")
    FW->>FW: 4. URL 판정:<br>   pathname includes "/v1/responses"?<br>   → rewrite to CODEX_ENDPOINT

    FW->>CDX: fetch("https://chatgpt.com/backend-api/codex/responses", {<br>  headers: { Authorization: "Bearer {real_token}",<br>             ChatGPT-Account-Id: "..." },<br>  body: 원본 유지<br>})

    CDX-->>FW: Response (SSE stream)
    FW-->>SDK: Response 전달
```

### 5. 토큰 갱신 Flow

```mermaid
sequenceDiagram
    participant C as Chat Service
    participant O as OAuth Service
    participant A as auth.openai.com
    participant S as Settings<br>(electron-store)

    C->>C: getOpenAiCredential()
    C->>S: getSettings().openaiCredential
    S-->>C: OAuthCredential { expires: 1772211000 }

    C->>O: isOAuthCredentialExpired(credential)
    Note over O: expires < (Date.now()/1000 - 300)<br>5분 버퍼 적용
    O-->>C: true

    C->>O: refreshAccessToken(credential.refresh)
    O->>A: POST /oauth/token<br>grant_type=refresh_token<br>refresh_token=...&client_id=app_EMo...
    A-->>O: { access_token, refresh_token?, expires_in }

    O-->>C: OAuthCredential {<br>  type: "oauth",<br>  access: "새 토큰",<br>  refresh: "기존 또는 새 refresh",<br>  expires: now + expires_in<br>}

    C->>S: setSettings({ openaiCredential: refreshed })
    Note over C: 갱신된 credential로 API 호출 계속
```

## OAuth 설정값

| 항목 | 값 |
|------|-----|
| Client ID | `app_EMoamEEZ73f0CkXaXp7hrann` |
| Authorization Endpoint | `https://auth.openai.com/oauth/authorize` |
| Token Endpoint | `https://auth.openai.com/oauth/token` |
| Redirect URI | `http://localhost:1455/auth/callback` |
| Scope | `openid profile email offline_access` |
| PKCE Method | S256 |
| Callback Port | 1455 |
| Codex API Endpoint | `https://chatgpt.com/backend-api/codex/responses` |

## IPC 채널

### Invoke (renderer → main, 응답 있음)

| 채널 | params | return |
|------|--------|--------|
| `oauth:start-server` | `[]` | `IpcResult` |
| `oauth:create-authorization` | `[]` | `OAuthAuthorization` |
| `oauth:open-url` | `[url: string]` | `IpcResult` |
| `oauth:callback` | `[{ code, state }]` | `OAuthCallbackResult` |
| `oauth:refresh-token` | `[refreshToken]` | `{ success, credential?, error? }` |
| `oauth:is-expired` | `[credential]` | `{ valid, expired }` |
| `oauth:validate-credential` | `[credential]` | `{ isValid, type }` |

### Event (main → renderer, 단방향)

| 채널 | params |
|------|--------|
| `oauth:callback-result` | `[OAuthCallbackResult]` |

## Codex 허용 모델 (visibility=list + api=true)

| 모델 | context_window | 비고 |
|------|---------------|------|
| gpt-5.3-codex | 272,000 | 기본 모델 |
| gpt-5.2-codex | 272,000 | |
| gpt-5.2 | 272,000 | |
| gpt-5.1-codex-max | 272,000 | |
| gpt-5.1-codex-mini | 272,000 | |

## 해결한 에러 이력

| # | 에러 | 원인 | 수정 |
|---|------|------|------|
| 1 | 401 Missing scopes: model.request | OAuth 토큰을 api.openai.com에 직접 전송 | dummy key + custom fetch + URL rewrite |
| 2 | 400 Instructions are required (1차) | `.chat()` → Chat Completions 포맷 | `.responses()` 메서드 사용 |
| 3 | 400 gpt-5-mini not supported | Codex 미지원 모델 | 모델 목록 분리 |
| 4 | 400 Instructions are required (2차) | `system` 파라미터가 `instructions`로 매핑 안 됨 | `providerOptions.openai.instructions` 사용 |
| 5 | 400 Store must be set to false | Codex는 store=false 필수 | `providerOptions.openai.store: false` |
