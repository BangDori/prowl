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
  calendar: {
    all: ["calendar"] as const,
    events: () => [...queryKeys.calendar.all, "events"] as const,
    settings: () => [...queryKeys.calendar.all, "settings"] as const,
    localEvents: () => [...queryKeys.calendar.all, "localEvents"] as const,
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
