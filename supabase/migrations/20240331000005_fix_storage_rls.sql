-- Remover políticas existentes para garantir uma configuração limpa
DROP POLICY IF EXISTS "Acesso público para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Acesso para upload sem restrições" ON storage.objects;
DROP POLICY IF EXISTS "Acesso para atualização sem restrições" ON storage.objects;
DROP POLICY IF EXISTS "Acesso para deleção sem restrições" ON storage.objects;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Logos públicas" ON storage.objects;
DROP POLICY IF EXISTS "Upload de logos por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Banners públicos" ON storage.objects;
DROP POLICY IF EXISTS "Upload de banners por usuários autenticados" ON storage.objects;

-- Garantir que o bucket existe
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

-- 1. Política de acesso público para visualização de objetos
CREATE POLICY "Objetos públicos para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization_logos');

-- 2. Política para permitir inserção por qualquer usuário (mesmo anônimo)
CREATE POLICY "Permitir inserção sem restrições"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'organization_logos');

-- 3. Política para permitir atualização por qualquer usuário
CREATE POLICY "Permitir atualização sem restrições"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'organization_logos');

-- 4. Política para permitir deleção por qualquer usuário
CREATE POLICY "Permitir deleção sem restrições"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'organization_logos');

-- 5. Política para acesso público ao bucket
CREATE POLICY "Buckets públicos para leitura"
  ON storage.buckets FOR SELECT
  USING (id = 'organization_logos');

-- Garantir que o bucket está configurado como público
UPDATE storage.buckets
SET public = true
WHERE id = 'organization_logos'; 