import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Task, EnergyType } from './types';

// Decoupled Helper: trigger a toast notification by dispatching a custom event
export const triggerAppToast = (msg: string) => {
  window.dispatchEvent(new CustomEvent('tempo-trigger-toast', { detail: { message: msg } }));
};

// Seeding function for initial items when in fallback/localStorage mode
export const getInitialTasks = (): Task[] => {
  return [];
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
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSynced: Date | null;
  refetch: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string | number, changes: Partial<Task>) => Promise<Task | null>;
  completeTask: (id: string | number) => Promise<Task | null>;
  deleteTask: (id: string | number) => Promise<boolean>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

let isMigrating = false;

// Helper: one-time migration of localStorage tasks to Supabase blocks table
async function migrateLocalToSupabase(userId: string) {
  const MIGRATION_KEY = 'migration_v1_done';
  if (localStorage.getItem(MIGRATION_KEY)) return;
  if (isMigrating) return;
  isMigrating = true;
  localStorage.setItem(MIGRATION_KEY, 'true');

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
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());

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
      setSyncStatus('syncing');
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
          setSyncStatus('synced');
          setLastSynced(new Date());
          return;
        }
        throw new Error('Supabase unavailable: ' + selectErr.message);
      } else if (data) {
        const mapped = data
          .filter(r => r.title?.trim().toLowerCase() !== 'de')
          .map(mapRowToTask);
        setTasks(mapped);
        setUseLocalFallback(false);
        setSyncStatus('synced');
        setLastSynced(new Date());
      }
      setError(null);
    } catch (err: any) {
      console.error("Error loading items from Supabase, applying local fallback:", err);
      setError(err);
      setUseLocalFallback(true);
      setTasks(loadLocalTasks());
      setSyncStatus('error');
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
      setSyncStatus('synced');
      setLastSynced(new Date());
      return newTask;
    } else {
      try {
        setSyncStatus('syncing');
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
        setSyncStatus('synced');
        setLastSynced(new Date());
        return confirmedTask;
      } catch (err: any) {
        console.error("Failed to insert into Supabase, reverting optimistic change:", err);
        setTasks(previousTasks);
        setSyncStatus('error');
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
      setSyncStatus('synced');
      setLastSynced(new Date());
      return updatedTasks.find(t => t.id === id) || null;
    } else {
      try {
        setSyncStatus('syncing');
        const payload = mapTaskToRow(changes);
        
        // Attempt update on blocks
        const { error: updateErr } = await supabase
          .from('blocks')
          .update(payload)
          .eq('id', id);

        if (updateErr) {
          throw new Error('Supabase unavailable: ' + updateErr.message);
        }
        setSyncStatus('synced');
        setLastSynced(new Date());
        return updatedTasks.find(t => t.id === id) || null;
      } catch (err: any) {
        console.error("Failed to update on Supabase, reverting:", err);
        setTasks(previousTasks);
        setSyncStatus('error');
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
      setSyncStatus('synced');
      setLastSynced(new Date());
      return true;
    } else {
      try {
        setSyncStatus('syncing');
        const { error: deleteErr } = await supabase
          .from('blocks')
          .delete()
          .eq('id', id);

        if (deleteErr) {
          throw new Error('Supabase unavailable: ' + deleteErr.message);
        }
        setSyncStatus('synced');
        setLastSynced(new Date());
        return true;
      } catch (err: any) {
        console.error("Failed to delete on Supabase, reverting:", err);
        setTasks(previousTasks);
        setSyncStatus('error');
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
    syncStatus,
    lastSynced,
    refetch,
    createTask,
    updateTask,
    completeTask,
    deleteTask
  }), [tasks, isLoading, error, useLocalFallback, syncStatus, lastSynced, refetch, createTask, updateTask, completeTask, deleteTask]);

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
