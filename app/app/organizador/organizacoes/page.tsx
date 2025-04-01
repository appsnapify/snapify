"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  slug: string
  logotipo?: string
  banner_url?: string
  address?: string
}

interface UserOrgJoin {
  organization_id: string
  role: string
  organizations: {
    id: string
    name: string
    slug: string
    logotipo?: string
    banner_url?: string
    address?: string
  }
}

export default function OrganizationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrganizations() {
      if (!user) return

      try {
        const supabase = createClient()
        
        console.log('OrganizationsPage: Buscando organizações para o usuário:', user.id)
        console.log('OrganizationsPage: Email do usuário:', user.email)
        
        // Buscar organizações do usuário
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          
        if (userOrgsError) {
          console.error('OrganizationsPage: Erro ao buscar relações user_organizations:', userOrgsError)
          throw userOrgsError
        }
        
        console.log('OrganizationsPage: Relações encontradas:', userOrgs ? userOrgs.length : 0)
        
        if (!userOrgs || userOrgs.length === 0) {
          console.log('OrganizationsPage: Usuário não tem organizações')
          setOrganizations([])
          setLoading(false)
          return
        }
        
        // Extrair IDs das organizações
        const orgIds = userOrgs.map(rel => rel.organization_id)
        console.log('OrganizationsPage: IDs das organizações:', orgIds)
        
        // Buscar detalhes das organizações usando JOIN
        const { data, error } = await supabase
          .from('user_organizations')
          .select(`
            organization_id,
            role,
            organizations:organization_id (
              id,
              name,
              slug,
              logotipo,
              banner_url,
              address
            )
          `)
          .eq('user_id', user.id)
          
        if (error) {
          console.error('OrganizationsPage: Erro ao buscar organizações com JOIN:', error)
          
          // Tente buscar diretamente da tabela organizations como fallback
          console.log('OrganizationsPage: Tentando buscar diretamente da tabela organizations')
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .in('id', orgIds)
            
          if (orgsError) {
            console.error('OrganizationsPage: Erro no fallback:', orgsError)
            throw orgsError
          }
          
          console.log('OrganizationsPage: Organizações encontradas via fallback:', orgsData ? orgsData.length : 0)
          setOrganizations(orgsData || [])
          setLoading(false)
          return
        }
        
        console.log('OrganizationsPage: Dados recebidos do Supabase:', data)
        
        // Formatar os dados - adicionando verificação de tipo
        const formattedData = (data as UserOrgJoin[])
          .filter(item => item.organizations)
          .map(item => ({
            id: item.organizations.id,
            name: item.organizations.name,
            slug: item.organizations.slug,
            logotipo: item.organizations.logotipo,
            banner_url: item.organizations.banner_url,
            address: item.organizations.address,
            role: item.role
          }))
        
        console.log('OrganizationsPage: Organizações formatadas:', formattedData.length)
        setOrganizations(formattedData)
      } catch (error) {
        console.error('OrganizationsPage: Erro ao carregar organizações:', error)
        toast.error('Não foi possível carregar suas organizações')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrganizations()
  }, [user])
  
  if (!user) {
    return (
      <div className="container py-8 text-center">
        <p>Por favor, faça login para ver suas organizações.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">
          Fazer Login
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suas Organizações</h1>
        <Button onClick={() => router.push('/app/organizador/organizacoes/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Organização
        </Button>
      </div>
      
      {loading ? (
        <p className="text-center py-8">Carregando organizações...</p>
      ) : organizations.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Nenhuma organização encontrada</h2>
          <p className="text-muted-foreground mb-6">
            Você ainda não criou ou não faz parte de nenhuma organização.
          </p>
          <Button onClick={() => router.push('/app/organizador/organizacoes/nova')}>
            <Plus className="mr-2 h-4 w-4" />
            Criar sua primeira organização
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              {/* Banner */}
              <div className="h-32 bg-gray-100">
                {org.banner_url && (
                  <img
                    src={org.banner_url}
                    alt={`Banner de ${org.name}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Logo */}
              <div className="relative -mt-10 px-4">
                <div className="h-20 w-20 rounded-full border-4 border-white bg-white overflow-hidden">
                  {org.logotipo ? (
                    <img
                      src={org.logotipo}
                      alt={`Logo de ${org.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                {org.address && (
                  <p className="text-sm text-muted-foreground">{org.address}</p>
                )}
              </CardHeader>
              
              <CardFooter className="flex justify-between">
                <Link href={`/app/organizador/organizacoes/${org.id}`}>
                  <Button variant="outline">Visualizar</Button>
                </Link>
                <Link href={`/app/organizador/organizacoes/${org.id}/edit`}>
                  <Button>Gerenciar</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 