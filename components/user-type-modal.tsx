"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building, Users } from "lucide-react"

interface UserTypeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserTypeModal({ isOpen, onClose }: UserTypeModalProps) {
  const router = useRouter()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md relative"
          >
            <div className="flex justify-between items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                T3cket
              </Link>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Escolha seu perfil</h2>
            <p className="text-gray-600 text-center mb-8">
              Selecione o tipo de conta que deseja criar
            </p>

            <div className="space-y-4">
              <Link
                href="/register?type=organizer"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex flex-col items-center gap-2 hover:bg-indigo-50 transition-colors"
                >
                  <Building className="h-8 w-8 text-indigo-600" />
                  <span className="text-lg font-medium">Organizador</span>
                  <span className="text-sm text-gray-500 text-center">
                    Crie e gerencie eventos
                  </span>
                </Button>
              </Link>

              <Link
                href="/register?type=promoter"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex flex-col items-center gap-2 hover:bg-purple-50 transition-colors"
                >
                  <Users className="h-8 w-8 text-purple-600" />
                  <span className="text-lg font-medium">Promotor</span>
                  <span className="text-sm text-gray-500 text-center">
                    Venda ingressos e ganhe comissões
                  </span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 