import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-medium text-gray-600 mt-4">
          Página não encontrada
        </h2>
        <p className="text-gray-500 mt-2">
          A página que você está procurando não existe ou foi removida.
        </p>
        <Link href="/">
          <Button className="mt-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    </div>
  )
} 