import * as fs from 'fs';

interface ScriptMetadata {
  icon: string | null;
  description: string | null;
}

/**
 * 스크립트 파일에서 메타데이터 추출
 * 형식:
 *   # @icon 🔔
 *   # @description 설명 텍스트
 */
export function extractScriptMetadata(scriptPath: string): ScriptMetadata {
  const result: ScriptMetadata = {
    icon: null,
    description: null,
  };

  try {
    if (!fs.existsSync(scriptPath)) {
      return result;
    }

    const content = fs.readFileSync(scriptPath, 'utf-8');
    const lines = content.split('\n').slice(0, 10); // 상위 10줄만 확인

    for (const line of lines) {
      // @icon 추출
      const iconMatch = line.match(/^#\s*@icon\s+(.+)$/);
      if (iconMatch) {
        result.icon = iconMatch[1].trim();
      }

      // @description 추출
      const descMatch = line.match(/^#\s*@description\s+(.+)$/);
      if (descMatch) {
        result.description = descMatch[1].trim();
      }
    }
  } catch (error) {
    console.error(`Failed to read script metadata: ${scriptPath}`, error);
  }

  return result;
}
