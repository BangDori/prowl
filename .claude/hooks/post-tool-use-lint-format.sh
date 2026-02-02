#!/bin/bash

# Stop hook: 플래그 파일이 있으면 lint 실행 후 삭제
SESSION_ID=$(jq -r '.session_id // empty')

if [ -z "$SESSION_ID" ]; then
  exit 0
fi

FLAG_FILE="$CLAUDE_PROJECT_DIR/.claude/.lint-needed-${SESSION_ID}"

if [ ! -f "$FLAG_FILE" ]; then
  exit 0
fi

rm -f "$FLAG_FILE"

cd "$CLAUDE_PROJECT_DIR" || exit 0
bun run lint 2>&1
