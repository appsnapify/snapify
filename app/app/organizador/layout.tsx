"use client"

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { OrganizationSelector } from '@/components/organization-selector'
import { useOrganization } from '@/app/contexts/organization-context'
import { Button } from '@/components/ui/button'

interface NavItemProps {
  href: string
  icon: ReactNode
  children: ReactNode
  disabled?: boolean
}

function NavItem({ href, icon, children, disabled }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  if (disabled) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed",
        "hover:bg-gray-100 hover:text-gray-900"
      )}>
        {icon}
        {children}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500",
        "hover:bg-gray-100 hover:text-gray-900",
        isActive && "bg-gray-100 text-gray-900"
      )}
    >
      {icon}
      {children}
    </Link>
  )
}

export default function OrganizadorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { hasOrganizations, isLoading } = useOrganization()
  const pathname = usePathname()
  const isCreatingOrg = pathname === '/app/organizador/organizacoes/nova'

  // Se estiver carregando, não mostra nada
  if (isLoading) {
    return null
  }

  // Se não tiver organizações e não estiver na página de criar, redireciona
  if (!hasOrganizations && !isCreatingOrg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Nenhuma organização encontrada</h1>
        <p className="text-gray-500 mb-8">Você precisa criar uma organização para começar.</p>
        <Button asChild>
          <Link href="/app/organizador/organizacoes/nova">
            Criar Organização
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <OrganizationSelector />
        </div>
        <nav className="space-y-1 p-4">
          <NavItem 
            href="/app/organizador/dashboard" 
            icon={<span>📊</span>}
            disabled={!hasOrganizations}
          >
            Dashboard
          </NavItem>
          <NavItem 
            href="/app/organizador/eventos" 
            icon={<span>📅</span>}
            disabled={!hasOrganizations}
          >
            Eventos
          </NavItem>
          <NavItem 
            href="/app/organizador/bilheteria" 
            icon={<span>🎟️</span>}
            disabled={!hasOrganizations}
          >
            Bilheteria
          </NavItem>
          <NavItem 
            href="/app/organizador/equipes" 
            icon={<span>👥</span>}
            disabled={!hasOrganizations}
          >
            Equipes
          </NavItem>
          <NavItem 
            href="/app/organizador/relatorios" 
            icon={<span>📈</span>}
            disabled={!hasOrganizations}
          >
            Relatórios
          </NavItem>
          <NavItem 
            href="/app/organizador/configuracoes" 
            icon={<span>⚙️</span>}
            disabled={!hasOrganizations}
          >
            Configurações
          </NavItem>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
} 