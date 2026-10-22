import { createClient } from '@supabase/supabase-js';

// Supabase Credentials
const supabaseUrl = 'https://rjzsovxwpjkxdgrbmnwg.supabase.co';
const supabaseAnonKey = 'sb_publishable_UGmdEMInX_J9ixbapYOPrQ_tAIiVQ37';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);