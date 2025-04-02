'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@supabase/supabase-js'
import { useOrganization } from '@/app/contexts/organization-context'

// Inicializar cliente do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ticketsFormSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
  date: z.date({
    required_error: 'A data é obrigatória',
  }),
  time: z.string().min(1, 'O horário é obrigatório'),
  location: z.string().min(1, 'O local é obrigatório'),
  totalTickets: z.number().min(1, 'O número de ingressos deve ser maior que 0'),
  price: z.number().min(0, 'O preço não pode ser negativo'),
})

const guestListFormSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
  date: z.date({
    required_error: 'A data é obrigatória',
  }),
  time: z.string().min(1, 'O horário é obrigatório'),
  location: z.string().min(1, 'O local é obrigatório'),
  flyer: z.instanceof(FileList).refine(files => files.length > 0, {
    message: 'O flyer é obrigatório',
  }),
})

export default function CriarEventoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [eventType, setEventType] = useState<'tickets' | 'guestlist'>('tickets')
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const { currentOrganization } = useOrganization()

  const ticketsForm = useForm<z.infer<typeof ticketsFormSchema>>({
    resolver: zodResolver(ticketsFormSchema),
    defaultValues: {
      title: '',
      description: '',
      time: '',
      location: '',
      totalTickets: 100,
      price: 0,
    },
  })

  const guestListForm = useForm<z.infer<typeof guestListFormSchema>>({
    resolver: zodResolver(guestListFormSchema),
    defaultValues: {
      title: '',
      description: '',
      time: '',
      location: '',
    },
  })

  const onSubmitTickets = async (values: z.infer<typeof ticketsFormSchema>) => {
    setIsLoading(true)
    try {
      // Aqui seria a chamada para a API para criar o evento de bilhetes
      console.log('Ticket event values:', values)
      toast({
        title: "Evento criado com sucesso!",
        description: "Seu evento de bilhetes foi criado."
      })
      router.push('/app/organizador/eventos')
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro ao criar evento",
        description: "Ocorreu um erro ao criar o evento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitGuestList = async (values: z.infer<typeof guestListFormSchema>) => {
    if (!currentOrganization) {
      toast({
        title: "Erro ao criar evento",
        description: "Nenhuma organização selecionada.",
        variant: "destructive"
      })
      return
    }

    console.log("Iniciando criação de evento guest list", { values, organization: currentOrganization.id });
    setIsLoading(true)
    try {
      // Fazer upload do flyer para o Storage
      const flyerFile = values.flyer[0]
      const fileExt = flyerFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `guest-list-flyers/${fileName}`
      
      console.log("Iniciando upload do flyer", { fileName, filePath });
      
      // Verificar se o bucket existe
      const { data: buckets } = await supabase
        .storage
        .listBuckets();
      
      console.log("Buckets disponíveis:", buckets);
      
      // Se o bucket 'event-images' não existir, usar 'images' ou outro bucket disponível
      let bucketName = 'event-images';
      if (buckets && !buckets.find(b => b.name === 'event-images')) {
        // Tenta usar o primeiro bucket disponível
        if (buckets.length > 0) {
          bucketName = buckets[0].name;
          console.log(`Bucket 'event-images' não encontrado. Usando bucket alternativo: ${bucketName}`);
        } else {
          throw new Error("Nenhum bucket de armazenamento disponível. Contate o administrador.");
        }
      }
      
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, flyerFile)
      
      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw new Error(`Erro ao fazer upload do flyer: ${uploadError.message}`)
      }
      
      console.log("Upload concluído com sucesso", uploadData);
      
      // Obter URL pública do flyer
      const { data: urlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath)
      
      console.log("URL pública do flyer:", urlData);
      
      // Criar o evento no banco de dados
      const isoDate = values.date.toISOString()
      
      const eventData = {
        organization_id: currentOrganization.id,
        title: values.title,
        description: values.description,
        location: values.location,
        date: isoDate,
        time: values.time,
        flyer_url: urlData?.publicUrl,
        is_active: true
      };
      
      console.log("Dados do evento a serem salvos:", eventData);
      
      const { data: event, error: eventError } = await supabase
        .from('guest_list_events')
        .insert(eventData)
        .select()
        .single()
      
      if (eventError) {
        console.error("Erro ao inserir evento:", eventError);
        throw new Error(`Erro ao criar evento: ${eventError.message}`)
      }
      
      console.log("Evento criado com sucesso:", event);
      
      toast({
        title: "Evento Guest List criado!",
        description: "Seu evento com guest list foi criado com sucesso."
      })
      
      // Redirecionar para a página do evento ou lista de eventos
      router.push('/app/organizador/eventos')
    } catch (error) {
      console.error("Erro completo:", error)
      toast({
        title: "Erro ao criar evento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o evento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFlyerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Atualizamos o campo flyer no formulário
      guestListForm.setValue('flyer', e.target.files as FileList)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Criar Evento</h1>
        <p className="text-gray-500">
          Preencha os detalhes do seu evento
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="tickets" onValueChange={(value) => setEventType(value as 'tickets' | 'guestlist')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tickets">Bilhetes</TabsTrigger>
            <TabsTrigger value="guestlist">Guest List</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets">
            <Form {...ticketsForm}>
              <form onSubmit={ticketsForm.handleSubmit(onSubmitTickets)} className="space-y-6">
                <FormField
                  control={ticketsForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Festa de Verão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ticketsForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva seu evento..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={ticketsForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ticketsForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={ticketsForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Arena Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={ticketsForm.control}
                    name="totalTickets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Ingressos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ticketsForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Criar Evento com Bilhetes'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="guestlist">
            <Form {...guestListForm}>
              <form onSubmit={guestListForm.handleSubmit(onSubmitGuestList)} className="space-y-6">
                <FormField
                  control={guestListForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Festa VIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={guestListForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva seu evento exclusivo..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={guestListForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={guestListForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={guestListForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Club Premium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel htmlFor="flyer">Flyer do Evento</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => document.getElementById('flyer-upload')?.click()}>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Clique para fazer upload do flyer</p>
                        <p className="text-xs text-gray-400">PNG, JPG ou GIF até 5MB</p>
                        <input
                          id="flyer-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                      {guestListForm.formState.errors.flyer && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {guestListForm.formState.errors.flyer.message as string}
                        </p>
                      )}
                    </div>
                    
                    {flyerPreview && (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={flyerPreview} 
                          alt="Flyer preview" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Criar Guest List'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 