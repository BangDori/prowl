import { Moon, X } from "lucide-react";
import { useEffect, useState } from "react";

const AUTO_DISMISS_MS = 10_000;

interface NightNudgeSplashProps {
  message: string;
  onDismiss: () => void;
}

export default function NightNudgeSplash({ message, onDismiss }: NightNudgeSplashProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        onDismiss();
      }
    }, 50);
    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-prowl-bg/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 btn-ghost p-1 rounded"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div className="text-4xl">
          <Moon size={40} className="text-accent" />
        </div>

        <p className="text-sm text-gray-300 leading-relaxed max-w-[280px]">{message}</p>

        {/* progress bar */}
        <div className="w-48 h-1 rounded-full bg-prowl-border overflow-hidden mt-2">
          <div
            className="h-full bg-accent rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
