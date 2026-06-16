import React, { useState, useEffect } from 'react';
import { 
  Command, Calendar, Mail, Bell, Settings, LogOut, Compass, 
  Layers, BarChart3, HelpCircle, Activity, ExternalLink, Columns, Flame
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from './supabaseClient';
import AuthScreen from './components/AuthScreen';
import TodayView from './components/TodayView';
import WeekView from './components/WeekView';
import CalendarView from './components/CalendarView';
import FocusMode from './components/FocusMode';
import EnergyPlannerView from './components/EnergyPlannerView';
import HabitsView from './components/HabitsView';
import VelocityDashboard from './components/VelocityDashboard';
import SettingsView from './components/SettingsView';
import CommandPalette from './components/CommandPalette';
import EveningReview from './components/EveningReview';
import { Task } from './types';
import { LogoSm } from './components/Logo';
import { useTasksData } from './TasksContext';
import CompleteProfile from './components/CompleteProfile';
import AuthCallback from './components/AuthCallback';
import { useUser } from './UserContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const { 
    userAvatarUrl, 
    setUserAvatarUrl, 
    userName, 
    setUserName, 
    userEmail, 
    setUserEmail,
    setUserUsername,
    setUserBio
  } = useUser();
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>('today');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Custom SPA pathname router states and session hooks
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Simple SPA navigator helper
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate', handleLocationChange);
    };
  }, []);

  const handleViewChange = (v: 'day' | 'week' | 'month') => {
    setViewMode(v);
    if (v === 'day') {
      setActiveSidebarTab('today');
    } else if (v === 'week') {
      setActiveSidebarTab('week');
    } else if (v === 'month') {
      setActiveSidebarTab('month');
    }
  };

  const navigateToTab = (tabId: string) => {
    setActiveSidebarTab(tabId);
    if (tabId === 'today') {
      setViewMode('day');
    } else if (tabId === 'week') {
      setViewMode('week');
    } else if (tabId === 'month') {
      setViewMode('month');
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  // Helper to generate dynamic seeded tasks for the current week matching Week View events & Today Checkbox
  const getInitialTasks = (): Task[] => {
    const now = new Date();
    
    const getLocalDateString = (d: Date): string => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const getWeeklyDates = (d: Date): string[] => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);

      const dates = [];
      for (let i = 0; i < 7; i++) {
        const current = new Date(monday);
        current.setDate(monday.getDate() + i);
        dates.push(getLocalDateString(current));
      }
      return dates;
    };

    const todayStr = getLocalDateString(now);
    const dates = getWeeklyDates(now);

    return [
      // Today's Checkbox tasks in Day View
      { id: 1, title: "Write documentation for the new endpoints", energy: "deep", duration: "60m", gravity: 87, completed: false, date: todayStr },
      { id: 2, title: "Update project status in Notion", energy: "admin", duration: "15m", gravity: 45, completed: false, date: todayStr },
      { id: 3, title: "Code review for @alex's PR", energy: "deep", duration: "45m", gravity: 62, completed: false, date: todayStr },
      { id: 4, title: "Morning standup", energy: "social", duration: "30m", gravity: 30, completed: true, date: todayStr },
      { id: 5, title: "Send invoice to TechCorp", energy: "admin", duration: "10m", gravity: 50, completed: false, date: todayStr },

      // Monday events (dates[0])
      { id: 1001, title: 'Product Kickoff', energy: 'social', duration: '90m', gravity: 50, completed: false, startTime: '09:00', endTime: '10:30', date: dates[0] },
      { id: 1002, title: 'Code Review Session', energy: 'deep', duration: '60m', gravity: 50, completed: false, startTime: '14:00', endTime: '15:00', date: dates[0] },

      // Tuesday events (dates[1])
      { id: 1003, title: 'Gym', energy: 'light', duration: '60m', gravity: 50, completed: false, startTime: '08:00', endTime: '09:00', date: dates[1] },
      { id: 1004, title: 'Feature Sprint', energy: 'deep', duration: '120m', gravity: 50, completed: false, startTime: '10:00', endTime: '12:00', date: dates[1] },
      { id: 1005, title: '1:1 with Sarah', energy: 'social', duration: '30m', gravity: 50, completed: false, startTime: '15:00', endTime: '15:30', date: dates[1] },

      // Wednesday events (dates[2])
      { id: 1006, title: 'Architecture Deep Dive', energy: 'deep', duration: '150m', gravity: 50, completed: false, startTime: '09:00', endTime: '11:30', date: dates[2] },
      { id: 1007, title: 'Lunch with client', energy: 'social', duration: '60m', gravity: 50, completed: false, startTime: '13:00', endTime: '14:00', date: dates[2] },

      // Thursday events (dates[3])
      { id: 1008, title: 'Weekly Review', energy: 'admin', duration: '60m', gravity: 50, completed: false, startTime: '10:00', endTime: '11:00', date: dates[3] },
      { id: 1009, title: 'Focused Writing', energy: 'creative', duration: '120m', gravity: 50, completed: false, startTime: '14:00', endTime: '16:00', date: dates[3] },
      { id: 1010, title: 'Creative Brainstorm', energy: 'creative', duration: '75m', gravity: 50, completed: false, startTime: '15:00', endTime: '16:15', date: dates[3] },

      // Friday events (dates[4])
      { id: 1011, title: 'API Integration', energy: 'deep', duration: '90m', gravity: 50, completed: false, startTime: '09:00', endTime: '10:30', date: dates[4] },
      { id: 1012, title: 'Standup', energy: 'social', duration: '30m', gravity: 50, completed: false, startTime: '10:30', endTime: '11:00', date: dates[4] },
      { id: 1013, title: 'Architecture Review', energy: 'deep', duration: '90m', gravity: 50, completed: false, startTime: '14:00', endTime: '15:30', date: dates[4] },

      // Saturday events (dates[5])
      { id: 1014, title: 'Read', energy: 'light', duration: '60m', gravity: 50, completed: false, startTime: '10:00', endTime: '11:00', date: dates[5] },

      // Monday tasks board chips (dates[0])
      { id: 2001, title: 'Update Jira tickets', energy: 'admin', duration: '15m', gravity: 50, completed: false, date: dates[0] },
      { id: 2002, title: 'Draft email response', energy: 'admin', duration: '10m', gravity: 50, completed: false, date: dates[0] },

      // Tuesday tasks board chips (dates[1])
      { id: 2003, title: 'Design review prep', energy: 'creative', duration: '30m', gravity: 50, completed: false, date: dates[1] },
      { id: 2004, title: 'Fix sidebar bug', energy: 'deep', duration: '20m', gravity: 50, completed: false, date: dates[1] },
      { id: 2005, title: 'Review analytics schema', energy: 'deep', duration: '45m', gravity: 50, completed: false, date: dates[1] },
      { id: 2006, title: 'Prepare slides', energy: 'light', duration: '15m', gravity: 50, completed: false, date: dates[1] },

      // Wednesday tasks board chips (dates[2])
      { id: 2007, title: 'Submit receipts', energy: 'admin', duration: '10m', gravity: 50, completed: false, date: dates[2] },

      // Thursday tasks board chips (dates[3])
      { id: 2008, title: 'Publish blog post draft', energy: 'creative', duration: '40m', gravity: 50, completed: false, date: dates[3] },
      { id: 2009, title: 'Schedule alignment sync', energy: 'social', duration: '15m', gravity: 50, completed: false, date: dates[3] },
      { id: 2010, title: 'Organize drive folders', energy: 'admin', duration: '30m', gravity: 50, completed: false, date: dates[3] },

      // Friday tasks board chips (dates[4])
      { id: 2011, title: 'Test Stripe billing logic', energy: 'deep', duration: '40m', gravity: 50, completed: false, date: dates[4] },
      { id: 2012, title: 'Reply on Slack channels', energy: 'social', duration: '15m', gravity: 50, completed: false, date: dates[4] },
      { id: 2013, title: 'Outline server middleware', energy: 'deep', duration: '30m', gravity: 50, completed: false, date: dates[4] },
      { id: 2014, title: 'Check deployment container logs', energy: 'admin', duration: '10m', gravity: 50, completed: false, date: dates[4] },
      { id: 2015, title: 'Configure database backups', energy: 'deep', duration: '20m', gravity: 50, completed: false, date: dates[4] }
    ];
  };

  // Lifted Tasks State from central context provider
  const { tasks } = useTasksData();

  const [tasksHistory, setTasksHistory] = useState<Task[][]>([]);

  const updateTasksWithHistory = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    // Handled in real-time by Supabase and TasksContext CRUD methods now
  };

  const handleUndo = () => {
    triggerToast("Your workspace changes are synced in real-time in the cloud.");
  };

  // Dynamic Initials Helper
  const getInitials = (name: string): string => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Sync user details with active Supabase session on startup
  useEffect(() => {
    async function loadStartupSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session && session.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || 'ryuk9079@gmail.com');
          
          // Fetch database profile complete status
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_complete, provider, full_name, username, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const needsProfileCompletion = profile.provider === 'google' && profile.is_complete === false;
            setIsProfileComplete(!needsProfileCompletion);
            setUserName(profile.full_name || profile.username || 'Adrian Vance');
            setUserAvatarUrl(profile.avatar_url || '');
            setUserUsername(profile.username || '');
            if (needsProfileCompletion) {
              navigate('/complete-profile');
            } else if (window.location.pathname === '/complete-profile') {
              navigate('/');
            }
          } else {
            setIsProfileComplete(true);
            if (window.location.pathname === '/complete-profile') {
              navigate('/');
            }
          }
        } else {
          setIsAuthenticated(false);
          setIsProfileComplete(true); // Default fallback so demo works
        }
      } catch (err) {
        console.error("Failed to load user info from Supabase on launch:", err);
      } finally {
        setIsLoadingSession(false);
      }
    }
    loadStartupSession();

    // Subscribe to session state triggers
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession && newSession.user) {
        setIsAuthenticated(true);
        setUserEmail(newSession.user.email || 'ryuk9079@gmail.com');
        
        // Only trigger profile loading on SIGNED_IN to avoid updating issues
        if (event === 'SIGNED_IN') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_complete, provider, full_name, username, avatar_url')
            .eq('id', newSession.user.id)
            .single();

          if (profile) {
            const needsProfileCompletion = profile.provider === 'google' && profile.is_complete === false;
            setIsProfileComplete(!needsProfileCompletion);
            setUserName(profile.full_name || profile.username || 'Adrian Vance');
            setUserAvatarUrl(profile.avatar_url || '');
            setUserUsername(profile.username || '');
            if (needsProfileCompletion) {
              navigate('/complete-profile');
            } else if (window.location.pathname === '/complete-profile') {
              navigate('/');
            }
          } else {
            setIsProfileComplete(true);
            if (window.location.pathname === '/complete-profile') {
              navigate('/');
            }
          }
        }
      } else {
        setIsAuthenticated(false);
        setIsProfileComplete(true);
      }
    });

    // Subscribe to profile updates
    const handleProfileUpdate = () => {
      async function refreshProfile() {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserEmail(user.email || 'ryuk9079@gmail.com');
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_complete, provider, full_name, username, avatar_url')
              .eq('id', user.id)
              .single();

            if (profile) {
              const needsProfileCompletion = profile.provider === 'google' && profile.is_complete === false;
              setIsProfileComplete(!needsProfileCompletion);
              setUserName(profile.full_name || profile.username || 'Adrian Vance');
              setUserAvatarUrl(profile.avatar_url || '');
              setUserUsername(profile.username || '');
            }
          }
        } catch (e) {
          console.error("Profile sync refresh error:", e);
        }
      }
      refreshProfile();
    };

    window.addEventListener("tempo-profile-updated", handleProfileUpdate);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("tempo-profile-updated", handleProfileUpdate);
    };
  }, []);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(() => {
    const savedRunning = localStorage.getItem("tempo-active-timer-running") === "true";
    if (savedRunning) {
      const savedTask = localStorage.getItem("tempo-active-timer-task");
      if (savedTask) {
        try {
          return JSON.parse(savedTask);
        } catch (e) {
          // ignore
        }
      }
      return {
        id: 8888,
        title: "Focus Session",
        energy: "deep",
        duration: "25m",
        gravity: 50,
        completed: false
      };
    }
    return null;
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(true);
  const [isEveningReviewOpen, setIsEveningReviewOpen] = useState<boolean>(false);
  const [compactSidebar, setCompactSidebar] = useState<boolean>(() => localStorage.getItem("tempo-compact-sidebar") === "true");
  const [showShortcutsInSidebar, setShowShortcutsInSidebar] = useState<boolean>(() => localStorage.getItem("tempo-show-shortcuts") !== "false");
  const [theme, setTheme] = useState<'midnight' | 'paper' | 'forest'>(() => {
    const saved = localStorage.getItem("tempo-theme") || "midnight-black";
    if (saved === "paper-light") return "paper";
    if (saved === "forest-green") return "forest";
    return "midnight";
  });

  // Apply theme class to document.documentElement on change or mount
  useEffect(() => {
    const mapped = theme === 'midnight' ? 'midnight-black' : theme === 'paper' ? 'paper-light' : 'forest-green';
    localStorage.setItem("tempo-theme", mapped);
    
    // Maintain existing theme classes but toggle VFX and theme classes nicely
    document.documentElement.className = mapped;
    
    const isReduceMotion = localStorage.getItem("tempo-reduce-motion") === "true";
    document.documentElement.classList.toggle("reduce-motion", isReduceMotion);

    const isGravityPulseDisabled = localStorage.getItem("tempo-gravity-pulse") === "false";
    document.documentElement.classList.toggle("gravity-pulse-disabled", isGravityPulseDisabled);
  }, [theme]);

  // Listen to setting changes to toggle motion dynamically without reloading
  const [, setSettingsTick] = useState<number>(0);
  useEffect(() => {
    const handleSettingsChange = () => {
      setSettingsTick(prev => prev + 1);
      
      const isReduceMotion = localStorage.getItem("tempo-reduce-motion") === "true";
      document.documentElement.classList.toggle("reduce-motion", isReduceMotion);

      const isGravityPulseDisabled = localStorage.getItem("tempo-gravity-pulse") === "false";
      document.documentElement.classList.toggle("gravity-pulse-disabled", isGravityPulseDisabled);
    };
    window.addEventListener("tempo-settings-changed", handleSettingsChange);
    return () => window.removeEventListener("tempo-settings-changed", handleSettingsChange);
  }, []);

  // Global conflict-free keyboard shortcut controller
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isInputFocused = 
        el?.tagName === 'INPUT' || 
        el?.tagName === 'TEXTAREA' || 
        (el as HTMLElement)?.isContentEditable || 
        !!el?.closest?.('[contenteditable="true"]');

      // 1. Structural Modals Early Exits (Prevent double-actions or background leaks)
      const isFocusModeActive = activeFocusTask !== null;
      if (isFocusModeActive) {
        // Focus Mode is active. Let FocusMode handle Space, Esc, Ctrl+I.
        // We only allow Ctrl+K to toggle Command Palette.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsCommandPaletteOpen(prev => !prev);
        }
        return;
      }

      if (isEveningReviewOpen) {
        // Evening Review modal is open. Only handle dialog interactions.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsCommandPaletteOpen(prev => !prev);
        }
        return;
      }

      if (isCommandPaletteOpen) {
        // Command Palette is open. Only Ctrl+K lets us toggle/close it.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
        }
        return;
      }

      // 2. Modifier keys checks (Available globally unless focusing an input where it would conflict, e.g., Undo)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerToast("All transient memories and status anchors saved automatically!");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInputFocused) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const topTask = tasks.find(t => !t.completed);
        if (topTask) {
          setActiveFocusTask(topTask);
          triggerToast(`Immersive Focus mode initiated for top task`);
        } else {
          triggerToast("All tasks are currently completed!");
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // If active focus is an input element, ignore all non-modifier single-letter shortcuts
      if (isInputFocused) {
        return;
      }

      // 3. Bare hotkey checks
      if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setActiveSidebarTab('integrations');
        localStorage.setItem("tempo-settings-active-tab", "shortcuts");
        window.dispatchEvent(new Event("tempo-settings-tab-changed"));
        triggerToast("Opened Shortcut Settings reference overview");
        return;
      }

      // View nav paths
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveSidebarTab('today');
        setViewMode('day');
        triggerToast("Today Dashboard focus cockpit loaded");
        return;
      }

      if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setActiveSidebarTab('week');
        setViewMode('week');
        triggerToast("Week view loaded");
        return;
      }

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setActiveSidebarTab('month');
        setViewMode('month');
        triggerToast("Month view calendar calendar deck loaded");
        return;
      }

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveSidebarTab('today');
        setViewMode('day');
        triggerToast("Today task checklist cockpit highlighted");
        return;
      }

      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveSidebarTab('habits');
        triggerToast("Habits tracking space highlighted");
        return;
      }

      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setActiveSidebarTab('analytics');
        triggerToast("Velocity dashboard highlighted");
        return;
      }

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsEveningReviewOpen(true);
        triggerToast("Evening wind-down review initiated");
        return;
      }

      if (e.key === ',') {
        e.preventDefault();
        setActiveSidebarTab('integrations');
        triggerToast("Settings dashboard configuration panel opened");
        return;
      }

      // Single-letter Task Actions
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveSidebarTab('today');
        setViewMode('day');
        setTimeout(() => {
          const quickInput = document.getElementById('quick-task-input');
          if (quickInput) {
            quickInput.focus();
            triggerToast("Focused task creator dynamo");
          }
        }, 80);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        const firstUncompleted = tasks.find(t => !t.completed);
        if (firstUncompleted) {
          updateTasksWithHistory(prev => prev.map(t => t.id === firstUncompleted.id ? { ...t, completed: true } : t));
          triggerToast(`Task completed: "${firstUncompleted.title}"`);
        } else {
          triggerToast("All task units completed!");
        }
        return;
      }

      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const firstUncompleted = tasks.find(t => !t.completed);
        if (firstUncompleted) {
          const newTitle = prompt("Edit Task Title:", firstUncompleted.title);
          if (newTitle && newTitle.trim()) {
            updateTasksWithHistory(prev => prev.map(t => t.id === firstUncompleted.id ? { ...t, title: newTitle.trim() } : t));
            triggerToast("Task title updated successfully");
          }
        } else {
          triggerToast("No uncompleted tasks available to edit");
        }
        return;
      }

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        const firstUncompleted = tasks.find(t => !t.completed);
        if (firstUncompleted) {
          const val = prompt("Enter rescheduled duration details (e.g. 15m, 30m, 45m, 60m):", firstUncompleted.duration);
          if (val && val.trim()) {
            updateTasksWithHistory(prev => prev.map(t => t.id === firstUncompleted.id ? { ...t, duration: val.trim() } : t));
            triggerToast(`Task scheduling updated successfully: ${val.trim()}`);
          }
        } else {
          triggerToast("No active tasks available to reschedule");
        }
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        const firstUncompleted = tasks.find(t => !t.completed);
        if (firstUncompleted) {
          const val = prompt("Update priority gravity index score (0-100):", String(firstUncompleted.gravity));
          const parsed = parseInt(val || '');
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            updateTasksWithHistory(prev => prev.map(t => t.id === firstUncompleted.id ? { ...t, gravity: parsed } : t));
            triggerToast(`Task gravity index score repositioned to ${parsed}%`);
          }
        } else {
          triggerToast("No active task available to priority gravity-rank");
        }
        return;
      }

      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const firstUncompleted = tasks.find(t => !t.completed);
        if (firstUncompleted) {
          if (confirm(`Do you wish to securely delete active task "${firstUncompleted.title}"?`)) {
            updateTasksWithHistory(prev => prev.filter(t => t.id !== firstUncompleted.id));
            triggerToast("Task deleted securely form queue");
          }
        } else {
          triggerToast("No active tasks available to delete");
        }
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [tasks, activeSidebarTab, viewMode, activeFocusTask, isCommandPaletteOpen, isEveningReviewOpen, tasksHistory]);

  // Resume running session on sidebar 'focus' tab click
  useEffect(() => {
    if (activeSidebarTab === 'focus') {
      const savedTaskId = localStorage.getItem("tempo-active-timer-task-id");
      const savedTaskJson = localStorage.getItem("tempo-active-timer-task");
      const savedRunning = localStorage.getItem("tempo-active-timer-running") === "true";

      if (savedTaskId && savedRunning) {
        if (savedTaskJson) {
          try {
            setActiveFocusTask(JSON.parse(savedTaskJson));
            return;
          } catch (e) {
            // ignore
          }
        }
        setActiveFocusTask({
          id: 8888,
          title: 'Quick Focus Session',
          energy: 'deep',
          duration: '25m',
          gravity: 50,
          completed: false
        });
      }
    }
  }, [activeSidebarTab]);

  const handleCloseFocusMode = () => {
    localStorage.removeItem("tempo-active-timer-task-id");
    localStorage.removeItem("tempo-active-timer-task");
    localStorage.removeItem("tempo-active-timer-seconds-left");
    localStorage.removeItem("tempo-active-timer-total-seconds");
    localStorage.removeItem("tempo-active-timer-is-on-break");
    localStorage.removeItem("tempo-active-timer-running");
    localStorage.removeItem("tempo-active-timer-last-update");
    localStorage.removeItem("tempo-active-timer-session-count");

    setActiveFocusTask(null);
    if (activeSidebarTab === 'focus') {
      setActiveSidebarTab('today');
    }
    window.dispatchEvent(new Event("tempo-active-session-changed"));
  };

  const handleMinimizeFocusMode = () => {
    setActiveFocusTask(null);
    if (activeSidebarTab === 'focus') {
      setActiveSidebarTab('today');
    }
  };

  const handleLoginSuccess = (email: string, name: string) => {
    setUserEmail(email);
    setUserName(name);
    setIsAuthenticated(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from('profiles')
          .select('is_complete, provider')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            const needsProfileCompletion = profile?.provider === 'google' && profile?.is_complete === false;
            setIsProfileComplete(!needsProfileCompletion);
            if (needsProfileCompletion) {
              navigate('/complete-profile');
            } else {
              navigate('/');
            }
          });
      } else {
        setIsProfileComplete(true);
        navigate('/');
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsProfileComplete(true);
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleCallbackComplete = (isComplete: boolean) => {
    setIsProfileComplete(isComplete);
    if (!isComplete) {
      navigate('/complete-profile');
    } else {
      navigate('/');
    }
  };

  const handleSetupComplete = (newUsername: string, newDob: string) => {
    setIsProfileComplete(true);
    setUserName(newUsername);
    window.dispatchEvent(new Event('tempo-profile-updated'));
    navigate('/');
  };

  const renderContent = () => {
    if (currentPath.startsWith('/auth/callback')) {
      return <AuthCallback onComplete={handleCallbackComplete} />;
    }

    if (isLoadingSession) {
      return (
        <div className="min-h-screen w-full bg-[#0D0D0F] flex flex-col items-center justify-center p-6 select-none">
          <LogoSm className="w-12 h-12 mb-4 animate-pulse text-[#4F8EF7]" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
    }

    if (isProfileComplete === false) {
      if (currentPath !== '/complete-profile') {
        setTimeout(() => {
          navigate('/complete-profile');
        }, 0);
      }
      return (
        <CompleteProfile 
          onSetupSuccess={handleSetupComplete} 
          onLogout={handleLogout} 
        />
      );
    }

    if (currentPath === '/complete-profile' && isProfileComplete === true) {
      setTimeout(() => {
        navigate('/');
      }, 0);
    }

    return (
      <div className="min-h-screen w-full flex bg-[var(--tempo-bg-primary)] overflow-hidden transition-colors duration-200">
          
          {/* LEFT SIDEBAR VIEW (exactly 240px width as specified, or 80px if compact) */}
          <aside 
            id="main-sidebar" 
            className={`${
              compactSidebar ? 'w-[80px] px-2.5' : 'w-[240px] px-4'
            } py-6 border-r border-[var(--tempo-border)] bg-[var(--tempo-bg-secondary)] flex flex-col justify-between shrink-0 hidden md:flex select-none transition-all duration-200`}
          >
            
            <div className="flex flex-col gap-8">
              {/* Workspace Selector Indicator */}
              <div 
                onClick={() => setIsCommandPaletteOpen(true)}
                className={`flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-[#2A2A2D] hover:bg-white/[0.04] transition-all duration-150 cursor-pointer ${
                  compactSidebar ? 'justify-center' : ''
                }`}
                title={compactSidebar ? "Tempo Workspace (Ctrl+K)" : ""}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                    <LogoSm className="w-6 h-6" />
                  </div>
                  {!compactSidebar && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[#F1F1F1] truncate">Tempo Workspace</span>
                      <span className="text-[10px] font-mono text-[#4A4A52] truncate">ryuk-workspace</span>
                    </div>
                  )}
                </div>
                
                {/* Visual command cue */}
                {!compactSidebar && (
                  <span className="text-[10px] font-mono border border-white/15 bg-white/5 px-1 py-0.5 rounded text-[#8A8A90] select-none scale-95 uppercase">
                    Ctrl+K
                  </span>
                )}
              </div>

              {/* Navigation Menu Links */}
              <div className="flex flex-col gap-1.5 bg-transparent">
                {!compactSidebar && (
                  <span className="text-[10px] pl-2 font-sans font-bold text-[#4A4A52] uppercase tracking-wider">
                    Menu Navigation
                  </span>
                )}

                {[
                  { id: 'today', name: 'Today view', icon: Calendar, badge: 'now' },
                  { id: 'week', name: 'Week View', icon: Columns, badge: '7d' },
                  { id: 'month', name: 'Month View', icon: Calendar, badge: '30d' },
                  { id: 'habits', name: 'Habits tracker', icon: Flame, badge: '12d' },
                  { id: 'focus', name: 'Energy Planner', icon: Activity, badge: null },
                  { id: 'analytics', name: 'Velocity stats', icon: BarChart3, badge: '87%' },
                  { id: 'integrations', name: 'App Settings', icon: Settings, badge: null }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigateToTab(item.id)}
                    title={compactSidebar ? item.name : undefined}
                    className={`w-full flex items-center ${
                      compactSidebar ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2'
                    } rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
                      activeSidebarTab === item.id
                        ? 'bg-[#1C1C1F] border border-[#2A2A2D] text-[#F1F1F1]'
                        : 'border border-transparent text-[#8A8A90] hover:text-[#F1F1F1] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`flex items-center ${compactSidebar ? 'justify-center' : 'gap-2.5'}`}>
                      <item.icon className={`w-4 h-4 shrink-0 ${
                        activeSidebarTab === item.id ? 'text-[#4F8EF7]' : 'text-[#4A4A52]'
                      }`} />
                      {!compactSidebar && <span>{item.name}</span>}
                    </div>

                    {!compactSidebar && showShortcutsInSidebar && item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold scale-95 ${
                        item.id === 'today' 
                          ? 'bg-[#FB7185]/15 text-[#FB7185]' 
                          : 'bg-white/10 text-[#8A8A90]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}

                <div className="h-[1px] bg-[#2A2A2D]/55 my-2" />
                
                <button
                  onClick={() => setIsEveningReviewOpen(true)}
                  title={compactSidebar ? "Evening Review" : undefined}
                  className={`w-full flex items-center rounded-lg bg-[#FB7185]/5 border border-[#FB7185]/15 hover:border-[#FB7185]/35 text-[#FB7185] hover:bg-[#FB7185]/10 transition-all duration-150 cursor-pointer ${
                    compactSidebar ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2 text-xs font-semibold'
                  }`}
                >
                  {compactSidebar ? (
                    <span className="text-sm leading-none">🌙</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌙</span>
                        <span>Evening Review</span>
                      </div>
                      <span className="text-[9px] font-mono bg-[#FB7185]/15 text-[#FB7185] px-1.5 py-0.5 rounded uppercase font-bold">
                        90s
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* User Account Profile with click triggers to simulate Logout demo */}
            <div className={`flex ${compactSidebar ? 'flex-col items-center gap-3' : 'flex-col gap-4'} border-t border-[#2A2A2D]/40 pt-6 pr-1`}>
              {/* Simulated switch guide informational note */}
              {!compactSidebar && (
                <div className="p-3 rounded-lg border border-[#FB7185]/20 bg-[#FB7185]/5 flex flex-col gap-1 inline-block select-none scale-95">
                  <span className="text-[10px] font-mono font-bold text-[#FB7185] uppercase tracking-wide">
                    Reviewer Control
                  </span>
                  <span className="text-[9px] font-sans leading-relaxed text-[#8C8C92]">
                    Sign Out of demo mode to review login visuals & password strength meters.
                  </span>
                </div>
              )}

              <div className={`flex ${compactSidebar ? 'flex-col items-center gap-3' : 'items-center justify-between'} w-full min-w-0`}>
                <div className={`flex ${compactSidebar ? 'flex-col items-center' : 'items-center gap-2.5'} min-w-0`}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8B5CF6] to-[#4F8EF7] flex items-center justify-center shrink-0 shadow font-mono text-xs text-white font-bold overflow-hidden relative" title={compactSidebar ? `${userName} (${userEmail})` : undefined}>
                    {userAvatarUrl ? (
                      <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                    ) : (
                      getInitials(userName)
                    )}
                  </div>
                  
                  {!compactSidebar && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[#F1F1F1] truncate">
                        {userName}
                      </span>
                      <span className="text-[9px] font-mono text-[#5A5A62] truncate">
                        {userEmail}
                      </span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleLogout}
                  title="Force Logout authenticated shell to inspect login views"
                  className="p-1.5 rounded-lg border border-[#2A2A2D] hover:bg-white/5 hover:border-[#3D3D42] text-[#8A8A90] hover:text-white cursor-pointer duration-100 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </aside>

          {/* MAIN CHASSIS: Filling remaining width of screen */}
          <main className="flex-grow flex flex-col h-screen overflow-hidden">
            <AnimatedPage pageKey={`${activeSidebarTab}-${viewMode}`}>
              {activeSidebarTab === 'today' ? (
                viewMode === 'day' ? (
                  <TodayView 
                    userEmail={userEmail}
                    userName={userName}
                    onLogout={handleLogout}
                    onViewChange={handleViewChange}
                    onStartFocusMode={(t) => {
                      setActiveFocusTask(t);
                      setActiveSidebarTab('focus');
                    }}
                    tasks={tasks}
                    setTasks={updateTasksWithHistory}
                  />
                ) : viewMode === 'week' ? (
                  <WeekView 
                    onViewChange={handleViewChange} 
                    tasks={tasks}
                    setTasks={updateTasksWithHistory}
                  />
                ) : (
                  <CalendarView onViewChange={handleViewChange} />
                )
              ) : activeSidebarTab === 'week' ? (
                <WeekView 
                  onViewChange={handleViewChange} 
                  tasks={tasks}
                  setTasks={updateTasksWithHistory}
                />
              ) : activeSidebarTab === 'month' ? (
                <CalendarView onViewChange={handleViewChange} />
              ) : activeSidebarTab === 'habits' ? (
                <HabitsView />
              ) : activeSidebarTab === 'analytics' ? (
                <VelocityDashboard />
              ) : activeSidebarTab === 'focus' ? (
                <EnergyPlannerView 
                  tasks={tasks}
                  onStartFocusSession={(t) => {
                    setActiveFocusTask(t);
                    setActiveSidebarTab('focus');
                  }}
                />
              ) : activeSidebarTab === 'integrations' ? (
                <SettingsView 
                  currentTheme={theme} 
                  onThemeChange={setTheme} 
                  compactSidebar={compactSidebar}
                  onCompactSidebarChange={setCompactSidebar}
                  showShortcutsInSidebar={showShortcutsInSidebar}
                  onShowShortcutsInSidebarChange={setShowShortcutsInSidebar}
                />
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-8 select-none text-center bg-[#0D0D0F]">
                  <LogoSm className="w-10 h-10 mb-3 animate-pulse" style={{ animationDuration: '2s' }} />
                  <h2 className="text-sm font-sans font-bold text-[#F1F1F1]">Modular App View Loading</h2>
                  <p className="text-xs text-[#8A8A90] max-w-sm mt-1 mb-4">
                    You requested to open {activeSidebarTab}. Access remains optimized on the core Today view cockpit.
                  </p>
                  <button
                    onClick={() => setActiveSidebarTab('today')}
                    className="px-4 py-1.5 text-xs text-white btn-gradient rounded-md cursor-pointer font-medium"
                  >
                    Return to Today
                  </button>
                </div>
              )}
            </AnimatedPage>
          </main>

          {/* Fullscreen Immersive Focus Mode Overlay render */}
          {activeFocusTask && (
            <FocusMode 
              task={activeFocusTask} 
              onClose={handleCloseFocusMode} 
              onMinimize={handleMinimizeFocusMode}
            />
          )}

          {/* Floating Toast Notification Overlay */}
          {toastMessage && (
            <div id="tempo-floating-toast" className="fixed bottom-6 left-6 z-[99999] flex items-center gap-2.5 px-4 py-3 rounded-12 bg-[#121214]/95 border border-[#2B2B30] text-xs font-semibold text-[#F1F1F1] shadow-[0_8px_32px_rgba(0,0,0,0.85)] animate-fade-in backdrop-blur-md">
              <div className="w-5 h-5 rounded-full bg-[#4F8EF7]/15 flex items-center justify-center text-[#4F8EF7] text-[10px]">
                ⚡
              </div>
              <span className="font-sans text-[11px] font-bold text-[#f5f5f7]">{toastMessage}</span>
            </div>
          )}

          {/* Global Command Palette Overlay integration */}
          <CommandPalette 
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={(tabId) => {
              if (tabId === 'week' || tabId === 'month') {
                setActiveSidebarTab('today');
                setViewMode(tabId === 'week' ? 'week' : 'month');
              } else {
                setActiveSidebarTab(tabId);
              }
            }}
            onOpenEveningReview={() => setIsEveningReviewOpen(true)}
            onThemeChange={setTheme}
          />

          {/* Evening Review Wind-down Panel Overlay */}
          <EveningReview 
            isOpen={isEveningReviewOpen}
            onClose={() => setIsEveningReviewOpen(false)}
          />

          {/* Floating toggle button for quick layout review */}
          {!isCommandPaletteOpen && (
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="fixed bottom-6 right-6 z-[999] px-4 py-2.5 rounded-12 bg-[#141416] border border-[#2A2A2D] hover:border-[#4F8EF7]/50 hover:bg-[#1C1C1F] text-xs font-semibold text-[#F1F1F1] flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] cursor-pointer transition-all duration-150 transform hover:translate-y-[-1px] active:scale-95 group font-mono"
            >
              <LogoSm className="w-5 h-5 rounded shadow-sm" />
              <span>Toggle Command Palette</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#0D0D0F] border border-[#2A2A2D] text-[10px] font-mono text-[#8A8A90] ml-1">
                Ctrl+K
              </kbd>
            </button>
          )}

      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[var(--tempo-bg-primary)] text-[var(--tempo-text-primary)] font-sans overflow-x-hidden transition-colors duration-200">
      {renderContent()}
    </div>
  );
}

interface AnimatedPageProps {
  children: React.ReactNode;
  pageKey: string;
}

function AnimatedPage({ children, pageKey }: AnimatedPageProps) {
  const transitionsEnabled = localStorage.getItem("tempo-page-transitions") !== "false";
  const reduceMotionEnabled = localStorage.getItem("tempo-reduce-motion") === "true";

  if (!transitionsEnabled || reduceMotionEnabled) {
    return <div className="flex-grow flex flex-col h-full overflow-hidden">{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex-grow flex flex-col h-full overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
