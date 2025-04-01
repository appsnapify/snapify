"use client"

import { Card } from '@/components/ui/card'
import { Instagram, Facebook, Twitter, Globe } from 'lucide-react'

interface OrganizationPreviewProps {
  formData: {
    name: string
    banner?: File
    logo?: File
    address?: string
    instagram?: string
    facebook?: string
    twitter?: string
    website?: string
  }
}

export function OrganizationPreview({ formData }: OrganizationPreviewProps) {
  // Função para gerar URL temporária para preview de imagens
  const getImagePreviewUrl = (file?: File) => {
    if (!file) return ''
    return URL.createObjectURL(file)
  }

  // Função para renderizar ícone de rede social
  const renderSocialIcon = (type: string, url?: string) => {
    if (!url) return null

    const icons = {
      instagram: <Instagram className="h-5 w-5" />,
      facebook: <Facebook className="h-5 w-5" />,
      twitter: <Twitter className="h-5 w-5" />,
      website: <Globe className="h-5 w-5" />
    }

    // Garantir que a URL está completa
    const getFullUrl = (url: string, type: string) => {
      if (url.startsWith('http')) return url
      
      switch(type) {
        case 'instagram':
          return `https://instagram.com/${url.replace('@', '')}`
        case 'facebook':
          return `https://facebook.com/${url}`
        case 'twitter':
          return `https://twitter.com/${url.replace('@', '')}`
        default:
          return url.startsWith('http') ? url : `https://${url}`
      }
    }

    return (
      <a 
        href={getFullUrl(url, type)} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900"
      >
        {icons[type as keyof typeof icons]}
      </a>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Banner */}
      <div className="relative h-32 w-full bg-gray-100">
        {formData.banner && (
          <img
            src={getImagePreviewUrl(formData.banner)}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Logo */}
      <div className="relative -mt-12 px-4">
        <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden">
          {formData.logo && (
            <img
              src={getImagePreviewUrl(formData.logo)}
              alt="Logo"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="p-4">
        <h2 className="text-xl font-bold">{formData.name}</h2>
        
        {formData.address && (
          <p className="mt-2 text-gray-600">{formData.address}</p>
        )}

        {/* Redes Sociais */}
        <div className="mt-4 flex gap-3">
          {renderSocialIcon('instagram', formData.instagram)}
          {renderSocialIcon('facebook', formData.facebook)}
          {renderSocialIcon('twitter', formData.twitter)}
          {renderSocialIcon('website', formData.website)}
        </div>
      </div>
    </Card>
  )
} 