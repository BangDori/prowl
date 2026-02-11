/** Claude 설정 조회 탭 섹션 */
import type {
  ClaudeAgent,
  ClaudeCommand,
  ClaudeConfig,
  ClaudeHook,
  ClaudeRule,
} from "@shared/types";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderOpen,
  RefreshCw,
  ScrollText,
  Webhook,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// 선택된 항목 타입
type SelectedItem =
  | { type: "agent"; item: ClaudeAgent }
  | { type: "command"; item: ClaudeCommand }
  | { type: "hook"; item: ClaudeHook }
  | { type: "rule"; item: ClaudeRule }
  | null;

interface TreeItemProps {
  icon: React.ReactNode;
  label: string;
  depth?: number;
  selected?: boolean;
  onClick: () => void;
}

function TreeItem({ icon, label, depth = 0, selected, onClick }: TreeItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-left text-[11px] rounded transition-colors ${
        selected ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
      }`}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

interface TreeFolderProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function TreeFolder({ icon, label, count, defaultOpen = true, children }: TreeFolderProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-left text-[11px] text-gray-300 hover:text-gray-100 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        )}
        {icon}
        <span className="flex-1">{label}</span>
        <span className="text-[10px] text-gray-600">{count}</span>
      </button>
      {open && <div className="ml-1">{children}</div>}
    </div>
  );
}

interface ContentPanelProps {
  selected: SelectedItem;
  content: string;
  loading: boolean;
  onOpenInFinder?: (filePath: string) => void;
}

function ContentPanel({ selected, content, loading, onOpenInFinder }: ContentPanelProps) {
  if (!selected) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">항목을 선택하세요</p>
        </div>
      </div>
    );
  }

  let title = "";
  let subtitle = "";
  let filePath: string | null = null;

  if (selected.type === "agent") {
    title = selected.item.meta.name;
    subtitle = `agents/${selected.item.category}/`;
    filePath = selected.item.filePath;
  } else if (selected.type === "command") {
    title = selected.item.title;
    subtitle = `commands/`;
    filePath = selected.item.filePath;
  } else if (selected.type === "hook") {
    title = selected.item.id;
    subtitle = "settings.json";
  } else if (selected.type === "rule") {
    title = selected.item.id;
    subtitle = `rules/`;
    filePath = selected.item.filePath;
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-prowl-border bg-prowl-surface/50">
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-medium truncate">{title}</h2>
          <p className="text-[10px] text-gray-500 font-mono">{subtitle}</p>
        </div>
        {filePath && onOpenInFinder && (
          <button
            type="button"
            onClick={() => onOpenInFinder(filePath)}
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-prowl-card transition-colors"
            title="Finder에서 열기"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-5/6" />
          </div>
        ) : (
          <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * Claude Config 섹션 컴포넌트 (2패널 레이아웃)
 */
export default function ClaudeConfigSection() {
  const [config, setConfig] = useState<ClaudeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [content, setContent] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const result = await window.electronAPI.getClaudeConfig();
      setConfig(result);
    } catch (err) {
      console.error("Failed to fetch claude config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSelectAgent = async (agent: ClaudeAgent) => {
    setSelected({ type: "agent", item: agent });
    setContentLoading(true);
    try {
      const result = await window.electronAPI.readConfigFile(agent.filePath);
      setContent(result);
    } catch {
      setContent("파일을 읽을 수 없습니다.");
    } finally {
      setContentLoading(false);
    }
  };

  const handleSelectCommand = async (command: ClaudeCommand) => {
    setSelected({ type: "command", item: command });
    setContentLoading(true);
    try {
      const result = await window.electronAPI.readConfigFile(command.filePath);
      setContent(result);
    } catch {
      setContent("파일을 읽을 수 없습니다.");
    } finally {
      setContentLoading(false);
    }
  };

  const handleSelectHook = (hook: ClaudeHook) => {
    setSelected({ type: "hook", item: hook });
    const hookContent = hook.hooks.map((h, i) => `[${i + 1}] ${h.type}\n${h.command}`).join("\n\n");
    setContent(hookContent || "훅이 비어있습니다.");
  };

  const handleSelectRule = async (rule: ClaudeRule) => {
    setSelected({ type: "rule", item: rule });
    setContentLoading(true);
    try {
      const result = await window.electronAPI.readConfigFile(rule.filePath);
      setContent(result);
    } catch {
      setContent("파일을 읽을 수 없습니다.");
    } finally {
      setContentLoading(false);
    }
  };

  const handleOpenInFinder = (filePath: string) => {
    window.electronAPI.showInFolder(filePath);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-sm font-medium mb-1">Claude 설정을 찾을 수 없습니다</p>
          <p className="text-xs text-gray-500">~/.claude/ 폴더가 존재하는지 확인하세요</p>
        </div>
      </div>
    );
  }

  // 에이전트를 카테고리별로 그룹화
  const groupedAgents = config.agents.reduce<Record<string, ClaudeAgent[]>>((acc, agent) => {
    if (!acc[agent.category]) acc[agent.category] = [];
    acc[agent.category].push(agent);
    return acc;
  }, {});

  const isSelected = (type: string, id: string) => {
    if (!selected) return false;
    if (selected.type === "agent" && type === "agent") return selected.item.id === id;
    if (selected.type === "command" && type === "command") return selected.item.id === id;
    if (selected.type === "hook" && type === "hook") return selected.item.id === id;
    if (selected.type === "rule" && type === "rule") return selected.item.id === id;
    return false;
  };

  return (
    <div className="h-full flex">
      {/* 좌측 트리 패널 */}
      <div className="w-48 flex-shrink-0 border-r border-prowl-border flex flex-col">
        {/* 트리 헤더 */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-prowl-border">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            Explorer
          </span>
          <button
            type="button"
            onClick={fetchConfig}
            className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* 트리 내용 */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* Agents */}
          <TreeFolder
            icon={<Bot className="w-3 h-3 text-green-400" />}
            label="agents"
            count={config.agents.length}
          >
            {Object.entries(groupedAgents).map(([category, agents]) => (
              <TreeFolder
                key={category}
                icon={<FolderOpen className="w-3 h-3 text-gray-500" />}
                label={category}
                count={agents.length}
              >
                {agents.map((agent) => (
                  <TreeItem
                    key={agent.id}
                    icon={<FileText className="w-3 h-3 text-gray-500" />}
                    label={agent.filename}
                    depth={2}
                    selected={isSelected("agent", agent.id)}
                    onClick={() => handleSelectAgent(agent)}
                  />
                ))}
              </TreeFolder>
            ))}
          </TreeFolder>

          {/* Commands */}
          <TreeFolder
            icon={<FileText className="w-3 h-3 text-accent" />}
            label="commands"
            count={config.commands.length}
          >
            {config.commands.map((command) => (
              <TreeItem
                key={command.id}
                icon={<FileText className="w-3 h-3 text-gray-500" />}
                label={command.filename}
                depth={1}
                selected={isSelected("command", command.id)}
                onClick={() => handleSelectCommand(command)}
              />
            ))}
          </TreeFolder>

          {/* Hooks */}
          <TreeFolder
            icon={<Webhook className="w-3 h-3 text-pink-400" />}
            label="hooks"
            count={config.hooks.length}
          >
            {config.hooks.map((hook) => (
              <TreeItem
                key={hook.id}
                icon={<Webhook className="w-3 h-3 text-gray-500" />}
                label={hook.id}
                depth={1}
                selected={isSelected("hook", hook.id)}
                onClick={() => handleSelectHook(hook)}
              />
            ))}
          </TreeFolder>

          {/* Rules */}
          <TreeFolder
            icon={<ScrollText className="w-3 h-3 text-cyan-400" />}
            label="rules"
            count={config.rules.length}
          >
            {config.rules.map((rule) => (
              <TreeItem
                key={rule.id}
                icon={<FileText className="w-3 h-3 text-gray-500" />}
                label={rule.filename}
                depth={1}
                selected={isSelected("rule", rule.id)}
                onClick={() => handleSelectRule(rule)}
              />
            ))}
          </TreeFolder>
        </div>
      </div>

      {/* 우측 콘텐츠 패널 */}
      <div className="flex-1 min-w-0">
        <ContentPanel
          selected={selected}
          content={content}
          loading={contentLoading}
          onOpenInFinder={handleOpenInFinder}
        />
      </div>
    </div>
  );
}
