"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function DebugPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [repairStatus, setRepairStatus] = useState<any>(null)

  async function runDebugCheck() {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      console.log('Executando diagnóstico para usuário:', user.id)
      
      // Chamar a função de debug
      const { data, error } = await supabase.rpc('debug_user_organizations', {
        user_uuid: user.id
      })
      
      if (error) {
        console.error('Erro ao executar diagnóstico:', error)
        toast.error('Erro ao verificar organizações')
        return
      }
      
      console.log('Resultado do diagnóstico:', data)
      setDebugData(data)
      
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro ao executar diagnóstico')
    } finally {
      setLoading(false)
    }
  }
  
  async function repairOrganization(orgId: string) {
    if (!user || !orgId) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      
      console.log('Reparando relação para organização:', orgId)
      
      // Chamar a função de reparo
      const { data, error } = await supabase.rpc('repair_user_organization', {
        p_user_id: user.id,
        p_organization_id: orgId
      })
      
      if (error) {
        console.error('Erro ao reparar relação:', error)
        toast.error('Erro ao reparar relação')
        return
      }
      
      setRepairStatus(data)
      
      if (data.created) {
        toast.success('Relação reparada com sucesso')
      } else if (data.relation_exists) {
        toast.info('Relação já existe, não foi necessário reparar')
      } else {
        toast.warning('Não foi possível reparar a relação', {
          description: 'Verifique se o usuário e a organização existem.'
        })
      }
      
      // Atualizar diagnóstico
      runDebugCheck()
      
    } catch (error) {
      console.error('Erro inesperado ao reparar:', error)
      toast.error('Erro ao reparar relação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Organizações</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Informações do Usuário</h2>
        {user ? (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Criado em:</strong> {new Date(user.created_at).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-yellow-600">Usuário não autenticado</p>
        )}
      </div>
      
      <div className="mb-8">
        <Button 
          onClick={runDebugCheck} 
          disabled={loading || !user}
          className="mb-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verificar Organizações
        </Button>
        
        {debugData && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Resultado:</h3>
            
            <div className="mb-4">
              <p><strong>Usuário Existe:</strong> {debugData.user_exists ? '✅ Sim' : '❌ Não'}</p>
              <p><strong>Relações user_organizations:</strong> {Array.isArray(debugData.user_organizations) ? debugData.user_organizations.length : 0}</p>
              <p><strong>Organizações:</strong> {Array.isArray(debugData.organizations) ? debugData.organizations.length : 0}</p>
            </div>
            
            {debugData.user_organizations && debugData.user_organizations.length > 0 ? (
              <div className="mb-4">
                <h4 className="font-medium">Relações:</h4>
                <ul className="list-disc pl-5">
                  {debugData.user_organizations.map((rel: any, i: number) => (
                    <li key={i}>
                      <p>
                        <strong>Organization ID:</strong> {rel.organization_id}
                        <br />
                        <strong>Role:</strong> {rel.role}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-yellow-600 mb-4">Nenhuma relação user_organizations encontrada</p>
            )}
            
            {debugData.organizations && debugData.organizations.length > 0 ? (
              <div>
                <h4 className="font-medium">Organizações:</h4>
                <ul className="list-disc pl-5">
                  {debugData.organizations.map((org: any, i: number) => (
                    <li key={i}>
                      <p>
                        <strong>ID:</strong> {org.id}
                        <br />
                        <strong>Nome:</strong> {org.name}
                        <br />
                        <strong>Slug:</strong> {org.slug}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-yellow-600">Nenhuma organização encontrada</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Reparar Relação</h2>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="ID da Organização"
            className="border rounded p-2 flex-1"
            id="org-id-repair"
          />
          <Button 
            onClick={() => {
              const orgId = (document.getElementById('org-id-repair') as HTMLInputElement).value
              if (!orgId) {
                toast.error('Informe o ID da organização')
                return
              }
              repairOrganization(orgId)
            }}
            disabled={loading || !user}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reparar
          </Button>
        </div>
        
        {repairStatus && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Status da Reparação:</h3>
            <p><strong>Usuário Existe:</strong> {repairStatus.user_exists ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Organização Existe:</strong> {repairStatus.org_exists ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Relação Existia:</strong> {repairStatus.relation_exists ? '✅ Sim' : '❌ Não'}</p>
            {repairStatus.created !== undefined && (
              <p><strong>Relação Criada:</strong> {repairStatus.created ? '✅ Sim' : '❌ Não'}</p>
            )}
            {repairStatus.error && (
              <p className="text-red-500"><strong>Erro:</strong> {repairStatus.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 