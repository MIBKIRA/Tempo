import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Flame, Sparkles, Activity, Clock, ArrowRight
} from 'lucide-react';
import { EnergyType, Task } from '../types';
import { useNow } from '../useNow';
import { useTasksData } from '../TasksContext';
import { TempoIcons } from './icons/TempoIcons';

const getCategoryColor = (category?: string | null): string => {
  if (!category) return '#4A4A4F';
  switch (category.toLowerCase()) {
    case 'deep': return '#7C3AED';
    case 'light': return 'var(--tempo-accent-blue)';
    case 'admin': return 'var(--color-admin, #FBBF24)';
    case 'creative': return 'var(--color-creative, #FB7185)';
    case 'social': return 'var(--color-social, #2DD4BF)';
    default: return '#4A4A4F';
  }
};

interface CalendarViewProps {
  onDayClick?: (day: number) => void;
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
}

interface CalendarDayData {
  dayNum: number;
  monthName: string;
  yearNum: number;
  isToday: boolean;
  isTemplate?: boolean;
  isHighGravity?: boolean;
  tasks: { id: string; title: string; energy: EnergyType; completed: boolean }[];
  events: { id: string; title: string; energy: EnergyType; duration: string; isMultiDay?: boolean }[];
  totalTasksCount: number;
  completedTasksCount: number;
}

