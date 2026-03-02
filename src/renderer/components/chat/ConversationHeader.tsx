/** 채팅 대화 헤더 — 뒤로가기 + 제목(타이핑 애니메이션) + 전체화면 + 닫기 */
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import X from "lucide-react/dist/esm/icons/x";
import { useEffect, useRef, useState } from "react";

const ERASE_MS = 40;
const TYPE_MS = 60;

/** 제목 변경 시 한 글자씩 지우고 새 제목을 타이핑하는 애니메이션 */
function useTypewriterTitle(title: string | undefined): string {
  const finalTitle = title ?? "새 대화";
  const [displayTitle, setDisplayTitle] = useState(finalTitle);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayRef = useRef(finalTitle);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 최초 마운트는 애니메이션 없이 바로 표시
    if (isFirstRender.current) {
      isFirstRender.current = false;
      displayRef.current = finalTitle;
      setDisplayTitle(finalTitle);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    let current = displayRef.current;

    function eraseStep() {
      if (current.length > 0) {
        current = current.slice(0, -1);
        displayRef.current = current;
        setDisplayTitle(current);
        timerRef.current = setTimeout(eraseStep, ERASE_MS);
      } else {
        typeStep(0);
      }
    }

    function typeStep(idx: number) {
      const partial = finalTitle.slice(0, idx);
      displayRef.current = partial;
      setDisplayTitle(partial);
      if (idx < finalTitle.length) {
        timerRef.current = setTimeout(() => typeStep(idx + 1), TYPE_MS);
      }
    }

    eraseStep();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [finalTitle]);

  return displayTitle;
}

export default function ConversationHeader({
  title,
  onBack,
  onClose,
  isExpanded,
  onToggleExpand,
}: {
  title?: string;
  onBack: () => void;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const displayTitle = useTypewriterTitle(title);

  return (
    <div className="chat-conv-header px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {/* 지우기 중 빈 문자열이 되어도 레이아웃이 무너지지 않도록 non-breaking space fallback */}
      <span className="text-[12px] text-white/50 truncate max-w-[60%]">
        {displayTitle || "\u00A0"}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleExpand}
          title={isExpanded ? "기본 크기로" : "전체화면"}
          className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
        >
          {isExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
