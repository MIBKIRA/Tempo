import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Task, EnergyType } from './types';

// Decoupled Helper: trigger a toast notification by dispatching a custom event
export const triggerAppToast = (msg: string) => {
  window.dispatchEvent(new CustomEvent('tempo-trigger-toast', { detail: { message: msg } }));
};

// Seeding function for initial items when in fallback/localStorage mode
export const getInitialTasks = (): Task[] => {
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
    // Today's Checkbox tasks in Day/Today View (unscheduled)
    { id: 1, type: 'task', title: "Write documentation for the new endpoints", energy: "deep", duration: "60m", gravity: 87, completed: false, date: todayStr },
    { id: 2, type: 'task', title: "Update project status in Notion", energy: "admin", duration: "15m", gravity: 45, completed: false, date: todayStr },
    { id: 3, type: 'task', title: "Code review for @alex's PR", energy: "deep", duration: "45m", gravity: 62, completed: false, date: todayStr },
    { id: 4, type: 'task', title: "Morning standup", energy: "social", duration: "30m", gravity: 30, completed: true, date: todayStr },
    { id: 5, type: 'task', title: "Send invoice to TechCorp", energy: "admin", duration: "10m", gravity: 50, completed: false, date: todayStr },

    // Monday scheduled tasks & events (dates[0])
    { id: 1001, type: 'scheduled_task', title: 'Product Kickoff', energy: 'social', duration: '90m', gravity: 50, completed: false, startTime: '09:00', endTime: '10:30', date: dates[0] },
    { id: 1002, type: 'scheduled_task', title: 'Code Review Session', energy: 'deep', duration: '60m', gravity: 50, completed: false, startTime: '14:00', endTime: '15:00', date: dates[0] },

    // Tuesday scheduled tasks & events (dates[1])
    { id: 1003, type: 'event', title: 'Gym Workout', energy: 'light', duration: '60m', gravity: 50, completed: false, startTime: '08:00', endTime: '09:00', date: dates[1], notes: 'Cardio + strength training' },
    { id: 1004, type: 'scheduled_task', title: 'Feature Sprint', energy: 'deep', duration: '120m', gravity: 50, completed: false, startTime: '10:00', endTime: '12:00', date: dates[1] },
    { id: 1005, type: 'scheduled_task', title: '1:1 with Sarah', energy: 'social', duration: '30m', gravity: 50, completed: false, startTime: '15:00', endTime: '15:30', date: dates[1] },

    // Wednesday scheduled tasks & events (dates[2])
    { id: 1006, type: 'scheduled_task', title: 'Architecture Deep Dive', energy: 'deep', duration: '150m', gravity: 50, completed: false, startTime: '09:00', endTime: '11:30', date: dates[2] },
    { id: 1007, type: 'event', title: 'Lunch with Client', energy: 'social', duration: '60m', gravity: 50, completed: false, startTime: '13:00', endTime: '14:00', date: dates[2], notes: 'Discuss Q3 deliverables' },

    // Thursday scheduled tasks & events (dates[3])
    { id: 1008, type: 'scheduled_task', title: 'Weekly Review', energy: 'admin', duration: '60m', gravity: 50, completed: false, startTime: '10:00', endTime: '11:00', date: dates[3] },
    { id: 1009, type: 'scheduled_task', title: 'Focused Writing', energy: 'creative', duration: '120m', gravity: 50, completed: false, startTime: '14:00', endTime: '16:00', date: dates[3] },
    { id: 1010, type: 'scheduled_task', title: 'Creative Brainstorm', energy: 'creative', duration: '75m', gravity: 50, completed: false, startTime: '15:00', endTime: '16:15', date: dates[3] },

    // Friday scheduled tasks & events (dates[4])
    { id: 1011, type: 'scheduled_task', title: 'API Integration', energy: 'deep', duration: '90m', gravity: 50, completed: false, startTime: '09:00', endTime: '10:30', date: dates[4] },
    { id: 1012, type: 'event', title: 'Weekly Core Standup', energy: 'social', duration: '30m', gravity: 50, completed: false, startTime: '10:30', endTime: '11:00', date: dates[4], notes: 'Engineering team alignments' },
    { id: 1013, type: 'scheduled_task', title: 'Architecture Review', energy: 'deep', duration: '90m', gravity: 50, completed: false, startTime: '14:00', endTime: '15:30', date: dates[4] },

    // Saturday scheduled tasks & events (dates[5])
    { id: 1014, type: 'event', title: 'Reading Block', energy: 'light', duration: '60m', gravity: 50, completed: false, startTime: '10:00', endTime: '11:00', date: dates[5], notes: 'Self development literature books' },

    // Monday tasks board chips (dates[0])
    { id: 2001, type: 'task', title: 'Update Jira tickets', energy: 'admin', duration: '15m', gravity: 50, completed: false, date: dates[0] },
    { id: 2002, type: 'task', title: 'Draft email response', energy: 'admin', duration: '10m', gravity: 50, completed: false, date: dates[0] },

    // Tuesday tasks board chips (dates[1])
    { id: 2003, type: 'task', title: 'Design review prep', energy: 'creative', duration: '30m', gravity: 50, completed: false, date: dates[1] },
    { id: 2004, type: 'task', title: 'Fix sidebar bug', energy: 'deep', duration: '20m', gravity: 50, completed: false, date: dates[1] },
    { id: 2005, type: 'task', title: 'Review analytics schema', energy: 'deep', duration: '45m', gravity: 50, completed: false, date: dates[1] },
    { id: 2006, type: 'task', title: 'Prepare slides', energy: 'light', duration: '15m', gravity: 50, completed: false, date: dates[1] },

    // Wednesday tasks board chips (dates[2])
    { id: 2007, type: 'task', title: 'Submit receipts', energy: 'admin', duration: '10m', gravity: 50, completed: false, date: dates[2] },

    // Thursday tasks board chips (dates[3])
    { id: 2008, type: 'task', title: 'Publish blog post draft', energy: 'creative', duration: '40m', gravity: 50, completed: false, date: dates[3] },
    { id: 2009, type: 'task', title: 'Schedule alignment sync', energy: 'social', duration: '15m', gravity: 50, completed: false, date: dates[3] },
    { id: 2010, type: 'task', title: 'Organize drive folders', energy: 'admin', duration: '30m', gravity: 50, completed: false, date: dates[3] },

    // Friday tasks board chips (dates[4])
    { id: 2011, type: 'task', title: 'Test Stripe billing logic', energy: 'deep', duration: '40m', gravity: 50, completed: false, date: dates[4] },
    { id: 2012, type: 'task', title: 'Reply on Slack channels', energy: 'social', duration: '15m', gravity: 50, completed: false, date: dates[4] },
    { id: 2013, type: 'task', title: 'Outline server middleware', energy: 'deep', duration: '30m', gravity: 50, completed: false, date: dates[4] },
    { id: 2014, type: 'task', title: 'Check deployment container logs', energy: 'admin', duration: '10m', gravity: 50, completed: false, date: dates[4] },
    { id: 2015, type: 'task', title: 'Configure database backups', energy: 'deep', duration: '20m', gravity: 50, completed: false, date: dates[4] }
  ];
};

