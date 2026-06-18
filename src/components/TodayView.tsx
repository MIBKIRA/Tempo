import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, Check, Flame, ChevronDown, ChevronUp, Clock, Plus, Activity,
  Trash2, Edit3, CheckCircle, PlusCircle, AlertTriangle, Play, HelpCircle, LogOut,
  Calendar
} from 'lucide-react';
import { Task, Intention, Habit, TimeBlock, EnergyType, ItemType } from '../types';
import { useNow } from '../useNow';
import { useTasksData } from '../TasksContext';
import { useHabits } from '../contexts/HabitsContext';
import { useMorningIntentions } from '../hooks/useMorningIntentions';
import MorningIntentionsModal from './MorningIntentionsModal';

// TIMELINE MATH & HELPER CONSTANTS & FUNCTIONS
// Timeline ranges from 6:00 AM to 10:00 PM (16 hours).
// Total pixels = 16 hours * 60px/hour = 960px height. This makes 1 minute = 1 pixel.
const TIMELINE_START_HOUR = 6;
const HOUR_HEIGHT = 60; // 60px per hour

export const ENERGY_TYPES = [
  { value: 'deep', label: 'Deep', fullName: 'Deep Focus', emoji: '🟣', color: 'var(--color-deep, #8B5CF6)' },
  { value: 'light', label: 'Light', fullName: 'Light Work', emoji: '🔵', color: 'var(--color-light, #60A5FA)' },
  { value: 'admin', label: 'Admin', fullName: 'Admin/Inbox', emoji: '🟡', color: 'var(--color-admin, #FBBF24)' },
  { value: 'creative', label: 'Creative', fullName: 'Creative Scope', emoji: '🔴', color: 'var(--color-creative, #FB7185)' },
  { value: 'social', label: 'Social', fullName: 'Social Input', emoji: '🟢', color: 'var(--color-social, #2DD4BF)' },
] as const;

const timeToMinutesFromStart = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMins = hours * 60 + minutes;
  const startMins = TIMELINE_START_HOUR * 60;
  return totalMins - startMins;
};

interface TodayViewProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  onStartFocusMode?: (task: Task) => void;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TodayView({ userEmail, userName, onLogout, onViewChange, onStartFocusMode, tasks: propsTasks, setTasks: propsSetTasks }: TodayViewProps) {
  const { tasks, createTask, updateTask, completeTask, deleteTask, syncStatus, lastSynced, useLocalFallback } = useTasksData();
  const {
    habits: dbHabits,
    todayLogs,
    checkIn,
    uncheckIn,
    getStreak,
    getCompletionRate,
    getOverallStreak
  } = useHabits();
  const now = useNow();

  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    if (!lastSynced) {
      setTimeAgo('Never');
      return;
    }

