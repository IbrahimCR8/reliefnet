import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/types';

export async function getCurrentUser(): Promise<{ user: Profile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase not configured' };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, error: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { user: null, error: profileError.message };
    }

    return { user: profile as Profile, error: null };
  } catch (err) {
    return { user: null, error: String(err) };
  }
}

export async function requireCoordinator(): Promise<Profile> {
  const { user, error } = await getCurrentUser();
  if (error) throw new Error(error);
  if (!user) throw new Error('Not authenticated');
  if (user.role !== 'coordinator' && user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }
  return user;
}
