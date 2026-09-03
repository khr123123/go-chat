import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const storageKey = `supabase-auth-${crypto.randomUUID()}`

export const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
        auth: {
            storageKey,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        },
    }
)