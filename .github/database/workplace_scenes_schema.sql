-- =====================================================
-- TABELA: AVATARES MULTIMEDIA
-- =====================================================
-- Armazena diferentes versões visuais (imagens e vídeos) 
-- de uma ou mais personas para uso em marketing, website, etc.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.avatares_multimedia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Tipo de avatar
  avatar_type varchar(50) NOT NULL CHECK (avatar_type IN ('photo', 'video', 'animated_gif', '3d_render', 'illustration')),
  avatar_category varchar(100) DEFAULT 'profile', -- profile, action, team, presentation, casual, formal
  
  -- Personas envolvidas
  personas_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  -- Array de IDs de personas presentes no avatar
  personas_metadata jsonb DEFAULT '[]'::jsonb,
  -- Formato: [{"persona_id": "uuid", "name": "John Doe", "role": "CEO", "position": "center"}]
  
  -- Arquivos gerados
  file_url text NOT NULL, -- URL principal do arquivo
  file_thumbnail_url text, -- Miniatura (para vídeos e imagens grandes)
  file_size_bytes bigint,
  file_format varchar(20), -- jpg, png, mp4, webm, gif, etc.
  file_dimensions jsonb, -- {"width": 1920, "height": 1080, "duration_seconds": 30}
  
  -- Metadados do avatar
  title varchar(255),
  description text,
  prompt_used text, -- Prompt usado para gerar (se foi via IA)
  generation_metadata jsonb DEFAULT '{}'::jsonb,
  -- Formato: {"service": "midjourney", "model": "v6", "params": {...}}
  
  -- Configurações visuais
  style varchar(100), -- professional, casual, creative, corporate, artistic
  background_type varchar(50), -- solid, gradient, transparent, custom, studio, outdoor
  background_color varchar(50),
  lighting_setup varchar(100), -- studio, natural, dramatic, soft, etc.
  
  -- Uso e contexto
  use_cases text[] DEFAULT ARRAY[]::text[], 
  -- ['website_hero', 'linkedin_post', 'email_signature', 'presentation', 'video_intro']
  tags text[] DEFAULT ARRAY[]::text[],
  is_public boolean DEFAULT false, -- Se pode ser usado publicamente
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES public.personas(id),
  approved_at timestamp with time zone,
  
  -- Variações e relacionamentos
  parent_avatar_id uuid REFERENCES public.avatares_multimedia(id) ON DELETE SET NULL,
  -- Para vincular variações (ex: foto original -> versão editada)
  variation_type varchar(50), -- original, cropped, filtered, upscaled, recolored
  version int DEFAULT 1,
  
  -- Status e geração
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'processing', 'completed', 'failed', 'archived')),
  generation_service varchar(50), -- midjourney, dalle, stable_diffusion, runway, heygen, custom
  generation_attempts int DEFAULT 0,
  generation_started_at timestamp with time zone,
  generation_completed_at timestamp with time zone,
  generation_error text,
  external_service_id varchar(255), -- ID no serviço externo (ex: Midjourney message ID)
  
  -- Analytics
  view_count int DEFAULT 0,
  download_count int DEFAULT 0,
  usage_count int DEFAULT 0,
  last_used_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_avatares_multimedia_empresa_id ON public.avatares_multimedia(empresa_id);
CREATE INDEX idx_avatares_multimedia_avatar_type ON public.avatares_multimedia(avatar_type);
CREATE INDEX idx_avatares_multimedia_status ON public.avatares_multimedia(status);
CREATE INDEX idx_avatares_multimedia_personas_ids ON public.avatares_multimedia USING gin(personas_ids);
CREATE INDEX idx_avatares_multimedia_use_cases ON public.avatares_multimedia USING gin(use_cases);
CREATE INDEX idx_avatares_multimedia_tags ON public.avatares_multimedia USING gin(tags);
CREATE INDEX idx_avatares_multimedia_parent_id ON public.avatares_multimedia(parent_avatar_id);

-- Índice GIN para busca em personas_metadata
CREATE INDEX idx_avatares_multimedia_personas_metadata ON public.avatares_multimedia USING gin(personas_metadata);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_avatares_multimedia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_avatares_multimedia_updated_at
  BEFORE UPDATE ON public.avatares_multimedia
  FOR EACH ROW
  EXECUTE FUNCTION update_avatares_multimedia_updated_at();

