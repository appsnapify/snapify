import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase com service role para ter acesso completo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Obter ID do evento da URL
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ 
        error: 'ID do evento é obrigatório' 
      }, { status: 400 });
    }
    
    console.log(`API GuestCount - Buscando contagem para evento: ${eventId}`);
    
    // 1. Buscar na tabela guests
    const { data: guestsData, error: guestsError } = await supabaseAdmin
      .from('guests')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId);
    
    if (guestsError) {
      console.error(`API GuestCount - Erro ao buscar guests: ${guestsError.message}`);
      return NextResponse.json({ 
        error: guestsError.message 
      }, { status: 500 });
    }
    
    // Retornar a contagem com cache-control para evitar cache
    console.log(`API GuestCount - Encontrados ${guestsData.length} convidados para evento ${eventId}`);
    return new NextResponse(
      JSON.stringify({
        count: guestsData.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
    
  } catch (error) {
    console.error('API GuestCount - Erro:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor' 
    }, { status: 500 });
  }
} 