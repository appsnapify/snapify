"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900">500</h1>
        <h2 className="text-2xl font-medium text-gray-600 mt-4">
          Ocorreu um erro
        </h2>
        <p className="text-gray-500 mt-2">
          Desculpe, algo deu errado. Por favor, tente novamente.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
          <Button onClick={() => reset()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  )
} 