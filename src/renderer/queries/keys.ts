/** TanStack Query 캐시 키 정의 */
export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    list: () => [...queryKeys.jobs.all, "list"] as const,
    customizations: () => [...queryKeys.jobs.all, "customizations"] as const,
    logs: (label: string) => [...queryKeys.jobs.all, "logs", label] as const,
    running: () => [...queryKeys.jobs.all, "running"] as const,
  },
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
};
