'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function DbTester({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventIdInput, setEventIdInput] = useState(eventId || '');

  const checkDatabase = useCallback(async () => {
    if (!eventIdInput) {
      toast({
        title: "ID do evento é obrigatório",
        description: "Informe o ID do evento para verificar os dados",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/db-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventIdInput,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao consultar banco de dados');
      }

      setData(result);
      
      // Mostrar uma notificação com o resumo dos dados encontrados
      let message = '';
      const guests = result.tables.guests?.count || 0;
      const glGuests = result.tables.guest_list_guests?.count || 0;
      const tempTable = result.tables[`guests_${eventIdInput.replace(/-/g, '_')}`]?.count || 0;
      
      const total = guests + glGuests + tempTable;
      
      if (total > 0) {
        message = `Encontrados ${total} convidados no total (${guests} na tabela guests, ${glGuests} na tabela guest_list_guests, ${tempTable} na tabela específica)`;
      } else {
        message = 'Não foram encontrados convidados em nenhuma tabela';
      }
      
      toast({
        title: "Consulta concluída",
        description: message
      });
      
    } catch (err: any) {
      console.error('Erro ao verificar banco de dados:', err);
      setError(err.message || 'Erro desconhecido');
      toast({
        title: "Erro na consulta",
        description: err.message || 'Erro desconhecido ao consultar o banco de dados',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [eventIdInput]);

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Diagnóstico de Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={eventIdInput}
              onChange={(e) => setEventIdInput(e.target.value)}
              placeholder="ID do evento"
              className="flex-1"
            />
            <Button onClick={checkDatabase} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Dados'
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <p className="font-semibold">Erro:</p>
              <p>{error}</p>
            </div>
          )}

          {data && (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumo</TabsTrigger>
                <TabsTrigger value="guests">Guests</TabsTrigger>
                <TabsTrigger value="glguests">Guest List Guests</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="bg-slate-100 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Evento</h3>
                  <p><strong>ID:</strong> {data.event_id}</p>
                  <p><strong>Timestamp:</strong> {data.timestamp}</p>
                </div>
                <div className="bg-slate-100 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Contagens</h3>
                  <p><strong>Tabela guests:</strong> {data.tables.guests?.count || 0} convidados</p>
                  <p><strong>Tabela guest_list_guests:</strong> {data.tables.guest_list_guests?.count || 0} convidados</p>
                  <p><strong>Tabela específica:</strong> {data.tables[`guests_${eventIdInput.replace(/-/g, '_')}`]?.count || 0} convidados</p>
                  <p className="font-semibold mt-2">Total: {
                    (data.tables.guests?.count || 0) + 
                    (data.tables.guest_list_guests?.count || 0) + 
                    (data.tables[`guests_${eventIdInput.replace(/-/g, '_')}`]?.count || 0)
                  } convidados</p>
                </div>
              </TabsContent>
              
              {/* Renderização condicional para evitar erros */}
              {data.tables.guests?.data && (
                <TabsContent value="guests">
                  <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-96">
                    <h3 className="font-semibold mb-2">Dados da tabela guests</h3>
                    {data.tables.guests?.error ? (
                      <p className="text-red-500">{data.tables.guests.error}</p>
                    ) : data.tables.guests?.data?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(data.tables.guests.data[0]).map(key => (
                                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.tables.guests.data.map((guest: any, index: number) => (
                              <tr key={index}>
                                {Object.values(guest).map((value: any, valueIndex: number) => (
                                  <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                                    {formatValue(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>Nenhum dado encontrado na tabela guests.</p>
                    )}
                  </div>
                </TabsContent>
              )}
              
              {/* Renderização condicional para evitar erros */}
              {data.tables.guest_list_guests?.data && (
                <TabsContent value="glguests">
                  <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-96">
                    <h3 className="font-semibold mb-2">Dados da tabela guest_list_guests</h3>
                    {data.tables.guest_list_guests?.error ? (
                      <p className="text-red-500">{data.tables.guest_list_guests.error}</p>
                    ) : data.tables.guest_list_guests?.data?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(data.tables.guest_list_guests.data[0]).map(key => (
                                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.tables.guest_list_guests.data.map((guest: any, index: number) => (
                              <tr key={index}>
                                {Object.values(guest).map((value: any, valueIndex: number) => (
                                  <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                                    {formatValue(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>Nenhum dado encontrado na tabela guest_list_guests.</p>
                    )}
                  </div>
                </TabsContent>
              )}
              
              {/* Renderização condicional para evitar erros */}
              {data.tables.permissions?.data && (
                <TabsContent value="permissions">
                  <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-96">
                    <h3 className="font-semibold mb-2">Permissões RLS</h3>
                    {data.tables.permissions?.error ? (
                      <p className="text-red-500">{data.tables.permissions.error}</p>
                    ) : data.tables.permissions?.data?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabela</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anon Select</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Select</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.tables.permissions.data.map((perm: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{perm.tablename}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={perm.anon_select ? "text-green-500" : "text-red-500"}>
                                    {perm.anon_select ? "Sim" : "Não"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={perm.auth_select ? "text-green-500" : "text-red-500"}>
                                    {perm.auth_select ? "Sim" : "Não"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>Nenhum dado encontrado sobre permissões.</p>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 