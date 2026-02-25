/** 채팅 대화 헤더 — 뒤로가기 + 제목 + 전체화면 + 닫기 */
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import X from "lucide-react/dist/esm/icons/x";

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
  return (
    <div className="chat-conv-header px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-[12px] text-white/50 truncate max-w-[60%]">{title || "새 대화"}</span>
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
