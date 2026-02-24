/** ~/.prowl/ 파일 타입별 syntax highlighting 뷰어 */
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("xml", markup);
SyntaxHighlighter.registerLanguage("yaml", yaml);

const EXT_LANG: Record<string, string> = {
  py: "python",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  plist: "xml",
  xml: "xml",
  md: "markdown",
  markdown: "markdown",
  yaml: "yaml",
  yml: "yaml",
};

/** 파일 경로에서 Prism 언어 식별자 반환 (매핑 없으면 null) */
function getLang(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext ? (EXT_LANG[ext] ?? null) : null;
}

/** JSON 파싱 및 pretty-print 시도 */
function tryParseJson(content: string): { valid: boolean; formatted?: string; error?: string } {
  try {
    const parsed = JSON.parse(content);
    return { valid: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

const HIGHLIGHTER_STYLE: React.CSSProperties = {
  background: "transparent",
  padding: "1rem",
  margin: 0,
  fontSize: "0.75rem",
  lineHeight: "1.625",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowX: "auto",
};

interface FileContentViewProps {
  filePath: string;
  content: string;
}

/** 파일 타입에 따른 내용 렌더러 */
export default function FileContentView({ filePath, content }: FileContentViewProps) {
  if (!content) {
    return (
      <pre className="w-full h-full overflow-auto p-4 font-mono text-xs leading-relaxed">
        <span className="text-app-text-ghost italic">파일이 비어 있습니다</span>
      </pre>
    );
  }

  const lang = getLang(filePath);

  // JSON: pretty-print 후 하이라이팅, 파싱 실패 시 에러 배너
  if (lang === "json") {
    const result = tryParseJson(content);
    if (!result.valid) {
      return (
        <div className="h-full flex flex-col">
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 shrink-0 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400 truncate">유효하지 않은 JSON: {result.error}</p>
          </div>
          <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-app-text-secondary leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </pre>
        </div>
      );
    }
    return (
      <div className="w-full h-full overflow-auto">
        <SyntaxHighlighter
          language="json"
          style={oneDark}
          customStyle={HIGHLIGHTER_STYLE}
          wrapLongLines
        >
          {result.formatted ?? content}
        </SyntaxHighlighter>
      </div>
    );
  }

  // 지원 언어: syntax highlighting 적용
  if (lang) {
    return (
      <div className="w-full h-full overflow-auto">
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={HIGHLIGHTER_STYLE}
          wrapLongLines
        >
          {content}
        </SyntaxHighlighter>
      </div>
    );
  }

  // 지원하지 않는 파일: plain text
  return (
    <pre className="w-full h-full overflow-auto p-4 font-mono text-xs text-app-text-secondary leading-relaxed whitespace-pre-wrap break-words">
      {content}
    </pre>
  );
}
