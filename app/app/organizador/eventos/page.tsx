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
  Pencil,
  UserCheck
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
import { useToast } from '@/components/ui/use-toast'
import { PlusCircleIcon, ListPlusIcon } from "lucide-react"
import { supabase } from '@/lib/supabase'

// Interface para os eventos
interface Event {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  end_date?: string
  end_time?: string
  location?: string
  organization_id: string
  is_active: boolean
  type?: string
  flyer_url?: string
  // Outros campos que podem existir
}

export default function EventosPage() {
  const [eventList, setEventList] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const { toast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0) // Estado para forçar refresh
  
  // Função para forçar atualização da página
  const forceRefresh = () => {
    console.log("Forçando atualização da página de eventos");
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    // Carregar eventos
    async function loadEvents() {
      if (!currentOrganization?.id) return;
      
      setLoading(true);
      
      try {
        console.log(`Buscando eventos para organização: ${currentOrganization.id}`);
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao carregar eventos:', error);
          toast({
            title: "Erro ao carregar eventos",
            description: error.message,
            variant: "destructive"
          });
        } else {
          console.log(`${data?.length || 0} eventos encontrados`);
          setEventList(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
        toast({
          title: "Erro inesperado",
          description: "Não foi possível carregar seus eventos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadEvents();
    
    // Removida atualização automática para evitar refreshes constantes
    
  }, [currentOrganization, refreshKey]); // Manter refreshKey como dependência

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Carregando organização...</span>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="p-4 border border-amber-300 bg-amber-50 rounded-md text-amber-800">
        <h2 className="text-lg font-medium">Nenhuma organização selecionada</h2>
        <p className="mt-2">Você precisa selecionar ou criar uma organização para ver os eventos.</p>
        <Button onClick={() => router.push('/app/organizador/organizacoes')} className="mt-4">
          Gerenciar Organizações
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Carregando eventos...</span>
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

  const filteredEvents = eventList.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && event.is_active) || 
                         (filter === 'draft' && !event.is_active);
    return matchesSearch && matchesFilter;
  });

  const handleAction = (action: string, eventId: string) => {
    switch (action) {
      case 'edit':
        router.push(`/app/organizador/evento/${eventId}`)
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

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar hora - pode receber string de data ou hora
  const formatTime = (timeString: string) => {
    // Se for uma string de hora (formato HH:MM:SS)
    if (timeString.includes(':') && !timeString.includes('-') && !timeString.includes('T')) {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
    
    // Se for uma string de data completa
    const date = new Date(timeString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500">
            Gerencie seus eventos e guest lists de {currentOrganization.name}
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

      {/* Busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
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
              Publicados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('draft')}>
              Rascunhos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {eventList.length === 0 ? (
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
            <EventCard key={event.id} event={event} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para o card de evento
function EventCard({ event, onAction }: { event: Event, onAction: (action: string, eventId: string) => void }) {
  const router = useRouter()
  const eventImg = event.flyer_url || '/placeholder-event.jpg'
  const { toast } = useToast()
  const [guestCount, setGuestCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { currentOrganization } = useOrganization()
  
  // Função para navegar para a página pública do evento
  const handleViewClick = (event: Event) => {
    // Obter o nome da organização atual
    const orgName = currentOrganization?.name?.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remover caracteres especiais
      .replace(/\s+/g, '-') || ''; // Substituir espaços por hífens
    
    // Gerar um slug baseado no título e local do evento
    let slug = '';
    if (event.location) {
      // Limpar e formatar o local do evento
      const localFormatado = event.location.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remover caracteres especiais
        .replace(/\s+/g, '-'); // Substituir espaços por hífens
      
      // Limpar e formatar o título
      const tituloFormatado = event.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
      
      slug = `${localFormatado}-${tituloFormatado}`;
    } else {
      // Se não tiver local, usar apenas o título
      slug = event.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
    }
    
    // Redirecionar para a página pública do evento, baseado no tipo
    const publicUrl = event.type === 'guest-list' 
      ? `/g/${event.id}?org=${orgName}&slug=${slug}` // URL para guest list com slug e organização
      : `/e/${event.id}?org=${orgName}&slug=${slug}`; // URL para eventos normais com slug e organização
    
    router.push(publicUrl);
  };
  
  // Função para atualizar contagem de convidados
  const refreshGuestCount = async () => {
    if (event.type === 'guest-list') {
      setIsLoading(true);
      
      try {
        console.log(`EventCard [${event.id}] - Buscando contagem via API`);
        
        // Usar o endpoint de API dedicado para contagem
        const response = await fetch(`/api/guest-count?eventId=${event.id}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
        });
        
        if (!response.ok) {
          throw new Error(`API retornou erro: ${response.status}`);
        }
        
        const data = await response.json();
        const count = data.count || 0;
        
        console.log(`EventCard [${event.id}] - API retornou ${count} convidados`);
        setGuestCount(count);
      } catch (err) {
        console.error(`EventCard [${event.id}] - Erro ao buscar contagem:`, err);
        // Fallback: tentar buscar diretamente no Supabase como plano B
        try {
          console.log(`EventCard [${event.id}] - Tentando fallback direto`);
          const { data, error } = await supabase
            .from('guests')
            .select('id')
            .eq('event_id', event.id);
          
          if (error) {
            console.error(`EventCard [${event.id}] - Erro no fallback:`, error);
            setGuestCount(0);
          } else {
            const count = data?.length || 0;
            console.log(`EventCard [${event.id}] - Fallback encontrou ${count} convidados`);
            setGuestCount(count);
          }
        } catch (fbErr) {
          console.error(`EventCard [${event.id}] - Erro no fallback:`, fbErr);
          setGuestCount(0);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Carregar contagem inicial e configurar atualização periódica
  useEffect(() => {
    if (event.type === 'guest-list') {
      // Buscar contagem inicial (uma única vez)
      refreshGuestCount();
      
      // Removida atualização automática a cada 5 segundos
      // const interval = setInterval(refreshGuestCount, 5000);
      // return () => clearInterval(interval);
    }
  }, [event.id, event.type]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-40">
          <Image 
            src={eventImg}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Badge para indicar tipo de evento */}
          {event.type === 'guest-list' && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
              Guest List
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{event.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {event.description || 'Sem descrição'}
        </p>
        <div className="flex items-center gap-1 text-xs mt-2">
          <CalendarIcon className="w-3 h-3" />
          <span>{event.date ? new Date(event.date).toLocaleDateString('pt-BR') : '-'}</span>
        </div>
        
        {/* Mostrar contagem de convidados para guest list */}
        {event.type === 'guest-list' && (
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                {isLoading ? (
                  <span>Carregando...</span>
                ) : (
                  <span>{guestCount !== null ? `${guestCount} convidados registrados` : 'Nenhum convidado'}</span>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  refreshGuestCount();
                }}
                className="text-xs text-blue-500 hover:text-blue-700"
                disabled={isLoading}
              >
                {isLoading ? '...' : 'Atualizar'}
              </button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => handleViewClick(event)}
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
          onClick={() => {
            if (event.type === 'guest-list') {
              router.push(`/app/organizador/evento/criar/guest-list?id=${event.id}`);
            } else {
              router.push(`/app/organizador/eventos/criar?id=${event.id}`);
            }
          }}
        >
          <PencilIcon className="w-4 h-4 mr-1" />
          Editar
        </Button>
        
        {event.type === 'guest-list' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 mt-2"
            onClick={() => router.push(`/app/organizador/eventos/${event.id}`)}
          >
            Diagnóstico
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 