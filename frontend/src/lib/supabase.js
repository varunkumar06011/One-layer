import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hwguqcywujdbiuzzlbaj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Z3VxY3l3dWpkYml1enpsYmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDU1ODgsImV4cCI6MjEwNTAyMTU4OH0.-mB0aMbYjHXJxD_FuQC7s87MJW05YEq2KpGbjYooQ3Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
