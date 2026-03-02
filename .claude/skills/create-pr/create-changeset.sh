#!/bin/bash
# bun changeset의 TTY 없이도 changeset 파일을 직접 생성
# Usage: bash .claude/skills/create-pr/create-changeset.sh [patch|minor|major] ["설명"]

BUMP_TYPE="${1:-patch}"
DESCRIPTION="${2:-}"

# package name 읽기
PACKAGE_NAME=$(node -e "process.stdout.write(require('./package.json').name)" 2>/dev/null)
if [ -z "$PACKAGE_NAME" ]; then
  echo "ERROR: package.json에서 name을 읽을 수 없습니다"
  exit 1
fi

# 브랜치명으로 파일명 생성 (타입 prefix 제거, 특수문자 → 하이픈)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "changeset")
FILENAME=$(echo "$BRANCH" | sed 's|.*/||' | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')

# 설명 없으면 브랜치명 기반으로 생성
if [ -z "$DESCRIPTION" ]; then
  DESCRIPTION=$(echo "$FILENAME" | sed 's/-/ /g')
fi

mkdir -p .changeset

CHANGESET_FILE=".changeset/${FILENAME}.md"

cat > "$CHANGESET_FILE" << EOF
---
"${PACKAGE_NAME}": ${BUMP_TYPE}
---

${DESCRIPTION}
EOF

echo "Created ${CHANGESET_FILE}"
echo "  package: ${PACKAGE_NAME}"
echo "  bump: ${BUMP_TYPE}"
echo "  description: ${DESCRIPTION}"
