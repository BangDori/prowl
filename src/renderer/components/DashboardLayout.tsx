import prowlProfile from "@assets/prowl-profile.png";
import { Bot, Calendar, Cog, History, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import CalendarSection from "./sections/CalendarSection";
import ChangelogSection from "./sections/ChangelogSection";
import ClaudeConfigSection from "./sections/ClaudeConfigSection";
import JobsSection from "./sections/JobsSection";
import SettingsSection from "./sections/SettingsSection";

/** 네비게이션 아이템 타입 */
type NavItem = "jobs" | "calendar" | "changelog" | "settings" | "claude-config";

/** 네비게이션 아이템별 레이블 */
const NAV_LABELS: Record<NavItem, string> = {
  jobs: "Background Monitor",
  calendar: "Calendar",
  changelog: "Version History",
  settings: "Settings",
  "claude-config": "Claude Config",
};

/** 사이드바 아이템 Props */
interface SidebarItemProps {
  /** 아이콘 React 노드 */
  icon: React.ReactNode;
  /** 표시할 레이블 */
  label: string;
  /** 활성화 상태 */
  active: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
}

/**
 * 사이드바 네비게이션 아이템 컴포넌트
 */
function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
        ${
          active ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
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
  const [activeNav, setActiveNav] = useState<NavItem>("jobs");

  return (
    <div className="flex h-screen bg-prowl-bg text-gray-100">
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
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Background Monitor"
            active={activeNav === "jobs"}
            onClick={() => setActiveNav("jobs")}
          />
          <SidebarItem
            icon={<Calendar className="w-4 h-4" />}
            label="Calendar"
            active={activeNav === "calendar"}
            onClick={() => setActiveNav("calendar")}
          />
          <SidebarItem
            icon={<Bot className="w-4 h-4" />}
            label="Claude Config"
            active={activeNav === "claude-config"}
            onClick={() => setActiveNav("claude-config")}
          />
          <SidebarItem
            icon={<History className="w-4 h-4" />}
            label="Version History"
            active={activeNav === "changelog"}
            onClick={() => setActiveNav("changelog")}
          />
          <SidebarItem
            icon={<Cog className="w-4 h-4" />}
            label="Settings"
            active={activeNav === "settings"}
            onClick={() => setActiveNav("settings")}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header with drag region */}
        <header className="h-10 border-b border-prowl-border flex items-center px-4 -webkit-app-region-drag">
          <h1 className="text-sm font-medium">{NAV_LABELS[activeNav]}</h1>
        </header>

        {/* Content - 탭 전환 시 상태 유지를 위해 CSS로 보이기/숨기기 */}
        <div className="flex-1 overflow-hidden relative">
          <div className={`h-full ${activeNav === "jobs" ? "" : "hidden"}`}>
            <JobsSection />
          </div>
          <div className={`h-full ${activeNav === "calendar" ? "" : "hidden"}`}>
            <CalendarSection />
          </div>
          <div className={`h-full ${activeNav === "changelog" ? "" : "hidden"}`}>
            <ChangelogSection />
          </div>
          <div className={`h-full ${activeNav === "settings" ? "" : "hidden"}`}>
            <SettingsSection />
          </div>
          <div className={`h-full ${activeNav === "claude-config" ? "" : "hidden"}`}>
            <ClaudeConfigSection />
          </div>
        </div>
      </main>
    </div>
  );
}
