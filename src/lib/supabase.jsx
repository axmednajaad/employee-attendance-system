import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nktuttuswytrfishityc.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdHV0dHVzd3l0cmZpc2hpdHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTc1NzQsImV4cCI6MjA3NDM5MzU3NH0.KAXVeoMoK4VXtItaqdaSNzQ4hn8Kt44wZT9GlXlQWrA';

export const supabase = createClient(supabaseUrl, supabaseKey);