-- Este script adiciona funções de debug para verificar organizações
-- e garantir que as relações user_organizations estão funcionando corretamente

-- 1. Função para verificar organizações de um usuário
CREATE OR REPLACE FUNCTION debug_user_organizations(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_user_exists BOOLEAN;
  v_user_orgs JSONB;
  v_orgs JSONB;
BEGIN
  -- Verificar se o usuário existe
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'error', 'Usuário não encontrado',
      'user_id', user_uuid
    );
  END IF;
  
  -- Buscar relações user_organizations
  SELECT jsonb_agg(t)
  FROM (
    SELECT * FROM user_organizations WHERE user_id = user_uuid
  ) t
  INTO v_user_orgs;
  
  -- Buscar detalhes das organizações
  SELECT jsonb_agg(o)
  FROM (
    SELECT o.* FROM organizations o
    JOIN user_organizations uo ON o.id = uo.organization_id
    WHERE uo.user_id = user_uuid
  ) o
  INTO v_orgs;
  
  -- Construir resultado
  SELECT jsonb_build_object(
    'user_id', user_uuid,
    'user_exists', v_user_exists,
    'user_organizations', COALESCE(v_user_orgs, '[]'::jsonb),
    'organizations', COALESCE(v_orgs, '[]'::jsonb)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 2. Função para reparar relações perdidas entre user e organization
CREATE OR REPLACE FUNCTION repair_user_organization(
  p_user_id UUID,
  p_organization_id UUID,
  p_role TEXT DEFAULT 'owner'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_org_exists BOOLEAN;
  v_relation_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Verificar existência do usuário
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  -- Verificar existência da organização
  SELECT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id)
  INTO v_org_exists;
  
  -- Verificar se a relação já existe
  SELECT EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = p_user_id AND organization_id = p_organization_id
  )
  INTO v_relation_exists;
  
  -- Criar resposta
  SELECT jsonb_build_object(
    'user_exists', v_user_exists,
    'org_exists', v_org_exists,
    'relation_exists', v_relation_exists
  ) INTO v_result;
  
  -- Se ambos existirem mas não houver relação, criar
  IF v_user_exists AND v_org_exists AND NOT v_relation_exists THEN
    BEGIN
      INSERT INTO user_organizations (
        user_id,
        organization_id,
        role,
        created_at
      ) VALUES (
        p_user_id,
        p_organization_id,
        p_role,
        NOW()
      );
      
      v_result := v_result || jsonb_build_object('created', true);
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object(
        'created', false,
        'error', SQLERRM
      );
    END;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION debug_user_organizations TO authenticated;
GRANT EXECUTE ON FUNCTION debug_user_organizations TO service_role;

GRANT EXECUTE ON FUNCTION repair_user_organization TO authenticated;
GRANT EXECUTE ON FUNCTION repair_user_organization TO service_role; 