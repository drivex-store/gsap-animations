'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { analytics, trackRetention } from '@/libs/auth/analytics';
import { createClient } from '@/libs/supabase/client';

function nullIfUndefined(value) {
  return value === undefined ? null : value;
}

function buildPersonProperties(profile, authUser = null) {
  const safeProfile = profile || {};

  return {
    created_at: nullIfUndefined(safeProfile.created_at || authUser?.created_at),
    has_access: !!safeProfile.has_access,
    is_paying: !!safeProfile.has_access,
    plan_name: nullIfUndefined(safeProfile.plan_name),
    subscription_status: nullIfUndefined(safeProfile.subscription_status),
    is_lifetime: !!safeProfile.is_lifetime,
    is_legacy_user: !!safeProfile.is_legacy_user,
    is_partner: !!safeProfile.is_partner,
    is_super_admin: !!safeProfile.is_super_admin,
    founding_member_since: nullIfUndefined(safeProfile.founding_member_since),
    current_team_id: nullIfUndefined(safeProfile.current_team_id),
    onboarding_completed: !!safeProfile.onboarding_completed,
    preferred_platform: nullIfUndefined(safeProfile.preferred_platform),
    ft_source: nullIfUndefined(safeProfile.ft_source),
    ft_medium: nullIfUndefined(safeProfile.ft_medium),
    ft_campaign: nullIfUndefined(safeProfile.ft_campaign),
    ft_channel: nullIfUndefined(safeProfile.ft_channel),
    ft_at: nullIfUndefined(safeProfile.ft_at),
  };
}

function syncPostHogUser(userId, profile, authUser) {
  const posthog = window.posthog;
  if (!posthog || typeof posthog.identify !== 'function') {
    return;
  }

  const properties = buildPersonProperties(profile, authUser);

  if (typeof posthog.get_distinct_id === 'function' && posthog.get_distinct_id() === userId) {
    if (typeof posthog.setPersonProperties === 'function') {
      posthog.setPersonProperties(properties);
    }
  } else {
    posthog.identify(userId, properties);
  }
}

function trackSignInOnce(userId, provider) {
  if (userId) {
    try {
      const storageKey = `anm_signed_in:${userId}`;
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, '1');
    } catch {}
  }

  analytics.user.signedIn(provider);
}

const UserContext = createContext({
  user: null,
  profile: null,
  loading: true,
  hasAccess: false,
  isAuthenticated: false,
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function UserProvider({ children, initialUser = null, initialProfile = null }) {
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchUserData = async () => {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(authUser);

      const { data: userProfile } = await supabase.from('users').select('*').eq('id', authUser.id).single();

      if (userProfile) {
        setProfile(userProfile);
        syncPostHogUser(authUser.id, userProfile, authUser);
        if (authUser.created_at) {
          trackRetention(authUser.id, authUser.created_at);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) {
      return { error: 'No user logged in' };
    }

    setProfile((prevProfile) => ({ ...prevProfile, ...updates }));

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(updatedProfile);
      analytics.user.profileUpdated(Object.keys(updates || {}));

      if (updates && updates.theme_preference) {
        analytics.user.themeChanged(updates.theme_preference);
      }

      if (window.posthog?.setPersonProperties) {
        window.posthog.setPersonProperties(buildPersonProperties(updatedProfile, user));
      }

      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfile(profile);
      return { data: null, error };
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      return;
    }

    try {
      const { data: refreshedProfile } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    fetchUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const rawProvider = session?.user?.app_metadata?.provider;
        const provider = rawProvider && rawProvider !== 'email' ? rawProvider : 'magic_link';
        trackSignInOnce(session?.user?.id, provider);
        fetchUserData();
      } else if (event === 'TOKEN_REFRESHED') {
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);

        try {
          for (let index = sessionStorage.length - 1; index >= 0; index--) {
            const key = sessionStorage.key(index);
            if (key && key.startsWith('anm_signed_in:')) {
              sessionStorage.removeItem(key);
            }
          }
        } catch {}

        analytics.user.signedOut();
        analytics.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const channel = supabase
      .channel(`user_profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new);
          syncPostHogUser(user.id, payload.new, user);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase]);

  const hasAccess = !loading && (profile?.has_access || false);
  const isAuthenticated = !loading && !!user;

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        loading,
        hasAccess,
        isAuthenticated,
        updateProfile,
        refreshProfile,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
