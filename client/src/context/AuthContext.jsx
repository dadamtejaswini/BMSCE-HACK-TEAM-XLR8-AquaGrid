import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_USERS } from '../data/mockData';

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
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  // Load user profile from users table
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    if (!isSupabaseConfigured) {
      setProfile(MOCK_USERS[0]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }
      setProfile(data || null);
    } catch (err) {
      console.error('Profile load error:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user || null;
      setUser(authUser);
      loadProfile(authUser);
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
      // Demo mode: simulate signup
      const demoUser = { id: 'demo-' + Date.now(), email };
      setUser(demoUser);
      return { data: { user: demoUser }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  // Sign in
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      // Demo mode: simulate signin
      const demoUser = { id: 'demo-user', email, user_metadata: {} };
      setUser(demoUser);
      setProfile(MOCK_USERS[0]);
      return { data: { user: demoUser }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setProfile(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Save user profile — accepts explicit userId to avoid null user race condition
  const saveProfile = async (profileData, explicitUserId = null) => {
    if (!isSupabaseConfigured) {
      const newProfile = { ...MOCK_USERS[0], ...profileData };
      setProfile(newProfile);
      return { data: newProfile, error: null };
    }

    const userId = explicitUserId || user?.id;
    if (!userId) {
      console.error('saveProfile: No user ID available');
      return { data: null, error: { message: 'No user ID available. Please try again.' } };
    }

    const userEmail = profileData.email || user?.email;

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          ...profileData,
          id: userId,
          email: userEmail,
        }, { onConflict: 'id' })
        .select()
        .single();

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

  // Demo login (no credentials needed)
  const demoLogin = () => {
    const demoUser = { id: 'demo-user', email: 'demo@aquagrid.in', user_metadata: {} };
    setUser(demoUser);
    setProfile(MOCK_USERS[0]);
    setIsDemoMode(true);
  };

  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const value = {
    user,
    profile,
    loading,
    isDemoMode,
    isAdmin,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    saveProfile,
    demoLogin,
    loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
