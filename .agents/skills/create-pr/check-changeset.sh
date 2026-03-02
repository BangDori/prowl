#!/bin/bash
# changeset 필요 여부 판단: develop 대비 src/ 변경이 있으면 필요

changed=$(git diff origin/develop..HEAD --name-only 2>/dev/null | grep '^src/')

if [ -n "$changed" ]; then
  echo "CHANGESET_NEEDED"
  echo "변경된 src/ 파일:"
  echo "$changed"
else
  echo "CHANGESET_SKIP"
  echo "src/ 변경 없음 — changeset 불필요"
fi
