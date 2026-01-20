-- Schema para Sistema de Geração de Imagens e Avatares
-- Virtual Company Manager (VCM) Database Schema

-- Tabela para configurações de geração de imagens por empresa
CREATE TABLE IF NOT EXISTS image_generation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  style VARCHAR(50) DEFAULT 'professional' CHECK (style IN ('professional', 'casual', 'artistic', 'corporate', 'social-media')),
  mood VARCHAR(50) DEFAULT 'natural' CHECK (mood IN ('bright', 'dramatic', 'natural', 'cinematic')),
  quality VARCHAR(50) DEFAULT 'high' CHECK (quality IN ('standard', 'high', 'ultra')),
  batch_size INTEGER DEFAULT 1 CHECK (batch_size >= 1 AND batch_size <= 10),
  auto_save BOOLEAN DEFAULT true,
  custom_prompts JSONB DEFAULT '[]'::jsonb,
  preferred_templates TEXT[] DEFAULT ARRAY['instagram-post', 'linkedin-post'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id)
);

-- Tabela para histórico de imagens geradas
CREATE TABLE IF NOT EXISTS generated_images_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  image_id VARCHAR(255) NOT NULL, -- ID do serviço de geração (Nano Banana)
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  prompt TEXT NOT NULL,
  config JSONB NOT NULL, -- Configuração completa usada na geração
  metadata JSONB DEFAULT '{}'::jsonb, -- Metadados do serviço (tempo, seed, modelo)
  personas_used UUID[] NOT NULL DEFAULT '{}', -- IDs das personas incluídas
  template_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  scene_description TEXT,
  aspect_ratio VARCHAR(10) NOT NULL,
  dimensions VARCHAR(20) NOT NULL,
  file_size_bytes BIGINT,
  generation_time_seconds DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed', 'archived')),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para templates de imagem personalizados
CREATE TABLE IF NOT EXISTS image_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  aspect_ratio VARCHAR(10) NOT NULL,
  dimensions VARCHAR(20) NOT NULL,
  purpose VARCHAR(255),
  category VARCHAR(100) DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  custom_styles JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES personas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, template_id)
);

