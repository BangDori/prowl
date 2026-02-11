/** 일정 상세 보기 및 편집 컴포넌트 */
import type { CalendarEvent, EventReminder } from "@shared/types";
import { FEED_COLORS, LOCAL_EVENT_COLOR } from "@shared/types";
import { Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  formatDateKr,
  formatTime,
  isMultiDay,
  isOngoing,
  parseTimeInput,
  toDateStr,
} from "../../utils/calendar";
import MiniDatePicker from "./MiniDatePicker";
import ReminderPicker from "./ReminderPicker";

export interface EventDetailProps {
  event: CalendarEvent;
  feedLabel?: string;
  feedColor?: string;
  isLocal?: boolean;
  isEditing?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onEditSave?: (
    summary: string,
    description: string,
    allDay: boolean,
    startTime: string,
    endTime: string,
    endDate: string,
    reminders: EventReminder[],
  ) => void;
  onEditCancel?: () => void;
}

export default function EventDetail({
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
  const [editDescription, setEditDescription] = useState(event.description ?? "");
  const [editAllDay, setEditAllDay] = useState(event.allDay ?? false);
  const [editStartTime, setEditStartTime] = useState(formatTime(new Date(event.dtstart)));
  const [editEndTime, setEditEndTime] = useState(formatTime(new Date(event.dtend)));
  const [editEndDate, setEditEndDate] = useState(toDateStr(new Date(event.dtend)));
  const [editEndDateOpen, setEditEndDateOpen] = useState(false);
  const [editReminders, setEditReminders] = useState<EventReminder[]>([
    { minutes: 1440 },
    { minutes: 60 },
  ]);
  const editEndDateBtnRef = useRef<HTMLButtonElement>(null);

  if (isEditing) {
    const startDateStr = toDateStr(new Date(event.dtstart));
    return (
      <div className="rounded-md border border-accent/30 bg-prowl-card">
        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-prowl-border/50">
          <input
            type="text"
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              onEditSave?.(
                editSummary,
                editDescription,
                editAllDay,
                editStartTime,
                editEndTime,
                editEndDate,
                editReminders,
              )
            }
            className="flex-1 bg-transparent text-[11px] text-gray-200 placeholder-gray-600 outline-none"
            // biome-ignore lint/a11y/noAutofocus: 편집 모드 진입 시 즉시 입력 가능해야 함
            autoFocus
          />
        </div>
        <div className="px-2.5 pb-1">
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="내용 (선택)"
            rows={2}
            className="w-full bg-transparent text-[10px] text-gray-300 placeholder-gray-600 outline-none resize-none border-b border-prowl-border/50 focus:border-accent/50 py-1 transition-colors"
          />
        </div>
        {/* 날짜/시간 행 */}
        <div className="px-2.5 py-2 space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] leading-relaxed text-gray-400 py-0.5">
              {formatDateKr(startDateStr)}
            </span>
            {!editAllDay && (
              <input
                type="text"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                onBlur={() => {
                  const parsed = parseTimeInput(editStartTime);
                  if (parsed) setEditStartTime(parsed);
                }}
                placeholder="09:00"
                maxLength={5}
                className="w-12 bg-transparent text-[10px] leading-relaxed text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
              />
            )}
            <span className="text-[10px] leading-relaxed text-gray-600 py-0.5">~</span>
            <div className="relative">
              <button
                ref={editEndDateBtnRef}
                type="button"
                onClick={() => setEditEndDateOpen(!editEndDateOpen)}
                className="text-[10px] leading-relaxed text-gray-300 border-b border-dashed border-prowl-border/50 hover:border-accent/50 py-0.5 transition-colors cursor-pointer"
              >
                {formatDateKr(editEndDate)}
              </button>
              {editEndDateOpen && (
                <MiniDatePicker
                  value={editEndDate}
                  min={startDateStr}
                  onChange={setEditEndDate}
                  onClose={() => setEditEndDateOpen(false)}
                  anchorRef={editEndDateBtnRef}
                />
              )}
            </div>
            {!editAllDay && (
              <input
                type="text"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                onBlur={() => {
                  const parsed = parseTimeInput(editEndTime);
                  if (parsed) setEditEndTime(parsed);
                }}
                placeholder="10:00"
                maxLength={5}
                className="w-12 bg-transparent text-[10px] leading-relaxed text-gray-300 text-center outline-none border-b border-prowl-border/50 focus:border-accent/50 py-0.5 transition-colors"
              />
            )}
          </div>
          <ReminderPicker reminders={editReminders} onChange={setEditReminders} />
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editAllDay}
                onChange={(e) => {
                  setEditAllDay(e.target.checked);
                  if (e.target.checked) {
                    setEditEndDate(startDateStr);
                  }
                }}
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
                onEditSave?.(
                  editSummary,
                  editDescription,
                  editAllDay,
                  editStartTime,
                  editEndTime,
                  editEndDate,
                  editReminders,
                )
              }
              disabled={!editSummary.trim()}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-20"
            >
              저장
            </button>
          </div>
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
        {event.description && (
          <p className="text-[10px] text-gray-500 whitespace-pre-wrap line-clamp-2">
            {event.description}
          </p>
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
