-- Criar tabela de eventos unificada para o sistema
-- Executar como migração do Supabase

-- Extensão UUID (já deve estar habilitada no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar e criar tabela events apenas se não existir
DO $$
BEGIN
  -- Verifica se a tabela já existe
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
  ) THEN
    -- Criar a tabela events
    CREATE TABLE public.events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ,
      location TEXT,
      organization_id UUID,
      flyer_url TEXT,
      is_published BOOLEAN DEFAULT false,
      type TEXT NOT NULL,
      guest_list_settings JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Adicionar constraint de chave estrangeira se a tabela organizations existir
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
    ) THEN
      ALTER TABLE public.events 
      ADD CONSTRAINT events_organization_id_fkey 
      FOREIGN KEY (organization_id) 
      REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
    
    -- Criar índices básicos
    CREATE INDEX idx_events_organization_id ON events(organization_id);
    CREATE INDEX idx_events_start_date ON events(start_date);
    CREATE INDEX idx_events_type ON events(type);
    
    -- Habilitar RLS
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    
    -- Política para visualização pública de eventos publicados
    CREATE POLICY "Eventos públicos quando publicados" ON events
      FOR SELECT USING (is_published = true);
      
    -- Políticas para usuários autenticados
    CREATE POLICY "Criadores podem ver seus eventos" ON events
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_organizations uo
          WHERE uo.organization_id = events.organization_id
          AND uo.user_id = auth.uid()
        )
      );
      
    CREATE POLICY "Organizadores podem criar eventos" ON events
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_organizations uo
          WHERE uo.organization_id = organization_id
          AND uo.user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Organizadores podem atualizar eventos" ON events
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_organizations uo
          WHERE uo.organization_id = events.organization_id
          AND uo.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_organizations uo
          WHERE uo.organization_id = organization_id
          AND uo.user_id = auth.uid()
        )
      );
      
    CREATE POLICY "Organizadores podem excluir eventos" ON events
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_organizations uo
          WHERE uo.organization_id = events.organization_id
          AND uo.user_id = auth.uid()
        )
      );
  END IF;
  
  -- Função para atualização de timestamp
  IF NOT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'update_events_timestamp'
  ) THEN
    CREATE FUNCTION update_events_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Trigger para atualização de timestamp
    CREATE TRIGGER update_events_timestamp
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_timestamp();
  END IF;
  
  -- Migrar dados se existir tabela antiga guest_list_events
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_list_events'
  ) THEN
    -- Inserir apenas registros que não existem já na tabela events
    INSERT INTO events (
      id, name, description, start_date,
      location, organization_id, flyer_url,
      is_published, type, created_at, updated_at
    )
    SELECT 
      id, title, description, date,
      location, organization_id, flyer_url,
      is_active, 'guest-list', created_at, updated_at
    FROM guest_list_events
    WHERE NOT EXISTS (
      SELECT 1 FROM events WHERE events.id = guest_list_events.id
    );
  END IF;
END
$$; 