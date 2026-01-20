-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor

-- Criar tabela avatares_multimedia
CREATE TABLE IF NOT EXISTS public.avatares_multimedia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  avatar_type varchar(50) NOT NULL CHECK (avatar_type IN ('photo', 'video', 'animated_gif', '3d_render', 'illustration')),
  avatar_category varchar(100) DEFAULT 'profile',
  
  personas_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  personas_metadata jsonb DEFAULT '[]'::jsonb,
  
  file_url text NOT NULL,
  file_thumbnail_url text,
  file_size_bytes bigint,
  file_format varchar(20),
  file_dimensions jsonb,
  
  title varchar(255),
  description text,
  prompt_used text,
  generation_metadata jsonb DEFAULT '{}'::jsonb,
  
  style varchar(100),
  background_type varchar(50),
  background_color varchar(50),
  lighting_setup varchar(100),
  
  use_cases text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  is_public boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES public.personas(id),
  approved_at timestamp with time zone,
  
  parent_avatar_id uuid REFERENCES public.avatares_multimedia(id) ON DELETE SET NULL,
  variation_type varchar(50),
  version int DEFAULT 1,
  
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'processing', 'completed', 'failed', 'archived')),
  generation_service varchar(50),
  generation_attempts int DEFAULT 0,
  generation_started_at timestamp with time zone,
  generation_completed_at timestamp with time zone,
  generation_error text,
  external_service_id varchar(255),
  
  view_count int DEFAULT 0,
  download_count int DEFAULT 0,
  usage_count int DEFAULT 0,
  last_used_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_empresa_id ON public.avatares_multimedia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_avatar_type ON public.avatares_multimedia(avatar_type);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_status ON public.avatares_multimedia(status);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_personas_ids ON public.avatares_multimedia USING gin(personas_ids);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_use_cases ON public.avatares_multimedia USING gin(use_cases);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_tags ON public.avatares_multimedia USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_parent_id ON public.avatares_multimedia(parent_avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatares_multimedia_personas_metadata ON public.avatares_multimedia USING gin(personas_metadata);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_avatares_multimedia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_avatares_multimedia_updated_at ON public.avatares_multimedia;
CREATE TRIGGER trigger_avatares_multimedia_updated_at
  BEFORE UPDATE ON public.avatares_multimedia
  FOR EACH ROW
  EXECUTE FUNCTION update_avatares_multimedia_updated_at();

-- View de estatísticas
CREATE OR REPLACE VIEW avatares_multimedia_stats AS
SELECT 
  empresa_id,
  avatar_type,
  COUNT(*) as total_avatares,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_avatares,
  COUNT(*) FILTER (WHERE is_approved = true) as approved_avatares,
  COUNT(*) FILTER (WHERE is_public = true) as public_avatares,
  SUM(view_count) as total_views,
  SUM(download_count) as total_downloads,
  SUM(file_size_bytes) as total_storage_bytes,
  MAX(created_at) as last_generated
FROM public.avatares_multimedia
GROUP BY empresa_id, avatar_type;

-- Função: buscar avatares por persona
CREATE OR REPLACE FUNCTION get_avatares_by_persona(persona_uuid uuid)
RETURNS TABLE (
  avatar_id uuid,
  avatar_type varchar,
  file_url text,
  file_thumbnail_url text,
  title varchar,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.avatar_type,
    am.file_url,
    am.file_thumbnail_url,
    am.title,
    am.created_at
  FROM public.avatares_multimedia am
  WHERE persona_uuid = ANY(am.personas_ids)
  AND am.status = 'completed'
  ORDER BY am.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Função: buscar avatares multi-persona
CREATE OR REPLACE FUNCTION get_multi_persona_avatares(empresa_uuid uuid)
RETURNS TABLE (
  avatar_id uuid,
  avatar_type varchar,
  personas_count int,
  file_url text,
  title varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.avatar_type,
    array_length(am.personas_ids, 1) as personas_count,
    am.file_url,
    am.title
  FROM public.avatares_multimedia am
  WHERE am.empresa_id = empresa_uuid
  AND array_length(am.personas_ids, 1) >= 2
  AND am.status = 'completed'
  ORDER BY array_length(am.personas_ids, 1) DESC, am.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE public.avatares_multimedia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avatares_multimedia_empresa_isolation ON public.avatares_multimedia;
CREATE POLICY avatares_multimedia_empresa_isolation ON public.avatares_multimedia
  FOR ALL
  USING (empresa_id = current_setting('app.current_empresa_id', true)::uuid);

DROP POLICY IF EXISTS avatares_multimedia_admin_all_access ON public.avatares_multimedia;
CREATE POLICY avatares_multimedia_admin_all_access ON public.avatares_multimedia
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.personas
      WHERE id = current_setting('app.current_user_id', true)::uuid
      AND role ILIKE '%admin%'
    )
  );

-- Comentários
COMMENT ON TABLE public.avatares_multimedia IS 'Armazena imagens e vídeos de personas individuais ou em grupo';
COMMENT ON COLUMN public.avatares_multimedia.personas_ids IS 'Array de UUIDs das personas presentes no avatar';
