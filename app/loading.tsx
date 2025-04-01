import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto" />
        <p className="text-gray-600 mt-4">A carregar...</p>
      </div>
    </div>
  )
} 