import React, { useState, useMemo } from 'react';
import { 
  Check, Plus, Trash2, Flame, Sparkles, MoreHorizontal, 
  X, Lightbulb, TrendingUp, AlertTriangle, 
  Calendar, Zap, Edit2
} from 'lucide-react';
import { useHabits } from '../contexts/HabitsContext';
import { DbHabit } from '../hooks/useHabitsData';
import { useNow } from '../useNow';

export default function HabitsView() {
  const {
    habits: dbHabits,
    todayLogs,
    isLoading,
    error,
    checkIn,
    uncheckIn,
    addHabit,
    deleteHabit,
    editHabit,
    getLogs,
    getStreak,
    getBestStreak,
    getCompletionRate,
    getTodayProgress,
    getWeekScore,
    getWeekCompletionRates,
    getAllTimeCount,
    getUserSinceDate,
    getOverallStreak,
    logs
  } = useHabits();

  const now = useNow();

  // States for forms and modal
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#34D399');
  const [newHabitFrequency, setNewHabitFrequency] = useState('Daily');
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);

  // Edit Habit form state
  const [editingHabit, setEditingHabit] = useState<DbHabit | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('✓');
  const [editColor, setEditColor] = useState('#8B5CF6');
  const [editCategory, setEditCategory] = useState('Light');
  const [editFrequency, setEditFrequency] = useState('daily');

  // Deletes confirmations
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmHard, setDeleteConfirmHard] = useState<boolean>(false);
  
  // Confetti bursts and animations
  const [confettiBurst, setConfettiBurst] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [animatedCheckId, setAnimatedCheckId] = useState<string | null>(null);

  // Hover tooltip inside 90 days contribution graph
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    date: string;
    completed: number;
    total: number;
  } | null>(null);

  // Morning Check-In step indices
  const [checkInIndex, setCheckInIndex] = useState<number | null>(null);

  const colorsOption = [
    '#34D399', // Green
    '#8B5CF6', // Purple
    '#60A5FA', // Blue
    '#FBBF24', // Amber
    '#FB7185', // Coral
    '#2DD4BF', // Teal
    '#F472B6', // Pink
    '#A78BFA'  // Light Purple
  ];

  // Map database data into original UI-conforming format
  const habits = useMemo(() => {
    return dbHabits.map((h: DbHabit) => {
      const isChecked = todayLogs.includes(h.id);

      // Past 14 days history chronological order: 13 days ago to today
      const history14Days: boolean[] = [];
      const today = new Date();
      const habitLogsList = logs.filter(l => l.habit_id === h.id).map(l => l.logged_date);
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        // Date format: YYYY-MM-DD
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const formatted = `${y}-${m}-${dayStr}`;
        history14Days.push(habitLogsList.includes(formatted));
      }

      return {
        id: h.id,
        name: h.name,
        icon: h.icon || '✓',
        color: h.color || '#7C3AED',
        category: h.category || 'Light',
        frequency: h.frequency || 'daily',
        streak: getStreak(h.id),
        bestStreak: getBestStreak(h.id),
        completedToday: isChecked,
        history14Days,
        completionRate30Days: getCompletionRate(h.id, 30),
        created_at: h.created_at
      };
    });
  }, [dbHabits, todayLogs, logs, getStreak, getBestStreak, getCompletionRate]);

  // Overall calculations
  const totalHabitsCount = habits.length;
  const completedTodayCount = habits.filter(h => h.completedToday).length;
  const completionTodayRate = totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  // Uncompleted items for morning check in sequence
  const checkInHabits = useMemo(() => {
    return habits.filter(h => !h.completedToday);
  }, [habits]);

  // Interactive check check and uncheck
  const handleToggleHabit = (id: string, e?: React.MouseEvent) => {
    let clientX = 100;
    let clientY = 100;
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    const targetH = habits.find(h => h.id === id);
    if (!targetH) return;

    const isChecked = targetH.completedToday;
    if (!isChecked) {
      // Toggle ON triggers check animation + burst
      setAnimatedCheckId(id);
      setTimeout(() => setAnimatedCheckId(null), 850);

      const burstColors = [targetH.color, '#FFFFFF', '#FB7185', '#34D399'];
      const dots = Array.from({ length: 15 }).map((_, idx) => ({
        id: Date.now() + idx,
        x: clientX + (Math.random() * 80 - 40),
        y: clientY + (Math.random() * 80 - 40),
        color: burstColors[Math.floor(Math.random() * burstColors.length)]
      }));
      setConfettiBurst(prev => [...prev, ...dots]);
      setTimeout(() => {
        setConfettiBurst(prev => prev.filter(p => !dots.find(d => d.id === p.id)));
      }, 1000);

      checkIn(id);
    } else {
      uncheckIn(id);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    let freq = 'daily';
    if (newHabitFrequency.toLowerCase() === 'weekly') {
      freq = 'weekly';
    }

    addHabit(newHabitName.trim(), '✓', newHabitColor, 'Light', freq);
    setNewHabitName('');
    setIsFormExpanded(false);
  };

  const startMorningCheckIn = () => {
    if (checkInHabits.length > 0) {
      setCheckInIndex(0);
    } else {
      alert("All habits checked off today! Amazing job! 🚀");
    }
  };

  const handleCheckInResponse = (complete: boolean) => {
    if (checkInIndex === null) return;
    
    const targetHabit = checkInHabits[checkInIndex];
    if (complete) {
      handleToggleHabit(targetHabit.id);
    }

    if (checkInIndex < checkInHabits.length - 1) {
      setCheckInIndex(checkInIndex + 1);
    } else {
      setCheckInIndex(null);
    }
  };

  // Edit capabilities
  const openEditModal = (h: DbHabit) => {
    setEditingHabit(h);
    setEditName(h.name);
    setEditIcon(h.icon || '✓');
    setEditColor(h.color || '#7C3AED');
    setEditCategory(h.category || 'Light');
    setEditFrequency(h.frequency || 'daily');
    setActiveMenuHabitId(null);
  };

  const handleSaveEdit = () => {
    if (!editingHabit || !editName.trim()) return;
    editHabit(editingHabit.id, {
      name: editName.trim(),
      icon: editIcon || '✓',
      color: editColor,
      category: editCategory as any,
      frequency: editFrequency
    });
    setEditingHabit(null);
  };

  const handleTriggerDelete = (hard: boolean) => {
    if (!editingHabit) return;
    setDeleteConfirmId(editingHabit.id);
    setDeleteConfirmHard(hard);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteHabit(deleteConfirmId, deleteConfirmHard);
    setDeleteConfirmId(null);
    setEditingHabit(null);
  };

  // Date formatting for header
  const formattedDate = useMemo(() => {
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, [now]);

  const headerSubtitle = useMemo(() => {
    const hrs = now.getHours();
    if (hrs < 12) return "Let's protect your morning momentum";
    if (hrs < 17) return "Keep the momentum going";
    return "Finish the day strong";
  }, [now]);

  // Contribution 90 days calculations
  const contributionData = useMemo(() => {
    const list = [];
    const totalCount = habits.length || 1;
    for (let i = 90; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const formatted = `${y}-${m}-${dayStr}`;

      const completedCount = habits.filter(h => 
        logs.some(l => l.habit_id === h.id && l.logged_date === formatted)
      ).length;

      list.push({
        offset: i,
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completedCount,
        totalCount,
        isToday: i === 0,
        dayOfWeek: d.getDay() === 0 ? 6 : d.getDay() - 1 // Mon=0 to Sun=6
      });
    }
    return list;
  }, [habits, logs]);

  const sortedHabitsForChart = useMemo(() => {
    return [...habits].sort((a, b) => b.completionRate30Days - a.completionRate30Days);
  }, [habits]);

  // WEEK Score Card
  const weekScore = useMemo(() => {
    return getWeekScore();
  }, [getWeekScore]);

  const weekCompletionRates = useMemo(() => {
    return getWeekCompletionRates();
  }, [getWeekCompletionRates]);

  // INTEL INSIGHT GENERATION
  const intelligenceInsights = useMemo(() => {
    if (logs.length < 7) {
      return [
        { icon: '💡', text: 'Complete a few days to unlock insights' }
      ];
    }

    const list: { icon: string; text: string }[] = [];

    // Weekday vs Weekend Difference
    for (const h of habits) {
      let weekdayCompleted = 0;
      let weekdayCount = 0;
      let weekendCompleted = 0;
      let weekendCount = 0;

      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const yyyyy = d.getFullYear();
        const mmmm = String(d.getMonth() + 1).padStart(2, '0');
        const dddd = String(d.getDate()).padStart(2, '0');
        const formatted = `${yyyyy}-${mmmm}-${dddd}`;

        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const logged = logs.some(l => l.habit_id === h.id && l.logged_date === formatted);

        if (isWeekend) {
          weekendCount++;
          if (logged) weekendCompleted++;
        } else {
          weekdayCount++;
          if (logged) weekdayCompleted++;
        }
      }

      const weekdayRate = weekdayCount > 0 ? (weekdayCompleted / weekdayCount) * 100 : 0;
      const weekendRate = weekendCount > 0 ? (weekendCompleted / weekendCount) * 100 : 0;

      if (Math.abs(weekdayRate - weekendRate) > 15) {
        if (weekdayRate > weekendRate) {
          list.push({
            icon: '💡',
            text: `You complete ${h.name} more on weekdays (${Math.round(weekdayRate)}%) than weekends (${Math.round(weekendRate)}%).`
          });
        } else {
          list.push({
            icon: '💡',
            text: `You complete ${h.name} more on weekends (${Math.round(weekendRate)}%) than weekdays (${Math.round(weekdayRate)}%).`
          });
        }
        break; // Only 1
      }
    }

    if (list.length === 0 && habits.length > 0) {
      list.push({
        icon: '💡',
        text: `Let's work on completing ${habits[0].name} consistently during the morning hours.`
      });
    }

    // Trend: Compare last 7 days vs previous 7 days
    for (const h of habits) {
      let last7 = 0;
      let prev7 = 0;
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const formatted = `${y}-${m}-${dd}`;
        if (logs.some(l => l.habit_id === h.id && l.logged_date === formatted)) last7++;
      }

      for (let i = 7; i < 14; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const formatted = `${y}-${m}-${dd}`;
        if (logs.some(l => l.habit_id === h.id && l.logged_date === formatted)) prev7++;
      }

      if (last7 > prev7) {
        list.push({
          icon: '📈',
          text: `Your ${h.name} streak is growing — improving consistency this week!`
        });
        break;
      } else if (last7 < prev7) {
        list.push({
          icon: '⚠️',
          text: `Your ${h.name} needs attention (logged less this week than last week).`
        });
        break;
      }
    }

    if (list.length < 2 && habits.length > 0) {
      list.push({
        icon: '📈',
        text: `Your weekly commitment consistency is on solid steady state.`
      });
    }

    // Lowest performing
    if (habits.length > 0) {
      const lowest = [...habits].sort((a, b) => a.completionRate30Days - b.completionRate30Days)[0];
      list.push({
        icon: '⚠️',
        text: `${lowest.name} has the lowest completion (${lowest.completionRate30Days}%). Consider adjusting daily triggers.`
      });
    }

    return list.slice(0, 3);
  }, [habits, logs]);

  // Loading indicator matching system aesthetic
  if (isLoading) {
    return (
      <div id="habits-view-loading" className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center font-sans gap-4 animate-fadeIn">
        <div className="w-10 h-10 border-2 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin" />
        <span className="text-[#8A8A90] text-xs font-mono">Synchronizing with cloud registry...</span>
      </div>
    );
  }

  // Error viewport
  if (error) {
    return (
      <div id="habits-view-error" className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center font-sans gap-5 animate-fadeIn">
        <div className="w-12 h-12 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-500">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div className="text-center flex flex-col gap-1.5">
          <h3 className="text-[#F1F1F1] text-md font-serif">Data Sync Problem</h3>
          <p className="text-[#8A8A90] text-xs max-w-sm">{error.message || 'Please check your Supabase connection and database rules.'}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#FB7185] hover:opacity-90 rounded-8 text-xs font-semibold text-white shadow-lg cursor-pointer"
        >
          Force Reload
        </button>
      </div>
    );
  }

  return (
    <div id="habits-view" className="flex-grow w-full max-w-7xl mx-auto px-6 py-6 overflow-y-auto flex flex-col gap-6 animate-fadeIn font-sans selection:bg-purple-900/40">
      
      {/* LOCAL STYLES INJECTION */}
      <StyleTags />

      {/* CONFETTI BURST RENDERER */}
      {confettiBurst.map(dot => (
        <div 
          key={dot.id}
          className="fixed pointer-events-none z-[9999] w-2 h-2 rounded-full confetti-particle"
          style={{ 
            left: dot.x, 
            top: dot.y, 
            backgroundColor: dot.color,
            boxShadow: `0 0 8px ${dot.color}`
          }}
        />
      ))}

      {/* EDIT/DELETE HABIT MODAL */}
      {editingHabit && (
        <div className="fixed inset-0 z-[1100] bg-[#0D0D0FB3] backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-[#141416] border border-[#2A2A2D] rounded-16 p-6 shadow-2xl relative flex flex-col gap-4 animate-scaleIn">
            <button 
              onClick={() => setEditingHabit(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-serif text-[#F1F1F1]">Edit Habit Commitment</h3>
              <p className="text-xs text-[#8A8A90]">Adjust your routine details and configuration</p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Habit Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-[#F1F1F1]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              {/* Icon & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Icon</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-center text-[#F1F1F1]"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Category</label>
                  <select
                    className="w-full px-2 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-[#F1F1F1]"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="Deep">Deep</option>
                    <option value="Light">Light</option>
                    <option value="Admin">Admin</option>
                    <option value="Creative">Creative</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Frequency</label>
                <select
                  className="w-full px-2 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-[#F1F1F1]"
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Color Palette */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Theme Palette Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorsOption.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-5 h-5 rounded-full relative transition-transform transform active:scale-90 cursor-pointer ${
                        editColor === c ? 'scale-110 ring-2 ring-white/50 ring-offset-2 ring-offset-[#141416]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 border-t border-[#2A2A2D] pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerDelete(false)}
                  className="px-2.5 py-1.5 text-[10px] font-semibold text-[#8A8A90] hover:text-[#FB7185] border border-[#2A2A2D] hover:border-[#FB7185]/20 rounded-8 transition-all cursor-pointer"
                >
                  Soft Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerDelete(true)}
                  className="px-2.5 py-1.5 text-[10px] font-semibold text-red-500 hover:text-red-400 border border-red-950 hover:bg-red-950/15 rounded-8 transition-all cursor-pointer"
                >
                  Hard Delete
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#8A8A90] border border-[#2A2A2D] hover:bg-white/5 rounded-8 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-8 transition-all cursor-pointer animate-pulse"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1200] bg-[#000000CC] backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-[#141416] border border-[#2A2A2D] rounded-16 p-6 shadow-2xl relative flex flex-col gap-5 select-none text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <h4 className="text-lg font-bold text-[#F1F1F1]">
                {deleteConfirmHard ? 'Hard Delete Habit?' : 'Hide Habit (Soft Delete)?'}
              </h4>
              <p className="text-xs text-[#8A8A90] leading-relaxed">
                {deleteConfirmHard 
                  ? 'This is permanent. All completion log history for this routine will be irreversibly wiped from the database.' 
                  : 'This will hide the habit from active trackers but preserve your long-term consistency and historic completion logs.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="py-2 rounded-8 border border-[#2A2A2D] hover:bg-white/5 text-xs font-semibold text-[#8A8A90] hover:text-[#F1F1F1] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2 rounded-8 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MORNING CHECKIN MODE DIALOG */}
      {checkInIndex !== null && checkInHabits[checkInIndex] && (
        <div className="fixed inset-0 z-[1100] bg-[#0D0D0FB3] backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-[#141416] border border-[#2A2A2D] rounded-16 p-6 shadow-2xl relative flex flex-col gap-6 animate-scaleIn select-none">
            
            <button 
              onClick={() => setCheckInIndex(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#FB7185] font-bold">
                ☀️ Morning Check-In Tracker
              </span>
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-sm font-sans text-[#8A8A90]">
                  Habit <span className="text-[#F1F1F1] font-bold">{checkInIndex + 1}</span> of {checkInHabits.length}
                </span>
                <span className="text-xs font-mono text-[#8A8A90]">
                  {Math.round(((checkInIndex + 1) / checkInHabits.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-[#1C1C1F] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#FB7185] transition-all duration-300"
                  style={{ width: `${((checkInIndex + 1) / checkInHabits.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-[#1C1C1F] border border-[#2A2A2D] rounded-12 p-6 text-center flex flex-col items-center gap-4 relative overflow-hidden">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold animate-pulse text-white shadow-lg"
                style={{ 
                  backgroundColor: checkInHabits[checkInIndex].color,
                  boxShadow: `0 8px 24px ${checkInHabits[checkInIndex].color}25`
                }}
              >
                {checkInHabits[checkInIndex].icon || checkInHabits[checkInIndex].name.charAt(0)}
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-sans font-bold text-[#F1F1F1]">
                  {checkInHabits[checkInIndex].name}
                </h3>
                <span className="text-xs text-[#8A8A90]">
                  ⚡ Current Streak: {checkInHabits[checkInIndex].streak} days | Best: {checkInHabits[checkInIndex].bestStreak} days
                </span>
              </div>
            </div>

            <p className="text-sm text-center text-[#8A8A90] italic">
              "Did you make time for this commitment today?"
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCheckInResponse(false)}
                className="w-full py-3 rounded-8 border border-[#2A2A2D] hover:bg-white/5 hover:border-[#3D3D42] text-xs font-medium text-[#8A8A90] hover:text-[#F1F1F1] transition-all cursor-pointer"
              >
                ✕ Not yet / Skip
              </button>
              <button
                type="button"
                onClick={() => handleCheckInResponse(true)}
                className="w-full py-3 rounded-8 text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:opacity-90 transform active:scale-95"
                style={{ backgroundColor: checkInHabits[checkInIndex].color }}
              >
                <Check className="w-4 h-4" />
                <span>Yes, completed!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
        
        {/* =========================================================
            LEFT COLUMN (60% equivalent: columns 1-6)
            ========================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          
          {/* HEADER ROW WITH STREAM badge CONTROLS */}
          <div className="flex items-center justify-between bg-[#141416] border border-[#2A2A2D] rounded-12 p-4 shrink-0 shadow-sm relative overflow-hidden">
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#F1F1F1] tracking-tight">
                  Daily Habits
                </h1>
                
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/20 shadow-[0_0_12px_#34D39910]">
                  <Flame className="w-3.5 h-3.5 animate-bounce fill-current" />
                  <span>{getOverallStreak()}-day streak</span>
                </span>
              </div>
              <span className="text-xs text-[#8A8A90] font-sans">
                {formattedDate} • {headerSubtitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startMorningCheckIn}
                title="Trigger guided morning capture flow step-by-step"
                className="px-3 py-1.5 rounded-8 text-xs font-semibold bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 transition-all cursor-pointer flex items-center gap-1 hover:shadow-lg hover:shadow-[#8B5CF610]"
              >
                <span>☀️ Check-In</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFormExpanded(true)}
                className="px-3.5 py-1.5 rounded-8 text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all cursor-pointer shadow-lg hover:shadow-[#8B5CF625] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Habit</span>
              </button>
            </div>

          </div>

          {/* TODAY'S HABITS: VERTICAL CARDS LIST */}
          <div className="flex flex-col gap-3 min-h-[300px]">
            {habits.length > 0 ? (
              habits.map((habit) => {
                const isChecked = habit.completedToday;
                const isMenuOpen = activeMenuHabitId === habit.id;
                const isCheckAnimated = animatedCheckId === habit.id;

                const dbHabitRef = dbHabits.find(dh => dh.id === habit.id);

                return (
                  <div 
                    key={habit.id}
                    className="h-[68px] relative rounded-12 border bg-[#141416] transition-all duration-150 flex items-center justify-between px-4 group hover:border-[#3D3D42]"
                    style={{ 
                      borderColor: isChecked ? `${habit.color}30` : '#2A2A2D',
                      boxShadow: isChecked ? `inset 2px 0 0 ${habit.color}, 0 2px 8px rgba(0,0,0,0.2)` : 'none'
                    }}
                  >
                    
                    {/* LEFT SIDE: CIRCULAR SELECTOR CHECKBOX */}
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => handleToggleHabit(habit.id, e)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative select-none cursor-pointer border-2 ${
                          isChecked 
                            ? 'shadow-lg text-white font-black' 
                            : 'bg-transparent border-[#2A2A2D]'
                        } ${isCheckAnimated ? 'animate-[springCheck_0.6s_ease-out]' : ''}`}
                        style={{ 
                          backgroundColor: isChecked ? habit.color : 'transparent',
                          borderColor: isChecked ? habit.color : '#2A2A2D',
                          '--hover-border-color': habit.color,
                          '--hover-bg-opacity': `${habit.color}15`,
                          boxShadow: isChecked ? `0 0 12px ${habit.color}25` : 'none'
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.borderColor = habit.color;
                            e.currentTarget.style.backgroundColor = `${habit.color}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.borderColor = '#2A2A2D';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {isChecked ? (
                          <Check className="w-5 h-5 text-white stroke-[3px]" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: habit.color }} />
                        )}
                      </button>

                      {/* CENTER DESCRIPTION AND INLINE CONTRIBUTION DOT GRID */}
                      <div className="flex flex-col gap-1">
                        <span className={`text-[15px] font-sans font-bold leading-none ${isChecked ? 'text-[#F1F1F1] line-through opacity-75' : 'text-[#F1F1F1]'}`}>
                          {habit.name}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#8A8A90] font-mono leading-none">
                            {habit.streak > 0 ? `🔥 Streak: ${habit.streak} days` : 'Not done yesterday'}
                          </span>
                          
                          <span className="text-[#2A2A2D] text-xs font-bold font-mono">|</span>

                          {/* Tiny 14-days contribution dot bar */}
                          <div className="flex items-center gap-[3px] py-0.5 px-1 rounded bg-[#0D0D0F]">
                            {habit.history14Days.map((val, idx) => (
                              <div 
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  val ? '' : 'bg-[#1C1C1F]'
                                }`}
                                style={{ 
                                  backgroundColor: val ? habit.color : '#1C1C1F' 
                                }}
                                title={`Day ${idx + 1}: ${val ? 'Completed' : 'Missed'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: COLLAPSIBILITY OPTIONS & STREAK ACCENT BADGE */}
                    <div className="flex items-center gap-3">
                      
                      {/* Best streak indicator capsule */}
                      <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C1C1F] border border-[#2A2A2D] text-[10px] font-mono text-[#8A8A90]">
                        <Zap className="w-3 h-3 text-[#FBBF24]" />
                        <span>Best: {habit.bestStreak}d</span>
                      </div>

                      {/* Right color element badge */}
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: habit.color }} />

                      {/* Actions dropdown trigger */}
                      <div className="relative flex items-center gap-1.5">
                        {dbHabitRef && (
                          <button
                            type="button"
                            onClick={() => openEditModal(dbHabitRef)}
                            title="Edit routine configuration"
                            className="p-1 rounded text-[#4A4A52] hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveMenuHabitId(isMenuOpen ? null : habit.id)}
                          className="p-1 rounded text-[#4A4A52] hover:text-[#F1F1F1] hover:bg-white/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-7 z-25 w-32 bg-[#1C1C1F] border border-[#2A2A2D] rounded-8 p-1 shadow-xl flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleHabit(habit.id);
                                setActiveMenuHabitId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded text-[11px] font-mono text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-white/5 cursor-pointer"
                            >
                              Toggle Today
                            </button>
                            {dbHabitRef && (
                              <button
                                type="button"
                                onClick={() => openEditModal(dbHabitRef)}
                                className="w-full text-left px-2 py-1.5 rounded text-[11px] font-mono text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-white/5 cursor-pointer"
                              >
                                Edit Habit...
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (dbHabitRef) {
                                  setEditingHabit(dbHabitRef);
                                  handleTriggerDelete(false);
                                }
                              }}
                              className="w-full text-left px-2 py-1.5 rounded text-[11px] font-mono text-[#FB7185] hover:text-[#FB7185] hover:bg-[#FB7185]/10 cursor-pointer"
                            >
                              Delete Habit
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })
            ) : (
              <div className="border-2 border-dashed border-[#2A2A2D] rounded-12 h-48 flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="w-8 h-8 text-[#4A4A52] mb-2" />
                <h3 className="text-sm font-bold text-[#F1F1F1]">No habits logged yet</h3>
                <p className="text-xs text-[#8A8A90] mt-1 mb-3">
                  Build habits that stick. Add your first recurring daily ritual to begin.
                </p>
                <button
                  type="button"
                  onClick={() => setIsFormExpanded(true)}
                  className="px-4 py-1.5 rounded-8 text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all cursor-pointer shadow-lg flex items-center gap-1.5 animate-pulse"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add your first habit</span>
                </button>
              </div>
            )}
          </div>

          {/* BELOW THE LIST: EXPANDABLE QUICK ADD SECTION */}
          <div className="bg-[#141416]/50 border border-[#2A2A2D] rounded-12 p-4">
            {!isFormExpanded ? (
              <button
                type="button"
                onClick={() => setIsFormExpanded(true)}
                className="w-full h-11 border border-dashed border-[#2A2A2D]/60 hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5 rounded-8 text-left text-xs font-mono text-[#8A8A90] hover:text-[#F1F1F1] px-4 flex items-center gap-2.5 cursor-pointer transition-all"
              >
                <span className="w-5 h-5 rounded-full bg-[#1C1C1F] flex items-center justify-center font-bold text-sm text-[var(--tempo-accent-blue)]">+</span>
                <span>Track something new... Add Quick Habit</span>
              </button>
            ) : (
              <form onSubmit={handleAddHabit} className="flex flex-col gap-4 animate-scaleUp">
                <div className="flex justify-between items-center border-b border-[#2A2A2D] pb-2">
                  <span className="text-xs font-sans font-bold text-[#F1F1F1]">Create Habit Commitment</span>
                  <button 
                    type="button" 
                    onClick={() => setIsFormExpanded(false)}
                    className="p-1 rounded hover:bg-white/5 text-[#8A8A90] hover:text-[#F1F1F1] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  
                  {/* Name Input */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Habit Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Read 20 minutes..."
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-[#F1F1F1]"
                    />
                  </div>

                  {/* Frequency Option */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Frequency</label>
                    <select
                      value={newHabitFrequency}
                      onChange={(e) => setNewHabitFrequency(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-[#F1F1F1]"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-8 text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all cursor-pointer shadow-lg"
                    >
                      Create
                    </button>
                  </div>

                </div>

                {/* Color Selector Row */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A90]">Theme Palette Color</span>
                  <div className="flex flex-wrap gap-2">
                    {colorsOption.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewHabitColor(c)}
                        className={`w-6 h-6 rounded-full relative transition-transform transform active:scale-90 cursor-pointer ${
                          newHabitColor === c ? 'scale-110 ring-2 ring-white/50 ring-offset-2 ring-offset-[#141416]' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

              </form>
            )}
          </div>

        </div>

        {/* =========================================================
            RIGHT COLUMN (40% equivalent: columns 7-10)
            ========================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* OVERALL STREAK VISUALIZATION INDEX GRID (90 DAYS HARVEST) */}
          <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-4 select-none relative shadow-sm">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">
                📅 Past 90 Days Contribution
              </span>
              <span className="text-[10px] font-mono text-[#4A4A52]">
                13 columns × 7 rows
              </span>
            </div>

            {/* CONTRIBUTION GRID GRAPH BODY */}
            <div className="flex gap-2.5 items-start">
              {/* Left Row Day Labels */}
              <div className="grid grid-rows-7 gap-[3px] text-[8px] font-mono text-[#4A4A52] justify-items-end pt-1 pr-0.5">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>

              {/* Main SVG/Grid */}
              <div className="flex-grow flex flex-col gap-1 relative">
                <div className="grid grid-flow-col grid-cols-13 grid-rows-7 gap-[3px]">
                  {contributionData.map((day, idx) => {
                    const percentSum = day.totalCount > 0 ? day.completedCount / day.totalCount : 0;
                    let bgColor = '#1C1C1F';
                    let glowClass = '';

                    if (day.completedCount > 0) {
                      if (percentSum <= 0.3) {
                        bgColor = `rgba(139, 92, 246, 0.3)`; // purple at 30%
                      } else if (percentSum <= 0.6) {
                        bgColor = `rgba(139, 92, 246, 0.6)`; // purple at 60%
                      } else {
                        bgColor = `#8B5CF6`; // purple full opacity
                        glowClass = 'shadow-[0_0_8px_#8B5CF680] ring-1 ring-[#8B5CF6]';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className={`w-[10px] h-[10px] rounded-[1.5px] cursor-pointer transition-all duration-150 ${glowClass} ${
                          day.isToday ? 'outline-dashed outline-1 outline-offset-1 outline-[#8B5CF6]' : ''
                        }`}
                        style={{ backgroundColor: bgColor }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipData({
                            x: rect.left,
                            y: rect.top - 40,
                            date: day.date,
                            completed: day.completedCount,
                            total: day.totalCount
                          });
                        }}
                        onMouseLeave={() => setTooltipData(null)}
                      />
                    );
                  })}
                </div>

                {/* Footer Month indications */}
                <div className="flex justify-between text-[9px] font-mono text-[#4A4A52] px-1 mt-1 shrink-0">
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>

            {/* Grid Tooltip Render block */}
            {tooltipData && (
              <div 
                className="fixed bg-[var(--tempo-bg-tertiary)] border border-[var(--tempo-border)] text-[10px] p-2 rounded shadow-2xl z-[1200] max-w-xs animate-fadeIn text-[var(--tempo-text-primary)] pointer-events-none"
                style={{ left: tooltipData.x - 40, top: tooltipData.y }}
              >
                <div className="font-mono font-bold text-[#8B5CF6]">{tooltipData.date}</div>
                <div>{tooltipData.completed}/{tooltipData.total} habits completed</div>
              </div>
            )}
          </div>

          {/* COMPLETION STATS CARDS (2x2 GRID) */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            
            {/* Card 1: Today circular progress SVG */}
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-3 text-center flex flex-col items-center justify-center gap-1.5 shadow-sm relative">
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wide">Today</span>
              
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                  <circle
                    className="stroke-[#1C1C1F]"
                    cx={22}
                    cy={22}
                    r={18}
                    strokeWidth={4}
                    fill="transparent"
                  />
                  <circle
                    className="stroke-[#34D399] transition-all duration-500 ease"
                    cx={22}
                    cy={22}
                    r={18}
                    strokeWidth={4}
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={((100 - completionTodayRate) / 100) * (2 * Math.PI * 18)}
                    fill="transparent"
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                <span className="text-xs font-mono font-bold text-[#34D399]">
                  {completionTodayRate}%
                </span>
              </div>
              <span className="text-[11px] font-sans font-bold text-[#F1F1F1] leading-none mt-1">
                {completedTodayCount}/{totalHabitsCount} done
              </span>
            </div>

            {/* Card 2: This Week bar graph */}
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-3 text-center flex flex-col items-center justify-center gap-1 shadow-sm">
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wide">This Week</span>
              
              <div className="flex items-end justify-between w-24 h-14 px-1 gap-1">
                {weekCompletionRates.map((val, idx) => (
                  <div key={idx} className="flex-grow flex flex-col items-center justify-end h-full">
                    <div 
                      className="w-2.5 rounded-t-2 self-center transition-all duration-300"
                      style={{ 
                        height: `${val || 4}%`, 
                        backgroundColor: idx === (now.getDay() === 0 ? 6 : now.getDay() - 1) ? '#34D399' : '#8B5CF6' 
                      }}
                      title={`Day ${idx + 1}: ${val}%`}
                    />
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-sans font-bold text-[#F1F1F1] leading-none mt-1.5">
                {weekScore}% avg score
              </span>
            </div>

            {/* Card 3: Current Streak Lightning */}
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-3 block text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#FBBF24] fill-current" />
                <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wide">Streak</span>
              </div>
              <div className="text-2xl font-serif text-[#FBBF24] font-bold leading-none mt-2">
                {getOverallStreak()} Days
              </div>
              <span className="text-[10px] font-mono text-[#4A4A52] block mt-2">
                Protected today!
              </span>
            </div>

            {/* Card 4: All-Time Calendar icon */}
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-3 block text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#FB7185]" />
                <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wide">All-Time</span>
              </div>
              <div className="text-2xl font-serif text-[#FB7185] font-bold leading-none mt-2">
                {getAllTimeCount()} Done
              </div>
              <span className="text-[10px] font-mono text-[#4A4A52] block mt-2">
                {getUserSinceDate()}
              </span>
            </div>

          </div>

          {/* HABIT BREAKDOWN CHART LIST */}
          <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-4 select-none shadow-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold block mb-4">
              📈 Habit Breakdown (Last 30 Days)
            </span>

            {habits.length > 0 ? (
              <div className="flex flex-col gap-3">
                {sortedHabitsForChart.map((habit) => {
                  const totalBlocksCount = 10;
                  const completedBlocksCount = Math.round(habit.completionRate30Days / 10);
                  const blockStr = '█'.repeat(completedBlocksCount) + '░'.repeat(totalBlocksCount - completedBlocksCount);

                  return (
                    <div key={habit.id} className="flex flex-col gap-1.5">
                      
                      {/* Header values */}
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#F1F1F1] font-bold leading-none">
                          {habit.name}
                        </span>
                        <span className="text-[#8A8A90] font-semibold leading-none">
                          {habit.completionRate30Days}%
                        </span>
                      </div>

                      {/* Progress slider bar matching formatted look */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#4A4A52] leading-none select-all font-bold">
                          |{blockStr}|
                        </span>
                        <div className="flex-grow h-1.5 bg-[#1C1C1F] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${habit.completionRate30Days}%`,
                              backgroundColor: habit.color,
                              boxShadow: `0 0 8px ${habit.color}25`
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-[#8A8A90] font-sans">No performance data yet</span>
            )}
          </div>

          {/* INSIGHTS METRICS CARD */}
          <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-4 select-none relative shadow-sm overflow-hidden flex flex-col gap-3.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold block">
              💡 Intelligence Agency Insights
            </span>
            
            <div className="flex flex-col gap-3.5">
              {intelligenceInsights.map((insight, idx) => (
                <div key={idx} className={`flex items-start gap-2.5 ${idx !== 0 ? 'border-t border-[#2A2A2D]/40 pt-3' : ''}`}>
                  <span className="text-base shrink-0 select-none">{insight.icon}</span>
                  <p className="text-xs text-[#8A8A90] leading-relaxed select-text">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// INLINE CURE STYLES ANIMATIONS
function StyleTags() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* Circular checkbox spring animation */
      @keyframes springCheck {
        0% { transform: scale(1.0); }
        30% { transform: scale(1.3); }
        65% { transform: scale(0.9); }
        100% { transform: scale(1.0); }
      }

      /* Bounce animations */
      @keyframes bounceIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      /* Particle effect animation */
      @keyframes confettiDrop {
        0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
        100% { transform: translateY(40px) scale(0.6) rotate(360deg); opacity: 0; }
      }

      .confetti-particle {
        animation: confettiDrop 0.8s ease-out forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from { transform: scale(0.96); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .animate-fadeIn {
        animation: fadeIn 0.25s ease-out forwards;
      }
      .animate-scaleIn {
        animation: scaleIn 0.2s ease-out forwards;
      }
      .animate-scaleUp {
        animation: slideUp 0.15s ease-out forwards;
      }
    `}} />
  );
}
