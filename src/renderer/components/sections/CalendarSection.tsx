/** 캘린더 탭 섹션: 파일 기반 태스크 캘린더 */
import type { TasksByDate } from "@shared/types";
import { useMemo, useState } from "react";
import { getCalendarDays, isSameDay } from "../../utils/calendar";
import CalendarGrid from "../calendar/CalendarGrid";
import CalendarHeader from "../calendar/CalendarHeader";
import TaskFilterBar from "../calendar/TaskFilterBar";
import TaskListPanel from "../calendar/TaskListPanel";
import { useAgendaTasks } from "../calendar/useAgendaTasks";
import { useBacklogData } from "../calendar/useBacklogData";
import { useTaskData } from "../calendar/useTaskData";

export default function CalendarSection() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isShowingCompleted, setShowCompleted] = useState(false);

  const {
    tasksByDate,
    isLoading,
    error,
    refreshing,
    toggleComplete,
    updateTask,
    deleteTask,
    refetch,
  } = useTaskData(viewYear, viewMonth);

  const { backlogTasks, toggleComplete: toggleBacklogComplete } = useBacklogData();
  const agendaTasksByDate = useAgendaTasks();

  // 완료된 백로그 태스크를 completedAt 날짜 기준으로 그룹화
  const completedBacklogByDate = useMemo(() => {
    const byDate: TasksByDate = {};
    for (const task of backlogTasks) {
      if (task.completed && task.completedAt) {
        const date = task.completedAt.split("T")[0];
        byDate[date] = [...(byDate[date] ?? []), task];
      }
    }
    return byDate;
  }, [backlogTasks]);

  // 캘린더 그리드용: tasksByDate + 완료된 백로그 병합
  const tasksByDateForGrid = useMemo(() => {
    const merged: TasksByDate = { ...tasksByDate };
    for (const [date, tasks] of Object.entries(completedBacklogByDate)) {
      merged[date] = [...(merged[date] ?? []), ...tasks];
    }
    return merged;
  }, [tasksByDate, completedBacklogByDate]);

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

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[11px] text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader
        monthLabel={monthLabel}
        isRefreshing={refreshing}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        onRefresh={refetch}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <CalendarGrid
          calendarDays={calendarDays}
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          tasksByDate={tasksByDateForGrid}
          onDayClick={(day) => {
            // 다른 달 날짜 클릭 시 해당 달로 이동 (그리드 인접 달 날짜 조회 가능)
            if (day.getFullYear() !== viewYear || day.getMonth() !== viewMonth) {
              setViewYear(day.getFullYear());
              setViewMonth(day.getMonth());
            }
            setSelectedDate(selectedDate && isSameDay(day, selectedDate) ? null : day);
          }}
        />
        <TaskFilterBar
          filterCategory={filterCategory}
          isShowingCompleted={isShowingCompleted}
          onFilterCategory={setFilterCategory}
          onToggleShowCompleted={() => setShowCompleted(!isShowingCompleted)}
        />
        <TaskListPanel
          selectedDate={selectedDate}
          tasksByDate={tasksByDate}
          agendaTasksByDate={agendaTasksByDate}
          backlogTasks={backlogTasks}
          completedBacklogByDate={completedBacklogByDate}
          isShowingCompleted={isShowingCompleted}
          filterCategory={filterCategory}
          onToggleComplete={toggleComplete}
          onToggleBacklogComplete={toggleBacklogComplete}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
}
