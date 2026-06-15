import React, { useState, useEffect, useReducer, useRef } from 'react';
import { 
  Volume2, Play, Pause, RotateCcw, X, Plus, AlertCircle, 
  Sparkles, Check, CheckCircle2, ChevronLeft, Calendar, Info 
} from 'lucide-react';
import { Task, EnergyType } from '../types';

interface FocusModeProps {
  task: Task | null;
  onClose: () => void;
  onMinimize?: () => void;
}

interface Interruption {
  id: string;
  time: string;
  text: string;
}

// Helper to safely fetch numerical localStorage values
function getLocalStorageNum(key: string, def: number): number {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved) || def : def;
  }
  return def;
}

// Timer initial state and reducer for robust timer logic
interface TimerState {
  secondsLeft: number;
  totalSeconds: number;
  timerRunning: boolean;
  isOnBreak: boolean;
  sessionCount: number; // 1-4 standard sessions
  isCompleteFlash: boolean;
}

type TimerAction =
  | { type: 'TICK' }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET'; customDuration?: number }
  | { type: 'COMPLETE'; breakDuration: number }
  | { type: 'BREAK_COMPLETE'; workDuration: number }
  | { type: 'FLASH_COMPLETE' };

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'TICK':
      if (state.secondsLeft <= 1) {
        return {
          ...state,
          secondsLeft: 0,
          timerRunning: false,
          isCompleteFlash: true,
        };
      }
      return {
        ...state,
        secondsLeft: state.secondsLeft - 1,
      };
    case 'START':
      return {
        ...state,
        timerRunning: true,
      };
    case 'PAUSE':
      return {
        ...state,
        timerRunning: false,
      };
    case 'RESET':
      const lWork = getLocalStorageNum("tempo-pomo-work-time", 25);
      const lShort = getLocalStorageNum("tempo-pomo-short-break", 5);
      const resetDuration = action.customDuration || (state.isOnBreak ? lShort * 60 : lWork * 60);
      return {
        ...state,
        secondsLeft: resetDuration,
        totalSeconds: resetDuration,
        timerRunning: false,
        isCompleteFlash: false,
      };
    case 'COMPLETE':
      return {
        ...state,
        isOnBreak: true,
        secondsLeft: action.breakDuration,
        totalSeconds: action.breakDuration,
        timerRunning: false,
        sessionCount: state.sessionCount >= 4 ? 1 : state.sessionCount + 1,
      };
    case 'BREAK_COMPLETE':
      return {
        ...state,
        isOnBreak: false,
        secondsLeft: action.workDuration,
        totalSeconds: action.workDuration,
        timerRunning: false,
        isCompleteFlash: false,
      };
    case 'FLASH_COMPLETE':
      return {
        ...state,
        isCompleteFlash: false,
      };
    default:
      return state;
  }
}

