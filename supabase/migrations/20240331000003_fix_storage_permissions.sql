-- Garantir que o storage está habilitado
create extension if not exists "storage" schema "extensions";

-- Garantir que as tabelas do storage existem
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  public boolean default false
);

create table if not exists storage.objects (
  id uuid primary key default uuid_generate_v4(),
  bucket_id text not null references storage.buckets(id),
  name text not null,
  owner uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored
);

-- Garantir que o RLS está habilitado
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

-- Remover políticas existentes para garantir limpeza
drop policy if exists "Dar acesso público ao bucket" on storage.buckets;
drop policy if exists "Dar acesso de inserção para usuários autenticados" on storage.buckets;
drop policy if exists "Dar acesso de atualização para usuários autenticados" on storage.buckets;
drop policy if exists "Dar acesso de deleção para usuários autenticados" on storage.buckets;

-- Criar políticas para os buckets
create policy "Dar acesso público ao bucket"
  on storage.buckets for select
  using ( public = true );

create policy "Dar acesso de inserção para usuários autenticados"
  on storage.buckets for insert
  with check ( auth.role() = 'authenticated' );

create policy "Dar acesso de atualização para usuários autenticados"
  on storage.buckets for update
  using ( auth.role() = 'authenticated' );

create policy "Dar acesso de deleção para usuários autenticados"
  on storage.buckets for delete
  using ( auth.role() = 'authenticated' );

-- Garantir que os buckets existem e são públicos
insert into storage.buckets (id, name, public, owner)
values 
  ('organization_logos', 'organization_logos', true, auth.uid()),
  ('organization_banners', 'organization_banners', true, auth.uid())
on conflict (id) do update
set public = true,
    updated_at = now();

-- Criar índices para melhor performance
create index if not exists bname_idx on storage.buckets (name);
create index if not exists buckets_owner_idx on storage.buckets (owner);
create index if not exists objects_owner_idx on storage.objects (owner);
create index if not exists objects_bucket_id_idx on storage.objects (bucket_id); 