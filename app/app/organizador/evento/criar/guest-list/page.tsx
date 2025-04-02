'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@supabase/supabase-js'
import { useOrganization } from '@/app/contexts/organization-context'
import { v4 as uuidv4 } from 'uuid'

// Inicializar cliente do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Schema do formulário
const GuestListFormSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  startDate: z.date({
    required_error: 'A data de início é obrigatória',
  }),
  endDate: z.date({
    required_error: 'A data de término é obrigatória',
  }),
  location: z.string().min(3, 'O local deve ter pelo menos 3 caracteres'),
  flyer: z.instanceof(FileList).optional(),
  maxGuests: z.number().min(1, 'O número mínimo de convidados é 1'),
  promoterCommission: z.number().min(0, 'A comissão não pode ser negativa'),
  requiresApproval: z.boolean().default(false),
})

type GuestListFormValues = z.infer<typeof GuestListFormSchema>

export default function GuestListPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const { currentOrganization } = useOrganization()

  const form = useForm<GuestListFormValues>({
    resolver: zodResolver(GuestListFormSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      maxGuests: 50,
      promoterCommission: 0,
      requiresApproval: false,
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFlyerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Atualizamos o campo flyer no formulário
      form.setValue('flyer', e.target.files as FileList)
    }
  }

  const onSubmitGuestList = async (data: GuestListFormValues) => {
    if (!currentOrganization) {
      toast({
        title: "Nenhuma organização selecionada",
        description: "Você precisa selecionar uma organização para criar um evento",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Dados do formulário:", data)
      
      let flyerUrl = null
      
      // Fazer upload do flyer se fornecido
      if (data.flyer && data.flyer.length > 0) {
        const file = data.flyer[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        
        console.log("Iniciando upload do flyer:", fileName)
        
        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, file)
          
        if (uploadError) {
          console.error("Erro no upload:", uploadError)
          throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`)
        }
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName)
          
        flyerUrl = publicUrlData.publicUrl
        console.log("URL do flyer:", flyerUrl)
      }

      // Construir objeto do evento
      const eventData = {
        name: data.name,
        description: data.description,
        start_date: new Date(data.startDate).toISOString(),
        end_date: new Date(data.endDate).toISOString(),
        location: data.location,
        flyer_url: flyerUrl,
        organization_id: currentOrganization.id,
        type: 'guest-list',
        is_published: true,
        guest_list_settings: {
          max_guests: data.maxGuests,
          promoter_commission: data.promoterCommission,
          requires_approval: data.requiresApproval
        }
      }
      
      console.log("Dados do evento para inserção:", eventData)
      
      // Inserir evento no Supabase
      const { data: insertedEvent, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()
      
      if (error) {
        console.error("Erro ao inserir evento:", error)
        throw new Error(`Erro ao criar evento: ${error.message}`)
      }
      
      console.log("Evento inserido com sucesso:", insertedEvent)
      
      toast({
        title: "Guest List criada com sucesso",
        description: "Sua guest list foi criada e já está disponível"
      })
      
      // Redirecionar para a página de eventos
      router.push('/app/organizador/eventos')
    } catch (error) {
      console.error("Erro ao processar formulário:", error)
      toast({
        title: "Erro ao criar guest list",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar sua guest list",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Criar Guest List</h1>
        <p className="text-gray-500">
          Configure os detalhes da sua guest list
        </p>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitGuestList)} className="space-y-6">
            {/* Informações básicas do evento */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Informações do Evento</h2>
              
              <FormField
                control={form.control}
                name="name"
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
                control={form.control}
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
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
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
                                format(field.value, 'dd/MM/yyyy')
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
                              date < new Date()
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
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término</FormLabel>
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
                                format(field.value, 'dd/MM/yyyy')
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
                              form.getValues('startDate') && date < form.getValues('startDate')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
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
            </div>

            {/* Upload do flyer */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Flyer do Evento</h2>
              
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

            {/* Configurações da guest list */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Configurações da Guest List</h2>
              
              <FormField
                control={form.control}
                name="maxGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Convidados</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Defina o número máximo de pessoas na guest list
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="promoterCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão para Promoters (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Porcentagem que os promoters ganharão por cada convidado confirmado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Requer Aprovação</FormLabel>
                      <FormDescription>
                        Convidados precisarão de aprovação antes de serem adicionados à lista
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Guest List'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
} 