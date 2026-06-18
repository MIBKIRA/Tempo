import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export interface DailyIntentionRow {
  id: string;
  user_id: string;
  date: string;
  priority_1: string | null;
  priority_2: string | null;
  priority_3: string | null;
  created_at: string;
  updated_at: string;
}

export function useMorningIntentions() {
  const [intentionsRow, setIntentionsRow] = useState<DailyIntentionRow | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [useLocalFallback, setUseLocalFallback] = useState<boolean>(false);

  const fetchIntentions = useCallback(async (uid: string) => {
    setIsLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      console.log('[useMorningIntentions] Fetching daily intentions for user:', uid, 'date:', todayStr);
      const { data, error } = await supabase
        .from('daily_intentions')
        .select('*')
        .eq('user_id', uid)
        .eq('date', todayStr)
        .maybeSingle();

      if (error) {
        console.warn('[useMorningIntentions] Supabase query error, activating local fallback:', error);
        setUseLocalFallback(true);
        
        // Fallback load
        const key = `tempo-daily-intentions-${uid}`;
        const localDataRaw = localStorage.getItem(key);
        let localRow: DailyIntentionRow | null = null;
        if (localDataRaw) {
          try {
            const parsed = JSON.parse(localDataRaw);
            if (parsed && parsed.date === todayStr) {
              localRow = parsed;
            }
          } catch (_) {}
        }

        if (localRow) {
          console.log('[useMorningIntentions] Loaded today from localStorage fallback:', localRow);
          setIntentionsRow(localRow);
          setShowModal(false);
        } else {
          console.log('[useMorningIntentions] No items for today in fallback. Triggering modal.');
          setIntentionsRow(null);
          setTimeout(() => {
            setShowModal(true);
          }, 400);
        }
      } else if (data) {
        console.log('[useMorningIntentions] Fetched intentions successfully from database:', data);
        setIntentionsRow(data);
        setShowModal(false);
      } else {
        console.log('[useMorningIntentions] No intentions record exists for today in database. Triggering modal.');
        setIntentionsRow(null);
        setTimeout(() => {
          setShowModal(true);
        }, 400);
      }
    } catch (err) {
      console.warn('[useMorningIntentions] Unexpected fetch error, activating local fallback:', err);
      setUseLocalFallback(true);
      
      const key = `tempo-daily-intentions-${uid}`;
      const localDataRaw = localStorage.getItem(key);
      let localRow: DailyIntentionRow | null = null;
      if (localDataRaw) {
        try {
          const parsed = JSON.parse(localDataRaw);
          if (parsed && parsed.date === todayStr) {
            localRow = parsed;
          }
        } catch (_) {}
      }

      if (localRow) {
        setIntentionsRow(localRow);
        setShowModal(false);
      } else {
        setIntentionsRow(null);
        setTimeout(() => {
          setShowModal(true);
        }, 400);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user) {
        setUserId(session.user.id);
        const nameMetadata = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Adrian Vance';
        setUserName(nameMetadata);
        await fetchIntentions(session.user.id);
      } else {
        setIsLoading(false);
      }
    }

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (session?.user) {
        setUserId(session.user.id);
        const nameMetadata = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Adrian Vance';
        setUserName(nameMetadata);
        await fetchIntentions(session.user.id);
      } else {
        setUserId(null);
        setIntentionsRow(null);
        setShowModal(false);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchIntentions]);

  const saveIntentions = useCallback(async (p1: string | null, p2: string | null, p3: string | null) => {
    if (!userId) return false;
    const todayStr = new Date().toISOString().split('T')[0];

    const payload = {
      user_id: userId,
      date: todayStr,
      priority_1: p1,
      priority_2: p2,
      priority_3: p3,
      updated_at: new Date().toISOString()
    };

    // If local fallback is NOT active, try Supabase first
    if (!useLocalFallback) {
      try {
        const { error } = await supabase
          .from('daily_intentions')
          .upsert(payload, { onConflict: 'user_id,date' });

        if (!error) {
          console.log('[useMorningIntentions] Successfully upserted intentions to database.');
          const { data } = await supabase
            .from('daily_intentions')
            .select('*')
            .eq('user_id', userId)
            .eq('date', todayStr)
            .maybeSingle();
          if (data) {
            setIntentionsRow(data);
            return true;
          }
        } else {
          console.warn('[useMorningIntentions] Error saving to database, falling back to local:', error);
          setUseLocalFallback(true);
        }
      } catch (err) {
        console.warn('[useMorningIntentions] Failed saving to database, falling back to local:', err);
        setUseLocalFallback(true);
      }
    }

    // Local Storage Save
    const key = `tempo-daily-intentions-${userId}`;
    const localRow: DailyIntentionRow = {
      id: 'local-' + todayStr,
      user_id: userId,
      date: todayStr,
      priority_1: p1,
      priority_2: p2,
      priority_3: p3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(localRow));
    console.log('[useMorningIntentions] Saved intentions to localStorage fallback.');
    setIntentionsRow(localRow);
    return true;
  }, [userId, useLocalFallback]);

  const skipIntentions = useCallback(async () => {
    return saveIntentions(null, null, null);
  }, [saveIntentions]);

  return {
    intentionsRow,
    showModal,
    setShowModal,
    isLoading,
    userId,
    userName,
    saveIntentions,
    skipIntentions,
    refetch: () => userId && fetchIntentions(userId)
  };
}