    const updateText = () => {
      const diffMs = Date.now() - lastSynced.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 10) {
        setTimeAgo('Just now');
      } else if (diffSecs < 60) {
        setTimeAgo(`${diffSecs}s ago`);
      } else if (diffMins === 1) {
        setTimeAgo('1 minute ago');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        if (hours === 1) {
          setTimeAgo('1 hour ago');
        } else {
          setTimeAgo(`${hours} hours ago`);
        }
      }
    };

    updateText();
    const interval = setInterval(updateText, 10000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  // 1. STATE MANAGEMENT
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(() => {
    const running = localStorage.getItem("tempo-active-timer-running") === "true";
    return running ? localStorage.getItem("tempo-active-timer-task-id") : null;
  });

  useEffect(() => {
    const handleActiveSessionChanged = () => {
      const running = localStorage.getItem("tempo-active-timer-running") === "true";
      const taskId = running ? localStorage.getItem("tempo-active-timer-task-id") : null;
      setActiveTimerTaskId(taskId);
    };
    window.addEventListener("tempo-active-session-changed", handleActiveSessionChanged);
    return () => window.removeEventListener("tempo-active-session-changed", handleActiveSessionChanged);
  }, []);

  const [taskFilter, setTaskFilter] = useState<'all' | EnergyType>('all');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEnergy, setNewTaskEnergy] = useState<EnergyType>('deep');
  const [newTaskDuration, setNewTaskDuration] = useState('30m');

  // Schedule extra states for left panel task creation
  const [scheduleIt, setScheduleIt] = useState(false);
  const [scheduleStart, setScheduleStart] = useState('10:00');
  const [scheduleEnd, setScheduleEnd] = useState('11:00');

  // Global editing state & form fields
  const [editingItem, setEditingItem] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEnergy, setEditEnergy] = useState<EnergyType>('deep');
  const [editType, setEditType] = useState<'task' | 'scheduled_task' | 'event'>('task');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editGravity, setEditGravity] = useState(50);
  const [editDuration, setEditDuration] = useState('30m');
  const [editNotes, setEditNotes] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);

  // Inline delete confirmation state inside left panel
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | number | null>(null);

  // Morning Intentions State
  const { intentionsRow, showModal, setShowModal, userId, userName: intentionUserName, saveIntentions, skipIntentions } = useMorningIntentions();
  const [intentionsMessage, setIntentionsMessage] = useState<string | null>(null);

  const activeIntentions = useMemo(() => {
    if (!intentionsRow) return [];
    const list: Intention[] = [];
    if (intentionsRow.priority_1) {
      list.push({ id: 1, text: intentionsRow.priority_1, energy: 'admin' });
    }
    if (intentionsRow.priority_2) {
      list.push({ id: 2, text: intentionsRow.priority_2, energy: 'light' });
    }
    if (intentionsRow.priority_3) {
      list.push({ id: 3, text: intentionsRow.priority_3, energy: 'social' });
    }
    return list;
  }, [intentionsRow]);

  // Habits State (collapsed by default)
  const [habitsExpand, setHabitsExpand] = useState(false);

  const getLocalDateString = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateString(now);

  // Time Blocks are derived dynamically from the unified tasks array for today's date
  const blocks = React.useMemo<(TimeBlock & { type?: ItemType })[]>(() => {
    return tasks
      .filter(t => {
        const isDateMatch = t.date === todayStr;
        const type = t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'event');
        return isDateMatch && (type === 'scheduled_task' || type === 'event') && t.startTime && t.endTime;
      })
      .map(t => ({
        id: t.id,
        title: t.title,
        startTime: t.startTime!,
        endTime: t.endTime!,
        energy: t.energy,
        notes: t.notes,
        completed: t.completed,
        type: t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'event')
      }));
  }, [tasks, todayStr]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => {
      const isDateMatch = t.date === todayStr;
      const type = t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'task');
      return isDateMatch && (type === 'task' || type === 'scheduled_task');
    });
  }, [tasks, todayStr]);

  const remainingTasksCount = useMemo(() => {
    return todayTasks.filter(t => !t.completed).length;
  }, [todayTasks]);

  const remainingEventsCount = useMemo(() => {
    return tasks.filter(t => {
      const isDateMatch = t.date === todayStr;
      const type = t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'event');
      return isDateMatch && type === 'event' && !t.completed;
    }).length;
  }, [tasks, todayStr]);

  const untimedEvents = useMemo(() => {
    return tasks.filter(t => {
      const isDateMatch = t.date === todayStr;
      const type = t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'event');
      return isDateMatch && type === 'event' && (!t.startTime || !t.endTime);
    });
  }, [tasks, todayStr]);

  // Filter tasks based on selected energy filter
  const filteredTasks = useMemo(() => {
    return todayTasks.filter(t => {
      if (taskFilter === 'all') return true;
      return t.energy === taskFilter;
    });
  }, [todayTasks, taskFilter]);

  useEffect(() => {
    localStorage.setItem("tempo-time-blocks", JSON.stringify(blocks));
  }, [blocks]);

  // Dynamically compute empty / vacant slots on the timeline where no blocks are scheduled
  const vacantSlots = React.useMemo(() => {
    const sortedBlocks = [...blocks].sort((a, b) => {
      return timeToMinutesFromStart(a.startTime) - timeToMinutesFromStart(b.startTime);
    });

    const slots: { start: string; end: string }[] = [];
    const MINUTES_IN_DAY_START = 0; // 06:00 is timeline start hour = 0 minutes relative
    const MINUTES_IN_DAY_END = 16 * 60; // 22:00 is 16 hours from 06:00 = 960 minutes relative

    const minutesToHHMM = (minsFromStart: number): string => {
      const totalMinutesFromMidnight = TIMELINE_START_HOUR * 60 + minsFromStart;
      const h = Math.floor(totalMinutesFromMidnight / 60);
      const m = totalMinutesFromMidnight % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    let currentMark = MINUTES_IN_DAY_START;

    for (const b of sortedBlocks) {
      const bStart = timeToMinutesFromStart(b.startTime);
      const bEnd = timeToMinutesFromStart(b.endTime);

      if (bStart > currentMark + 15) { // At least 15 mins of gap to be considered vacant
        slots.push({
          start: minutesToHHMM(currentMark),
          end: minutesToHHMM(bStart)
        });
      }
      currentMark = Math.max(currentMark, bEnd);
    }

    if (currentMark + 15 < MINUTES_IN_DAY_END) {
      slots.push({
        start: minutesToHHMM(currentMark),
        end: minutesToHHMM(MINUTES_IN_DAY_END)
      });
    }

    return slots;
  }, [blocks]);

  // Hover block popover/tooltip state
  const [hoveredBlockId, setHoveredBlockId] = useState<number | string | null>(null);
  
  // Custom dialog to add a block
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [addBlockType, setAddBlockType] = useState<'scheduled_task' | 'event'>('scheduled_task');
  const [addBlockTitle, setAddBlockTitle] = useState('');
  const [addBlockStart, setAddBlockStart] = useState('11:00');
  const [addBlockEnd, setAddBlockEnd] = useState('12:00');
  const [addBlockEnergy, setAddBlockEnergy] = useState<EnergyType>('deep');
  const [addBlockNotes, setAddBlockNotes] = useState('');
  const [addBlockError, setAddBlockError] = useState<string | null>(null);

  // 2. TIMELINE MATH & HELPER FUNCTIONS
  const getEnergyColor = (type: EnergyType): string => {
    const energy = ENERGY_TYPES.find(e => e.value === type);
    return energy ? energy.color : 'var(--color-creative, #FB7185)';
  };

  const formatEnergyName = (type: EnergyType): string => {
    const energy = ENERGY_TYPES.find(e => e.value === type);
    return energy ? energy.fullName : type;
  };

  // 3. HANDLERS
  const handleToggleTask = async (id: number | string) => {
    await completeTask(id);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Partial<Task> = {
      title: newTaskTitle.trim(),
      energy: newTaskEnergy,
      completed: false,
      date: getLocalDateString(now)
    };

    if (scheduleIt) {
      newTask.type = 'scheduled_task';
      newTask.startTime = scheduleStart;
      newTask.endTime = scheduleEnd;
      const startMin = timeToMinutesFromStart(scheduleStart);
      const endMin = timeToMinutesFromStart(scheduleEnd);
      newTask.duration = `${Math.abs(endMin - startMin)}m`;
      newTask.gravity = Math.floor(Math.random() * 40) + 50;
    } else {
      newTask.type = 'task';
      newTask.duration = newTaskDuration;
      newTask.gravity = Math.floor(Math.random() * 60) + 30; // Random score between 30 and 90
    }

    await createTask(newTask);
    setNewTaskTitle('');
    setScheduleIt(false);
  };

  const handleOpenEditModal = (item: Task) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditEnergy(item.energy);
    setEditType(item.type || (item.startTime && item.endTime ? 'scheduled_task' : 'task'));
    setEditDate(item.date || todayStr);
    setEditStartTime(item.startTime || '10:00');
    setEditEndTime(item.endTime || '11:00');
    setEditGravity(item.gravity ?? 50);
    setEditDuration(item.duration || '30m');
    setEditNotes(item.notes || '');
    setEditCompleted(item.completed || false);
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated: Partial<Task> = {
      title: editTitle.trim(),
      energy: editEnergy,
      type: editType,
      date: editDate,
      notes: editNotes.trim(),
      completed: editCompleted
    };

    if (editType === 'task') {
      updated.startTime = undefined;
      updated.endTime = undefined;
      updated.duration = editDuration;
      updated.gravity = editGravity;
    } else {
      updated.startTime = editStartTime;
      updated.endTime = editEndTime;
      const sMins = timeToMinutesFromStart(editStartTime);
      const eMins = timeToMinutesFromStart(editEndTime);
      updated.duration = `${Math.abs(eMins - sMins)}m`;
      updated.gravity = editGravity;
    }

    await updateTask(editingItem.id, updated);
    setEditingItem(null);
  };



  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBlockError(null);

    if (!addBlockTitle.trim()) {
      setAddBlockError('Please insert a title');
      return;
    }

    const startMin = timeToMinutesFromStart(addBlockStart);
    const endMin = timeToMinutesFromStart(addBlockEnd);

    if (startMin < 0 || endMin > 16 * 60) {
      setAddBlockError('Time chosen falls outside of 06:00 AM to 10:00 PM limits');
      return;
    }

    if (endMin <= startMin) {
      setAddBlockError('End time must come after Start time');
      return;
    }

    const durationMin = endMin - startMin;

    const newTask: Partial<Task> = {
      type: addBlockType,
      title: addBlockTitle.trim(),
      startTime: addBlockStart,
      endTime: addBlockEnd,
      energy: addBlockEnergy,
      notes: addBlockNotes.trim() || undefined,
      duration: `${durationMin}m`,
      gravity: 50,
      completed: false,
      date: getLocalDateString(now)
    };

    await createTask(newTask);
    setIsAddingBlock(false);
    setAddBlockTitle('');
    setAddBlockNotes('');
  };

  const handleDeleteBlock = async (id: number | string) => {
    await deleteTask(id);
    setHoveredBlockId(null);
  };

  const handleToggleCompleteBlock = async (id: number | string) => {
    await completeTask(id);
  };

  // Check for conflicts
  const isOverlapping = (block: TimeBlock): boolean => {
    const blockStart = timeToMinutesFromStart(block.startTime);
    const blockEnd = timeToMinutesFromStart(block.endTime);
    
    return blocks.some(b => {
      if (b.id === block.id) return false;
      const bStart = timeToMinutesFromStart(b.startTime);
      const bEnd = timeToMinutesFromStart(b.endTime);
      return (blockStart < bEnd && blockEnd > bStart);
    });
  };

  // CALCULATE ENERGY LOADS
  // Deep tasks: 60 + 45 = 105 mins. Blocks: 09:00-10:30 (90m), 14:00-15:30 (90m). Total = 180 mins deep = 4.5h initially.
  // Light: Lunch (60m), Read (60m) = 120 mins = 2.0h initially.
  // Admin: Triage (30m) + Task (10m + 15m) = 55 mins ~ 1.0h initially.
  // Social: Standup (30m) = 30 mins = 0.5h.
  // Let's compute actual block states dynamically based on the blocks state to show stunning reactivity!
  const getBlockDurationHours = (b: TimeBlock) => {
    const startMins = timeToMinutesFromStart(b.startTime);
    const endMins = timeToMinutesFromStart(b.endTime);
    return (endMins - startMins) / 60;
  };

  const dynamicEnergyLoads: Record<EnergyType, number> = blocks.reduce((acc, b) => {
    const hrs = getBlockDurationHours(b);
    acc[b.energy] = (acc[b.energy] || 0) + hrs;
    return acc;
  }, { deep: 0, light: 0, admin: 0, creative: 0, social: 0 } as Record<EnergyType, number>);

  const totalLoadHours: number = (Object.values(dynamicEnergyLoads) as number[]).reduce((a, b) => a + b, 0) || 1;

  // Percentage for load bar segments
  const getLoadPct = (type: EnergyType) => {
    return ((dynamicEnergyLoads[type] || 0) / totalLoadHours) * 100;
  };

  // Today current line position dynamically computed
  const currentTimeIndicatorPos = useMemo(() => {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const startMins = TIMELINE_START_HOUR * 60;
    return currentMins - startMins;
  }, [now]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[var(--tempo-bg-primary)]">
      
      <style>{`
        /* Smooth Custom scrollbars */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.01);
        }
        ::-webkit-scrollbar-thumb {
          background: #2A2A2D;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3D3D42;
        }

        /* Gravity pulse animation for high gravity flame button */
        .g-pulse-ring {
          animation: gravity-pulse 2s infinite ease-in-out;
        }

        @keyframes gravity-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 113, 133, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(251, 113, 133, 0);
          }
        }

        /* Ambient subtle pulse for NOW label chip */
        @keyframes now-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .now-chip-pulse {
          animation: now-pulse 2.5s infinite;
        }

        /* Task unchecked custom button effect */
        .task-circle {
          transition: border-color 0.15s, background-color 0.15s;
        }
        .task-row:hover .task-circle {
          border-color: var(--tempo-accent-blue);
          background-color: rgba(79, 142, 247, 0.05);
        }

        /* Popover tooltip animation */
        @keyframes pop-fade-in {
          from { opacity: 0; transform: translateY(4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .popover-detail {
          animation: pop-fade-in 0.15s ease-out forwards;
        }
      `}</style>

      {/* HEADER BAR */}
      <header className="h-[64px] border-b border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)]/95 px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Status Dot */}
          <span className={`inline-flex items-center justify-center p-0.5 rounded-full ${
            syncStatus === 'syncing' ? 'bg-amber-500/10' :
            syncStatus === 'error' ? 'bg-red-500/10' :
            useLocalFallback ? 'bg-white/5' : 'bg-emerald-500/10'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
              syncStatus === 'error' ? 'bg-red-500 animate-pulse' :
              useLocalFallback ? 'bg-gray-400' : 'bg-emerald-400'
            }`} />
          </span>

          <span className="text-sm font-sans font-light text-[var(--tempo-text-secondary)] hidden sm:block">
            {syncStatus === 'syncing' && (
              <span>Syncing database...</span>
            )}
            {syncStatus === 'error' && (
              <span className="text-red-400 font-medium">Sync issue (Offline)</span>
            )}
            {syncStatus === 'synced' && (
              <span>
                {useLocalFallback ? 'Saved to local' : `Last synced: ${timeAgo}`}
              </span>
            )}
          </span>
        </div>

        {/* View Mode Segment Switchers */}
        <div className="flex bg-[var(--tempo-bg-primary)] p-0.5 rounded-lg border border-[var(--tempo-border)] w-fit font-sans">
          <button
            onClick={() => onViewChange && onViewChange('day')}
            className="px-3.5 py-1 text-[11px] font-medium rounded-md text-[var(--tempo-text-primary)] relative transition-all"
          >
            Day
            <span className="absolute bottom-0 left-[25%] right-[25%] h-[1.5px] bg-[#4F8EF7] rounded-full" />
          </button>
          <button
            onClick={() => onViewChange && onViewChange('week')}
            className="px-3.5 py-1 text-[11px] font-medium rounded-md text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] cursor-pointer transition-all"
          >
            Week
          </button>
          <button
            onClick={() => onViewChange && onViewChange('month')}
            className="px-3.5 py-1 text-[11px] font-medium rounded-md text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] cursor-pointer transition-all"
          >
            Month
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Simulation indicators */}
          <div className="text-right hidden md:block">
            <span className="text-xs font-mono text-[var(--tempo-text-secondary)] block">{userName}</span>
            <span className="text-[10px] font-mono text-[var(--tempo-text-muted)] block">{userEmail}</span>
          </div>
          
          <button
            onClick={onLogout}
            title="Log Out authenticated session"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] hover:bg-[var(--tempo-bg-tertiary)] hover:border-[var(--tempo-border-hover)] text-xs text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </header>

      {/* DUAL WORKSPACE PANEL BODY - 30/70 SPLIT */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden w-full m-0 p-0">
        
        {/* LEFT PANEL (30% WIDTH, SCROLLABLE): Intention + Tasks + Habits */}
        <section id="panel-left" className="w-full md:w-[32%] lg:w-[30%] border-r border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] p-4 lg:p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
          
          {/* DATE HEADER BOX */}
          <div className="flex justify-between items-start select-none border-b border-[var(--tempo-border)]/40 pb-4">
            <div>
              <h2 className="text-3xl font-serif text-[var(--tempo-text-primary)] tracking-tight font-medium">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <div className="text-xs text-[var(--tempo-text-secondary)] font-sans mt-1.5 flex items-center gap-1.5">
                <span>{remainingTasksCount} {remainingTasksCount === 1 ? 'task' : 'tasks'} remaining</span>
                <span>•</span>
                <span>{remainingEventsCount} {remainingEventsCount === 1 ? 'event' : 'events'} left</span>
                <span>•</span>
                <span className="text-[#34D399] font-semibold">87% Active Energy</span>
              </div>
            </div>
            
            {/* Avatar display */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#4F8EF7] p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <span className="text-xs font-mono font-bold text-white uppercase select-none">
                AV
              </span>
            </div>
          </div>

          {/* MORNING INTENTIONS SECTION */}
          <div id="section-intentions" className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-xl p-4 flex flex-col gap-3.5">
            <div className="flex justify-between items-center select-none">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[var(--tempo-text-secondary)] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#FBBF24]" />
                Morning Intentions
              </span>
              {userId && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-xs font-sans text-[#4F8EF7] hover:underline cursor-pointer bg-none border-none outline-none"
                >
                  {activeIntentions.length > 0 ? 'Edit' : 'Set'}
                </button>
              )}
            </div>

            {/* Banner message feedback if updated */}
            {intentionsMessage && (
              <span className="text-[11px] font-mono text-[#34D399] bg-[#34D399]/5 border border-[#34D399]/10 py-1 px-2 rounded">
                ✓ {intentionsMessage}
              </span>
            )}

            <div className="flex flex-col gap-2.5">
              {activeIntentions.length === 0 ? (
                <div className="text-center py-2 text-xs text-[var(--tempo-text-muted)] font-medium">
                  No intentions set for today —{' '}
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-[#4F8EF7] hover:underline font-bold cursor-pointer"
                  >
                    [Set them now]
                  </button>
                </div>
              ) : (
                activeIntentions.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    {/* Number Badge with custom energy colored dots */}
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 font-bold"
                      style={{ 
                        backgroundColor: item.id === 1 ? '#F59E0B' : item.id === 3 ? '#EF4444' : getEnergyColor(item.energy),
                        color: item.id === 1 ? '#92400E' : '#FFFFFF'
                      }}
                    >
                      #{index + 1}
                    </div>

                    <span className="text-xs font-sans text-[var(--tempo-text-primary)] tracking-wide leading-relaxed truncate">
                      {item.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TASKS TODAYS VIEW */}
          <div id="section-tasks" className="flex flex-col gap-3">
            
            {/* Header + Filter elements */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[var(--tempo-text-secondary)] select-none">
                Tasks Today
              </span>
              
              <div className="flex justify-between items-center select-none gap-2">
                {/* Filter list */}
                <div className="flex gap-1 bg-[var(--tempo-bg-secondary)] p-0.5 rounded-lg border border-[var(--tempo-border)]">
                  {['all', ...ENERGY_TYPES.map(e => e.value)].map(f => (
                    <button
                      key={f}
                      onClick={() => setTaskFilter(f as any)}
                      className={`text-[10px] font-sans px-2.5 py-1 rounded-md transition-all cursor-pointer capitalize font-medium ${
                        taskFilter === f 
                          ? 'bg-[var(--tempo-bg-tertiary)] text-[var(--tempo-text-primary)] shadow-sm' 
                          : 'text-[var(--tempo-text-muted)] hover:text-[var(--tempo-text-secondary)]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-mono text-[var(--tempo-text-muted)]">
                  {filteredTasks.length} listed
                </span>
              </div>
            </div>

            {/* Quick Task Adder Form */}
            <div className="flex flex-col gap-2">
              <form onSubmit={handleAddTask} className="flex gap-2 p-1.5 rounded-xl border border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)]">
                <input
                  id="quick-task-input"
                  type="text"
                  placeholder="+ Add task dynamically..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="bg-transparent border-none text-xs text-[var(--tempo-text-primary)] focus:outline-none px-2 flex-grow placeholder-[var(--tempo-text-muted)]"
                />
                
                <select
                  aria-label="New task energy type"
                  value={newTaskEnergy}
                  onChange={(e) => setNewTaskEnergy(e.target.value as EnergyType)}
                  className="bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded text-[10px] text-[var(--tempo-text-secondary)] px-1 focus:outline-none"
                >
                  {ENERGY_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setScheduleIt(!scheduleIt)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded tracking-tight uppercase select-none transition-all ${
                    scheduleIt 
                      ? 'bg-[var(--tempo-accent-purple)]/20 text-[var(--tempo-accent-purple)] border border-[var(--tempo-accent-purple)]/30 font-bold' 
                      : 'bg-white/5 border border-transparent text-[var(--tempo-text-secondary)] hover:bg-white/10'
                  }`}
                  title="Schedule this task on the daily timeline"
                >
                  Schedule
                </button>

                <button
                  type="submit"
                  className="p-1 text-[#4F8EF7] hover:text-white hover:bg-white/5 rounded duration-150 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {scheduleIt && (
                <div className="flex items-center gap-2 p-2 rounded-xl border border-[var(--tempo-border)] bg-[var(--tempo-bg-tertiary)]/30 text-xs mt-1">
                  <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)]">⏰ START:</span>
                  <input 
                    type="time" 
                    value={scheduleStart} 
                    onChange={e => setScheduleStart(e.target.value)}
                    className="bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--tempo-text-primary)] focus:outline-none" 
                  />
                  <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)]">END:</span>
                  <input 
                    type="time" 
                    value={scheduleEnd} 
                    onChange={e => setScheduleEnd(e.target.value)}
                    className="bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--tempo-text-primary)] focus:outline-none" 
                  />
                </div>
              )}
            </div>

            {/* Task Row Items */}
            <div className="flex flex-col gap-1.5">
              {filteredTasks.map(task => {
                const isActiveInSession = String(task.id) === activeTimerTaskId;
                return (
                  <div 
                    key={task.id} 
                    className={`task-row group flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActiveInSession
                        ? 'border-[var(--tempo-accent-purple)] bg-[#181522]/35 shadow-[0_0_12px_rgba(139,92,246,0.12)] hover:border-[var(--tempo-accent-purple)]/80'
                        : 'border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)]/50 hover:bg-[var(--tempo-bg-secondary)] hover:border-[var(--tempo-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-grow overflow-hidden">
                      {/* Checkbox Trigger with custom aesthetics */}
                      <button
                        id={`check-task-${task.id}`}
                        onClick={() => handleToggleTask(task.id)}
                        className="focus:outline-none shrink-0 cursor-pointer"
                      >
                        {task.completed ? (
                           <div className="w-5 h-5 rounded-full border border-[#34D399] bg-[#34D399]/10 flex items-center justify-center">
                             <Check className="w-3.5 h-3.5 text-[#34D399]" />
                           </div>
                        ) : (
                          <div className="task-circle w-5 h-5 rounded-full border border-[#4A4A52] flex items-center justify-center bg-transparent" />
                        )}
                      </button>

                      {/* Task details */}
                      <div className="flex flex-col gap-0.5 truncate pr-2">
                        <span 
                          className={`text-xs font-sans tracking-wide truncate transition-all duration-300 ${
                            task.completed 
                              ? 'line-through text-[var(--tempo-text-muted)]' 
                              : 'text-[var(--tempo-text-primary)] hover:text-[#4F8EF7]'
                          }`}
                        >
                          {task.title}
                        </span>
                        
                        {/* Energy tag color dot indicators */}
                        <div className="flex items-center gap-2">
                           <div 
                             className="w-1.5 h-1.5 rounded-full" 
                             style={{ backgroundColor: getEnergyColor(task.energy) }}
                           />
                           <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)] uppercase tracking-wider scale-95 origin-left flex items-center gap-1.5">
                             <span>{task.energy}</span>
                             {task.startTime && task.endTime && (
                               <span className="text-[9px] text-[var(--tempo-accent-purple)] border border-[var(--tempo-accent-purple)]/20 bg-[var(--tempo-accent-purple)]/[0.04] px-1 rounded lowercase font-semibold">
                                 {task.startTime}-{task.endTime}
                               </span>
                             )}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges / Drag Handle columns */}
                    <div className="flex items-center gap-2 shrink-0 select-none">
                      
                      {/* Optional Gravity Score Indicator (Flame 🔥 with pulse animations) */}
                      {task.gravity >= 80 && !task.completed && (
                        <div 
                          title={`High Gravity Score: ${task.gravity}`}
                          className="w-6 h-6 rounded-full bg-[#FB7185]/20 flex items-center justify-center font-bold text-xs g-pulse-ring"
                        >
                          <Flame className="w-3.5 h-3.5 text-[#FB7185]" />
                        </div>
                      )}

                      {/* Start Focus Mode Trigger Button / In Session Badge */}
                      {!task.completed && (
                        isActiveInSession ? (
                          <div 
                            title="This task is currently active in a Focus session!"
                            className="px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide uppercase bg-[var(--tempo-accent-purple)]/15 border border-[var(--tempo-accent-purple)]/30 text-[var(--tempo-accent-purple)] flex items-center gap-1.5 animate-pulse shadow-sm"
                          >
                            <span className="w-1 h-1 rounded-full bg-[var(--tempo-accent-purple)]" />
                            <span>In Session</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (onStartFocusMode) {
                                onStartFocusMode(task);
                              }
                            }}
                            title="Start immersive Focus Mode session"
                            className="w-6 h-6 rounded-md border border-[var(--tempo-border)] hover:border-[var(--tempo-accent-purple)] hover:bg-[var(--tempo-accent-purple)]/10 text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-accent-purple)] flex items-center justify-center transition-all cursor-pointer transform hover:scale-105"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                          </button>
                        )
                      )}

                      {/* Duration badge */}
                      <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)] bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] px-2 py-0.5 rounded-md">
                        {task.duration}
                      </span>

                      {/* Edit/Delete actions */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(task)}
                          title="Edit detailed task parameters"
                          className="w-6 h-6 rounded-md hover:bg-white/10 text-[var(--tempo-text-muted)] hover:text-[var(--tempo-text-primary)] flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteTaskId === task.id ? (
                          <div className="flex items-center gap-1 text-[10px] whitespace-nowrap bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 text-red-500 select-none">
                            <span>Delete?</span>
                            <button 
                              type="button" 
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteTask(task.id);
                                setConfirmDeleteTaskId(null);
                              }} 
                              className="font-bold underline text-red-400 hover:text-red-200 ml-0.5"
                            >
                              Yes
                            </button>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteTaskId(null);
                              }} 
                              className="text-gray-400 hover:text-white ml-0.5"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteTaskId(task.id);
                            }}
                            title="Delete task completely"
                            className="w-6 h-6 rounded-md hover:bg-red-500/10 text-[var(--tempo-text-muted)] hover:text-red-400 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Drag Handle ⠿ visible on hover */}
                      <div className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--tempo-text-muted)] cursor-grab">
                        ⠿
                      </div>
                    </div>

                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="p-8 text-center border border-dashed border-[var(--tempo-border)] rounded-xl text-xs text-[var(--tempo-text-muted)]">
                  {todayTasks.length === 0 
                    ? "No tasks yet. Add your first task above ↑" 
                    : "No tasks match the active filter"}
                </div>
              )}
            </div>

          </div>

          {/* HABITS SECTION */}
          <div id="section-habits" className="border border-[var(--tempo-border)] rounded-xl bg-[var(--tempo-bg-secondary)]/45 overflow-hidden">
            {/* Header toggle view trigger */}
            <button
              onClick={() => setHabitsExpand(!habitsExpand)}
              className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--tempo-bg-secondary)]/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[var(--tempo-text-secondary)]">
                  Daily Habits
                </span>
                <span className="text-xs bg-[#FB7185]/10 text-[#FB7185] px-2 py-0.5 rounded border border-[#FB7185]/10 font-bold font-sans">
                  🔥 {getOverallStreak ? getOverallStreak() : 0} day streak
                </span>
              </div>
              <div>
                {habitsExpand ? <ChevronUp className="w-4 h-4 text-[var(--tempo-text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--tempo-text-secondary)]" />}
              </div>
            </button>

            {/* Sliding contents with CSS transitions */}
            {habitsExpand && (
              <div className="p-4 border-t border-[var(--tempo-border)]/40 bg-[var(--tempo-bg-secondary)]/10 flex flex-col gap-4 animate-[pop-fade-in_0.2s_ease-out]">
                {dbHabits.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[var(--tempo-border)] rounded-xl bg-[var(--tempo-bg-secondary)]/30 text-xs text-[var(--tempo-text-muted)] select-none">
                    No active habits defined. Move to Habits tracker in the sidebar to define yours!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {dbHabits.slice(0, 4).map(habit => {
                      const isCompletedToday = todayLogs.includes(habit.id);
                      const streak = getStreak(habit.id);
                      const rate7d = getCompletionRate(habit.id, 7);

                      const radius = 12;
                      const strokeWidth = 3;
                      const circ = 2 * Math.PI * radius;
                      const strokeOffset = circ - (rate7d / 100) * circ;

                      const handleCardClick = () => {
                        if (isCompletedToday) {
                          uncheckIn(habit.id);
                        } else {
                          checkIn(habit.id);
                        }
                      };

                      return (
                        <div 
                          key={habit.id}
                          onClick={handleCardClick}
                          className={`p-3 bg-[var(--tempo-bg-secondary)] border ${
                            isCompletedToday 
                              ? 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.06)]' 
                              : 'border-[var(--tempo-border)]'
                          } rounded-xl flex items-center gap-3 hover:border-[var(--tempo-border-hover)] cursor-pointer hover:bg-[var(--tempo-bg-tertiary)] group transition-all`}
                        >
                          {/* SVG Progress Ring */}
                          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              {/* Base Gray Orbit Ring */}
                              <circle 
                                cx="16" 
                                cy="16" 
                                r={radius} 
                                className="stroke-[var(--tempo-border)]" 
                                strokeWidth={strokeWidth}
                                fill="transparent"
                              />
                              {/* Colorful Segment */}
                              <circle 
                                cx="16" 
                                cy="16" 
                                r={radius} 
                                stroke={habit.color || '#3b82f6'}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circ}
                                strokeDashoffset={strokeOffset}
                                className="transition-all duration-300 ease-out"
                              />
                            </svg>
                            <span className="absolute text-[11px] select-none">
                              {habit.icon || '✓'}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="flex flex-col min-w-0 pr-1 select-none">
                            <span className="text-[11px] font-sans font-medium text-[var(--tempo-text-primary)] truncate tracking-wide flex items-center gap-1">
                              {habit.name}
                              {isCompletedToday && (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[7px] text-white font-bold shrink-0 inline-block" title="Completed Today">
                                  ✓
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] font-mono text-[var(--tempo-text-muted)] flex items-center gap-1 mt-0.5 whitespace-nowrap">
                              <span>🔥 {streak}d</span>
                              <span className="inline-block w-0.5 h-0.5 rounded-full bg-[var(--tempo-border)]" />
                              <span>📊 {rate7d}%</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <span className="text-[10px] font-mono text-[var(--tempo-text-muted)] text-center select-none">
                  💡 Click any habit tile above to log and track progress
                </span>
              </div>
            )}
          </div>

        </section>

        {/* RIGHT PANEL (70% WIDTH): Timeline views + Blocks */}
        <section id="panel-right" className="flex-grow flex flex-col bg-[var(--tempo-bg-primary)] p-4 lg:p-6 overflow-y-auto select-none gap-6">
          
          {/* ENERGY LOAD BAR COMPONENT */}
          <div className="flex flex-col gap-2 p-4 rounded-xl border border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)]/50">
            <div className="flex justify-between items-center select-none text-xs text-[var(--tempo-text-secondary)]">
              <span className="font-sans font-medium">Daily Energy Allocation Structure</span>
              <span className="font-mono text-[10px] uppercase">Active Hours: {totalLoadHours.toFixed(1)}h</span>
            </div>

            {/* Master segmented Load bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-[var(--tempo-bg-tertiary)] p-0 gap-0.5">
              {ENERGY_TYPES.map(e => e.value).map(type => {
                const pct = getLoadPct(type);
                if (pct <= 0) return null;
                return (
                  <div
                    key={type}
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: getEnergyColor(type) 
                    }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                  />
                );
              })}
            </div>

            {/* Labels and values Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2">
              {ENERGY_TYPES.map(e => e.value).map(type => {
                const hrs = dynamicEnergyLoads[type] || 0;
                return (
                  <div key={type} className="flex gap-2.5 items-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnergyColor(type) }} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-sans font-medium text-[var(--tempo-text-primary)] capitalize">{type}</span>
                      <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)] mt-0.5">
                        {hrs >= 1 ? `${hrs.toFixed(1)}h` : `${(hrs*60).toFixed(0)}m`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VERTICAL TIMELINE MODULE TITLE + TIME BLOCKS */}
          <div className="flex flex-col gap-4 flex-grow bg-[var(--tempo-bg-secondary)]/35 border border-[var(--tempo-border)] rounded-2xl p-4 sm:p-6 overflow-hidden relative">
            
            {/* Timeline Area Master Header */}
            <div className="flex flex-row justify-between items-center select-none shrink-0 pb-2 border-b border-[var(--tempo-border)]/40">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-sans font-semibold tracking-wide text-[var(--tempo-text-primary)]">Time Blocks</h3>
                {/* NOW Pulse token badge */}
                <div className="flex items-center gap-1.5 bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/20 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold now-chip-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-ping" />
                  <span>NOW {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Add block trigger button */}
              <button
                onClick={() => setIsAddingBlock(!isAddingBlock)}
                className="px-3.5 py-1.5 text-xs text-white btn-gradient rounded-lg font-medium cursor-pointer shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Block</span>
              </button>
            </div>

            {/* Quick Adding TimeBlock form overlay */}
            {isAddingBlock && (
              <form 
                onSubmit={handleCreateBlock} 
                className="p-4 rounded-xl border border-[var(--tempo-border)] bg-[var(--tempo-bg-tertiary)] flex flex-col gap-3 animate-[pop-fade-in_0.2s_ease-out]"
              >
                <div className="flex justify-between items-center pb-2 border-b border-[var(--tempo-border)]/40">
                  <span className="text-xs font-sans font-bold text-[var(--tempo-text-primary)] uppercase tracking-wide">
                    New Planner Block
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingBlock(false)} 
                    className="text-xs text-[var(--tempo-text-secondary)] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {addBlockError && (
                  <span className="text-[10px] text-[#FB7185] bg-[#FB7185]/5 border border-[#FB7185]/10 rounded py-1 px-2">
                    ⚠️ {addBlockError}
                  </span>
                )}

                {/* Block Type selector */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddBlockType('scheduled_task')}
                    className={`flex-1 py-1 text-[10px] font-mono rounded select-none border transition-all ${
                      addBlockType === 'scheduled_task'
                        ? 'bg-[var(--tempo-accent-purple)]/20 border-[var(--tempo-accent-purple)]/60 text-[var(--tempo-accent-purple)] font-bold'
                        : 'bg-white/5 border-transparent text-[var(--tempo-text-secondary)] hover:bg-white/10'
                    }`}
                  >
                    ⚡ Scheduled Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddBlockType('event')}
                    className={`flex-1 py-1 text-[10px] font-mono rounded select-none border transition-all ${
                      addBlockType === 'event'
                        ? 'bg-[var(--tempo-accent-blue)]/20 border-[var(--tempo-accent-blue)]/60 text-[var(--tempo-accent-blue)] font-bold'
                        : 'bg-white/5 border-transparent text-[var(--tempo-text-secondary)] hover:bg-white/10'
                    }`}
                  >
                    📅 Event Block
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="block-form-title" className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Session Title</label>
                    <input
                      id="block-form-title"
                      type="text"
                      placeholder="e.g. Code Review"
                      value={addBlockTitle}
                      onChange={(e) => setAddBlockTitle(e.target.value)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none focus:border-[var(--tempo-border-hover)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="block-form-energy" className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Energy Focus</label>
                    <select
                      id="block-form-energy"
                      value={addBlockEnergy}
                      onChange={(e) => setAddBlockEnergy(e.target.value as EnergyType)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    >
                      {ENERGY_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="block-form-start" className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Start Hour</label>
                    <input
                      id="block-form-start"
                      type="time"
                      value={addBlockStart}
                      onChange={(e) => setAddBlockStart(e.target.value)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="block-form-end" className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">End Hour</label>
                    <input
                      id="block-form-end"
                      type="time"
                      value={addBlockEnd}
                      onChange={(e) => setAddBlockEnd(e.target.value)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="block-form-desc" className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Brief Note</label>
                  <input
                    id="block-form-desc"
                    type="text"
                    placeholder="Short description..."
                    value={addBlockNotes}
                    onChange={(e) => setAddBlockNotes(e.target.value)}
                    className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-center py-2 text-xs font-semibold btn-gradient rounded-lg scale-[1.01] hover:scale-[1.02] active:scale-95 duration-100 mt-1"
                >
                  Create & Position Block
                </button>
              </form>
            )}

            {untimedEvents.length > 0 && (
              <div className="flex flex-col gap-2 p-3.5 bg-[var(--tempo-bg-primary)]/80 border border-[var(--tempo-border)]/60 rounded-xl select-none shrink-0">
                <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--tempo-accent-blue)]" />
                  Untimed / All-Day Events ({untimedEvents.length})
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {untimedEvents.map(evt => (
                    <div 
                      key={evt.id} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)]/60 rounded-lg text-xs font-medium text-[var(--tempo-text-primary)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getEnergyColor(evt.energy) }} />
                      <span className={evt.completed ? 'line-through text-[var(--tempo-text-muted)]' : ''}>{evt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REAL-TIME PIXEL-PERFECT GRAPH/GRID TIMELINE GRAPHIC CONTAINER */}
            <div id="timeline-scroll-area" className="flex-grow overflow-y-auto px-1 py-4 relative bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)]/60 rounded-xl" style={{ height: '540px' }}>
              
              {/* THE TIMELINE SURFACE INDEX: RELATIVE TARGET */}
              <div 
                className="relative w-full cursor-pointer text-[var(--tempo-text-primary)]" 
                style={{ height: '960px' }}
                onClick={(e) => {
                  // Only click-to-create if click is NOT on or within any task block/controls
                  if ((e.target as HTMLElement).closest('.time-block-interactive-card')) {
                    return;
                  }
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  
                  const minutesFromStart = Math.max(0, Math.min(16 * 60, clickY));
                  const totalMinutesFromMidnight = TIMELINE_START_HOUR * 60 + minutesFromStart;
                  const snappedMinutes = Math.round(totalMinutesFromMidnight / 15) * 15;
                  
                  const hours = Math.floor(snappedMinutes / 60);
                  const mins = snappedMinutes % 60;
                  const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                  
                  const endMinutes = Math.min(22 * 60, snappedMinutes + 60);
                  const endHours = Math.floor(endMinutes / 60);
                  const endMins = endMinutes % 60;
                  const formattedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                  
                  setAddBlockStart(formattedTime);
                  setAddBlockEnd(formattedEndTime);
                  setAddBlockTitle('');
                  setAddBlockNotes('');
                  setAddBlockError(null);
                  setIsAddingBlock(true);
                }}
              >
                
                {/* 1. Hour Grid Dividing Marks (each 60px high) */}
                {Array.from({ length: 17 }, (_, idx) => {
                  const currentHourIndex = idx + TIMELINE_START_HOUR;
                  const label = currentHourIndex === 12 
                    ? '12:00 PM' 
                    : currentHourIndex > 12 
                      ? `${currentHourIndex - 12}:00 PM` 
                      : `${currentHourIndex}:00 AM`;
                  const yPos = idx * HOUR_HEIGHT;

                  return (
                    <div 
                      key={currentHourIndex} 
                      className="absolute left-0 w-full flex items-center select-none"
                      style={{ top: `${yPos}px`, height: '1px' }}
                    >
                      {/* Hour text */}
                      <span className="text-[10px] font-mono text-[var(--tempo-text-muted)] w-[50px] shrink-0 text-left pl-1">
                        {label}
                      </span>
                      {/* Horizon dotted border */}
                      <div className="flex-grow border-t border-dashed border-[var(--tempo-border)]/40" />
                    </div>
                  );
                })}

                {/* 2. UNSCHEDULED drop zones placed dynamically where no times are allocated */}
                {vacantSlots.map((slot, index) => {
                  // Calculate positioning in the absolute canvas
                  const top = timeToMinutesFromStart(slot.start);
                  const bottom = timeToMinutesFromStart(slot.end);
                  const height = bottom - top;
                  
                  return (
                    <div
                      key={`slot-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find where in the vacant slot the user clicked
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickY = e.clientY - rect.top;
                        
                        const slotStartMins = timeToMinutesFromStart(slot.start);
                        const clickMins = slotStartMins + clickY;
                        const totalMinutesFromMidnight = TIMELINE_START_HOUR * 60 + clickMins;
                        const snappedMinutes = Math.round(totalMinutesFromMidnight / 15) * 15;
                        
                        const hours = Math.floor(snappedMinutes / 60);
                        const mins = snappedMinutes % 60;
                        const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                        
                        // Pick default duration up to 60 mins, bounded by end of slot (both computed relative to midnight)
                        const slotEndMinsFromMidnight = timeToMinutesFromStart(slot.end) + TIMELINE_START_HOUR * 60;
                        const endMinutes = Math.min(22 * 60, Math.min(slotEndMinsFromMidnight, snappedMinutes + 60));
                        
                        const endHours = Math.floor(endMinutes / 60);
                        const endMins = endMinutes % 60;
                        const formattedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                        
                        setAddBlockStart(formattedTime);
                        setAddBlockEnd(formattedEndTime);
                        setAddBlockTitle('');
                        setAddBlockNotes('');
                        setAddBlockError(null);
                        setIsAddingBlock(true);
                      }}
                      className="absolute right-2 border border-dashed border-[var(--tempo-border)]/35 rounded-xl flex items-center justify-center text-[10px] text-[var(--tempo-text-muted)] hover:bg-[var(--tempo-bg-secondary)]/10 hover:border-[var(--tempo-border-hover)] group transition-all duration-200 cursor-copy"
                      style={{
                        top: `${top + 2}px`,
                        left: '60px',
                        height: `${height - 4}px`
                      }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 pointer-events-none">
                        <PlusCircle className="w-3 h-3 text-[#4F8EF7]" /> Add / Drop Task Here ({slot.start} — {slot.end})
                      </span>
                    </div>
                  );
                })}

                {/* 3. CURRENT TIME RED-CORAL LINE (#FB7185) with blinking badge */}
                {currentTimeIndicatorPos >= 0 && currentTimeIndicatorPos <= 960 && (
                  <div 
                    className="absolute left-0 w-full flex items-center z-25 pointer-events-none"
                    style={{ top: `${currentTimeIndicatorPos}px` }}
                  >
                    <div className="w-[50px] shrink-0 text-left select-none pr-1">
                      <span className="text-[10px] font-mono text-[#FB7185] font-semibold bg-[#FB7185]/10 px-1 py-0.5 rounded">
                        Now
                      </span>
                    </div>
                    {/* Blinking pin indicator */}
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] relative -left-1 shrink-0">
                      <div className="absolute inset-0 rounded-full bg-[#FB7185] animate-ping opacity-75" />
                    </div>
                    {/* Horizontal indicator ribbon */}
                    <div className="flex-grow h-[1px] bg-[#FB7185]" />
                  </div>
                )}

                {/* 4. TIME BLOCKS SCHEDULE CARDS RENDERS */}
                {blocks.length === 0 ? (
                  <div className="absolute inset-x-0 top-1/3 flex flex-col items-center justify-center text-center pointer-events-none select-none z-10">
                    <p className="text-xs text-[var(--tempo-text-muted)] bg-[var(--tempo-bg-secondary)]/85 border border-[var(--tempo-border)]/40 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm">
                      Click any time slot to schedule a block
                    </p>
                  </div>
                ) : blocks.map(block => {
                  const startY = timeToMinutesFromStart(block.startTime);
                  const endY = timeToMinutesFromStart(block.endTime);
                  const blockHeight = endY - startY;

                  const color = getEnergyColor(block.energy);
                  const isHovered = hoveredBlockId === block.id;
                  const overlaps = isOverlapping(block);
                  const isCompact = blockHeight < 45;
                  const cardHeight = Math.max(26, blockHeight - 4);
                  const isStretched = (blockHeight - 4) < 26;

                  return (
                    <div
                      key={block.id}
                      onMouseEnter={() => setHoveredBlockId(block.id)}
                      onMouseLeave={() => setHoveredBlockId(null)}
                      onClick={(e) => e.stopPropagation()}
                      title={`${block.title}\nTime: ${block.startTime} – ${block.endTime}\nFocus: ${block.energy}`}
                      className={`absolute right-4 rounded-xl border border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)]/95 hover:bg-[var(--tempo-bg-tertiary)] backdrop-blur transition-all duration-150 group flex select-none time-block-interactive-card ${
                        isCompact ? 'items-center px-3 py-1' : 'flex-col p-3 justify-between'
                      } ${
                        block.completed ? 'opacity-50' : 'opacity-100'
                      }`}
                      style={{
                        top: `${startY + 2}px`,
                        left: '75px', // slightly shifted to look highly organized
                        height: `${cardHeight}px`,
                        borderLeft: `4px solid ${color}`,
                        boxShadow: isHovered ? '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 16px -8px rgba(255,255,255,0.02)' : 'none',
                        zIndex: isHovered ? 40 : (isStretched ? 20 : 10)
                      }}
                    >
                      {isCompact ? (
                        <div className="flex items-center justify-between w-full min-w-0 h-full relative pr-12">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {block.type === 'event' && (
                              <Calendar className="w-3.5 h-3.5 text-[var(--tempo-accent-blue)] shrink-0 animate-pulse" />
                            )}
                            <span 
                              className={`text-xs font-semibold tracking-wide truncate ${
                                block.completed ? 'line-through text-[var(--tempo-text-muted)]' : 'text-[var(--tempo-text-primary)]'
                              }`}
                            >
                              {block.title}
                            </span>
                            {cardHeight >= 24 && (
                              <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)] shrink-0 opacity-80">
                                · {block.startTime}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start select-none min-w-0 w-full">
                            {/* Title and stats */}
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {block.type === 'event' && (
                                  <Calendar className="w-3.5 h-3.5 text-[var(--tempo-accent-blue)] shrink-0" />
                                )}
                                <span 
                                  className={`text-xs font-semibold text-[var(--tempo-text-primary)] tracking-wide truncate ${
                                    block.completed ? 'line-through text-[var(--tempo-text-muted)]' : ''
                                  }`}
                                >
                                  {block.title}
                                </span>
                              </div>
                              
                              <span className="text-[10px] font-mono text-[var(--tempo-text-secondary)] mt-0.5">
                                {block.startTime} — {block.endTime}
                              </span>
                            </div>

                            {/* Energy pill */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {overlaps && (
                                <div 
                                  title="⚠️ Conflicting Scheduled Block"
                                  className="w-4 h-4 rounded bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[9px] text-[#FBBF24]"
                                >
                                  ⚠️
                                </div>
                              )}

                              {block.type === 'event' && (
                                <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--tempo-accent-blue)]/15 text-[var(--tempo-accent-blue)] border border-[var(--tempo-accent-blue)]/30">
                                  Event
                                </span>
                              )}

                              <span 
                                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: `${color}15`, 
                                  color: color, 
                                  border: `1px solid ${color}30` 
                                }}
                              >
                                {block.energy}
                              </span>
                            </div>
                          </div>

                          {/* Display brief notes if height permits */}
                          {blockHeight >= 70 && block.notes && (
                            <p className="text-[10px] text-[var(--tempo-text-secondary)] font-sans truncate min-w-0 mt-1 select-none pr-4">
                              {block.notes}
                            </p>
                          )}
                        </>
                      )}

                      {/* Dynamic Detailed floating overlay on hover */}
                      {isHovered && (
                        <div 
                          className={`absolute flex gap-1 bg-[var(--tempo-bg-secondary)]/95 p-1 rounded-lg border border-[var(--tempo-border)] pointer-events-auto z-40 popover-detail shadow-md ${
                            isCompact ? 'right-2 top-1/2 -translate-y-1/2 scale-90' : 'bottom-2 right-2'
                          }`}
                        >
                          {/* Complete action */}
                          <button
                            onClick={() => handleToggleCompleteBlock(block.id)}
                            title="Toggle Completed state"
                            className="p-1 rounded text-[#8A8A90] hover:text-[#34D399] hover:bg-white/5 cursor-pointer flex items-center justify-center"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Edit action */}
                          <button
                            onClick={() => handleOpenEditModal(block)}
                            title="Edit detailed block parameters"
                            className="p-1 rounded text-[#8A8A90] hover:text-[#4F8EF7] hover:bg-white/5 cursor-pointer flex items-center justify-center"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Trash action */}
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            title="Delete planners block"
                            className="p-1 rounded text-[#8A8A90] hover:text-[#FB7185] hover:bg-white/5 cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="w-full max-w-md bg-[var(--tempo-bg-tertiary)] rounded-2xl border border-[var(--tempo-border)] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-[var(--tempo-bg-secondary)] border-b border-[var(--tempo-border)]">
              <h3 className="text-xs font-sans font-bold text-[var(--tempo-text-primary)] uppercase tracking-wider">
                Edit Item Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-xs text-[var(--tempo-text-secondary)] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none focus:border-[var(--tempo-border-hover)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Energy Focus</label>
                  <select
                    value={editEnergy}
                    onChange={(e) => setEditEnergy(e.target.value as EnergyType)}
                    className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                  >
                    {ENERGY_TYPES.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ItemType)}
                    className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                  >
                    <option value="task">📋 Backlog Task</option>
                    <option value="scheduled_task">⚡ Scheduled Task</option>
                    <option value="event">📅 Event Block</option>
                  </select>
                </div>
              </div>

              {editType !== 'task' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Start Time</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">End Time</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Duration (e.g. 30m)</label>
                    <input
                      type="text"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Gravity Score (10-100)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={editGravity}
                      onChange={(e) => setEditGravity(Number(e.target.value))}
                      className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="edit-completed-check"
                    checked={editCompleted}
                    onChange={(e) => setEditCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--tempo-border)] text-[var(--tempo-accent-purple)]"
                  />
                  <label htmlFor="edit-completed-check" className="text-xs text-[var(--tempo-text-primary)] select-none">Completed</label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--tempo-text-secondary)] font-mono">Brief Note</label>
                <input
                  type="text"
                  placeholder="Notes or description..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] p-2 text-xs rounded text-[var(--tempo-text-primary)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full text-center py-2 text-xs font-semibold btn-gradient rounded-lg scale-[1.01] hover:scale-[1.02] active:scale-95 duration-100 mt-2 hover:opacity-90"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RENDER MORNING INTENTIONS MODAL */}
      {userId && (
        <MorningIntentionsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userName={intentionUserName || userName}
          initialPriority1={intentionsRow?.priority_1 || ''}
          initialPriority2={intentionsRow?.priority_2 || ''}
          initialPriority3={intentionsRow?.priority_3 || ''}
          onSave={saveIntentions}
          onSkip={skipIntentions}
        />
      )}

    </div>
  );
}
