-- Remover políticas existentes
drop policy if exists "Arquivos públicos" on storage.objects;
drop policy if exists "Upload de arquivos por usuários autenticados" on storage.objects;
drop policy if exists "Atualização de arquivos pelos donos" on storage.objects;
drop policy if exists "Deleção de arquivos pelos donos" on storage.objects;

-- Remover buckets se existirem
do $$
begin
  if exists (select 1 from storage.buckets where id = 'organization_logos') then
    delete from storage.objects where bucket_id = 'organization_logos';
    delete from storage.buckets where id = 'organization_logos';
  end if;
  if exists (select 1 from storage.buckets where id = 'organization_banners') then
    delete from storage.objects where bucket_id = 'organization_banners';
    delete from storage.buckets where id = 'organization_banners';
  end if;
end $$;

-- Criar buckets separados para logos e banners
insert into storage.buckets (id, name, public)
values 
  ('organization_logos', 'organization_logos', true),
  ('organization_banners', 'organization_banners', true);

-- Habilitar RLS
alter table storage.objects enable row level security;

-- Criar política de acesso público para logos
create policy "Logos públicas"
  on storage.objects for select
  using ( bucket_id = 'organization_logos' );

-- Criar política de acesso público para banners
create policy "Banners públicos"
  on storage.objects for select
  using ( bucket_id = 'organization_banners' );

-- Criar política para upload de logos
create policy "Upload de logos por usuários autenticados"
  on storage.objects for insert
  with check (
    bucket_id = 'organization_logos'
    and auth.role() = 'authenticated'
  );

-- Criar política para upload de banners
create policy "Upload de banners por usuários autenticados"
  on storage.objects for insert
  with check (
    bucket_id = 'organization_banners'
    and auth.role() = 'authenticated'
  );

-- Criar política para atualização de logos
create policy "Atualização de logos pelos donos"
  on storage.objects for update
  using (
    bucket_id = 'organization_logos'
    and auth.uid() = owner
  );

-- Criar política para atualização de banners
create policy "Atualização de banners pelos donos"
  on storage.objects for update
  using (
    bucket_id = 'organization_banners'
    and auth.uid() = owner
  );

-- Criar política para deleção de logos
create policy "Deleção de logos pelos donos"
  on storage.objects for delete
  using (
    bucket_id = 'organization_logos'
    and auth.uid() = owner
  );

-- Criar política para deleção de banners
create policy "Deleção de banners pelos donos"
  on storage.objects for delete
  using (
    bucket_id = 'organization_banners'
    and auth.uid() = owner
  ); 