export default function FocusMode({ task, onClose, onMinimize }: FocusModeProps) {
  // Helper functions to read customized settings with clean defaults
  const getPomoWorkTime = (): number => {
    return getLocalStorageNum("tempo-pomo-work-time", 25);
  };

  const getPomoShortBreak = (): number => {
    return getLocalStorageNum("tempo-pomo-short-break", 5);
  };

  const getPomoLongBreak = (): number => {
    return getLocalStorageNum("tempo-pomo-long-break", 15);
  };

  const getPomoTargetDaily = (): number => {
    return getLocalStorageNum("tempo-pomo-target-daily", 8);
  };

  // Use task duration from props to initialize, e.g. "60m" -> 3600s
  const parseTaskDuration = (durationStr?: string): number => {
    const pomoWorkMins = getPomoWorkTime();
    if (!durationStr) return pomoWorkMins * 60;
    const mins = parseInt(durationStr);
    if (isNaN(mins)) return pomoWorkMins * 60;
    
    // If the task duration is 25m or 60m (the templates hardcoded duration), override with custom cycle setting!
    if (mins === 25 || mins === 60) {
      return pomoWorkMins * 60;
    }
    return mins * 60;
  };

  const initialWorkSeconds = parseTaskDuration(task?.duration);

  // Reducer initialization with support for loading from persistently running browser timers
  const getInitialTimerState = (): TimerState => {
    const savedTaskId = localStorage.getItem("tempo-active-timer-task-id");
    const savedSeconds = localStorage.getItem("tempo-active-timer-seconds-left");
    const savedTotal = localStorage.getItem("tempo-active-timer-total-seconds");
    const savedIsOnBreak = localStorage.getItem("tempo-active-timer-is-on-break") === "true";
    const savedRunning = localStorage.getItem("tempo-active-timer-running") === "true";
    const savedLastUpdate = localStorage.getItem("tempo-active-timer-last-update");
    const savedSessionCount = localStorage.getItem("tempo-active-timer-session-count");

    const currentTaskIdStr = task ? String(task.id) : "generic";

    if (savedTaskId === currentTaskIdStr && savedSeconds !== null && savedLastUpdate !== null) {
      const elapsed = Math.floor((Date.now() - parseInt(savedLastUpdate)) / 1000);
      let secondsLeft = parseInt(savedSeconds);
      let isRunning = savedRunning;
      
      if (isRunning) {
        secondsLeft = Math.max(0, secondsLeft - elapsed);
      }
      
      return {
        secondsLeft,
        totalSeconds: savedTotal ? parseInt(savedTotal) : initialWorkSeconds,
        timerRunning: secondsLeft > 0 ? isRunning : false,
        isOnBreak: savedIsOnBreak,
        sessionCount: savedSessionCount ? parseInt(savedSessionCount) : 1,
        isCompleteFlash: secondsLeft === 0 && isRunning,
      };
    }

    return {
      secondsLeft: initialWorkSeconds,
      totalSeconds: initialWorkSeconds,
      timerRunning: false,
      isOnBreak: false,
      sessionCount: 1,
      isCompleteFlash: false,
    };
  };

  const [timerState, dispatch] = useReducer(timerReducer, null, getInitialTimerState);

  // State values
  const [activeSound, setActiveSound] = useState<'rain' | 'ocean' | 'forest' | 'cafe' | 'none'>('rain');
  const [volume, setVolume] = useState<number>(42);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState<number>(3); // spec default: "3 / 6"
  const [streakDays, setStreakDays] = useState<number>(12); // spec default: "12 days"
  const [totalFocusMinutesDone, setTotalFocusMinutesDone] = useState<number>(24); // spec default: "24 min done"

  // Interruption entries log
  const [interruptions, setInterruptions] = useState<Interruption[]>([
    { id: '1', time: '10:23', text: 'Checked phone' },
    { id: '2', time: '10:31', text: 'Switched tab' },
    { id: '3', time: '10:44', text: 'Colleague interrupted' },
  ]);

  const [newInterruptionText, setNewInterruptionText] = useState<string>('');
  const [isAddingInterruption, setIsAddingInterruption] = useState<boolean>(false);

  // SVG parameters for the 220px main timer circle
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2; // R = 106
  const circumference = 2 * Math.PI * radius; // C ≈ 666.01

  // Calculate percentage progress remaining
  const progressRatio = timerState.totalSeconds > 0 
    ? timerState.secondsLeft / timerState.totalSeconds 
    : 1;

  // The dashoffset starts at 0 (full circle) and scales to circumference (empty circle)
  // Let's animate clockwise from top
  const strokeDashoffset = circumference - (progressRatio * circumference);

  // Map energy colors according to specification
  const energyColors: Record<EnergyType, string> = {
    deep: 'var(--color-deep, #8B5CF6)',
    light: 'var(--color-light, #60A5FA)',
    admin: 'var(--color-admin, #FBBF24)',
    creative: 'var(--color-creative, #FB7185)',
    social: 'var(--color-social, #2DD4BF)',
  };

  const taskEnergy: EnergyType = task?.energy || 'deep';
  const themeColor = energyColors[taskEnergy] || '#8B5CF6';

  // Format MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Whenever the timer state or task changes, serialize the active timer variables to localStorage
  useEffect(() => {
    if (task) {
      localStorage.setItem("tempo-active-timer-task-id", String(task.id));
      localStorage.setItem("tempo-active-timer-task", JSON.stringify(task));
    } else {
      localStorage.setItem("tempo-active-timer-task-id", "generic");
      localStorage.removeItem("tempo-active-timer-task");
    }
    localStorage.setItem("tempo-active-timer-seconds-left", String(timerState.secondsLeft));
    localStorage.setItem("tempo-active-timer-total-seconds", String(timerState.totalSeconds));
    localStorage.setItem("tempo-active-timer-is-on-break", String(timerState.isOnBreak));
    localStorage.setItem("tempo-active-timer-running", String(timerState.timerRunning));
    localStorage.setItem("tempo-active-timer-last-update", String(Date.now()));
    localStorage.setItem("tempo-active-timer-session-count", String(timerState.sessionCount));
    
    // Fire a global window event so other views refresh automatically
    window.dispatchEvent(new Event("tempo-active-session-changed"));
  }, [task, timerState.secondsLeft, timerState.totalSeconds, timerState.timerRunning, timerState.isOnBreak, timerState.sessionCount]);

  // Keyboard support: Close on Escape key, toggles on Spacebar, Ctrl+I for Interruption
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAddingInterruption(prev => {
          const next = !prev;
          if (next) {
            setSidebarOpen(true);
          }
          return next;
        });
        console.log("Tempo Focus Mode: Toggled interruption panel via Ctrl+I");
      }
      if (e.key === ' ') {
        // Only trigger if not typing in the interruption input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (timerState.timerRunning) {
            dispatch({ type: 'PAUSE' });
            console.log("Tempo Focus Mode: Countdown paused via spacebar");
          } else {
            dispatch({ type: 'START' });
            console.log("Tempo Focus Mode: Countdown started via spacebar");
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, timerState.timerRunning]);

  // Audio simulation side effects on changes
  useEffect(() => {
    console.log(`Ambient Sound Action: playing "${activeSound}" at ${volume}% volume.`);
  }, [activeSound, volume]);

  // Interval timer ticks
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (timerState.timerRunning) {
      intervalId = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState.timerRunning]);

  // Handle pomodoro cycle completions or flashes
  useEffect(() => {
    if (timerState.isCompleteFlash) {
      console.log("Timer Cycle completed! Flashing display green.");
      // Increment stats
      setSessionsCompletedToday(prev => Math.min(getPomoTargetDaily(), prev + 1));
      
      const finishedMinutes = Math.floor(timerState.totalSeconds / 60);
      setTotalFocusMinutesDone(prev => prev + finishedMinutes);

      // Auto-switch block types or notify
      if (!timerState.isOnBreak) {
        // Trigger Break state
        setTimeout(() => {
          const isLongBreak = (timerState.sessionCount === 3 || timerState.sessionCount === 4);
          const breakMins = isLongBreak ? getPomoLongBreak() : getPomoShortBreak();
          dispatch({ type: 'COMPLETE', breakDuration: breakMins * 60 });
        }, 3000); // Let the green complete flash remain visible for 3s
      } else {
        // Trigger Work state
        setTimeout(() => {
          dispatch({ type: 'BREAK_COMPLETE', workDuration: initialWorkSeconds });
        }, 3000);
      }
    }
  }, [timerState.isCompleteFlash, timerState.isOnBreak, initialWorkSeconds, timerState.totalSeconds]);

  // Add customized interruption entry
  const handleAddInterruption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newInterruptionText.trim()) return;

    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newEntry: Interruption = {
      id: Date.now().toString(),
      time: formattedTime,
      text: newInterruptionText.trim(),
    };

    setInterruptions(prev => [newEntry, ...prev]);
    setNewInterruptionText('');
    setIsAddingInterruption(false);

    console.log(`Focus Interruption Logged: ${newEntry.time} — ${newEntry.text}`);
  };

  // Focus Score Math: start at 100%, each interruption subtracts 12%, clip at 20%
  const computedFocusScore = Math.max(20, 100 - interruptions.length * 12);

  // Helpers for sound labels and emojis
  const soundChips = [
    { id: 'rain', label: '🌧 Rain' },
    { id: 'ocean', label: '🌊 Ocean' },
    { id: 'forest', label: '🌲 Forest' },
    { id: 'cafe', label: '☕ Café' },
    { id: 'none', label: '∞ None' },
  ] as const;

  return (
    <div id="tempo-focus-overlay" className="fixed inset-0 min-h-screen z-[1000] bg-[#0A0A0C] text-[var(--tempo-text-primary)] flex flex-col justify-between overflow-hidden select-none select-none-all font-sans">
      
      <StyleTags themeColor={themeColor} isTimerRunning={timerState.timerRunning} />

      {/* ========================================================= */}
      {/* 1. TOP BAR CONFIGURATION (48px height)                    */}
      {/* ========================================================= */}
      <nav className="h-12 border-b border-[#1A1A1E] px-6 flex items-center justify-between shrink-0 bg-[#0A0A0C] z-30">
        <div className="flex items-center gap-2">
          <span className="text-[12px] uppercase font-mono font-extrabold tracking-widest text-[var(--tempo-accent-coral)]">
            ᴛᴇᴍᴘᴏ
          </span>
          <span className="text-[9px] font-mono text-[#4A4A52] select-none">
            v1.2 // IMMERSION
          </span>
        </div>

        <div className="text-[12px] font-mono uppercase tracking-[0.25em] text-[#8A8A90] font-semibold">
          {timerState.isOnBreak ? "✨ Rest & Re-charge" : "🧠 Focus Session"}
        </div>

        <div className="flex items-center gap-2">
          {onMinimize && (
            <button 
              onClick={onMinimize}
              title="Minimize timer session to background"
              className="px-2.5 py-1 text-xs rounded-lg border border-[#2A2A2D] hover:border-[var(--tempo-accent-purple)]/40 hover:bg-[var(--tempo-accent-purple)]/10 text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-accent-purple)] font-sans font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Minimize</span>
            </button>
          )}

          <button 
            onClick={onClose}
            title="End / Cancel focus session cleanly"
            className="px-2.5 py-1 text-xs rounded-lg border border-[#2A2A2D] hover:border-[var(--tempo-accent-coral)]/40 hover:bg-[var(--tempo-accent-coral)]/10 text-[var(--tempo-text-secondary)] hover:text-[var(--tempo-accent-coral)] font-sans font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel Session</span>
            <kbd className="text-[9px] font-mono opacity-60 bg-white/5 border border-white/10 px-1 rounded">Esc</kbd>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* BACKGROUND HALO / GLOW                                    */}
      {/* ========================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute left-1/2 top-[40%] text-center rounded-full radial-center-halo ${
          timerState.timerRunning ? 'pulse-halo-animation' : 'static-halo-style'
        }`} />
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTAINER WORKSPACE (Centered layout)                */}
      {/* ========================================================= */}
      <div className="flex-grow flex items-center justify-center relative overflow-y-auto w-full z-10 py-6">
        
        {/* INNER WRAP CONTAINER WITH COMPONENT SCOPE GRID */}
        <div className="w-full max-w-[540px] px-6 flex flex-col items-center gap-7 text-center">
          
          {/* ========================================================= */}
          {/* A. TASK DISPLAY STACK                                     */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center gap-2 max-w-[480px]">
            
            {/* Dynamic Energy Badge capsule */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-[#141416]/50 shadow-sm animate-fade">
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: themeColor }} />
              <span className="text-[10px] uppercase font-mono tracking-widest leading-none font-bold" style={{ color: themeColor }}>
                ● {taskEnergy} Work Energy
              </span>
            </div>

            {/* Task Title (centered) */}
            <h1 className="text-3xl sm:text-4xl font-serif text-[var(--tempo-text-primary)] font-medium leading-tight tracking-tight mt-1 text-center font-serif text-ellipsis line-clamp-2 max-w-[460px]">
              {task?.title || "API Integration for Onboarding Flow"}
            </h1>

            {/* Project / Metadata subtitle node */}
            <div className="flex items-center gap-3 mt-1 select-none">
              <span className="text-[13px] text-[var(--tempo-text-secondary)] font-sans">
                → {task?.energy === 'deep' ? 'Backend Infrastructure' : 'Operational Tasks'}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#2A2A2D]" />
              <span className="text-[12px] font-mono text-[var(--tempo-text-muted)]">
                Est. {task?.duration || '60'} minutes
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* B. POMODORO TIMER CORE CENTERPIECE                        */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center gap-4 select-none relative w-full">
            
            {/* Circular SVG Container with state updates */}
            <div className="relative w-[220px] h-[220px] flex items-center justify-center">
              
              {/* Actual Circular Arc Renderers */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 select-none" viewBox={`0 0 ${size} ${size}`}>
                <defs>
                  {/* Subtle purple gradient mask */}
                  <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={themeColor} stopOpacity="1" />
                    <stop offset="100%" stopColor={themeColor} stopOpacity="0.25" />
                  </linearGradient>
                </defs>
                
                {/* Backwards placeholder circle static track */}
                <circle
                  className="stroke-[#1C1C1F]/40"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={6}
                  fill="transparent"
                />

                {/* Animated active remaining timer indicator arc */}
                <circle
                  className={`transition-all duration-300 stroke-cap-round`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                  stroke="url(#timer-grad)"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  style={{ strokeLinecap: 'round', transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
              </svg>

              {/* Central text display metrics showing minutes */}
              <div className="flex flex-col items-center justify-center text-center z-10 select-all selection:bg-purple-900/40">
                <span className="text-6xl font-serif text-[#FFFFFF] tracking-tight font-medium font-serif" style={{ fontFeatureSettings: '"tnum"' }}>
                  {formatTime(timerState.secondsLeft)}
                </span>
                
                {/* Dynamically switching break work labels */}
                <span className={`text-[11px] uppercase tracking-widest font-mono font-bold mt-1 block ${
                  timerState.isOnBreak ? 'text-[var(--tempo-accent-green)]' : 'text-[#8A8A90]'
                }`}>
                  {timerState.isOnBreak ? '🌴 Break Session' : '🎯 Focus Block'}
                </span>
              </div>

              {/* Complete Overlay Flash Trigger */}
              {timerState.isCompleteFlash && (
                <div className="absolute inset-0 rounded-full bg-[#34D399]/15 border-2 border-[#34D399] flex flex-col items-center justify-center p-4 z-20 animate-wiggle absolute-center select-all">
                  <CheckCircle2 className="w-8 h-8 text-[#34D399] animate-bounce" />
                  <span className="text-[11px] uppercase tracking-wide font-mono font-extrabold text-white text-center mt-1">
                    Done! Break Time
                  </span>
                </div>
              )}
            </div>

            {/* THREE STATE CONTROL ROW ([▶ Start] [⏸ Pause] [↺ Reset]) */}
            <div className="flex items-center gap-3.5 select-none mt-1">
              
              {/* PLAY / START */}
              <button
                onClick={() => dispatch({ type: 'START' })}
                disabled={timerState.timerRunning || timerState.isCompleteFlash}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-150 ${
                  timerState.timerRunning 
                    ? 'border-[#2A2A2D] text-[#4A4A52] cursor-not-allowed bg-transparent' 
                    : 'border-[var(--tempo-accent-purple)]/50 bg-[#8B5CF6]/10 text-white hover:bg-[#8B5CF6]/25 hover:border-[#8B5CF6]'
                } ${timerState.timerRunning ? '' : 'glow-soft-purple-pulse'}`}
              >
                <Play className="w-3.5 h-3.5 text-[var(--tempo-accent-purple)]" />
                <span>Start</span>
              </button>

              {/* PAUSE */}
              <button
                onClick={() => dispatch({ type: 'PAUSE' })}
                disabled={!timerState.timerRunning}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-150 ${
                  !timerState.timerRunning 
                    ? 'border-[#2A2A2D] text-[#4A4A52] cursor-not-allowed bg-transparent' 
                    : 'border-[#3D3D42] text-[#F1F1F1] hover:border-[#FB7185]/50 hover:bg-[#FB7185]/5 hover:text-[#FB7185]'
                }`}
              >
                <Pause className="w-3.5 h-3.5 text-[var(--tempo-accent-coral)]" />
                <span>Pause</span>
              </button>

              {/* RESET */}
              <button
                onClick={() => {
                  const workSecs = parseTaskDuration(task?.duration);
                  dispatch({ type: 'RESET', customDuration: timerState.isOnBreak ? getPomoShortBreak() * 60 : workSecs });
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[#2A2A2D] text-xs font-semibold cursor-pointer hover:border-white/20 text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-white/5 transition-all duration-150"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* POMODOROS SESSIONS COMPLETED TRACKER DOTS */}
            <div className="flex flex-col items-center gap-1.5 mt-2 select-none">
              
              {/* Bullet points display line */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(idx => {
                  const isFilled = idx <= timerState.sessionCount;
                  return (
                    <div 
                      key={idx} 
                      className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                        isFilled 
                          ? 'bg-[var(--tempo-accent-purple)] border-[var(--tempo-accent-purple)] shadow-[0_0_6px_#8B5CF6]' 
                          : 'bg-transparent border-[#4A4A52]'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Subtitle label showing ratios */}
              <span className="text-[11px] font-mono text-[#8A8A90] select-none">
                {timerState.sessionCount} of 4 sessions completed
              </span>

              {/* Break expectation forecast alerts */}
              <span className="text-[11px] text-[#4A4A52] italic font-sans select-none">
                {timerState.sessionCount >= 4 
                  ? "🙌 Milestone completed! Long break ready" 
                  : `Short break in ${4 - timerState.sessionCount} sessions`}
              </span>
            </div>

          </div>

          {/* ========================================================= */}
          {/* C. AMBIENT SOUND CONTROLLER PANEL                         */}
          {/* ========================================================= */}
          <div className="w-full bg-[#141416]/40 border border-[#2A2A2D]/60 rounded-xl p-4 flex flex-col gap-3.5 text-left">
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-wider uppercase font-mono font-bold text-[#8A8A90] select-none">
                🔇 Ambient Sound Machine
              </span>
              <span className="text-[10px] text-[#4A4A52] leading-none select-none">
                Stereo Headphone Synced
              </span>
            </div>

            {/* SOUND SELECTOR ROW BUTTONS */}
            <div className="grid grid-cols-5 gap-1.5">
              {soundChips.map((chip) => {
                const isActive = activeSound === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => {
                      setActiveSound(chip.id);
                      console.log(`Ambient Sound selection: scaled and selected "${chip.id}"`);
                    }}
                    className={`py-2 px-1 rounded-lg border text-center transition-all duration-150 relative scale-tap flex items-center justify-center flex-col gap-0.5 cursor-pointer ${
                      isActive 
                        ? 'bg-[var(--tempo-bg-tertiary)] text-white shadow font-medium' 
                        : 'bg-[#121214]/60 border-[#2A2A2D] text-[#8A8A90] hover:text-white'
                    }`}
                    style={{ 
                      borderColor: isActive ? themeColor : '#2A2A2D',
                      boxShadow: isActive ? `0 0 8px ${themeColor}20` : 'none'
                    }}
                  >
                    <span className="text-xs font-semibold block uppercase tracking-tight">{chip.label.split(' ')[0]}</span>
                    <span className="text-[10px] text-[#8A8A90] block">{chip.label.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>

            {/* VOLUME RANGE CONTROLLER SLIDER */}
            <div className="flex items-center gap-3 mt-1 shrink-0 select-none">
              <span className="text-xs font-mono text-[#8A8A90]" hover-tooltip="Adjust gain">
                🔊 {volume}%
              </span>
              
              <div className="flex-grow flex items-center h-4 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer focus:outline-none opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${volume}%, #1C1C1F ${volume}%, #1C1C1F 100%)`,
                    WebkitAppearance: 'none'
                  }}
                  aria-label="Ambient volume"
                />
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* D. SESSION STATISTICS ROW DISPLAY                         */}
          {/* ========================================================= */}
          <div className="grid grid-cols-3 gap-3.5 w-full select-none">
            
            {/* Stat Box 1: Sessions Done */}
            <div className="bg-[#141416] p-3 border border-[#2A2A2D] rounded-xl text-center shadow-sm">
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase block whitespace-nowrap">
                ⏱ Session Time
              </span>
              <span className="text-sm font-serif text-[#F1F1F1] block mt-0.5">
                {totalFocusMinutesDone} min done
              </span>
            </div>

            {/* Stat Box 2: Sessions Target */}
            <div className="bg-[#141416] p-3 border border-[#2A2A2D] rounded-xl text-center shadow-sm">
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase block whitespace-nowrap font-serif">
                🎯 Sessions Today
              </span>
              <span className="text-sm font-sans font-medium text-[#F1F1F1] block mt-0.5">
                {sessionsCompletedToday} / {getPomoTargetDaily()} blocks
              </span>
            </div>

            {/* Stat Box 3: Streak Count */}
            <div className="bg-[#141416] p-3 border border-[#2A2A2D] rounded-xl text-center shadow-sm">
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase block whitespace-nowrap font-serif">
                🔥 Focus Streak
              </span>
              <span className="text-sm font-sans font-medium text-[#F1F1F1] block mt-0.5">
                {streakDays} days
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. FLOATING INTERRUPTIONS TOGGLE BUTTONS (Right Side)     */}
      {/* ========================================================= */}
      <button
        onClick={() => setSidebarOpen(prev => !prev)}
        className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-2.5 bg-[#141416] hover:bg-[#1C1C1F] text-xs font-semibold rounded-lg border border-[#2A2A2D] text-[#8A8A90] hover:text-[#F1F1F1] transition-all flex flex-col items-center gap-2 cursor-pointer z-50 shadow-md group hover:border-[#FB7185]/30"
      >
        <span className="writing-mode-vertical text-[10px] font-mono tracking-widest uppercase text-center block">
          INTERRUPTIONS
        </span>
        <span className="text-xs font-bold font-mono px-1 bg-[#FB7185]/10 text-[#FB7185] rounded">
          {interruptions.length}
        </span>
      </button>

      {/* ========================================================= */}
      {/* 3. RIGHT SIDEBAR DRAWERS: COLLAPSIBLE PANEL (200px wide)    */}
      {/* ========================================================= */}
      <aside 
        className={`fixed top-12 right-0 bottom-0 z-40 w-[200px] border-l border-[#1A1A1E] bg-[#141416] flex flex-col justify-between overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out select-none ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-220px)]">
          
          <div className="flex items-center justify-between border-b border-[#2A2A2D]/50 pb-2 shrink-0">
            <span className="text-xs font-serif font-bold text-[#F1F1F1]">
              Interruptions
            </span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-[#4A4A52] hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick-add interruption activator button / input block */}
          {isAddingInterruption ? (
            <form onSubmit={handleAddInterruption} className="flex flex-col gap-2 shrink-0 animate-[fadeIn_0.1s_ease-out]">
              <input
                type="text"
                placeholder="What happened? e.g. checked phone"
                value={newInterruptionText}
                onChange={(e) => setNewInterruptionText(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-[#0A0A0C] border border-[#2A2A2D] text-[#F1F1F1] focus:outline-none focus:border-[#FB7185]"
                maxLength={40}
                autoFocus
              />
              <div className="flex gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingInterruption(false)}
                  className="px-2 py-1 text-[9px] font-mono rounded text-[#8A8A90] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 text-[9px] font-mono rounded bg-[#FB7185]/15 hover:bg-[#FB7185]/30 text-[#FB7185] font-bold cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => { setIsAddingInterruption(true); setSidebarOpen(true); }}
              className="w-full py-2.5 rounded-lg border border-[#2A2A2D] hover:border-[#FB7185]/30 text-left px-3 text-[10px] font-mono tracking-wide text-[#8A8A90] hover:text-white hover:bg-white/[0.02] flex items-center gap-1.5 cursor-pointer animate-fade"
            >
              <Plus className="w-3 h-3 text-[var(--tempo-accent-coral)]" />
              <span>+ Log Interruption</span>
            </button>
          )}

          {/* LOGGED ENTRIES DISPLAY LIST */}
          <div className="flex flex-col gap-2 relative mt-1">
            {interruptions.length > 0 ? (
              interruptions.map(entry => (
                <div 
                  key={entry.id} 
                  className="p-2 rounded bg-[#0A0A0C]/40 border border-[#2A2A2D]/40 text-[10px] font-mono text-[#8A8A90] leading-snug flex flex-col gap-0.5 animate-slideUp border-l-2 border-l-[var(--tempo-accent-coral)]"
                >
                  <span className="text-[#FB7185] font-bold shrink-0">{entry.time}</span>
                  <p className="text-[#F1F1F1] leading-relaxed break-words">{entry.text}</p>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-[#4A4A52] italic text-center block pt-4">
                Absence of interference is master zen.
              </span>
            )}
          </div>

        </div>

        {/* BOTTOM METRICS CONTAINER INSIDE SIDEBAR */}
        <div className="p-4 border-t border-[#1A1A1E] bg-[#0D0D0F] shrink-0 flex flex-col gap-3 select-none">
          
          <div className="text-center">
            <p className="text-[10px] font-mono text-[#FB7185] font-bold tracking-tight">
              {interruptions.length} interruptions this session
            </p>
          </div>

          {/* Focus Quality Circular Mini Gage SVG */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
            
            {/* SVG GAUGE CIRCLE (radius R=20) */}
            <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                <circle
                  className="stroke-[#1C1C1F]"
                  cx={22}
                  cy={22}
                  r={18}
                  strokeWidth={3}
                  fill="transparent"
                />
                
                {/* Accent gauge tracker dynamically computes color percentage */}
                <circle
                  className="stroke-[var(--tempo-accent-green)] transition-all duration-500 ease"
                  cx={22}
                  cy={22}
                  r={18}
                  strokeWidth={3}
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={((100 - computedFocusScore) / 100) * (2 * Math.PI * 18)}
                  fill="transparent"
                />
              </svg>

              <span className="text-[10px] font-mono font-bold text-white z-10">
                {computedFocusScore}%
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-bold text-[#F1F1F1] tracking-tight leading-none mb-1">
                Focus Quality
              </span>
              <p className="text-[9px] font-sans text-[#8A8A90] leading-tight">
                {computedFocusScore >= 80 ? 'Master State' : computedFocusScore >= 60 ? 'Optimal Flow' : 'Heavy Noise'}
              </p>
            </div>

          </div>

        </div>

      </aside>

      {/* ========================================================= */}
      {/* 4. FOOTER CUE BRANDINGS                                   */}
      {/* ========================================================= */}
      <footer className="h-8 flex justify-center items-center text-[10px] font-mono text-[#4A4A52] select-none border-t border-[#121214] shrink-0 bg-[#0A0A0C]">
        <span>PRESS ⟨SPACEBAR⟩ TO START PAUSE TIMER // ⟨ESCAPE⟩ TO LEAVE SESSION</span>
      </footer>

    </div>
  );
}

// STYLES TAG COMPONENT
function StyleTags({ themeColor, isTimerRunning }: { themeColor: string; isTimerRunning: boolean }) {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* Fully immersive static overlays */
      #tempo-focus-overlay {
        animation: scaleInFull 0.3s ease-out;
      }
      
      .writing-mode-vertical {
        writing-mode: vertical-rl;
      }

      /* Circular gauge transitions */
      .stroke-cap-round {
        stroke-linecap: round;
        filter: drop-shadow(0 0 4px ${themeColor}20);
      }

      /* Hover microinteraction */
      .scale-tap:active {
        transform: scale(0.96);
      }

      /* Radial Glow Halos styles */
      .radial-center-halo {
        width: 400px;
        height: 300px;
        background: radial-gradient(ellipse 400px 300px at 50% 40%, ${themeColor}12 0%, transparent 70%);
        transform: translate(-50%, -50%);
        mix-blend-mode: screen;
        pointer-events: none;
        transition: all 0.5s ease-in-out;
      }

      /* Gentle Opacity running countdown scale animation pulse */
      @keyframes glow-pulse-scale {
        0% {
          transform: scale(1.0) translate(-50%, -50%);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.1) translate(-50%, -50%);
          opacity: 1.2;
        }
        100% {
          transform: scale(1.0) translate(-50%, -50%);
          opacity: 0.8;
        }
      }

      .pulse-halo-animation {
        animation: glow-pulse-scale 3.0s infinite alternate ease-in-out;
      }
      
      .static-halo-style {
        opacity: 0.8;
      }

      /* Start Button glowing microinteraction loop */
      @keyframes soft-glow-pulse-loop {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.15);
        }
        50% {
          box-shadow: 0 0 0 6px rgb(139, 92, 246, 0.3);
        }
      }

      .glow-soft-purple-pulse {
        animation: soft-glow-pulse-loop 2s infinite ease-in-out;
      }

      /* Common keyframes */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes scaleInFull {
        from { transform: scale(1.02); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .animate-fade {
        animation: fadeIn 0.3s ease-out;
      }
      .animate-slideUp {
        animation: slideUp 0.15s ease-out;
      }

      /* Slider inputs */
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 12px;
        width: 12px;
        border-radius: 50%;
        background: ${themeColor};
        cursor: pointer;
        transition: transform 0.1s;
      }
      input[type=range]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      input[type=range]::-moz-range-thumb {
        height: 12px;
        width: 12px;
        border-radius: 50%;
        background: ${themeColor};
        cursor: pointer;
        border: none;
        transition: transform 0.1s;
      }
      input[type=range]::-moz-range-thumb:hover {
        transform: scale(1.2);
      }
    `}} />
  );
}
