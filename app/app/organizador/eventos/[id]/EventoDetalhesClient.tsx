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

interface EventoDetalhesClientProps {
  id: string;
  event: {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    status: string;
    tickets: {
      sold: number;
      total: number;
      price: number;
    };
    revenue: {
      total: number;
      today: number;
    };
    recentSales: Array<{
      id: number;
      buyer: string;
      quantity: number;
      total: number;
      date: string;
    }>;
  };
}

export default function EventoDetalhesClient({ id, event }: EventoDetalhesClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    try {
      switch (action) {
        case 'edit':
          router.push(`/app/organizador/eventos/${id}/editar`)
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
      {/* Resto do JSX existente */}
    </div>
  )
} 