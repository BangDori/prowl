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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const CALENDAR_GRID_SIZE = 42; // 6주 × 7일
const MS_PER_DAY = 86400000;
const MAX_EVENT_DOTS = 3;

/** 날짜를 "YYYY-MM-DD" 형식으로 포맷 */
function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 시간을 "14:30" 형식으로 포맷 */
function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 날짜를 "2월 24일 (화)" 형식으로 포맷 */
function formatDateKr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
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

/** 이벤트가 여러 날에 걸치는지 확인 (종일 이벤트의 exclusive DTEND 고려) */
function isMultiDay(event: CalendarEvent): boolean {
  const s = new Date(event.dtstart);
  const e = new Date(event.dtend);
  const startDay = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
  const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
  const diffDays = (endDay - startDay) / MS_PER_DAY;
  if (diffDays <= 0) return false;
  // ICS 종일 이벤트: DTEND가 다음 날(exclusive)이면 실제로는 1일짜리
  if (diffDays <= 1 && event.allDay) return false;
  return true;
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
  const dayOfWeek = date.getDay();

  // multi-day 이벤트 → 바, single-day → 점으로 분리
  const multiDay = events.filter(isMultiDay);
  const singleDay = events.filter((e) => !isMultiDay(e));

  // 바 세그먼트: 시작/끝/주 경계에서 라운딩
  const bars = multiDay.slice(0, 2).map((e) => {
    const isStart = isSameDay(new Date(e.dtstart), date);
    const isEnd = isSameDay(new Date(e.dtend), date);
    return {
      key: `bar-${e.uid}`,
      color: feedColorMap[e.feedId] ?? FEED_COLORS[0],
      roundLeft: isStart || dayOfWeek === 0,
      roundRight: isEnd || dayOfWeek === 6,
    };
  });

  // 남은 슬롯에 single-day 점 표시
  const remainingSlots = MAX_EVENT_DOTS - bars.length;
  const dotColors =
    remainingSlots > 0
      ? singleDay.map((e) => feedColorMap[e.feedId] ?? FEED_COLORS[0]).slice(0, remainingSlots)
      : [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center py-1 transition-colors min-h-[36px] overflow-hidden
        ${selected ? "bg-accent/20 ring-1 ring-accent/40 rounded-md" : "hover:bg-white/5 rounded-md"}
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
      {/* Multi-day 바 */}
      {bars.length > 0 && (
        <div className="w-full mt-0.5 space-y-px">
          {bars.map((bar) => (
            <div
              key={bar.key}
              className={`h-[3px] ${bar.roundLeft ? "ml-0.5 rounded-l-full" : ""} ${bar.roundRight ? "mr-0.5 rounded-r-full" : ""}`}
              style={{ backgroundColor: bar.color }}
            />
          ))}
        </div>
      )}
      {/* Single-day 점 */}
      {dotColors.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {dotColors.map((color, i) => (
            <div
              key={`dot-${date.getTime()}-${i}`}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </button>
  );
}

/** 커스텀 미니 날짜 선택기 (native date picker 대체) */
function MiniDatePicker({
  value,
  min,
  onChange,
  onClose,
}: {
  value: string;
  min?: string;
  onChange: (dateStr: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = new Date(`${value}T00:00:00`);
  const minDate = min ? new Date(`${min}T00:00:00`) : undefined;
  const [pickerYear, setPickerYear] = useState(selected.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(selected.getMonth());

  const days = useMemo(() => getCalendarDays(pickerYear, pickerMonth), [pickerYear, pickerMonth]);

  const monthLabel = new Date(pickerYear, pickerMonth).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const goPrev = () => {
    if (pickerMonth === 0) {
      setPickerYear(pickerYear - 1);
      setPickerMonth(11);
    } else {
      setPickerMonth(pickerMonth - 1);
    }
  };

  const goNext = () => {
    if (pickerMonth === 11) {
      setPickerYear(pickerYear + 1);
      setPickerMonth(0);
    } else {
      setPickerMonth(pickerMonth + 1);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 p-2 rounded-lg border border-prowl-border bg-prowl-surface shadow-xl"
      style={{ width: "210px" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={goPrev}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="text-[10px] font-medium text-gray-300">{monthLabel}</span>
        <button
          type="button"
          onClick={goNext}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-[9px] font-medium py-0.5 ${
              d === "일" ? "text-red-400/70" : d === "토" ? "text-blue-400/70" : "text-gray-600"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = toDateStr(day);
          const isCurrentMonth = day.getMonth() === pickerMonth;
          const isSelected = dateStr === value;
          const isDisabled = minDate && day < minDate && !isSameDay(day, minDate);
          const today = isToday(day);

          return (
            <button
              key={day.getTime()}
              type="button"
              disabled={!!isDisabled}
              onClick={() => {
                onChange(dateStr);
                onClose();
              }}
              className={`
                text-[10px] w-full py-1 rounded transition-colors
                ${isDisabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:bg-white/10"}
                ${isSelected ? "bg-accent/25 text-accent font-medium" : ""}
                ${!isSelected && today ? "text-accent font-medium" : ""}
                ${!isSelected && !today && isCurrentMonth ? "text-gray-300" : ""}
                ${!isCurrentMonth && !isSelected ? "opacity-30" : ""}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface EventDetailProps {
  event: CalendarEvent;
  feedLabel?: string;
  feedColor?: string;
  isLocal?: boolean;
  isEditing?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onEditSave?: (
    summary: string,
    allDay: boolean,
    startTime: string,
    endTime: string,
    endDate: string,
  ) => void;
  onEditCancel?: () => void;
}

function EventDetail({
  event,
  feedLabel,
  feedColor,
  isLocal,
  isEditing,
  onDelete,
  onEdit,
  onEditSave,
  onEditCancel,
}: EventDetailProps) {
  const ongoing = isOngoing(event);
  const barColor = isLocal ? LOCAL_EVENT_COLOR : (feedColor ?? FEED_COLORS[0]);

  const [editSummary, setEditSummary] = useState(event.summary);
  const [editAllDay, setEditAllDay] = useState(event.allDay ?? false);
  const [editStartTime, setEditStartTime] = useState(formatTime(new Date(event.dtstart)));
  const [editEndTime, setEditEndTime] = useState(formatTime(new Date(event.dtend)));
  const [editEndDate, setEditEndDate] = useState(toDateStr(new Date(event.dtend)));
  const [editEndDateOpen, setEditEndDateOpen] = useState(false);

  if (isEditing) {
    const startDateStr = toDateStr(new Date(event.dtstart));
    return (
      <div className="rounded-md border border-accent/30 bg-prowl-card overflow-hidden">
        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-prowl-border/50">
          <input
            type="text"
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              onEditSave?.(editSummary, editAllDay, editStartTime, editEndTime, editEndDate)
            }
            className="flex-1 bg-transparent text-[11px] text-gray-200 placeholder-gray-600 outline-none"
            // biome-ignore lint/a11y/noAutofocus: 편집 모드 진입 시 즉시 입력 가능해야 함
            autoFocus
          />
        </div>
        {/* 날짜/시간 행 */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 px-2.5 py-2">
          <span className="text-[10px] text-gray-400">{formatDateKr(startDateStr)}</span>
          {!editAllDay && (
            <input
              type="text"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              placeholder="09:00"
              maxLength={5}
              className="w-12 bg-transparent text-[10px] text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
            />
          )}
          <span className="text-[10px] text-gray-600">~</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setEditEndDateOpen(!editEndDateOpen)}
              className="text-[10px] text-gray-300 border-b border-dashed border-prowl-border/50 hover:border-accent/50 py-0.5 transition-colors cursor-pointer"
            >
              {formatDateKr(editEndDate)}
            </button>
            {editEndDateOpen && (
              <MiniDatePicker
                value={editEndDate}
                min={startDateStr}
                onChange={setEditEndDate}
                onClose={() => setEditEndDateOpen(false)}
              />
            )}
          </div>
          {!editAllDay && (
            <input
              type="text"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              placeholder="10:00"
              maxLength={5}
              className="w-12 bg-transparent text-[10px] text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
            />
          )}
          <label className="flex items-center gap-1 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={editAllDay}
              onChange={(e) => setEditAllDay(e.target.checked)}
              className="w-3 h-3 rounded accent-accent"
            />
            <span className="text-[10px] text-gray-400">종일</span>
          </label>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onEditCancel}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() =>
              onEditSave?.(editSummary, editAllDay, editStartTime, editEndTime, editEndDate)
            }
            disabled={!editSummary.trim()}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-20"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

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
        {isLocal && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex-shrink-0 p-0.5 rounded text-gray-700 opacity-0 group-hover:opacity-100 hover:text-accent transition-all"
            title="수정"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
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
        {isMultiDay(event) ? (
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-gray-600" />
            <span className="text-[10px] text-gray-500">
              {formatDateKr(new Date(event.dtstart))}
              {!event.allDay && ` ${formatTime(new Date(event.dtstart))}`}
              {" ~ "}
              {formatDateKr(new Date(event.dtend))}
              {!event.allDay && ` ${formatTime(new Date(event.dtend))}`}
            </span>
          </div>
        ) : event.allDay ? (
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
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndDateOpen, setEventEndDateOpen] = useState(false);

  // 로컬 이벤트 수정
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // 현재 보고 있는 월
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // 선택된 날짜 (null = 선택 없음, 오늘 기준 이벤트 표시)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // 피드 키워드 필터 업데이트
  const handleUpdateFeedFilter = async (feedId: string, filterKeyword: string) => {
    const updated = feeds.map((f) => (f.id === feedId ? { ...f, filterKeyword } : f));
    setFeeds(updated);
    await window.electronAPI.setCalendarSettings({ feeds: updated });
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

    const startDateStr = toDateStr(displayDate);
    const endDateStr = eventEndDate || startDateStr;

    const localEvent: LocalEvent = {
      id: generateId(),
      summary,
      allDay: eventAllDay,
      dtstart: eventAllDay ? `${startDateStr}T00:00:00` : `${startDateStr}T${eventStartTime}:00`,
      dtend: eventAllDay ? `${endDateStr}T23:59:59` : `${endDateStr}T${eventEndTime}:00`,
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
    setEventEndDate("");

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

  // 로컬 이벤트 수정 (낙관적 업데이트)
  const handleUpdateLocalEvent = async (
    eventId: string,
    summary: string,
    allDay: boolean,
    startTime: string,
    endTime: string,
    endDate: string,
  ) => {
    const trimmed = summary.trim();
    if (!trimmed) return;

    const startDateStr = toDateStr(displayDate);
    const endDateStr = endDate || startDateStr;

    const updatedLocal: LocalEvent = {
      id: eventId,
      summary: trimmed,
      allDay,
      dtstart: allDay ? `${startDateStr}T00:00:00` : `${startDateStr}T${startTime}:00`,
      dtend: allDay ? `${endDateStr}T23:59:59` : `${endDateStr}T${endTime}:00`,
    };

    // 낙관적: 즉시 UI 반영
    const prev = events;
    setEvents((cur) =>
      cur
        .map((e) =>
          e.uid === eventId
            ? {
                ...e,
                summary: trimmed,
                allDay,
                dtstart: new Date(updatedLocal.dtstart),
                dtend: new Date(updatedLocal.dtend),
              }
            : e,
        )
        .sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime()),
    );
    setEditingEventId(null);

    // 백그라운드 IPC — 실패 시 롤백
    try {
      await window.electronAPI.updateLocalEvent(updatedLocal);
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
    setSelectedDate(null);
  };

  // 캘린더 그리드 날짜 계산
  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // 이벤트 목록에 표시할 날짜 (선택 없으면 오늘)
  const displayDate = selectedDate ?? new Date();

  // 피드별 키워드 필터 적용
  const filteredEvents = useMemo(() => {
    const filterMap = new Map<string, string>();
    for (const f of feeds) {
      if (f.filterKeyword?.trim()) filterMap.set(f.id, f.filterKeyword.trim().toLowerCase());
    }
    if (filterMap.size === 0) return events;
    return events.filter((e) => {
      const keyword = filterMap.get(e.feedId);
      if (!keyword) return true; // 필터 없는 피드는 통과
      return e.summary.toLowerCase().includes(keyword);
    });
  }, [events, feeds]);

  // 표시 날짜의 이벤트
  const selectedDayEvents = useMemo(
    () => getEventsForDay(filteredEvents, displayDate),
    [filteredEvents, displayDate],
  );

  // 어젠다: 오늘부터 앞으로의 이벤트 (날짜별 그룹)
  const upcomingEvents = useMemo(() => {
    if (selectedDate !== null) return [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const upcoming = filteredEvents.filter(
      (e) => new Date(e.dtend).getTime() >= todayStart.getTime(),
    );
    // 날짜별 그룹핑
    const groups: { date: Date; events: CalendarEvent[] }[] = [];
    for (const e of upcoming) {
      const eStart = new Date(e.dtstart);
      const eventDay = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate());
      // 시작일이 오늘 이전이면 오늘 기준으로
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
  }, [selectedDate, filteredEvents]);

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
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="text"
                        value={feed.filterKeyword ?? ""}
                        onChange={(e) => handleUpdateFeedFilter(feed.id, e.target.value)}
                        placeholder="포함 키워드 (미설정 시 전체)"
                        className="flex-1 min-w-0 bg-transparent text-[10px] text-gray-500 placeholder-gray-700 outline-none"
                      />
                    </div>
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

            <div className="grid grid-cols-7 gap-y-0.5">
              {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(filteredEvents, day);
                return (
                  <DayCell
                    key={day.getTime()}
                    date={day}
                    isCurrentMonth={day.getMonth() === viewMonth}
                    events={dayEvents}
                    selected={selectedDate !== null && isSameDay(day, selectedDate)}
                    feedColorMap={feedColorMap}
                    onClick={() =>
                      setSelectedDate(selectedDate && isSameDay(day, selectedDate) ? null : day)
                    }
                  />
                );
              })}
            </div>
          </div>

          {/* 이벤트 목록 */}
          <div className="flex-1 border-t border-prowl-border overflow-y-auto">
            {selectedDate === null ? (
              /* 어젠다: 오늘부터 앞으로의 일정 */
              upcomingEvents.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-[11px] text-gray-600">예정된 일정 없음</p>
                </div>
              ) : (
                <div className="px-3 pb-3">
                  {upcomingEvents.map((group) => (
                    <div key={group.date.getTime()} className="mt-2 first:mt-1">
                      <span className="text-[10px] font-medium text-gray-500">
                        {group.date.toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                        {isToday(group.date) && <span className="ml-1.5 text-accent">오늘</span>}
                      </span>
                      <div className="mt-1 space-y-1">
                        {group.events.map((event) => (
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
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* 선택된 날짜의 이벤트 */
              <>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[10px] font-medium text-gray-500">
                    {displayDate.toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                    {isToday(displayDate) && <span className="ml-1.5 text-accent">오늘</span>}
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
                    {/* 날짜/시간 행 */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 px-2.5 py-2">
                      <span className="text-[10px] text-gray-400">
                        {formatDateKr(toDateStr(displayDate))}
                      </span>
                      {!eventAllDay && (
                        <input
                          type="text"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                          placeholder="09:00"
                          maxLength={5}
                          className="w-12 bg-transparent text-[10px] text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
                        />
                      )}
                      <span className="text-[10px] text-gray-600">~</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEventEndDateOpen(!eventEndDateOpen)}
                          className="text-[10px] text-gray-300 border-b border-dashed border-prowl-border/50 hover:border-accent/50 py-0.5 transition-colors cursor-pointer"
                        >
                          {formatDateKr(eventEndDate || toDateStr(displayDate))}
                        </button>
                        {eventEndDateOpen && (
                          <MiniDatePicker
                            value={eventEndDate || toDateStr(displayDate)}
                            min={toDateStr(displayDate)}
                            onChange={setEventEndDate}
                            onClose={() => setEventEndDateOpen(false)}
                          />
                        )}
                      </div>
                      {!eventAllDay && (
                        <input
                          type="text"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                          placeholder="10:00"
                          maxLength={5}
                          className="w-12 bg-transparent text-[10px] text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
                        />
                      )}
                      <label className="flex items-center gap-1 ml-auto cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventAllDay}
                          onChange={(e) => setEventAllDay(e.target.checked)}
                          className="w-3 h-3 rounded accent-accent"
                        />
                        <span className="text-[10px] text-gray-400">종일</span>
                      </label>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setAddingEvent(false);
                          setEventSummary("");
                          setEventEndDate("");
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
                    {selectedDayEvents.map((event) => {
                      const isLocal = event.feedId === LOCAL_FEED_ID;
                      return (
                        <EventDetail
                          key={event.uid}
                          event={event}
                          feedLabel={feeds.length > 1 ? feedLabelMap[event.feedId] : undefined}
                          feedColor={feedColorMap[event.feedId]}
                          isLocal={isLocal}
                          isEditing={isLocal && editingEventId === event.uid}
                          onEdit={isLocal ? () => setEditingEventId(event.uid) : undefined}
                          onEditSave={
                            isLocal
                              ? (summary, allDay, startTime, endTime, endDate) =>
                                  handleUpdateLocalEvent(
                                    event.uid,
                                    summary,
                                    allDay,
                                    startTime,
                                    endTime,
                                    endDate,
                                  )
                              : undefined
                          }
                          onEditCancel={() => setEditingEventId(null)}
                          onDelete={isLocal ? () => handleDeleteLocalEvent(event.uid) : undefined}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
