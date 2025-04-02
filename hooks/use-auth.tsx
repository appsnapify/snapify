"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import * as auth from '@/lib/auth'
import AuthErrorProvider from '@/app/app/_providers/auth-provider'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signUp: (email: string, password: string, metadata: {
    first_name: string
    last_name: string
    role: 'organizador' | 'promotor'
    organization?: string
  }) => Promise<User | null>
  signIn: (email: string, password: string) => Promise<User | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Verificar se há uma sessão ativa
    auth.getSession().then(session => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signUp = async (email: string, password: string, metadata: {
    first_name: string
    last_name: string
    role: 'organizador' | 'promotor'
    organization?: string
  }) => {
    try {
      const { user } = await auth.signUp(email, password, metadata)
      if (!user) {
        throw new Error('Erro ao criar conta')
      }
      toast.success('Conta criada com sucesso! Por favor, faça login.')
      router.push('/login')
      return user
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)
      if (error?.message?.includes('email')) {
        throw new Error('Email inválido ou já está em uso')
      }
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await auth.signIn(email, password)
      if (!user) {
        throw new Error('Credenciais inválidas')
      }
      toast.success('Login realizado com sucesso!')
      
      // Redirecionar com base na role do usuário
      const userRole = user.user_metadata.role
      if (userRole === 'organizador') {
        router.push('/app/organizador/dashboard')
      } else if (userRole === 'promotor') {
        router.push('/app/promotor/dashboard')
      }
      
      return user
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      if (error?.message?.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos')
      }
      throw error
    }
  }

  const signOut = async () => {
    try {
      await auth.signOut()
      toast.success('Sessão terminada com sucesso!')
    } catch (error) {
      console.error('Erro ao terminar sessão:', error)
      toast.error('Erro ao terminar sessão.')
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      <AuthErrorProvider>
        {children}
      </AuthErrorProvider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 