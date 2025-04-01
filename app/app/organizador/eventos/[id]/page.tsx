import { Metadata } from 'next'
import EventoDetalhesClient from './EventoDetalhesClient'

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

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  return {
    title: `Evento ${resolvedParams.id} - Detalhes`,
  }
}

export default async function EventoDetalhesPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  return <EventoDetalhesClient id={resolvedParams.id} event={event} />
}

