import { DEFAULT_FOCUS_MODE, type FocusMode } from "@shared/types";
import { useCallback, useEffect, useState } from "react";
import FocusModePanel from "../FocusModePanel";

/**
 * Night Watch 섹션 컴포넌트
 *
 * 집중 모드(야간 감시) 설정을 관리합니다.
 * - 활성화/비활성화 토글
 * - 시작/종료 시간 설정
 */
export default function NightWatchSection() {
  const [focusMode, setFocusMode] = useState<FocusMode>(DEFAULT_FOCUS_MODE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.getFocusMode().then((focus) => {
      setFocusMode(focus);
      setLoading(false);
    });
  }, []);

  const saveFocusMode = useCallback(async (updated: FocusMode) => {
    setFocusMode(updated);
    await window.electronAPI.setFocusMode(updated);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} />
      </div>
    </div>
  );
}
