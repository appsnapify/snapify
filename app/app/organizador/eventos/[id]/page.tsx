'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  DollarSign,
  ArrowLeft,
  Edit,
  Trash,
  Copy,
  Archive
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Dados mockados para exemplo
const event = {
  id: 1,
  title: 'Festa de Verão',
  description: 'Uma noite incrível de música e diversão à beira-mar.',
  date: '15 Jul 2024',
  time: '22:00',
  location: 'Praia do Sol',
  status: 'active',
  tickets: {
    sold: 150,
    total: 200,
    price: 50
  },
  revenue: {
    total: 7500,
    today: 500
  },
  recentSales: [
    {
      id: 1,
      buyer: 'João Silva',
      quantity: 2,
      total: 100,
      date: '2024-03-10T14:30:00'
    },
    {
      id: 2,
      buyer: 'Maria Santos',
      quantity: 3,
      total: 150,
      date: '2024-03-10T13:45:00'
    },
    {
      id: 3,
      buyer: 'Pedro Costa',
      quantity: 1,
      total: 50,
      date: '2024-03-10T12:15:00'
    }
  ]
}

export default function EventoDetalhesPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    try {
      switch (action) {
        case 'edit':
          router.push(`/app/organizador/eventos/${params.id}/editar`)
          break
        case 'duplicate':
          // Implementar duplicação
          break
        case 'archive':
          // Implementar arquivamento
          break
        case 'delete':
          // Implementar exclusão
          break
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-gray-500">Detalhes do evento</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Ações</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAction('edit')}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('duplicate')}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('archive')}>
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction('delete')}
              className="text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informações principais */}
        <Card className="md:col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Evento</h2>
          <div className="space-y-4">
            <p className="text-gray-600">{event.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="h-5 w-5" />
                <span>{event.tickets.sold}/{event.tickets.total} bilhetes vendidos</span>
              </div>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="text-2xl font-semibold mt-1">€{event.revenue.total}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-50 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Vendas Hoje</p>
                <p className="text-2xl font-semibold mt-1">€{event.revenue.today}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-50 text-purple-600">
                <Ticket className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vendas Recentes */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Vendas Recentes</h2>
        <div className="space-y-4">
          {event.recentSales.map(sale => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{sale.buyer}</p>
                <p className="text-sm text-gray-500">
                  {new Date(sale.date).toLocaleString('pt-PT')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">€{sale.total}</p>
                <p className="text-sm text-gray-500">{sale.quantity} bilhetes</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
} 