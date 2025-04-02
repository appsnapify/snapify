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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('DB-Schema API - Solicitação recebida:', body);
    
    // Se não tiver event_id, retorna erro
    if (!body.event_id) {
      return NextResponse.json({ 
        error: 'event_id é obrigatório' 
      }, { status: 400 });
    }
    
    const event_id = body.event_id;
    const results = {};
    
    // 1. Verificar tabela guests
    try {
      console.log(`DB-Schema API - Verificando guests para evento ${event_id}`);
      const { data: guestsData, error: guestsError } = await supabaseAdmin
        .from('guests')
        .select('*')
        .eq('event_id', event_id);
        
      if (guestsError) {
        console.error('DB-Schema API - Erro ao consultar guests:', guestsError);
        results['guests'] = { error: guestsError.message };
      } else {
        console.log(`DB-Schema API - Encontrados ${guestsData?.length || 0} registros em guests`);
        results['guests'] = { 
          count: guestsData?.length || 0,
          data: guestsData
        };
      }
    } catch (err) {
      console.error('DB-Schema API - Erro ao processar guests:', err);
      results['guests'] = { error: 'Erro interno ao consultar guests' };
    }
    
    // 2. Verificar tabela guest_list_guests
    try {
      console.log(`DB-Schema API - Verificando guest_list_guests para evento ${event_id}`);
      const { data: glGuestsData, error: glGuestsError } = await supabaseAdmin
        .from('guest_list_guests')
        .select('*')
        .eq('event_id', event_id);
        
      if (glGuestsError) {
        console.error('DB-Schema API - Erro ao consultar guest_list_guests:', glGuestsError);
        results['guest_list_guests'] = { error: glGuestsError.message };
      } else {
        console.log(`DB-Schema API - Encontrados ${glGuestsData?.length || 0} registros em guest_list_guests`);
        results['guest_list_guests'] = { 
          count: glGuestsData?.length || 0,
          data: glGuestsData?.slice(0, 5) // Limitar a 5 registros para não sobrecarregar
        };
      }
    } catch (err) {
      console.error('DB-Schema API - Erro ao processar guest_list_guests:', err);
      results['guest_list_guests'] = { error: 'Erro interno ao consultar guest_list_guests' };
    }
    
    // 3. Verificar tabela específica para este evento
    const tempTableName = `guests_${event_id.replace(/-/g, '_')}`;
    try {
      console.log(`DB-Schema API - Verificando tabela específica ${tempTableName}`);
      
      // Verificar se a tabela existe primeiro
      const { data: checkData, error: checkError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = '${tempTableName}'
        )`
      });
      
      if (checkError) {
        console.error(`DB-Schema API - Erro ao verificar se tabela ${tempTableName} existe:`, checkError);
        results[tempTableName] = { error: 'Erro ao verificar existência da tabela' };
      } else {
        const tableExists = checkData?.result?.[0]?.exists || false;
        
        if (tableExists) {
          // Tabela existe, buscar dados
          const { data: tempData, error: tempError } = await supabaseAdmin.rpc('exec_sql', {
            sql: `SELECT * FROM "${tempTableName}" WHERE event_id = '${event_id}'`
          });
          
          if (tempError) {
            console.error(`DB-Schema API - Erro ao consultar ${tempTableName}:`, tempError);
            results[tempTableName] = { error: tempError.message };
          } else {
            const rows = tempData?.result || [];
            console.log(`DB-Schema API - Encontrados ${rows.length} registros em ${tempTableName}`);
            results[tempTableName] = { 
              count: rows.length,
              data: rows.slice(0, 5) // Limitar a 5 registros
            };
          }
        } else {
          console.log(`DB-Schema API - Tabela ${tempTableName} não existe`);
          results[tempTableName] = { exists: false };
        }
      }
    } catch (err) {
      console.error(`DB-Schema API - Erro ao processar ${tempTableName}:`, err);
      results[tempTableName] = { error: 'Erro interno ao consultar tabela específica' };
    }
    
    // 4. Verificar permissões das tabelas
    try {
      console.log('DB-Schema API - Verificando permissões RLS');
      const { data: rlsData, error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT tablename, has_table_privilege('anon', tablename, 'SELECT') as anon_select,
                 has_table_privilege('authenticated', tablename, 'SELECT') as auth_select
          FROM pg_tables
          WHERE schemaname = 'public' AND tablename LIKE 'guest%'
        `
      });
      
      if (rlsError) {
        console.error('DB-Schema API - Erro ao verificar permissões RLS:', rlsError);
        results['permissions'] = { error: rlsError.message };
      } else {
        console.log('DB-Schema API - Permissões RLS:', rlsData?.result);
        results['permissions'] = { data: rlsData?.result };
      }
    } catch (err) {
      console.error('DB-Schema API - Erro ao processar permissões RLS:', err);
      results['permissions'] = { error: 'Erro interno ao verificar permissões' };
    }
    
    return NextResponse.json({
      success: true,
      event_id,
      timestamp: new Date().toISOString(),
      tables: results
    });
    
  } catch (error) {
    console.error('DB-Schema API - Erro geral:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor' 
    }, { status: 500 });
  }
} 