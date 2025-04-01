import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  color: string
}

export function KPICard({ title, value, change, icon: Icon, color }: KPICardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg')} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          Comparado com o mês anterior:{" "}
          <span className={change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
            {change}
          </span>
        </p>
      </div>
    </Card>
  )
} 