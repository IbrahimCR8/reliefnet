'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

interface UseAuthResult {
  user: Profile | null;
  loading: boolean;
  isCoordinator: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            setUser((profile as Profile) || null);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
    } catch {
      // Ignored
    }
  };

  return {
    user,
    loading,
    isCoordinator: user?.role === 'coordinator' || user?.role === 'admin',
    signOut,
  };
}