-- View para estatísticas de avatares
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

-- Função para buscar avatares por persona
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

-- Função para buscar avatares multi-persona (com 2+ personas)
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

-- Comentários para documentação
COMMENT ON TABLE public.avatares_multimedia IS 'Armazena imagens e vídeos de personas individuais ou em grupo';
COMMENT ON COLUMN public.avatares_multimedia.personas_ids IS 'Array de UUIDs das personas presentes no avatar';
COMMENT ON COLUMN public.avatares_multimedia.personas_metadata IS 'Detalhes de cada persona na composição (posição, destaque, etc)';
COMMENT ON COLUMN public.avatares_multimedia.avatar_type IS 'Tipo de mídia: photo, video, animated_gif, 3d_render, illustration';
COMMENT ON COLUMN public.avatares_multimedia.use_cases IS 'Onde o avatar pode ser usado (website, social media, etc)';
COMMENT ON COLUMN public.avatares_multimedia.parent_avatar_id IS 'Avatar original do qual este é uma variação';

-- Políticas RLS (Row Level Security)
ALTER TABLE public.avatares_multimedia ENABLE ROW LEVEL SECURITY;

-- Política: empresas podem ver apenas seus próprios avatares
CREATE POLICY avatares_multimedia_empresa_isolation ON public.avatares_multimedia
  FOR ALL
  USING (empresa_id = current_setting('app.current_empresa_id', true)::uuid);

-- Política: admins podem ver tudo
CREATE POLICY avatares_multimedia_admin_all_access ON public.avatares_multimedia
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.personas
      WHERE id = current_setting('app.current_user_id', true)::uuid
      AND role ILIKE '%admin%'
    )
  );

-- =====================================================
-- TABELA: WORKPLACE SCENES
-- =====================================================
-- Armazena cenas de trabalho com múltiplas personas
-- =====================================================

-- Tabela para armazenar cenas de trabalho geradas
CREATE TABLE IF NOT EXISTS public.workplace_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Identificação da cena
  scenario_id varchar(100) NOT NULL,
  scenario_name varchar(255) NOT NULL,
  scenario_description text,
  
  -- Imagens geradas
  image_url text, -- URL da imagem final (upscaled)
  image_grid_url text, -- URL da grade com 4 variações
  image_thumbnail_url text, -- Miniatura para listagem
  
  -- Personas envolvidas
  personas_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Formato: [{"persona_id": "uuid", "role": "CEO", "name": "John Doe"}]
  
  -- Prompt usado
  full_prompt text NOT NULL,
  prompt_metadata jsonb DEFAULT '{}'::jsonb,
  -- Formato: {"ambiente": "...", "composicao": "...", "iluminacao": "..."}
  
  -- Configurações de geração
  generation_service varchar(50) DEFAULT 'midjourney',
  generation_params jsonb DEFAULT '{}'::jsonb,
  -- Formato: {"aspect_ratio": "16:9", "quality": 2, "style": "raw"}
  
  -- Status e versionamento
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'archived')),
  version int DEFAULT 1,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES public.personas(id),
  approved_at timestamp with time zone,
  
  -- Metadata de geração
  midjourney_message_id varchar(255), -- ID da mensagem no Midjourney
  generation_attempts int DEFAULT 0,
  generation_started_at timestamp with time zone,
  generation_completed_at timestamp with time zone,
  generation_error text,
  
  -- Uso e analytics
  usage_count int DEFAULT 0,
  last_used_at timestamp with time zone,
  tags text[] DEFAULT ARRAY[]::text[],
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_workplace_scenes_empresa_id ON public.workplace_scenes(empresa_id);
CREATE INDEX idx_workplace_scenes_scenario_id ON public.workplace_scenes(scenario_id);
CREATE INDEX idx_workplace_scenes_status ON public.workplace_scenes(status);
CREATE INDEX idx_workplace_scenes_tags ON public.workplace_scenes USING gin(tags);

-- Índice GIN para busca em personas_used
CREATE INDEX idx_workplace_scenes_personas_used ON public.workplace_scenes USING gin(personas_used);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_workplace_scenes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workplace_scenes_updated_at
  BEFORE UPDATE ON public.workplace_scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_workplace_scenes_updated_at();

