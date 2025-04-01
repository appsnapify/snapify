-- Função para criar organização e inserir relação
CREATE OR REPLACE FUNCTION create_organization(
  p_name TEXT,
  p_email TEXT,
  p_address TEXT,
  p_location TEXT DEFAULT '',
  p_contacts TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_social_media JSONB DEFAULT '{}'::JSONB,
  p_logotipo TEXT DEFAULT NULL,
  p_banner_url TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
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
  -- Se não houver slug informado, gera um a partir do nome
  IF p_slug IS NULL THEN
    v_slug := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  ELSE
    v_slug := p_slug;
  END IF;

  -- Inserir a organização
  INSERT INTO organizations (
    name,
    email,
    address,
    location,
    contacts,
    social_media,
    logotipo,
    banner_url,
    slug,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_email,
    p_address,
    p_location,
    p_contacts,
    p_social_media,
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

  -- Retorna o ID criado e o slug
  SELECT jsonb_build_object(
    'id', v_org_id,
    'slug', v_slug
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