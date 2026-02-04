import prowlProfile from "@assets/prowl-profile.png";
import { Cog, History, LayoutDashboard, Moon } from "lucide-react";
import { useState } from "react";
import ChangelogSection from "./sections/ChangelogSection";
import JobsSection from "./sections/JobsSection";
import NightWatchSection from "./sections/NightWatchSection";
import SettingsSection from "./sections/SettingsSection";

/** 네비게이션 아이템 타입 */
type NavItem = "jobs" | "quiet-hours" | "changelog" | "settings";

/** 네비게이션 아이템별 레이블 */
const NAV_LABELS: Record<NavItem, string> = {
  jobs: "Background Monitor",
  "quiet-hours": "Night Watch",
  changelog: "Version History",
  settings: "Settings",
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
 * - NightWatchSection: 집중 모드 설정
 * - ChangelogSection: 버전 히스토리
 * - SettingsSection: 앱 설정
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
            icon={<Moon className="w-4 h-4" />}
            label="Night Watch"
            active={activeNav === "quiet-hours"}
            onClick={() => setActiveNav("quiet-hours")}
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeNav === "jobs" && <JobsSection />}
          {activeNav === "quiet-hours" && <NightWatchSection />}
          {activeNav === "changelog" && <ChangelogSection />}
          {activeNav === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}
