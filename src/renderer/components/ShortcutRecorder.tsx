/** 키보드 단축키 캡처 입력 컴포넌트 */
import X from "lucide-react/dist/esm/icons/x";
import { useCallback, useEffect, useState } from "react";

interface ShortcutRecorderProps {
  value: string;
  onChange: (accelerator: string) => void;
}

/** KeyboardEvent → Electron accelerator 문자열 변환 */
function toAccelerator(e: KeyboardEvent): string | null {
  const key = e.key;
  if (["Control", "Shift", "Alt", "Meta"].includes(key)) return null;

  const parts: string[] = [];
  if (e.metaKey) parts.push("Command");
  if (e.ctrlKey) parts.push("Control");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  if (parts.length === 0) return null;

  const mapped = key.length === 1 ? key.toUpperCase() : key === " " ? "Space" : key;
  parts.push(mapped);
  return parts.join("+");
}

/** accelerator 문자열 → 표시용 기호 변환 */
function formatAccelerator(acc: string): string {
  if (!acc) return "";
  return acc
    .replace(/CommandOrControl/g, "⌘")
    .replace(/Command/g, "⌘")
    .replace(/Control/g, "⌃")
    .replace(/Shift/g, "⇧")
    .replace(/Alt/g, "⌥")
    .replace(/\+/g, "");
}

/**
 * 키 조합을 캡처하여 Electron accelerator 문자열로 변환하는 입력 컴포넌트
 *
 * 클릭 시 recording 모드 진입 → keydown 캡처 → accelerator 문자열 생성
 * X 버튼으로 단축키 제거, ESC로 녹음 취소
 */
export default function ShortcutRecorder({ value, onChange }: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecording(false);
        return;
      }

      const acc = toAccelerator(e);
      if (acc) {
        onChange(acc);
        setRecording(false);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (!recording) return;
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recording, handleKeyDown]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setRecording(true)}
        className={`px-2.5 py-1 text-xs rounded-md border transition-colors min-w-[100px] text-center ${
          recording
            ? "border-accent bg-accent/10 text-accent animate-pulse"
            : value
              ? "border-prowl-border bg-app-hover-bg text-app-text-primary hover:bg-app-active-bg"
              : "border-prowl-border bg-app-hover-bg text-app-text-faint hover:bg-app-active-bg"
        }`}
      >
        {recording ? "Press keys..." : value ? formatAccelerator(value) : "Not set"}
      </button>
      {value && !recording && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="p-0.5 rounded text-app-text-faint hover:text-app-text-muted transition-colors"
          title="Remove shortcut"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
