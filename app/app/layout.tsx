"use client"

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/hooks/use-auth'
import { SidebarProvider } from '@/contexts/sidebar-context'
// import { Notifications } from '@/components/layouts/notifications'
// import { Providers } from '@/components/providers'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { OrganizationProvider } from '@/app/contexts/organization-context'
import { useAuth } from '@/hooks/use-auth'

const inter = Inter({ subsets: ['latin'] })

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return children
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <OrganizationProvider>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <AppLayoutContent>
              {children}
            </AppLayoutContent>
          </main>
        </div>
      </OrganizationProvider>
    </SidebarProvider>
  )
} 