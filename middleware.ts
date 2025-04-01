import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Criar cliente Supabase com cookies do request
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Atualizar os cookies no request e response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remover cookies do request e response
          request.cookies.delete({
            name,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  try {
    // Verificar sessão
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Erro ao verificar sessão:', error)
      return response
    }

    // Se não estiver autenticado e tentar acessar rotas protegidas
    if (!session && request.nextUrl.pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se estiver autenticado e tentar acessar rotas públicas
    if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
      const userRole = session.user.user_metadata.role
      if (userRole === 'organizador') {
        return NextResponse.redirect(new URL('/app/organizador/dashboard', request.url))
      } else if (userRole === 'promotor') {
        return NextResponse.redirect(new URL('/app/promotor/dashboard', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Erro no middleware:', error)
    return response
  }
}

export const config = {
  matcher: ['/app/:path*', '/login', '/register']
} 