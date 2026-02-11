/** 캘린더 이벤트 조회 및 로컬 일정 CRUD 훅 */
import type { CalendarEvent, EventReminder, LocalEvent } from "@shared/types";
import { FEED_COLORS, LOCAL_EVENT_COLOR, LOCAL_FEED_ID } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { queryKeys } from "../queries/keys";
import {
  generateId,
  getEventsForDay,
  isSameDay,
  parseTimeInput,
  toDateStr,
} from "../utils/calendar";

export function useCalendarData(displayDate: Date) {
  const queryClient = useQueryClient();
  const [timeError, setTimeError] = useState<string | null>(null);

  // 캘린더 설정 (피드 목록)
  const { data: calSettings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.calendar.settings(),
    queryFn: () => window.electronAPI.getCalendarSettings(),
  });

  const feeds = calSettings?.feeds ?? [];

  // 이벤트 (ICS + 로컬)
  const {
    data: events = [],
    error: eventsError,
    isFetching: refreshing,
    refetch: fetchEvents,
  } = useQuery({
    queryKey: queryKeys.calendar.events(),
    queryFn: () => window.electronAPI.getCalendarEvents(),
    enabled: !settingsLoading,
  });

  const loading = settingsLoading;
  const error = eventsError ? "캘린더를 불러올 수 없습니다." : null;

  // 피드 설정 mutation
  const settingsMutation = useMutation({
    mutationFn: (newFeeds: typeof feeds) =>
      window.electronAPI.setCalendarSettings({ feeds: newFeeds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.settings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
    },
  });

  // 피드 추가
  const addFeed = async (label: string, url: string, color: string) => {
    const trimmedUrl = url.trim();
    const trimmedLabel = label.trim() || `캘린더 ${feeds.length + 1}`;
    if (!trimmedUrl) return null;

    const newFeed = { id: generateId(), label: trimmedLabel, url: trimmedUrl, color };
    settingsMutation.mutate([...feeds, newFeed]);

    const nextColorIdx =
      (FEED_COLORS.indexOf(color as (typeof FEED_COLORS)[number]) + 1) % FEED_COLORS.length;
    return FEED_COLORS[nextColorIdx];
  };

  // 피드 삭제
  const removeFeed = async (feedId: string) => {
    settingsMutation.mutate(feeds.filter((f) => f.id !== feedId));
  };

  // 피드 키워드 필터 업데이트
  const updateFeedFilter = async (feedId: string, filterKeyword: string) => {
    settingsMutation.mutate(feeds.map((f) => (f.id === feedId ? { ...f, filterKeyword } : f)));
  };

  // 로컬 이벤트 추가 (낙관적)
  const addEventMutation = useMutation({
    mutationFn: (localEvent: LocalEvent) => window.electronAPI.addLocalEvent(localEvent),
    onMutate: async (localEvent) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.events() });
      const previous = queryClient.getQueryData<CalendarEvent[]>(queryKeys.calendar.events());
      const optimistic: CalendarEvent = {
        uid: localEvent.id,
        summary: localEvent.summary,
        description: localEvent.description,
        dtstart: localEvent.dtstart,
        dtend: localEvent.dtend,
        allDay: localEvent.allDay,
        feedId: LOCAL_FEED_ID,
      };
      queryClient.setQueryData<CalendarEvent[]>(queryKeys.calendar.events(), (old = []) =>
        [...old, optimistic].sort(
          (a, b) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime(),
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKeys.calendar.events(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
    },
  });

  // 로컬 이벤트 삭제 (낙관적)
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => window.electronAPI.deleteLocalEvent(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.events() });
      const previous = queryClient.getQueryData<CalendarEvent[]>(queryKeys.calendar.events());
      queryClient.setQueryData<CalendarEvent[]>(queryKeys.calendar.events(), (old = []) =>
        old.filter((e) => e.uid !== eventId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKeys.calendar.events(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
    },
  });

  // 로컬 이벤트 수정 (낙관적)
  const updateEventMutation = useMutation({
    mutationFn: (localEvent: LocalEvent) => window.electronAPI.updateLocalEvent(localEvent),
    onMutate: async (localEvent) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.events() });
      const previous = queryClient.getQueryData<CalendarEvent[]>(queryKeys.calendar.events());
      queryClient.setQueryData<CalendarEvent[]>(queryKeys.calendar.events(), (old = []) =>
        old
          .map((e) =>
            e.uid === localEvent.id
              ? {
                  ...e,
                  summary: localEvent.summary,
                  description: localEvent.description,
                  allDay: localEvent.allDay,
                  dtstart: localEvent.dtstart,
                  dtend: localEvent.dtend,
                }
              : e,
          )
          .sort((a, b) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime()),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKeys.calendar.events(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
    },
  });

  // 시간 검증 + LocalEvent 생성 헬퍼
  const buildLocalEvent = (
    id: string,
    summary: string,
    description: string,
    allDay: boolean,
    startTime: string,
    endTime: string,
    endDate: string,
    reminders: EventReminder[],
  ): LocalEvent | null => {
    const trimmed = summary.trim();
    if (!trimmed) return null;
    setTimeError(null);

    let parsedStart = startTime;
    let parsedEnd = endTime;
    if (!allDay) {
      const ps = parseTimeInput(startTime);
      const pe = parseTimeInput(endTime);
      if (!ps) {
        setTimeError("시작 시간이 올바르지 않습니다 (예: 09:00, 1400)");
        return null;
      }
      if (!pe) {
        setTimeError("종료 시간이 올바르지 않습니다 (예: 10:00, 1830)");
        return null;
      }
      parsedStart = ps;
      parsedEnd = pe;
      if (parsedEnd <= parsedStart) {
        setTimeError("종료 시간이 시작 시간보다 이후여야 합니다");
        return null;
      }
    }

    const startDateStr = toDateStr(displayDate);
    const endDateStr = endDate || startDateStr;
    return {
      id,
      summary: trimmed,
      description: description.trim() || undefined,
      allDay,
      dtstart: allDay ? `${startDateStr}T00:00:00` : `${startDateStr}T${parsedStart}:00`,
      dtend: allDay ? `${endDateStr}T23:59:59` : `${endDateStr}T${parsedEnd}:00`,
      reminders: reminders.length > 0 ? reminders : undefined,
    };
  };

  const addLocalEvent = async (
    ...args: [string, string, boolean, string, string, string, EventReminder[]]
  ): Promise<boolean> => {
    const localEvent = buildLocalEvent(generateId(), ...args);
    if (!localEvent) return false;
    addEventMutation.mutate(localEvent);
    return true;
  };

  const deleteLocalEvent = async (eventId: string) => {
    deleteEventMutation.mutate(eventId);
  };

  const updateLocalEvent = async (
    eventId: string,
    summary: string,
    description: string,
    allDay: boolean,
    startTime: string,
    endTime: string,
    endDate: string,
    reminders: EventReminder[],
  ): Promise<boolean> => {
    const localEvent = buildLocalEvent(
      eventId,
      summary,
      description,
      allDay,
      startTime,
      endTime,
      endDate,
      reminders,
    );
    if (!localEvent) return false;
    updateEventMutation.mutate(localEvent);
    return true;
  };

  // 피드별 키워드 필터 적용
  const filteredEvents = useMemo(() => {
    const filterMap = new Map<string, string>();
    for (const f of feeds) {
      if (f.filterKeyword?.trim()) filterMap.set(f.id, f.filterKeyword.trim().toLowerCase());
    }
    if (filterMap.size === 0) return events;
    return events.filter((e) => {
      const keyword = filterMap.get(e.feedId);
      if (!keyword) return true;
      return e.summary.toLowerCase().includes(keyword);
    });
  }, [events, feeds]);

  const selectedDayEvents = useMemo(
    () => getEventsForDay(filteredEvents, displayDate),
    [filteredEvents, displayDate],
  );

  const feedLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of feeds) map[f.id] = f.label;
    return map;
  }, [feeds]);

  const feedColorMap = useMemo(() => {
    const map: Record<string, string> = { [LOCAL_FEED_ID]: LOCAL_EVENT_COLOR };
    for (const f of feeds) map[f.id] = f.color;
    return map;
  }, [feeds]);

  const getUpcomingEvents = useCallback(
    (isAgendaMode: boolean) => {
      if (!isAgendaMode) return [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const upcoming = filteredEvents.filter(
        (e) => new Date(e.dtend).getTime() >= todayStart.getTime(),
      );
      const groups: { date: Date; events: CalendarEvent[] }[] = [];
      for (const e of upcoming) {
        const eStart = new Date(e.dtstart);
        const eventDay = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate());
        const groupDay = eventDay.getTime() < todayStart.getTime() ? todayStart : eventDay;
        const existing = groups.find((g) => isSameDay(g.date, groupDay));
        if (existing) {
          existing.events.push(e);
        } else {
          groups.push({ date: groupDay, events: [e] });
        }
      }
      groups.sort((a, b) => a.date.getTime() - b.date.getTime());
      return groups;
    },
    [filteredEvents],
  );

  return {
    events,
    feeds,
    loading,
    error,
    refreshing,
    timeError,
    setTimeError,
    filteredEvents,
    selectedDayEvents,
    feedLabelMap,
    feedColorMap,
    fetchEvents: async () => {
      await fetchEvents();
    },
    addFeed,
    removeFeed,
    updateFeedFilter,
    addLocalEvent,
    deleteLocalEvent,
    updateLocalEvent,
    getUpcomingEvents,
  };
}
