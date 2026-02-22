/** 캘린더 탭 섹션: 파일 기반 태스크 캘린더 */
import { useMemo, useState } from "react";
import { useBacklogData } from "../../hooks/useBacklogData";
import { useTaskData } from "../../hooks/useTaskData";
import { getCalendarDays, isSameDay } from "../../utils/calendar";
import CalendarGrid from "../calendar/CalendarGrid";
import CalendarHeader from "../calendar/CalendarHeader";
import TaskFilterBar from "../calendar/TaskFilterBar";
import TaskListPanel from "../calendar/TaskListPanel";

export default function CalendarSection() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

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
        refreshing={refreshing}
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
          tasksByDate={tasksByDate}
          onDayClick={(day) =>
            setSelectedDate(selectedDate && isSameDay(day, selectedDate) ? null : day)
          }
        />
        <TaskFilterBar
          filterCategory={filterCategory}
          showCompleted={showCompleted}
          onFilterCategory={setFilterCategory}
          onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
        />
        <TaskListPanel
          selectedDate={selectedDate}
          tasksByDate={tasksByDate}
          backlogTasks={backlogTasks}
          showCompleted={showCompleted}
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
