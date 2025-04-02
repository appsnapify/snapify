import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

// Inicializar cliente do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST: Registrar um convidado na guest list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, phone } = body
    
    console.log("API - Registrando convidado:", { eventId, name, phone });
    
    if (!eventId || !name || !phone) {
      return NextResponse.json(
        { error: 'Dados incompletos. Forneça eventId, name e phone.' },
        { status: 400 }
      )
    }
    
    // Verificar se o evento existe
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, is_published, type, guest_list_settings')
      .eq('id', eventId)
      .single()
    
    console.log("API - Resultado da verificação do evento:", { event, error: eventError });
    
    if (eventError || !event) {
      console.error('Erro ao buscar evento:', eventError)
      return NextResponse.json(
        { error: 'Evento não encontrado.' },
        { status: 404 }
      )
    }
    
    if (!event.is_published || event.type !== 'guest-list') {
      return NextResponse.json(
        { error: 'Este evento não está aceitando registros de guest list.' },
        { status: 400 }
      )
    }
    
    // Gerar código único para o QR
    const guestId = uuidv4()
    const qrData = {
      eventId,
      guestId,
      name,
      phone,
      timestamp: Date.now()
    }
    const qrCodeData = JSON.stringify(qrData)
    
    console.log("API - QR Code data gerado:", qrCodeData);
    
    // Gerar QR code como URL de dados
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData)
    
    // Registrar convidado no banco
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        id: guestId,
        event_id: eventId,
        name,
        phone,
        qr_code: qrCodeData,
        is_checked_in: false,
        requires_approval: event.guest_list_settings?.requires_approval || false,
        is_approved: !event.guest_list_settings?.requires_approval // Auto-aprovado se não precisar de aprovação
      })
    
    if (guestError) {
      console.error('Erro ao registrar convidado:', guestError)
      return NextResponse.json(
        { error: 'Erro ao registrar na guest list.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Registro realizado com sucesso!',
      qrCode: qrCodeUrl,
      requiresApproval: event.guest_list_settings?.requires_approval || false
    })
    
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

// PUT: Fazer check-in de um convidado pelo QR code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode, eventId } = body
    
    console.log("API - Verificando check-in:", { qrCode, eventId });
    
    if (!qrCode || !eventId) {
      return NextResponse.json(
        { error: 'Dados incompletos. Forneça qrCode e eventId.' },
        { status: 400 }
      )
    }
    
    // Decodificar QR code
    let qrData;
    try {
      qrData = JSON.parse(qrCode);
    } catch (e) {
      console.error('QR code inválido:', e);
      return NextResponse.json(
        { error: 'QR code inválido ou corrompido.' },
        { status: 400 }
      )
    }
    
    // Verificar se o evento do QR corresponde ao evento do check-in
    if (qrData.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Este QR code não pertence a este evento.' },
        { status: 400 }
      )
    }
    
    // Buscar o convidado no banco
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*, events(name)')
      .eq('id', qrData.guestId)
      .eq('event_id', eventId)
      .single()
    
    if (guestError || !guest) {
      console.error('Erro ao buscar convidado:', guestError)
      return NextResponse.json(
        { error: 'Convidado não encontrado na guest list.' },
        { status: 404 }
      )
    }
    
    // Verificar se o convidado está aprovado (se necessário)
    if (guest.requires_approval && !guest.is_approved) {
      return NextResponse.json(
        { 
          error: 'Convidado ainda não aprovado.', 
          guest: {
            name: guest.name,
            phone: guest.phone,
            isApproved: false
          }
        },
        { status: 403 }
      )
    }
    
    // Verificar se já fez check-in
    if (guest.is_checked_in) {
      return NextResponse.json(
        { 
          warning: 'Check-in já realizado anteriormente.',
          success: true,
          guest: {
            name: guest.name,
            phone: guest.phone,
            checkedInAt: guest.checked_in_at,
            isApproved: guest.is_approved
          },
          event: guest.events?.name
        },
        { status: 200 }
      )
    }
    
    // Realizar o check-in
    const now = new Date().toISOString()
    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update({
        is_checked_in: true,
        checked_in_at: now
      })
      .eq('id', qrData.guestId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erro ao fazer check-in:', updateError)
      return NextResponse.json(
        { error: 'Erro ao realizar check-in.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Check-in realizado com sucesso!',
      guest: {
        name: guest.name,
        phone: guest.phone,
        checkedInAt: now,
        isApproved: guest.is_approved
      },
      event: guest.events?.name
    })
    
  } catch (error) {
    console.error('Erro no servidor durante check-in:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

// GET: Obter lista de convidados para um evento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'EventId não fornecido.' },
        { status: 400 }
      )
    }
    
    // Buscar todos os convidados do evento
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar convidados:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar lista de convidados.' },
        { status: 500 }
      )
    }
    
    // Calcular estatísticas
    const total = guests?.length || 0
    const checkedIn = guests?.filter(g => g.is_checked_in)?.length || 0
    const approved = guests?.filter(g => g.is_approved)?.length || 0
    const pending = guests?.filter(g => g.requires_approval && !g.is_approved)?.length || 0
    
    return NextResponse.json({
      success: true,
      guests,
      stats: {
        total,
        checkedIn,
        approved,
        pending
      }
    })
    
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
} 