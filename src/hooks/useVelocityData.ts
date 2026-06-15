import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Task } from '../types';
import { mapRowToTask } from '../TasksContext';

export interface WeekStats {
  blocks: Task[];
  total: number;
  completed: number;
  completionRate: number;
  focusHours: number;
  timeDebt: number; // in minutes
  overdueCount: number;
  byDay: { date: string; planned: number; completed: number; isAlert?: boolean }[];
  byCategory: { category: string; count: number; minutes: number }[];
  byHour: { day: number; hour: number; count: number }[];
  overdueBlocks: { id: string; task: string; count: number }[];
}

const getLocalDateString = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDurationToMinutes = (dur: string | number | null | undefined): number => {
  if (dur === null || dur === undefined) return 0;
  if (typeof dur === 'number') return dur;
  const match = dur.match(/^(\d+)(m|h)?/i);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase();
  if (unit === 'h') return value * 60;
  return value;
};

const getDaysOverdue = (blockDateStr: string, todayStr: string): number => {
  const bDate = new Date(blockDateStr);
  const tDate = new Date(todayStr);
  bDate.setHours(0, 0, 0, 0);
  tDate.setHours(0, 0, 0, 0);
  const diffTime = tDate.getTime() - bDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const loadLocalTasks = (): Task[] => {
  const saved = localStorage.getItem("tempo-tasks-v2");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (err) {
      // ignore
    }
  }
  return [];
};

const computeWeekStats = (
  weekTasks: Task[],
  overdueTasks: Task[],
  todayStr: string,
  weekDates: string[]
): WeekStats => {
  const total = weekTasks.length;
  const completedTasks = weekTasks.filter(t => t.completed);
  const completed = completedTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // SUM(duration_minutes WHERE category='Deep') / 60
  const deepMinutes = weekTasks
    .filter(t => t.energy?.toLowerCase() === 'deep')
    .reduce((sum, t) => sum + parseDurationToMinutes(t.duration), 0);
  const focusHours = parseFloat((deepMinutes / 60).toFixed(1));

  // timeDebt: SUM(duration_minutes WHERE is_completed=FALSE AND date < today) in minutes
  const timeDebt = overdueTasks.reduce((sum, t) => sum + parseDurationToMinutes(t.duration), 0);
  const overdueCount = overdueTasks.length;

  // byDay: 7 items (Mon -> Sun)
  const byDay = weekDates.map(dateStr => {
    const dayTasks = weekTasks.filter(t => t.date === dateStr);
    const dayCompleted = dayTasks.filter(t => t.completed).length;
    return {
      date: dateStr,
      planned: dayTasks.length,
      completed: dayCompleted,
      isAlert: false
    };
  });

  // Flag days if completed < planned * 0.6
  byDay.forEach(day => {
    if (day.planned > 0 && day.completed < day.planned * 0.6) {
      day.isAlert = true;
    }
  });

  // byCategory
  const categoryMap: Record<string, { count: number; minutes: number }> = {
    deep: { count: 0, minutes: 0 },
    admin: { count: 0, minutes: 0 },
    creative: { count: 0, minutes: 0 },
    social: { count: 0, minutes: 0 },
    light: { count: 0, minutes: 0 }
  };

  weekTasks.forEach(t => {
    const cat = t.energy?.toLowerCase();
    if (categoryMap[cat] !== undefined) {
      categoryMap[cat].count += 1;
      categoryMap[cat].minutes += parseDurationToMinutes(t.duration);
    }
  });

  const byCategory = Object.entries(categoryMap)
    .map(([cat, info]) => ({
      category: cat,
      count: info.count,
      minutes: info.minutes
    }))
    .filter(item => item.count > 0);

  // byHour for heatmap
  const byHour: { day: number; hour: number; count: number }[] = [];
  const dayOfWeekIndexMap: Record<string, number> = {};
  for (let i = 0; i < 5; i++) { // Mon-Fri
    dayOfWeekIndexMap[weekDates[i]] = i;
  }

  completedTasks.forEach(t => {
    if (!t.date || !t.startTime) return;
    const dayIndex = dayOfWeekIndexMap[t.date];
    if (dayIndex === undefined) return;

    const matchHour = t.startTime.match(/^(\d+):/);
    if (!matchHour) return;
    const hour = parseInt(matchHour[1], 10);
    if (hour >= 6 && hour <= 23) {
      const existing = byHour.find(x => x.day === dayIndex && x.hour === hour);
      if (existing) {
        existing.count += 1;
      } else {
        byHour.push({ day: dayIndex, hour, count: 1 });
      }
    }
  });

  // overdueBlocks for postpone chart
  const groupMap: Record<string, { maxDays: number; id: string | number }> = {};
  overdueTasks.forEach(t => {
    const title = (t.title || 'Untitled').trim();
    if (!t.date) return;
    const days = getDaysOverdue(t.date, todayStr);
    if (groupMap[title]) {
      if (days > groupMap[title].maxDays) {
        groupMap[title].maxDays = days;
        groupMap[title].id = t.id;
      }
    } else {
      groupMap[title] = {
        maxDays: days,
        id: t.id
      };
    }
  });

  const overdueBlocks = Object.entries(groupMap)
    .map(([title, info]) => ({
      id: info.id.toString(),
      task: title,
      count: info.maxDays
    }))
    .sort((a, b) => b.count - a.count);

  return {
    blocks: weekTasks,
    total,
    completed,
    completionRate,
    focusHours,
    timeDebt,
    overdueCount,
    byDay,
    byCategory,
    byHour,
    overdueBlocks
  };
};

