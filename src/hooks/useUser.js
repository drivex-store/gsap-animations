'use client';

// Variable Mapping: e -> user / supabaseClient / event, t -> setUser, i -> loading / authError / subscription, n -> setLoading / profile, r -> fetchUser / authUser

import { useState, useEffect } from 'react'; // NOTE: module id: 271645
import { createClient } from '@/libs/supabase/client'; // NOTE: module id: 416983

// NOTE: module id: 76624
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setUser(null);
          return;
        }

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email,
          name:
            profile?.name ||
            profile?.display_name ||
            authUser.email?.split('@')[0] ||
            'User',
          avatarUrl: profile?.avatar_url,
          avatarIndex: profile?.avatar_index || 0,
          subscriptionStatus: profile?.subscription_status || 'free',
          hasAccess: profile?.has_access || false,
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    hasAccess: !loading && (user?.hasAccess || false),
    isAuthenticated: !loading && !!user,
  };
}
