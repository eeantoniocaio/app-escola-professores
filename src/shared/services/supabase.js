import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/shared/constants/env'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