-- View para estatísticas
CREATE OR REPLACE VIEW workplace_scenes_stats AS
SELECT 
  empresa_id,
  COUNT(*) as total_scenes,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_scenes,
  COUNT(*) FILTER (WHERE is_approved = true) as approved_scenes,
  COUNT(DISTINCT scenario_id) as unique_scenarios,
  SUM(usage_count) as total_usage,
  MAX(created_at) as last_generated
FROM public.workplace_scenes
GROUP BY empresa_id;

-- Função para buscar cenas por persona
CREATE OR REPLACE FUNCTION get_scenes_by_persona(persona_uuid uuid)
RETURNS TABLE (
  scene_id uuid,
  scenario_name varchar,
  image_url text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.scenario_name,
    ws.image_url,
    ws.created_at
  FROM public.workplace_scenes ws
  WHERE ws.personas_used @> jsonb_build_array(jsonb_build_object('persona_id', persona_uuid))
  AND ws.status = 'completed'
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE public.workplace_scenes IS 'Armazena cenas de trabalho multi-persona geradas por IA';
COMMENT ON COLUMN public.workplace_scenes.personas_used IS 'Array JSON com personas presentes na cena';
COMMENT ON COLUMN public.workplace_scenes.full_prompt IS 'Prompt completo usado para gerar a imagem';
COMMENT ON COLUMN public.workplace_scenes.generation_params IS 'Parâmetros técnicos da geração (aspect ratio, quality, etc)';
COMMENT ON COLUMN public.workplace_scenes.midjourney_message_id IS 'ID da mensagem do Midjourney para tracking';
COMMENT ON COLUMN public.workplace_scenes.tags IS 'Tags para categorização (marketing, internal, website, etc)';

-- Políticas RLS (Row Level Security)
ALTER TABLE public.workplace_scenes ENABLE ROW LEVEL SECURITY;

-- Política: empresas podem ver apenas suas próprias cenas
CREATE POLICY workplace_scenes_empresa_isolation ON public.workplace_scenes
  FOR ALL
  USING (empresa_id = current_setting('app.current_empresa_id', true)::uuid);

-- Política: admins podem ver tudo
CREATE POLICY workplace_scenes_admin_all_access ON public.workplace_scenes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.personas
      WHERE id = current_setting('app.current_user_id', true)::uuid
      AND role ILIKE '%admin%'
    )
  );

-- Exemplos de queries úteis

-- 1. Buscar todas as cenas de uma empresa
-- SELECT * FROM workplace_scenes WHERE empresa_id = 'uuid' AND status = 'completed';

-- 2. Buscar cenas com uma persona específica
-- SELECT * FROM get_scenes_by_persona('persona-uuid');

-- 3. Buscar cenas por cenário
-- SELECT * FROM workplace_scenes WHERE scenario_id = 'reuniao_estrategica';

-- 4. Estatísticas de uma empresa
-- SELECT * FROM workplace_scenes_stats WHERE empresa_id = 'uuid';

-- 5. Cenas mais usadas
-- SELECT scenario_name, usage_count, image_url 
-- FROM workplace_scenes 
-- WHERE empresa_id = 'uuid'
-- ORDER BY usage_count DESC
-- LIMIT 10;

-- 6. Cenas aguardando aprovação
-- SELECT * FROM workplace_scenes 
-- WHERE empresa_id = 'uuid' 
-- AND status = 'completed' 
-- AND is_approved = false;

-- =====================================================
-- EXEMPLOS DE QUERIES - AVATARES MULTIMEDIA
-- =====================================================

-- 1. Buscar todos os avatares de uma persona
-- SELECT * FROM get_avatares_by_persona('persona-uuid');

-- 2. Buscar avatares multi-persona (2+ personas na mesma imagem/vídeo)
-- SELECT * FROM get_multi_persona_avatares('empresa-uuid');

-- 3. Buscar vídeos de uma empresa
-- SELECT * FROM avatares_multimedia 
-- WHERE empresa_id = 'uuid' 
-- AND avatar_type = 'video' 
-- AND status = 'completed';

-- 4. Avatares por caso de uso
-- SELECT * FROM avatares_multimedia 
-- WHERE empresa_id = 'uuid' 
-- AND 'website_hero' = ANY(use_cases);

-- 5. Estatísticas de avatares por tipo
-- SELECT * FROM avatares_multimedia_stats WHERE empresa_id = 'uuid';

