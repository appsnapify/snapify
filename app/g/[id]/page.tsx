'use client'

// Essencialmente a mesma página que a de eventos normais, mas com foco em guest list
// Reutilizamos o mesmo código com pequenas adaptações

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CalendarIcon, Clock, MapPin, Share2, UserCheck, Users, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { use } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Schema de validação para o formulário de registro
const guestFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres",
  }),
  phone: z.string().min(3, {
    message: "Digite um número de telefone válido",
  }),
})

type GuestFormValues = z.infer<typeof guestFormSchema>

// Interface do evento
interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  end_date?: string
  end_time?: string
  location: string
  flyer_url?: string
  type?: string
  is_active: boolean
  organization_id: string
  guest_list_settings?: any
}

// Este componente lida com a lógica de dados da página
function GuestListPageContent({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [guestCount, setGuestCount] = useState<number>(0)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  
  // Lista de países com bandeiras e prefixos
  const countries = [
    { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
    { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
    { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
    { code: 'ES', name: 'Espanha', prefix: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Itália', prefix: '+39', flag: '🇮🇹' },
    { code: 'FR', name: 'França', prefix: '+33', flag: '🇫🇷' },
    { code: 'UK', name: 'Reino Unido', prefix: '+44', flag: '🇬🇧' },
    { code: 'DE', name: 'Alemanha', prefix: '+49', flag: '🇩🇪' },
    { code: 'CV', name: 'Cabo Verde', prefix: '+238', flag: '🇨🇻' },
    { code: 'AO', name: 'Angola', prefix: '+244', flag: '🇦🇴' },
    { code: 'MZ', name: 'Moçambique', prefix: '+258', flag: '🇲🇿' },
  ];
  
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Portugal por padrão
  
  // Configuração do formulário
  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      phone: ""
    },
  })
  
  // Buscar dados do evento e contagem de convidados
  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true)
        
        // Verificar se a tabela 'guests' existe e criar se necessário
        const { data: tableExists, error: checkError } = await supabase
          .from('guests')
          .select('*')
          .limit(1)
        
        if (checkError && checkError.code === '42P01') { // Código para "relation does not exist"
          console.log("Tabela 'guests' não encontrada, tentando criar...");
          
          // Criar a tabela guests
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS guests (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              phone TEXT NOT NULL,
              qr_code TEXT NOT NULL,
              checked_in BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          
          try {
            // Este é um exemplo simplificado - em produção você precisaria de
            // permissões adequadas e um método mais seguro para criar a tabela
            await supabase.rpc('execute_sql', { query: createTableQuery });
            console.log("Tabela 'guests' criada com sucesso!");
          } catch (createError) {
            console.error("Erro ao criar tabela 'guests':", createError);
          }
        }
        
        // Buscar evento do Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('is_active', true)
          .eq('type', 'guest-list')
          .single()
          
        if (error) {
          throw new Error('Guest list não encontrada ou não está ativa')
        }
        
        if (!data) {
          throw new Error('Guest list não encontrada')
        }
        
        console.log("Dados da guest list carregados:", data)
        setEvent(data)
        
        // Buscar contagem de convidados
        const { count, error: countError } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
        
        if (!countError) {
          setGuestCount(count || 0)
        }
      } catch (err) {
        console.error("Erro ao carregar guest list:", err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar guest list')
      } finally {
        setLoading(false)
      }
    }
    
    loadEvent()
  }, [eventId])
  
  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Função para formatar hora
  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    
    // Se for uma string de hora (formato HH:MM:SS)
    if (timeString.includes(':') && !timeString.includes('-') && !timeString.includes('T')) {
      const [hours, minutes] = timeString.split(':')
      return `${hours}:${minutes}`
    }
    
    // Se for uma string de data completa
    const date = new Date(timeString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  
  // Função para registrar convidado
  const onSubmit = async (data: GuestFormValues) => {
    if (!event) return
    
    setSubmitting(true)
    try {
      console.log("Cliente - Iniciando registro de convidado:", data)
      
      // Sanitizar o número de telefone e adicionar o prefixo do país
      const sanitizedPhone = data.phone.replace(/\D/g, '')
      const fullPhone = `${selectedCountry.prefix}${sanitizedPhone}`
      
      // Preparar dados do convidado
      const guestData = {
        event_id: event.id,
        name: data.name,
        phone: fullPhone,
        created_at: new Date().toISOString()
      }
      
      console.log("Cliente - Enviando dados para API:", guestData)
      
      // Registrar através da API
      try {
        const response = await fetch('/api/guests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(guestData),
        });
        
        console.log("Cliente - Status da resposta da API:", response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error("Cliente - Erro da API:", errorData)
          throw new Error(errorData.error || response.statusText)
        }
        
        const result = await response.json()
        console.log("Cliente - Resultado da API:", result)
        console.log("Cliente - Origem dos dados:", result.source)
        console.log("Cliente - Mensagem da API:", result.message)
        
        if (result.error) {
          console.error("Cliente - Erro retornado pela API:", result.error)
        }
        
        // Verificar a URL do QR code
        if (result.qrCodeUrl) {
          console.log("Cliente - QR Code recebido da API, tamanho:", result.qrCodeUrl.length);
          console.log("Cliente - Começo do QR Code:", result.qrCodeUrl.substring(0, 50) + "...");
          setQrCodeUrl(result.qrCodeUrl)
        } else {
          console.error("Cliente - QR Code não recebido da API")
        }
        
        // Verificar se precisamos salvar localmente
        if (result.source === "local_storage" && result.data) {
          console.log("Cliente - Salvando dados do convidado no localStorage");
          
          try {
            // Obter lista existente ou iniciar nova
            const storageKey = `guests_${event.id}`;
            const existingGuests = localStorage.getItem(storageKey);
            const guestsList = existingGuests ? JSON.parse(existingGuests) : [];
            
            // Adicionar novo convidado à lista
            guestsList.push(result.data);
            
            // Salvar lista atualizada
            localStorage.setItem(storageKey, JSON.stringify(guestsList));
            
            console.log(`Cliente - Convidado salvo localmente. Total: ${guestsList.length}`);
          } catch (storageError) {
            console.error("Cliente - Erro ao salvar no localStorage:", storageError);
          }
        }
        
        // Atualizar UI para sucesso
        setRegistrationSuccess(true)
        setGuestCount(prevCount => prevCount + 1)
        
        toast({
          title: result.message || "Registro confirmado!",
          description: "Você foi adicionado à guest list com sucesso.",
        })
        
        // Limpar formulário
        form.reset()
      } catch (error) {
        console.error("Cliente - Erro ao comunicar com API:", error)
        
        // Exibir erro ao usuário
        toast({
          title: "Erro na comunicação",
          description: "Não foi possível conectar ao servidor. Tente novamente mais tarde.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("Cliente - Erro geral no registro:", err)
      toast({
        title: "Erro no registro",
        description: err instanceof Error 
          ? err.message 
          : "Não foi possível completar seu registro. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  // Função para compartilhar via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `Venha comigo para o evento ${event?.title} em ${event?.location} no dia ${formatDate(event?.date)}!`;
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n\n' + url)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Estado de carregamento
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-300 w-3/4 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 w-full rounded mb-2"></div>
          <div className="h-4 bg-gray-300 w-full rounded mb-2"></div>
          <div className="h-4 bg-gray-300 w-2/3 rounded mb-6"></div>
        </div>
      </div>
    )
  }
  
  // Estado de erro
  if (error || !event) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Guest List não encontrada</CardTitle>
            <CardDescription>
              {error || 'Não foi possível carregar os detalhes desta guest list.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do evento com imagem */}
      <div className="relative w-full h-[30vh] md:h-[40vh] bg-gray-900">
        {event.flyer_url ? (
          <Image
            src={event.flyer_url}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            className="opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600"></div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="container max-w-4xl mx-auto px-4 pb-8">
            <Badge className="mb-2 bg-blue-600">Guest List</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex items-center text-white opacity-80">
              <Users className="h-4 w-4 mr-1" />
              <span>{guestCount} {guestCount === 1 ? 'pessoa' : 'pessoas'} confirmadas</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo do evento */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Guest List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{formatDate(event.date)}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(event.time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="mr-2" onClick={shareViaWhatsApp}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Coluna lateral - Formulário de registro ou confirmação */}
          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-blue-700">
                  {registrationSuccess 
                    ? 'Confirmação da Guest List!' 
                    : 'Confirmar Presença'}
                </CardTitle>
                <CardDescription>
                  {registrationSuccess 
                    ? 'Você está na lista do evento.' 
                    : 'Registre-se para entrar na guest list'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {registrationSuccess ? (
                  <div className="text-center py-4">
                    <UserCheck className="h-16 w-16 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-medium text-green-600 mb-2">
                      Você está na lista!
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      Seu nome foi adicionado à guest list deste evento.
                    </p>
                    
                    {qrCodeUrl && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                          Aqui está o seu QR code para check-in no evento:
                        </p>
                        <div className="flex justify-center bg-white p-3 rounded-md mx-auto" style={{ width: '200px', height: '200px' }}>
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code de acesso" 
                            style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                            onError={(e) => {
                              console.error('Erro ao carregar QR code:', e);
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+UVIgQ29kZTxicj5pbmRpc3BvbsOtdmVsPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </div>
                        <div className="mt-3">
                          <a 
                            href={qrCodeUrl} 
                            download="meu-qrcode-evento.png"
                            className="text-sm text-blue-600 inline-block hover:underline"
                            onClick={(e) => {
                              // Verificar se a URL é válida antes de baixar
                              if (qrCodeUrl.startsWith('data:image')) {
                                // É uma URL de dados válida, permitir o download
                                console.log('Iniciando download do QR code');
                              } else {
                                // URL inválida, evitar o download
                                e.preventDefault();
                                console.error('QR code inválido para download');
                                toast({
                                  title: "Erro no QR code",
                                  description: "Não foi possível baixar o QR code.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Salvar QR Code
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Apresente este QR code na entrada do evento
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setRegistrationSuccess(false);
                        setQrCodeUrl(null);
                      }}
                      className="mt-2"
                    >
                      Registrar outra pessoa
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      className="absolute inset-y-0 left-0 h-full pl-2 pr-10 flex items-center justify-start rounded-r-none border-r-0"
                                      style={{ width: '90px', paddingRight: '8px' }}
                                    >
                                      <span>{selectedCountry.flag}</span>
                                      <span className="ml-1 text-xs">{selectedCountry.prefix}</span>
                                      <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                                    {countries.map((country) => (
                                      <DropdownMenuItem
                                        key={country.code}
                                        onClick={() => setSelectedCountry(country)}
                                        className="flex items-center gap-2"
                                      >
                                        <span className="text-lg">{country.flag}</span>
                                        <span>{country.name}</span>
                                        <span className="ml-auto text-muted-foreground">{country.prefix}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Input 
                                  className="pl-24" 
                                  placeholder="912345678" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Usado para confirmação no check-in
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        disabled={submitting}
                      >
                        {submitting ? 'Enviando...' : 'Garantir Minha Vaga'}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal que lida com os parâmetros
export default function GuestListPage({ params }: { params: Promise<{ id: string }> }) {
  // Desembrulhar o params usando React.use()
  const resolvedParams = use(params);
  return <GuestListPageContent eventId={resolvedParams.id} />;
} 