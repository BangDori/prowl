/** 작업 성공/실패 상태 배지 */
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";

/**
 * StatusBadge 컴포넌트의 Props
 */
interface StatusBadgeProps {
  /** 성공 여부 (true: 성공, false: 실패) */
  isSuccess: boolean;
}

/**
 * 작업 실행 결과 상태를 아이콘으로 표시하는 배지 컴포넌트
 *
 * @description
 * 성공 시 초록색 체크 아이콘, 실패 시 빨간색 X 아이콘을 표시합니다.
 * 마우스 호버 시 툴팁으로 상태를 안내합니다.
 *
 * @param props - {@link StatusBadgeProps}
 *
 * @example
 * ```tsx
 * // 성공 상태
 * <StatusBadge isSuccess={true} />
 *
 * // 실패 상태
 * <StatusBadge isSuccess={false} />
 * ```
 */
export default function StatusBadge({ isSuccess }: StatusBadgeProps) {
  if (isSuccess) {
    return (
      <span className="status-isSuccess" title="성공">
        <CheckCircle className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span className="status-error" title="실패">
      <XCircle className="w-3.5 h-3.5" />
    </span>
  );
}
