"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  slug: string
  logotipo?: string
  banner_url?: string
  address?: string
}

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  setCurrentOrganization: (org: Organization | null) => void
  isLoading: boolean
  hasOrganizations: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrganizations() {
      if (!user) {
        console.log('OrganizationContext: Nenhum usuário logado')
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        
        console.log('OrganizationContext: Buscando organizações para o usuário:', user.id)
        
        // Verificar primeiro a tabela user_organizations para confirmar relações
        const { data: userOrgsCheck, error: userOrgsCheckError } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
        
        if (userOrgsCheckError) {
          console.error('Erro ao verificar relações de organizações:', userOrgsCheckError)
          throw userOrgsCheckError
        }
        
        console.log('Relações de organizações encontradas:', userOrgsCheck?.length || 0)
        
        if (!userOrgsCheck || userOrgsCheck.length === 0) {
          console.log('Usuário não tem organizações associadas')
          setOrganizations([])
          setCurrentOrganization(null)
          setIsLoading(false)
          return
        }
        
        // Extrair IDs das organizações
        const orgIds = userOrgsCheck.map(rel => rel.organization_id)
        console.log('IDs das organizações:', orgIds)
        
        // Buscar detalhes das organizações diretamente
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds)
        
        if (orgsError) {
          console.error('Erro ao buscar detalhes das organizações:', orgsError)
          throw orgsError
        }
        
        console.log('Detalhes das organizações:', orgsData?.length || 0, orgsData)
        
        if (orgsData && orgsData.length > 0) {
          setOrganizations(orgsData)
          
          // Se não há organização selecionada, selecione a primeira
          if (!currentOrganization) {
            console.log('Selecionando a primeira organização:', orgsData[0].name, orgsData[0].id)
            setCurrentOrganization(orgsData[0])
          } else {
            // Verificar se a organização atual ainda está na lista
            const orgStillExists = orgsData.some(org => org.id === currentOrganization.id)
            if (!orgStillExists) {
              console.log('Organização atual não existe mais, selecionando a primeira:', orgsData[0].name)
              setCurrentOrganization(orgsData[0])
            }
          }
        } else {
          console.log('Nenhuma organização encontrada')
          setOrganizations([])
          setCurrentOrganization(null)
        }
      } catch (error) {
        console.error('OrganizationContext: Erro ao carregar organizações:', error)
        setOrganizations([])
        setCurrentOrganization(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadOrganizations()
  }, [user, currentOrganization?.id]) // Adicionando apenas o ID para evitar loops de renderização

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        isLoading,
        hasOrganizations: organizations.length > 0
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
} 