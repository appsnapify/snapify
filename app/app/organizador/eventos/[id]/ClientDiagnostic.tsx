'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Importação dinâmica do componente pesado
const DbTester = lazy(() => import('../DbTester'));

export default function ClientDiagnostic({ eventId }: { eventId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Resetar o estado se o ID do evento mudar
  useEffect(() => {
    setIsExpanded(false);
  }, [eventId]);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setIsLoading(true);
      // Simular um pequeno atraso para mostrar o carregamento
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Diagnóstico de Dados</span>
          <Button 
            onClick={handleExpandClick} 
            variant="outline" 
            size="sm"
          >
            {isExpanded ? 'Fechar' : 'Abrir'} Ferramenta
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          isLoading ? (
            <div className="text-center py-4">Carregando diagnóstico...</div>
          ) : (
            <Suspense fallback={<div className="text-center py-4">Carregando ferramenta diagnóstica...</div>}>
              <DbTester eventId={eventId} />
            </Suspense>
          )
        ) : (
          <p className="text-gray-500">
            Use esta ferramenta para diagnosticar problemas com os dados do evento.
            Clique em &quot;Abrir Ferramenta&quot; para começar.
          </p>
        )}
      </CardContent>
    </Card>
  );
} 