import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  frequency: string;
  target_count: number;
  is_active: boolean;
  created_at: string;
  sort_order: number;
}

export interface DbHabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  logged_date: string;
  created_at: string;
}

export function useHabitsData() {
  const [habits, setHabits] = useState<DbHabit[]>([]);
  const [habitsAll, setHabitsAll] = useState<DbHabit[]>([]); // holds both active and inactive for calculations like mindate
  const [logs, setLogs] = useState<DbHabitLog[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const getLocalDateString = useCallback((d: Date = new Date()): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Fetch all user session data
  const fetchData = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (habitsError) throw habitsError;

      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId);

      if (logsError) throw logsError;

      const habitsList = habitsData || [];
      setHabitsAll(habitsList);
      setHabits(habitsList.filter((h: DbHabit) => h.is_active));
      setLogs(logsData || []);
    } catch (err: any) {
      console.error('Error fetching habits/logs:', err);
      setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync auth state
  useEffect(() => {
    let active = true;
    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user) {
        setCurrentUser(session.user);
        fetchData(session.user.id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (user) {
          setCurrentUser(user);
          fetchData(user.id);
        } else {
          setIsLoading(false);
        }
      }
    }
    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setCurrentUser(session?.user || null);
        if (session?.user) {
          fetchData(session.user.id);
        } else {
          setHabits([]);
          setHabitsAll([]);
          setLogs([]);
          setIsLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [fetchData]);

  // Realtime Postgres Changes
  useEffect(() => {
    if (!currentUser) return;

    const habitsChannel = supabase
      .channel('habits_changes_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchData(currentUser.id);
      })
      .subscribe();

    const logsChannel = supabase
      .channel('logs_changes_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchData(currentUser.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(habitsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [currentUser, fetchData]);

  // Today Logs List
  const todayStr = getLocalDateString(new Date());
  const todayLogs = logs
    .filter(log => log.logged_date === todayStr)
    .map(log => log.habit_id);

  // CRUD Actions
  const checkIn = useCallback(async (habitId: string) => {
    if (!currentUser) return;
    const dateStr = getLocalDateString(new Date());
    
    // Optimistic state update
    const tempId = `temp-${Date.now()}`;
    const newLogObj: DbHabitLog = {
      id: tempId,
      habit_id: habitId,
      user_id: currentUser.id,
      logged_date: dateStr,
      created_at: new Date().toISOString()
    };
    setLogs(prev => [...prev.filter(l => !(l.habit_id === habitId && l.logged_date === dateStr)), newLogObj]);

    try {
      const { error } = await supabase
        .from('habit_logs')
        .upsert(
          { habit_id: habitId, user_id: currentUser.id, logged_date: dateStr },
          { onConflict: 'habit_id,logged_date' }
        );
      if (error) throw error;
      // Fetch full DB state to sync
      fetchData(currentUser.id);
    } catch (err) {
      console.error('Checkin failed:', err);
      // Revert optimistic update
      setLogs(prev => prev.filter(l => l.id !== tempId));
    }
  }, [currentUser, fetchData, getLocalDateString]);

  const uncheckIn = useCallback(async (habitId: string) => {
    if (!currentUser) return;
    const dateStr = getLocalDateString(new Date());

    // Optimistic state update
    setLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.logged_date === dateStr)));

    try {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('logged_date', dateStr)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      // Fetch full DB state to sync
      fetchData(currentUser.id);
    } catch (err) {
      console.error('Uncheckin failed:', err);
      fetchData(currentUser.id); // revert
    }
  }, [currentUser, fetchData, getLocalDateString]);

  const addHabit = useCallback(async (
    name: string,
    icon: string = '✓',
    color: string = '#7C3AED',
    category: string = 'Light',
    frequency: string = 'daily'
  ) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: currentUser.id,
          name,
          icon,
          color,
          category,
          frequency,
          target_count: 1,
          is_active: true,
          sort_order: habits.length
        });
      if (error) throw error;
      fetchData(currentUser.id);
    } catch (err) {
      console.error('Add habit failed:', err);
    }
  }, [currentUser, habits.length, fetchData]);

  const deleteHabit = useCallback(async (habitId: string, hardDelete: boolean = false) => {
    if (!currentUser) return;
    try {
      if (hardDelete) {
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', habitId)
          .eq('user_id', currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habits')
          .update({ is_active: false })
          .eq('id', habitId)
          .eq('user_id', currentUser.id);
        if (error) throw error;
      }
      fetchData(currentUser.id);
    } catch (err) {
      console.error('Delete habit failed:', err);
    }
  }, [currentUser, fetchData]);

  const editHabit = useCallback(async (habitId: string, changes: Partial<DbHabit>) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('habits')
        .update(changes)
        .eq('id', habitId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      fetchData(currentUser.id);
    } catch (err) {
      console.error('Edit habit failed:', err);
    }
  }, [currentUser, fetchData]);

  const getLogs = useCallback((habitId: string, daysCount: number) => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < daysCount; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const checkStr = getLocalDateString(checkDate);
      const isLogged = logs.some(log => log.habit_id === habitId && log.logged_date === checkStr);
      if (isLogged) {
        list.push(checkStr);
      }
    }
    return list;
  }, [logs, getLocalDateString]);

  // Computed Values
  const getStreak = useCallback((habitId: string) => {
    const currentTodayStr = getLocalDateString(new Date());
    const hasToday = logs.some(log => log.habit_id === habitId && log.logged_date === currentTodayStr);

    let streak = hasToday ? 1 : 0;
    
    // Check backwards starting from yesterday
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (true) {
      const checkStr = getLocalDateString(checkDate);
      const index = logs.some(log => log.habit_id === habitId && log.logged_date === checkStr);
      if (index) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [logs, getLocalDateString]);

  const getBestStreak = useCallback((habitId: string) => {
    const habitLogs: string[] = logs
      .filter(log => log.habit_id === habitId)
      .map(log => log.logged_date);
    
    const uniqueDates: string[] = Array.from(new Set(habitLogs)).sort();
    if (uniqueDates.length === 0) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    const dates = uniqueDates.map((dStr: string) => {
      const [y, m, d] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0).getTime();
    });
    
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const diff = dates[i] - dates[i - 1];
        if (Math.abs(diff - oneDayMs) < 2 * 60 * 60 * 1000) {
          currentStreak++;
        } else if (diff > oneDayMs) {
          currentStreak = 1;
        }
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
    return maxStreak;
  }, [logs]);

  const getCompletionRate = useCallback((habitId: string, daysCount: number) => {
    let completedCount = 0;
    const today = new Date();
    for (let i = 0; i < daysCount; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const checkStr = getLocalDateString(checkDate);
      const isLogged = logs.some(log => log.habit_id === habitId && log.logged_date === checkStr);
      if (isLogged) {
        completedCount++;
      }
    }
    return daysCount > 0 ? Math.round((completedCount / daysCount) * 100) : 0;
  }, [logs, getLocalDateString]);

  const getTodayProgress = useCallback(() => {
    const currentTodayStr = getLocalDateString(new Date());
    const completed = habits.filter(h => 
      logs.some(log => log.habit_id === h.id && log.logged_date === currentTodayStr)
    ).length;
    return { completed, total: habits.length };
  }, [habits, logs, getLocalDateString]);

  const getCurrentWeekDates = useCallback((): string[] => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      dates.push(getLocalDateString(current));
    }
    return dates;
  }, [getLocalDateString]);

  const getWeekCompletionRates = useCallback((): number[] => {
    const dates = getCurrentWeekDates();
    if (habits.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    return dates.map(dStr => {
      const completedOnDay = habits.filter(h => 
        logs.some(log => log.habit_id === h.id && log.logged_date === dStr)
      ).length;
      return Math.round((completedOnDay / habits.length) * 100);
    });
  }, [habits, logs, getCurrentWeekDates]);

  const getWeekScore = useCallback(() => {
    const rates = getWeekCompletionRates();
    const sum = rates.reduce((acc, r) => acc + r, 0);
    return Math.round(sum / 7);
  }, [getWeekCompletionRates]);

  const getAllTimeCount = useCallback(() => {
    return logs.length;
  }, [logs]);

  const getUserSinceDate = useCallback(() => {
    if (habitsAll.length === 0) return 'Since June 2026';
    const dates = habitsAll.map(h => new Date(h.created_at || new Date()).getTime());
    const minTime = Math.min(...dates);
    const minDate = new Date(minTime);
    return `Since ${minDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }, [habitsAll]);

  // Overall Consecutive Streak of doing AT LEAST one habit:
  const getOverallStreak = useCallback(() => {
    let streak = 0;
    // Check did they do at least 1 habit today?
    const currentTodayStr = getLocalDateString(new Date());
    const hasToday = logs.some(log => log.logged_date === currentTodayStr);

    if (hasToday) {
      streak = 1;
    }

    // Check backwards starting from yesterday
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (true) {
      const checkStr = getLocalDateString(checkDate);
      const index = logs.some(log => log.logged_date === checkStr);
      if (index) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [logs, getLocalDateString]);

  return {
    habits,
    habitsAll,
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
  };
}
