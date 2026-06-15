import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, Zap, RefreshCw, Layers, TrendingUp, AlertTriangle, 
  CheckCircle2, Plus, CornerDownRight, Check, Sparkles, MessageSquare, 
  Compass, BarChart3, Clock, AlertOctagon, HelpCircle, Activity, Play 
} from 'lucide-react';
import { useVelocityData } from '../hooks/useVelocityData';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

const formatTimeDebt = (mins: number) => {
  if (mins === 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function VelocityDashboard() {
  // 1. STATE & VELOCITY DATA SYSTEM
  const getMondayOfCurrentWeek = (): Date => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const m = new Date(d.setDate(diff));
    m.setHours(0, 0, 0, 0);
    return m;
  };

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfCurrentWeek());
  
  // Custom hook fetches blocks in parallel for this week and last week
  const { thisWeek, lastWeek, isLoading, refetch } = useVelocityData(weekStart);

  const [isGenerating, setIsGenerating] = useState(false);
  const [donutHoveredId, setDonutHoveredId] = useState<string | null>(null);
  
  // Hover states for the main Plan vs Completed chart
  const [barTooltip, setBarTooltip] = useState<{
    x: number;
    y: number;
    day: string;
    planned: number;
    completed: number;
  } | null>(null);

  // Hover states for the Heatmap grid
  const [heatmapTooltip, setHeatmapTooltip] = useState<{
    x: number;
    y: number;
    day: string;
    hour: string;
    level: string;
  } | null>(null);

  // States for weekly review saving to localStorage
  const [wentWellText, setWentWellText] = useState('');
  const [toImproveText, setToImproveText] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');

  // Weekly range formatter helper
  const formatWeekRange = (start: Date): string => {
    const end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const endDay = end.getDate();
    const endYear = end.getFullYear();
    
    if (startMonth === endMonth) {
      return `Week of ${startMonth} ${startDay}–${endDay}, ${endYear}`;
    } else {
      return `Week of ${startMonth} ${startDay} – ${endMonth} ${endDay}, ${endYear}`;
    }
  };

  // Navigations
  const goToPrevWeek = () => {
    setWeekStart(prev => {
      const next = new Date(prev.getTime());
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const goToNextWeek = () => {
    setWeekStart(prev => {
      const next = new Date(prev.getTime());
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const isCurrentWeek = useMemo(() => {
    return weekStart.getTime() >= getMondayOfCurrentWeek().getTime();
  }, [weekStart]);

  // Load weekly review data per week
  useEffect(() => {
    const key = `velocity_review_${weekStart.toISOString()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWentWellText(parsed.wentWell ?? "");
        setToImproveText(parsed.toImprove ?? "");
        setGoals(parsed.goals ?? []);
      } catch (err) {
        // ignore
      }
    } else {
      // Default fallback templates as per standard/checklist
      setWentWellText(
        "• Maintained pristine deep work focus hours on Monday and Tuesday early cycles (9am-12pm)\n• Completed all expected community sync and social communication commitments on Thursday\n• Daily focus streak maintained correctly: reached its best of 12 consecutive days"
      );
      setToImproveText(
        "• Wednesday completely derailed internally by off-hand context switches and unscheduled support overhead\n• Documentation and locking dependency issues continue to get postponed week-over-week (3x logged)\n• Consistently overestimate high impact creative assignments by approx ~30% estimation cushion"
      );
      setGoals([
        { id: '1', text: 'Lock in 3 morning pomodoro sessions daily', completed: false },
        { id: '2', text: 'Create draft docs using bullet-point templates', completed: false },
        { id: '3', text: 'Add 15 min cushion buffer to high-impact dev tasks', completed: false },
      ]);
    }
  }, [weekStart]);

  // Storage changes
  const handleWentWellChange = (val: string) => {
    setWentWellText(val);
    const key = `velocity_review_${weekStart.toISOString()}`;
    const saved = localStorage.getItem(key);
    let parsed: any = {};
    if (saved) {
      try { parsed = JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem(key, JSON.stringify({
      wentWell: val,
      toImprove: parsed.toImprove ?? toImproveText,
      goals: parsed.goals ?? goals
    }));
  };

  const handleToImproveChange = (val: string) => {
    setToImproveText(val);
    const key = `velocity_review_${weekStart.toISOString()}`;
    const saved = localStorage.getItem(key);
    let parsed: any = {};
    if (saved) {
      try { parsed = JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem(key, JSON.stringify({
      wentWell: parsed.wentWell ?? wentWellText,
      toImprove: val,
      goals: parsed.goals ?? goals
    }));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const goal: Goal = {
      id: Date.now().toString(),
      text: newGoalText.trim(),
      completed: false
    };
    const updated = [...goals, goal];
    setGoals(updated);
    setNewGoalText('');

    const key = `velocity_review_${weekStart.toISOString()}`;
    const saved = localStorage.getItem(key);
    let parsed: any = {};
    if (saved) {
      try { parsed = JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem(key, JSON.stringify({
      ...parsed,
      goals: updated
    }));
  };

  const handleToggleGoal = (id: string) => {
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setGoals(updated);

    const key = `velocity_review_${weekStart.toISOString()}`;
    const saved = localStorage.getItem(key);
    let parsed: any = {};
    if (saved) {
      try { parsed = JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem(key, JSON.stringify({
      ...parsed,
      goals: updated
    }));
  };

  // Trigger loading sequence for automation weekly reviews
  const handleTriggerGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      refetch();
    }, 1500);
  };

  // 2. MATH CALCULATIONS FOR RENDER BOUNDS
  const workDaysWithActivity = thisWeek.byDay.slice(0, 5).filter(d => d.planned > 0).length;

  // KPI calculations
  const completionRateDiff = thisWeek.completionRate - (lastWeek.completionRate ?? 0);
  const isRatePositive = completionRateDiff >= 0;
  const rateDiffSign = completionRateDiff >= 0 ? '+' : '';

  const focusDiff = thisWeek.focusHours - (lastWeek.focusHours ?? 0);
  const isFocusPositive = focusDiff >= 0;
  const focusDiffSign = focusDiff >= 0 ? '+' : '';
  const focusRatio = Math.min(thisWeek.focusHours / 20, 1);
  const focusPercentage = Math.round(focusRatio * 100);

  const debtDiff = thisWeek.timeDebt - (lastWeek.timeDebt ?? 0);
  const debtReduced = debtDiff <= 0;

  // Bar Chart calculations
  const chartDays = thisWeek.byDay.slice(0, 5).map((d, index) => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return {
      day: dayNames[index],
      planned: d.planned,
      completed: d.completed,
      isAlert: d.isAlert
    };
  });

  const chartMaxTasks = Math.max(...chartDays.map(d => Math.max(d.planned, d.completed)), 10);
  const roundedMax = Math.ceil(chartMaxTasks / 5) * 5;
  const scaleFactor = roundedMax > 0 ? 140 / roundedMax : 14;
  const yTicks = [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax];

  // Energy Donut Wedges
  const totalMinutes = thisWeek.byCategory.reduce((sum, c) => sum + c.minutes, 0);
  const categoryMeta: Record<string, { label: string; color: string }> = {
    deep: { label: 'Deep Work', color: 'var(--color-deep, #8B5CF6)' },
    admin: { label: 'Admin tasks', color: 'var(--color-admin, #FBBF24)' },
    creative: { label: 'Creative Work', color: 'var(--color-creative, #FB7185)' },
    social: { label: 'Social Sync', color: 'var(--color-social, #2DD4BF)' },
    light: { label: 'Light Work', color: 'var(--color-light, #60A5FA)' }
  };

  const energyWedges = thisWeek.byCategory.map(c => {
    const meta = categoryMeta[c.category] || { label: c.category, color: '#8B5CF6' };
    const value = totalMinutes > 0 ? Math.round((c.minutes / totalMinutes) * 100) : 0;
    const hours = (c.minutes / 60).toFixed(1);
    return {
      id: c.category,
      label: meta.label,
      value: value,
      duration: `${hours}h`,
      color: meta.color
    };
  }).filter(w => w.value > 0);

  let cumulativeValue = 0;

  // Heatmap rows
  const heatmapRows = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const heatmapCols = Array.from({ length: 18 }).map((_, idx) => {
    const hourNum = idx + 6; // starts at 6 AM
    const isPM = hourNum >= 12;
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}${isPM ? 'pm' : 'am'}`;
  });

  const heatmapData: Record<string, number[]> = {
    "Mon": Array(18).fill(0),
    "Tue": Array(18).fill(0),
    "Wed": Array(18).fill(0),
    "Thu": Array(18).fill(0),
    "Fri": Array(18).fill(0)
  };

  thisWeek.byHour.forEach(item => {
    const dayName = heatmapRows[item.day];
    if (dayName && item.hour >= 6 && item.hour <= 23) {
      heatmapData[dayName][item.hour - 6] = item.count;
    }
  });

  const heatmapCounts = Object.values(heatmapData).flatMap(row => row);
  const maxCount = Math.max(...heatmapCounts, 1);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#141416';
    const intensity = count / maxCount;
    const alpha = parseFloat((0.2 + 0.8 * intensity).toFixed(2));
    return `rgba(79, 142, 247, ${alpha})`;
  };

  // Peak window calculations
  let maxWindowSum = 0;
  let peakStartHour = 9;
  let peakEndHour = 11;

  for (let h = 6; h <= 21; h++) {
    let currentSum = 0;
    for (const day of heatmapRows) {
      currentSum += heatmapData[day][h - 6] || 0;
      currentSum += heatmapData[day][h - 6 + 1] || 0;
    }
    if (currentSum > maxWindowSum) {
      maxWindowSum = currentSum;
      peakStartHour = h;
      peakEndHour = h + 2;
    }
  }

  const formatHour12 = (hour: number): string => {
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = isPM ? 'pm' : 'am';
    return `${displayHour}:00${ampm}`;
  };

  // Postpone analyzer stats
  const overdueTasksCount = thisWeek.overdueBlocks.length;
  const avgOverdueDays = overdueTasksCount > 0 
    ? (thisWeek.overdueBlocks.reduce((sum, item) => sum + item.count, 0) / overdueTasksCount).toFixed(1)
    : "0.0";

  return (
    <div id="velocity-dashboard" className="flex-grow w-full max-w-7xl mx-auto px-6 py-6 overflow-y-auto flex flex-col gap-6 select-none-all font-sans">
      
      {/* 1. EMBEDDED STYLES FOR FONTS & CORE TIMELINE ANIMATIONS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        .velocity-serif {
          font-family: "DM Serif Display", Georgia, serif;
        }
        .velocity-sans {
          font-family: "DM Sans", sans-serif;
        }
        .velocity-mono {
          font-family: "JetBrains Mono", monospace;
        }
        
        /* Interactive scale loops */
        .interactive-grow {
          transition: all 0.15s ease;
        }
        .interactive-grow:hover {
          transform: translateY(-2px);
          border-color: #3D3D42;
        }

        /* Pulse gradient overlay animation */
        @keyframes pulse-velocity {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .premium-loading {
          animation: pulse-velocity 1s infinite alternate ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        /* Color selection transitions */
        .color-transition-slow {
          transition: fill 0.3s ease, transform 0.3s ease;
        }
      `}} />

      {/* ========================================================= */}
      {/* HEADER ROW BAR                                            */}
      {/* ========================================================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 shadow-sm relative overflow-hidden shrink-0">
        
        {/* Glow halo in background of card */}
        <div className="absolute right-0 top-0 w-72 h-44 bg-[#8B5CF6]/5 rounded-full blur-[64px] pointer-events-none" />

        <div className="flex flex-col gap-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl velocity-serif text-[#F1F1F1] tracking-tight">
              Velocity Dashboard
            </h1>
            <span className="text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2 py-0.5 rounded uppercase">
              Weekly automation
            </span>
          </div>
          <span className="text-sm text-[#8A8A90] font-sans">
            Based on <span className="text-white font-semibold">{thisWeek.total} tasks</span> across {workDaysWithActivity} productive work days
          </span>
        </div>

        {/* Week and Generation Navigation Controls */}
        <div className="flex items-center gap-3 relative z-10">
          
          <div className="flex items-center bg-[#0D0D0F] border border-[#2A2A2D] rounded-8 p-1">
            <button 
              onClick={goToPrevWeek}
              className="p-1 px-2 rounded hover:bg-white/5 text-[#8A8A90] hover:text-[#F1F1F1] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-3 text-[#F1F1F1] select-none whitespace-nowrap">
              {formatWeekRange(weekStart)}
            </span>
            <button 
              onClick={goToNextWeek}
              disabled={isCurrentWeek}
              className="p-1 px-2 rounded hover:bg-white/5 text-[#8A8A90] hover:text-[#F1F1F1] disabled:opacity-40 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleTriggerGenerate}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-8 text-xs font-bold text-white shadow-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-[#8B5CF6] to-[#FB7185] hover:opacity-90 active:scale-95 ${
              isGenerating ? 'premium-loading' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Weekly Review</span>
              </>
            )}
          </button>
        </div>

      </header>

      {/* ========================================================= */}
      {/* TOP ROW — 4 KPI METRIC CARDS                              */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* KPI 1: Tasks Completed */}
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 flex flex-col justify-between shrink-0 hover:border-[#3D3D42] transition-colors relative">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[#8A8A90] uppercase tracking-wider">Tasks Completed</span>
            {thisWeek.total > 0 && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-sm ${
                isRatePositive ? 'text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20' : 'text-[#FB7185] bg-[#FB7185]/10 border border-[#FB7185]/20'
              }`}>
                {isRatePositive ? '▲' : '▼'} {rateDiffSign}{completionRateDiff}%
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-5xl velocity-serif text-[#F1F1F1] tracking-tight leading-none">
              {thisWeek.total === 0 ? "—" : thisWeek.completed}
            </span>
            {thisWeek.total > 0 && (
              <span className="text-lg text-[#4A4A52] font-semibold">/ {thisWeek.total}</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-xs text-[#8A8A90]">
              {thisWeek.total === 0 ? "No tasks recorded" : `${thisWeek.completionRate}% completion rate`}
            </span>
            
            {/* Sparkline from thisWeek.byDay */}
            {thisWeek.byDay.length > 0 && (
              <svg className="w-16 h-6 outline-none" viewBox="0 0 70 24">
                {thisWeek.byDay.map((day, idx) => {
                  const maxCompleted = Math.max(...thisWeek.byDay.map(d => d.completed), 1);
                  const barHeight = day.completed > 0 ? (day.completed / maxCompleted) * 18 + 4 : 2;
                  return (
                    <rect 
                      key={idx}
                      x={idx * 10}
                      y={24 - barHeight}
                      width="6"
                      height={barHeight}
                      rx="1"
                      fill={idx === 6 ? '#34D399' : '#8B5CF6'}
                      opacity={0.8}
                      className="hover:opacity-100 transition-opacity"
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* KPI 2: Focus Hours */}
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 flex flex-col justify-between shrink-0 hover:border-[#3D3D42] transition-colors relative">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[#8A8A90] uppercase tracking-wider">Focus Hours</span>
            {thisWeek.total > 0 && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                isFocusPositive ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-[#FB7185] bg-[#FB7185]/10'
              }`}>
                {isFocusPositive ? '▲' : '▼'} {focusDiffSign}{focusDiff.toFixed(1)}h
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-5xl velocity-serif text-[#F1F1F1] tracking-tight leading-none">
              {thisWeek.total === 0 ? "—" : `${thisWeek.focusHours}h`}
            </span>
            {thisWeek.total > 0 && (
              <span className="text-xs text-[#8A8A90] font-mono ml-1">/ 20h target</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-xs text-[#8A8A90]">
              {thisWeek.total === 0 ? "No data yet" : `${focusPercentage}% of week target`}
            </span>
            
            {/* Tiny progress circular gauge Ring */}
            {thisWeek.total > 0 && (
              <div className="relative w-8 h-8 flex items-center justify-center font-mono">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" stroke="#1C1C1F" strokeWidth="3" fill="transparent" />
                  <circle 
                    cx="16" 
                    cy="16" 
                    r="13" 
                    stroke="#8B5CF6" 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray="81.68"
                    strokeDashoffset={81.68 - (focusRatio * 81.68)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[8px] font-bold text-white">{focusPercentage}%</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI 3: Time Accuracy */}
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 flex flex-col justify-between shrink-0 hover:border-[#3D3D42] transition-colors relative">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[#8A8A90] uppercase tracking-wider">Time Accuracy</span>
            <span className="text-[10px] uppercase font-mono text-[#8A8A90] bg-[#1C1C1F] border border-[#2A2A2D] px-2 py-0.5 rounded">
              Est vs Act
            </span>
          </div>

          <div className="flex items-baseline mt-3">
            <span className="text-5xl velocity-serif text-[#34D399] tracking-tight leading-none">—</span>
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-xs text-[#8A8A90]">Estimation tracking coming soon</span>
            
            {/* Semicircle gauge path */}
            <div className="w-12 h-6 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 44 24">
                <path 
                  d="M 6,22 A 16,16 0 0,1 38,22" 
                  stroke="#1C1C1F" 
                  strokeWidth="3" 
                  fill="transparent" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M 6,22 A 16,16 0 0,1 38,22" 
                  stroke="#34D399" 
                  strokeWidth="3" 
                  fill="transparent" 
                  strokeLinecap="round" 
                  strokeDasharray="50.2"
                  strokeDashoffset={50.2}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 4: Time Debt warnings (Coral theme) */}
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 flex flex-col justify-between shrink-0 hover:border-[#3D3D42] transition-colors relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#FB7185] uppercase tracking-wider font-bold">Time Debt</span>
              {thisWeek.total > 0 && thisWeek.timeDebt > 120 && (
                <span className="text-sm select-none" title="Debt over 2h requires prompt attention">🔥</span>
              )}
            </div>
            {thisWeek.total > 0 && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center ${
                debtReduced ? 'text-[#34D399] bg-[#34D399]/10' : 'text-[#FB7185] bg-[#FB7185]/10'
              }`}>
                {debtReduced ? '▼ reduced' : '▲ increased'}
              </span>
            )}
          </div>

          <div className="flex items-baseline mt-3">
            <span className="text-5xl velocity-serif tracking-tight leading-none" style={{ color: thisWeek.total === 0 ? '#F1F1F1' : (thisWeek.timeDebt === 0 ? '#34D399' : '#FB7185') }}>
              {thisWeek.total === 0 ? "—" : formatTimeDebt(thisWeek.timeDebt)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-xs text-[#8A8A90] text-ellipsis truncate max-w-[140px]" title={`Accumulated from ${thisWeek.overdueCount} overdue tasks`}>
              {thisWeek.overdueCount} overdue tasks
            </span>
            {thisWeek.total > 0 && (
              <span className="text-[10px] font-mono text-[#34D399] leading-none">
                was {formatTimeDebt(lastWeek.timeDebt ?? 0)} last week
              </span>
            )}
          </div>
        </div>

      </section>

      {/* ========================================================= */}
      {/* SECOND ROW — MAIN CHARTS (2/3 + 1/3 split)                 */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        
        {/* LEFT CHART (2/3): Planned vs Completed Daily Settle */}
        <div className="lg:col-span-2 bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 select-none hover:border-[#3D3D42] transition-colors relative min-h-[340px]">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">
                📈 Planned vs Completed — This Week
              </span>
              <span className="text-[11px] text-[#4A4A52]">
                Shorter blue bars represent backlog leakage or postponed tasks
              </span>
            </div>

            {/* Chart Legend list */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#2A2A2D] inline-block" />
                <span className="text-[#8A8A90]">Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#4F8EF7] inline-block" />
                <span className="text-[#8A8A90]">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#FB7185] inline-block" />
                <span className="text-[#FB7185] font-bold">Debt Alert</span>
              </div>
            </div>
          </div>

          {/* SVG CHART BODY */}
          <div className="relative w-full h-56 pt-2">
            
            {/* Empty state overlay overlay */}
            {thisWeek.total === 0 && (
              <div className="absolute inset-0 bg-[#141416]/85 rounded-12 flex flex-col items-center justify-center text-center z-20">
                <span className="text-sm font-mono text-[#8A8A90] select-none">No tasks recorded this week</span>
              </div>
            )}

            {/* Tooltip Overlay popup */}
            {barTooltip && (
              <div 
                className="absolute bg-[#1C1C1F] border border-[#2A2A2D] text-xs px-2.5 py-1.5 rounded-8 shadow-2xl z-30 font-mono text-[#F1F1F1] pointer-events-none text-left flex flex-col gap-0.5 animate-fade-in"
                style={{ left: barTooltip.x, top: barTooltip.y }}
              >
                <div className="font-bold text-[#8B5CF6] uppercase tracking-wide">{barTooltip.day} Tasks</div>
                <div>Completed: <span className="text-white font-bold">{barTooltip.completed}</span> / {barTooltip.planned}</div>
                <div className="text-[10px] text-[#8A8A90] italic">
                  {barTooltip.planned === barTooltip.completed ? '🎯 100% Accuracy achieved' : `${barTooltip.planned - barTooltip.completed} leaked/postponed`}
                </div>
              </div>
            )}

            <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180" preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              {yTicks.map((tickVal, index) => {
                const percent = roundedMax > 0 ? (tickVal / roundedMax) * 100 : 0;
                const yPos = 160 - (percent * 1.4);
                return (
                  <g key={index}>
                    <line 
                      x1="40" 
                      y1={yPos} 
                      x2="520" 
                      y2={yPos} 
                      stroke="#2A2A2D" 
                      strokeWidth="0.5" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x="25" 
                      y={yPos + 4} 
                      fill="#4A4A52" 
                      fontSize="9" 
                      fontFamily="monospace" 
                      textAnchor="end"
                    >
                      {tickVal}
                    </text>
                  </g>
                );
              })}

              {/* Day Columns and Bar pairings */}
              {thisWeek.total > 0 && chartDays.map((item, index) => {
                const colWidth = 92;
                const startX = 65 + (index * colWidth);
                
                const plannedHeight = item.planned * scaleFactor;
                const completedHeight = item.completed * scaleFactor;

                const plannedY = 160 - plannedHeight;
                const completedY = 160 - completedHeight;

                const completedColor = item.isAlert ? '#FB7185' : '#4F8EF7';

                return (
                  <g 
                    key={item.day}
                    onMouseEnter={() => {
                      setBarTooltip({
                        x: startX - 30,
                        y: completedY - 55,
                        day: item.day,
                        planned: item.planned,
                        completed: item.completed
                      });
                    }}
                    onMouseLeave={() => setBarTooltip(null)}
                    className="cursor-pointer group"
                  >
                    {/* Planned Grey bar */}
                    <rect 
                      x={startX} 
                      y={plannedY} 
                      width="16" 
                      height={plannedHeight} 
                      rx="2" 
                      fill="#2A2A2D" 
                      className="transition-all duration-150 group-hover:opacity-80"
                    />

                    {/* Completed Active color bar */}
                    <rect 
                      x={startX + 20} 
                      y={completedY} 
                      width="16" 
                      height={completedHeight} 
                      rx="2" 
                      fill={completedColor} 
                      className="transition-all duration-150 group-hover:brightness-110"
                      style={{ filter: item.isAlert ? 'drop-shadow(0 0 4px rgba(251,113,133,0.15))' : 'none' }}
                    />

                    {/* Day X-Axis label text */}
                    <text 
                      x={startX + 18} 
                      y="176" 
                      fill="#8A8A90" 
                      fontSize="10" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                      className="font-bold uppercase"
                    >
                      {item.day}
                    </text>

                    {/* Completed number indicator text over active bar */}
                    <text 
                      x={startX + 28} 
                      y={completedY - 5} 
                      fill={completedColor} 
                      fontSize="9" 
                      fontFamily="monospace" 
                      fontWeight="bold"
                      textAnchor="middle"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {item.completed}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal base line */}
              <line x1="40" y1="160" x2="520" y2="160" stroke="#2A2A2D" strokeWidth="1" />
            </svg>

          </div>

          <p className="text-xs text-center text-[#4A4A52] italic mt-1 font-sans">
            "⚠️ Completion deviations inside days flag potential support sync slip or context switches."
          </p>

        </div>

        {/* RIGHT CHART (1/3): Energy Donut Chart Wheel */}
        <div className="lg:col-span-1 bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 select-none hover:border-[#3D3D42] transition-colors flex flex-col justify-between min-h-[340px]">
          
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">
              ⚡ Energy Distribution
            </span>
            <span className="text-[11px] text-[#4A4A52]">
              Weekly tasks segmented by cognitive energy type
            </span>
          </div>

          {/* DONUT SVG COMPONENT */}
          <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
            
            {energyWedges.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-center text-xs font-mono text-[#8A8A90] p-4">
                No data yet this week
              </div>
            ) : (
              <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
                {energyWedges.map((wedge) => {
                  const r = 34;
                  const c = 2 * Math.PI * r;
                  const pct = wedge.value;
                  const strokeDashOffset = c - (pct / 100) * c;
                  
                  const rotationAngle = (cumulativeValue / 100) * 360;
                  cumulativeValue += pct;

                  const isHovered = donutHoveredId === wedge.id;

                  return (
                    <circle
                      key={wedge.id}
                      r={r}
                      cx="50"
                      cy="50"
                      stroke={wedge.color}
                      strokeWidth={isHovered ? "11" : "8"}
                      fill="transparent"
                      strokeDasharray={c}
                      strokeDashoffset={strokeDashOffset}
                      transform={`rotate(${rotationAngle} 50 50)`}
                      className="color-transition-slow cursor-pointer"
                      style={{ 
                        strokeLinecap: 'round',
                        filter: isHovered ? `drop-shadow(0 0 6px ${wedge.color}35)` : 'none'
                      }}
                      onMouseEnter={() => setDonutHoveredId(wedge.id)}
                      onMouseLeave={() => setDonutHoveredId(null)}
                    />
                  );
                })}
              </svg>
            )}

            {/* Absolute Centered Stats Text inside Donut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
              <span className="text-2xl velocity-serif text-white font-bold leading-none">
                {thisWeek.total === 0 ? "—" : thisWeek.total}
              </span>
              <span className="text-[10px] uppercase font-mono text-[#8A8A90] mt-0.5">
                {thisWeek.total === 0 ? "No data" : "Tasks"}
              </span>
            </div>

          </div>

          {/* LOWER ALIGNED DETAIL SEGMENTS LEGEND */}
          <div className="flex flex-col gap-1.5 border-t border-[#2A2A2D]/40 pt-3 text-[11px] font-mono">
            {energyWedges.map((wedge) => {
              const isWedgeHovered = donutHoveredId === wedge.id;
              return (
                <div 
                  key={wedge.id} 
                  className={`flex items-center justify-between p-1 rounded-6 transition-colors ${
                    isWedgeHovered ? 'bg-[#1C1C1F] text-[#F1F1F1] font-bold' : 'text-[#8A8A90]'
                  }`}
                  onMouseEnter={() => setDonutHoveredId(wedge.id)}
                  onMouseLeave={() => setDonutHoveredId(null)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: wedge.color }} />
                    <span>{wedge.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{wedge.value}%</span>
                    <span className="text-[#4A4A52]">({wedge.duration})</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* THIRD ROW — HEATMAP + POSTPONE (1/2 + 1/2 split)          */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        
        {/* HEATMAP CARD: Most Productive Hours */}
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 select-none hover:border-[#3D3D42] transition-colors flex flex-col justify-between min-h-[340px] relative">
          
          {/* Heatmap Tooltip overlay container */}
          {heatmapTooltip && (
            <div 
              className="absolute bg-[#1C1C1F] border border-[#2A2A2D] text-[10px] p-2 rounded shadow-2xl z-30 leading-snug font-mono text-[#F1F1F1] pointer-events-none max-w-[160px]"
              style={{ left: heatmapTooltip.x, top: heatmapTooltip.y }}
            >
              <div className="font-bold text-[#4F8EF7]">{heatmapTooltip.day} at {heatmapTooltip.hour}</div>
              <div>Productivity: <span className="font-bold text-white uppercase">{heatmapTooltip.level}</span></div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">
                  ⚡ Most Productive Hours Heatmap
                </span>
                <span className="text-[11px] text-[#4A4A52]">
                  Blue intensity scales with completed task counts and focus times
                </span>
              </div>
            </div>

            {/* Grid Map Box */}
            <div className="overflow-x-auto overflow-y-hidden pb-1 max-w-full">
              <div className="min-w-[480px] flex flex-col gap-1.5 p-1">
                
                {/* Column hour labels */}
                <div className="flex gap-[3px] select-none text-[8px] font-mono text-[#4A4A52] items-center">
                  <div className="w-10 text-right pr-2">Day</div>
                  <div className="flex-grow grid grid-cols-18 gap-[3px]">
                    {heatmapCols.map((col, idx) => (
                      <div key={idx} className="text-center overflow-hidden text-ellipsis truncate" title={col}>
                        {idx % 2 === 0 ? col : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day data block lines */}
                {heatmapRows.map((day) => (
                  <div key={day} className="flex gap-[3px] items-center">
                    
                    {/* Y label */}
                    <span className="w-10 text-[10px] font-mono font-bold text-[#8A8A90] text-right pr-2 leading-none shrink-0">
                      {day}
                    </span>

                    {/* Columns items */}
                    <div className="flex-grow grid grid-cols-18 gap-[3px]">
                      {heatmapData[day].map((count, idx) => {
                        const cellColor = getHeatmapColor(count);
                        const displayHourText = heatmapCols[idx];

                        return (
                          <div 
                            key={idx}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHeatmapTooltip({
                                x: rect.left - 40,
                                y: rect.top - 85,
                                day: day,
                                hour: displayHourText,
                                level: count === 0 ? "No tasks completed" : (count === 1 ? "1 task completed" : `${count} tasks completed`)
                              });
                            }}
                            onMouseLeave={() => setHeatmapTooltip(null)}
                            className="h-5 rounded-[2px] transition-all hover:ring-1 hover:ring-white/40 cursor-crosshair transform hover:scale-105"
                            style={{ 
                              backgroundColor: cellColor,
                              boxShadow: count > 1 ? '0 0 6px rgba(79,142,247,0.15)' : 'none' 
                            }}
                          />
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-sans border-t border-[#2A2A2D]/40 pt-4 mt-2">
            {maxWindowSum > 0 && (
              <span className="text-[#8A8A90]">
                💡 Peak focus window: <span className="text-white font-mono font-bold">{formatHour12(peakStartHour)} — {formatHour12(peakEndHour)}</span> ({maxWindowSum} tasks completed)
              </span>
            )}
            <div className="flex gap-1.5 items-center font-mono ml-auto">
              <span className="text-[#4A4A52]">Intensity:</span>
              <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#141416]" title="silent" />
              <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#4F8EF7]/25" title="low" />
              <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#4F8EF7]/60" title="medium" />
              <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#4F8EF7]" title="high" />
            </div>
          </div>

        </div>

        {/* POSTPONE ANALYSIS CHART */}
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-5 select-none hover:border-[#3D3D42] transition-colors flex flex-col justify-between min-h-[340px]">
          
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#FB7185] font-bold">
              ⚠️ Postpone & Backlog Leakage Analysis
            </span>
            <span className="text-[11px] text-[#4A4A52]">
              Track cumulative days overdue per task. 3+ is flagged critical.
            </span>
          </div>

          {/* List items block */}
          {thisWeek.overdueBlocks.length === 0 ? (
            <div className="flex-grow flex items-center justify-center font-mono text-sm text-[#34D399] select-none py-10">
              No overdue tasks this week 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 my-3">
              {thisWeek.overdueBlocks.slice(0, 5).map((item) => {
                const isCritical = item.count >= 3;
                const isWarning = item.count === 2;
                const barColor = isCritical ? '#FB7185' : isWarning ? '#FBBF24' : '#4F8EF7';
                const textHighlight = isCritical ? 'text-[#FB7185]' : isWarning ? 'text-[#FBBF24]' : 'text-white';

                return (
                  <div key={item.id} className="flex flex-col gap-1.5 animate-fade-in">
                    <div className="flex justify-between items-baseline text-xs font-mono">
                      <span className="text-[#F1F1F1] font-semibold tracking-tight truncate max-w-[220px]" title={item.task}>
                        {item.task}
                      </span>
                      <span className={`${textHighlight} font-bold`}>
                        {item.count}d overdue
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-[#4A4A52] font-semibold leading-none">
                        {'█'.repeat(Math.min(item.count, 4)) + '░'.repeat(Math.max(0, 4 - item.count))}
                      </span>
                      <div className="flex-grow h-2 bg-[#1C1C1F] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((item.count / 4) * 100, 100)}%`,
                            backgroundColor: barColor,
                            boxShadow: `0 0 8px ${barColor}25`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between text-xs font-mono text-[#8A8A90] border-t border-[#2A2A2D]/40 pt-4 mt-1 leading-relaxed">
            <span>📊 Average days overdue: <strong className="text-white">{avgOverdueDays}d</strong></span>
            <span>🚨 {overdueTasksCount} tasks overdue at least once</span>
          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* BOTTOM SECTION — WEEKLY REVIEW PANEL                      */}
      {/* ========================================================= */}
      <footer className="bg-[#141416]/50 border border-[#2A2A2D] rounded-12 p-6 select-none shadow-md">
        
        <div className="flex items-center gap-2 border-b border-[#2A2A2D] pb-3 mb-5">
          <span className="text-lg text-white">✍</span>
          <h2 className="text-lg font-serif text-[#F1F1F1]">Velocity Weekly Review — {formatWeekRange(weekStart).replace("Week of ", "")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: What went well */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#34D399] font-bold">
              ✓ What went well
            </span>
            <textarea
              value={wentWellText}
              onChange={(e) => handleWentWellChange(e.target.value)}
              placeholder="What went well this week..."
              className="w-full min-h-[160px] p-3 text-xs bg-[#0D0D0F]/40 border border-[#2A2A2D] focus:border-[#34D399] focus:outline-none rounded-8 text-[#8A8A90] font-sans leading-relaxed resize-none transition-colors"
            />
          </div>

          {/* Column 2: What to improve */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#FBBF24] font-bold">
              ▲ What to improve
            </span>
            <textarea
              value={toImproveText}
              onChange={(e) => handleToImproveChange(e.target.value)}
              placeholder="What could be improved..."
              className="w-full min-h-[160px] p-3 text-xs bg-[#0D0D0F]/40 border border-[#2A2A2D] focus:border-[#FBBF24] focus:outline-none rounded-8 text-[#8A8A90] font-sans leading-relaxed resize-none transition-colors"
            />
          </div>

          {/* Column 3: Next week focus planner grid with input states */}
          <div className="flex flex-col gap-3 min-h-[140px]">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B5CF6] font-bold">
              🎯 Next Week Priorities
            </span>
            
            <form onSubmit={handleAddGoal} className="flex gap-1.5 mt-1">
              <input
                type="text"
                placeholder="Set your intention for next week..."
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                className="flex-grow px-2 px-3 py-1.5 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[#8B5CF6] focus:outline-none rounded-8 text-[#F1F1F1]"
              />
              <button
                type="submit"
                className="px-3 rounded-8 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 font-bold text-xs cursor-pointer transition-all"
              >
                +
              </button>
            </form>

            {/* List goals in active state view */}
            <div className="flex flex-col gap-2 mt-2">
              {goals.map(goal => (
                <div 
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal.id)}
                  className="flex items-start gap-2.5 p-2 rounded bg-[#0D0D0F]/40 border border-[#2A2A2D]/65 hover:border-[#8B5CF6]/40 cursor-pointer transition-all animate-fade-in group select-none"
                >
                  <button
                    type="button"
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      goal.completed 
                        ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white' 
                        : 'bg-transparent border-[#2A2A2D]'
                    }`}
                  >
                    {goal.completed && <Check className="w-2.5 h-2.5" />}
                  </button>
                  <span className={`text-[11px] leading-relaxed transition-all ${
                    goal.completed ? 'text-[#4A4A52] line-through' : 'text-[#8A8A90] group-hover:text-[#F1F1F1]'
                  }`}>
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}
