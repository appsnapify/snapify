"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Código não usa mais useOrganization porque o layout já faz essa verificação

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Bem-vindo ao seu dashboard de organizador.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Eventos</h2>
          <p className="text-gray-500 mb-4">Gerencie seus eventos e cadastre novos.</p>
          <Link href="/app/organizador/eventos">
            <Button variant="outline" className="w-full">Ver Eventos</Button>
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Bilheteria</h2>
          <p className="text-gray-500 mb-4">Controle a venda de ingressos.</p>
          <Link href="/app/organizador/bilheteria">
            <Button variant="outline" className="w-full">Acessar Bilheteria</Button>
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Relatórios</h2>
          <p className="text-gray-500 mb-4">Veja estatísticas e relatórios.</p>
          <Link href="/app/organizador/relatorios">
            <Button variant="outline" className="w-full">Ver Relatórios</Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 