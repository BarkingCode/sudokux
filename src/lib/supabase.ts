/**
 * Supabase client configuration
 *
 * This module initializes the Supabase client for database operations.
 * Used for: user sync, game sessions, stats, and leaderboards.
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// TODO: Replace with your actual Supabase credentials
// Get these from: Supabase Dashboard > Project Settings > API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn(
    'Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // We use anonymous IDs, not Supabase Auth
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
