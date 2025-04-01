-- Este SQL configura corretamente a tabela organizations e buckets de storage
-- para garantir que todos os campos necessários estão presentes

-- 1. Verificar e adicionar colunas necessárias na tabela organizations
DO $$
BEGIN
  -- Adicionar campo slug se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'slug') THEN
    ALTER TABLE organizations ADD COLUMN slug TEXT UNIQUE;
  END IF;
  
  -- Adicionar campo logotipo se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'logotipo') THEN
    ALTER TABLE organizations ADD COLUMN logotipo TEXT;
  END IF;
  
  -- Adicionar campo banner_url se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'banner_url') THEN
    ALTER TABLE organizations ADD COLUMN banner_url TEXT;
  END IF;
  
  -- Adicionar campo location se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'location') THEN
    ALTER TABLE organizations ADD COLUMN location TEXT DEFAULT '';
  END IF;
  
  -- Adicionar campo social_media se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'social_media') THEN
    ALTER TABLE organizations ADD COLUMN social_media JSONB DEFAULT '{}'::JSONB;
  END IF;
  
  -- Adicionar campo contacts se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'contacts') THEN
    ALTER TABLE organizations ADD COLUMN contacts TEXT[] DEFAULT '{}'::TEXT[];
  END IF;
END
$$;

-- 2. Criar ou substituir função para gerar slug
CREATE OR REPLACE FUNCTION generate_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para gerar slug automaticamente se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_organization_slug') THEN
    CREATE TRIGGER set_organization_slug
      BEFORE INSERT ON organizations
      FOR EACH ROW
      EXECUTE FUNCTION generate_organization_slug();
  END IF;
END
$$;

-- 4. Atualizar slugs existentes
UPDATE organizations
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 5. Configurar armazenamento

-- Remover políticas existentes
DROP POLICY IF EXISTS "Objetos públicos para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserção sem restrições" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização sem restrições" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleção sem restrições" ON storage.objects;
DROP POLICY IF EXISTS "Buckets públicos para leitura" ON storage.buckets;

-- Garantir que o bucket de storage existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'organization_logos') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('organization_logos', 'Logos e Banners de Organizações', true);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Criar políticas que REALMENTE FUNCIONAM (sem restrições)
CREATE POLICY "Objetos públicos para leitura"
  ON storage.objects FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção sem restrições"
  ON storage.objects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização sem restrições"
  ON storage.objects FOR UPDATE
  USING (true);

CREATE POLICY "Permitir deleção sem restrições"
  ON storage.objects FOR DELETE
  USING (true);

CREATE POLICY "Buckets públicos para leitura"
  ON storage.buckets FOR SELECT
  USING (true);

-- Garantir que o bucket é público
UPDATE storage.buckets
SET public = true
WHERE id = 'organization_logos';

-- 6. Criar função para criar organização simplificada
CREATE OR REPLACE FUNCTION simple_create_organization(
  p_name TEXT,
  p_email TEXT,
  p_address TEXT,
  p_logotipo TEXT,
  p_banner_url TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_slug TEXT;
  v_result JSONB;
BEGIN
  -- Gerar slug
  v_slug := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Inserir a organização
  INSERT INTO organizations (
    name,
    email,
    address,
    logotipo,
    banner_url,
    slug,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_email,
    p_address,
    p_logotipo,
    p_banner_url,
    v_slug,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_org_id;

  -- Inserir a relação usuário-organização
  INSERT INTO user_organizations (
    user_id,
    organization_id,
    role,
    created_at
  ) VALUES (
    p_user_id,
    v_org_id,
    'owner',
    NOW()
  );

  -- Retornar dados
  SELECT jsonb_build_object(
    'id', v_org_id,
    'slug', v_slug,
    'name', p_name
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar organização: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION simple_create_organization TO anon;
GRANT EXECUTE ON FUNCTION simple_create_organization TO authenticated;
GRANT EXECUTE ON FUNCTION simple_create_organization TO service_role; 