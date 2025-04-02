'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
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
  Archive,
  ExternalLink,
  Scan,
  Pencil
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'
import { CalendarIcon, ExternalLinkIcon, PencilIcon } from "lucide-react"
import { ScanIcon } from "lucide-react"
import { useOrganization } from '@/app/contexts/organization-context'
import { createClient } from '@supabase/supabase-js'
import { PlusCircleIcon, ListPlusIcon } from "lucide-react"

// Inicializar cliente do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadEvents() {
      if (!currentOrganization) return
      
      setLoading(true)
      try {
        console.log("Buscando eventos para organização:", currentOrganization.id)
        
        // Buscar eventos do Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .order('start_date', { ascending: false })
        
        if (error) {
          console.error("Erro ao buscar eventos:", error)
          throw new Error(error.message)
        }
        
        console.log("Eventos encontrados:", data)
        setEvents(data || [])
      } catch (err) {
        console.error("Erro ao carregar eventos:", err)
        setError("Não foi possível carregar os eventos. Por favor, tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [currentOrganization])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
          Tentar novamente
        </Button>
      </div>
    )
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500">
            Gerencie seus eventos e guest lists
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => router.push('/app/organizador/eventos/criar')}>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Criar Evento
          </Button>
          <Button variant="outline" onClick={() => router.push('/app/organizador/evento/criar/guest-list')}>
            <ListPlusIcon className="h-4 w-4 mr-2" />
            Criar Guest List
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum evento encontrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            Você ainda não criou nenhum evento. Comece criando seu primeiro evento.
          </p>
          <Button onClick={() => router.push('/app/organizador/eventos/criar')} className="mt-4">
            Criar Evento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: event.id * 0.1 }}
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
      )}
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter()
  const eventImg = event.flyer_url || '/placeholder-event.jpg'
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-40">
          <Image 
            src={eventImg}
            alt={event.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{event.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {event.description || 'Sem descrição'}
        </p>
        <div className="flex items-center gap-1 text-xs mt-2">
          <CalendarIcon className="w-3 h-3" />
          <span>{new Date(event.start_date).toLocaleDateString('pt-BR')}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => router.push(`/evento/${event.id}`)}
        >
          <ExternalLinkIcon className="w-4 h-4 mr-1" />
          Ver
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => router.push(`/app/organizador/eventos/checkin?event=${event.id}`)}
        >
          <ScanIcon className="w-4 h-4 mr-1" />
          Check-in
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => router.push(`/app/organizador/evento/${event.id}`)}
        >
          <PencilIcon className="w-4 h-4 mr-1" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  )
} 