-- Tabela para prompt templates e bibliotecas
CREATE TABLE IF NOT EXISTS prompt_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb, -- Variáveis disponíveis no template
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES personas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para cenas pré-definidas
CREATE TABLE IF NOT EXISTS scene_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scene_prompt TEXT NOT NULL,
  recommended_personas INTEGER DEFAULT 1,
  recommended_positions JSONB DEFAULT '{}'::jsonb,
  mood VARCHAR(50) DEFAULT 'natural',
  style VARCHAR(50) DEFAULT 'professional',
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES personas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_generated_images_empresa_id ON generated_images_history(empresa_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_template_id ON generated_images_history(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_personas ON generated_images_history USING GIN(personas_used);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images_history(status);

CREATE INDEX IF NOT EXISTS idx_image_templates_empresa_id ON image_templates(empresa_id);
CREATE INDEX IF NOT EXISTS idx_image_templates_active ON image_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_prompt_library_empresa_id ON prompt_library(empresa_id);
CREATE INDEX IF NOT EXISTS idx_prompt_library_category ON prompt_library(category);
CREATE INDEX IF NOT EXISTS idx_prompt_library_tags ON prompt_library USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_scene_templates_empresa_id ON scene_templates(empresa_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_generation_settings_updated_at
  BEFORE UPDATE ON image_generation_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_generated_images_history_updated_at
  BEFORE UPDATE ON generated_images_history
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_image_templates_updated_at
  BEFORE UPDATE ON image_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prompt_library_updated_at
  BEFORE UPDATE ON prompt_library
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scene_templates_updated_at
  BEFORE UPDATE ON scene_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE image_generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_templates ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessidades de segurança)
CREATE POLICY "Enable read access for authenticated users" ON image_generation_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON image_generation_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON generated_images_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON generated_images_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON image_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON image_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON prompt_library
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON prompt_library
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON scene_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON scene_templates
  FOR ALL USING (auth.role() = 'service_role');

-- Views úteis para relatórios e analytics

-- View para estatísticas de geração por empresa
CREATE OR REPLACE VIEW image_generation_stats AS
SELECT 
  e.nome as empresa_nome,
  e.id as empresa_id,
  COUNT(gih.id) as total_images,
  COUNT(DISTINCT gih.template_id) as templates_used,
  COUNT(DISTINCT unnest(gih.personas_used)) as personas_used,
  AVG(gih.generation_time_seconds) as avg_generation_time,
  SUM(gih.download_count) as total_downloads,
  MAX(gih.created_at) as last_generation,
  COUNT(CASE WHEN gih.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as images_this_week,
  COUNT(CASE WHEN gih.created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as images_today
FROM empresas e
LEFT JOIN generated_images_history gih ON e.id = gih.empresa_id
GROUP BY e.id, e.nome;

-- View para templates mais utilizados
CREATE OR REPLACE VIEW popular_templates AS
SELECT 
  template_id,
  template_name,
  aspect_ratio,
  COUNT(*) as usage_count,
  COUNT(DISTINCT empresa_id) as companies_using,
  AVG(generation_time_seconds) as avg_generation_time,
  MAX(created_at) as last_used
FROM generated_images_history
WHERE status = 'completed'
GROUP BY template_id, template_name, aspect_ratio
ORDER BY usage_count DESC;

-- View para personas mais utilizadas em imagens
CREATE OR REPLACE VIEW persona_image_usage AS
SELECT 
  p.id as persona_id,
  p.nome as persona_nome,
  p.cargo as persona_cargo,
  e.nome as empresa_nome,
  COUNT(*) as times_used,
  AVG(gih.generation_time_seconds) as avg_generation_time,
  MAX(gih.created_at) as last_used_in_image
FROM personas p
JOIN empresas e ON p.empresa_id = e.id
JOIN generated_images_history gih ON p.id = ANY(gih.personas_used)
WHERE gih.status = 'completed'
GROUP BY p.id, p.nome, p.cargo, e.nome
ORDER BY times_used DESC;

-- Insert templates padrão
INSERT INTO image_templates (template_id, name, description, aspect_ratio, dimensions, purpose, category, is_default) VALUES
('instagram-post', 'Instagram Post', 'Post quadrado para feed do Instagram', '1:1', '1080x1080', 'Posts no feed', 'social-media', true),
('instagram-stories', 'Instagram Stories', 'Formato vertical para Stories', '9:16', '1080x1920', 'Stories e Reels', 'social-media', true),
('youtube-thumbnail', 'YouTube Thumbnail', 'Miniatura para vídeos do YouTube', '16:9', '1280x720', 'Thumbnails de vídeo', 'social-media', true),
('youtube-shorts', 'YouTube Shorts', 'Formato vertical para Shorts', '9:16', '1080x1920', 'Shorts verticais', 'social-media', true),
('linkedin-post', 'LinkedIn Post', 'Posts profissionais para LinkedIn', '1:1', '1200x1200', 'Conteúdo profissional', 'social-media', true),
('facebook-cover', 'Facebook Cover', 'Capa de página no Facebook', '16:9', '1200x630', 'Capas e banners', 'social-media', true),
('twitter-post', 'Twitter/X Post', 'Posts para Twitter/X', '16:9', '1200x675', 'Posts na timeline', 'social-media', true),
('pinterest-pin', 'Pinterest Pin', 'Formato vertical para pins', '2:3', '1000x1500', 'Pins e ideias', 'social-media', true)
ON CONFLICT (empresa_id, template_id) DO NOTHING;

-- Insert prompts padrão na biblioteca
INSERT INTO prompt_library (name, category, prompt_template, tags) VALUES
('Professional Portrait', 'portraits', 'Professional business portrait of {persona_description} in {setting}, {mood} lighting, corporate style', ARRAY['professional', 'business', 'portrait']),
('Team Meeting', 'business', 'Business meeting scene with {personas_count} people: {personas_descriptions} in a modern conference room, professional atmosphere', ARRAY['meeting', 'teamwork', 'business']),
('Product Presentation', 'marketing', '{persona_description} presenting {product} in a modern office setting, engaging presentation style, {mood} lighting', ARRAY['presentation', 'marketing', 'product']),
('Casual Team', 'lifestyle', 'Casual team photo of {personas_descriptions} in a relaxed office environment, natural lighting, friendly atmosphere', ARRAY['team', 'casual', 'office']),
('Executive Portrait', 'portraits', 'Executive portrait of {persona_description} in premium office setting, authoritative yet approachable, dramatic lighting', ARRAY['executive', 'leadership', 'portrait'])
ON CONFLICT DO NOTHING;

-- Insert cenas pré-definidas
INSERT INTO scene_templates (name, description, scene_prompt, recommended_personas, mood, style, tags) VALUES
('Modern Office', 'Escritório moderno e clean', 'Modern open office space with glass walls, natural light, minimalist design', 2, 'bright', 'professional', ARRAY['office', 'modern', 'business']),
('Conference Room', 'Sala de reunião executiva', 'Executive conference room with large table, wall screens, professional lighting', 4, 'natural', 'corporate', ARRAY['meeting', 'executive', 'formal']),
('Casual Lounge', 'Ambiente descontraído', 'Modern office lounge area with comfortable seating, plants, warm lighting', 3, 'natural', 'casual', ARRAY['casual', 'relaxed', 'creative']),
('Presentation Stage', 'Palco de apresentação', 'Professional presentation stage with screen backdrop, spotlight, modern auditorium', 1, 'dramatic', 'professional', ARRAY['presentation', 'stage', 'speaking']),
('Creative Workshop', 'Workshop criativo', 'Creative workshop space with whiteboards, colorful furniture, collaborative atmosphere', 5, 'bright', 'artistic', ARRAY['creative', 'workshop', 'collaboration'])
ON CONFLICT DO NOTHING;