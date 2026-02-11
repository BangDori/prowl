/** React 에러 바운더리 래퍼 */
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 에러 발생 시 표시할 섹션 이름 */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 섹션별 에러를 격리하는 Error Boundary
 *
 * 한 섹션에서 렌더링 에러가 발생해도 다른 섹션은 정상 동작한다.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.section ?? "Unknown"} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
          <p className="text-sm">{this.props.section ?? "섹션"}에서 오류가 발생했습니다.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs text-accent hover:underline"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
