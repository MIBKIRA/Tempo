import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Search, Calendar, Play, CheckCircle2, Clock, Check, ChevronRight, AlertCircle, X,
  Compass, ArrowRight, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { Task, EnergyType, TimeBlock } from '../types';

interface EnergyPlannerViewProps {
  tasks: Task[];
  onStartFocusSession: (task: Task) => void;
}

const energyLabels: Record<EnergyType, string> = {
  deep: 'Deep Focus',
  light: 'Light Work',
  admin: 'Admin Duty',
  creative: 'Creative Session',
  social: 'Social Activity'
};

const energyColors: Record<EnergyType, string> = {
  deep: 'var(--tempo-accent-purple)',
  light: 'var(--tempo-accent-teal)',
  admin: 'var(--tempo-accent-blue)',
  creative: 'var(--tempo-accent-coral)',
  social: '#0284c7'
};

const energyBgColors: Record<EnergyType, string> = {
  deep: 'rgba(139, 92, 246, 0.08)',
  light: 'rgba(45, 212, 191, 0.08)',
  admin: 'rgba(79, 142, 247, 0.08)',
  creative: 'rgba(251, 113, 133, 0.08)',
  social: 'rgba(2, 132, 199, 0.08)'
};

export default function EnergyPlannerView({ tasks, onStartFocusSession }: EnergyPlannerViewProps) {
  const [activeChoice, setActiveChoice] = useState<'picker' | 'now' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType | 'all'>('all');

  // Load scheduler blocks to scan for "scheduled now"
  const timeBlocks = useMemo(() => {
    const saved = localStorage.getItem("tempo-time-blocks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 1, title: "Deep Work: API Integration", startTime: "09:00", endTime: "10:30", energy: "deep", notes: "Focus on database schemas and OAuth flow middleware validation." },
      { id: 2, title: "Team Standup", startTime: "10:30", endTime: "11:00", energy: "social", notes: "Daily update on onboarding progress and backend release blockers." },
      { id: 3, title: "Lunch Break", startTime: "12:00", endTime: "13:00", energy: "light", notes: "Walk near the park, offline recovery block." },
      { id: 4, title: "Architecture Review", startTime: "14:00", endTime: "15:30", energy: "deep", notes: "Reviewing the multi-user WebSockets architecture design specifications." },
      { id: 5, title: "Email Triage", startTime: "16:00", endTime: "16:30", energy: "admin", notes: "Clear standard priority pending inbox tasks." },
      { id: 6, title: "Read / Wind Down", startTime: "19:00", endTime: "20:00", energy: "light", notes: "Mindfulness and reading chapter 4 of Designing Data-Intensive Applications." }
    ];
  }, []);

  // Compute scheduled blocks active right now
  const activeNowBlocks = useMemo(() => {
    // Check if we are running in mock times or real times
    const now = new Date();
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();

    const timeToMins = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    return timeBlocks.filter(block => {
      const startMins = timeToMins(block.startTime);
      const endMins = timeToMins(block.endTime);
      return currentTotalMins >= startMins && currentTotalMins <= endMins;
    });
  }, [timeBlocks]);

  // List of incomplete tasks
  const openTasks = useMemo(() => {
    return tasks.filter(t => !t.completed);
  }, [tasks]);

  // Filtered task lists for Picker option
  const filteredTasks = useMemo(() => {
    return openTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEnergy = selectedEnergy === 'all' || task.energy === selectedEnergy;
      return matchesSearch && matchesEnergy;
    });
  }, [openTasks, searchQuery, selectedEnergy]);

  // Handler for Quick Focus Session
  const handleQuickFocus = () => {
    onStartFocusSession({
      id: 8888, // Special placeholder ID for quick session
      title: 'Quick Focus Session',
      energy: 'deep',
      duration: '25m',
      gravity: 50,
      completed: false
    });
  };

  // Handler to start session for a custom picked task
  const handleStartTaskSession = (task: Task) => {
    onStartFocusSession(task);
  };

  // Handler to start session for a scheduled block
  const handleStartBlockSession = (block: any) => {
    onStartFocusSession({
      id: block.id + 10000, // Namespace offset so it doesn't conflict with core task ids
      title: block.title,
      energy: block.energy,
      duration: '25m',
      gravity: 80,
      completed: false
    });
  };

  return (
    <div id="tempo-energy-planner-main" className="flex-grow flex flex-col h-full bg-[#0D0D0F] text-[#F1F1F1] overflow-y-auto p-6 md:p-8 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col mb-8 select-none">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1 px-1.5 rounded-md bg-[#4F8EF7]/10 text-[#4F8EF7] text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#4F8EF7]" /> Active Catalyst
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white font-sans">
          Energy Planner
        </h1>
        <p className="text-xs text-[#8A8A90] mt-0.5 max-w-xl leading-relaxed">
          Coordinate focus periods that align with your current mental state, workload availability, and timeline blocks.
        </p>
      </div>

      {/* Choice Screen Hub */}
      {activeChoice === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full mx-auto select-none pt-4">
          
          {/* Card 1: Quick Focus Session */}
          <button
            onClick={handleQuickFocus}
            className="flex flex-col text-left p-6 rounded-xl border border-[#1C1C1F] bg-[#121214] hover:border-[var(--tempo-accent-purple)]/60 hover:bg-[#181520]/40 transition-all duration-200 cursor-pointer text-inherit outline-none focus:border-[var(--tempo-accent-purple)] shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--tempo-accent-purple)]/5 rounded-full blur-2xl origin-top-right transition-all group-hover:scale-125" />
            <div className="w-10 h-10 rounded-lg bg-[var(--tempo-accent-purple)]/10 text-[var(--tempo-accent-purple)] flex items-center justify-center mb-4.5">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            
            <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-[var(--tempo-accent-purple)] transition-colors">
              Quick Focus Session
            </h3>
            <p className="text-xs text-[#8A8A90] mt-1.5 leading-relaxed flex-grow">
              Boot an immediate, unlinked Pomodoro session right now. Fits any generic focus duty.
            </p>
            
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--tempo-accent-purple)] font-bold uppercase mt-5">
              <span>Launch session</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: Choose a Task */}
          <button
            onClick={() => setActiveChoice('picker')}
            className="flex flex-col text-left p-6 rounded-xl border border-[#1C1C1F] bg-[#121214] hover:border-[var(--tempo-accent-teal)]/60 hover:bg-[#0E1B1B]/40 transition-all duration-200 cursor-pointer text-inherit outline-none focus:border-[var(--tempo-accent-teal)] shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--tempo-accent-teal)]/5 rounded-full blur-2xl origin-top-right transition-all group-hover:scale-125" />
            <div className="w-10 h-10 rounded-lg bg-[var(--tempo-accent-teal)]/10 text-[var(--tempo-accent-teal)] flex items-center justify-center mb-4.5">
              <Search className="w-5 h-5" />
            </div>
            
            <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-[var(--tempo-accent-teal)] transition-colors">
              Choose a Task
            </h3>
            <p className="text-xs text-[#8A8A90] mt-1.5 leading-relaxed flex-grow">
              Filter your current incomplete backlog grouped by energy levels. Link your timer directly.
            </p>
            
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--tempo-accent-teal)] font-bold uppercase mt-5">
              <span>View backlog</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 3: Continue Scheduled Now */}
          <button
            onClick={() => setActiveChoice('now')}
            className="flex flex-col text-left p-6 rounded-xl border border-[#1C1C1F] bg-[#121214] hover:border-[#4F8EF7]/60 hover:bg-[#0C1525]/40 transition-all duration-200 cursor-pointer text-inherit outline-none focus:border-[#4F8EF7] shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F8EF7]/5 rounded-full blur-2xl origin-top-right transition-all group-hover:scale-125" />
            <div className="w-10 h-10 rounded-lg bg-[#4F8EF7]/10 text-[#4F8EF7] flex items-center justify-center mb-4.5 relative">
              <Calendar className="w-5 h-5" />
              {activeNowBlocks.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              )}
            </div>
            
            <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-[#4F8EF7] transition-colors">
              Scheduled Calendar Slot
            </h3>
            <p className="text-xs text-[#8A8A90] mt-1.5 leading-relaxed flex-grow">
              Sync with your timeline blocks. Automatically fetches whatever activity block is scheduled now.
            </p>
            
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#4F8EF7] font-bold uppercase mt-5">
              <span>Scan schedule</span>
              {activeNowBlocks.length > 0 ? (
                <span className="ml-auto text-[9px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/25 font-bold animate-pulse">
                  {activeNowBlocks.length} Active
                </span>
              ) : (
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </button>

        </div>
      ) : activeChoice === 'picker' ? (
        
        /* PICKER PATH UI */
        <div className="flex flex-col flex-grow w-full max-w-4xl mx-auto bg-[#121214] border border-[#1C1C1F] rounded-xl p-5 md:p-6 shadow-xl animate-fade-in">
          
          {/* Header row */}
          <div className="flex items-center justify-between mb-5 select-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[var(--tempo-accent-teal)]/15 rounded text-[var(--tempo-accent-teal)] flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Choose from Backlog</h2>
                <p className="text-[10px] text-[#8A8A90]">Select a task from your current cockpit list to launch session.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveChoice(null)}
              className="p-1 text-xs text-[#8A8A90] hover:text-white rounded border border-[#1C1C1F] hover:bg-[#18181D]/80 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar + Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between pb-4 border-b border-[#1C1C1F] mb-4 select-none">
            <div className="relative flex-grow max-w-md">
              <input 
                type="text" 
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-[#2B2B30] hover:border-[#3D3D42] focus:border-[var(--tempo-accent-teal)]/80 focus:outline-none rounded-lg px-3 py-1.5 pl-8 text-xs text-[#F1F1F1] placeholder-[#8A8A90] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#8A8A90] absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8A90] hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 items-center">
              <button
                onClick={() => setSelectedEnergy('all')}
                className={`px-2 py-1 rounded text-[10px] font-mono-jb transition-all cursor-pointer border ${
                  selectedEnergy === 'all' 
                    ? 'bg-[#1D1D20] text-white border-[#3D3D42]' 
                    : 'text-[#8A8A90] border-transparent hover:text-white hover:bg-[#151517]'
                }`}
              >
                All
              </button>
              {(['deep', 'light', 'admin', 'creative', 'social'] as EnergyType[]).map(energy => (
                <button
                  key={energy}
                  onClick={() => setSelectedEnergy(energy)}
                  className={`px-2 py-1 rounded text-[10px] font-mono-jb transition-all cursor-pointer border flex items-center gap-1.5 ${
                    selectedEnergy === energy
                      ? 'bg-[#1D1D20] text-white border-[#3D3D42]'
                      : 'text-[#8A8A90] border-transparent hover:text-white hover:bg-[#151517]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: energyColors[energy] }} />
                  {energyLabels[energy]}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-grow overflow-y-auto max-h-[360px] pr-1 flex flex-col gap-2">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const energyColor = energyColors[task.energy];
                const bgCol = energyBgColors[task.energy];

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-[#0E0E10]/70 border border-[#1A1A1D] hover:border-[#2A2A2F] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-grow">
                      {/* Left Energy Category Badge Indicator */}
                      <div 
                        className="p-1 px-1.8 rounded font-mono-jb text-[8px] font-bold uppercase shrink-0 select-none"
                        style={{ color: energyColor, backgroundColor: bgCol, border: `1px solid ${energyColor}22` }}
                      >
                        {energyLabels[task.energy]}
                      </div>
                      
                      <p className="text-xs text-[#F1F1F1] font-sans font-medium hover:text-white truncate leading-normal">
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4 select-none">
                      {/* Duration */}
                      <span className="text-[10px] font-mono text-[#8A8A90] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#5A5A62]" /> {task.duration || '25m'}
                      </span>
                      
                      {/* Click trigger button */}
                      <button
                        onClick={() => handleStartTaskSession(task)}
                        className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-wide uppercase bg-[var(--tempo-accent-teal)]/15 border border-[var(--tempo-accent-teal)]/30 hover:bg-[var(--tempo-accent-teal)] hover:text-[#0C1525] text-[var(--tempo-accent-teal)] hover:border-[var(--tempo-accent-teal)] rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Play className="w-2 h-2 fill-current" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 select-none flex flex-col items-center justify-center p-6 border border-dashed border-[#222] rounded-lg">
                <AlertCircle className="w-5 h-5 text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-400 font-sans">No tasks model matches the query.</p>
                <p className="text-[10px] text-zinc-500 mt-1">Try relaxing filters or search titles.</p>
              </div>
            )}
          </div>

        </div>
      ) : (

        /* SCHEDULED NOW PATH UI */
        <div className="flex flex-col flex-grow w-full max-w-2xl mx-auto bg-[#121214] border border-[#1C1C1F] rounded-xl p-5 md:p-6 shadow-xl animate-fade-in select-none">
          
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#4F8EF7]/15 rounded text-[#4F8EF7] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Timeline Scheduler Slots</h2>
                <p className="text-[10px] text-[#8A8A90]">Starts sessions bound directly to your current schedule.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveChoice(null)}
              className="p-1 text-xs text-[#8A8A90] hover:text-white rounded border border-[#1C1C1F] hover:bg-[#18181D]/80 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-grow flex flex-col justify-center py-2">
            {activeNowBlocks.length > 0 ? (
              <div className="flex flex-col gap-4">
                
                {/* Status Indicator Bar */}
                <div className="flex items-center gap-2 text-[10px] text-[#10B981] font-bold font-mono uppercase bg-[#10B981]/10 px-3 py-1.5 rounded border border-[#10B981]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  <span>Found {activeNowBlocks.length} running appointment(s) right now on your agenda:</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {activeNowBlocks.map(block => {
                    const col = energyColors[block.energy];
                    return (
                      <div 
                        key={block.id} 
                        className="flex flex-col p-4 md:p-5 rounded-lg border border-[#2B2B30] bg-[#171719]/90 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-grow">
                            <span 
                              className="text-[8px] font-bold font-mono tracking-widest uppercase"
                              style={{ color: col }}
                            >
                              {energyLabels[block.energy]}
                            </span>
                            <h3 className="text-sm font-bold text-white tracking-tight mt-1 truncate">
                              {block.title}
                            </h3>
                            <span className="text-[10px] font-mono text-zinc-400 mt-2 block bg-[#0F0F11] inline-block px-2 py-0.5 rounded border border-white/5">
                              🕒 {block.startTime} - {block.endTime}
                            </span>
                            {block.notes && (
                              <p className="text-[10px] text-zinc-500 italic mt-2.5 leading-relaxed bg-zinc-900/40 p-2.5 rounded border border-zinc-800/50">
                                {block.notes}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleStartBlockSession(block)}
                            className="shrink-0 px-4 py-2 text-xs font-bold font-mono tracking-wide uppercase bg-[#4F8EF7]/15 border border-[#4F8EF7]/30 hover:bg-[#4F8EF7] hover:text-[#0C1525] text-[#4F8EF7] hover:border-[#4F8EF7] rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-md transform hover:scale-105 active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Start Focus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              <div className="text-center py-8 p-6 bg-[#0E0E10] border border-[#1A1A1D] rounded-lg flex flex-col items-center justify-center">
                <AlertCircle className="w-6 h-6 text-zinc-600 mb-2.5" />
                <h4 className="text-xs font-semibold text-zinc-400">Nothing scheduled right now</h4>
                <p className="text-[10px] text-zinc-500 max-w-xs mt-1.5 leading-normal">
                  No layout appointment block bounds your current timestamp. Check your Timeline schedule or boot a Quick Session instead.
                </p>
                
                <button 
                  onClick={handleQuickFocus}
                  className="mt-4 px-3.5 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wide bg-[var(--tempo-accent-purple)]/15 border border-[var(--tempo-accent-purple)]/30 hover:bg-[var(--tempo-accent-purple)] hover:text-[#0C1525] text-[var(--tempo-accent-purple)] hover:border-[var(--tempo-accent-purple)] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Boot Quick Session</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
