# Release Command

package.json의 version을 기준으로 릴리스를 생성합니다.

## 수행 작업

1. package.json에서 현재 버전 확인 후 **사용자에게 확인 요청**
2. 사용자 승인 후 `pnpm package` 실행하여 DMG 패키징
3. `v{version}` 태그 생성 및 push
4. GitHub Release 생성 (DMG 첨부, 릴리스 노트 자동 생성)

## 실행 흐름

### Step 1: 버전 확인

package.json에서 version 필드를 읽고 사용자에게 물어보세요:
"현재 버전은 {version}입니다. 이 버전으로 릴리스를 진행할까요?"

### Step 2: 사용자 승인 후 실행

```bash
# 1. 패키징
pnpm package

# 2. 태그 생성 및 push
git tag v{version}
git push origin v{version}

# 3. GitHub Release 생성
GITHUB_TOKEN= gh release create v{version} \
  --title "Prowl v{version}" \
  --generate-notes \
  release/Prowl-{version}-arm64.dmg
```

## 주의사항

- 동일한 버전의 태그가 이미 존재하면 실패합니다
- 버전 변경이 필요하면 먼저 package.json의 version을 수정하세요
