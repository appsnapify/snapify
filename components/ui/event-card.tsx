import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EventCardProps {
  id: number
  title: string
  date: string
  time: string
  location: string
  progress: number
  tickets: string
}

export function EventCard({
  title,
  date,
  time,
  location,
  progress,
  tickets,
}: EventCardProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">{date}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span className="text-sm">{time}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Ticket className="h-4 w-4 mr-2" />
          <span className="text-sm">{tickets} bilhetes</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progresso de vendas</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Card>
  )
} 