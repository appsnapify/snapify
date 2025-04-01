"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
  email: string
  address: string
  contacts: string
  instagram: string
  youtube: string
  facebook: string
  logo_url: string
  banner_url: string
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  image_url: string
}

interface OrganizationClientProps {
  slug: string
}

export default function OrganizationClient({ slug }: OrganizationClientProps) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrganization() {
      try {
        // Carregar organização
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single()

        if (orgError) throw orgError
        setOrganization(org)

        // Carregar eventos próximos
        const { data: upcoming, error: upcomingError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', org.id)
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })

        if (upcomingError) throw upcomingError
        setUpcomingEvents(upcoming || [])

        // Carregar eventos passados
        const { data: past, error: pastError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', org.id)
          .lt('date', new Date().toISOString())
          .order('date', { ascending: false })

        if (pastError) throw pastError
        setPastEvents(past || [])
      } catch (error) {
        console.error('Erro ao carregar organização:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrganization()
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Organização não encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-64 bg-gray-200">
        {organization.banner_url ? (
          <Image
            src={organization.banner_url}
            alt="Banner da organização"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400">Sem banner</p>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          {/* Logo */}
          <div className="absolute -top-16 left-4">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white">
              {organization.logo_url ? (
                <Image
                  src={organization.logo_url}
                  alt="Logo da organização"
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-400">Sem logo</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="pt-20">
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>

            <div className="mt-4 space-y-2">
              <p className="text-gray-600">{organization.email}</p>
              <p className="text-gray-600">{organization.address}</p>
              <p className="text-gray-600">{organization.contacts}</p>
            </div>

            {/* Redes Sociais */}
            <div className="mt-4 flex space-x-4">
              {organization.instagram && (
                <a
                  href={`https://instagram.com/${organization.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Instagram
                </a>
              )}
              {organization.youtube && (
                <a
                  href={organization.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  YouTube
                </a>
              )}
              {organization.facebook && (
                <a
                  href={organization.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Eventos */}
        <div className="mt-12">
          {/* Eventos Próximos */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Próximos Eventos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative h-48">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <p className="text-gray-400">Sem imagem</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-2 text-gray-600">{event.description}</p>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>{new Date(event.date).toLocaleDateString()}</p>
                      <p>{event.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos Passados */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Eventos Passados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative h-48">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <p className="text-gray-400">Sem imagem</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-2 text-gray-600">{event.description}</p>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>{new Date(event.date).toLocaleDateString()}</p>
                      <p>{event.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 