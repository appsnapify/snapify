-- Adicionar campo slug na tabela organizations
ALTER TABLE organizations ADD COLUMN slug TEXT UNIQUE;

-- Criar função para gerar slug
CREATE OR REPLACE FUNCTION generate_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar slug automaticamente
CREATE TRIGGER set_organization_slug
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION generate_organization_slug();

-- Atualizar slugs existentes
UPDATE organizations
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL; 