// ORM Database Column Mappers
export const mapRowToTask = (r: any): Task => {
  return {
    id: r.id,
    type: (r.type || 'task'),
    title: r.title || 'Untitled',
    energy: (r.category || r.energy || 'deep') as EnergyType,
    duration: r.duration_minutes !== undefined && r.duration_minutes !== null 
      ? `${r.duration_minutes}m` 
      : (r.duration || '15m'),
    gravity: r.gravity_rank !== undefined && r.gravity_rank !== null 
      ? r.gravity_rank 
      : (r.gravity ?? 50),
    completed: r.is_completed !== undefined && r.is_completed !== null 
      ? r.is_completed 
      : (r.completed ?? false),
    startTime: r.start_time || r.startTime || undefined,
    endTime: r.end_time || r.endTime || undefined,
    notes: r.description || r.notes || undefined,
    date: r.date || undefined,
    inboxStatus: r.inbox_status || r.inboxStatus || undefined,
    capturedAt: r.captured_at || r.capturedAt || undefined,
    captureSource: r.capture_source || r.captureSource || undefined,
    inboxNotes: r.inbox_notes || r.inboxNotes || undefined,
    projectId: r.project_id || r.projectId || undefined
  };
};

export const mapTaskToRow = (task: Partial<Task>, userId?: string | null) => {
  const payload: Record<string, any> = {};
  if (userId) payload.user_id = userId;
  if (task.type !== undefined) payload.type = task.type;
  if (task.title !== undefined) payload.title = task.title;
  if (task.energy !== undefined) {
    payload.category = task.energy;
    payload.energy = task.energy; // mirror both for safety
  }
  if (task.duration !== undefined) {
    const mins = parseInt(task.duration, 10);
    payload.duration_minutes = isNaN(mins) ? null : mins;
    payload.duration = task.duration; // mirror both for safety
  }
  if (task.gravity !== undefined) {
    payload.gravity_rank = task.gravity;
    payload.gravity = task.gravity; // mirror both
  }
  if (task.completed !== undefined) {
    payload.is_completed = task.completed;
    payload.completed = task.completed; // mirror both
  }
  if (task.startTime !== undefined) payload.start_time = task.startTime || null;
  if (task.endTime !== undefined) payload.end_time = task.endTime || null;
  if (task.notes !== undefined) {
    payload.description = task.notes || null;
    payload.notes = task.notes || null; // mirror both
  }
  if (task.date !== undefined) payload.date = task.date || null;
  
  if (task.inboxStatus !== undefined) {
    payload.inbox_status = task.inboxStatus;
    payload.inboxStatus = task.inboxStatus;
  }
  if (task.capturedAt !== undefined) {
    payload.captured_at = task.capturedAt;
    payload.capturedAt = task.capturedAt;
  }
  if (task.captureSource !== undefined) {
    payload.capture_source = task.captureSource;
    payload.captureSource = task.captureSource;
  }
  if (task.inboxNotes !== undefined) {
    payload.inbox_notes = task.inboxNotes;
    payload.inboxNotes = task.inboxNotes;
  }
  if (task.projectId !== undefined) {
    payload.project_id = task.projectId;
    payload.projectId = task.projectId;
  }
  
  return payload;
};

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  useLocalFallback: boolean;
  refetch: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string | number, changes: Partial<Task>) => Promise<Task | null>;
  completeTask: (id: string | number) => Promise<Task | null>;
  deleteTask: (id: string | number) => Promise<boolean>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

