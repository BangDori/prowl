#!/bin/bash

# PostToolUse hook: 파일 변경 시 플래그만 생성 (실제 lint는 Stop 훅에서)
SESSION_ID=$(jq -r '.session_id // empty')

if [ -z "$SESSION_ID" ]; then
  exit 0
fi

touch "$CLAUDE_PROJECT_DIR/.claude/.lint-needed-${SESSION_ID}"
