/** iOS 스타일 토글 스위치 컴포넌트 */
interface ToggleSwitchProps {
  /** 스위치 활성화 상태 */
  isEnabled: boolean;
  /** 로딩 중 여부 (비활성화 및 펄스 애니메이션 적용) */
  isLoading?: boolean;
  /** 상태 변경 핸들러 */
  onChange: () => void;
}

/**
 * iOS 스타일 토글 스위치 컴포넌트
 *
 * @description
 * 작업의 활성화/비활성화 상태를 전환하는 스위치입니다.
 * 로딩 상태에서는 비활성화되고 펄스 애니메이션이 적용됩니다.
 * 접근성을 위해 role="switch"와 aria-checked 속성을 포함합니다.
 *
 * @param props - {@link ToggleSwitchProps}
 *
 * @example
 * ```tsx
 * <ToggleSwitch
 *   isEnabled={job.isLoaded}
 *   isLoading={isToggling}
 *   onChange={() => toggleJob(job.id)}
 * />
 * ```
 */
export default function ToggleSwitch({ isEnabled, isLoading, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      disabled={isLoading}
      className={`toggle-switch ${isEnabled ? "toggle-switch-on" : "toggle-switch-off"} ${
        isLoading ? "opacity-50" : ""
      }`}
      role="switch"
      aria-checked={isEnabled}
    >
      <span
        className={`toggle-switch-knob ${
          isEnabled ? "toggle-switch-knob-on" : "toggle-switch-knob-off"
        } ${isLoading ? "animate-pulse" : ""}`}
      />
    </button>
  );
}
