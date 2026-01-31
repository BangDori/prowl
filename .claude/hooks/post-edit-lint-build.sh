#!/bin/bash

# PostToolUse hook: Edit/Write 후 lint & build 검증
# stdin으로 받은 JSON에서 파일 경로 추출
FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# src/ 하위 파일만 검증
if [[ "$FILE_PATH" != *"/src/"* ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# lint (수정된 파일만)
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  npx biome check "$FILE_PATH" 2>&1
  LINT_EXIT=$?
  if [ $LINT_EXIT -ne 0 ]; then
    echo "Lint failed. Please fix lint errors."
    exit 1
  fi
fi

# build (타입 체크 - main과 renderer 모두)
bun run build:main --noEmit 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "Build failed. Please fix type errors."
  exit 1
fi