-- Guest List Schema
-- Este arquivo contém o esquema para as funcionalidades de guest list

-- Habilitar extensões necessárias (caso ainda não estejam habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de eventos de guest list
CREATE TABLE IF NOT EXISTS guest_list_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL,
  flyer_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de convidados da guest list
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES guest_list_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN DEFAULT false,
  check_in_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_guest_list_events_organization_id ON guest_list_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_qr_code ON guests(qr_code);

-- Trigger para atualizar o updated_at dos eventos
CREATE OR REPLACE FUNCTION update_guest_list_events_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guest_list_events_timestamp
BEFORE UPDATE ON guest_list_events
FOR EACH ROW
EXECUTE FUNCTION update_guest_list_events_timestamp();

-- Políticas RLS para segurança
ALTER TABLE guest_list_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Todos podem ver eventos ativos
CREATE POLICY "Eventos de guest list visíveis publicamente"
ON guest_list_events FOR SELECT
TO PUBLIC
USING (is_active = true);

-- Apenas organizadores podem criar eventos
CREATE POLICY "Somente organizadores podem criar eventos de guest list"
ON guest_list_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.organization_id = organization_id
  )
);

-- Apenas organizadores podem atualizar seus eventos
CREATE POLICY "Somente organizadores podem atualizar seus eventos de guest list"
ON guest_list_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.organization_id = organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.organization_id = organization_id
  )
);

-- Qualquer pessoa pode registrar-se como convidado
CREATE POLICY "Qualquer pessoa pode registrar-se como convidado"
ON guests FOR INSERT
TO PUBLIC
WITH CHECK (true);

-- Apenas pessoas autenticadas podem verificar convidados
CREATE POLICY "Apenas pessoas autenticadas podem ver convidados"
ON guests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guest_list_events e
    JOIN user_organizations uo ON e.organization_id = uo.organization_id
    WHERE e.id = event_id
    AND uo.user_id = auth.uid()
  )
);

-- Apenas pessoas autenticadas podem atualizar status de check-in
CREATE POLICY "Apenas pessoas autenticadas podem atualizar check-in"
ON guests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guest_list_events e
    JOIN user_organizations uo ON e.organization_id = uo.organization_id
    WHERE e.id = event_id
    AND uo.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM guest_list_events e
    JOIN user_organizations uo ON e.organization_id = uo.organization_id
    WHERE e.id = event_id
    AND uo.user_id = auth.uid()
  )
); 