import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TABLES = {
  DEPARTMENTS: 'departments',
  SEGMENTS: 'segments',
  DEPARTMENT_SEGMENTS: 'department_segments',
  APPLICATIONS: 'applications',
  USERS: 'users',
  DEVICES: 'devices',
  ACCESS_LOGS: 'access_logs',
} as const;
