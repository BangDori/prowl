import type { CalendarEvent, IcsFeed, LocalEvent } from "@shared/types";
import { FEED_COLORS, LOCAL_EVENT_COLOR, LOCAL_FEED_ID } from "@shared/types";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Link,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const CALENDAR_GRID_SIZE = 42; // 6주 × 7일
const MS_PER_DAY = 86400000;
const MAX_EVENT_DOTS = 3;

/** 시간을 "14:30" 형식으로 포맷 */
function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 두 날짜가 같은 날인지 확인 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 오늘인지 확인 */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** 해당 월의 캘린더 그리드 날짜 생성 (일요일 시작) */
function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const days: Date[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const remaining = CALENDAR_GRID_SIZE - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }

  return days;
}

/** 특정 날짜의 이벤트 필터링 */
function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const dayEnd = dayStart + MS_PER_DAY;

  return events.filter((e) => {
    const start = new Date(e.dtstart).getTime();
    const end = new Date(e.dtend).getTime();
    return start < dayEnd && end > dayStart;
  });
}

/** 현재 진행 중인 이벤트인지 확인 */
function isOngoing(event: CalendarEvent): boolean {
  const now = Date.now();
  return new Date(event.dtstart).getTime() <= now && new Date(event.dtend).getTime() > now;
}

/** 고유 ID 생성 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  selected: boolean;
  feedColorMap: Record<string, string>;
  onClick: () => void;
}

function DayCell({ date, isCurrentMonth, events, selected, feedColorMap, onClick }: DayCellProps) {
  const today = isToday(date);
  const hasEvents = events.length > 0;

  // 고유 피드 색상만 추출 (중복 제거)
  const dotColors = [...new Set(events.map((e) => feedColorMap[e.feedId] ?? FEED_COLORS[0]))].slice(
    0,
    MAX_EVENT_DOTS,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center py-1 rounded-md transition-colors min-h-[36px]
        ${selected ? "bg-accent/20 ring-1 ring-accent/40" : "hover:bg-white/5"}
        ${!isCurrentMonth ? "opacity-30" : ""}
      `}
    >
      <span
        className={`
          text-[11px] leading-none w-5 h-5 flex items-center justify-center rounded-full
          ${today ? "bg-accent text-prowl-bg font-bold" : ""}
          ${selected && !today ? "text-accent font-medium" : ""}
          ${!selected && !today && isCurrentMonth ? "text-gray-300" : ""}
        `}
      >
        {date.getDate()}
      </span>
      {hasEvents && (
        <div className="flex gap-0.5 mt-0.5">
          {dotColors.map((color) => (
            <div
              key={`dot-${date.getTime()}-${color}`}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </button>
  );
}

interface EventDetailProps {
  event: CalendarEvent;
  feedLabel?: string;
  feedColor?: string;
  isLocal?: boolean;
  onDelete?: () => void;
}

function EventDetail({ event, feedLabel, feedColor, isLocal, onDelete }: EventDetailProps) {
  const ongoing = isOngoing(event);
  const barColor = isLocal ? LOCAL_EVENT_COLOR : (feedColor ?? FEED_COLORS[0]);

  return (
    <div
      className={`group px-2.5 py-1.5 rounded-md border transition-colors ${
        ongoing ? "border-accent/30 bg-accent/5" : "border-prowl-border bg-prowl-card"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="w-0.5 h-3.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: ongoing ? LOCAL_EVENT_COLOR : barColor }}
        />
        <p
          className={`text-[11px] font-medium truncate flex-1 ${ongoing ? "text-accent" : "text-gray-200"}`}
        >
          {event.summary}
        </p>
        {ongoing && (
          <span className="flex-shrink-0 text-[8px] px-1 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
            NOW
          </span>
        )}
        {isLocal && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex-shrink-0 p-0.5 rounded text-gray-700 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            title="삭제"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <div className="ml-2 mt-0.5 space-y-0.5">
        {event.allDay ? (
          <span className="text-[10px] text-gray-500">종일</span>
        ) : (
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-gray-600" />
            <span className="text-[10px] text-gray-500">
              {formatTime(new Date(event.dtstart))} - {formatTime(new Date(event.dtend))}
            </span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-gray-600" />
            <span className="text-[10px] text-gray-500 truncate">{event.location}</span>
          </div>
        )}
        {isLocal ? (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-accent" />
            <span className="text-[9px] text-gray-600">내 일정</span>
          </div>
        ) : feedLabel ? (
          <div className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: barColor }}
            />
            <span className="text-[9px] text-gray-600">{feedLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Google Calendar ICS 연동 섹션 (복수 피드 + 월별 캘린더 뷰)
 */
