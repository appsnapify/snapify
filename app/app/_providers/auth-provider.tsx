'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { resetSession } from '@/lib/auth'

export default function AuthErrorProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter()

  useEffect(() => {
    // Função para capturar e processar erros de console
    const handleAuthError = (error: any) => {
      // Verificar se é um erro de refresh token
      if (
        error.message && (
          error.message.includes('Invalid Refresh Token') ||
          error.message.includes('Refresh Token Not Found') ||
          error.message.includes('AuthApiError')
        )
      ) {
        console.log('Detectado erro de autenticação, limpando sessão...')
        
        // Limpar a sessão
        resetSession().then(({ success }) => {
          if (success) {
            // Marcar que houve um erro de autenticação
            localStorage.setItem('auth_error', 'true')
            // Redirecionar para login com parâmetro
            router.push('/login?auth_error=true')
          }
        })
      }
    }

    // Adicionar listener para erros
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'object') {
        handleAuthError(args[0])
      } else if (args[0] && typeof args[0] === 'string' && args[0].includes('Auth')) {
        handleAuthError({ message: args[0] })
      }
      
      // Manter comportamento original
      originalConsoleError.apply(console, args)
    }

    // Listener para erros não capturados
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.error && 
        typeof event.error.message === 'string' && 
        (
          event.error.message.includes('Invalid Refresh Token') ||
          event.error.message.includes('Refresh Token Not Found') ||
          event.error.message.includes('AuthApiError')
        )
      ) {
        // Limpar sessão e redirecionar
        resetSession().then(({ success }) => {
          if (success) {
            localStorage.setItem('auth_error', 'true')
            router.push('/login?auth_error=true')
          }
        })
      }
    }

    window.addEventListener('error', handleGlobalError)

    // Limpar ao desmontar
    return () => {
      console.error = originalConsoleError
      window.removeEventListener('error', handleGlobalError)
    }
  }, [router])

  // Renderizar os filhos sem mudanças
  return <>{children}</>
} 