export default function CalendarView({ onDayClick, onViewChange, tasks: propsTasks, setTasks: propsSetTasks }: CalendarViewProps) {
  const context = useTasksData();
  const tasks = propsTasks || context.tasks;
  const [hoveredDay, setHoveredDay] = useState<CalendarDayData | null>(null);
  const [hoveredDayPos, setHoveredDayPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringDesignSprint, setIsHoveringDesignSprint] = useState(false);

  const now = useNow();
  const [monthOffset, setMonthOffset] = useState(0);
  const [densityFilter, setDensityFilter] = useState<0 | 3 | 5 | 8>(0);

  const targetDate = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [now, monthOffset]);

  const targetYear = useMemo(() => targetDate.getFullYear(), [targetDate]);
  const targetMonth = useMemo(() => targetDate.getMonth(), [targetDate]);
  const monthName = useMemo(() => targetDate.toLocaleString('default', { month: 'long' }), [targetDate]);

  // Format YYYY-MM-DD
  const getLocalDateString = (year: number, month: number, d: number): string => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // --- RAW MONTHLY DATA COMPUTATION ---
  const calendarData: CalendarDayData[] = useMemo(() => {
    const list: CalendarDayData[] = [];
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cellDateStr = getLocalDateString(targetYear, targetMonth, dayNum);
      const isToday = now.getFullYear() === targetYear &&
                      now.getMonth() === targetMonth &&
                      dayNum === now.getDate();
                      
      let isTemplate = false;
      let isHighGravity = false;

      // Filter tasks for this specific day
      const dayAllTasks = tasks.filter(t => t.date === cellDateStr);

      const dayEvents = dayAllTasks
        .filter(t => t.type === 'event')
        .map(t => ({
          id: String(t.id),
          title: t.title,
          energy: t.energy,
          duration: t.duration || '1h'
        }));

      const dayTasks = dayAllTasks
        .filter(t => t.type !== 'event')
        .map(t => ({
          id: String(t.id),
          title: t.title,
          energy: t.energy,
          completed: t.completed
        }));

      const completedCount = dayAllTasks.filter(t => t.completed).length;

      // Templates (3-4 days as "template days" with high badge)
      if ([2, 9, 16, 23].includes(dayNum)) {
        isTemplate = true;
      }

      // High Gravity (2 days with 🔥 icon)
      if ([4, 19].includes(dayNum)) {
        isHighGravity = true;
      }

      list.push({
        dayNum,
        monthName,
        yearNum: targetYear,
        isToday,
        isTemplate,
        isHighGravity,
        tasks: dayTasks,
        events: dayEvents,
        totalTasksCount: dayAllTasks.length,
        completedTasksCount: completedCount
      });
    }

    return list;
  }, [targetYear, targetMonth, monthName, now, tasks]);

  // --- STATS ENERGIES ---
  const energyColors = {
    deep: 'var(--color-deep, #8B5CF6)',
    light: 'var(--color-light, #60A5FA)',
    admin: 'var(--color-admin, #FBBF24)',
    creative: 'var(--color-creative, #FB7185)',
    social: 'var(--color-social, #2DD4BF)'
  };

  const getEnergyName = (energy: EnergyType) => {
    switch (energy) {
      case 'deep': return 'Deep';
      case 'light': return 'Light';
      case 'admin': return 'Admin';
      case 'creative': return 'Creative';
      case 'social': return 'Social';
    }
  };

  // Live Streak & Consistency
  const streakInfo = useMemo(() => {
    const today = new Date(now);
    today.setHours(0,0,0,0);
    
    let streak = 0;
    const completedByDate: Record<string, number> = {};
    
    tasks.forEach(t => {
      if (t.completed && t.date) {
        completedByDate[t.date] = (completedByDate[t.date] || 0) + 1;
      }
    });

    const getDStr = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const r = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${r}`;
    };

    const todayStr = getDStr(today);
    const doneToday = (completedByDate[todayStr] || 0) >= 1;
    
    const checkedDate = new Date(today);
    if (doneToday) {
      streak = 1;
      checkedDate.setDate(checkedDate.getDate() - 1);
    } else {
      checkedDate.setDate(checkedDate.getDate() - 1);
    }

    while (true) {
      const ds = getDStr(checkedDate);
      if ((completedByDate[ds] || 0) >= 1) {
        streak++;
        checkedDate.setDate(checkedDate.getDate() - 1);
      } else {
        break;
      }
      if (streak > 365) break;
    }

    const daysInMonthSoFar = now.getDate();
    let activeDaysThisMonth = 0;
    for (let d = 1; d <= daysInMonthSoFar; d++) {
      const ds = getDStr(new Date(now.getFullYear(), now.getMonth(), d));
      if ((completedByDate[ds] || 0) >= 1) {
        activeDaysThisMonth++;
      }
    }
    const consistencyScore = daysInMonthSoFar > 0 
      ? Math.round((activeDaysThisMonth / daysInMonthSoFar) * 100)
      : 100;

    return { streak, consistencyScore };
  }, [tasks, now]);

  // Sparkline completion over past 12 days
  const sparklineData = useMemo(() => {
    const list = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dd}`;

      const dayTasks = tasks.filter(t => t.date === dateStr);
      const completed = dayTasks.filter(t => t.completed).length;
      const total = dayTasks.length;

      const label = d.toLocaleString('default', { month: 'short', day: 'numeric' });
      list.push({
        label,
        completed,
        target: total || 1, 
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }
    return list;
  }, [tasks, now]);

  // --- MONTH STATISTICS & UPCOMING SCHEDULE COMPUTED LANDSCAPE ---
  const monthAllTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.date) return false;
      const [y, m, d] = t.date.split('-').map(Number);
      return y === targetYear && (m - 1) === targetMonth;
    });
  }, [tasks, targetYear, targetMonth]);

  const monthStatistics = useMemo(() => {
    const totalCount = monthAllTasks.length;
    const completedCount = monthAllTasks.filter(t => t.completed).length;
    const eventsCount = monthAllTasks.filter(t => t.startTime && t.endTime).length;

    let totalMins = 0;
    monthAllTasks.forEach(t => {
      if (!t.duration) return;
      const parsed = parseInt(t.duration, 10);
      if (!isNaN(parsed)) {
        totalMins += parsed;
      }
    });
    const focusHours = Math.round((totalMins / 60) * 10) / 10;

    const counts: Record<EnergyType, number> = { deep: 0, admin: 0, creative: 0, social: 0, light: 0 };
    monthAllTasks.forEach(t => {
      if (counts[t.energy] !== undefined) {
        counts[t.energy]++;
      }
    });
    const totalCountForPerc = monthAllTasks.length || 1;
    const percentages = {
      deep: Math.round((counts.deep / totalCountForPerc) * 100),
      admin: Math.round((counts.admin / totalCountForPerc) * 100),
      creative: Math.round((counts.creative / totalCountForPerc) * 100),
      social: Math.round((counts.social / totalCountForPerc) * 100),
      light: Math.round((counts.light / totalCountForPerc) * 100),
    };

    return {
      totalCount,
      completedCount,
      eventsCount,
      focusHours,
      percentages
    };
  }, [monthAllTasks]);

  const upcomingSchedule = useMemo(() => {
    const list = tasks.filter(t => {
      if (!t.date) return false;
      const [y, m, d] = t.date.split('-').map(Number);
      if (y !== targetYear || (m - 1) !== targetMonth) return false;
      
      const dateObj = new Date(y, m - 1, d);
      const limitDate = new Date(now);
      limitDate.setHours(0,0,0,0);
      return dateObj >= limitDate;
    });

    list.sort((a, b) => {
      const ad = a.date || '';
      const bd = b.date || '';
      if (ad !== bd) return ad.localeCompare(bd);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return list.slice(0, 5).map(t => {
      const [y, m, d] = t.date!.split('-').map(Number);
      const monthShort = monthNames[m - 1] || 'Jun';
      return {
        id: String(t.id),
        title: t.title,
        date: `${monthShort} ${d}`,
        dur: t.duration || '30m',
        energy: t.energy
      };
    });
  }, [tasks, targetYear, targetMonth, now]);

  // Grid Construction
  const gridCells = useMemo(() => {
    const cells: (CalendarDayData | null)[] = [];
    
    const firstDayOfWeek = new Date(targetYear, targetMonth, 1).getDay();
    const paddingSize = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = 0; i < paddingSize; i++) {
      cells.push(null);
    }
    
    calendarData.forEach(day => {
      cells.push(day);
    });
    
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    
    return cells;
  }, [calendarData, targetYear, targetMonth]);

  // Handle showing the tooltip in position
  const handleCellMouseEnter = (day: CalendarDayData, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const area = e.currentTarget.parentElement?.getBoundingClientRect();
    
    setHoveredDay(day);
    setHoveredDayPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 8
    });

    // Toggle design sprint highlight
    if (day.dayNum >= 10 && day.dayNum <= 12) {
      setIsHoveringDesignSprint(true);
    }
  };

  const handleCellMouseLeave = () => {
    setHoveredDay(null);
    setIsHoveringDesignSprint(false);
  };

  return (
    <div className="w-full flex-grow flex flex-col h-full bg-[var(--tempo-bg-primary)] text-[var(--tempo-text-primary)] relative select-none">
      
      {StyleTags()}

      {/* HEADER SECTION */}
      <header className="px-6 py-4 border-b border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0 font-sans shadow-sm">
        
        {/* Navigation & Month */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button 
              title="Previous Month" 
              onClick={() => setMonthOffset(prev => prev - 1)}
              className="p-2 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] hover:bg-[var(--tempo-bg-tertiary)] hover:border-[var(--tempo-border-hover)] text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <h1 className="text-2xl lg:text-3xl font-serif text-[var(--tempo-text-primary)] tracking-tight px-2 min-w-[150px] text-center">
              {monthName} {targetYear}
            </h1>
            
            <button 
              title="Next Month" 
              onClick={() => setMonthOffset(prev => prev + 1)}
              className="p-2 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] hover:bg-[var(--tempo-bg-tertiary)] hover:border-[var(--tempo-border-hover)] text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setMonthOffset(0)}
            className="px-3 py-1.5 rounded-lg border border-[var(--tempo-border)] bg-[var(--tempo-bg-primary)] text-xs font-medium text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] hover:bg-[var(--tempo-bg-tertiary)] transition-all cursor-pointer"
          >
            Today
          </button>

          <button 
            className="px-3 py-1.5 text-xs text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] font-medium transition-all cursor-pointer opacity-60 hover:opacity-100"
          >
            Year View
          </button>
        </div>

        {/* View Switches (Day, Week, Month) */}
        <div className="flex bg-[var(--tempo-bg-primary)] p-0.5 rounded-lg border border-[var(--tempo-border)] w-fit">
          {['Day', 'Week', 'Month'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Day' && onViewChange) onViewChange('day');
                if (tab === 'Week' && onViewChange) onViewChange('week');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all relative ${
                tab === 'Month' 
                  ? 'text-[var(--tempo-text-primary)]' 
                  : 'text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-text-primary)] cursor-pointer'
              }`}
            >
              {tab}
              {tab === 'Month' && (
                <span className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-[var(--tempo-accent-blue)] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Legend Scale Indicators */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-5">
          {/* GitHub density bar scale */}
          <div className="flex items-center gap-2 bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)] px-3 py-1.5 rounded-lg text-xs">
            <span className="text-[10px] text-[var(--tempo-text-secondary)] uppercase font-mono tracking-wider mr-1 select-none">Activity Density</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setDensityFilter(0)}
                className={`w-3.5 h-3.5 rounded border transition-all cursor-pointer ${densityFilter === 0 ? 'bg-[#141416] border-[var(--tempo-accent-blue)] ring-1 ring-[var(--tempo-accent-blue)]' : 'bg-[#141416] border-white/5 hover:border-white/20'}`} 
                title="Show all days (0+ tasks)" 
              />
              <span className="text-[10px] text-[var(--tempo-text-muted)] select-none">0</span>
              
              <button 
                onClick={() => setDensityFilter(3)}
                className={`w-3.5 h-3.5 rounded transition-all cursor-pointer ${densityFilter === 3 ? 'bg-[var(--tempo-accent-purple)] ring-2 ring-[var(--tempo-accent-blue)]' : 'bg-[var(--tempo-accent-purple)]/30 hover:bg-[var(--tempo-accent-purple)]/50'}`}
                title="Filter 3+ completed tasks" 
              />
              <span className="text-[10px] text-[var(--tempo-text-muted)] select-none">░ 3+</span>
              
              <button 
                onClick={() => setDensityFilter(5)}
                className={`w-3.5 h-3.5 rounded transition-all cursor-pointer ${densityFilter === 5 ? 'bg-[var(--tempo-accent-purple)] ring-2 ring-[var(--tempo-accent-blue)]' : 'bg-[var(--tempo-accent-purple)]/60 hover:bg-[var(--tempo-accent-purple)]/80'}`}
                title="Filter 5+ completed tasks" 
              />
              <span className="text-[10px] text-[var(--tempo-text-muted)] select-none">▒ 5+</span>
              
              <button 
                onClick={() => setDensityFilter(8)}
                className={`w-3.5 h-3.5 rounded transition-all cursor-pointer ${densityFilter === 8 ? 'bg-[var(--tempo-accent-purple)] ring-2 ring-[var(--tempo-accent-blue)] shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-[var(--tempo-accent-purple)] hover:opacity-90'}`}
                title="Filter 8+ completed tasks" 
              />
              <span className="text-[10px] text-[var(--tempo-text-muted)] select-none">▓ 8+</span>
            </div>
          </div>

          {/* Energy Legends */}
          <div className="flex items-center gap-3 bg-[var(--tempo-bg-primary)] border border-[var(--tempo-border)] px-3 py-1.5 rounded-lg text-[11px] font-medium shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: energyColors.deep }} />
              <span className="text-[10px] text-[var(--tempo-text-secondary)]">Deep</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: energyColors.admin }} />
              <span className="text-[10px] text-[var(--tempo-text-secondary)]">Admin</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: energyColors.creative }} />
              <span className="text-[10px] text-[var(--tempo-text-secondary)]">Creative</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: energyColors.social }} />
              <span className="text-[10px] text-[var(--tempo-text-secondary)]">Social</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: energyColors.light }} />
              <span className="text-[10px] text-[var(--tempo-text-secondary)]">Light</span>
            </div>
          </div>
        </div>

      </header>

      {/* MAIN CONTAINER WORKSPACE GRID + STATS */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto overflow-x-hidden p-6 gap-6 relative select-none">
        
        {/* LEFT WORKSPACE GRID COLUMN */}
        <div className="flex-grow flex flex-col gap-4 min-w-0">
          
          {/* STREAK & SPARKLINE HEADER BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-xl py-3 px-5 gap-4">
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-[var(--tempo-accent-green)]/10 border border-[var(--tempo-accent-green)]/20 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[var(--tempo-accent-green)] fill-[var(--tempo-accent-green)] animate-pulse" />
                <span className="text-xs font-bold text-[var(--tempo-accent-green)] tracking-tight font-mono">
                  {streakInfo.streak}-DAY STREAK
                </span>
              </div>
              <p className="text-xs text-[var(--tempo-text-secondary)] max-w-xs leading-none">
                Consistent focus triggers of 1+ daily task limits. Consistency score: {streakInfo.consistencyScore}%
              </p>
            </div>

            {/* Sparkline mini-completion chart */}
            <div className="flex items-center gap-2 select-none self-end sm:self-auto">
              <span className="text-[9px] font-mono text-[var(--tempo-text-muted)] uppercase tracking-wider">Completion Rate:</span>
              <div className="flex items-end gap-1 h-8 px-2 border-l border-r border-[var(--tempo-border)]/50">
                {sparklineData.map((d, index) => {
                  const percentage = d.target > 0 ? Math.min(100, (d.completed / d.target) * 100) : 0;
                  const isTop = percentage >= 100;
                  return (
                    <div 
                      key={index} 
                      title={`${d.label}: ${d.completed}/${d.target === 1 && d.completed === 0 ? 0 : d.target} tasks completed (${percentage.toFixed(0)}%)`}
                      className="group/spark relative h-full w-[10px] flex items-end"
                    >
                      <div 
                        style={{ height: `${percentage === 0 ? 4 : percentage}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isTop 
                            ? 'bg-gradient-to-t from-[var(--tempo-accent-green)]/80 to-[var(--tempo-accent-green)] font-semibold' 
                            : 'bg-[var(--tempo-accent-purple)]/65'
                        }`} 
                      />
                      {/* Micro tooltip inside sparkline */}
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] text-[8px] font-mono text-[var(--tempo-text-primary)] rounded px-1 py-0.5 opacity-0 group-hover/spark:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-40">
                        {d.label}: {d.completed} done
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col justify-between h-8 text-[8px] font-mono text-[var(--tempo-text-muted)]">
                <span>100%</span>
                <span>0%</span>
              </div>
            </div>

          </div>

          {/* CALENDAR MONTH GRID */}
          <div className="flex-grow flex flex-col bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-2xl p-5 select-none relative shadow-xl">
            
            {/* Headers MON -> SUN */}
            <div className="grid grid-cols-7 gap-2.5 text-center mb-3">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="text-xs font-bold text-[var(--tempo-text-muted)] tracking-widest py-1 font-sans">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2.5 flex-grow">
              {gridCells.map((day, cellIndex) => {
                if (!day) {
                  // Rendering empty placeholder outside the month range, styled cleanly
                  return (
                    <div 
                      key={`empty-${cellIndex}`} 
                      className="rounded-lg h-24 bg-[var(--tempo-bg-primary)]/15 border border-transparent opacity-20 pointer-events-none" 
                    />
                  );
                }

                const tasksDoneCount = day.completedTasksCount;
                const eventsCount = day.events.length;
                const totalTasksCount = day.totalTasksCount;
                
                // Active count filtering status
                const isFilteredOut = densityFilter > 0 && tasksDoneCount < densityFilter;

                // Color scaling according to GitHub style pattern
                let cellBg = isFilteredOut ? 'bg-[var(--tempo-bg-primary)]/40' : 'bg-[var(--tempo-bg-secondary)]';
                let cellBorder = 'border-[var(--tempo-border)] hover:border-[var(--tempo-border-hover)]';
                let densityIntensity = 0; // 0, 1, 2, 3

                if (tasksDoneCount >= 8) {
                  densityIntensity = 3;
                } else if (tasksDoneCount >= 5) {
                  densityIntensity = 2;
                } else if (tasksDoneCount >= 3) {
                  densityIntensity = 1;
                }

                // Determine styling based on today or focus
                if (day.isToday) {
                  cellBorder = 'border-2 border-[var(--tempo-accent-blue)]';
                }

                // Checks if this day is part of Design Sprint spanning Jun 10-12, 2026
                const isSprintDay = targetYear === 2026 && targetMonth === 5 && day.dayNum >= 10 && day.dayNum <= 12;
                const isSprintStart = day.dayNum === 10;
                const isSprintEnd = day.dayNum === 12;

                return (
                  <div
                    key={`day-${day.dayNum}`}
                    onMouseEnter={(e) => handleCellMouseEnter(day, e)}
                    onMouseLeave={handleCellMouseLeave}
                    onClick={() => {
                      if (onDayClick) {
                        onDayClick(day.dayNum);
                      } else if (onViewChange) {
                        onViewChange('day');
                      }
                    }}
                    className={`group/cell rounded-xl h-24 p-2.5 flex flex-col justify-between transition-all duration-150 relative cursor-pointer ${cellBg} border ${cellBorder} ${
                      isSprintDay ? 'bg-gradient-to-b from-[#FB7185]/[0.03] to-transparent' : ''
                    } ${isFilteredOut ? 'opacity-40 saturate-50' : ''}`}
                  >
                    
                    {/* Top row: Date list & Templates tags */}
                    <div className="flex items-center justify-between pointer-events-none select-none w-full">
                      <span className={`text-sm font-bold tracking-tight ${
                        day.isToday ? 'text-[var(--tempo-accent-blue)] font-extrabold' : 'text-[var(--tempo-text-primary)]'
                      }`}>
                        {day.dayNum}
                      </span>

                      {/* template 🏗 or high gravity 🔥 badges */}
                      {day.isTemplate ? (
                        <span className="text-[10px] tracking-tight text-[var(--tempo-accent-purple)]" title="Template day active">
                          🏗
                        </span>
                      ) : day.isHighGravity ? (
                        <span className="flex items-center justify-center animate-bounce text-[#FB7185]" title="High gravity day">
                          <TempoIcons.Streak size={12} className="inline-block" />
                        </span>
                      ) : null}
                    </div>

                    {/* Top area: Dots style for tasks and scheduled tasks */}
                    <div className="flex flex-wrap gap-0.5 mt-1 pointer-events-none select-none w-full min-h-[10px] items-center">
                      {day.tasks.slice(0, 5).map((item) => (
                        <span
                          key={item.id}
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getCategoryColor(item.energy),
                            margin: '1px'
                          }}
                          title={item.title}
                        />
                      ))}
                      {day.tasks.length > 5 && (
                        <span className="text-[8px] font-mono text-[var(--tempo-text-muted)] leading-none select-none ml-0.5">
                          +{day.tasks.length - 5}
                        </span>
                      )}
                    </div>

                    {/* Bottom area: Bars style for events stacked */}
                    <div className="w-full flex flex-col gap-0.5 mt-auto pointer-events-none select-none z-10 min-h-[10px] justify-end">
                      
                      {/* CONNECTED BAR FOR DESIGN SPRINT: Spans June 10-12 */}
                      {isSprintDay ? (
                        <div 
                          className={`h-2.5 text-[8px] font-semibold text-white/95 px-1.5 mb-0.5 flex items-center justify-start overflow-hidden bg-gradient-to-r from-[var(--tempo-accent-coral)] to-[#FB7185]/90 border-t border-b border-[var(--tempo-accent-coral)]/30 ${
                            isSprintStart ? 'rounded-l-md pl-2 ml-[-11px] w-[calc(100%+11px)]' : ''
                          } ${
                            isSprintEnd ? 'rounded-r-md pr-2 mr-[-11px] w-[calc(100%+11px)]' : ''
                          } ${
                            !isSprintStart && !isSprintEnd ? 'ml-[-11px] mr-[-11px] w-[calc(100%+22px)]' : ''
                          } transition-all duration-200 ${
                            isHoveringDesignSprint ? 'opacity-100 scale-y-105 saturate-125 brightness-110 shadow-[0_0_12px_rgba(251,113,133,0.5)]' : 'opacity-85'
                          }`}
                        >
                          {isSprintStart && <span className="truncate whitespace-nowrap">🎨 Design Sprint (Jun 10-12)</span>}
                        </div>
                      ) : (
                        day.events.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            style={{
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: getCategoryColor(item.energy),
                              width: '100%',
                              marginTop: '2px'
                            }}
                            title={item.title}
                          />
                        ))
                      )}

                      {/* Display +N indicator block if greater than 3 */}
                      {!isSprintDay && eventsCount > 3 && (
                        <div className="text-[8px] font-mono text-[var(--tempo-text-muted)] text-right leading-none select-none pr-1">
                          +{eventsCount - 3}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* RIGHT SIDEBAR PANEL (~280px wide) */}
        <aside className="w-full lg:w-[300px] shrink-0 font-sans flex flex-col gap-5">
          
          {/* Card 1: This Month Focus and Donut stats */}
          <div className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-2xl p-5 shadow-lg select-none">
            <h2 className="text-xs font-bold text-[var(--tempo-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[var(--tempo-accent-purple)]" />
              This Month Statistics
            </h2>

            <div className="grid grid-cols-3 divide-x divide-[var(--tempo-border)] border-b border-[var(--tempo-border)]/40 pb-4 mb-4 select-none text-center">
              <div>
                <span className="text-[10px] text-[var(--tempo-text-secondary)]">Tasks Done</span>
                <p className="text-xl font-serif text-[var(--tempo-text-primary)] font-semibold mt-0.5">
                  {monthStatistics.completedCount}
                  <span className="text-xs text-[var(--tempo-text-muted)]">/{monthStatistics.totalCount}</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--tempo-text-secondary)]">Events</span>
                <p className="text-xl font-serif text-[var(--tempo-text-primary)] font-semibold mt-0.5">
                  {monthStatistics.eventsCount}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--tempo-text-secondary)]">Focus</span>
                <p className="text-xl font-serif text-[var(--tempo-text-primary)] font-semibold mt-0.5">
                  {monthStatistics.focusHours}
                  <span className="text-xs text-[var(--tempo-text-muted)]">h</span>
                </p>
              </div>
            </div>

            {/* SVG Donut stats and Legend chart */}
            <div className="flex items-center gap-5 justify-center py-2">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Faint under ring */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2A2A2D" strokeWidth="3" />
                  
                  {/* Slices: Deep (purple) */}
                  <circle 
                    cx="18" cy="18" r="15.915" fill="none" 
                    stroke={energyColors.deep} strokeWidth="3" 
                    strokeDasharray={`${monthStatistics.percentages.deep} 100`} strokeDashoffset="0" 
                  />
                  {/* Admin (amber) */}
                  <circle 
                    cx="18" cy="18" r="15.915" fill="none" 
                    stroke={energyColors.admin} strokeWidth="3" 
                    strokeDasharray={`${monthStatistics.percentages.admin} 100`} strokeDashoffset={`-${monthStatistics.percentages.deep}`} 
                  />
                  {/* Creative (coral) */}
                  <circle 
                    cx="18" cy="18" r="15.915" fill="none" 
                    stroke={energyColors.creative} strokeWidth="3" 
                    strokeDasharray={`${monthStatistics.percentages.creative} 100`} strokeDashoffset={`-${monthStatistics.percentages.deep + monthStatistics.percentages.admin}`} 
                  />
                  {/* Social (teal) */}
                  <circle 
                    cx="18" cy="18" r="15.915" fill="none" 
                    stroke={energyColors.social} strokeWidth="3" 
                    strokeDasharray={`${monthStatistics.percentages.social} 100`} strokeDashoffset={`-${monthStatistics.percentages.deep + monthStatistics.percentages.admin + monthStatistics.percentages.creative}`} 
                  />
                  {/* Light (blue) */}
                  <circle 
                    cx="18" cy="18" r="15.915" fill="none" 
                    stroke={energyColors.light} strokeWidth="3" 
                    strokeDasharray={`${monthStatistics.percentages.light} 100`} strokeDashoffset={`-${monthStatistics.percentages.deep + monthStatistics.percentages.admin + monthStatistics.percentages.creative + monthStatistics.percentages.social}`} 
                  />
                </svg>
                {/* Center text completed tasks */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[11px] font-bold font-mono tracking-tight text-[var(--tempo-text-primary)]">{monthStatistics.completedCount}</span>
                  <span className="text-[7px] text-[var(--tempo-text-muted)] uppercase">Completed</span>
                </div>
              </div>

              {/* Legends detailed */}
              <div className="flex-grow flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded animate-pulse" style={{ backgroundColor: energyColors.deep }} />
                    <span className="text-[10px] text-[var(--tempo-text-secondary)]">Deep Focus</span>
                  </div>
                  <span className="font-mono text-[var(--tempo-text-muted)] font-bold">{monthStatistics.percentages.deep}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded animate-pulse" style={{ backgroundColor: energyColors.admin }} />
                    <span className="text-[10px] text-[var(--tempo-text-secondary)]">Admin/Inb</span>
                  </div>
                  <span className="font-mono text-[var(--tempo-text-muted)] font-bold">{monthStatistics.percentages.admin}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded animate-pulse" style={{ backgroundColor: energyColors.creative }} />
                    <span className="text-[10px] text-[var(--tempo-text-secondary)]">Creative</span>
                  </div>
                  <span className="font-mono text-[var(--tempo-text-muted)] font-bold">{monthStatistics.percentages.creative}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded animate-pulse" style={{ backgroundColor: energyColors.social }} />
                    <span className="text-[10px] text-[var(--tempo-text-secondary)]">Social Focus</span>
                  </div>
                  <span className="font-mono text-[var(--tempo-text-muted)] font-bold">{monthStatistics.percentages.social}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded animate-pulse" style={{ backgroundColor: energyColors.light }} />
                    <span className="text-[10px] text-[var(--tempo-text-secondary)]">Light Recover</span>
                  </div>
                  <span className="font-mono text-[var(--tempo-text-muted)] font-bold">{monthStatistics.percentages.light}%</span>
                </div>
              </div>

            </div>

          </div>

          {/* Card 2: Upcoming events list queue */}
          <div className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-2xl p-5 shadow-lg select-none">
            <h2 className="text-xs font-bold text-[var(--tempo-text-muted)] uppercase tracking-wider mb-3.5 flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[var(--tempo-accent-blue)]" />
                Upcoming Schedule
              </span>
              <span className="text-[10px] font-mono text-[var(--tempo-text-muted)]">{upcomingSchedule.length} matches</span>
            </h2>

            <div className="flex flex-col gap-2.5">
              {upcomingSchedule.length > 0 ? (
                upcomingSchedule.map((ev, index) => {
                  const accent = energyColors[ev.energy] || '#ccc';
                  return (
                    <div 
                      key={ev.id || index}
                      className="flex justify-between items-center p-2 rounded-xl bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)]/50 hover:bg-[var(--tempo-bg-primary)] transition-all duration-150 relative overflow-hidden group/item"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Left side Date chip indicator rounded box */}
                        <span className="px-2 py-1 text-[10px] font-mono font-bold tracking-tight rounded-md select-none text-white shrink-0" style={{ backgroundColor: `${accent}cc` }}>
                          {ev.date}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-[var(--tempo-text-primary)] truncate">
                            {ev.title}
                          </span>
                          <span className="text-[10px] text-[var(--tempo-text-secondary)] inline-block select-none font-mono">
                            Duration: {ev.dur}
                          </span>
                        </div>
                      </div>

                      {/* Category dot pulse inside detail entry */}
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 relative mr-1" style={{ backgroundColor: accent }} />

                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--tempo-text-muted)] py-4 text-center border border-dashed border-[var(--tempo-border)]/40 rounded-xl leading-relaxed">
                  No upcoming activities or events scheduled for this month.
                </p>
              )}
            </div>

          </div>

          {/* Card 3: Productivity Insights (Tidy advice logs) */}
          <div className="bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] rounded-2xl p-5 shadow-lg select-none flex flex-col gap-3">
            <h2 className="text-xs font-bold text-[var(--tempo-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--tempo-accent-amber)]" />
              Productivity Insights
            </h2>

            <div className="flex flex-col gap-3 pt-1 select-none text-xs">
              <div className="p-3 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-xl flex flex-col gap-1 leading-normal">
                <span className="text-[10px] font-bold text-[var(--tempo-accent-amber)] uppercase font-mono tracking-wider">Apex Performance</span>
                <p className="text-[var(--tempo-text-secondary)] font-medium">
                  Your most productive focus runs align on <span className="text-[var(--tempo-text-primary)] font-bold">Tuesday mornings</span>.
                </p>
              </div>

              <div className="p-3 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-xl flex flex-col gap-1 leading-normal">
                <span className="text-[10px] font-bold text-[var(--tempo-accent-blue)] uppercase font-mono tracking-wider">Velocity Streaks</span>
                <p className="text-[var(--tempo-text-secondary)] font-medium">
                  Longest pure deep focus streak is <span className="text-[var(--tempo-text-primary)] font-bold">3h 20min</span>.
                </p>
              </div>

              <div className="p-3 bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] rounded-xl flex flex-col gap-1 leading-normal">
                <span className="text-[10px] font-bold text-[var(--tempo-accent-green)] uppercase font-mono tracking-wider">Rhythm Metrics</span>
                <p className="text-[var(--tempo-text-secondary)] font-medium">
                  Average completed tasks per day: <span className="text-[var(--tempo-text-primary)] font-bold">4.8</span> tasks.
                </p>
              </div>
            </div>

          </div>

        </aside>

      </div>

      {/* FLOATING HOVER CARD MODAL DATA TOOLTIP ELEMENT */}
      {hoveredDay && hoveredDayPos && (
        <div 
          style={{ 
            position: 'absolute', 
            left: `${hoveredDayPos.x}px`, 
            top: `${hoveredDayPos.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none'
          }}
          className="z-50 w-64 bg-[var(--tempo-bg-secondary)]/98 border border-[var(--tempo-border-hover)] rounded-xl p-4 shadow-2xl backdrop-blur-md animate-[fadeIn_0.1s_ease-out] select-none text-left"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-[var(--tempo-border)] mb-2.5">
            <span className="text-xs font-semibold text-[var(--tempo-text-primary)]">
              {hoveredDay.monthName} {hoveredDay.dayNum}, {hoveredDay.yearNum}
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] px-1.5 py-0.2 rounded border border-[#8B5CF6]/20">
              {hoveredDay.completedTasksCount} / {hoveredDay.totalTasksCount} done
            </span>
          </div>

          {/* List of done tasks inside tooltips, max 3 */}
          <div className="flex flex-col gap-2 select-none">
            {hoveredDay.tasks.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-[var(--tempo-text-secondary)] font-bold uppercase tracking-wider font-mono">Tasks Logged:</span>
                {hoveredDay.tasks.slice(0, 3).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-[11px] text-[var(--tempo-text-primary)]">
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: energyColors[item.energy] }} />
                    <span className={`truncate leading-tight ${item.completed ? 'line-through text-[var(--tempo-text-muted)]' : ''}`}>{item.title}</span>
                  </div>
                ))}
                {hoveredDay.tasks.length > 3 && (
                  <span className="text-[9px] font-mono text-[var(--tempo-text-muted)] font-semibold pl-3.5">
                    + {hoveredDay.tasks.length - 3} additional tasks
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-[var(--tempo-text-muted)] italic select-none">
                No focus logs for this day.
              </span>
            )}

            {/* Micro events inside tooltip list */}
            {hoveredDay.events.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[var(--tempo-border)]/55 mt-1.5 select-none">
                <span className="text-[9px] text-[var(--tempo-text-secondary)] font-bold uppercase tracking-wider font-mono">Scheduled:</span>
                {hoveredDay.events.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-[11px] text-[var(--tempo-text-primary)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: energyColors[ev.energy] }} />
                      <span className="truncate">{ev.title}</span>
                    </div>
                    <span className="text-[9px] text-[var(--tempo-text-muted)] shrink-0 font-mono pl-1">
                      {ev.duration}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom link helper */}
            <div className="flex items-center gap-1.5 justify-end pt-2 border-t border-[var(--tempo-border)]/30 mt-2 text-[10px] text-[var(--tempo-accent-blue)] font-bold leading-none select-none">
              <span>Open Day view</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

function StyleTags() {
  return (
    <style>{`
      /* Gravity Pulse applied to active glow items */
      @keyframes active-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 1px rgba(139,92,246,0.3); }
        50%      { transform: scale(1.1); box-shadow: 0 0 8px rgba(139,92,246,0.8); }
      }

      .pulse-indicator {
        animation: active-pulse 2.2s infinite ease-in-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -95%); }
        to   { opacity: 1; transform: translate(-50%, -100%); }
      }
    `}</style>
  );
}