// Helper: one-time migration of localStorage tasks to Supabase blocks table
async function migrateLocalToSupabase(userId: string) {
  const MIGRATION_KEY = 'migration_v1_done';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const raw = localStorage.getItem('tempo-tasks-v2') 
           || localStorage.getItem('blocks') 
           || localStorage.getItem('tasks') 
           || '[]';
  let items = [];
  try {
    items = JSON.parse(raw);
  } catch (err) {
    // ignore
  }

  if (Array.isArray(items) && items.length > 0) {
    // Map items to Supabase format
    const rows = items.map(item => {
      const row = mapTaskToRow(item, userId);
      delete row.id; // Let Supabase generate new UUIDs
      return row;
    });

    const { error } = await supabase
      .from('blocks')
      .insert(rows);

    if (!error) {
      console.log(`✓ Migrated ${items.length} items to Supabase`);
    } else {
      console.error("Migration to Supabase failed:", error);
    }
  }

  localStorage.setItem(MIGRATION_KEY, 'true');
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load from LocalStorage and sanitize
  const loadLocalTasks = useCallback((): Task[] => {
    const saved = localStorage.getItem("tempo-tasks-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => t.title?.trim().toLowerCase() !== "de");
        }
      } catch (err) {
        // ignore
      }
    }
    const seed = getInitialTasks();
    localStorage.setItem("tempo-tasks-v2", JSON.stringify(seed));
    return seed;
  }, []);

  // Sync to local storage and update hook state
  const saveLocalTasks = useCallback((updated: Task[]) => {
    const sanitized = updated.filter(t => t.title?.trim().toLowerCase() !== "de");
    localStorage.setItem("tempo-tasks-v2", JSON.stringify(sanitized));
    setTasks(sanitized);
  }, []);

  // Core fetch routine from Supabase
  const fetchTasksFromSupabase = useCallback(async (uid: string) => {
    try {
      setIsLoading(true);
      const { data, error: selectErr } = await supabase
        .from('blocks')
        .select('*')
        .eq('user_id', uid);

      if (selectErr) {
        if (selectErr.code === 'PGRST205' || selectErr.message?.includes('schema cache') || selectErr.message?.includes('Could not find the table')) {
          console.log("Table 'blocks' is missing in Supabase. Falling back to local storage cleanly.");
          setUseLocalFallback(true);
          setTasks(loadLocalTasks());
          setError(null);
          return;
        }
        throw new Error('Supabase unavailable: ' + selectErr.message);
      } else if (data) {
        const mapped = data
          .filter(r => r.title?.trim().toLowerCase() !== 'de')
          .map(mapRowToTask);
        setTasks(mapped);
        setUseLocalFallback(false);
      }
      setError(null);
    } catch (err: any) {
      console.error("Error loading items from Supabase, applying local fallback:", err);
      setError(err);
      setUseLocalFallback(true);
      setTasks(loadLocalTasks());
    } finally {
      setIsLoading(false);
    }
  }, [loadLocalTasks]);

  // Authenticate & listen to user changes & delete corrupted records
  useEffect(() => {
    let active = true;

    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (active) {
        if (session && session.user) {
          setUserId(session.user.id);
          
          // Silently trigger a remote deletion query for any corrupted "de" test records
          try {
            await supabase.from('blocks').delete().eq('title', 'de').eq('user_id', session.user.id);
          } catch (e) {
            // ignore silent clearance
          }

          await migrateLocalToSupabase(session.user.id);
          await fetchTasksFromSupabase(session.user.id);
        } else {
          setUserId(null);
          setUseLocalFallback(true);
          setTasks(loadLocalTasks());
          setIsLoading(false);
        }
      }
    }

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (active) {
        if (session && session.user) {
          setUserId(session.user.id);
          await migrateLocalToSupabase(session.user.id);
          await fetchTasksFromSupabase(session.user.id);
        } else {
          setUserId(null);
          setUseLocalFallback(true);
          setTasks(loadLocalTasks());
          setIsLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchTasksFromSupabase, loadLocalTasks]);

  // Realtime subscription mapping
  useEffect(() => {
    if (useLocalFallback || !userId) return;

    const channel1 = supabase
      .channel('blocks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocks', filter: `user_id=eq.${userId}` },
        () => { fetchTasksFromSupabase(userId); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
    };
  }, [useLocalFallback, userId, fetchTasksFromSupabase]);

  const refetch = useCallback(async () => {
    if (userId && !useLocalFallback) {
      await fetchTasksFromSupabase(userId);
    } else {
      setTasks(loadLocalTasks());
    }
  }, [userId, useLocalFallback, fetchTasksFromSupabase, loadLocalTasks]);

  // Create Task (Unified)
  const createTask = useCallback(async (data: Partial<Task>): Promise<Task | null> => {
    const tempId = Date.now();
    const finalType = data.type || (data.startTime && data.endTime ? 'scheduled_task' : 'task');
    
    const newTask: Task = {
      id: tempId,
      type: finalType,
      title: data.title || "Untitled",
      energy: data.energy || "deep",
      duration: data.duration || "15m",
      gravity: data.gravity ?? 50,
      completed: data.completed ?? false,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      date: data.date,
      inboxStatus: data.inboxStatus,
      capturedAt: data.capturedAt,
      captureSource: data.captureSource,
      inboxNotes: data.inboxNotes,
      projectId: data.projectId
    };

    // Keep state clean of "de"
    if (newTask.title.trim().toLowerCase() === "de") {
      return null;
    }

    const previousTasks = [...tasks];
    setTasks(prev => [newTask, ...prev]);

    if (useLocalFallback || !userId) {
      const updated = [newTask, ...previousTasks];
      saveLocalTasks(updated);
      return newTask;
    } else {
      try {
        const payload = mapTaskToRow(newTask, userId);
        
        const { data: inserted, error: insertErr } = await supabase
          .from('blocks')
          .insert(payload)
          .select()
          .single();

        if (insertErr) {
          throw new Error('Supabase unavailable: ' + insertErr.message);
        }

        const confirmedTask = mapRowToTask(inserted);
        setTasks(prev => prev.map(t => t.id === tempId ? confirmedTask : t));
        return confirmedTask;
      } catch (err: any) {
        console.error("Failed to insert into Supabase, reverting optimistic change:", err);
        setTasks(previousTasks);
        triggerAppToast(`Failed to save: ${err.message || err}`);
        return null;
      }
    }
  }, [tasks, useLocalFallback, userId, saveLocalTasks]);

  // Update Task (Unified)
  const updateTask = useCallback(async (id: string | number, changes: Partial<Task>): Promise<Task | null> => {
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...changes } : t);
    setTasks(updatedTasks);

    if (useLocalFallback || !userId) {
      saveLocalTasks(updatedTasks);
      return updatedTasks.find(t => t.id === id) || null;
    } else {
      try {
        const payload = mapTaskToRow(changes);
        
        // Attempt update on blocks
        const { error: updateErr } = await supabase
          .from('blocks')
          .update(payload)
          .eq('id', id);

        if (updateErr) {
          throw new Error('Supabase unavailable: ' + updateErr.message);
        }
        return updatedTasks.find(t => t.id === id) || null;
      } catch (err: any) {
        console.error("Failed to update on Supabase, reverting:", err);
        setTasks(previousTasks);
        triggerAppToast(`Error updating: ${err.message || err}`);
        return null;
      }
    }
  }, [tasks, useLocalFallback, userId, saveLocalTasks]);

  // Complete Task fast-track
  const completeTask = useCallback(async (id: string | number): Promise<Task | null> => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return null;
    return await updateTask(id, { completed: !taskToUpdate.completed });
  }, [tasks, updateTask]);

  // Delete Task (Unified)
  const deleteTask = useCallback(async (id: string | number): Promise<boolean> => {
    const previousTasks = [...tasks];
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);

    if (useLocalFallback || !userId) {
      saveLocalTasks(updatedTasks);
      return true;
    } else {
      try {
        const { error: deleteErr } = await supabase
          .from('blocks')
          .delete()
          .eq('id', id);

        if (deleteErr) {
          throw new Error('Supabase unavailable: ' + deleteErr.message);
        }
        return true;
      } catch (err: any) {
        console.error("Failed to delete on Supabase, reverting:", err);
        setTasks(previousTasks);
        triggerAppToast(`Error deleting: ${err.message || err}`);
        return false;
      }
    }
  }, [tasks, useLocalFallback, userId, saveLocalTasks]);

  const value = useMemo(() => ({
    tasks,
    isLoading,
    error,
    useLocalFallback,
    refetch,
    createTask,
    updateTask,
    completeTask,
    deleteTask
  }), [tasks, isLoading, error, useLocalFallback, refetch, createTask, updateTask, completeTask, deleteTask]);

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksData() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasksData must be used within a TasksProvider');
  }
  return context;
}
