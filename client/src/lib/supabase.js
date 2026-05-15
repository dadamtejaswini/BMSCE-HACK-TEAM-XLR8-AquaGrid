import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

if (!isSupabaseConfigured) {
  console.error(
    '%c[AquaGrid] Supabase NOT configured!\nOpen client/.env and set:\n  VITE_SUPABASE_URL=https://xxxx.supabase.co\n  VITE_SUPABASE_ANON_KEY=eyJ...',
    'color:red; font-size:14px; font-weight:bold'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;