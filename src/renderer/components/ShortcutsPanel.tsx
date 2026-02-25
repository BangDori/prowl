/** 글로벌 단축키 설정 패널 */
import type { ShortcutConfig } from "@shared/types";
import Command from "lucide-react/dist/esm/icons/command";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import { useMemo } from "react";
import ShortcutRecorder from "./ShortcutRecorder";

interface ShortcutsPanelProps {
  shortcuts: ShortcutConfig;
  onUpdate: (updated: ShortcutConfig) => void;
}

interface ShortcutRow {
  key: keyof ShortcutConfig;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROWS: ShortcutRow[] = [
  {
    key: "toggleChat",
    label: "Prowl Chat",
    description: "Toggle the chat window",
    icon: <Command className="w-4 h-4 text-gray-400" />,
  },
  {
    key: "toggleTaskManager",
    label: "Task Manager",
    description: "Toggle the task manager",
    icon: <LayoutGrid className="w-4 h-4 text-gray-400" />,
  },
  {
    key: "openDashboard",
    label: "Dashboard",
    description: "Open the dashboard",
    icon: <Monitor className="w-4 h-4 text-gray-400" />,
  },
];

/**
 * 글로벌 단축키 설정 패널
 *
 * ShortcutConfig의 각 항목에 대해 ShortcutRecorder를 렌더링하고,
 * 중복 단축키 검증을 수행합니다.
 */
export default function ShortcutsPanel({ shortcuts, onUpdate }: ShortcutsPanelProps) {
  const duplicates = useMemo(() => {
    const values = Object.entries(shortcuts).filter(([, v]) => v);
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const [, v] of values) {
      if (seen.has(v)) dups.add(v);
      seen.add(v);
    }
    return dups;
  }, [shortcuts]);

  return (
    <div className="p-3 space-y-2.5">
      {ROWS.map((row) => {
        const value = shortcuts[row.key];
        const isDup = value && duplicates.has(value);

        return (
          <div key={row.key}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {row.icon}
                <div>
                  <p className="text-sm">{row.label}</p>
                  <p className="text-[10px] text-gray-500">{row.description}</p>
                </div>
              </div>
              <ShortcutRecorder
                value={value}
                onChange={(acc) => onUpdate({ ...shortcuts, [row.key]: acc })}
              />
            </div>
            {isDup && (
              <p className="text-[10px] text-red-400 ml-7 mt-1">
                This shortcut is used by another action
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
