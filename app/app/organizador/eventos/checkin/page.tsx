'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Scan, UserCheck, RotateCcw, Camera, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/app/contexts/organization-context'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Componente HTML5 QR Code Scanner que será carregado apenas no cliente
const Html5QrcodeScanner = dynamic(() => import('./Html5QrScanner').catch(err => {
  console.error("Erro ao importar HTML5QrcodeScanner:", err);
  return () => (
    <div className="bg-red-50 p-4 rounded-md">
      <p className="text-red-500">Erro ao carregar o scanner. Use o modo manual.</p>
    </div>
  );
}), { ssr: false });

interface ScanResult {
  success: boolean
  message: string
  guest?: {
    id: string
    name: string
    phone: string
    event_id: string
    checked_in: boolean
    check_in_time: string | null
  }
}

// Interface para eventos
interface Event {
  id: string;
  title: string; // nome do evento
  date: string;  // data de início
  is_active: boolean;
  organization_id: string;
}

export default function CheckInPage() {
  const [scanning, setScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState('')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0
  })
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [guests, setGuests] = useState<{ id: string; name: string; phone: string; checked_in: boolean; check_in_time: string | null }[]>([])
  
  // Extrair o evento da URL, se houver
  useEffect(() => {
    // Verificar se estamos no browser
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get('event');
      
      if (eventId) {
        console.log("Evento encontrado na URL:", eventId);
        setSelectedEvent(eventId);
      }
    }
  }, []);

  // Buscar eventos do organizador atual
  useEffect(() => {
    async function fetchEvents() {
      if (!currentOrganization) return

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .eq('is_active', true)
          .order('date', { ascending: false })
        
        if (error) {
          console.error('Erro ao buscar eventos:', error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar os eventos",
            variant: "destructive"
          })
          return
        }
        
        setEvents(data || [])
      } catch (err) {
        console.error('Erro ao buscar eventos:', err)
      }
    }
    
    fetchEvents()
  }, [currentOrganization])

  // Buscar estatísticas do evento selecionado
  useEffect(() => {
    async function fetchStats() {
      if (!selectedEvent) return

      try {
        // Total de convidados
        const { data: totalData, error: totalError } = await supabase
          .from('guests')
          .select('id', { count: 'exact' })
          .eq('event_id', selectedEvent)
        
        // Convidados com check-in
        const { data: checkedInData, error: checkedInError } = await supabase
          .from('guests')
          .select('id', { count: 'exact' })
          .eq('event_id', selectedEvent)
          .eq('checked_in', true)
        
        if (totalError || checkedInError) {
          console.error('Erro ao buscar estatísticas:', totalError || checkedInError)
          return
        }
        
        setStats({
          total: totalData?.length || 0,
          checkedIn: checkedInData?.length || 0
        })
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err)
      }
    }
    
    fetchStats()
  }, [selectedEvent])

  // Carregar convidados
  useEffect(() => {
    if (selectedEvent) {
      setLoading(true)
      
      console.log("Buscando convidados para o evento:", selectedEvent)
      
      // Buscar dados do evento
      supabase
        .from('events')
        .select('*')
        .eq('id', selectedEvent)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Erro ao buscar evento:", error)
            setError("Não foi possível carregar os detalhes do evento.")
          } else {
            setEvent(data)
          }
        })
      
      // Buscar convidados
      supabase
        .from('guests')
        .select('*')
        .eq('event_id', selectedEvent)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("Erro ao buscar convidados:", error);
            setError('Não foi possível carregar a lista de convidados.');
            
            // Tentar abordagem alternativa, com logs detalhados
            console.log("Tentando abordagem alternativa para buscar convidados...");
            
            // Executar consulta SQL direta para garantir que os convidados são encontrados
            supabase.rpc('exec_sql', { 
              sql: `SELECT * FROM guests WHERE event_id = '${selectedEvent}' ORDER BY created_at DESC` 
            })
            .then(({ data: sqlData, error: sqlError }) => {
              if (sqlError) {
                console.error("Erro na consulta SQL:", sqlError);
              } else if (sqlData && Array.isArray(sqlData.result)) {
                console.log(`Encontrados ${sqlData.result.length} convidados via SQL direto`);
                setGuests(sqlData.result);
                
                // Atualizar estatísticas
                setStats({
                  total: sqlData.result.length,
                  checkedIn: sqlData.result.filter((g: any) => g.checked_in).length
                });
              }
            });
          } else {
            console.log(`Convidados encontrados: ${data?.length || 0}`, data);
            setGuests(data || []);
            
            // Atualizar estatísticas diretamente daqui
            setStats({
              total: data?.length || 0,
              checkedIn: data?.filter((g: any) => g.checked_in).length || 0
            });
            
            setLoading(false);
          }
        })
    }
  }, [selectedEvent])

  const startScanning = () => {
    console.log("Iniciando scanner");
    setScanning(true)
    setScanMode('camera')
    // Limpar resultado anterior
    setLastResult(null)
    setManualCode('')
  }

  const stopScanning = () => {
    console.log("Parando scanner");
    setScanning(false)
  }

  const handleScan = async (data: string | null) => {
    if (!data) return;
    
    console.log('QR Code escaneado:', data);
    
    try {
      // Parar temporariamente o scanning
      setScanning(false);
      
      // Tentar extrair os dados do QR code
      let qrData;
      try {
        // O QR code pode estar em formato JSON
        qrData = JSON.parse(data);
        console.log('QR Code parseado com sucesso:', qrData);
      } catch (e) {
        // Se não estiver em formato JSON, pode ser URL ou outro formato
        console.log('QR Code não é JSON, tentando processar como string:', data);
        qrData = { raw: data };
      }
      
      // Verificar se temos os dados necessários
      if (qrData && (qrData.eventId || qrData.guestId)) {
        await processQrCode(data);
      } else {
        console.error('QR Code inválido, formato desconhecido:', data);
        toast({
          title: "QR code inválido",
          description: "O QR code escaneado não contém dados válidos para check-in.",
          variant: "destructive"
        });
        
        // Reiniciar o scanner após 2 segundos
        setTimeout(() => {
          setScanning(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o QR code.",
        variant: "destructive"
      });
      
      // Reiniciar o scanner após 2 segundos
      setTimeout(() => {
        setScanning(true);
      }, 2000);
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode) {
      toast({
        title: "Código vazio",
        description: "Por favor, insira um código para verificar",
        variant: "destructive"
      })
      return
    }
    
    processQrCode(manualCode)
  }

  const processQrCode = async (code: string) => {
    if (!selectedEvent) {
      toast({
        title: "Selecione um evento",
        description: "Por favor, selecione um evento antes de fazer check-in",
        variant: "destructive"
      })
      return
    }
    
    try {
      setScanning(false)
      
      console.log("Processando QR code:", { code, eventId: selectedEvent });
      
      // Preparar os dados para o check-in
      let guestId: string | null = null;
      let qrData: any = null;
      
      try {
        // Tentar extrair os dados do QR code como JSON
        qrData = JSON.parse(code);
        console.log("QR data parseado:", qrData);
        
        // Extrair o ID do convidado do JSON
        if (qrData.guestId) {
          guestId = qrData.guestId;
        }
      } catch (e) {
        console.error("Erro ao parsear QR code:", e);
        // Se não for JSON, usar o código bruto
        guestId = code;
      }
      
      if (!guestId) {
        toast({
          title: "QR Code inválido",
          description: "O QR code não contém um ID de convidado válido",
          variant: "destructive"
        });
        
        // Reiniciar scanner após 3 segundos
        if (scanMode === 'camera') {
          setTimeout(() => {
            setScanning(true)
          }, 3000)
        }
        return;
      }
      
      // Fazer requisição à API para processar o check-in
      const response = await fetch('/api/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: guestId,
          checked_in: true,
          event_id: selectedEvent
        })
      })
      
      const data = await response.json()
      console.log("Resposta da API:", data);
      
      if (!response.ok) {
        setLastResult({
          success: false,
          message: data.error || 'QR Code inválido ou não encontrado'
        })
        
        toast({
          title: "Erro no check-in",
          description: data.error || "QR code inválido ou não encontrado",
          variant: "destructive"
        })
      } else {
        setLastResult({
          success: true,
          message: data.message || "Check-in realizado com sucesso",
          guest: data.data
        })
        
        // Se é um novo check-in (não é um check-in repetido)
        if (!data.alreadyCheckedIn) {
          // Atualizar estatísticas locais
          setStats(prev => ({
            ...prev,
            checkedIn: prev.checkedIn + 1
          }))
          
          toast({
            title: "Check-in confirmado",
            description: `${data.data?.name || 'Convidado'} está na guest list!`
          })
        } else {
          toast({
            title: "Atenção",
            description: "Este convidado já fez check-in!",
            variant: "destructive"
          })
        }
        
        // Atualizar a lista de convidados
        if (selectedEvent) {
          // Buscar convidados novamente
          supabase
            .from('guests')
            .select('*')
            .eq('event_id', selectedEvent)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
              if (!error && data) {
                setGuests(data || [])
              }
            });
        }
      }
      
      // Reiniciar scanner após 3 segundos
      if (scanMode === 'camera') {
        setTimeout(() => {
          setScanning(true)
        }, 3000)
      } else {
        setManualCode('')
      }
      
    } catch (error) {
      console.error('Erro ao processar QR code:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o check-in",
        variant: "destructive"
      })
      
      if (scanMode === 'camera') {
        setTimeout(() => {
          setScanning(true)
        }, 3000)
      }
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (err) {
      return 'Horário inválido'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Check-in de Convidados</h1>
      
      {/* Seleção de evento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecione o Evento</CardTitle>
          <CardDescription>
            Escolha o evento para realizar o check-in dos convidados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="event">Selecione o Evento</Label>
            <select
              id="event"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedEvent || ''}
              onChange={e => setSelectedEvent(e.target.value)}
            >
              <option value="">-- Selecione um evento --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
      
      {selectedEvent && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Convidados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Check-ins Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{stats.checkedIn}</p>
                  <p className="text-lg">
                    {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Scanner */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scanner de QR Code</CardTitle>
              <CardDescription>
                Escaneie o QR code do convidado ou insira o código manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="camera" onValueChange={(value) => setScanMode(value as 'camera' | 'manual')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="camera">Câmera</TabsTrigger>
                  <TabsTrigger value="manual">Código Manual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="camera">
                  <div className="space-y-4">
                    {scanning ? (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        {/* Scanner real de QR code */}
                        <div className="w-full h-full relative">
                          <div className="absolute top-2 right-2 z-10">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={stopScanning}
                              className="rounded-full w-8 h-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Html5QrcodeScanner
                            onScan={(data) => {
                              if (data && data.text) {
                                // Processamos o QR code quando ele for detectado
                                console.log('QR Code detectado:', data.text);
                                handleScan(data.text);
                              }
                            }}
                            onError={(error) => {
                              console.error('Erro no scanner:', error);
                              toast({
                                title: "Erro na câmera",
                                description: "Não foi possível acessar a câmera para leitura do QR code.",
                                variant: "destructive"
                              });
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Button 
                            size="lg" 
                            onClick={startScanning}
                            className="gap-2"
                          >
                            <Scan className="h-5 w-5" />
                            Iniciar Scanner
                          </Button>
                          <p className="mt-4 text-sm text-muted-foreground">
                            Aponte a câmera para o QR code exibido pelo convidado
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {scanning && (
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={stopScanning}
                        >
                          Parar Scanner
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="manual">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="manual-code">Código do QR</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="manual-code"
                          value={manualCode}
                          onChange={e => setManualCode(e.target.value)}
                          placeholder="event=123&guest=JohnDoe&phone=5551234567&timestamp=1234567890"
                        />
                        <Button type="submit">Verificar</Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Último resultado */}
          {lastResult && (
            <Card className={lastResult.success ? "border-green-500" : "border-red-500"}>
              <CardHeader className={lastResult.success ? "bg-green-50" : "bg-red-50"}>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {lastResult.success ? "Check-in Confirmado" : "Check-in Falhou"}
                  </CardTitle>
                  <Badge variant={lastResult.success ? "default" : "destructive"}>
                    {lastResult.success ? "Sucesso" : "Erro"}
                  </Badge>
                </div>
                <CardDescription>{lastResult.message}</CardDescription>
              </CardHeader>
              
              {lastResult.guest && (
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Nome</Label>
                      <p className="font-medium">{lastResult.guest.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{lastResult.guest.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <div className="flex items-center mt-1">
                        <UserCheck className="h-4 w-4 mr-1 text-green-500" />
                        <span>Check-in realizado</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Horário</Label>
                      <p className="font-medium">{formatTime(lastResult.guest.check_in_time)}</p>
                    </div>
                  </div>
                </CardContent>
              )}
              
              <CardFooter className="bg-gray-50">
                <Button 
                  variant="ghost" 
                  className="gap-2 ml-auto"
                  onClick={() => {
                    setLastResult(null)
                    if (scanMode === 'camera') {
                      startScanning()
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  )
} 