export default function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [feeds, setFeeds] = useState<IcsFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);

  // 피드 추가 폼
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newColor, setNewColor] = useState<string>(FEED_COLORS[0]);

  // 로컬 이벤트 추가 폼
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventSummary, setEventSummary] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventAllDay, setEventAllDay] = useState(false);

  // 현재 보고 있는 월
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState<Date>(now);

  // 설정 로드
  useEffect(() => {
    (async () => {
      try {
        const settings = await window.electronAPI.getCalendarSettings();
        setFeeds(settings.feeds ?? []);
      } catch {
        // 설정 없으면 무시
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 이벤트 가져오기 (ICS + 로컬)
  const fetchEvents = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result = await window.electronAPI.getCalendarEvents();
      const parsed = result.map((e: CalendarEvent) => ({
        ...e,
        dtstart: new Date(e.dtstart),
        dtend: new Date(e.dtend),
      }));
      setEvents(parsed);
    } catch {
      setError("캘린더를 불러올 수 없습니다.");
      setEvents([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // feeds 변경 시 서버에서 이벤트 다시 가져오기
  const feedsKey = feeds.map((f) => f.id).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: feedsKey로 피드 추가/삭제 시 refetch
  useEffect(() => {
    fetchEvents();
  }, [feedsKey, fetchEvents]);

  // 피드 추가
  const handleAddFeed = async () => {
    const url = newUrl.trim();
    const label = newLabel.trim() || `캘린더 ${feeds.length + 1}`;
    if (!url) return;

    const newFeed: IcsFeed = { id: generateId(), label, url, color: newColor };
    const updated = [...feeds, newFeed];
    await window.electronAPI.setCalendarSettings({ feeds: updated });
    setFeeds(updated);
    setNewLabel("");
    setNewUrl("");
    // 다음 피드는 다음 색상을 기본값으로
    const nextColorIdx =
      (FEED_COLORS.indexOf(newColor as (typeof FEED_COLORS)[number]) + 1) % FEED_COLORS.length;
    setNewColor(FEED_COLORS[nextColorIdx]);
  };

  // 피드 삭제
  const handleRemoveFeed = async (feedId: string) => {
    const updated = feeds.filter((f) => f.id !== feedId);
    await window.electronAPI.setCalendarSettings({ feeds: updated });
    setFeeds(updated);
  };

  const handleStartEditing = () => setEditing(true);
  const handleStopEditing = () => {
    setEditing(false);
    setNewLabel("");
    setNewUrl("");
  };

  // 로컬 이벤트 추가 (낙관적 업데이트)
  const handleAddLocalEvent = async () => {
    const summary = eventSummary.trim();
    if (!summary) return;

    // 종일이 아닌 경우 종료 시간이 시작 시간보다 뒤인지 검증
    if (!eventAllDay && eventEndTime <= eventStartTime) {
      setEventEndTime(
        eventStartTime.replace(
          /:(\d+)$/,
          (_, m) => `:${String(Math.min(59, Number(m) + 30)).padStart(2, "0")}`,
        ),
      );
      return;
    }

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    const localEvent: LocalEvent = {
      id: generateId(),
      summary,
      allDay: eventAllDay,
      dtstart: eventAllDay ? `${dateStr}T00:00:00` : `${dateStr}T${eventStartTime}:00`,
      dtend: eventAllDay ? `${dateStr}T23:59:59` : `${dateStr}T${eventEndTime}:00`,
    };

    // 낙관적: 즉시 UI에 반영
    const optimisticEvent: CalendarEvent = {
      uid: localEvent.id,
      summary: localEvent.summary,
      dtstart: new Date(localEvent.dtstart),
      dtend: new Date(localEvent.dtend),
      allDay: localEvent.allDay,
      feedId: LOCAL_FEED_ID,
    };
    const prev = events;
    setEvents((cur) =>
      [...cur, optimisticEvent].sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime()),
    );

    setAddingEvent(false);
    setEventSummary("");
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setEventAllDay(false);

    // 백그라운드 IPC — 실패 시 롤백
    try {
      await window.electronAPI.addLocalEvent(localEvent);
    } catch {
      setEvents(prev);
    }
  };

  // 로컬 이벤트 삭제 (낙관적 업데이트)
  const handleDeleteLocalEvent = async (eventId: string) => {
    // 낙관적: 즉시 UI에서 제거
    const prev = events;
    setEvents((cur) => cur.filter((e) => e.uid !== eventId));

    // 백그라운드 IPC — 실패 시 롤백
    try {
      await window.electronAPI.deleteLocalEvent(eventId);
    } catch {
      setEvents(prev);
    }
  };

  // 월 이동
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
  };

  // 캘린더 그리드 날짜 계산
  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // 선택된 날짜의 이벤트
  const selectedDayEvents = useMemo(
    () => getEventsForDay(events, selectedDate),
    [events, selectedDate],
  );

  // feedId → label/color 매핑
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

  // 월 라벨
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const hasFeeds = feeds.length > 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      {!editing && (
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-prowl-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="text-[11px] font-medium text-gray-300 hover:text-accent transition-colors min-w-[100px] text-center"
            >
              {monthLabel}
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleStartEditing}
              className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
              title="피드 관리"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={fetchEvents}
              disabled={refreshing}
              className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* 피드 관리 패널 */}
      {(!hasFeeds || editing) && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-prowl-border bg-prowl-surface/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-gray-400">ICS 피드 관리</span>
            {editing && hasFeeds && (
              <button
                type="button"
                onClick={handleStopEditing}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                완료
              </button>
            )}
          </div>

          {/* 등록된 피드 목록 */}
          {feeds.length > 0 && (
            <div className="space-y-1 mb-3">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-prowl-card border border-prowl-border"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: feed.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-300 truncate">{feed.label}</p>
                    <p className="text-[10px] text-gray-600 font-mono truncate">
                      {"•".repeat(Math.min(feed.url.length, 30))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeed(feed.id)}
                    className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 새 피드 추가 폼 */}
          <div className="rounded-lg border border-prowl-border bg-prowl-card/50 overflow-hidden">
            {/* 라벨 + 색상 */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-prowl-border/50">
              <Tag className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="라벨 (예: 회사, 개인)"
                className="flex-1 bg-transparent text-[11px] text-gray-200 placeholder-gray-600 outline-none"
              />
              <div className="flex items-center gap-1 pl-2 border-l border-prowl-border/50">
                {FEED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="relative w-3.5 h-3.5 rounded-full transition-all"
                    style={{
                      backgroundColor: color,
                      boxShadow:
                        newColor === color ? `0 0 0 2px #0d0d0d, 0 0 0 3.5px ${color}` : "none",
                      transform: newColor === color ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ICS URL */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Link className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <input
                type="password"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
                placeholder="ICS URL 붙여넣기"
                className="flex-1 bg-transparent text-[11px] text-gray-200 placeholder-gray-600 outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeed}
                disabled={!newUrl.trim()}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" />
                추가
              </button>
            </div>
          </div>
          <p className="text-[9px] text-gray-600 mt-2 px-1">
            Google Calendar &gt; 설정 &gt; 캘린더 &gt; iCal 형식의 비공개 주소
          </p>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20">
            <p className="text-[10px] text-red-400">{error}</p>
          </div>
        )}
        <div className="flex flex-col h-full">
          {/* 캘린더 그리드 */}
          <div className="flex-shrink-0 px-3 pt-2 pb-1">
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className={`text-center text-[10px] font-medium py-1 ${
                    day === "일"
                      ? "text-red-400/70"
                      : day === "토"
                        ? "text-blue-400/70"
                        : "text-gray-500"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(events, day);
                return (
                  <DayCell
                    key={day.getTime()}
                    date={day}
                    isCurrentMonth={day.getMonth() === viewMonth}
                    events={dayEvents}
                    selected={isSameDay(day, selectedDate)}
                    feedColorMap={feedColorMap}
                    onClick={() => setSelectedDate(day)}
                  />
                );
              })}
            </div>
          </div>

          {/* 선택된 날짜의 이벤트 목록 */}
          <div
            key={selectedDate.getTime()}
            className="flex-1 border-t border-prowl-border overflow-y-auto"
          >
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[10px] font-medium text-gray-500">
                {selectedDate.toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
                {isToday(selectedDate) && <span className="ml-1.5 text-accent">오늘</span>}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-600">{selectedDayEvents.length}건</span>
                {!addingEvent && (
                  <button
                    type="button"
                    onClick={() => setAddingEvent(true)}
                    className="p-0.5 rounded text-gray-600 hover:text-accent transition-colors"
                    title="일정 추가"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 로컬 이벤트 추가 폼 */}
            {addingEvent && (
              <div className="mx-3 mb-2 rounded-lg border border-prowl-border bg-prowl-card/50 overflow-hidden">
                <div className="flex items-center gap-2 px-2.5 py-2 border-b border-prowl-border/50">
                  <input
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLocalEvent()}
                    placeholder="일정 제목"
                    className="flex-1 bg-transparent text-[11px] text-gray-200 placeholder-gray-600 outline-none"
                    // biome-ignore lint/a11y/noAutofocus: 인라인 폼 열릴 때 즉시 입력 가능해야 함
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventAllDay}
                      onChange={(e) => setEventAllDay(e.target.checked)}
                      className="w-3 h-3 rounded accent-accent"
                    />
                    <span className="text-[10px] text-gray-400">종일</span>
                  </label>
                  {!eventAllDay && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="bg-transparent text-xs text-gray-300 outline-none border border-prowl-border rounded px-2 py-0.5 min-w-[5.5rem]"
                      />
                      <span className="text-xs text-gray-600">~</span>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="bg-transparent text-xs text-gray-300 outline-none border border-prowl-border rounded px-2 py-0.5 min-w-[5.5rem]"
                      />
                    </div>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setAddingEvent(false);
                      setEventSummary("");
                    }}
                    className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLocalEvent}
                    disabled={!eventSummary.trim()}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-20"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}

            {selectedDayEvents.length === 0 && !addingEvent ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-[11px] text-gray-600">일정 없음</p>
              </div>
            ) : (
              <div className="px-3 pb-3 space-y-1">
                {selectedDayEvents.map((event) => (
                  <EventDetail
                    key={event.uid}
                    event={event}
                    feedLabel={feeds.length > 1 ? feedLabelMap[event.feedId] : undefined}
                    feedColor={feedColorMap[event.feedId]}
                    isLocal={event.feedId === LOCAL_FEED_ID}
                    onDelete={
                      event.feedId === LOCAL_FEED_ID
                        ? () => handleDeleteLocalEvent(event.uid)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
