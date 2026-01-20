# 🎭 Criar Tabela avatares_multimedia no Supabase

## Passo 1: Acessar SQL Editor

1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor
2. Clique em "SQL Editor" no menu lateral
3. Clique em "+ New query"

## Passo 2: Executar SQL

Cole e execute o SQL do arquivo: `.github/database/create_avatares_multimedia_table.sql`

Ou copie e cole este comando abaixo:

```sql
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
```

## Passo 3: Executar Teste

Após criar a tabela, execute:

```bash
cd AUTOMACAO
node test_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

Isso criará:
- ✅ 3 avatares individuais (fotos de perfil)
- ✅ 1 avatar de equipe (foto com múltiplas personas)

## Verificar Resultados

No Supabase Table Editor:
https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor/avatares_multimedia

Você verá 4 registros com:
- URLs de imagens placeholder
- Metadados completos
- Status 'completed'
