-- Criação da tabela profiles se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT,
      role TEXT NOT NULL CHECK (role IN ('organizador', 'promotor')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END
$$;

-- Garantir que RLS está habilitado na tabela profiles
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para garantir limpeza
DROP POLICY IF EXISTS "Usuários podem ler seus próprios perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON profiles;

-- Adicionar políticas mais permissivas temporariamente para ajudar na depuração
CREATE POLICY "Qualquer pessoa pode ler perfis" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar perfis" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Função para criar perfil automaticamente após registro de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se existir para evitar duplicidade
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Adicionar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrar perfis existentes que possam não ter sido criados
INSERT INTO profiles (id, first_name, last_name, role, created_at, updated_at)
SELECT 
  au.id, 
  COALESCE(au.raw_user_meta_data->>'first_name', 'Usuário') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(au.raw_user_meta_data->>'role', 'organizador') as role,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL; 