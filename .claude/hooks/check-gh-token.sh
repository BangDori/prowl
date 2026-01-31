#!/bin/bash
# PreToolCall hook: gh pr/release 명령어가 GITHUB_TOKEN= 없이 실행되면 차단

if [ "$CLAUDE_TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND="$CLAUDE_TOOL_INPUT_command"

# gh pr create 또는 gh release create 명령어인지 확인
if echo "$COMMAND" | grep -qE 'gh\s+(pr|release)\s+create'; then
  # GITHUB_TOKEN= 접두사가 있는지 확인
  if ! echo "$COMMAND" | grep -qE 'GITHUB_TOKEN=\s*gh'; then
    echo "BLOCKED: gh pr/release create는 반드시 'GITHUB_TOKEN= gh ...' 형식으로 실행해야 합니다. (다른 계정 PR 방지)"
    exit 2
  fi
fi

exit 0
