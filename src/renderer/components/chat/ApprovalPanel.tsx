/** 도구 실행 승인 UI — 상세 정보 카드 + 실행/취소 버튼 */
import type { ApprovalDetails, ToolApprovalMeta } from "@shared/types";
import Check from "lucide-react/dist/esm/icons/check";
import Play from "lucide-react/dist/esm/icons/play";
import X from "lucide-react/dist/esm/icons/x";

function DetailsCard({ details }: { details: ApprovalDetails }) {
  if (details.type === "add") {
    return (
      <div className="mb-2 rounded-lg border border-green-500/20 bg-green-500/5 p-2.5 text-[12px]">
        <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-green-400/60 uppercase">
          추가
        </div>
        <div className="space-y-0.5">
          {details.fields.map((f) => (
            <div key={f.label} className="flex gap-3">
              <span className="min-w-[40px] text-white/30">{f.label}</span>
              <span className="text-white/80">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (details.type === "delete") {
    return (
      <div className="mb-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-[12px]">
        <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-red-400/60 uppercase">
          삭제
        </div>
        <div className="space-y-0.5">
          {details.fields.map((f) => (
            <div key={f.label} className="flex gap-3">
              <span className="min-w-[40px] text-white/30">{f.label}</span>
              <span className="text-white/80">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // update
  const hasContext = details.context && details.context.length > 0;
  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-[12px]">
      <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-white/30 uppercase">
        수정
      </div>
      {hasContext && (
        <div className="mb-2 space-y-0.5">
          {(details.context ?? []).map((f) => (
            <div key={f.label} className="flex gap-3">
              <span className="min-w-[40px] text-white/30">{f.label}</span>
              <span className="text-white/40">{f.value}</span>
            </div>
          ))}
          <div className="mt-2 h-px bg-white/10" />
        </div>
      )}
      <div className="space-y-1.5">
        {details.changes.map((c) => (
          <div key={c.label}>
            <div className="mb-0.5 text-[10px] text-white/25">{c.label}</div>
            <div className="flex items-center gap-1.5">
              <span className="line-through text-white/30">{c.before}</span>
              <span className="text-white/25">→</span>
              <span className="text-white/80">{c.after}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ApprovalPanelProps {
  approval: ToolApprovalMeta;
  state: "pending" | "approved" | "rejected";
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

export function ApprovalPanel({ approval, state, onApprove, onReject }: ApprovalPanelProps) {
  if (state === "approved") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
        <Check className="h-3 w-3 text-green-400" />
        <span>실행됨</span>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
        <X className="h-3 w-3" />
        <span>취소됨</span>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {approval.details && <DetailsCard details={approval.details} />}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[12px] font-medium text-black transition-colors hover:bg-accent-hover"
        >
          <Play className="h-3 w-3" />
          실행
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] text-white/70 transition-colors hover:bg-white/15"
        >
          <X className="h-3 w-3" />
          취소
        </button>
      </div>
    </div>
  );
}
