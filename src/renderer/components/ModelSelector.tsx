/** 채팅 프로바이더/모델 선택 드롭다운 */
import type { ChatConfig, ProviderStatus } from "@shared/types";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Key from "lucide-react/dist/esm/icons/key";
import { useCallback, useEffect, useRef, useState } from "react";

interface ModelSelectorProps {
  config: ChatConfig;
  providers: ProviderStatus[];
  onSelect: (config: ChatConfig) => void;
}

/** 현재 선택된 모델의 표시 라벨 반환 */
function getSelectedLabel(config: ChatConfig, providers: ProviderStatus[]): string {
  for (const p of providers) {
    const model = p.models.find((m) => m.id === config.model);
    if (model) return model.label;
  }
  return config.model;
}

export default function ModelSelector({ config, providers, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = useCallback(
    (provider: ProviderStatus, modelId: string) => {
      onSelect({ provider: provider.provider, model: modelId });
      setOpen(false);
    },
    [onSelect],
  );

  const label = getSelectedLabel(config, providers);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
      >
        <span className="max-w-[100px] truncate">{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl overflow-hidden border border-white/10 bg-[rgba(20,20,20,0.95)] backdrop-blur-xl shadow-xl z-50">
          {providers.map((p) => (
            <div key={p.provider}>
              <div className="px-3 py-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                {p.label}
                {!p.available && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-400/60">
                    <Key className="w-2.5 h-2.5" />키 필요
                  </span>
                )}
              </div>
              {p.models.map((model) => {
                const isSelected = config.model === model.id;
                const isDisabled = !p.available;
                return (
                  <button
                    key={model.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(p, model.id)}
                    className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${
                      isSelected
                        ? "bg-accent/15 text-accent"
                        : isDisabled
                          ? "text-white/20 cursor-not-allowed"
                          : "text-white/70 hover:bg-white/5 hover:text-white/90"
                    }`}
                  >
                    {model.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
