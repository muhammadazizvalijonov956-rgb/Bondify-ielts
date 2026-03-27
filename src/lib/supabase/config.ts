import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ylqgzikzsgznhbspunxl.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_TrnL9JG0ELdr7RqeNIc-dQ_3BhQrggx";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