const defaultStats = (): WeekStats => ({
  blocks: [],
  total: 0,
  completed: 0,
  completionRate: 0,
  focusHours: 0,
  timeDebt: 0,
  overdueCount: 0,
  byDay: [],
  byCategory: [],
  byHour: [],
  overdueBlocks: []
});

export function useVelocityData(weekStart: Date) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // States for final calculations
  const [thisWeek, setThisWeek] = useState<WeekStats>(defaultStats());
  const [lastWeek, setLastWeek] = useState<Partial<WeekStats>>({
    total: 0,
    completed: 0,
    completionRate: 0,
    focusHours: 0,
    timeDebt: 0
  });

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  const thisWeekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime());
      d.setDate(weekStart.getDate() + i);
      dates.push(getLocalDateString(d));
    }
    return dates;
  }, [weekStart]);

  const lastWeekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime());
      d.setDate(weekStart.getDate() - 7 + i);
      dates.push(getLocalDateString(d));
    }
    return dates;
  }, [weekStart]);

  // Auth synchronization
  useEffect(() => {
    let active = true;
    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (user) {
          setCurrentUser(user);
        }
      }
    }
    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setCurrentUser(session?.user || null);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchVelocity = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        // Query database in parallel
        const [thisWeekRes, lastWeekRes, overdueRes] = await Promise.all([
          supabase
            .from('blocks')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('date', thisWeekDates[0])
            .lte('date', thisWeekDates[6]),
          supabase
            .from('blocks')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('date', lastWeekDates[0])
            .lte('date', lastWeekDates[6]),
          supabase
            .from('blocks')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_completed', false)
            .lt('date', todayStr)
        ]);

        if (thisWeekRes.error && thisWeekRes.error.code !== 'PGRST205') {
          throw thisWeekRes.error;
        }

        // Check if table missing, if so, trigger local fallback
        if (thisWeekRes.error?.code === 'PGRST205' || thisWeekRes.error?.message?.includes('Could not find the table')) {
          console.warn("Table 'blocks' missing from Supabase, applying local fallback inside useVelocityData.");
          throw new Error("fallback_to_local");
        }

        const twTasks = (thisWeekRes.data || []).map(mapRowToTask);
        const lwTasks = (lastWeekRes.data || []).map(mapRowToTask);
        const ovTasks = (overdueRes.data || []).map(mapRowToTask);

        // Compute of last week (focus hours, time debt, total, completed)
        const lwStats = computeWeekStats(lwTasks, [], todayStr, lastWeekDates);

        // Compute of this week
        const twStats = computeWeekStats(twTasks, ovTasks, todayStr, thisWeekDates);

        setThisWeek(twStats);
        setLastWeek({
          total: lwStats.total,
          completed: lwStats.completed,
          completionRate: lwStats.completionRate,
          focusHours: lwStats.focusHours,
          timeDebt: lwStats.timeDebt
        });
        setError(null);
      } else {
        // Fallback to local storage tasks
        throw new Error("fallback_to_local");
      }
    } catch (err: any) {
      // Local fallback logic
      const localTasks = loadLocalTasks();

      const twLocal = localTasks.filter(t => t.date && t.date >= thisWeekDates[0] && t.date <= thisWeekDates[6]);
      const lwLocal = localTasks.filter(t => t.date && t.date >= lastWeekDates[0] && t.date <= lastWeekDates[6]);
      const ovLocal = localTasks.filter(t => !t.completed && t.date && t.date < todayStr);

      const lwStats = computeWeekStats(lwLocal, [], todayStr, lastWeekDates);
      const twStats = computeWeekStats(twLocal, ovLocal, todayStr, thisWeekDates);

      setThisWeek(twStats);
      setLastWeek({
        total: lwStats.total,
        completed: lwStats.completed,
        completionRate: lwStats.completionRate,
        focusHours: lwStats.focusHours,
        timeDebt: lwStats.timeDebt
      });

      if (err.message !== "fallback_to_local") {
        console.error("Supabase query error:", err);
        setError(err);
      } else {
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, thisWeekDates, lastWeekDates, todayStr]);

  useEffect(() => {
    fetchVelocity();
  }, [fetchVelocity]);

  // Realtime subscription for Supabase changes
  useEffect(() => {
    if (!currentUser) return;

    const blocksChannel = supabase
      .channel('blocks_velocity_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchVelocity();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(blocksChannel);
    };
  }, [currentUser, fetchVelocity]);

  return {
    thisWeek,
    lastWeek,
    isLoading,
    error,
    refetch: fetchVelocity
  };
}
