import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from users table
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }

    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      setProfile(null);
      return null;
    }

    const profileTimeoutMs = 6000;

    try {
      const { data, error } = await Promise.race([
        // Support both possible schema variants:
        // 1) users.id == auth.users.id
        // 2) users.auth_id == auth.users.id
        (async () => {
          const byId = supabase.from('users').select('*').eq('id', authUser.id).single();
          const { data: byAuthId, error: authIdError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          // If byId succeeds, use it; otherwise fall back to auth_id
          const byIdRes = await byId.catch(() => ({ data: null, error: { code: 'NOT_FOUND' } }));
          if (byIdRes?.data) return byIdRes;
          return { data: byAuthId, error: authIdError };
        })(),
        new Promise((resolve) => setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT', message: 'Profile load timed out' } }), profileTimeoutMs)),
      ]);

      if (error && error.code !== 'PGRST116' && error.code !== 'TIMEOUT') {
        console.error('Error loading profile:', error);
      }

      // If profile not found in Supabase, DO NOT hydrate from localStorage.
      // User must select their own ward (and enter details) to proceed.
      // (Earlier demo fallback caused stale/incorrect user data to appear.)
      if (!data) {
        setProfile(null);
        return null;
      }

      setProfile(data || null);
      return data || null;
    } catch (err) {
      console.error('Profile load error:', err);
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured. App running without authentication.');
      setLoading(false);
      return;
    }

    // Get initial session
    const SESSION_TIMEOUT_MS = 8000;

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: { session: null } }), SESSION_TIMEOUT_MS);
    });

    Promise.race([
      supabase.auth.getSession(),
      timeoutPromise,
    ]).then(({ data: { session } }) => {
      const authUser = session?.user || null;
      setUser(authUser);
      loadProfile(authUser);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user || null;
        setUser(authUser);
        await loadProfile(authUser);
      }
    );

    return () => subscription?.unsubscribe();
  }, [loadProfile]);

  // Sign up with email and password
  const signUp = async (email, password) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Database not configured. Please set up Supabase credentials.' } };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  // Sign in
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Database not configured. Please set up Supabase credentials.' } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error && data?.user) {
        // Load profile, but never block login forever
        const profileTimeoutMs = 6000;
        try {
          await Promise.race([
            loadProfile(data.user),
            new Promise((resolve) => setTimeout(resolve, profileTimeoutMs)),
          ]);
        } catch {
          // ignore profile load errors here; session is still valid
        }
      }

      return { data, error };
    } catch (e) {
      return { data: null, error: { message: e?.message || 'Sign-in failed' } };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        // ensure we clear session even if supabase call fails/hangs
        const signOutTimeoutMs = 5000;
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, signOutTimeoutMs)),
        ]);
      }
    } catch {
      // ignore
    } finally {
      setUser(null);
      setProfile(null);

      // Also clear any cached session keys if present
      try {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        // clear demo fallback profile
        localStorage.removeItem('aquagrid_profile_fallback');
      } catch {}
    }
  };

  // Save user profile — accepts explicit userId to avoid null user race condition
  const saveProfile = async (profileData, explicitUserId = null) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Database not configured. Please set up Supabase credentials.' } };
    }

    const userId = explicitUserId || user?.id;
    if (!userId) {
      console.error('saveProfile: No user ID available');
      return { data: null, error: { message: 'No user ID available. Please try again.' } };
    }

    const userEmail = profileData.email || user?.email;

    try {
      // Support both schema variants:
      // - public.users has PK `id` matching auth.users.id
      // - OR it has column `auth_id` matching auth.users.id
      // Try upsert by `id` first; if it errors, upsert by `auth_id`.

      const upsertById = async () => {
        const { data, error } = await supabase
          .from('users')
          .upsert(
            {
              ...profileData,
              id: userId,
              email: userEmail,
            },
            { onConflict: 'id' }
          )
          .select()
          .single();
        return { data, error };
      };

      const upsertByAuthId = async () => {
        const { data, error } = await supabase
          .from('users')
          .upsert(
            {
              ...profileData,
              auth_id: userId,
              email: userEmail,
            },
            { onConflict: 'auth_id' }
          )
          .select()
          .single();
        return { data, error };
      };

      let { data, error } = await upsertById();
      if (error) {
        const fallback = await upsertByAuthId();
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        console.error('saveProfile error:', error);
        return { data: null, error };
      }

      if (data) setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('saveProfile exception:', err);
      return { data: null, error: { message: err.message } };
    }
  };

  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    saveProfile,
    loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}