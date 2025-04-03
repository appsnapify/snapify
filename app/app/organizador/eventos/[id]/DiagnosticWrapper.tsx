'use client';

import { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';

// Importe dinâmico do componente ClientDiagnostic com ssr:false
const ClientDiagnostic = dynamic(() => import('./ClientDiagnostic'), {
  ssr: false,
  loading: () => <div className="p-4 bg-slate-50 rounded-md">Carregando ferramenta de diagnóstico...</div>
});

export default function DiagnosticWrapper({ eventId }: { eventId: string }) {
  return (
    <Suspense fallback={<div className="p-4 bg-slate-50 rounded-md">Carregando diagnóstico...</div>}>
      <ClientDiagnostic eventId={eventId} />
    </Suspense>
  );
} 