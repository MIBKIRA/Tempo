import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Check, AlertCircle, ChevronDown, ChevronUp, Plus, Flame, 
  Calendar, Clock, Zap, Target, BookOpen, AlertTriangle, PartyPopper
} from 'lucide-react';
import { useMorningIntentions } from '../hooks/useMorningIntentions';
import { useTasksData } from '../TasksContext';
import { Task } from '../types';

interface IntentionItem {
  id: number;
  text: string;
  status: 'done' | 'missed' | 'partial';
  timeSpent: string;
}

interface TomorrowTask {
  id: number;
  text: string;
  highGravity?: boolean;
}

interface EveningReviewProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays?: number;
  onStreakIncrement?: () => void;
}

export default function EveningReview({ 
  isOpen, 
  onClose, 
  streakDays = 12, 
  onStreakIncrement 
}: EveningReviewProps) {
  
  // Master states
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [slideDirection, setSlideDirection] = useState<'slide-left' | 'slide-right' | ''>('');
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [isFinishedSuccess, setIsFinishedSuccess] = useState<boolean>(false);
  const [localStreak, setLocalStreak] = useState<number>(streakDays);

  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // safety 0 -> 12
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minStr} ${ampm}`;
  });
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  });

  // Trigger real-time updates for clock & date headers
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // safety 0 -> 12
      const minStr = minutes < 10 ? `0${minutes}` : minutes;
      setCurrentTime(`${hours}:${minStr} ${ampm}`);

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDateFormatted(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // STEP 1: Intentions Check State
  const { intentionsRow } = useMorningIntentions();
  const [intentions, setIntentions] = useState<IntentionItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      const list: IntentionItem[] = [];
      if (intentionsRow) {
        if (intentionsRow.priority_1) {
          list.push({ id: 1, text: intentionsRow.priority_1, status: 'done', timeSpent: '—' });
        }
        if (intentionsRow.priority_2) {
          list.push({ id: 2, text: intentionsRow.priority_2, status: 'done', timeSpent: '—' });
        }
        if (intentionsRow.priority_3) {
          list.push({ id: 3, text: intentionsRow.priority_3, status: 'done', timeSpent: '—' });
        }
      }
      setIntentions(list);
    }
  }, [isOpen, intentionsRow]);

  const completedCount = useMemo(() => {
    return intentions.filter(i => i.status === 'done').length;
  }, [intentions]);

  // Status cycling done -> partial -> missed -> done
  const cycleIntentionStatus = (id: number) => {
    setIntentions(prev => prev.map(item => {
      if (item.id === id) {
        let nextStatus: 'done' | 'missed' | 'partial' = 'done';
        if (item.status === 'done') nextStatus = 'partial';
        else if (item.status === 'partial') nextStatus = 'missed';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleTimeSpentChange = (id: number, val: string) => {
    setIntentions(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, timeSpent: val };
      }
      return item;
    }));
  };

  // STEP 2: Energy & Mood States
  // ⚡ Peak  💪 Good  😐 OK  😴 Drained  🤒 Rough
  const energyRatings = [
    { key: 'peak', label: 'Peak', emoji: '⚡', color: '#8B5CF6' },
    { key: 'good', label: 'Good', emoji: '💪', color: '#60A5FA' },
    { key: 'ok', label: 'OK', emoji: '😐', color: '#2DD4BF' },
    { key: 'drained', label: 'Drained', emoji: '😴', color: '#FBBF24' },
    { key: 'rough', label: 'Rough', emoji: '🤒', color: '#FB7185' }
  ];
  const [selectedEnergy, setSelectedEnergy] = useState<string>('good');

  const moodTagsRaw = [
    'Focused', 'Distracted', 'Energized', 'Anxious', 'Creative', 
    'Productive', 'Rushed', 'Calm', 'Social', 'Isolated', 'Motivated', 'Tired'
  ];
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>(['Focused', 'Productive', 'Rushed']);
  const [shakingPill, setShakingPill] = useState<string | null>(null);

  const toggleMoodTag = (tag: string) => {
    if (selectedMoodTags.includes(tag)) {
      setSelectedMoodTags(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedMoodTags.length >= 3) {
        // Shaking feedback indicating selection limit reject (max 3)
        setShakingPill(tag);
        setTimeout(() => setShakingPill(null), 500);
        return;
      }
      setSelectedMoodTags(prev => [...prev, tag]);
    }
  };

  // STEP 3: One Lesson State
  const [lessonText, setLessonText] = useState<string>('');
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);

  // Live Tomorrow Data
  const { tasks, createTask, completeTask } = useTasksData();

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const tomorrowEvents = useMemo(() => {
    return tasks
      .filter(t => {
        if (t.date !== tomorrowStr) return false;
        const type = t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'event');
        return type === 'event';
      })
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [tasks, tomorrowStr]);

  const getEnergyColor = (energy: string): string => {
    switch (energy) {
      case 'deep': return '#8B5CF6';
      case 'light': return '#60A5FA';
      case 'admin': return '#FBBF24';
      case 'creative': return '#FB7185';
      case 'social': return '#2DD4BF';
      default: return '#60A5FA';
    }
  };

  const formatTimeToAMPM = (timeStr?: string): string => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    if (isNaN(hour) || isNaN(min)) return timeStr;
    const isPM = hour >= 12;
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMin = String(min).padStart(2, '0');
    const ampm = isPM ? 'PM' : 'AM';
    return `${displayHour}:${displayMin} ${ampm}`;
  };

  // STEP 4: Tomorrow Setup State
  // Real tasks from database for tomorrow with type !== 'event'
  const tomorrowTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.date !== tomorrowStr) return false;
      const type = t.type || (t.startTime && t.endTime ? 'scheduled_task' : 'event');
      return type !== 'event';
    });
  }, [tasks, tomorrowStr]);

  const [quickAddVal, setQuickAddVal] = useState<string>('');

  const handleToggleTomorrowCheck = async (id: number | string) => {
    await completeTask(id);
  };

  const handleQuickAddTomorrowTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickAddVal.trim()) return;
    
    const isHigh = quickAddVal.toLowerCase().includes('high') || quickAddVal.includes('🔥');
    const gravityVal = isHigh ? 85 : 50;

    const newTask: Partial<Task> = {
      title: quickAddVal.trim(),
      energy: 'deep', // default to deep work
      completed: false,
      date: tomorrowStr,
      type: 'task',
      duration: '30m',
      gravity: gravityVal
    };

    await createTask(newTask);
    setQuickAddVal('');
  };

  // Staggered slide direction handler
  const goToNextStep = () => {
    if (currentStep < 4) {
      setSlideDirection('slide-left');
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setSlideDirection('');
      }, 200);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setSlideDirection('slide-right');
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setSlideDirection('');
      }, 200);
    }
  };

  // Finishing submission simulation
  const handleCompleteReview = () => {
    setIsFinishing(true);
    setTimeout(() => {
      setIsFinishedSuccess(true);
      // Increment streak
      setLocalStreak(prev => prev + 1);
      onStreakIncrement?.();
      setTimeout(() => {
        // Fade panel out
        onClose();
        // Reset steps for future sessions after panel completes close transition
        setTimeout(() => {
          setCurrentStep(1);
          setIsFinishing(false);
          setIsFinishedSuccess(false);
        }, 500);
      }, 1500);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      
      {/* CUSTOM TRANSITION STYLING BLOCK */}
      <style dangerouslySetInnerHTML={{ __html: `
        .review-panel-slide-entry {
          animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .step-slide-left {
          animation: shrinkAndFadeOutLeft 0.2s ease-in-out forwards;
        }

        .step-slide-right {
          animation: shrinkAndFadeOutRight 0.2s ease-in-out forwards;
        }

        @keyframes shrinkAndFadeOutLeft {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-40px) scale(0.97); }
        }

        @keyframes shrinkAndFadeOutRight {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(40px) scale(0.97); }
        }

        /* Pill rejection shake effect */
        @keyframes rejectionShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-pill {
          animation: rejectionShake 0.4s ease-in-out;
          border-color: #FB7185 !important;
          box-shadow: 0 0 8px rgba(251, 113, 133, 0.3);
        }

        /* Confetti particle elements simulator */
        @keyframes particleFlyUp {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120px) scale(0) rotate(360deg); opacity: 0; }
        }
        .confetti-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: particleFlyUp 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}} />

      {/* INNER PANEL BODY */}
      <div 
        onClick={(e) => e.stopPropagation()} // Stop back dismissal
        className="w-full max-w-[380px] h-full bg-[#0D0D0F] border-l border-[#2A2A2D] shadow-[-8px_0_32px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden relative review-panel-slide-entry"
      >
        
        {/* TOP COMPREHENSIVE HEADER ELEMENT (STICKY) */}
        <header className="p-5 border-b border-[#2A2A2D]/80 shrink-0 bg-[#0E0E10] flex flex-col justify-between select-none relative z-10">
          
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-[#8A8A90] uppercase font-bold">
                Evening Wind-Down Ritual
              </span>
              <h2 className="text-xl font-medium tracking-tight mt-1 text-[#F1F1F1] font-serif">
                {currentTime}
              </h2>
              <span className="text-xs text-[#8A8A90]">
                {currentDateFormatted}
              </span>
            </div>

            {/* Close Button X */}
            <button 
              onClick={onClose}
              className="p-1 px-1.5 rounded-lg border border-[#2A2A2D] hover:bg-white/5 hover:border-[#3D3D42] text-[#8A8A90] hover:text-white transition-all duration-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* DOT PROGRESS INDICATOR COLUMN */}
          <div className="flex items-center justify-between mt-4">
            
            {/* Dots */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => {
                const isActive = currentStep === step;
                const isPassed = currentStep > step;
                return (
                  <span 
                    key={step}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-5 bg-[#4F8EF7]' 
                        : isPassed 
                          ? 'w-2 bg-[#34D399]' 
                          : 'w-2 bg-[#2A2A2D]'
                    }`}
                  />
                );
              })}
            </div>

            {/* Step text number badge */}
            <span className="text-[10px] font-mono font-bold text-[#8A8A90] uppercase">
              Step {currentStep} of 4
            </span>
          </div>

          {/* 4 SECMENTS THIN HORIZONTAL SEGMENT BAR */}
          <div className="w-full flex gap-1 mt-3">
            {[1, 2, 3, 4].map((step) => {
              const isCompleted = currentStep > step;
              const isActive = currentStep === step;
              return (
                <div 
                  key={step} 
                  className="h-[3px] flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isCompleted 
                      ? '#34D399' 
                      : isActive 
                        ? '#4F8EF7' 
                        : '#2A2A2D'
                  }}
                />
              );
            })}
          </div>

        </header>

        {/* =========================================================
            DYNAMIC WORKFLOW SLIDING CONTENT SECTION
            ========================================================= */}
        <div 
          className={`flex-1 overflow-y-auto px-5 py-4 flex flex-col justify-between ${
            slideDirection === 'slide-left' ? 'step-slide-left' : 
            slideDirection === 'slide-right' ? 'step-slide-right' : ''
          }`}
        >
          
          {/* STEP 1 CONTAINER: Intentions Check */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5 flex-grow">
              
              <div className="flex flex-col gap-1.5 mt-1">
                <h3 className="text-[17px] font-serif text-[#F1F1F1] tracking-tight leading-snug">
                  How did your intentions go?
                </h3>
                <p className="text-xs text-[#8A8A90]">
                  Click each icon to cycle status (✓ Done, ~ Partial, ✗ Missed). Settle tracker ratios.
                </p>
              </div>

              {/* LIST OF INTENTIONS */}
              <div className="flex flex-col gap-3 my-2">
                {intentions.length === 0 && (
                  <div className="p-4 rounded-12 bg-[#141416]/50 border border-dashed border-[#2A2A2D] text-center flex flex-col items-center justify-center py-8 gap-2">
                    <Target className="w-6 h-6 text-[#8A8A90] opacity-55 animate-pulse" />
                    <span className="text-xs text-[#8A8A90] font-sans">No priority intentions recorded for today.</span>
                  </div>
                )}
                {intentions.map((item) => {
                  return (
                    <div 
                      key={item.id}
                      className="p-3 bg-[#141416]/50 border border-[#2A2A2D]/80 rounded-12 flex items-center justify-between gap-3 relative select-none"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        
                        {/* Interactive state trigger button */}
                        <button
                          onClick={() => cycleIntentionStatus(item.id)}
                          className={`w-[34px] h-[34px] rounded-8 shrink-0 flex items-center justify-center font-bold text-sm cursor-pointer transition-all duration-150 transform active:scale-95 ${
                            item.status === 'done' ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40' :
                            item.status === 'partial' ? 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40' :
                            'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40'
                          }`}
                          title="Click Status"
                        >
                          {item.status === 'done' ? '✓' : item.status === 'partial' ? '~' : '✗'}
                        </button>

                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-semibold leading-normal truncate ${
                            item.status === 'missed' ? 'line-through text-[#4A4A52]' : 'text-[#F1F1F1]'
                          }`}>
                            {item.text}
                          </span>
                          <span className="text-[10px] text-[#8A8A90] font-mono uppercase mt-0.5">
                            Status: {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Time tracker miniature form */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input 
                          type="text" 
                          value={item.timeSpent}
                          onChange={(e) => handleTimeSpentChange(item.id, e.target.value)}
                          className="w-14 text-center py-1 bg-[#1C1C1F] border border-[#2A2A2D] rounded-6 text-[11px] font-mono text-white focus:outline-none focus:border-[#4F8EF7]"
                          placeholder="—"
                          title="Time spent"
                        />
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* MOTIVATIONAL SUMMARY */}
              <div className="bg-[#141416] border border-[#2A2A2D] rounded-12 p-3.5 flex flex-col gap-1.5 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#34D399]/15 flex items-center justify-center text-[#34D399]">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#F1F1F1]">
                    {completedCount}/{intentions.length} Intentions Complete
                  </span>
                </div>
                
                <p className="text-[12px] text-[#34D399] italic pl-7 font-sans">
                  {intentions.length === 0 ? "Set morning intentions tomorrow to track them here." :
                   completedCount === intentions.length ? "Incredible performance! Clean sweep." :
                   completedCount >= Math.ceil(intentions.length * 0.6) ? "That's a solid day. Steady progression." :
                   "Tomorrow is a fresh canvas. Rest up."}
                </p>
              </div>

            </div>
          )}

          {/* STEP 2 CONTAINER: Energy & Mood */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5 flex-grow">
              
              <div className="flex flex-col gap-1 mt-1">
                <h3 className="text-[17px] font-serif text-[#F1F1F1] tracking-tight leading-snug">
                  How did your day feel?
                </h3>
                <span className="text-[11px] text-[#8A8A90]">Evaluate focus intensity & mood swings of today.</span>
              </div>

              {/* ENERGY CAROUSEL (circles of 56px) */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8A90]">
                  Energy Rating
                </span>

                <div className="flex items-center justify-between gap-1 bg-[#141416]/50 border border-[#2A2A2D]/80 p-2 rounded-12">
                  {energyRatings.map((e) => {
                    const isSelected = selectedEnergy === e.key;
                    return (
                      <button
                        key={e.key}
                        onClick={() => setSelectedEnergy(e.key)}
                        className={`flex-1 py-2 flex flex-col items-center gap-1 cursor-pointer transition-all duration-150 rounded-8 ${
                          isSelected ? 'bg-[#1C1C1F] shadow' : 'hover:bg-[#1C1C1F]/40'
                        }`}
                        style={{
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          border: isSelected ? `1px solid ${e.color}` : '1px solid transparent'
                        }}
                      >
                        <span className="text-xl leading-none">{e.emoji}</span>
                        <span className="text-[10px] font-mono font-bold leading-none mt-0.5" style={{ color: isSelected ? e.color : '#8A8A90' }}>
                          {e.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MOOD TAGS FOR MULTISELECT */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8A90]">
                    Tags (Pick all that apply)
                  </span>
                  <span className="text-[10px] font-sans text-right text-[#8A8A90]">
                    {selectedMoodTags.length}/3 tags selected
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {moodTagsRaw.map((tag) => {
                    const isSelected = selectedMoodTags.includes(tag);
                    const isShaking = shakingPill === tag;

                    return (
                      <button
                        key={tag}
                        onClick={() => toggleMoodTag(tag)}
                        className={`py-1.5 px-2 rounded-8 border text-[11px] cursor-pointer font-sans duration-100 font-medium ${
                          isSelected 
                            ? 'bg-[#4F8EF7]/15 border-[#4F8EF7]/50 text-[#4F8EF7]' 
                            : 'bg-transparent border-[#2A2A2D] hover:border-[#3D3D42] text-[#8A8A90]'
                        } ${isShaking ? 'shake-pill' : ''}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] font-sans text-[#8A8A90] italic mt-auto bg-[#0E0E10] border border-[#2A2A2D]/60 p-3 rounded-12 leading-relaxed">
                Evaluating energy metrics teaches you exactly when to schedule deep focus vs administrative actions. Good mapping!
              </p>

            </div>
          )}

          {/* STEP 3 CONTAINER: One Lesson */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5 flex-grow">
              
              <div className="flex flex-col gap-1.5 mt-1">
                <h3 className="text-[17px] font-serif text-[#F1F1F1] tracking-tight leading-snug">
                  What's one thing you learned today?
                </h3>
                <span className="text-xs text-[#8A8A90]">
                  Summarize key learnings into one sentence. Keep it concise.
                </span>
              </div>

              {/* TEXTAREA FORM */}
              <div className="relative">
                <textarea
                  value={lessonText}
                  onChange={(e) => {
                    if (e.target.value.length <= 140) {
                      setLessonText(e.target.value);
                    }
                  }}
                  rows={4}
                  placeholder="Today I learned that..."
                  className="w-full bg-[#1C1C1F] border border-[#2A2A2D] focus:border-[#4F8EF7] rounded-12 p-3 text-xs text-white leading-relaxed focus:outline-none placeholder-[#4A4A52] resize-none"
                />

                <span className="text-[10px] font-mono text-[#4A4A52] absolute bottom-3 right-3 select-none">
                  {lessonText.length} / 140
                </span>
              </div>

              {/* COLLAPSIBLE ACCORDION FOR PAST LESSONS */}
              <div className="flex flex-col bg-[#141416]/60 border border-[#2A2A2D]/80 rounded-12 overflow-hidden">
                <button
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                  className="w-full flex items-center justify-between p-3 cursor-pointer text-[#8A8A90] hover:text-white hover:bg-white/[0.02] text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#FB7185]" />
                    <span>View Recent Daily Lessons</span>
                  </div>
                  {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAccordionOpen && (
                  <div className="p-3 pt-0 border-t border-[#2A2A2D]/40 flex flex-col gap-2.5 max-h-32 overflow-y-auto">
                    <div className="text-[11px] text-[#8A8A90] hover:text-white transition-colors">
                      <span className="font-mono text-[#4A4A52]">Jun 5</span> — Deep work sessions are 40% more effective before noon
                    </div>
                    <div className="text-[11px] text-[#8A8A90] hover:text-white transition-colors">
                      <span className="font-mono text-[#4A4A52]">Jun 4</span> — Estimating tasks by energy type is more accurate than by time
                    </div>
                    <div className="text-[11px] text-[#8A8A90] hover:text-white transition-colors">
                      <span className="font-mono text-[#4A4A52]">Jun 3</span> — Distracted tags scale up when coffee breaks exceed 20 min ratios
                    </div>
                  </div>
                )}
              </div>

              {/* LESSON STREAK BOX */}
              <div className="flex items-center gap-2 bg-[#34D399]/10 border border-[#34D399]/20 p-2.5 rounded-10 mt-auto select-none">
                <Flame className="w-4 h-4 text-[#34D399] shrink-0" />
                <span className="text-[11px] font-mono font-bold text-[#34D399] uppercase tracking-wider">
                  📝 14-day lesson streak maintained!
                </span>
              </div>

            </div>
          )}

          {/* STEP 4 CONTAINER: Tomorrow Setup & Review Summary */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-5 flex-grow">
              
              <div className="flex flex-col gap-1 mt-1">
                <h3 className="text-[17px] font-serif text-[#F1F1F1] tracking-tight leading-snug">
                  Quick look at tomorrow
                </h3>
                <span className="text-[11px] text-[#8A8A90]">Preview synchronous calendar blocks and high-priority targets.</span>
              </div>

              {/* READ ONLY SCHEDULED EVENTS CONTAINER */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8A90]">
                  Scheduled Events (Read-Only)
                </span>

                {tomorrowEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 py-8 rounded-12 bg-[#141416]/30 border border-dashed border-[#2A2A2D] text-center gap-1.5">
                    <Calendar className="w-5 h-5 text-[#8A8A90] opacity-40" />
                    <span className="text-xs text-[#8A8A90] font-sans">No events scheduled for tomorrow yet.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 bg-[#141416]/50 border border-[#2A2A2D]/80 p-2.5 rounded-12">
                    {tomorrowEvents.map((event, idx) => (
                      <div 
                        key={event.id} 
                        className={`flex items-center justify-between ${idx > 0 ? 'border-t border-[#2A2A2D]/40 pt-1.5' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-grow mr-2">
                          <span 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: getEnergyColor(event.energy) }}
                          />
                          <span className="text-xs font-semibold truncate text-[#F1F1F1]">{event.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A8A90] shrink-0">
                          {event.startTime ? formatTimeToAMPM(event.startTime) : 'All day'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TASKS FLAGGED FOR TOMORROW (INTERACTIVE CHECKLIST) */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8A90]">
                  Tasks Flagged for Tomorrow ({tomorrowTasks.length})
                </span>

                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {tomorrowTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 py-6 rounded-12 bg-[#141416]/30 border border-dashed border-[#2A2A2D] text-center gap-1">
                      <Zap className="w-5 h-5 text-[#8A8A90] opacity-35" />
                      <span className="text-xs text-[#8A8A90] font-sans">No tasks planned for tomorrow yet.</span>
                    </div>
                  ) : (
                    tomorrowTasks.map((task) => {
                      const isChecked = !!task.completed;
                      const hasHighGravity = task.gravity >= 80;
                      return (
                        <div 
                          key={task.id}
                          onClick={() => handleToggleTomorrowCheck(task.id)}
                          className="flex items-center justify-between p-2 rounded-8 bg-[#1C1C1F]/40 border border-[#2A2A2D]/70 hover:border-[#3D3D42] text-xs cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-grow min-w-0">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {}} // Handle on parent container click instead
                              className="rounded accent-[#4F8EF7] shrink-0" 
                            />
                            <span className={`truncate ${isChecked ? 'line-through text-[#4A4A52]' : 'text-white'}`}>
                              {task.title}
                            </span>
                          </div>
                          
                          {hasHighGravity && (
                            <span className="text-[9px] font-bold text-[#FB7185] bg-[#FB7185]/15 px-1 py-0.2 rounded uppercase ml-1 shrink-0">
                              High 🔥
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* MINI QUICK ADD FOR TOMORROW */}
              <form onSubmit={handleQuickAddTomorrowTask} className="flex gap-2 min-w-0">
                <input 
                  type="text"
                  placeholder="Quick capture to tomorrow checklist..."
                  value={quickAddVal}
                  onChange={(e) => setQuickAddVal(e.target.value)}
                  className="flex-grow px-3 py-1.5 bg-[#1C1C1F] border border-[#2A2A2D] focus:border-[#4F8EF7] text-xs text-white placeholder-[#4A4A52] rounded-8 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-8 bg-[#4F8EF7] hover:bg-[#3D7FE5] flex items-center justify-center cursor-pointer text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* ENERGY INTEGRITY STATEMENT */}
              <div className="p-3 bg-gradient-to-r from-[#8B5CF6]/15 to-transparent border-l-2 border-[#8B5CF6] rounded-r-12 flex flex-col gap-1 mt-1">
                <span className="text-xs font-bold text-white leading-normal flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#8B5CF6] animate-pulse" />
                  Heavy Deep Work Day Ahead ⚡
                </span>
                
                {/* Horizontal Segment energy representation */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-2 rounded bg-[#8B5CF6]" style={{ width: '60%' }} title="Deep energy" />
                  <div className="h-2 rounded bg-[#2DD4BF]" style={{ width: '25%' }} title="Social blocks" />
                  <div className="h-2 rounded bg-[#FBBF24]" style={{ width: '15%' }} title="Admin tasks" />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#8A8A90] font-mono mt-0.5">
                  <span>Deep 4h</span>
                  <span>Social 1h</span>
                  <span>Admin 30m</span>
                </div>
              </div>

            </div>
          )}

          {/* DYNAMIC PROGRESS AND STEP OVER NAVIGATION ACTIONS CONTROLS (At bottom of dynamic stack) */}
          <div className="flex items-center gap-3.5 pt-4 border-t border-[#2A2A2D]/40 mt-4 shrink-0">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-4 h-[40px] text-xs font-semibold border border-[#2A2A2D] hover:bg-white/5 rounded-8 text-[#8A8A90] hover:text-white transition-all cursor-pointer"
              >
                ← Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 h-[40px] bg-[#4F8EF7] hover:bg-[#3D7FE5] text-xs font-bold text-white transition-all cursor-pointer rounded-8 shadow-md"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteReview}
                disabled={isFinishing}
                className={`flex-grow h-[46px] select-none text-xs font-bold transition-all duration-150 cursor-pointer rounded-10 shadow-lg relative overflow-hidden text-center flex items-center justify-center ${
                  isFinishedSuccess ? 'bg-[#34D399] text-black' : 'bg-gradient-to-r from-[#4F8EF7] to-[#8B5CF6] text-white hover:opacity-90 active:scale-95'
                }`}
              >
                {isFinishing ? (
                  isFinishedSuccess ? (
                    <span className="flex items-center gap-2 animate-bounce">
                      <PartyPopper className="w-4 h-4" /> Great work today! 🎉
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving Reflection Log...
                    </span>
                  )
                ) : (
                  <span>Complete Review & Wind-down</span>
                )}

                {/* Simulated Confetti visual sprays when finished */}
                {isFinishedSuccess && [1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                  const leftOffset = 20 + i * 8;
                  const flyDelay = i * 0.1;
                  return (
                    <span 
                      key={i} 
                      className="confetti-particle bg-yellow-400"
                      style={{ 
                        left: `${leftOffset}%`, 
                        animationDelay: `${flyDelay}s`,
                        backgroundColor: i % 2 === 0 ? '#34D399' : i % 3 === 0 ? '#4F8EF7' : '#FB7185'
                      }} 
                    />
                  );
                })}
              </button>
            )}
          </div>

        </div>

        {/* =========================================================
            BOTTOM PANEL FIXED FOOTER STREAK BLOCK
            ========================================================= */}
        <footer className="p-4 bg-[#0A0A0C] border-t border-[#2A2A2D]/80 shrink-0 text-center select-none flex items-center justify-center relative">
          <div className="flex items-center gap-2 font-mono text-xs text-[#34D399] font-bold">
            <Flame className="w-4 h-4 text-[#34D399] animate-pulse" />
            <span>✓ Streak maintained: {localStreak} days</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
