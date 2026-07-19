import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Edit3, 
  HelpCircle, ChevronDown, Check, Info, AlertCircle, Clock, X, Heart
} from 'lucide-react';
import { EnergyType, Task } from '../types';
import { useNow } from '../useNow';
import { useTasksData } from '../TasksContext';

interface WeekEvent {
  id: string;
  title: string;
  dayIndex: number; // 0: Mon, 1: Tue, etc.
  startTime: string; // "HH:MM" e.g. "09:00"
  endTime: string;   // "HH:MM" e.g. "10:30"
  energy: EnergyType;
}

interface WeekTask {
  id: string;
  title: string;
  dayIndex: number;
  duration: string;
  energy: EnergyType;
}

interface WeekViewProps {
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function WeekView({ onViewChange, tasks: propsTasks, setTasks: propsSetTasks }: WeekViewProps) {
  const { tasks, createTask, updateTask, completeTask, deleteTask } = useTasksData();
  const now = useNow();
  const [weekOffset, setWeekOffset] = useState(0);

  // Helper: format standard "YYYY-MM-DD" local date string
  const getLocalDateString = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const baseDate = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [now, weekOffset]);

  const daysInfo = useMemo(() => {
    // Clean midpoint representation to skip day-wrap errors
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0, 0);
    const day = d.getDay();
    const daysToSubtract = day === 0 ? 6 : day - 1;
    const monday = new Date(d.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);

    const days = [];
    const names = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const staticTraits = [
      { dominantEnergy: 'deep', description: 'Deep-heavy Day', template: '🏗 Deep Work Day', gradient: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 100%)' },
      { dominantEnergy: 'social', description: 'Deep + Social Blend', template: null, gradient: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.08) 0%, rgba(45, 212, 191, 0.08) 50%, rgba(45, 212, 191, 0) 100%)' },
      { dominantEnergy: 'deep', description: 'Deep Work Day', template: '🏗 Deep Work Day', gradient: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 100%)' },
      { dominantEnergy: 'creative', description: 'Admin & Creative Blend', template: null, gradient: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.1) 0%, rgba(251, 191, 36, 0.1) 50%, rgba(251, 191, 36, 0) 100%)' },
      { dominantEnergy: 'deep', description: 'Deep focus review', template: '🏗 Deep Work Day', gradient: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 100%)' },
      { dominantEnergy: 'light', description: 'Light Recovery Day', template: null, gradient: 'linear-gradient(to bottom, rgba(96, 165, 250, 0.12) 0%, rgba(96, 165, 250, 0) 100%)' },
      { dominantEnergy: 'neutral', description: 'Rest Day', template: null, gradient: 'none', isRest: true }
    ];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);

      const isToday = current.getFullYear() === now.getFullYear() &&
                      current.getMonth() === now.getMonth() &&
                      current.getDate() === now.getDate();

      days.push({
        name: names[i],
        date: current.getDate(),
        monthName: current.toLocaleString('default', { month: 'short' }),
        ...staticTraits[i],
        isToday,
        fullDate: current
      });
    }
    return days;
  }, [baseDate, now]);

  // Derived events (scheduled blocks) from single tasks array
  const events = useMemo<WeekEvent[]>(() => {
    return tasks.filter(t => t.startTime && t.endTime).flatMap(t => {
      const matchIndices: number[] = [];
      daysInfo.forEach((day, index) => {
        const dStr = getLocalDateString(day.fullDate);
        if (t.date === dStr || (!t.date && day.isToday)) {
          matchIndices.push(index);
        }
      });

      return matchIndices.map(dayIndex => ({
        id: String(t.id),
        title: t.title,
        dayIndex,
        startTime: t.startTime!,
        endTime: t.endTime!,
        energy: t.energy
      }));
    });
  }, [tasks, daysInfo]);

  // Derived weeklyTasks (checklist bottom chips) from single tasks array
  const weeklyTasks = useMemo<WeekTask[]>(() => {
    return tasks.filter(t => !t.startTime || !t.endTime).flatMap(t => {
      const matchIndices: number[] = [];
      daysInfo.forEach((day, index) => {
        const dStr = getLocalDateString(day.fullDate);
        if (t.date === dStr || (!t.date && day.isToday)) {
          matchIndices.push(index);
        }
      });

      return matchIndices.map(dayIndex => ({
        id: String(t.id),
        title: t.title,
        dayIndex,
        duration: t.duration || '15m',
        energy: t.energy
      }));
    });
  }, [tasks, daysInfo]);

  // Modals / Interactive state
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDay, setNewEventDay] = useState<number>(4); // Friday default
  const [newEventStart, setNewEventStart] = useState('11:00');
  const [newEventEnd, setNewEventEnd] = useState('12:15');
  const [newEventEnergy, setNewEventEnergy] = useState<EnergyType>('deep');
  const [validationError, setValidationError] = useState<string | null>(null);

  // New Dynamic Task State
  const [isAddingTask, setIsAddingTask] = useState<number | null>(null); // day index
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('15m');
  const [newTaskEnergy, setNewTaskEnergy] = useState<EnergyType>('deep');

  // Tooltips for tasks & details
  const [hoveredTask, setHoveredTask] = useState<WeekTask | null>(null);
  const [hoveredTaskPosition, setHoveredTaskPosition] = useState<{ x: number, y: number } | null>(null);

  // Time labels (6:00 AM to 9:00 PM)
  const START_HOUR = 6;
  const END_HOUR = 21; // 9 PM index
  const ROW_HEIGHT = 64; // pixels

  const timeLabels = useMemo(() => {
    const list = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const pm = h >= 12;
      const displayHour = h === 12 ? 12 : h > 12 ? h - 12 : h;
      const labelStr = `${displayHour}:00 ${pm ? 'PM' : 'AM'}`;
      list.push({ hour: h, label: labelStr });
    }
    return list;
  }, []);

  const currentMonthYearStr = useMemo(() => {
    if (daysInfo.length === 0) return '';
    const firstDay = daysInfo[0].fullDate;
    const lastDay = daysInfo[6].fullDate;
    const firstMonth = firstDay.toLocaleString('default', { month: 'long' });
    const firstYear = firstDay.getFullYear();
    const lastMonth = lastDay.toLocaleString('default', { month: 'long' });
    const lastYear = lastDay.getFullYear();
    if (firstMonth === lastMonth && firstYear === lastYear) {
      return `${firstMonth} ${firstYear}`;
    } else if (firstYear === lastYear) {
      return `${firstMonth} - ${lastMonth} ${firstYear}`;
    } else {
      return `${firstMonth} ${firstYear} - ${lastMonth} ${lastYear}`;
    }
  }, [daysInfo]);

  // Helper: map EnergyType to exact palette color
  const getEnergyColor = (type: EnergyType): string => {
    switch (type) {
      case 'deep': return 'var(--color-deep, #8B5CF6)'; // purple
      case 'light': return 'var(--color-light, #60A5FA)'; // light blue
      case 'admin': return 'var(--color-admin, #FBBF24)'; // amber
      case 'creative': return 'var(--color-creative, #FB7185)'; // coral
      case 'social': return 'var(--color-social, #2DD4BF)'; // teal
      default: return 'var(--color-creative, #FB7185)';
    }
  };

  const getEnergyLabel = (type: EnergyType): string => {
    switch (type) {
      case 'deep': return 'Deep';
      case 'light': return 'Light';
      case 'admin': return 'Admin';
      case 'creative': return 'Creative';
      case 'social': return 'Social';
      default: return '';
    }
  };

  // Convert "HH:MM" to minutes from 6:00 AM
  const timeToMinutesFromStart = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    const startMins = START_HOUR * 60; // 360
    return (h * 60 + m) - startMins;
  };

  // Check if two events in the same day overlap
  const checkOverlap = (evA: WeekEvent, evB: WeekEvent): boolean => {
    if (evA.dayIndex !== evB.dayIndex || evA.id === evB.id) return false;
    const startA = timeToMinutesFromStart(evA.startTime);
    const endA = timeToMinutesFromStart(evA.endTime);
    const startB = timeToMinutesFromStart(evB.startTime);
    const endB = timeToMinutesFromStart(evB.endTime);
    return (startA < endB && endA > startB);
  };

  // Return computed layout properties for events (absolute position and collision detection)
  const processedEvents = useMemo(() => {
    return events.map(ev => {
      // Find overlap count
      const overlappingList = events.filter(other => checkOverlap(ev, other));
      const hasOverlap = overlappingList.length > 0;
      
      // Determine if this event is the "second" (offset) event
      // We sort them by start time or ID to determine order
      let isSecondary = false;
      if (hasOverlap) {
        const sorted = [ev, ...overlappingList].sort((a, b) => {
          const startA = timeToMinutesFromStart(a.startTime);
          const startB = timeToMinutesFromStart(b.startTime);
          if (startA !== startB) return startA - startB;
          return a.id.localeCompare(b.id);
        });
        if (sorted[0].id !== ev.id) {
          isSecondary = true;
        }
      }

      const startMin = timeToMinutesFromStart(ev.startTime);
      const endMin = timeToMinutesFromStart(ev.endTime);
      const durationMins = endMin - startMin;

      // Position math
      const top = (startMin / 60) * ROW_HEIGHT;
      const height = (durationMins / 60) * ROW_HEIGHT;

      return {
        ...ev,
        top,
        height,
        durationMins,
        hasOverlap,
        isSecondary,
        overlappingCount: overlappingList.length + 1
      };
    });
  }, [events]);

  // Current Time Line Positioning dynamically computed in real-time
  const currentTimePosition = useMemo(() => {
    const mins = (now.getHours() * 60 + now.getMinutes()) - (START_HOUR * 60);
    return (mins / 60) * ROW_HEIGHT;
  }, [now]);

  // Compute actual load hours for each category
  const activeHoursByCategory = useMemo(() => {
    const totals: Record<EnergyType, number> = {
      deep: 0,
      light: 0,
      admin: 0,
      creative: 0,
      social: 0
    };
    events.forEach(ev => {
      const start = timeToMinutesFromStart(ev.startTime);
      const end = timeToMinutesFromStart(ev.endTime);
      totals[ev.energy] += (end - start) / 60;
    });
    return totals;
  }, [events]);

  const totalSummedHours = (Object.values(activeHoursByCategory) as number[]).reduce((a, b) => a + b, 0);

  // Handles adding new event
  const handleAddNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!newEventTitle.trim()) {
      setValidationError('Event title is required.');
      return;
    }

    const startMin = timeToMinutesFromStart(newEventStart);
    const endMin = timeToMinutesFromStart(newEventEnd);

    if (startMin < 0 || endMin > (END_HOUR - START_HOUR + 1) * 60) {
      setValidationError('Times are out of the 6:00 AM to 9:00 PM range.');
      return;
    }

    if (endMin <= startMin) {
      setValidationError('End time must be after the start time.');
      return;
    }

    const selectedDay = daysInfo[newEventDay];
    if (!selectedDay) return;
    const targetDateStr = getLocalDateString(selectedDay.fullDate);

    const newEv: Partial<Task> = {
      title: newEventTitle.trim(),
      energy: newEventEnergy,
      duration: `${endMin - startMin}m`,
      gravity: 50,
      completed: false,
      startTime: newEventStart,
      endTime: newEventEnd,
      date: targetDateStr
    };

    await createTask(newEv);
    setIsAddingEvent(false);
    setNewEventTitle('');
    setValidationError(null);
  };

  // Quick Inline Click to create an event at specific hour/day
  const handleCellClickAndNew = (dayIdx: number, hour: number) => {
    setNewEventDay(dayIdx);
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    setNewEventStart(`${formattedHour}:00`);
    setNewEventEnd(`${hour + 1 < 10 ? `0${hour + 1}` : `${hour + 1}`}:00`);
    setIsAddingEvent(true);
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTask(id);
  };

  // Add customized task to selected day column
  const handleCreateTask = async (e: React.FormEvent, dayIdx: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const selectedDay = daysInfo[dayIdx];
    if (!selectedDay) return;
    const targetDateStr = getLocalDateString(selectedDay.fullDate);

    const newTask: Partial<Task> = {
      title: newTaskTitle.trim(),
      energy: newTaskEnergy,
      duration: newTaskDuration,
      gravity: 50,
      completed: false,
      date: targetDateStr
    };

    await createTask(newTask);
    setNewTaskTitle('');
    setIsAddingTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    setHoveredTask(null);
  };

  // Hover position helper for tooltip display
  const showTaskTooltip = (task: WeekTask, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTask(task);
    setHoveredTaskPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 36
    });
  };

  return (
    <div className="w-full flex-grow flex flex-col h-full bg-[var(--tempo-bg-primary)] text-[var(--tempo-text-primary)] relative select-none">
      
      {/* Styles Injection block containing typography mappings and animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');

        :root:not(.paper-light):not(.forest-green) {
          --tempo-bg-primary: #0D0D0F;
          --tempo-bg-secondary: #141416;
          --tempo-bg-tertiary: #1C1C1F;
          --tempo-border: #2A2A2D;
          --tempo-border-hover: #3D3D42;
          --tempo-accent-blue: var(--color-accent, #3b82f6);
          --tempo-accent-purple: #8B5CF6;
          --tempo-accent-green: #34D399;
          --tempo-accent-amber: #FBBF24;
          --tempo-accent-coral: #FB7185;
          --tempo-accent-teal: #2DD4BF;
          --tempo-text-primary: #F1F1F1;
          --tempo-text-secondary: #8A8A90;
          --tempo-text-muted: #4A4A52;
        }

        .font-serif-dm {
          font-family: 'DM Serif Display', Georgia, serif;
        }

        .font-sans-dm {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .font-mono-jb {
          font-family: 'JetBrains Mono', Courier, monospace;
        }

        /* Hover event dynamic actions panel scaling transition */
        .event-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .event-card:hover {
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--tempo-border-hover);
          background-color: var(--tempo-bg-tertiary) !important;
        }

        /* Hover empty grid block target overlay */
        .grid-cell-interactive {
          position: relative;
          cursor: pointer;
        }
        
        .grid-cell-interactive::before {
          content: '+';
          position: absolute;
          inset: 4px;
          border: 1px dashed var(--tempo-border);
          background-color: rgba(255,255,255,0.01);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--tempo-text-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.1s ease;
          pointer-events: none;
        }

        .grid-cell-interactive:hover::before {
          opacity: 1;
        }

        /* Custom Scrollbar for Timeblock section */
        .scroll-custom::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scroll-custom::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.01);
        }
        
        .scroll-custom::-webkit-scrollbar-thumb {
          background: var(--tempo-border);
          border-radius: 4px;
        }
        
        .scroll-custom::-webkit-scrollbar-thumb:hover {
          background: var(--tempo-border-hover);
        }

        /* Gravity Pulse Keyframes applied to High Load Visual components */
        @keyframes gravity-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(251,113,133,0); }
          50%      { box-shadow: 0 0 0 6px rgba(251,113,133,0.25); }
        }

        .pulse-coral-indicator {
          animation: gravity-pulse 2s infinite ease-in-out;
        }
      `}</style>

      {/* HEADER SECTION */}
      <header className="px-6 py-4 border-b border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0 font-sans-dm shadow-sm">
        
        {/* Navigation Month & Arrows */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button 
              title="Previous Week" 
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-2 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] hover:bg-[var(--tempo-bg-tertiary)] hover:border-[var(--tempo-border-hover)] text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-serif-dm font-normal text-[var(--tempo-text-primary)] tracking-tight px-2 min-w-[130px] text-center">
              {currentMonthYearStr}
            </h1>
            <button 
              title="Next Week" 
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-2 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] hover:bg-[var(--tempo-bg-tertiary)] hover:border-[var(--tempo-border-hover)] text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setWeekOffset(0)} 
            className="px-3.5 py-2 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] text-xs font-medium text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] hover:bg-[var(--tempo-bg-tertiary)] transition-all cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Segment Switchers */}
        <div className="flex bg-[var(--tempo-bg-primary)] p-0.5 rounded-lg border border-[var(--tempo-border)] w-fit self-start lg:self-auto">
          {['Day', 'Week', 'Month'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Day' && onViewChange) onViewChange('day');
                if (tab === 'Month' && onViewChange) onViewChange('month');
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all relative ${
                tab === 'Week' 
                  ? 'text-[var(--tempo-text-primary)]' 
                  : 'text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] cursor-pointer'
              }`}
            >
              {tab}
              {tab === 'Week' && (
                <span className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-[var(--tempo-accent-blue)] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Legend Indicator & Add Trigger */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          
          {/* Mapping custom dots for colors */}
          <div className="flex items-center gap-3.5 bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)] px-3 py-2 rounded-lg text-[11px] font-mono-jb shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor('deep') }} />
              <span className="text-[11px] text-[var(--tempo-text-secondary)] font-sans-dm">Deep</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor('light') }} />
              <span className="text-[11px] text-[var(--tempo-text-secondary)] font-sans-dm">Light</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor('admin') }} />
              <span className="text-[11px] text-[var(--tempo-text-secondary)] font-sans-dm">Admin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor('creative') }} />
              <span className="text-[11px] text-[var(--tempo-text-secondary)] font-sans-dm">Creative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor('social') }} />
              <span className="text-[11px] text-[var(--tempo-text-secondary)] font-sans-dm">Social</span>
            </div>
          </div>

          <button
            onClick={() => setIsAddingEvent(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--tempo-accent-blue)] to-[var(--tempo-accent-purple)] text-xs font-semibold text-white hover:opacity-90 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>

      </header>

      {/* CENTRAL SCROLLABLE 7-COLUMN TIMELINE CONTENT CHASSIS */}
      <div className="flex-grow overflow-x-auto scroll-custom flex flex-col bg-[var(--tempo-bg-primary)]">
        
        {/* Weekly Area Layout Wrapper (Forces desktop comfortable min-width) */}
        <div className="min-w-[1200px] flex-grow flex flex-col relative">

          {/* GRID HEADERS ROW (STICKY) */}
          <div className="sticky top-0 z-30 flex bg-[var(--tempo-bg-secondary)] border-b border-[var(--tempo-border)] select-none font-sans-dm shadow-md shrink-0">
            
            {/* Hour labels spaceholder */}
            <div className="w-[64px] shrink-0 border-r border-[var(--tempo-border)] flex items-center justify-center text-[10px] text-[var(--tempo-text-muted)] font-mono-jb">
              UTC
            </div>

            {/* 7 Columns titles headers */}
            <div className="flex-grow grid grid-cols-7 divide-x divide-[var(--tempo-border)]">
              {daysInfo.map((day, dIdx) => (
                <div 
                  key={day.name} 
                  className="p-3 flex flex-col justify-between items-center text-center relative overflow-hidden group min-h-[90px]"
                >
                  {/* Dominican energy faint top absolute badge banner */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[4px]" 
                    style={{ backgroundColor: getEnergyColor(day.dominantEnergy as EnergyType) }}
                  />

                  {/* Faint overlay strip 40px top dominancy */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[40px] opacity-10 pointer-events-none"
                    style={{ backgroundColor: getEnergyColor(day.dominantEnergy as EnergyType) }}
                  />

                  <div className="flex flex-col items-center select-none gap-0.5">
                    <span className="text-[10px] font-mono-jb text-[var(--tempo-text-muted)] uppercase tracking-wider">
                      {day.name}
                    </span>

                    {/* Date Accent highlight box for TODAY */}
                    {day.isToday ? (
                      <div className="w-8 h-8 rounded-full bg-[var(--tempo-accent-blue)] flex items-center justify-center font-bold text-sm text-white shadow-md select-none mt-0.5">
                        {day.date}
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-[var(--tempo-text-primary)] mt-0.5">
                        {day.date}
                      </span>
                    )}
                  </div>

                  {/* Template Day Badge under date */}
                  {day.template ? (
                    <span className="mt-1.5 text-[9px] font-medium px-2 py-0.5 rounded bg-[var(--tempo-bg-tertiary)] text-[var(--tempo-accent-purple)] border border-[var(--tempo-accent-purple)]/20 truncate max-w-full">
                      {day.template}
                    </span>
                  ) : day.isRest ? (
                    <span className="mt-1.5 text-[9px] font-medium px-2 py-0.5 rounded bg-white/5 text-[var(--tempo-text-secondary)] border border-white/5 truncate max-w-full italic">
                      Rest Block
                    </span>
                  ) : (
                    <span className="mt-1.5 text-[9px] opacity-0 group-hover:opacity-100 duration-150 text-[var(--tempo-text-muted)] font-mono-jb truncate max-w-full">
                      {day.description}
                    </span>
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* MASTER GRID CONTENT WORKSPACE (7 Columns + Timelines side block) */}
          <div className="flex-grow flex relative scroll-custom overflow-y-auto" style={{ height: '580px' }}>
            
            {/* Left timeline hourly labels column */}
            <div className="w-[64px] shrink-0 border-r border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] select-none relative">
              {timeLabels.map((time, idx) => (
                <div 
                  key={time.hour} 
                  className="flex flex-col justify-start pt-1.5 items-center font-mono-jb text-[10px] text-[var(--tempo-text-muted)] relative border-b border-transparent"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <span className="sticky left-0 bg-[var(--tempo-bg-primary)] px-1">
                    {time.label}
                  </span>
                </div>
              ))}

              {/* Floating Indicator label inside timeline column */}
              <div 
                className="absolute right-1 bg-[var(--tempo-accent-coral)] text-white text-[9px] font-semibold font-mono-jb px-1 py-0.5 rounded opacity-95 shadow-md pointer-events-none z-30"
                style={{ top: `${currentTimePosition - 8}px` }}
              >
                {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>

            {/* 7 Columns overlay canvas absolute wrapper container */}
            <div className="flex-grow grid grid-cols-7 divide-x divide-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] relative">
              
              {events.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none z-30">
                  <p className="text-xs text-[var(--tempo-text-muted)] bg-[var(--tempo-bg-secondary)]/90 border border-[var(--tempo-border)]/40 px-5 py-2.5 rounded-full shadow-lg backdrop-blur-sm">
                    No events this week. Click a time slot to add one.
                  </p>
                </div>
              )}
              
              {/* background grids horizontal lines */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {timeLabels.map((time, idx) => (
                  <div key={time.hour} className="relative" style={{ height: `${ROW_HEIGHT}px` }}>
                    {/* Hour dividing line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-[var(--tempo-border)]" />
                    {/* Mid half-hour dot divide */}
                    <div className="absolute bottom-[32px] left-0 right-0 h-[0.5px] bg-[var(--tempo-border)] opacity-30 border-dashed" />
                  </div>
                ))}
              </div>

              {/* Loop rendering each core column details */}
              {daysInfo.map((day, dIdx) => (
                <div 
                  key={`col-${day.name}`} 
                  className="relative h-full flex flex-col justify-between"
                  style={{ 
                    background: day.gradient,
                  }}
                >
                  
                  {/* Empty cell interactive overlay blocks for hour creation */}
                  <div className="absolute inset-0 z-0">
                    {timeLabels.map(time => (
                      <div 
                        key={`cell-${dIdx}-${time.hour}`}
                        onClick={() => handleCellClickAndNew(dIdx, time.hour)}
                        className="grid-cell-interactive"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      />
                    ))}
                  </div>

                  {/* SPECIAL REST DAY INFO BOX (Sunday center) */}
                  {day.isRest && (
                    <div className="absolute inset-x-4 top-1/4 translate-y-1/2 p-4 rounded-xl border border-dashed border-[var(--tempo-border)] bg-white/[0.01] flex flex-col items-center justify-center text-center select-none z-10">
                      <Heart className="w-5 h-5 text-[var(--tempo-accent-coral)] opacity-60 mb-2" />
                      <span className="text-xs font-semibold text-[var(--tempo-text-secondary)]">Rest Day</span>
                      <p className="text-[10px] text-[var(--tempo-text-muted)] mt-1 max-w-[120px]">
                        No active work events planned for Sunday. Re-energize.
                      </p>
                    </div>
                  )}

                  {/* SPECIAL TODAY CURRENT TIME LINE (Friday index = 4) */}
                  {day.isToday && (
                    <div 
                      className="absolute left-0 right-0 flex items-center z-25 pointer-events-none"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      {/* Left side focal point marker */}
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--tempo-accent-coral)] absolute -left-[3px] shrink-0 pulse-coral-indicator bg-red-400 font-bold" />
                      <span className="flex-grow h-[1px] bg-[var(--tempo-accent-coral)]/80" />
                    </div>
                  )}

                  {/* RENDER EVENT CARDS absolutamente nested */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {processedEvents
                      .filter(ev => ev.dayIndex === dIdx)
                      .map(ev => {
                        const baseColor = getEnergyColor(ev.energy);
                        const isCompact = ev.durationMins < 45;
                        const cardHeight = Math.max(26, ev.height - 4);
                        const isStretched = (ev.height - 4) < 26;

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              // Let click show edit panel
                              e.stopPropagation();
                              setNewEventDay(ev.dayIndex);
                              setNewEventTitle(ev.title);
                              setNewEventStart(ev.startTime);
                              setNewEventEnd(ev.endTime);
                              setNewEventEnergy(ev.energy);
                              setIsAddingEvent(true);
                            }}
                            title={`${ev.title}\nTime: ${ev.startTime} – ${ev.endTime}\nFocus: ${getEnergyLabel(ev.energy)}`}
                            className={`event-card absolute pointer-events-auto cursor-pointer rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] overflow-hidden flex transition-all duration-150 group px-2 select-none ${
                              isCompact ? 'items-center py-1' : 'flex-col py-1.5 justify-between'
                            }`}
                            style={{
                              top: `${ev.top + 2}px`,
                              height: `${cardHeight}px`,
                              borderLeft: `3px solid ${baseColor}`,
                              background: `linear-gradient(to bottom, ${baseColor}10, ${baseColor}10), var(--tempo-bg-secondary)`,
                              left: ev.isSecondary ? '50%' : '4px',
                              width: ev.hasOverlap ? 'calc(50% - 6px)' : 'calc(100% - 8px)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                              zIndex: isStretched ? 20 : 10
                            }}
                          >
                            {isCompact ? (
                              <div className="flex items-center justify-between w-full min-w-0 h-full relative">
                                <div className="flex items-center gap-1.5 min-w-0 pr-5">
                                  <span className="text-[11px] font-bold font-sans-dm text-[var(--tempo-text-primary)] truncate">
                                    {ev.title}
                                  </span>
                                  {cardHeight >= 24 && (
                                    <span className="text-[9px] font-mono-jb text-[var(--tempo-text-secondary)] shrink-0 opacity-80">
                                      · {ev.startTime}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(ev.id, e);
                                  }}
                                  title="Delete Event"
                                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[var(--tempo-text-muted)] hover:text-[var(--tempo-accent-coral)] bg-[var(--tempo-bg-secondary)] hover:bg-[var(--tempo-bg-tertiary)] cursor-pointer ease-out duration-100 z-10 shadow-sm border border-[var(--tempo-border)]/30"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col min-w-0 h-full justify-between w-full">
                                <div className="flex flex-col min-w-0">
                                  {/* Header & Category marker */}
                                  <div className="flex items-center justify-between gap-1 select-none">
                                    <span className="text-[9px] font-bold font-mono-jb uppercase scale-90 origin-left" style={{ color: baseColor }}>
                                      {getEnergyLabel(ev.energy)}
                                    </span>

                                    {/* Overlapping Count Badge */}
                                    {ev.hasOverlap && (
                                      <span className="text-[8px] font-bold font-sans-dm bg-[var(--tempo-accent-coral)]/20 text-[var(--tempo-accent-coral)] px-1 py-0.2 rounded border border-[var(--tempo-accent-coral)]/30 shrink-0 select-none animate-pulse">
                                        Conflicting
                                      </span>
                                    )}
                                  </div>

                                  {/* Title description standard size limits */}
                                  <span className="text-[11px] font-semibold font-sans-dm leading-tight mt-0.5 text-[var(--tempo-text-primary)] truncate block">
                                    {ev.title}
                                  </span>
                                </div>

                                {/* Bottom stats if duration allows */}
                                <div className="flex items-center justify-between select-none border-t border-[var(--tempo-border)]/20 pt-1 mt-1 shrink-0">
                                  <span className="text-[9px] font-mono-jb text-[var(--tempo-text-secondary)]">
                                    {ev.startTime} – {ev.endTime}
                                  </span>

                                  {/* Deletion visual button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(ev.id, e);
                                    }}
                                    title="Delete Event"
                                    className="text-[var(--tempo-text-muted)] hover:text-[var(--tempo-accent-coral)] p-0.5 rounded hover:bg-white/5 cursor-pointer ease-out duration-100 z-10"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* DEDICATED TASKS CHIP ROW - PLACED AT THE BOTTOM */}
          <div className="border-t border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] py-3 px-4 z-20 shrink-0 font-sans-dm select-none flex flex-col gap-2">
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] font-bold text-[var(--tempo-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Calendar className="w-4 h-4 text-[var(--tempo-accent-blue)]" />
                Tasks Board Chips
              </span>
              <span className="text-[10px] font-mono-jb text-[var(--tempo-text-muted)] select-none">
                Hover to audit task focus duration
              </span>
            </div>

            <div className="grid grid-cols-7 divide-x divide-[var(--tempo-border)] -mx-4 border-t border-[var(--tempo-border)] pt-2 select-none">
              {daysInfo.map((day, dIdx) => {
                const dayTasks = weeklyTasks.filter(t => t.dayIndex === dIdx);
                const maxVisible = 2;
                const visibleTasks = dayTasks.slice(0, maxVisible);
                const hasMore = dayTasks.length > maxVisible;
                const overflowCount = dayTasks.length - maxVisible;

                return (
                  <div key={`task-slot-${dIdx}`} className="px-3 py-1 flex flex-col gap-1.5 relative group">
                    
                    <div className="flex flex-wrap gap-1 items-center relative">
                      {visibleTasks.map(task => (
                        <div
                          key={task.id}
                          onMouseEnter={(e) => showTaskTooltip(task, e)}
                          onMouseLeave={() => setHoveredTask(null)}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] text-[11px] max-w-full truncate hover:border-[var(--tempo-border-hover)] hover:bg-[var(--tempo-bg-primary)] transition-all cursor-help"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getEnergyColor(task.energy) }} />
                          <span className="truncate text-[var(--tempo-text-secondary)] hover:text-white">
                            {task.title}
                          </span>
                        </div>
                      ))}

                      {/* Display +N items count wrapper */}
                      {hasMore && (
                        <div 
                          title={`${overflowCount} additional tasks on this day. Hover to review.`}
                          className="px-1.5 py-0.5 rounded bg-[var(--tempo-accent-coral)]/10 border border-[var(--tempo-accent-coral)]/30 text-[9px] text-[var(--tempo-accent-coral)] font-bold scale-95"
                        >
                          +{overflowCount} more
                        </div>
                      )}
                    </div>

                    {/* Inline Task adder quick focal icon */}
                    <button
                      onClick={() => setIsAddingTask(dIdx)}
                      className="text-[10px] text-[var(--tempo-text-muted)] hover:text-[var(--tempo-accent-blue)] flex items-center justify-center py-0.5 border border-dashed border-[var(--tempo-border)] hover:border-[var(--tempo-border-hover)] rounded mt-1 bg-none cursor-pointer"
                    >
                      + Add Task
                    </button>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* FOOTER ENERGY LOAD PROGRESS SUMMARY */}
      <footer className="p-4 border-t border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] select-none font-sans-dm shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Dynamic loads segmentation tracking */}
        <div className="flex-grow max-w-xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-bold text-[var(--tempo-text-secondary)] uppercase tracking-wider">
              Total Weekly Energy Loaded Allocation
            </span>
            <span className="text-[10px] font-mono-jb">
              Calculated Total: {totalSummedHours.toFixed(1)} hrs
            </span>
          </div>

          {/* Segmented Master loading bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)] my-0.5 gap-0.5">
            {(['deep', 'light', 'social', 'admin', 'creative'] as const).map(cat => {
              const cap = activeHoursByCategory[cat] || 0;
              const percentage = totalSummedHours > 0 ? (cap / totalSummedHours) * 100 : 0;
              if (percentage <= 0) return null;

              return (
                <div
                  key={cat}
                  title={`${getEnergyLabel(cat)} focused load: ${cap.toFixed(1)} hrs (${percentage.toFixed(0)}%)`}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getEnergyColor(cat)
                  }}
                  className="h-full hover:opacity-80 transition-all first:rounded-l-full last:rounded-r-full"
                />
              );
            })}
          </div>

          {/* Segment stats with text indicators */}
          <div className="flex flex-wrap gap-[12px] mt-1">
            {(['deep', 'light', 'social', 'admin', 'creative'] as const).map(cat => {
              const cap = activeHoursByCategory[cat];
              return (
                <div key={cat} className="flex items-center gap-1.5 select-none animate-fadeIn">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor(cat) }} />
                  <span className="text-[11px] text-[var(--tempo-text-secondary)] font-medium capitalize">
                    {cat}
                  </span>
                  <span className="text-[11px] font-mono-jb text-[var(--tempo-text-muted)] font-bold">
                    {cap.toFixed(0)}h
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Total stats progress tracker card limits */}
        <div className="p-4 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-xl shrink-0 select-none flex flex-col gap-1 min-w-[220px]">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--tempo-text-secondary)] font-medium">Weekly Capacity Scope</span>
            <span className="text-[10px] font-bold bg-[var(--tempo-accent-green)]/10 text-[var(--tempo-accent-green)] border border-[var(--tempo-accent-green)]/20 px-1.5 py-0.2 rounded">
              A-Grade
            </span>
          </div>

          <div className="text-2xl font-serif-dm font-normal text-[var(--tempo-text-primary)] mt-1 select-none">
            26h <span className="text-xs font-mono-jb text-[var(--tempo-text-muted)]">/ 40h max recommended</span>
          </div>

          {/* Faint micro bar capacity */}
          <div className="w-full bg-[var(--tempo-bg-primary)] h-1.5 rounded-full overflow-hidden border border-[var(--tempo-border)] mt-1.5">
            <div className="h-full bg-gradient-to-r from-[var(--tempo-accent-blue)] to-[var(--tempo-accent-green)] rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

      </footer>

      {/* POPUP: QUICK NEW EVENT / EDIT OVERLAY PANEL */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="w-full max-w-[420px] bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-2xl p-6 shadow-2xl select-none font-sans-dm">
            
            <div className="flex justify-between items-center pb-3 border-b border-[var(--tempo-border)] mb-4">
              <h2 className="text-lg font-serif-dm text-[var(--tempo-text-primary)]">
                Create Schedule Block
              </h2>
              <button 
                onClick={() => { setIsAddingEvent(false); setValidationError(null); }}
                className="p-1 rounded text-[var(--tempo-text-secondary)] hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {validationError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--tempo-accent-coral)]/10 border border-[var(--tempo-accent-coral)]/20 text-xs text-[var(--tempo-accent-coral)] flex items-start gap-2 animate-[shake_0.2s_ease-in-out]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleAddNewEvent} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="event-pop-title" className="text-xs text-[var(--tempo-text-secondary)]">Event Title Input</label>
                <input
                  id="event-pop-title"
                  type="text"
                  required
                  placeholder="e.g., Code review PR"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[var(--tempo-accent-blue)] text-[var(--tempo-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-pop-day" className="text-xs text-[var(--tempo-text-secondary)]">Weekly Day Target</label>
                  <select
                    id="event-pop-day"
                    value={newEventDay}
                    onChange={(e) => setNewEventDay(Number(e.target.value))}
                    className="w-full bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg p-2 text-xs focus:outline-none text-[var(--tempo-text-primary)]"
                  >
                    {daysInfo.map((day, idx) => (
                      <option key={day.name} value={idx}>{day.name} ({day.date} {day.monthName})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-pop-energy" className="text-xs text-[var(--tempo-text-secondary)]">Focus Energy Type</label>
                  <select
                    id="event-pop-energy"
                    value={newEventEnergy}
                    onChange={(e) => setNewEventEnergy(e.target.value as EnergyType)}
                    className="w-full bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg p-2 text-xs focus:outline-none text-[var(--tempo-text-primary)] animate-pulse-once"
                  >
                    <option value="deep">🟣 Deep Focus</option>
                    <option value="light">🔵 Light Work</option>
                    <option value="admin">🟡 Admin Input</option>
                    <option value="creative">🔴 Creative Scope</option>
                    <option value="social">🟢 Social Input</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-pop-start" className="text-xs text-[var(--tempo-text-secondary)]">Start Block Hour</label>
                  <input
                    id="event-pop-start"
                    type="time"
                    required
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg p-2 text-xs focus:outline-none text-[var(--tempo-text-primary)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-pop-end" className="text-xs text-[var(--tempo-text-secondary)]">End Block Hour</label>
                  <input
                    id="event-pop-end"
                    type="time"
                    required
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg p-2 text-xs focus:outline-none text-[var(--tempo-text-primary)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--tempo-accent-blue)] to-[var(--tempo-accent-purple)] text-xs font-semibold text-white mt-2 hover:opacity-95 transition-all cursor-pointer shadow-lg"
              >
                Position Schedule Block Card
              </button>

            </form>
          </div>
        </div>
      )}

      {/* POPUP: TASK INLINE ADDER */}
      {isAddingTask !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.1s_ease-out]">
          <div className="w-full max-w-[360px] bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-2xl p-5 shadow-2xl select-none font-sans-dm">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--tempo-border)] mb-3">
              <span className="text-sm font-semibold text-[var(--tempo-text-primary)]">
                Add Task for {daysInfo[isAddingTask].name}
              </span>
              <button 
                onClick={() => setIsAddingTask(null)}
                className="p-1 rounded text-[var(--tempo-text-secondary)] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCreateTask(e, isAddingTask)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="task-pop-title" className="text-[11px] text-[var(--tempo-text-secondary)]">Task Title</label>
                <input
                  id="task-pop-title"
                  type="text"
                  required
                  placeholder="e.g. Audit API Schema"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-9 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg px-2.5 text-xs focus:outline-none text-[var(--tempo-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <label htmlFor="task-pop-duration" className="text-[11px] text-[var(--tempo-text-secondary)]">Duration Scope</label>
                  <input
                    id="task-pop-duration"
                    type="text"
                    required
                    placeholder="e.g. 15m or 1h"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    className="w-full h-8 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg px-2 text-xs focus:outline-none text-[var(--tempo-text-primary)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="task-pop-energy" className="text-[11px] text-[var(--tempo-text-secondary)]">Focus Load</label>
                  <select
                    id="task-pop-energy"
                    value={newTaskEnergy}
                    onChange={(e) => setNewTaskEnergy(e.target.value as EnergyType)}
                    className="w-full h-8 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-lg px-2 text-xs focus:outline-none text-[var(--tempo-text-primary)]"
                  >
                    <option value="deep">🟣 Deep</option>
                    <option value="light">🔵 Light</option>
                    <option value="admin">🟡 Admin</option>
                    <option value="creative">🔴 Creative</option>
                    <option value="social">🟢 Social</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[var(--tempo-accent-blue)] text-white text-xs font-semibold mt-1.5 transition-all cursor-pointer"
              >
                Add Chip
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADVANCED FLOATING TOOLTIP FOR TASK AUDITS */}
      {hoveredTask && hoveredTaskPosition && (
        <div 
          className="fixed z-50 bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-lg px-3 py-2 shadow-2xl pointer-events-none select-none animate-fadeIn flex flex-col gap-1 font-sans-dm"
          style={{
            left: `${hoveredTaskPosition.x}px`,
            top: `${hoveredTaskPosition.y - 12}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Focal tail pin element */}
          <div className="absolute left-1/2 -bottom-[5px] -translate-x-1/2 w-2.5 h-2.5 bg-[var(--tempo-bg-secondary)] border-b border-r border-[var(--tempo-border)] rotate-45" />

          {/* Core metadata display */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor(hoveredTask.energy) }} />
            <span className="text-[11px] font-bold text-[var(--tempo-text-primary)] tracking-wide">
              {hoveredTask.title}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4 text-[9px] font-mono-jb text-[var(--tempo-text-secondary)]">
            <span className="uppercase">Focus: {getEnergyLabel(hoveredTask.energy)}</span>
            <span>Duration: {hoveredTask.duration}</span>
          </div>
        </div>
      )}

    </div>
  );
}
