import type { EventReminder } from "@shared/types";
import { FEED_COLORS, LOCAL_FEED_ID } from "@shared/types";
import {
  ChevronLeft,
  ChevronRight,
  Link,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useCalendarData } from "../../hooks/useCalendarData";
import {
  formatDateKr,
  getCalendarDays,
  getEventsForDay,
  isSameDay,
  isToday,
  parseTimeInput,
  toDateStr,
  WEEKDAYS,
} from "../../utils/calendar";
import DayCell from "../calendar/DayCell";
import EventDetail from "../calendar/EventDetail";
import MiniDatePicker from "../calendar/MiniDatePicker";
import ReminderPicker from "../calendar/ReminderPicker";

/**
 * Google Calendar ICS 연동 섹션 (복수 피드 + 월별 캘린더 뷰)
 */
export default function CalendarSection() {
  const [editing, setEditing] = useState(false);

  // 피드 추가 폼
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newColor, setNewColor] = useState<string>(FEED_COLORS[0]);

  // 로컬 이벤트 추가 폼
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventSummary, setEventSummary] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndDateOpen, setEventEndDateOpen] = useState(false);
  const [eventReminders, setEventReminders] = useState<EventReminder[]>([
    { minutes: 1440 },
    { minutes: 60 },
  ]);
  const addEndDateBtnRef = useRef<HTMLButtonElement>(null);

  // 로컬 이벤트 수정
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // 현재 보고 있는 월
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // 선택된 날짜 (null = 선택 없음, 오늘 기준 이벤트 표시)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 이벤트 목록에 표시할 날짜 (선택 없으면 오늘)
  const displayDate = selectedDate ?? new Date();

  // 데이터 훅
  const {
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
    fetchEvents,
    addFeed,
    removeFeed,
    updateFeedFilter,
    addLocalEvent,
    deleteLocalEvent,
    updateLocalEvent,
    getUpcomingEvents,
  } = useCalendarData(displayDate);

  // 어젠다
  const upcomingEvents = useMemo(
    () => getUpcomingEvents(selectedDate === null),
    [getUpcomingEvents, selectedDate],
  );

  // 피드 추가 핸들러
  const handleAddFeed = async () => {
    const nextColor = await addFeed(newLabel, newUrl, newColor);
    if (nextColor) {
      setNewLabel("");
      setNewUrl("");
      setNewColor(nextColor);
    }
  };

  const handleStartEditing = () => setEditing(true);
  const handleStopEditing = () => {
    setEditing(false);
    setNewLabel("");
    setNewUrl("");
  };

  // 로컬 이벤트 추가 핸들러
  const handleAddLocalEvent = async () => {
    const ok = await addLocalEvent(
      eventSummary,
      eventDescription,
      eventAllDay,
      eventStartTime,
      eventEndTime,
      eventEndDate,
      eventReminders,
    );
    if (ok) {
      setAddingEvent(false);
      setEventSummary("");
      setEventDescription("");
      setEventStartTime("09:00");
      setEventEndTime("10:00");
      setEventAllDay(false);
      setEventEndDate("");
      setEventReminders([{ minutes: 1440 }, { minutes: 60 }]);
    }
  };

  // 로컬 이벤트 수정 핸들러
  const handleUpdateLocalEvent = async (
    eventId: string,
    summary: string,
    description: string,
    allDay: boolean,
    startTime: string,
    endTime: string,
    endDate: string,
    reminders: EventReminder[],
  ) => {
    const ok = await updateLocalEvent(
      eventId,
      summary,
      description,
      allDay,
      startTime,
      endTime,
      endDate,
      reminders,
    );
    if (ok) setEditingEventId(null);
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
                        onChange={(e) => updateFeedFilter(feed.id, e.target.value)}
                        placeholder="포함 키워드 (미설정 시 전체)"
                        className="flex-1 min-w-0 bg-transparent text-[10px] text-gray-500 placeholder-gray-700 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeed(feed.id)}
                    className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-prowl-border bg-prowl-card/50 overflow-hidden">
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
              /* 어젠다 뷰 */
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
                                ? () => deleteLocalEvent(event.uid)
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
                  <div className="mx-3 mb-2 rounded-lg border border-prowl-border bg-prowl-card/50">
                    <div className="px-2.5 py-2 border-b border-prowl-border/50 space-y-1">
                      <input
                        type="text"
                        value={eventSummary}
                        onChange={(e) => setEventSummary(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddLocalEvent()}
                        placeholder="일정 제목"
                        className="w-full bg-transparent text-[11px] text-gray-200 placeholder-gray-600 outline-none"
                        // biome-ignore lint/a11y/noAutofocus: 인라인 폼 열릴 때 즉시 입력 가능해야 함
                        autoFocus
                      />
                      <textarea
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="내용 (선택)"
                        rows={2}
                        className="w-full bg-transparent text-[10px] text-gray-300 placeholder-gray-600 outline-none resize-none"
                      />
                    </div>
                    <div className="px-2.5 py-2 space-y-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] leading-relaxed text-gray-400 py-0.5">
                          {formatDateKr(toDateStr(displayDate))}
                        </span>
                        {!eventAllDay && (
                          <input
                            type="text"
                            value={eventStartTime}
                            onChange={(e) => {
                              setEventStartTime(e.target.value);
                              setTimeError(null);
                            }}
                            onBlur={() => {
                              const p = parseTimeInput(eventStartTime);
                              if (p) setEventStartTime(p);
                            }}
                            placeholder="09:00"
                            maxLength={5}
                            className="w-12 bg-transparent text-[10px] leading-relaxed text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
                          />
                        )}
                        <span className="text-[10px] leading-relaxed text-gray-600 py-0.5">~</span>
                        <div className="relative">
                          <button
                            ref={addEndDateBtnRef}
                            type="button"
                            onClick={() => setEventEndDateOpen(!eventEndDateOpen)}
                            className="text-[10px] leading-relaxed text-gray-300 border-b border-dashed border-prowl-border/50 hover:border-accent/50 py-0.5 transition-colors cursor-pointer"
                          >
                            {formatDateKr(eventEndDate || toDateStr(displayDate))}
                          </button>
                          {eventEndDateOpen && (
                            <MiniDatePicker
                              value={eventEndDate || toDateStr(displayDate)}
                              min={toDateStr(displayDate)}
                              onChange={setEventEndDate}
                              onClose={() => setEventEndDateOpen(false)}
                              anchorRef={addEndDateBtnRef}
                            />
                          )}
                        </div>
                        {!eventAllDay && (
                          <input
                            type="text"
                            value={eventEndTime}
                            onChange={(e) => {
                              setEventEndTime(e.target.value);
                              setTimeError(null);
                            }}
                            onBlur={() => {
                              const p = parseTimeInput(eventEndTime);
                              if (p) setEventEndTime(p);
                            }}
                            placeholder="10:00"
                            maxLength={5}
                            className="w-12 bg-transparent text-[10px] leading-relaxed text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
                          />
                        )}
                      </div>
                      {timeError && <p className="text-[9px] text-red-400">{timeError}</p>}
                      <ReminderPicker reminders={eventReminders} onChange={setEventReminders} />
                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventAllDay}
                            onChange={(e) => {
                              setEventAllDay(e.target.checked);
                              if (e.target.checked) {
                                setEventEndDate(toDateStr(displayDate));
                                setTimeError(null);
                              }
                            }}
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
                            setEventDescription("");
                            setEventEndDate("");
                            setTimeError(null);
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
                              ? (
                                  summary,
                                  description,
                                  allDay,
                                  startTime,
                                  endTime,
                                  endDate,
                                  reminders,
                                ) =>
                                  handleUpdateLocalEvent(
                                    event.uid,
                                    summary,
                                    description,
                                    allDay,
                                    startTime,
                                    endTime,
                                    endDate,
                                    reminders,
                                  )
                              : undefined
                          }
                          onEditCancel={() => setEditingEventId(null)}
                          onDelete={isLocal ? () => deleteLocalEvent(event.uid) : undefined}
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
