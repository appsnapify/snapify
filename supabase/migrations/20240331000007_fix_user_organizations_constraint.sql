-- Este SQL corrige o problema de chave estrangeira na tabela user_organizations

-- 1. Verificar e corrigir relacionamento user_organizations -> auth.users
DO $$
BEGIN
  -- Verificar se temos a tabela user_organizations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
    -- Remover a restrição de chave estrangeira existente se houver
    ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_user_id_fkey;
    
    -- Adicionar nova restrição que referencia a tabela auth.users corretamente
    -- Com opção de ON DELETE CASCADE para automaticamente remover registros quando o usuário for deletado
    ALTER TABLE user_organizations ADD CONSTRAINT user_organizations_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 2. Modificar a função de criação para garantir que apenas cadastra relações válidas
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
  v_user_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe na tabela auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'error', 'Usuário não encontrado',
      'detail', 'O ID de usuário informado não existe na base de dados'
    );
  END IF;

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
  BEGIN
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
  EXCEPTION
    WHEN foreign_key_violation THEN
      -- Se falhar na inserção da relação, remover a organização
      DELETE FROM organizations WHERE id = v_org_id;
      RETURN jsonb_build_object(
        'error', 'Erro ao criar relação usuário-organização',
        'detail', 'ID de usuário inválido'
      );
  END;

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