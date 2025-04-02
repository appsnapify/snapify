import { createClient } from '@/lib/supabase'

export async function signUp(email: string, password: string, metadata: {
  first_name: string
  last_name: string
  role: 'organizador' | 'promotor'
}) {
  const supabase = createClient()
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          role: metadata.role
        }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Este email já está registrado. Por favor, use outro email ou faça login.')
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário: dados não retornados')
    }

    return authData
  } catch (error) {
    console.error('Erro no processo de registro:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro desconhecido durante o registro')
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export async function signOut() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    throw error
  }
}

export async function getUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return null
  }
}

export async function getSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    return null
  }
}

// Função para limpar tokens e forçar login novamente
export async function resetSession() {
  const supabase = createClient()
  
  try {
    // Limpar qualquer sessão existente
    await supabase.auth.signOut()
    
    // Limpar storage local
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      // Remover outros itens do localStorage relacionados ao Supabase
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('supabase.')) {
          localStorage.removeItem(key)
        }
      }
    }
    
    console.log('Sessão limpa com sucesso')
    return { success: true }
  } catch (error) {
    console.error('Erro ao resetar sessão:', error)
    return { success: false, error }
  }
}

// Aliases para manter compatibilidade
export const logout = signOut
export const getCurrentUser = getUser 