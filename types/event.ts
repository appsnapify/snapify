export interface Event {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  organizationId: string
  tickets: {
    sold: number
    total: number
    price: number
  }
  revenue: {
    total: number
    today: number
  }
  status: 'active' | 'cancelled' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface EventFormData {
  title: string
  description: string
  date: Date
  time: string
  location: string
  tickets: {
    total: number
    price: number
  }
  status: 'active' | 'cancelled' | 'completed' | 'archived'
} 