-- 6. Avatares mais visualizados
-- SELECT title, avatar_type, view_count, file_url
-- FROM avatares_multimedia
-- WHERE empresa_id = 'uuid'
-- ORDER BY view_count DESC
-- LIMIT 10;

-- 7. Buscar variações de um avatar original
-- SELECT * FROM avatares_multimedia
-- WHERE parent_avatar_id = 'avatar-uuid'
-- ORDER BY created_at DESC;

-- 8. Total de espaço em disco usado
-- SELECT 
--   empresa_id,
--   pg_size_pretty(SUM(file_size_bytes)::bigint) as storage_used
-- FROM avatares_multimedia
-- GROUP BY empresa_id;

-- =====================================================
-- CASOS DE USO - AVATARES MULTIMEDIA
-- =====================================================

-- CASO 1: Avatar individual profissional (foto)
-- INSERT INTO avatares_multimedia (
--   empresa_id, avatar_type, personas_ids, 
--   personas_metadata, file_url, title, style, use_cases
-- ) VALUES (
--   'empresa-uuid', 'photo', ARRAY['persona-uuid'],
--   '[{"persona_id": "uuid", "name": "Sarah Johnson", "role": "CEO", "position": "center"}]'::jsonb,
--   'https://storage.../ceo-professional.jpg',
--   'Sarah Johnson - CEO Professional Portrait',
--   'professional',
--   ARRAY['website_hero', 'linkedin_profile', 'email_signature']
-- );

-- CASO 2: Vídeo de apresentação individual
-- INSERT INTO avatares_multimedia (
--   empresa_id, avatar_type, personas_ids,
--   file_url, file_format, file_dimensions, title, use_cases
-- ) VALUES (
--   'empresa-uuid', 'video', ARRAY['persona-uuid'],
--   'https://storage.../ceo-intro-video.mp4',
--   'mp4',
--   '{"width": 1920, "height": 1080, "duration_seconds": 45}'::jsonb,
--   'CEO Introduction Video',
--   ARRAY['video_intro', 'presentation', 'website_about']
-- );

-- CASO 3: Avatar multi-persona (equipe executiva)
-- INSERT INTO avatares_multimedia (
--   empresa_id, avatar_type, personas_ids,
--   personas_metadata, file_url, title, use_cases
-- ) VALUES (
--   'empresa-uuid', 'photo', ARRAY['ceo-uuid', 'cto-uuid', 'cfo-uuid'],
--   '[
--     {"persona_id": "ceo-uuid", "name": "Sarah Johnson", "role": "CEO", "position": "center"},
--     {"persona_id": "cto-uuid", "name": "Michael Chen", "role": "CTO", "position": "left"},
--     {"persona_id": "cfo-uuid", "name": "Emma Williams", "role": "CFO", "position": "right"}
--   ]'::jsonb,
--   'https://storage.../executive-team.jpg',
--   'Executive Leadership Team',
--   ARRAY['website_hero', 'press_kit', 'investor_deck']
-- );

-- CASO 4: Avatar animado para redes sociais
-- INSERT INTO avatares_multimedia (
--   empresa_id, avatar_type, personas_ids,
--   file_url, file_format, title, style, use_cases
-- ) VALUES (
--   'empresa-uuid', 'animated_gif', ARRAY['persona-uuid'],
--   'https://storage.../ceo-wave.gif',
--   'gif',
--   'CEO Animated Welcome',
--   'casual',
--   ARRAY['social_media', 'email_campaign', 'chat_bot']
-- );

-- =====================================================
-- INTEGRAÇÃO: AVATARES + WORKPLACE SCENES
-- =====================================================

-- Query para buscar todo conteúdo visual de uma persona
-- SELECT 
--   'avatar' as content_type,
--   id,
--   title as name,
--   file_url as url,
--   avatar_type as type_detail,
--   created_at
-- FROM avatares_multimedia
-- WHERE 'persona-uuid' = ANY(personas_ids)
-- UNION ALL
-- SELECT 
--   'scene' as content_type,
--   id,
--   scenario_name as name,
--   image_url as url,
--   scenario_id as type_detail,
--   created_at
-- FROM workplace_scenes
-- WHERE personas_used @> jsonb_build_array(jsonb_build_object('persona_id', 'persona-uuid'))
-- ORDER BY created_at DESC;
