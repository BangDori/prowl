/** 범용 확인 다이얼로그 모달 */
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  /** 다이얼로그 제목 */
  title: string;
  /** 본문 메시지 */
  message: string;
  /** 확인 버튼 레이블 */
  confirmLabel?: string;
  /** 취소 콜백 */
  onCancel: () => void;
  /** 확인 콜백 */
  onConfirm: () => void;
  /** 확인 버튼 비활성화 (pending 상태) */
  loading?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "삭제",
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  // Esc 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    /* 오버레이 */
    // biome-ignore lint/a11y/useKeyWithClickEvents: 오버레이 클릭은 보조 닫기 수단
    // biome-ignore lint/a11y/noStaticElementInteractions: 오버레이 클릭은 보조 닫기 수단
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* 다이얼로그 카드 */}
      <div className="bg-prowl-surface border border-prowl-border rounded-xl shadow-2xl w-72 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-red-500/15">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-app-text-primary">{title}</p>
            <p className="text-xs text-app-text-secondary mt-1 break-words">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg bg-app-active-bg text-app-text-secondary hover:bg-prowl-border transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? "삭제 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
