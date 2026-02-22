/** TanStack Query 캐시 키 정의 */
export const queryKeys = {
  settings: {
    all: ["settings"] as const,
    get: () => [...queryKeys.settings.all, "get"] as const,
  },
  focusMode: {
    all: ["focusMode"] as const,
    get: () => [...queryKeys.focusMode.all, "get"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    month: (year: number, month: number) => [...queryKeys.tasks.all, "month", year, month] as const,
    dates: () => [...queryKeys.tasks.all, "dates"] as const,
    dateRange: (start: string, end: string) =>
      [...queryKeys.tasks.all, "dateRange", start, end] as const,
    backlog: () => [...queryKeys.tasks.all, "backlog"] as const,
  },
  claude: {
    all: ["claude"] as const,
    config: () => [...queryKeys.claude.all, "config"] as const,
    file: (path: string) => [...queryKeys.claude.all, "file", path] as const,
  },
  app: {
    all: ["app"] as const,
    version: () => [...queryKeys.app.all, "version"] as const,
    update: () => [...queryKeys.app.all, "update"] as const,
  },
  memory: {
    all: ["memory"] as const,
    list: () => [...queryKeys.memory.all, "list"] as const,
  },
  chatRooms: {
    all: ["chatRooms"] as const,
    list: () => [...queryKeys.chatRooms.all, "list"] as const,
    detail: (id: string) => [...queryKeys.chatRooms.all, "detail", id] as const,
    unreadCounts: () => [...queryKeys.chatRooms.all, "unread"] as const,
  },
};
