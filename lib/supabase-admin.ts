import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Verificar variáveis de ambiente
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

// Aqui usamos SUPABASE_SERVICE_ROLE_KEY em vez de NEXT_PUBLIC
// porque não queremos que esta chave seja exposta no cliente
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Cliente com Service Role para operações administrativas
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export { supabaseAdmin } 