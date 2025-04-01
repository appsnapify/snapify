-- Criação de função para inserir relação usuário-organização ignorando restrições
CREATE OR REPLACE FUNCTION insert_user_organization(
  p_user_id UUID,
  p_organization_id UUID,
  p_role TEXT
) RETURNS VOID AS $$
BEGIN
  -- Inserir diretamente na tabela sem verificar chaves estrangeiras
  INSERT INTO public.user_organizations (
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
  
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar erros e continuar
    RAISE NOTICE 'Erro ao inserir relação usuário-organização: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função possa ser executada por todos os usuários
GRANT EXECUTE ON FUNCTION insert_user_organization TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_organization TO anon;
GRANT EXECUTE ON FUNCTION insert_user_organization TO service_role; 