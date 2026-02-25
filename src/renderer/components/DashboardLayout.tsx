/** 대시보드 탭 레이아웃 및 네비게이션 */
import prowlProfile from "@assets/prowl-profile.png";
import Brain from "lucide-react/dist/esm/icons/brain";
import Cog from "lucide-react/dist/esm/icons/cog";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import History from "lucide-react/dist/esm/icons/history";
import ListTodo from "lucide-react/dist/esm/icons/list-todo";
import { useState } from "react";
import ErrorBoundary from "./ErrorBoundary";
import CalendarSection from "./sections/CalendarSection";
import ChangelogSection from "./sections/ChangelogSection";
import FilesSection from "./sections/FilesSection";
import MemorySection from "./sections/MemorySection";
import SettingsSection from "./sections/SettingsSection";
import UpdateBanner from "./UpdateBanner";

/** 네비게이션 아이템 타입 */
type NavItem = "calendar" | "memory" | "changelog" | "settings" | "files";

/** 사이드바 아이템 Props */
interface SidebarItemProps {
  /** 아이콘 React 노드 */
  icon: React.ReactNode;
  /** 표시할 레이블 */
  label: string;
  /** 활성화 상태 */
  isActive: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
}

/**
 * 사이드바 네비게이션 아이템 컴포넌트
 */
function SidebarItem({ icon, label, isActive, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
        ${
          isActive
            ? "bg-accent/20 text-accent"
            : "text-app-text-muted hover:text-app-text-primary hover:bg-app-hover-bg"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * 대시보드 레이아웃 컴포넌트
 *
 * 전체 앱의 레이아웃을 담당합니다.
 * - 사이드바: 로고 + 네비게이션
 * - 메인 영역: 헤더 + 콘텐츠
 *
 * 각 섹션은 별도 컴포넌트로 분리:
 * - JobsSection: 작업 목록
 * - ChangelogSection: 버전 히스토리
 * - SettingsSection: 앱 설정 (Night Watch 포함)
 */
export default function DashboardLayout() {
  const [isActiveNav, setActiveNav] = useState<NavItem>("calendar");

  return (
    <div className="flex h-screen bg-transparent text-app-text-primary">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-prowl-surface border-r border-prowl-border flex flex-col">
        {/* Drag region for window */}
        <div className="h-10 -webkit-app-region-drag" />

        {/* Logo */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <img src={prowlProfile} alt="Prowl" className="w-6 h-6 rounded-full" />
            <span className="font-semibold text-sm">Prowl</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          <SidebarItem
            icon={<ListTodo className="w-4 h-4" />}
            label="Task Manager"
            isActive={isActiveNav === "calendar"}
            onClick={() => setActiveNav("calendar")}
          />
          <SidebarItem
            icon={<Brain className="w-4 h-4" />}
            label="Memory"
            isActive={isActiveNav === "memory"}
            onClick={() => setActiveNav("memory")}
          />
          <SidebarItem
            icon={<FolderOpen className="w-4 h-4" />}
            label="Files"
            isActive={isActiveNav === "files"}
            onClick={() => setActiveNav("files")}
          />
          <SidebarItem
            icon={<History className="w-4 h-4" />}
            label="Version History"
            isActive={isActiveNav === "changelog"}
            onClick={() => setActiveNav("changelog")}
          />
          <SidebarItem
            icon={<Cog className="w-4 h-4" />}
            label="Settings"
            isActive={isActiveNav === "settings"}
            onClick={() => setActiveNav("settings")}
          />
        </nav>

        {/* Update indicator */}
        <UpdateBanner />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="h-full overflow-hidden relative">
          <div className={`h-full ${isActiveNav === "calendar" ? "" : "hidden"}`}>
            <ErrorBoundary section="Task Manager">
              <CalendarSection />
            </ErrorBoundary>
          </div>
          <div className={`h-full ${isActiveNav === "memory" ? "" : "hidden"}`}>
            <ErrorBoundary section="Memory">
              <MemorySection />
            </ErrorBoundary>
          </div>
          <div className={`h-full ${isActiveNav === "changelog" ? "" : "hidden"}`}>
            <ErrorBoundary section="Version History">
              <ChangelogSection />
            </ErrorBoundary>
          </div>
          <div className={`h-full ${isActiveNav === "settings" ? "" : "hidden"}`}>
            <ErrorBoundary section="Settings">
              <SettingsSection />
            </ErrorBoundary>
          </div>
          <div className={`h-full ${isActiveNav === "files" ? "" : "hidden"}`}>
            <ErrorBoundary section="Files">
              <FilesSection />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
