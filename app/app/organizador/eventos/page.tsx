'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  Filter,
  MoreVertical,
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
const events = [
  {
    id: 1,
    title: 'Festa de Verão',
    date: '15 Jul 2024',
    time: '22:00',
    location: 'Praia do Sol',
    status: 'active',
    tickets: {
      sold: 150,
      total: 200
    }
  },
  {
    id: 2,
    title: 'Show de Rock',
    date: '20 Jul 2024',
    time: '20:00',
    location: 'Arena Central',
    status: 'draft',
    tickets: {
      sold: 90,
      total: 200
    }
  },
  {
    id: 3,
    title: 'Conferência Tech',
    date: '25 Jul 2024',
    time: '09:00',
    location: 'Centro de Convenções',
    status: 'active',
    tickets: {
      sold: 60,
      total: 200
    }
  }
]

export default function EventosPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || event.status === filter
    return matchesSearch && matchesFilter
  })

  const handleAction = (action: string, eventId: number) => {
    switch (action) {
      case 'edit':
        router.push(`/app/organizador/eventos/${eventId}/editar`)
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500">Gerencie seus eventos</p>
        </div>
        <Button onClick={() => router.push('/app/organizador/eventos/criar')}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Evento
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('active')}>
              Ativos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('draft')}>
              Rascunhos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('archived')}>
              Arquivados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAction('edit', event.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('duplicate', event.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('archive', event.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction('delete', event.id)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Ingressos vendidos</span>
                  <span>{event.tickets.sold}/{event.tickets.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(event.tickets.sold / event.tickets.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/app/organizador/eventos/${event.id}`)}
                >
                  Ver detalhes
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 