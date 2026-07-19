import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Clock, Compass, HelpCircle, Activity, Sparkles, 
  Check, FileJson, Sun, Moon, TreeDeciduous, 
  Grid, Zap, CheckSquare, Plus, ArrowUpRight, ArrowRight,
  User, Settings, Calendar, Columns, Flame, BarChart3
} from 'lucide-react';
import { LogoSm } from './Logo';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tabId: string) => void;
  onThemeChange?: (themeName: 'midnight' | 'paper' | 'forest') => void;
  onOpenEveningReview?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  group: 'Recent' | 'Navigation' | 'Actions';
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }> | string;
  type: 'command';
  action: () => void;
}

interface TaskItem {
  id: number;
  title: string;
  energy: 'deep' | 'light' | 'admin' | 'creative' | 'social';
  date: string;
  completed: boolean;
  type: 'task';
}

export default function CommandPalette({ isOpen, onClose, onNavigate, onThemeChange, onOpenEveningReview }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Trigger feedback banner upon selecting actions
  const triggerFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => {
      setActionFeedback(null);
    }, 2500);
  };

  // Hardcoded Tasks (mimics database matches)
  const taskData: TaskItem[] = [
    { id: 1, title: 'API Integration for Onboarding Storyboard', energy: 'deep', date: 'Tomorrow', completed: false, type: 'task' },
    { id: 2, title: 'API Rate Limiting & Proxy Research specs', energy: 'deep', date: 'Next week', completed: false, type: 'task' },
    { id: 3, title: 'Design new API response content formats', energy: 'creative', date: 'Jun 10', completed: false, type: 'task' },
    { id: 4, title: 'Database planning writeup with Cloud Spanner', energy: 'deep', date: 'Today', completed: false, type: 'task' },
    { id: 5, title: 'Coordinate client-side telemetry layout limits', energy: 'admin', date: 'Yesterday', completed: true, type: 'task' },
    { id: 6, title: 'Weekly Sprint Sync and Review planning session', energy: 'social', date: 'Today', completed: false, type: 'task' },
    { id: 7, title: 'Refactor spring motion canvas parameters', energy: 'creative', date: 'Today', completed: false, type: 'task' },
    { id: 8, title: 'Update stripe subscription and tax coordinates', energy: 'admin', date: 'Jun 15', completed: false, type: 'task' }
  ];

  // Hardcoded Commands/Actions (around 25 items for thorough coverage)
  const commands = useMemo<CommandItem[]>(() => [
    // GROUP 1: Recent Items
    {
      id: 'r-today',
      label: 'Today View',
      group: 'Recent',
      shortcut: 'T',
      icon: Clock,
      type: 'command',
      action: () => {
        onNavigate?.('today');
        triggerFeedback('Navigated to Today View');
      }
    },
    {
      id: 'r-focus',
      label: 'Start Focus Mode',
      group: 'Recent',
      shortcut: 'Ctrl+F',
      icon: Clock,
      type: 'command',
      action: () => {
        onNavigate?.('focus');
        triggerFeedback('Initiated Focus Session');
      }
    },
    {
      id: 'r-new-task',
      label: 'New Task',
      group: 'Recent',
      shortcut: 'N',
      icon: Clock,
      type: 'command',
      action: () => {
        triggerFeedback('Spawned "New Task" wizard overlay');
      }
    },
    {
      id: 'r-analytics',
      label: 'Velocity Dashboard',
      group: 'Recent',
      shortcut: 'A',
      icon: Clock,
      type: 'command',
      action: () => {
        onNavigate?.('analytics');
        triggerFeedback('Opened Performance & Velocity Stats');
      }
    },

    // GROUP 2: Navigation
    {
      id: 'nav-today',
      label: 'Go to Today View',
      group: 'Navigation',
      shortcut: 'T',
      icon: Calendar,
      type: 'command',
      action: () => {
        onNavigate?.('today');
        triggerFeedback('Navigating: Today cockpit');
      }
    },
    {
      id: 'nav-week',
      label: 'Go to Week View',
      group: 'Navigation',
      shortcut: 'W',
      icon: Columns,
      type: 'command',
      action: () => {
        onNavigate?.('week');
        triggerFeedback('Navigating: Week timeline view');
      }
    },
    {
      id: 'nav-calendar',
      label: 'Go to Calendar',
      group: 'Navigation',
      shortcut: 'C',
      icon: Calendar,
      type: 'command',
      action: () => {
        onNavigate?.('month');
        triggerFeedback('Navigating: Month calendar grid');
      }
    },
    {
      id: 'nav-tasks',
      label: 'Go to Tasks',
      group: 'Navigation',
      shortcut: 'K',
      icon: CheckSquare,
      type: 'command',
      action: () => {
        onNavigate?.('today');
        triggerFeedback('Navigated to main Tasks focus stack');
      }
    },
    {
      id: 'nav-habits',
      label: 'Go to Habits',
      group: 'Navigation',
      shortcut: 'H',
      icon: Flame,
      type: 'command',
      action: () => {
        onNavigate?.('habits');
        triggerFeedback('Navigating: Daily habits logs');
      }
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      group: 'Navigation',
      shortcut: 'A',
      icon: BarChart3,
      type: 'command',
      action: () => {
        onNavigate?.('analytics');
        triggerFeedback('Navigating: Velocity metrics charts');
      }
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      group: 'Navigation',
      shortcut: ',',
      icon: Settings,
      type: 'command',
      action: () => {
        onNavigate?.('integrations');
        triggerFeedback('Accessing app configuration settings');
      }
    },

    // GROUP 3: Actions
    {
      id: 'act-new-task',
      label: 'Create New Task',
      group: 'Actions',
      shortcut: 'N',
      icon: Plus,
      type: 'command',
      action: () => {
        triggerFeedback('Opening quick action task prompt form');
      }
    },
    {
      id: 'act-new-event',
      label: 'Create New Event',
      group: 'Actions',
      shortcut: 'E',
      icon: Plus,
      type: 'command',
      action: () => {
        triggerFeedback('Triggering Calendar block creation tool');
      }
    },
    {
      id: 'act-start-pomo',
      label: 'Start Focus Session',
      group: 'Actions',
      shortcut: 'Ctrl+F',
      icon: Activity,
      type: 'command',
      action: () => {
        onNavigate?.('focus');
        triggerFeedback('Starting secure 25m Pomodoro block');
      }
    },
    {
      id: 'act-evening-review',
      label: 'Start Evening Wind-Down Ritual',
      group: 'Actions',
      shortcut: 'R',
      icon: Moon,
      type: 'command',
      action: () => {
        onOpenEveningReview?.();
      }
    },
    {
      id: 'act-complete-top',
      label: 'Mark Top Task Complete',
      group: 'Actions',
      icon: Check,
      type: 'command',
      action: () => {
        triggerFeedback('Superb! Top task ticked complete');
      }
    },
    {
      id: 'act-export',
      label: 'Export Data (JSON)',
      group: 'Actions',
      icon: FileJson,
      type: 'command',
      action: () => {
        triggerFeedback('Workspace JSON packet downloaded');
      }
    },
    {
      id: 'act-theme-paper',
      label: 'Switch to Paper Theme',
      group: 'Actions',
      icon: Sun,
      type: 'command',
      action: () => {
        onThemeChange?.('paper');
        triggerFeedback('Applied Paper Light Theme');
      }
    },
    {
      id: 'act-theme-forest',
      label: 'Switch to Forest Theme',
      group: 'Actions',
      icon: TreeDeciduous,
      type: 'command',
      action: () => {
        onThemeChange?.('forest');
        triggerFeedback('Applied Deep Forest Green Theme');
      }
    },
    {
      id: 'act-theme-midnight',
      label: 'Switch to Midnight Theme',
      group: 'Actions',
      icon: Moon,
      type: 'command',
      action: () => {
        onThemeChange?.('midnight');
        triggerFeedback('Applied Midnight Dark Theme');
      }
    },
    {
      id: 'act-toggle-compact',
      label: 'Toggle Compact Sidebar',
      group: 'Actions',
      icon: Grid,
      type: 'command',
      action: () => {
        triggerFeedback('Configured layout to compact frame ratio');
      }
    },
    {
      id: 'act-gravity-sync',
      label: 'Trigger Gravity Sync',
      group: 'Actions',
      icon: Zap,
      type: 'command',
      action: () => {
        triggerFeedback('Recalibrated metrics and gravity ratings');
      }
    }
  ], [onNavigate, onThemeChange]);

  // Combined flat list matching search input query
  const filteredAndCategorizedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) {
      // Group items strictly as: Recents, Navigation, Actions
      const recentItems = commands.filter(c => c.group === 'Recent');
      const navigationItems = commands.filter(c => c.group === 'Navigation');
      const actionItems = commands.filter(c => c.group === 'Actions');
      
      return [
        { header: 'Recent', items: recentItems },
        { header: 'Navigation', items: navigationItems },
        { header: 'Actions', items: actionItems }
      ];
    } else {
      // 1. Matched Tasks
      const matchedTasks = taskData
        .filter(t => t.title.toLowerCase().includes(q))
        .map(t => ({
          id: `task-${t.id}`,
          label: t.title,
          group: 'Search Tasks' as const,
          energy: t.energy,
          date: t.date,
          completed: t.completed,
          type: 'task' as const,
          action: () => {
            triggerFeedback(`Selected task: "${t.title}"`);
          }
        }));

      // 2. Matched Commands (checks label/group and filters matching items)
      const matchedCommands = commands
        .filter(c => c.label.toLowerCase().includes(q))
        .map(c => ({
          ...c,
          id: `cmd-${c.id}`
        }));

      const results = [];
      if (matchedTasks.length > 0) {
        results.push({ header: 'Search Tasks', items: matchedTasks });
      }
      if (matchedCommands.length > 0) {
        results.push({ header: 'Command Matches', items: matchedCommands });
      }

      return results;
    }
  }, [searchQuery, commands]);

  // Flattened array representing the exact visible sequence for keyboard index tracking
  const flattenedItems = useMemo(() => {
    return filteredAndCategorizedItems.reduce<any[]>((acc, group) => {
      return [...acc, ...group.items];
    }, []);
  }, [filteredAndCategorizedItems]);

  // Reset highlight index when query updates
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Keyboard navigation event triggers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid interference if standard input components are focused elsewise, 
      // but inside our modal input, we capture arrow navigation.
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (flattenedItems.length === 0 ? 0 : (prev + 1) % flattenedItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (flattenedItems.length === 0 ? 0 : (prev - 1 + flattenedItems.length) % flattenedItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = flattenedItems[activeIndex];
        if (activeItem) {
          activeItem.action();
          onClose(); // Automatically dismiss palette upon action select
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flattenedItems, activeIndex, onClose]);

  // Focus input automatically on mount & opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Auto scroll into view for keyboard-navigated active element
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-black/65 backdrop-blur-[4px] cursor-default font-sans select-none overlay-backdrop-fade"
      onClick={onClose}
    >
      
      {/* CUSTOM ANIMATION & CSS RULES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .overlay-backdrop-fade {
          animation: backdropIn 0.15s ease-out forwards;
        }

        .palette-modal-zoom {
          animation: modalZoomIn 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .feedback-banner-slide {
          animation: feedbackSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalZoomIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes feedbackSlideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A2A2D;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3D3D42;
        }
      `}} />

      {/* CORE MODAL CHASSIS */}
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // Prevent close on modal inside click
        className="relative w-full max-w-[600px] bg-[#141416] border border-[#3D3D42] rounded-16 shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] mt-[10vh] md:mt-[15vh] overflow-hidden flex flex-col max-h-[480px] palette-modal-zoom"
      >
        
        {/* INTERACTION ACTION NOTIFICATION FEEDBACK TOAST */}
        {actionFeedback && (
          <div className="absolute top-[52px] left-0 right-0 z-[100] bg-[var(--tempo-accent-blue)] text-white text-[11px] font-mono px-4 py-2.5 flex items-center justify-between shadow-lg feedback-banner-slide border-b border-[#2A2A2D]">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
              <span className="font-bold">Command Executed:</span>
              <span>{actionFeedback}</span>
            </div>
            <span className="text-[9px] opacity-75">Instant Live Sync Enabled</span>
          </div>
        )}

        {/* SEARCH INPUT BAR */}
        <div className="h-[52px] w-full px-4 flex items-center gap-3 border-b border-[#2A2A1D]/70 shrink-0 bg-[#161618]">
          <LogoSm className="w-[18px] h-[18px] rounded shrink-0 shadow-sm" />
          <div className="w-[1px] h-3.5 bg-[#4A4A52]/40 shrink-0" />
          <Search className="w-[16px] h-[16px] text-[#4A4A52] shrink-0" />
          
          <input 
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actions, tasks, or navigate..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-sans text-white placeholder-[#8A8A90] w-full py-2"
          />

          {/* Escape Shortcut badge indicator */}
          <kbd className="px-2 py-0.5 rounded bg-[#1C1C1F] border border-[#2A2A2D] text-[10px] font-mono text-[#8A8A90] shadow-sm select-none">
            Esc
          </kbd>
        </div>

        {/* RESULTS SCROLLABLE LIST */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[390px] bg-[#141416]"
        >
          {filteredAndCategorizedItems.length > 0 ? (
            filteredAndCategorizedItems.map((group, groupIndex) => {
              // Calculate global base index start point for items in this group
              let prevItemsCount = 0;
              for (let i = 0; i < groupIndex; i++) {
                prevItemsCount += filteredAndCategorizedItems[i].items.length;
              }

              return (
                <div key={group.header} className="flex flex-col mb-4 last:mb-1">
                  
                  {/* GROUP HEADER TITLE */}
                  <div className="text-[10px] font-bold text-[#4A4A52] uppercase tracking-wider px-3 py-1.5 font-sans">
                    {group.header}
                  </div>

                  {/* GROUP CARD STACK RENDER */}
                  <div className="flex flex-col gap-[2px]">
                    {group.items.map((item, localIdx) => {
                      const globalIdx = prevItemsCount + localIdx;
                      const isActive = activeIndex === globalIdx;

                      // Resolve icons
                      const IconComponent = typeof item.icon === 'function' ? item.icon : null;

                      return (
                        <div
                          key={item.id}
                          data-active={isActive ? "true" : "false"}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          className={`h-[38px] px-3.5 rounded-8 flex items-center justify-between transition-all duration-100 cursor-pointer ${
                            isActive 
                              ? 'bg-[#1C1C1F] text-[#F1F1F1]' 
                              : 'text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-[#1C1C1F]'
                          }`}
                          style={{
                            borderLeft: isActive ? '2px solid var(--tempo-accent-blue)' : '2px solid transparent'
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            
                            {/* Left Side elements: Command vs Task type templates */}
                            {item.type === 'task' ? (
                              <div className="flex items-center gap-2">
                                {/* Energy Color Swatch Circle Dot */}
                                <span 
                                  className="w-[9px] h-[9px] rounded-full shrink-0 shadow-sm"
                                  style={{
                                    backgroundColor: 
                                      item.energy === 'deep' ? 'var(--color-deep, #8B5CF6)' :
                                      item.energy === 'light' ? 'var(--color-light, #60A5FA)' :
                                      item.energy === 'admin' ? 'var(--color-admin, #FBBF24)' :
                                      item.energy === 'creative' ? 'var(--color-creative, #FB7185)' : 'var(--color-social, #2DD4BF)'
                                  }}
                                />
                                <span className={`text-[11px] font-bold font-mono tracking-tighter shrink-0 px-1 bg-white/5 border border-white/10 rounded uppercase ${
                                  isActive ? 'text-white' : 'text-[#8A8A90]'
                                }`}>
                                  {item.energy}
                                </span>
                              </div>
                            ) : (
                              <span className="shrink-0 text-white/50">
                                {IconComponent ? (
                                  <IconComponent className="w-4 h-4" />
                                ) : (
                                  <ArrowRight className="w-3.5 h-3.5" />
                                )}
                              </span>
                            )}

                            {/* Label text */}
                            <span className="text-xs font-sans font-medium truncate text-[#F1F1F1]">
                              {item.label}
                            </span>
                          </div>

                          {/* Right Side meta badge descriptors: Shortcuts or Dates */}
                          {item.type === 'task' ? (
                            <span className="text-[10px] font-mono text-[#8A8A90] px-1.5 py-0.2 rounded border border-[#2A2A2D] bg-[#0E0E10]/55">
                              {item.date}
                            </span>
                          ) : (
                            item.shortcut && (
                              <kbd className="text-[10px] font-mono bg-[#0D0D0F] border border-[#2A2A2D] text-[#8A8A90] px-1.5 py-0.5 rounded shadow-sm">
                                {item.shortcut}
                              </kbd>
                            )
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-7 h-7 text-[#4A4A52] mb-3 animate-pulse" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-widest">No Matches Found</h3>
              <p className="text-[11px] text-[#8A8A90] max-w-xs mt-1 leading-relaxed">
                We couldn't locate actions or tasks fitting <span className="text-white font-bold">"{searchQuery}"</span>.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <footer className="h-9 px-4 border-t border-[#2A2A2D]/70 bg-[#0F0F11] flex items-center justify-center shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#4A4A52]">
            <span>↑↓ Navigate</span>
            <span className="opacity-40">•</span>
            <span>↵ Select</span>
            <span className="opacity-40">•</span>
            <span>Esc Close</span>
            <span className="opacity-40">•</span>
            <span>Ctrl+K Dismiss</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
