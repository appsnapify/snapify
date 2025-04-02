import { Metadata } from 'next'
import { supabase } from '@/lib/supabase';
import DbTester from '../DbTester';
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

interface PageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Evento ${params.id} - Detalhes`,
  }
}

async function fetchEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Erro ao carregar evento: ${error.message}`);
  }
  
  return data;
}

export default async function EventoDetalhesPage({ params }: PageProps) {
  // Carrega os dados do evento no servidor
  let event;
  let errorMessage = null;

  try {
    event = await fetchEvent(params.id);
  } catch (err: any) {
    errorMessage = err.message || 'Erro ao carregar evento';
    console.error('Erro ao carregar evento:', err);
  }

  if (errorMessage) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Erro</h2>
        <p>{errorMessage}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Evento não encontrado</h2>
        <p>O evento solicitado não foi encontrado.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
            className="mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-gray-500">{event.type === 'guest-list' ? 'Guest List' : 'Evento'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Descrição</h3>
              <p>{event.description || 'Sem descrição'}</p>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2 text-gray-500" />
                <span>{event.location}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {event.type === 'guest-list' && (
          <Card>
            <CardHeader>
              <CardTitle>Guest List</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Verifique abaixo os dados de convidados registrados para este evento.
              </p>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `/app/organizador/eventos/checkin?event=${params.id}`}
                >
                  Check-in
                </Button>
                <Button 
                  onClick={() => window.location.href = `/g/${params.id}`}
                  variant="default"
                >
                  Ver página pública
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ferramenta de diagnóstico de dados */}
      {event.type === 'guest-list' && (
        <Suspense fallback={<div>Carregando diagnóstico...</div>}>
          <ClientDiagnostic eventId={params.id} />
        </Suspense>
      )}
    </div>
  );
}

// Componente cliente para renderizar a ferramenta de diagnóstico
'use client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ClientDiagnostic({ eventId }: { eventId: string }) {
  return <DbTester eventId={eventId} />;
}

