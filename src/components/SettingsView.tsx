import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Bell, Keyboard, Palette, Calendar, Timer, Bot, Lock, Database, 
  CreditCard, Check, Search, Plus, Sparkles, Sliders, Volume2, ShieldAlert, 
  Download, Upload, RefreshCw, Smartphone, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import EngineeredToggle from './EngineeredToggle';

// Define the interface for keyboard shortcuts
interface ShortcutRow {
  key: string;
  desc: string;
  category: 'Navigation' | 'Tasks' | 'Focus' | 'General';
}

interface SettingsViewProps {
  currentTheme?: 'midnight' | 'paper' | 'forest';
  onThemeChange?: (themeName: 'midnight' | 'paper' | 'forest') => void;
  compactSidebar?: boolean;
  onCompactSidebarChange?: (value: boolean) => void;
  showShortcutsInSidebar?: boolean;
  onShowShortcutsInSidebarChange?: (value: boolean) => void;
}

export default function SettingsView({ 
  currentTheme, 
  onThemeChange,
  compactSidebar: propCompactSidebar,
  onCompactSidebarChange,
  showShortcutsInSidebar: propShowShortcuts,
  onShowShortcutsInSidebarChange
}: SettingsViewProps = {}) {
  // 1. ACTIVE SIDEBAR CATEGORY TAB STATE
  const [activeTab, setActiveTabState] = useState<string>(() => localStorage.getItem("tempo-settings-active-tab") || 'appearance');

  const setActiveTab = (tab: string) => {
    localStorage.setItem("tempo-settings-active-tab", tab);
    setActiveTabState(tab);
  };

  useEffect(() => {
    const handleTabChange = () => {
      const saved = localStorage.getItem("tempo-settings-active-tab");
      if (saved) {
        setActiveTabState(saved);
      }
    };
    window.addEventListener("tempo-settings-tab-changed", handleTabChange);
    return () => window.removeEventListener("tempo-settings-tab-changed", handleTabChange);
  }, []);

  // 2. APPEARANCE STATES
  const [localTheme, setLocalTheme] = useState<'midnight' | 'paper' | 'forest'>(() => {
    const saved = localStorage.getItem("tempo-theme") || "midnight-black";
    if (saved === "paper-light") return "paper";
    if (saved === "forest-green") return "forest";
    return "midnight";
  });
  const activeTheme = currentTheme || localTheme;

  const setActiveTheme = (themeValue: 'midnight' | 'paper' | 'forest') => {
    setLocalTheme(themeValue);
    if (onThemeChange) {
      onThemeChange(themeValue);
    } else {
      const mapped = themeValue === 'midnight' ? 'midnight-black' : themeValue === 'paper' ? 'paper-light' : 'forest-green';
      localStorage.setItem("tempo-theme", mapped);
      document.documentElement.className = mapped;
    }
  };

  const [activeAccent, setActiveAccent] = useState<string>(() => localStorage.getItem("tempo-accent-color") || '#3b82f6'); // Default Blue
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xl'>(() => (localStorage.getItem("tempo-font-scale") as 'small' | 'medium' | 'large' | 'xl') || 'medium');
  
  // Sidebar toggles
  const [localCompactSidebar, setLocalCompactSidebar] = useState<boolean>(() => localStorage.getItem("tempo-compact-sidebar") === "true");
  const [localShowShortcuts, setLocalShowShortcuts] = useState<boolean>(() => localStorage.getItem("tempo-show-shortcuts") !== "false");

  const compactSidebar = propCompactSidebar !== undefined ? propCompactSidebar : localCompactSidebar;
  const showShortcutsInSidebar = propShowShortcuts !== undefined ? propShowShortcuts : localShowShortcuts;

  const setCompactSidebar = (value: boolean) => {
    localStorage.setItem("tempo-compact-sidebar", String(value));
    if (onCompactSidebarChange) {
      onCompactSidebarChange(value);
    } else {
      setLocalCompactSidebar(value);
    }
  };

  const setShowShortcutsInSidebar = (value: boolean) => {
    localStorage.setItem("tempo-show-shortcuts", String(value));
    if (onShowShortcutsInSidebarChange) {
      onShowShortcutsInSidebarChange(value);
    } else {
      setLocalShowShortcuts(value);
    }
  };

  // Live Energy Colors
  const [energyColors, setEnergyColors] = useState(() => {
    const saved = localStorage.getItem("tempo-category-colors");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          deep: parsed.deep || '#8B5CF6',
          light: parsed.light || '#60A5FA',
          admin: parsed.admin || '#FBBF24',
          creative: parsed.creative || '#FB7185',
          social: parsed.social || '#2DD4BF'
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      deep: '#8B5CF6',
      light: '#60A5FA',
      admin: '#FBBF24',
      creative: '#FB7185',
      social: '#2DD4BF'
    };
  });

  const [colorErrors, setColorErrors] = useState<Record<string, string>>({});

  const handleColorChange = (key: 'deep' | 'light' | 'admin' | 'creative' | 'social', value: string) => {
    console.log("Color changed:", value);
    setEnergyColors(prev => {
      const updated = { ...prev, [key]: value };
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      if (hexRegex.test(value)) {
        setColorErrors(errs => {
          const next = { ...errs };
          delete next[key];
          return next;
        });
        localStorage.setItem("tempo-category-colors", JSON.stringify(updated));
        document.documentElement.style.setProperty(`--color-${key}`, value);
      } else {
        setColorErrors(errs => ({ ...errs, [key]: "Format requirement: #RRGGBB" }));
      }
      return updated;
    });
  };

  // Interface Animation toggle states
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => localStorage.getItem("tempo-reduce-motion") === "true");
  const [gravityPulse, setGravityPulse] = useState<boolean>(() => localStorage.getItem("tempo-gravity-pulse") !== "false");
  const [pageTransitions, setPageTransitions] = useState<boolean>(() => localStorage.getItem("tempo-page-transitions") !== "false");

  // 3. PROFILE STATES
  const [profileName, setProfileName] = useState<string>('Ahmed Mohamed');
  const [profileEmail, setProfileEmail] = useState<string>('ahmed.m@tempo.io');
  const [profileUsername, setProfileUsername] = useState<string>('ahmedm');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [profileBio, setProfileBio] = useState<string>('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string>('');

  // Extended Profile Settings state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Initials generator
  const getInitials = (name: string): string => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Fetch real authenticated user profile details from Supabase on mount
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setProfileEmail(user.email);
          
          // Fetch from database profiles table
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio')
            .eq('id', user.id)
            .single();

          if (!profileErr && profileData) {
            if (profileData.full_name) setProfileName(profileData.full_name);
            if (profileData.username) setProfileUsername(profileData.username);
            setProfileBio(profileData.bio || "");
            if (profileData.avatar_url) setProfileAvatarUrl(profileData.avatar_url);
          } else {
            // Fallback to auth metadata if profile entry not found or error
            const meta = user.user_metadata || {};
            if (meta.full_name) setProfileName(meta.full_name);
            if (meta.username) setProfileUsername(meta.username);
            setProfileBio(meta.bio || "");
            if (meta.avatar_url) setProfileAvatarUrl(meta.avatar_url);
          }
        }
      } catch (err) {
        console.error("Failed to load user info from Supabase:", err);
      }
    }
    loadUserProfile();
  }, []);

  // Inline validator for Username input change
  const handleUsernameChange = (val: string) => {
    setProfileUsername(val);
    const trimmed = val.trim();
    if (trimmed.length > 0) {
      if (trimmed.length < 3 || trimmed.length > 20) {
        setProfileErrors(prev => ({ ...prev, username: "Username must be between 3 and 20 characters" }));
      } else if (!/^[a-z0-9_]+$/.test(trimmed)) {
        setProfileErrors(prev => ({ ...prev, username: "Username can only contain lowercase letters, numbers, and underscores" }));
      } else {
        setProfileErrors(prev => {
          const updated = { ...prev };
          delete updated.username;
          return updated;
        });
      }
    } else {
      setProfileErrors(prev => ({ ...prev, username: "Username is required" }));
    }
  };

  // Avatar Image Upload utilizing Supabase Storage
  const uploadAvatar = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user session.");
      }

      setIsUploading(true);
      setUploadProgress(10);
      setProfileErrors(prev => {
        const updated = { ...prev };
        delete updated.avatar;
        return updated;
      });

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      setUploadProgress(40);

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        if (uploadError.message.includes("Object not found") || uploadError.message.toLowerCase().includes("bucket")) {
          try {
            await supabase.storage.createBucket('avatars', { public: true });
            const { data: retryData, error: retryError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file, { cacheControl: '3600', upsert: true });
            if (retryError) throw retryError;
          } catch (bucketErr: any) {
            throw new Error("Could not write to Supabase Storage bucket. Please check storage bucket policies or create an 'avatars' bucket.");
          }
        } else {
          throw uploadError;
        }
      }

      setUploadProgress(80);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileAvatarUrl(publicUrl);
      setUploadProgress(100);

      // Trigger custom settings save representation
      triggerSaveNotification("Avatar uploaded successfully!");
      window.dispatchEvent(new Event("tempo-profile-updated"));

      setTimeout(() => setUploadProgress(0), 1200);
    } catch (err: any) {
      console.error("Avatar upload error, falling back:", err);
      try {
        // Fallback: convert to base64 for local persistence preview inside metadata if bucket doesn't support public write
        setUploadProgress(50);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64Str = reader.result as string;
          setProfileAvatarUrl(base64Str);
          setUploadProgress(100);
          triggerSaveNotification("Avatar updated!");
          window.dispatchEvent(new Event("tempo-profile-updated"));
          setTimeout(() => setUploadProgress(0), 1000);
        };
      } catch (fe) {
        setProfileErrors(prev => ({ ...prev, avatar: err.message || "Failed to upload avatar" }));
        setUploadProgress(0);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Custom Profile Save logic with validation
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setProfileErrors({});

    const errs: Record<string, string> = {};
    const trimmedName = profileName.trim();
    const trimmedUsername = profileUsername.trim();

    // Full name validation
    if (!trimmedName) {
      errs.fullName = "Full name is required";
    } else if (trimmedName.length < 2) {
      errs.fullName = "Full name must be at least 2 characters";
    } else if (trimmedName.length > 50) {
      errs.fullName = "Full name must not exceed 50 characters";
    }

    // Username validation
    if (!trimmedUsername) {
      errs.username = "Username is required";
    } else if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      errs.username = "Username must be between 3 and 20 characters";
    } else if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      errs.username = "Username can only contain lowercase letters, numbers, and underscores";
    }

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      setIsSaving(false);
      return;
    }

    try {
      setProfileName(trimmedName);
      setProfileUsername(trimmedUsername);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user session.");
      }

      // Update Supabase Auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          username: trimmedUsername,
          bio: profileBio.trim() || null,
          avatar_url: profileAvatarUrl,
        }
      });

      if (authError) throw authError;

      // Update DB profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          bio: profileBio.trim() || null,
          full_name: trimmedName,
          username: trimmedUsername,
          avatar_url: profileAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      triggerSaveNotification("Profile updated successfully!");
      window.dispatchEvent(new Event("tempo-profile-updated"));
    } catch (err: any) {
      console.error("Save profile error:", err);
      setProfileErrors({ save: err.message || "Could not save profile metadata." });
    } finally {
      setIsSaving(false);
    }
  };

  // 4. NOTIFICATION STATES
  const [notificationEmailToday, setNotificationEmailToday] = useState<boolean>(true);
  const [notificationEmailWeek, setNotificationEmailWeek] = useState<boolean>(true);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(true);
  const [notificationBrowserAlerts, setNotificationBrowserAlerts] = useState<boolean>(false);
  const [notificationDigestTime, setNotificationDigestTime] = useState<string>('08:00');

  // 5. CALENDAR & SYNC STATES
  const [gcalConnected, setGcalConnected] = useState<boolean>(true);
  const [icalConnected, setIcalConnected] = useState<boolean>(false);
  const [syncInterval, setSyncInterval] = useState<string>('15'); // 15 mins
  const [autoBlockTime, setAutoBlockTime] = useState<boolean>(true);

  // 6. FOCUS & TIMER STATES
  const [pomoWorkTime, setPomoWorkTime] = useState<number>(() => {
    const saved = localStorage.getItem("tempo-pomo-work-time");
    return saved ? parseInt(saved) || 25 : 25;
  });
  const [pomoShortBreak, setPomoShortBreak] = useState<number>(() => {
    const saved = localStorage.getItem("tempo-pomo-short-break");
    return saved ? parseInt(saved) || 5 : 5;
  });
  const [pomoLongBreak, setPomoLongBreak] = useState<number>(() => {
    const saved = localStorage.getItem("tempo-pomo-long-break");
    return saved ? parseInt(saved) || 15 : 15;
  });
  const [pomoTargetDaily, setPomoTargetDaily] = useState<number>(() => {
    const saved = localStorage.getItem("tempo-pomo-target-daily");
    return saved ? parseInt(saved) || 8 : 8;
  });

  const handlePomoWorkChange = (valStr: string) => {
    if (valStr.trim() === "") {
      setPomoWorkTime(0);
      return;
    }
    let val = parseInt(valStr);
    if (isNaN(val)) val = 25;
    if (val < 1) {
      setPomoWorkTime(1);
      localStorage.setItem("tempo-pomo-work-time", "1");
      triggerSaveNotification("Work Block clamped to min 1 minute");
    } else if (val > 180) {
      setPomoWorkTime(180);
      localStorage.setItem("tempo-pomo-work-time", "180");
      triggerSaveNotification("Work Block clamped to max 180 minutes");
    } else {
      setPomoWorkTime(val);
      localStorage.setItem("tempo-pomo-work-time", String(val));
      triggerSaveNotification();
    }
    window.dispatchEvent(new Event("tempo-settings-changed"));
  };

  const handlePomoShortBreakChange = (valStr: string) => {
    if (valStr.trim() === "") {
      setPomoShortBreak(0);
      return;
    }
    let val = parseInt(valStr);
    if (isNaN(val)) val = 5;
    if (val < 1) {
      setPomoShortBreak(1);
      localStorage.setItem("tempo-pomo-short-break", "1");
      triggerSaveNotification("Short Break clamped to min 1 minute");
    } else if (val > 60) {
      setPomoShortBreak(60);
      localStorage.setItem("tempo-pomo-short-break", "60");
      triggerSaveNotification("Short Break clamped to max 60 minutes");
    } else {
      setPomoShortBreak(val);
      localStorage.setItem("tempo-pomo-short-break", String(val));
      triggerSaveNotification();
    }
    window.dispatchEvent(new Event("tempo-settings-changed"));
  };

  const handlePomoLongBreakChange = (valStr: string) => {
    if (valStr.trim() === "") {
      setPomoLongBreak(0);
      return;
    }
    let val = parseInt(valStr);
    if (isNaN(val)) val = 15;
    if (val < 1) {
      setPomoLongBreak(1);
      localStorage.setItem("tempo-pomo-long-break", "1");
      triggerSaveNotification("Long Break clamped to min 1 minute");
    } else if (val > 60) {
      setPomoLongBreak(60);
      localStorage.setItem("tempo-pomo-long-break", "60");
      triggerSaveNotification("Long Break clamped to max 60 minutes");
    } else {
      setPomoLongBreak(val);
      localStorage.setItem("tempo-pomo-long-break", String(val));
      triggerSaveNotification();
    }
    window.dispatchEvent(new Event("tempo-settings-changed"));
  };

  const handlePomoTargetDailyChange = (valStrOrFn: number | ((prev: number) => number)) => {
    setPomoTargetDaily(prev => {
      let next = typeof valStrOrFn === 'function' ? valStrOrFn(prev) : valStrOrFn;
      if (isNaN(next)) next = 8;
      if (next < 1) next = 1;
      if (next > 99) next = 99;
      localStorage.setItem("tempo-pomo-target-daily", String(next));
      triggerSaveNotification(`Daily target updated to ${next} cycles`);
      setTimeout(() => {
        window.dispatchEvent(new Event("tempo-settings-changed"));
      }, 0);
      return next;
    });
  };

  const resetPomoToDefaults = () => {
    setPomoWorkTime(25);
    setPomoShortBreak(5);
    setPomoLongBreak(15);
    setPomoTargetDaily(8);
    
    localStorage.setItem("tempo-pomo-work-time", "25");
    localStorage.setItem("tempo-pomo-short-break", "5");
    localStorage.setItem("tempo-pomo-long-break", "15");
    localStorage.setItem("tempo-pomo-target-daily", "8");
    
    window.dispatchEvent(new Event("tempo-settings-changed"));
    triggerSaveNotification("Focus & Pomodoro settings reset to defaults!");
  };

  const [enableSoundChime, setEnableSoundChime] = useState<boolean>(true);

  // 7. AI ASSISTANT STATES
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiAutomateReflections, setAiAutomateReflections] = useState<boolean>(true);
  const [aiInterruptionShield, setAiInterruptionShield] = useState<boolean>(true);
  const [aiAssistantModel, setAiAssistantModel] = useState<string>('gemini-2.5-pro');

  // 8. BILLING / CREDIT CARD STATES
  const [billingPlan, setBillingPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [isCopiedInvoice, setIsCopiedInvoice] = useState<string | null>(null);

  // 9. DATA EXPORT ACTIONS
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // 10. KEYBOARD SHORTCUTS SECTIONS KEY SEARCH
  const [searchQuery, setSearchQuery] = useState<string>('');

  const shortcutData: ShortcutRow[] = [
    // Navigation Category
    { key: 'T', desc: 'Today View', category: 'Navigation' },
    { key: 'W', desc: 'Week View', category: 'Navigation' },
    { key: 'C', desc: 'Calendar View', category: 'Navigation' },
    { key: 'K', desc: 'Tasks checklist', category: 'Navigation' },
    { key: 'H', desc: 'Habits tracker', category: 'Navigation' },
    { key: 'A', desc: 'Analytics / Velocity Stats', category: 'Navigation' },
    { key: 'R', desc: 'Daily automated review', category: 'Navigation' },
    { key: ',', desc: 'Settings console', category: 'Navigation' },
    { key: '/', desc: 'Global app Search palette', category: 'Navigation' },

    // Tasks Category
    { key: 'N', desc: 'New task quick creator', category: 'Tasks' },
    { key: 'Space', desc: 'Complete current task', category: 'Tasks' },
    { key: 'E', desc: 'Edit existing active task', category: 'Tasks' },
    { key: 'S', desc: 'Schedule task for later date', category: 'Tasks' },
    { key: 'G', desc: 'Set task gravity rank index', category: 'Tasks' },
    { key: 'D', desc: 'Delete task securely', category: 'Tasks' },

    // Focus Category
    { key: 'Ctrl+Shift+F', desc: 'Start focus mode with top task', category: 'Focus' },
    { key: 'Esc', desc: 'Exit focus mode right away', category: 'Focus' },
    { key: 'Space', desc: 'Pause/Resume timer sequence', category: 'Focus' },
    { key: 'Ctrl+I', desc: 'Log interruption event', category: 'Focus' },

    // General Category
    { key: 'Ctrl+K', desc: 'Command palette controller', category: 'General' },
    { key: 'Ctrl+Shift+Z', desc: 'Undo last session modification', category: 'General' },
    { key: 'Ctrl+Shift+S', desc: 'Save all transient memories', category: 'General' },
    { key: '?', desc: 'Show shortcuts list popup help', category: 'General' },
  ];

  // Filtering shortcuts based on search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcutData;
    const query = searchQuery.toLowerCase();
    return shortcutData.filter(s => 
      s.key.toLowerCase().includes(query) || 
      s.desc.toLowerCase().includes(query) || 
      s.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Accent Colors Preset list
  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Pink/Red', value: '#f43f5e' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Magenta', value: '#ec4899' },
    { name: 'White', value: '#f5f5f5' }
  ];

  // Navigation Items on Left Sidebar
  const sidebarNavItems = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'shortcuts', name: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'calendar', name: 'Calendar & Sync', icon: Calendar },
    { id: 'focus_pomo', name: 'Focus & Pomodoro', icon: Timer },
    { id: 'ai_assistant', name: 'AI Assistant', icon: Bot },
    { id: 'privacy', name: 'Privacy', icon: Lock },
    { id: 'data', name: 'Data & Export', icon: Database },
    { id: 'billing', name: 'Billing', icon: CreditCard }
  ];

  // Simulated Save Handler
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [toastMessageText, setToastMessageText] = useState<string>('Preference updated instantly!');
  const triggerSaveNotification = (msg?: string) => {
    setToastMessageText(msg || 'Preference updated instantly!');
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 2000);
  };

  return (
    <div id="settings-view" className="flex-grow w-full max-w-7xl mx-auto px-6 py-6 overflow-hidden flex flex-col font-sans text-[#F1F1F1] selection:bg-[var(--tempo-accent-blue)]/30 select-none">
      
      {/* LOCAL STYLES AND HIGHLIGHT PREVIEWS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        .settings-serif {
          font-family: "DM Serif Display", Georgia, serif;
        }
        .settings-sans {
          font-family: "DM Sans", sans-serif;
        }
        .settings-mono {
          font-family: "JetBrains Mono", monospace;
        }

        /* Toggle switches transition classes */
        .toggle-track-transition {
          transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .toggle-circle-transition {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Ambient animations */
        @keyframes toastSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .toast-entrance {
          animation: toastSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Custom Theme Card Previews */
        .preview-circle-pulse {
          box-shadow: 0 0 10px rgba(79, 142, 247, 0.35);
        }
      `}} />

      {/* SAVED FLOATING TOAST FEEDBACK */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#141416] border border-[#34D399] px-4 py-3 rounded-12 shadow-2xl flex items-center gap-2.5 text-[#34D399] font-mono text-xs toast-entrance">
          <div className="w-5 h-5 rounded-full bg-[#34D399]/15 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessageText}</span>
        </div>
      )}

      {/* CORE TWO-COLUMN MAIN CONTAINER FRAME */}
      <div className="flex-grow w-full border border-[#2A2A2D] bg-[#141416]/50 rounded-16 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[500px]">
        
        {/* =========================================================
            LEFT COLUMN SIDEBAR (200px equivalent, styled & dense)
            ========================================================= */}
        <aside className="w-full md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r border-[#2A2A2D] bg-[#0E0E10] p-4 flex flex-col justify-between overflow-y-auto">
          
          <div className="flex flex-col gap-6">
            
            {/* Top user account Profile Circle block */}
            <div className="flex items-center gap-3 p-1.5 rounded-12 bg-[#141416]/40 border border-[#2A2A2D]/40">
              <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-tr from-[var(--tempo-accent-blue)] to-[#FB7185] flex items-center justify-center font-bold text-sm text-white select-none shadow overflow-hidden relative">
                {profileAvatarUrl ? (
                  <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                ) : (
                  getInitials(profileName)
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#F1F1F1] truncate">
                  {profileName}
                </span>
                <span className="text-[10px] text-[#8A8A90] truncate mb-0.5">
                  {profileEmail}
                </span>
                
                {/* Pro badge indicators */}
                <div className="flex">
                  <span className="px-1.5 py-0.2 rounded bg-[var(--tempo-accent-blue)]/15 border border-[var(--tempo-accent-blue)]/20 text-[8px] font-mono font-bold text-[var(--tempo-accent-blue)] uppercase tracking-wider">
                    Pro Pack
                  </span>
                </div>
              </div>
            </div>

            {/* Selection Navigation Category Items */}
            <nav className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest text-[#4A4A52] uppercase font-bold mb-1.5 px-2">
                Preferences
              </span>

              {sidebarNavItems.map((item) => {
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      triggerSaveNotification();
                    }}
                    className={`h-[36px] px-3.5 rounded-8 text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer text-left ${
                      isActive 
                        ? 'bg-[#1C1C1F] text-white' 
                        : 'text-[#8A8A90] hover:text-white hover:bg-[#141416]'
                    }`}
                    style={{
                      borderLeft: isActive ? `2px solid ${activeAccent}` : '2px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      <item.icon className="w-4 h-4 shrink-0 text-[var(--tempo-text-secondary)]" />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {/* Decorative pill indicators */}
                    {item.id === 'shortcuts' && (
                      <span className="text-[8px] font-mono bg-[#1C1C1F] text-[#4A4A52] px-1 rounded uppercase tracking-tighter">
                        ⌥Ctrl
                      </span>
                    )}
                    {item.id === 'ai_assistant' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

          </div>

          {/* Footer controls or details */}
          <div className="mt-8 border-t border-[#2A2A2D]/40 pt-4 p-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#4A4A52]">
              <span>TEMPO AGENT</span>
              <span>v2.10.4</span>
            </div>
            <div className="text-[9px] text-center text-[#8A8A90] mt-1 italic">
              "Connected via secure workspace sandbox."
            </div>
          </div>

        </aside>

        {/* =========================================================
            RIGHT MAIN PANELS CONTENT (flex-1, context switching view)
            ========================================================= */}
        <section className="flex-1 bg-[#141416]/30 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          
          <div className="flex flex-col gap-8 max-w-3xl">

            {/* ========================================================= */}
            {/* VIEW A: APPEARANCE TAB PANEL CONTENT                      */}
            {/* ========================================================= */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Header Header Info block */}
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">Appearance</h2>
                  <p className="text-sm text-[#8A8A90]">Customize and settle how the virtual workspace interface looks and coordinates.</p>
                </header>

                {/* SECTION 1: Theme Option Cards */}
                <section className="flex flex-col gap-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">Theme Setting</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Theme Theme 1: Midnight */}
                    <div 
                      onClick={() => {
                        setActiveTheme('midnight');
                        triggerSaveNotification();
                      }}
                      className={`rounded-12 p-3.5 bg-[#0D0D0F] border cursor-pointer select-none relative group transition-all transform hover:translate-y-[-1px] ${
                        activeTheme === 'midnight' 
                          ? 'border-[var(--tempo-accent-blue)] ring-2 ring-[var(--tempo-accent-blue)]/10' 
                          : 'border-[#2A2A2D] hover:border-[#3D3D42]'
                      }`}
                    >
                      {activeTheme === 'midnight' && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--tempo-accent-blue)] flex items-center justify-center text-white p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                      )}
                      {/* Mini visual frame representation */}
                      <div className="w-full h-20 rounded-8 bg-[#0D0D0F] border border-[#2A2A2D] p-2 flex flex-col justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--tempo-accent-blue)]" />
                          <div className="w-8 h-1 bg-[#1C1C1F] rounded" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-[#2D2D32] rounded" />
                          <div className="w-3/4 h-1 bg-[#2D2D32] rounded" />
                        </div>
                      </div>
                      <div className="text-xs font-bold text-white text-center">Midnight Black</div>
                    </div>

                    {/* Theme Theme 2: Paper Light look */}
                    <div 
                      onClick={() => {
                        setActiveTheme('paper');
                        triggerSaveNotification();
                      }}
                      className={`rounded-12 p-3.5 bg-[#F9F9FB] border cursor-pointer select-none relative group transition-all transform hover:translate-y-[-1px] ${
                        activeTheme === 'paper' 
                          ? 'border-[var(--tempo-accent-blue)] ring-2 ring-[var(--tempo-accent-blue)]/10' 
                          : 'border-[#2A2A2D] hover:border-[#3D3D42]'
                      }`}
                    >
                      {activeTheme === 'paper' && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--tempo-accent-blue)] flex items-center justify-center text-white p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                      )}
                      {/* Mini visual frame representation */}
                      <div className="w-full h-20 rounded-8 bg-[#EBEBED] border border-white/50 p-2 flex flex-col justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1F]" />
                          <div className="w-8 h-1 bg-[#D1D1D6] rounded" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-[#C7C7CC] rounded" />
                          <div className="w-3/4 h-1 bg-[#C7C7CC] rounded" />
                        </div>
                      </div>
                      <div className="text-xs font-bold text-stone-900 text-center">Paper Light</div>
                    </div>

                    {/* Theme Theme 3: Deep Forest tinted */}
                    <div 
                      onClick={() => {
                        setActiveTheme('forest');
                        triggerSaveNotification();
                      }}
                      className={`rounded-12 p-3.5 bg-[#0B1510] border cursor-pointer select-none relative group transition-all transform hover:translate-y-[-1px] ${
                        activeTheme === 'forest' 
                          ? 'border-[var(--tempo-accent-blue)] ring-2 ring-[var(--tempo-accent-blue)]/10' 
                          : 'border-[#2A2A2D] hover:border-[#3D3D42]'
                      }`}
                    >
                      {activeTheme === 'forest' && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--tempo-accent-blue)] flex items-center justify-center text-white p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                      )}
                      {/* Mini visual frame representation */}
                      <div className="w-full h-20 rounded-8 bg-[#0D1F16] border border-[#1F3323] p-2 flex flex-col justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                          <div className="w-8 h-1 bg-[#1F3D2A] rounded" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-[#1E3B27] rounded" />
                          <div className="w-3/4 h-1 bg-[#1E3B27] rounded" />
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 text-center">Forest Green</div>
                    </div>

                  </div>
                </section>

                {/* SECTION 2: Accent Preset Colors */}
                <section className="flex flex-col gap-3 border-t border-[#2A2A2D]/40 pt-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">Accent Color Swatch</span>
                    <span className="text-[11px] text-[#4A4A52]">Changes global focus anchors, links, and system badges instantly</span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {accentColors.map((color) => {
                      const isActive = activeAccent === color.value;
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setActiveAccent(color.value);
                            localStorage.setItem("tempo-accent-color", color.value);
                            document.documentElement.style.setProperty('--color-accent', color.value);
                            triggerSaveNotification();
                          }}
                          className={`w-[28px] h-[28px] rounded-full relative transform active:scale-95 duration-100 hover:scale-110 cursor-pointer ${
                            isActive 
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141416] preview-circle-pulse' 
                              : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {isActive && (
                            <Check className="w-4 h-4 text-black font-black absolute inset-0 m-auto stroke-[3px]" style={{ color: color.value === '#f5f5f5' ? '#0D0D0F' : '#ffffff' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 3: Font Size Segments slider */}
                <section className="flex flex-col gap-3 border-t border-[#2A2A2D]/40 pt-5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">Interface Font Scale</span>
                  
                  <div className="flex bg-[#0D0D0F] border border-[#2A2A2D] p-1 rounded-12 max-w-sm relative">
                    {(['small', 'medium', 'large', 'xl'] as const).map((sz) => {
                      const isActive = fontSize === sz;
                      return (
                        <button
                          key={sz}
                          onClick={() => {
                            setFontSize(sz);
                            localStorage.setItem("tempo-font-scale", sz);
                            const fontSizes = {
                              small: '14px',
                              medium: '16px',
                              large: '18px',
                              xl: '20px'
                            };
                            document.documentElement.style.fontSize = fontSizes[sz];
                            triggerSaveNotification();
                          }}
                          className={`flex-1 text-center py-1.5 rounded-8 text-xs font-bold leading-none capitalize transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-[#1C1C1F] text-white shadow' 
                              : 'text-[#8A8A90] hover:text-white'
                          }`}
                          title={`Scale index ${sz}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 4: Sidebar customization */}
                <section className="flex flex-col gap-4 border-t border-[#2A2A2D]/40 pt-5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">Sidebar Controls</span>
                  
                  <div className="flex flex-col gap-3 bg-[#141416]/50 border border-[#2A2A2D]/40 rounded-12 p-4">
                    
                    {/* Sidebar Row 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Compact Sidebar Layout</span>
                        <span className="text-[11px] text-[#8A8A90]">Reduces navigation links to clean symbolic representation</span>
                      </div>

                      <EngineeredToggle
                        checked={!!compactSidebar}
                        onChange={(val) => {
                          setCompactSidebar(val);
                          triggerSaveNotification();
                        }}
                      />
                    </div>

                    {/* Sidebar Row 2 */}
                    <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Keyboard shortcut indicators</span>
                        <span className="text-[11px] text-[#8A8A90]">Display helper hotkey badges directly beside items</span>
                      </div>

                      <EngineeredToggle
                        checked={!!showShortcutsInSidebar}
                        onChange={(val) => {
                          setShowShortcutsInSidebar(val);
                          triggerSaveNotification();
                        }}
                      />
                    </div>

                  </div>
                </section>

                {/* SECTION 5: Energy Colors Map */}
                <section className="flex flex-col gap-4 border-t border-[#2A2A2D]/40 pt-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">Energy Style Profiles</span>
                    <span className="text-[11px] text-[#4A4A52]">Customize hexadecimal colors representing system gravity categories</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Deep work */}
                    <div className="flex flex-col bg-[#0E0E10] border border-[#2A2A2D]/70 p-3 rounded-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: energyColors.deep }} />
                          <span className="text-xs font-bold">Deep Work Focus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={(/^#[0-9A-Fa-f]{6}$/).test(energyColors.deep) ? energyColors.deep : '#8B5CF6'} 
                            onChange={(e) => {
                              handleColorChange('deep', e.target.value);
                              triggerSaveNotification();
                            }}
                            className="w-10 h-6 bg-transparent outline-none border border-[#2A2A2D] rounded scale-105 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={energyColors.deep}
                            onChange={(e) => {
                              handleColorChange('deep', e.target.value);
                            }}
                            className="w-20 px-2 py-1 text-right text-[11px] font-mono uppercase bg-[#141416] border border-[#2A2A2D] text-[#F1F1F1] rounded focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                          />
                        </div>
                      </div>
                      {colorErrors.deep && (
                        <div className="text-[10px] text-[#FB7185] font-mono text-right mt-1">
                          {colorErrors.deep}
                        </div>
                      )}
                    </div>

                    {/* Light work */}
                    <div className="flex flex-col bg-[#0E0E10] border border-[#2A2A2D]/70 p-3 rounded-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: energyColors.light }} />
                          <span className="text-xs font-bold">Light Admin Blocks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={(/^#[0-9A-Fa-f]{6}$/).test(energyColors.light) ? energyColors.light : '#60A5FA'} 
                            onChange={(e) => {
                              handleColorChange('light', e.target.value);
                              triggerSaveNotification();
                            }}
                            className="w-10 h-6 bg-transparent outline-none border border-[#2A2A2D] rounded scale-105 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={energyColors.light}
                            onChange={(e) => {
                              handleColorChange('light', e.target.value);
                            }}
                            className="w-20 px-2 py-1 text-right text-[11px] font-mono uppercase bg-[#141416] border border-[#2A2A2D] text-[#F1F1F1] rounded focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                          />
                        </div>
                      </div>
                      {colorErrors.light && (
                        <div className="text-[10px] text-[#FB7185] font-mono text-right mt-1">
                          {colorErrors.light}
                        </div>
                      )}
                    </div>

                    {/* Admin Work */}
                    <div className="flex flex-col bg-[#0E0E10] border border-[#2A2A2D]/70 p-3 rounded-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: energyColors.admin }} />
                          <span className="text-xs font-bold">Critical Admin Action</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={(/^#[0-9A-Fa-f]{6}$/).test(energyColors.admin) ? energyColors.admin : '#FBBF24'} 
                            onChange={(e) => {
                              handleColorChange('admin', e.target.value);
                              triggerSaveNotification();
                            }}
                            className="w-10 h-6 bg-transparent outline-none border border-[#2A2A2D] rounded scale-105 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={energyColors.admin}
                            onChange={(e) => {
                              handleColorChange('admin', e.target.value);
                            }}
                            className="w-20 px-2 py-1 text-right text-[11px] font-mono uppercase bg-[#141416] border border-[#2A2A2D] text-[#F1F1F1] rounded focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                          />
                        </div>
                      </div>
                      {colorErrors.admin && (
                        <div className="text-[10px] text-[#FB7185] font-mono text-right mt-1">
                          {colorErrors.admin}
                        </div>
                      )}
                    </div>

                    {/* Creative */}
                    <div className="flex flex-col bg-[#0E0E10] border border-[#2A2A2D]/70 p-3 rounded-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: energyColors.creative }} />
                          <span className="text-xs font-bold">Creative Session Flow</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={(/^#[0-9A-Fa-f]{6}$/).test(energyColors.creative) ? energyColors.creative : '#FB7185'} 
                            onChange={(e) => {
                              handleColorChange('creative', e.target.value);
                              triggerSaveNotification();
                            }}
                            className="w-10 h-6 bg-transparent outline-none border border-[#2A2A2D] rounded scale-105 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={energyColors.creative}
                            onChange={(e) => {
                              handleColorChange('creative', e.target.value);
                            }}
                            className="w-20 px-2 py-1 text-right text-[11px] font-mono uppercase bg-[#141416] border border-[#2A2A2D] text-[#F1F1F1] rounded focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                          />
                        </div>
                      </div>
                      {colorErrors.creative && (
                        <div className="text-[10px] text-[#FB7185] font-mono text-right mt-1">
                          {colorErrors.creative}
                        </div>
                      )}
                    </div>

                    {/* Social split */}
                    <div className="flex flex-col bg-[#0E0E10] border border-[#2A2A2D]/70 p-3 rounded-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: energyColors.social }} />
                          <span className="text-xs font-bold">Social & Community Sync</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={(/^#[0-9A-Fa-f]{6}$/).test(energyColors.social) ? energyColors.social : '#2DD4BF'} 
                            onChange={(e) => {
                              handleColorChange('social', e.target.value);
                              triggerSaveNotification();
                            }}
                            className="w-10 h-6 bg-transparent outline-none border border-[#2A2A2D] rounded scale-105 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={energyColors.social}
                            onChange={(e) => {
                              handleColorChange('social', e.target.value);
                            }}
                            className="w-20 px-2 py-1 text-right text-[11px] font-mono uppercase bg-[#141416] border border-[#2A2A2D] text-[#F1F1F1] rounded focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                          />
                        </div>
                      </div>
                      {colorErrors.social && (
                        <div className="text-[10px] text-[#FB7185] font-mono text-right mt-1">
                          {colorErrors.social}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Reset to Defaults Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        const defaults = {
                          deep: '#8B5CF6',
                          light: '#60A5FA',
                          admin: '#FBBF24',
                          creative: '#FB7185',
                          social: '#2DD4BF'
                        };
                        setEnergyColors(defaults);
                        setColorErrors({});
                        localStorage.setItem("tempo-category-colors", JSON.stringify(defaults));
                        Object.entries(defaults).forEach(([key, val]) => {
                          document.documentElement.style.setProperty(`--color-${key}`, val);
                        });
                        triggerSaveNotification();
                      }}
                      className="px-3.5 py-1.5 rounded-8 text-[11px] font-sans font-bold bg-[#1C1C1F] text-[#F1F1F1] hover:bg-white/5 border border-[#2A2A2D] transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      Reset to Defaults
                    </button>
                  </div>

                </section>

                {/* SECTION 6: Interface Animations settings */}
                <section className="flex flex-col gap-4 border-t border-[#2A2A2D]/40 pt-5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">VFX Interface Animations</span>
                  
                  <div className="flex flex-col gap-3.5 bg-[#141416]/50 border border-[#2A2A2D]/40 rounded-12 p-4">
                    
                    {/* Switch 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Reduce motion (Accessibility)</span>
                        <span className="text-[11px] text-[#8A8A90]">Smooths transitions to protect vestibular comfort limits</span>
                      </div>
                      <EngineeredToggle
                        checked={reduceMotion}
                        onChange={(val) => {
                          setReduceMotion(val);
                          localStorage.setItem("tempo-reduce-motion", String(val));
                          document.documentElement.classList.toggle("reduce-motion", val);
                          window.dispatchEvent(new Event("tempo-settings-changed"));
                          triggerSaveNotification();
                        }}
                      />
                    </div>

                    {/* Switch 2 */}
                    <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Gravity pulse animation</span>
                        <span className="text-[11px] text-[#8A8A90]">Radial energy glow when focus metrics scale up high on reviews</span>
                      </div>
                      <EngineeredToggle
                        checked={gravityPulse}
                        onChange={(val) => {
                          setGravityPulse(val);
                          localStorage.setItem("tempo-gravity-pulse", String(val));
                          document.documentElement.classList.toggle("gravity-pulse-disabled", !val);
                          window.dispatchEvent(new Event("tempo-settings-changed"));
                          triggerSaveNotification();
                        }}
                      />
                    </div>

                    {/* Switch 3 */}
                    <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Full layout page transitions</span>
                        <span className="text-[11px] text-[#8A8A90]">Staggers rendering of stats cards upon route switches</span>
                      </div>
                      <EngineeredToggle
                        checked={pageTransitions}
                        onChange={(val) => {
                          setPageTransitions(val);
                          localStorage.setItem("tempo-page-transitions", String(val));
                          window.dispatchEvent(new Event("tempo-settings-changed"));
                          triggerSaveNotification();
                        }}
                      />
                    </div>

                  </div>
                </section>

              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW B: KEYBOARD SHORTCUTS TAB PANEL CONTENT              */}
            {/* ========================================================= */}
            {activeTab === 'shortcuts' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Header Row */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">Keyboard Shortcuts</h2>
                    <p className="text-sm text-[#8A8A90]">Browse global keyboard triggers designed for light-speed command and operations.</p>
                  </div>

                  {/* Filter query element input search */}
                  <div className="relative w-full sm:w-60 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-[#4A4A52] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search triggers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-6 py-1.5 bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[var(--tempo-accent-blue)] focus:outline-none rounded-8 text-xs text-white placeholder-[#4A4A52]"
                    />
                  </div>
                </header>

                <div className="flex flex-col gap-6">
                  
                  {/* Categorized tables mapping */}
                  {(['Navigation', 'Tasks', 'Focus', 'General'] as const).map((cat) => {
                    const groupRows = filteredShortcuts.filter(r => r.category === cat);
                    
                    if (groupRows.length === 0) return null;

                    return (
                      <div key={cat} className="flex flex-col gap-2">
                        
                        {/* Category Header Title */}
                        <div className="border-b border-[#2A2A2D] pb-1 bg-gradient-to-r from-[#1C1C1F] to-transparent px-2 py-1 rounded">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FB7185]">
                            {cat} Category Triggers
                          </span>
                        </div>

                        {/* Tables element body rows */}
                        <div className="flex flex-col bg-[#0D0D0F]/30 rounded-12 overflow-hidden border border-[#2A2A2D]/60 divide-y divide-[#2A2A2D]/40">
                          {groupRows.map((row) => (
                            <div 
                              key={row.key} 
                              className="flex items-center justify-between p-3.5 px-4 hover:bg-[#141416]/50 transition-colors group"
                            >
                              {/* Left detail description */}
                              <span className="text-xs font-sans text-[#8A8A90] font-medium group-hover:text-[#F1F1F1] transition-colors duration-100">
                                {row.desc}
                              </span>

                              {/* Right key caps indicator */}
                              <kbd className="settings-mono text-[11px] font-bold tracking-tight bg-[#1C1C1F] text-[var(--tempo-accent-blue)] hover:text-white border border-[#3D3D42] px-2.5 py-1 rounded-6 shadow-sm shadow-black shrink-0 transition-colors">
                                {row.key}
                              </kbd>
                            </div>
                          ))}
                        </div>

                      </div>
                    );
                  })}

                  {filteredShortcuts.length === 0 && (
                    <div className="border border-dashed border-[#2A2A2D] rounded-12 h-44 flex flex-col items-center justify-center p-6 text-center select-none animate-pulse">
                      <Sparkles className="w-7 h-7 text-[#4A4A52] mb-2" />
                      <h3 className="text-xs font-bold text-[#F1F1F1] font-mono">No matching shortcut found</h3>
                      <p className="text-[11px] text-[#8A8A90] mt-1 italic">
                        Try searching generic queries like "Save", "Focus", or "Today".
                      </p>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW C: PROFILE SETTINGS                                  */}
            {/* ========================================================= */}
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6 animate-fade-in text-left">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">Profile</h2>
                  <p className="text-sm text-[#8A8A90]">Manage your identity and bio anchors representing your daily workspace.</p>
                </header>

                {/* Avatar upload section */}
                <div className="flex flex-col sm:flex-row items-center gap-5 border border-[#2A2A2D]/40 bg-[#141416]/30 p-4 rounded-12">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--tempo-accent-blue)] to-[#FB7185] flex items-center justify-center font-bold text-2xl text-white select-none shadow-lg relative overflow-hidden shrink-0 border border-[#2A2A2D]">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      getInitials(profileName)
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <h3 className="text-sm font-sans font-bold text-[#F1F1F1]">Profile Photo</h3>
                    <p className="text-[11px] text-[#8A8A90] max-w-sm leading-normal">
                      Upload a circular PNG, JPG, or WebP portrait picture. Recommended dimensions: 256x256px.
                    </p>
                    <div className="flex items-center gap-3 justify-center sm:justify-start mt-1">
                      <label className="px-3.5 py-1.5 rounded-8 bg-[#1C1C1F] hover:bg-white/5 text-[11px] font-mono font-bold text-white border border-[#2A2A2D] cursor-pointer transition-colors duration-150 shadow flex items-center gap-1.5">
                        {isUploading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--tempo-accent-blue)]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploading ? "Uploading..." : "Upload photo"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadAvatar(file);
                          }}
                        />
                      </label>
                      {profileAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileAvatarUrl('');
                            triggerSaveNotification("Avatar removed!");
                          }}
                          className="px-3.5 py-1.5 rounded-8 text-[11px] font-mono font-bold text-[#FB7185] hover:bg-[#FB7185]/10 border border-[#FB7185]/20 cursor-pointer transition-colors duration-150"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {uploadProgress > 0 && (
                      <div className="w-full max-w-[200px] mt-2 mx-auto sm:mx-0">
                        <div className="flex items-center justify-between text-[9px] font-mono mb-1 text-[var(--tempo-accent-blue)]">
                          <span>Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#232326] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--tempo-accent-blue)] duration-150 transition-all" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                    {profileErrors.avatar && (
                      <span className="text-[11px] text-[#FB7185] font-semibold mt-1 block font-sans">⚠️ {profileErrors.avatar}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#8A8A90] uppercase font-bold tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => {
                        setProfileName(e.target.value);
                        if (e.target.value.trim().length >= 2) {
                          setProfileErrors(prev => {
                            const copy = { ...prev };
                            delete copy.fullName;
                            return copy;
                          });
                        }
                      }}
                      className="px-3.5 py-2 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[var(--tempo-accent-blue)] focus:outline-none rounded-8 text-white text-sans"
                      placeholder="Ahmed Mohamed"
                    />
                    {profileErrors.fullName && (
                      <span className="text-[11px] text-[#FB7185] font-semibold ml-1 block font-sans">⚠️ {profileErrors.fullName}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#8A8A90] uppercase font-bold tracking-wider">Username</label>
                    <div className="flex bg-[#0D0D0F] border border-[#2A2A2D] rounded-8 overflow-hidden focus-within:border-[var(--tempo-accent-blue)]">
                      <span className="text-[11px] font-mono text-[#4A4A52] bg-[#1C1C1F] border-r border-[#2A2A2D] px-3 py-2 select-none">tempo.io/@</span>
                      <input 
                        type="text" 
                        value={profileUsername} 
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className="flex-grow px-3 bg-transparent text-xs focus:outline-none text-white text-sans"
                        placeholder="ahmedm"
                      />
                    </div>
                    {profileErrors.username && (
                      <span className="text-[11px] text-[#FB7185] font-semibold ml-1 block font-sans">⚠️ {profileErrors.username}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono text-[#8A8A90] uppercase font-bold tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      disabled
                      readOnly
                      className="px-3.5 py-2 text-xs bg-[#0D0D0F]/80 border border-[#2A2A2D]/50 rounded-8 text-[#5A5A62] text-sans cursor-not-allowed select-none"
                    />
                    <span className="text-[11px] text-[#8A8A90] mt-0.5 ml-1 block font-sans leading-relaxed">
                      To change your email, contact support or use the account security settings.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-[#8A8A90] uppercase font-bold tracking-wider">Bio / Intentions Description</label>
                      <span className="text-[10px] font-mono text-[#5A5A62]">{profileBio.length}/160</span>
                    </div>
                    <textarea 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value.slice(0, 160))}
                      maxLength={160}
                      rows={3}
                      className="px-3.5 py-2 text-xs bg-[#0D0D0F] border border-[#2A2A2D] focus:border-[var(--tempo-accent-blue)] focus:outline-none rounded-8 text-white leading-relaxed text-sans resize-none"
                      placeholder="Describe your work style and intentions..."
                    />
                  </div>
                </div>

                {profileErrors.save && (
                  <div className="mt-2 bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185] text-xs font-medium rounded-8 p-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{profileErrors.save}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-fit px-6 py-2.5 rounded-8 bg-[var(--tempo-accent-blue)] hover:opacity-90 disabled:bg-[var(--tempo-accent-blue)]/50 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW D: NOTIFICATIONS                                     */}
            {/* ========================================================= */}
            {activeTab === 'notifications' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">Notifications</h2>
                  <p className="text-sm text-[#8A8A90]">Manage when and how Tempo alerts you about your focus habits and time debts.</p>
                </header>

                <div className="flex flex-col gap-4 bg-[#141416]/50 border border-[#2A2A2D]/40 rounded-12 p-5">
                  
                  {/* Notification Toggle 1 */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Daily Morning Digest Sync</span>
                      <span className="text-[11px] text-[#8A8A90]">Receive automated overview of today's target priorities via email</span>
                    </div>
                    <button
                      onClick={() => { setNotificationEmailToday(!notificationEmailToday); triggerSaveNotification(); }}
                      className={`w-11 h-6 rounded-full p-1 toggle-track-transition cursor-pointer ${notificationEmailToday ? 'bg-[var(--tempo-accent-blue)]' : 'bg-[#2A2A2D]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow toggle-circle-transition ${notificationEmailToday ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Notification Toggle 2 */}
                  <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Weekly Reflection Summary</span>
                      <span className="text-[11px] text-[#8A8A90]">Settle detailed PDF analysis highlighting your work velocity stats</span>
                    </div>
                    <button
                      onClick={() => { setNotificationEmailWeek(!notificationEmailWeek); triggerSaveNotification(); }}
                      className={`w-11 h-6 rounded-full p-1 toggle-track-transition cursor-pointer ${notificationEmailWeek ? 'bg-[var(--tempo-accent-blue)]' : 'bg-[#2A2A2D]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow toggle-circle-transition ${notificationEmailWeek ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Notification Toggle 3 */}
                  <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Timer Sound effects & Chimes</span>
                      <span className="text-[11px] text-[#8A8A90]">Acoustic feedback when pomodoro cycle finishes or is interrupted</span>
                    </div>
                    <button
                      onClick={() => { setNotificationSoundEnabled(!notificationSoundEnabled); triggerSaveNotification(); }}
                      className={`w-11 h-6 rounded-full p-1 toggle-track-transition cursor-pointer ${notificationSoundEnabled ? 'bg-[var(--tempo-accent-blue)]' : 'bg-[#2A2A2D]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow toggle-circle-transition ${notificationSoundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                </div>

                <div className="flex flex-col gap-2 bg-[#0E0E10] border border-[#2A2A2D] p-3 rounded-12 max-w-sm mt-1">
                  <label className="text-[10px] font-mono uppercase text-[#8A8A90] font-bold tracking-wider">Digest Dispatch Target Time</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={notificationDigestTime}
                      onChange={(e) => { setNotificationDigestTime(e.target.value); triggerSaveNotification(); }}
                      className="px-3.5 py-1.5 bg-[#141416] border border-[#2A2A2D] text-xs font-mono text-white rounded focus:outline-none"
                    />
                    <span className="text-xs text-[#8A8A90] italic">(Standard local timezone)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW E: CALENDAR & GCAL SYNC                              */}
            {/* ========================================================= */}
            {activeTab === 'calendar' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">📅 Calendar & Sync Integration</h2>
                  <p className="text-sm text-[#8A8A90]">Connect modern calendars to resolve planned time coordinates instantly.</p>
                </header>

                <div className="flex flex-col gap-4">
                  
                  {/* Google Calendar sync setup */}
                  <div className="flex items-center justify-between p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] hover:border-[var(--tempo-accent-blue)]/45 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🌍</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Google Calendar Sync</span>
                        <span className="text-[11px] text-[#8A8A90]">Fully synchronized with {profileEmail}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setGcalConnected(!gcalConnected); triggerSaveNotification(); }}
                      className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                        gcalConnected 
                          ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/35 hover:bg-[#34D399]/25' 
                          : 'bg-[var(--tempo-accent-blue)] text-white hover:opacity-90'
                      }`}
                    >
                      {gcalConnected ? 'Connected ✓' : 'Disconnect'}
                    </button>
                  </div>

                  {/* iCal connect */}
                  <div className="flex items-center justify-between p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] hover:border-[var(--tempo-accent-blue)]/45 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍎</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Apple iCloud iCal Platform</span>
                        <span className="text-[11px] text-[#8A8A90]">Not connected to icloud directory yet</span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setIcalConnected(!icalConnected); triggerSaveNotification(); }}
                      className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                        icalConnected 
                          ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/35' 
                          : 'bg-[#1C1C1F] text-[#8A8A90] border border-[#2A2A2D] hover:text-white'
                      }`}
                    >
                      {icalConnected ? 'Connected ✓' : 'Connect Account'}
                    </button>
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1.5 p-3.5 bg-[#141416] border border-[#2A2A2D] rounded-12">
                    <span className="text-[11px] font-mono text-[#8A8A90] font-bold uppercase">Sync Frequency</span>
                    <select
                      value={syncInterval}
                      onChange={(e) => { setSyncInterval(e.target.value); triggerSaveNotification(); }}
                      className="w-full bg-[#0D0D0F] border border-[#2A2A2D] p-1.5 rounded mt-1 text-xs text-white"
                    >
                      <option value="5">Every 5 minutes</option>
                      <option value="15">Every 15 minutes</option>
                      <option value="60">Hourly syncs</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3.5 bg-[#141416] border border-[#2A2A2D] rounded-12">
                    <span className="text-[11px] font-mono text-[#8A8A90] font-bold uppercase">Time Blocking cushions</span>
                    <button
                      onClick={() => { setAutoBlockTime(!autoBlockTime); triggerSaveNotification(); }}
                      className="w-full text-left bg-[#0D0D0F] border border-[#2A2A2D] hover:border-[#3D3D42] p-1.5 rounded mt-1 text-xs text-white flex justify-between items-center"
                    >
                      <span>{autoBlockTime ? 'Auto cushion included ✓' : 'Silent blocks'}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${autoBlockTime ? 'bg-[#34D399]' : 'bg-[#4A4A52]'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW F: FOCUS & POMODORO                                  */}
            {/* ========================================================= */}
            {activeTab === 'focus_pomo' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">⏱ Focus & Pomodoro Settings</h2>
                  <p className="text-sm text-[#8A8A90]">Tune cognitive study waves and task time buffers to prevent fatigue.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* WORK TIMING */}
                  <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#8B5CF6] font-bold">Focus Cycle</span>
                      <h4 className="text-sm font-bold text-white mt-1">Work Block</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input 
                        type="number" 
                        value={pomoWorkTime || ''} 
                        onChange={(e) => handlePomoWorkChange(e.target.value)}
                        className="w-16 p-1.5 bg-[#141416] border border-[#2A2A2D] rounded font-mono text-xs text-right text-white" 
                        min="1"
                        max="180"
                      />
                      <span className="text-xs text-[#8A8A90] font-mono">mins</span>
                    </div>
                  </div>

                  {/* SHORT BREAK */}
                  <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#34D399] font-bold">Short break</span>
                      <h4 className="text-sm font-bold text-white mt-1">Energy Recharge</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input 
                        type="number" 
                        value={pomoShortBreak || ''} 
                        onChange={(e) => handlePomoShortBreakChange(e.target.value)}
                        className="w-16 p-1.5 bg-[#141416] border border-[#2A2A2D] rounded font-mono text-xs text-right text-white" 
                        min="1"
                        max="60"
                      />
                      <span className="text-xs text-[#8A8A90] font-mono">mins</span>
                    </div>
                  </div>

                  {/* LONG BREAK */}
                  <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#60A5FA] font-bold">Long break</span>
                      <h4 className="text-sm font-bold text-white mt-1">Full Cool Down</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input 
                        type="number" 
                        value={pomoLongBreak || ''} 
                        onChange={(e) => handlePomoLongBreakChange(e.target.value)}
                        className="w-16 p-1.5 bg-[#141416] border border-[#2A2A2D] rounded font-mono text-xs text-right text-white" 
                        min="1"
                        max="60"
                      />
                      <span className="text-xs text-[#8A8A90] font-mono">mins</span>
                    </div>
                  </div>

                </div>

                <div className="bg-[#141416]/50 border border-[#2A2A2D]/40 rounded-12 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Target Daily Focus Goals</span>
                      <span className="text-[11px] text-[#8A8A90]">Target cycles completed each 24h work day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePomoTargetDailyChange(prev => prev - 1)} 
                        className="w-7 h-7 bg-[#101012] border border-[#2A2A2D] rounded text-xs hover:text-white cursor-pointer"
                      >-</button>
                      <span className="text-xs font-mono font-bold text-white w-6 text-center">{pomoTargetDaily}</span>
                      <button 
                        onClick={() => handlePomoTargetDailyChange(prev => prev + 1)} 
                        className="w-7 h-7 bg-[#101012] border border-[#2A2A2D] rounded text-xs hover:text-white cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Local Section Reset Focus settings */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={resetPomoToDefaults}
                    className="px-3.5 py-1.5 rounded-8 text-[11px] font-sans font-bold bg-[#1C1C1F] text-[#F1F1F1] hover:bg-white/5 border border-[#2A2A2D] transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    Reset Focus Defaults
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW G: AI ASSISTANT                                      */}
            {/* ========================================================= */}
            {activeTab === 'ai_assistant' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">🤖 AI Assistant</h2>
                  <p className="text-sm text-[#8A8A90]">Configure server-side Gemini intelligence models to auto-categorize habits and time debts.</p>
                </header>

                <div className="flex flex-col gap-4 bg-[#141416]/50 border border-[#2A2A2D]/45 rounded-12 p-4">
                  
                  {/* AI toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Enable Assistant Advice</span>
                      <span className="text-[11px] text-[#8A8A90]">Surface daily reflection alerts inside core dashboard cards</span>
                    </div>
                    <button
                      onClick={() => { setAiEnabled(!aiEnabled); triggerSaveNotification(); }}
                      className={`w-11 h-6 rounded-full p-1 toggle-track-transition cursor-pointer ${aiEnabled ? 'bg-[var(--tempo-accent-blue)]' : 'bg-[#2A2A2D]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow toggle-circle-transition ${aiEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Automation toggle */}
                  <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Automate Weekly Reflection Logs</span>
                      <span className="text-[11px] text-[#8A8A90]">Auto-write draft outlines of "what went well" to jumpstart reviews</span>
                    </div>
                    <button
                      onClick={() => { setAiAutomateReflections(!aiAutomateReflections); triggerSaveNotification(); }}
                      className={`w-11 h-6 rounded-full p-1 toggle-track-transition cursor-pointer ${aiAutomateReflections ? 'bg-[var(--tempo-accent-blue)]' : 'bg-[#2A2A2D]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow toggle-circle-transition ${aiAutomateReflections ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Shield toggle */}
                  <div className="flex items-center justify-between border-t border-[#2A2A2D]/40 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Interruption Shield Guard</span>
                      <span className="text-[11px] text-[#8A8A90]">AI filters notification alerts if active focus mode exceeds threshold</span>
                    </div>
                    <button
                      onClick={() => { setAiInterruptionShield(!aiInterruptionShield); triggerSaveNotification(); }}
                      className={`w-11 h-6 rounded-full p-1 toggle-track-transition cursor-pointer ${aiInterruptionShield ? 'bg-[var(--tempo-accent-blue)]' : 'bg-[#2A2A2D]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow toggle-circle-transition ${aiInterruptionShield ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                </div>

                <div className="flex flex-col gap-2 p-4 bg-[#0E0E10] border border-[#2A2A2D] rounded-12 max-w-sm">
                  <span className="text-[11px] font-mono text-[#8A8A90] font-bold uppercase">Intelligence Core Engine</span>
                  <select
                    value={aiAssistantModel}
                    onChange={(e) => { setAiAssistantModel(e.target.value); triggerSaveNotification(); }}
                    className="w-full bg-[#141416] border border-[#2A2A2D] p-1.5 rounded mt-1 text-xs text-white font-mono"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Recommended)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Performance)</option>
                    <option value="custom-api">Custom API Tunnel Proxy</option>
                  </select>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW H: PRIVACY SETTINGS                                  */}
            {/* ========================================================= */}
            {activeTab === 'privacy' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">🔒 Privacy & Key Guards</h2>
                  <p className="text-sm text-[#8A8A90]">Review security configurations, access scopes, and keys.</p>
                </header>

                <div className="p-5 rounded-12 border border-[#FB7185]/20 bg-[#FB7185]/5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[#FB7185] shrink-0" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Private Sandbox active</span>
                  </div>
                  <p className="text-xs text-[#8A8A90] leading-relaxed">
                    Tempo keeps all database metrics local. We do not transmit tracking information or calendar event contexts without explicit OAuth tokens.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW I: DATA & EXPORT                                     */}
            {/* ========================================================= */}
            {activeTab === 'data' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">💾 Data Export & Overrides</h2>
                  <p className="text-sm text-[#8A8A90]">Acquire a copy of your session tracking database or override visual matrices instantly.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* EXPORT */}
                  <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] flex flex-col gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-[var(--tempo-accent-blue)]" />
                        <span>Export database</span>
                      </h4>
                      <p className="text-[11px] text-[#8A8A90] mt-1">Download standard structured JSON format reflecting your habits and velocity stats.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExporting(true);
                        setTimeout(() => { setIsExporting(false); triggerSaveNotification(); }, 1200);
                      }}
                      className="w-fit px-3 py-1.5 rounded text-[11px] font-mono font-bold bg-[#1C1C1F] text-white border border-[#2A2A2D] hover:bg-white/5 transition-all cursor-pointer"
                    >
                      {isExporting ? 'Downloading...' : 'Generate JSON file'}
                    </button>
                  </div>

                  {/* IMPORT */}
                  <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] flex flex-col gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#FBBF24]" />
                        <span>Upload overrides</span>
                      </h4>
                      <p className="text-[11px] text-[#8A8A90] mt-1">Upload a previous export JSON to settle settings presets and focus targets.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsImporting(true);
                        setTimeout(() => { setIsImporting(false); triggerSaveNotification(); }, 1000);
                      }}
                      className="w-fit px-3 py-1.5 rounded text-[11px] font-mono font-bold bg-[#1C1C1F] text-white border border-[#2A2A2D] hover:bg-white/5 transition-all cursor-pointer"
                    >
                      {isImporting ? 'Processing override...' : 'Select JSON file'}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW J: BILLING PLATFORM                                  */}
            {/* ========================================================= */}
            {activeTab === 'billing' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <header className="flex flex-col gap-1 border-b border-[#2A2A2D] pb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#F1F1F1] tracking-tight">💳 Billing & Invoices</h2>
                  <p className="text-sm text-[#8A8A90]">Manage your subscription tier, billing period, and past receipts.</p>
                </header>

                <div className="flex flex-col gap-4 bg-[#141416] border border-[#2A2A2D] p-5 rounded-12 relative overflow-hidden">
                  
                  {/* Decorative background visual glow */}
                  <div className="absolute right-0 top-0 w-36 h-36 bg-[var(--tempo-accent-blue)]/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-[var(--tempo-accent-blue)] font-bold uppercase tracking-wider">CURRENT SUBSCRIPTION</span>
                      <h3 className="text-lg font-bold text-white mt-1">Tempo Professional</h3>
                      <span className="text-xs text-[#8A8A90]">$12 per seat / month • Next charge date: July 1, 2026</span>
                    </div>

                    <span className="px-3 py-1 rounded bg-[#34D399]/15 border border-[#34D399]/25 text-xs text-[#34D399] font-bold">
                      ACTIVE (Pro)
                    </span>
                  </div>

                  <div className="border-t border-[#2A2A2D] pt-4 flex gap-2">
                    <button 
                      onClick={() => triggerSaveNotification()}
                      className="px-3.5 py-1.5 rounded bg-[#1C1C1F] text-xs font-bold text-white border border-[#2A2A2D] hover:bg-white/5 cursor-pointer duration-150"
                    >
                      Update Card Details
                    </button>
                    <button 
                      onClick={() => triggerSaveNotification()}
                      className="px-3.5 py-1.5 rounded bg-transparent text-xs text-[#8A8A90] hover:text-white cursor-pointer duration-150"
                    >
                      Cancel Plan
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A90] font-bold">Invoice History</span>
                  
                  <div className="flex flex-col border border-[#2A2A2D] rounded-12 bg-[#0E0E10] overflow-hidden divide-y divide-[#2A2A2D]/50 text-xs">
                    
                    <div className="flex justify-between items-center p-3 px-4 hover:bg-white/[0.01]">
                      <span className="font-mono text-[#8A8A90]">June 1, 2026</span>
                      <span className="text-white font-semibold">Pro Plan Sub ($12.00)</span>
                      <button 
                        onClick={() => { setIsCopiedInvoice('june'); setTimeout(() => setIsCopiedInvoice(null), 1500); }}
                        className="text-[10px] font-mono text-[var(--tempo-accent-blue)] bg-[var(--tempo-accent-blue)]/10 hover:bg-[var(--tempo-accent-blue)]/20 px-2.0 py-1.0 rounded"
                      >
                        {isCopiedInvoice === 'june' ? 'Saved! ✓' : 'Invoice PDF'}
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-3 px-4 hover:bg-white/[0.01]">
                      <span className="font-mono text-[#8A8A90]">May 1, 2026</span>
                      <span className="text-white font-semibold">Pro Plan Sub ($12.00)</span>
                      <button 
                        onClick={() => { setIsCopiedInvoice('may'); setTimeout(() => setIsCopiedInvoice(null), 1500); }}
                        className="text-[10px] font-mono text-[var(--tempo-accent-blue)] bg-[var(--tempo-accent-blue)]/10 hover:bg-[var(--tempo-accent-blue)]/20 px-2.0 py-1.0 rounded"
                      >
                        {isCopiedInvoice === 'may' ? 'Saved! ✓' : 'Invoice PDF'}
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Settle save message */}
          <footer className="mt-8 border-t border-[#2A2A2D] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed text-[#8A8A90]">
            <p className="max-w-md">
              Settings are saved automatically to the local user profile container. Access remain secured with OAuth protocol configurations.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={resetPomoToDefaults}
                className="px-4 py-1.5 rounded-8 bg-[#1C1C1F] hover:bg-[#202024] text-[#F1F1F1] border border-[#2A2A2D] font-bold cursor-pointer transition-colors shrink-0 font-sans"
              >
                Reset Default Values
              </button>
            </div>
          </footer>

        </section>

      </div>

    </div>
  );
}
