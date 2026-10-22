import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://plrytbbwjeomqkjgbdlb.supabase.co';
const rawKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'sb_publishable_CEt85v6OMLrYIvjPaWk55A_PZntQZV2';

// Sanitize URL and key to remove any accidental brackets or whitespace
export const supabaseUrl = rawUrl.trim();
export const supabaseAnonKey = rawKey.replace(/^[\["']+|[\]"']+$/g, '').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
