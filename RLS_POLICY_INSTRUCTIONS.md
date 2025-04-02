# Instruções para Adicionar Políticas RLS na Tabela Events

Para resolver o erro `new row violates row-level security policy for table "events"`, siga estas etapas:

1. Acesse o Supabase Dashboard: [https://xejpwdpumzalewamttjv.supabase.co](https://xejpwdpumzalewamttjv.supabase.co)

2. Faça login com suas credenciais

3. No menu lateral, clique em "Table Editor" 

4. Localize a tabela "events" na lista

5. Clique na aba "Policies"

6. Clique no botão "Add Policy" (Adicionar Política)

7. Selecione "Insert" (Inserir) para criar uma política de inserção

8. Dê um nome à política: "Permitir inserção na tabela events para usuários autenticados"

9. Em "Target roles" (Funções alvo), selecione "authenticated" (autenticado)

10. Em "Policy definition" (Definição da política), selecione "USING expression" e insira: `true`

11. Clique em "Save Policy" (Salvar Política)

## Ou Execute este Script SQL

Como alternativa, você pode executar o seguinte script SQL no SQL Editor do Supabase:

```sql
-- Criar política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção na tabela events para usuários autenticados" 
ON events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização na tabela events para usuários autenticados" 
ON events 
FOR UPDATE 
TO authenticated 
USING (true);

-- Criar política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão na tabela events para usuários autenticados" 
ON events 
FOR DELETE 
TO authenticated 
USING (true);

-- Garantir que RLS está habilitado para a tabela
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

## Verificar se a Política foi Aplicada

Após adicionar a política, tente criar um evento novamente. O erro de violação de RLS não deve mais ocorrer. 