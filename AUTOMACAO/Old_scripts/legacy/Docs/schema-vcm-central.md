# Schema do Banco VCM Central

## 🗃️ Visão Geral

O VCM Central é o banco de dados master que gerencia todas as empresas virtuais, templates, sincronização e configurações globais do sistema.

**URL Base**: `https://fzyokrvdyeczhfqlwxzb.supabase.co`

## 📊 Estrutura das Tabelas

### 1. empresas_virtuais
Tabela principal que registra todas as empresas virtuais do sistema.

```sql
CREATE TABLE public.empresas_virtuais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo_empresa varchar(50) NOT NULL UNIQUE,
  nome_empresa varchar(255) NOT NULL,
  descricao text,
  pais varchar(3) DEFAULT 'BR',
  idioma varchar(10) DEFAULT 'pt',
  timezone varchar(50) DEFAULT 'America/Sao_Paulo',
  
  -- Conexão Supabase da Empresa
  supabase_url varchar(255) NOT NULL,
  supabase_anon_key text NOT NULL,
  supabase_service_key text NOT NULL,
  
  -- Status e Configurações
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'archived')),
  config_ia jsonb DEFAULT '{}',
  configuracoes jsonb DEFAULT '{}',
  
  -- Métricas
  total_personas integer DEFAULT 0,
  ultima_sincronizacao timestamptz,
  proxima_sincronizacao timestamptz,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT empresas_virtuais_pkey PRIMARY KEY (id)
);

-- Índices
CREATE INDEX idx_empresas_codigo ON empresas_virtuais(codigo_empresa);
CREATE INDEX idx_empresas_status ON empresas_virtuais(status);
CREATE INDEX idx_empresas_sync ON empresas_virtuais(ultima_sincronizacao);
```

### 2. templates_personas
Templates padrão para criação de personas nas empresas virtuais.

```sql
CREATE TABLE public.templates_personas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  categoria varchar(20) NOT NULL CHECK (categoria IN ('executivos', 'especialistas', 'assistentes')),
  codigo_template varchar(50) NOT NULL UNIQUE,
  nome_template varchar(255) NOT NULL,
  role_template varchar(255) NOT NULL,
  department_template varchar(255),
  specialty_template varchar(255),
  
  -- Configurações Padrão
  config_padrao jsonb DEFAULT '{}',
  competencias_padrao jsonb DEFAULT '[]',
  ia_config_padrao jsonb DEFAULT '{}',
  
  -- Biografia Template
  biografia_template text,
  system_prompt_template text,
  
  -- Configurações IA
  temperatura_padrao numeric DEFAULT 0.7,
  max_tokens_padrao integer DEFAULT 2000,
  
  -- Ordenação e Status
  ordem_criacao integer DEFAULT 0,
  ativo boolean DEFAULT true,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT templates_personas_pkey PRIMARY KEY (id)
);

-- Índices
CREATE INDEX idx_templates_categoria ON templates_personas(categoria);
CREATE INDEX idx_templates_ordem ON templates_personas(ordem_criacao);
```

### 3. sync_empresas
Logs e controle de sincronização entre VCM Central e empresas virtuais.

```sql
CREATE TABLE public.sync_empresas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas_virtuais(id) ON DELETE CASCADE,
  
  -- Tipo e Direção do Sync
  tipo_sync varchar(50) NOT NULL CHECK (tipo_sync IN ('manual', 'automatico', 'agendado')),
  direcao varchar(20) NOT NULL CHECK (direcao IN ('vcm_to_company', 'company_to_vcm', 'bidirectional')),
  
  -- Status e Resultados
  status varchar(20) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'error', 'partial', 'cancelled')),
  tabelas_afetadas jsonb DEFAULT '[]',
  
  -- Contadores
  registros_processados integer DEFAULT 0,
  registros_sucesso integer DEFAULT 0,
  registros_erro integer DEFAULT 0,
  registros_conflito integer DEFAULT 0,
  
  -- Detalhes e Logs
  detalhes jsonb DEFAULT '{}',
  error_log text,
  conflitos jsonb DEFAULT '[]',
  
  -- Timing
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  duration_seconds integer GENERATED ALWAYS AS (
    CASE 
      WHEN finished_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (finished_at - started_at))::integer
      ELSE NULL 
    END
  ) STORED,
  
  -- Próximo Agendamento
  next_scheduled timestamptz,
  
  CONSTRAINT sync_empresas_pkey PRIMARY KEY (id)
);

-- Índices
CREATE INDEX idx_sync_empresa ON sync_empresas(empresa_id);
CREATE INDEX idx_sync_status ON sync_empresas(status);
CREATE INDEX idx_sync_started ON sync_empresas(started_at);
CREATE INDEX idx_sync_next ON sync_empresas(next_scheduled);
```

### 4. configuracoes_globais
Configurações globais do sistema VCM.

```sql
CREATE TABLE public.configuracoes_globais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chave varchar(100) NOT NULL UNIQUE,
  valor jsonb NOT NULL,
  categoria varchar(50) NOT NULL,
  descricao text,
  tipo_valor varchar(20) DEFAULT 'object' CHECK (tipo_valor IN ('string', 'number', 'boolean', 'object', 'array')),
  
  -- Validação e Restrições
  schema_validacao jsonb,
  obrigatorio boolean DEFAULT false,
  visivel_usuario boolean DEFAULT true,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT configuracoes_globais_pkey PRIMARY KEY (id)
);

-- Configurações Padrão
INSERT INTO configuracoes_globais (chave, valor, categoria, descricao) VALUES
('sync_interval_minutes', '30', 'sync', 'Intervalo padrão de sincronização em minutos'),
('sync_retry_attempts', '3', 'sync', 'Número de tentativas de retry em caso de falha'),
('default_ia_temperature', '0.7', 'ia', 'Temperatura padrão para APIs de IA'),
('max_concurrent_syncs', '3', 'sync', 'Máximo de sincronizações simultâneas'),
('persona_templates_version', '1.0', 'templates', 'Versão atual dos templates de personas');

-- Índices
CREATE INDEX idx_config_categoria ON configuracoes_globais(categoria);
CREATE INDEX idx_config_chave ON configuracoes_globais(chave);
```

### 5. usuarios_vcm
Usuários do sistema VCM e suas permissões.

```sql
CREATE TABLE public.usuarios_vcm (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  
  -- Permissões Globais
  role varchar(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'readonly')),
  permissoes jsonb DEFAULT '{}',
  
  -- Configurações Pessoais
  configuracoes_usuario jsonb DEFAULT '{}',
  timezone varchar(50) DEFAULT 'America/Sao_Paulo',
  idioma varchar(10) DEFAULT 'pt',
  
  -- Status
  ativo boolean DEFAULT true,
  ultimo_acesso timestamptz,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT usuarios_vcm_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_vcm_user_id_unique UNIQUE (user_id)
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios_vcm(email);
CREATE INDEX idx_usuarios_role ON usuarios_vcm(role);
```

### 6. empresa_usuarios
Relacionamento entre usuários e empresas virtuais (acesso por empresa).

```sql
CREATE TABLE public.empresa_usuarios (
  empresa_id uuid NOT NULL REFERENCES empresas_virtuais(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios_vcm(id) ON DELETE CASCADE,
  
  -- Permissões por Empresa
  role varchar(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissoes jsonb DEFAULT '{}',
  
  -- Status
  ativo boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES usuarios_vcm(id),
  
  CONSTRAINT empresa_usuarios_pkey PRIMARY KEY (empresa_id, usuario_id)
);

-- Índices
CREATE INDEX idx_empresa_usuarios_empresa ON empresa_usuarios(empresa_id);
CREATE INDEX idx_empresa_usuarios_usuario ON empresa_usuarios(usuario_id);
```

### 7. audit_log
Log de auditoria para todas as operações importantes.

```sql
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  empresa_id uuid REFERENCES empresas_virtuais(id),
  
  -- Ação Realizada
  acao varchar(100) NOT NULL,
  tabela_afetada varchar(100),
  registro_id uuid,
  
  -- Dados da Operação
  dados_antes jsonb,
  dados_depois jsonb,
  metadata jsonb DEFAULT '{}',
  
  -- Contexto
  ip_address inet,
  user_agent text,
  session_id uuid,
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);

-- Índices
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_empresa ON audit_log(empresa_id);
CREATE INDEX idx_audit_acao ON audit_log(acao);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

## 🔄 Views Úteis

### view_empresas_dashboard
View para o dashboard principal com métricas agregadas.

```sql
CREATE VIEW view_empresas_dashboard AS
SELECT 
  ev.id,
  ev.codigo_empresa,
  ev.nome_empresa,
  ev.status,
  ev.total_personas,
  ev.ultima_sincronizacao,
  
  -- Status de Sync
  CASE 
    WHEN ev.ultima_sincronizacao IS NULL THEN 'never_synced'
    WHEN ev.ultima_sincronizacao < (now() - interval '1 hour') THEN 'outdated'
    WHEN EXISTS (
      SELECT 1 FROM sync_empresas se 
      WHERE se.empresa_id = ev.id 
      AND se.status = 'running'
    ) THEN 'syncing'
    ELSE 'synchronized'
  END as sync_status,
  
  -- Último Log de Sync
  (
    SELECT json_build_object(
      'id', se.id,
      'status', se.status,
      'started_at', se.started_at,
      'duration_seconds', se.duration_seconds
    )
    FROM sync_empresas se
    WHERE se.empresa_id = ev.id
    ORDER BY se.started_at DESC
    LIMIT 1
  ) as ultimo_sync,
  
  -- Contagem de Usuários
  (
    SELECT count(*)
    FROM empresa_usuarios eu
    WHERE eu.empresa_id = ev.id
    AND eu.ativo = true
  ) as total_usuarios
  
FROM empresas_virtuais ev
WHERE ev.status != 'archived';
```

### view_sync_summary
View para resumo de sincronizações.

```sql
CREATE VIEW view_sync_summary AS
SELECT 
  empresa_id,
  count(*) as total_syncs,
  count(*) FILTER (WHERE status = 'success') as syncs_sucesso,
  count(*) FILTER (WHERE status = 'error') as syncs_erro,
  count(*) FILTER (WHERE status = 'running') as syncs_rodando,
  avg(duration_seconds) FILTER (WHERE status = 'success') as duracao_media,
  max(started_at) as ultimo_sync,
  min(started_at) FILTER (WHERE status = 'error') as primeiro_erro
FROM sync_empresas
GROUP BY empresa_id;
```

## 🔐 Row Level Security (RLS)

### Políticas de Segurança

```sql
-- Empresas: usuário só vê empresas que tem acesso
ALTER TABLE empresas_virtuais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their companies" ON empresas_virtuais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM empresa_usuarios eu
      JOIN usuarios_vcm uv ON eu.usuario_id = uv.id
      WHERE eu.empresa_id = empresas_virtuais.id
      AND uv.user_id = auth.uid()
      AND eu.ativo = true
    )
  );

-- Sync Empresas: baseado no acesso à empresa
ALTER TABLE sync_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company sync logs" ON sync_empresas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM empresa_usuarios eu
      JOIN usuarios_vcm uv ON eu.usuario_id = uv.id
      WHERE eu.empresa_id = sync_empresas.empresa_id
      AND uv.user_id = auth.uid()
      AND eu.ativo = true
    )
  );

-- Configurações: apenas admins
ALTER TABLE configuracoes_globais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage global configs" ON configuracoes_globais
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios_vcm uv
      WHERE uv.user_id = auth.uid()
      AND uv.role IN ('admin', 'manager')
      AND uv.ativo = true
    )
  );
```

## 📈 Triggers e Funções

### Trigger para atualizar updated_at

```sql
-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas relevantes
CREATE TRIGGER set_updated_at BEFORE UPDATE ON empresas_virtuais
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON templates_personas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON configuracoes_globais
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

### Trigger para Audit Log

```sql
-- Função para audit log automático
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id, acao, tabela_afetada, registro_id, 
    dados_antes, dados_depois
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar audit em tabelas importantes
CREATE TRIGGER audit_empresas_virtuais AFTER INSERT OR UPDATE OR DELETE ON empresas_virtuais
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
```

## 🚀 Índices de Performance

```sql
-- Índices compostos para queries comuns
CREATE INDEX idx_sync_empresa_status_date ON sync_empresas(empresa_id, status, started_at DESC);
CREATE INDEX idx_empresa_usuarios_ativo ON empresa_usuarios(empresa_id, ativo) WHERE ativo = true;

-- Índices parciais para performance
CREATE INDEX idx_empresas_ativas ON empresas_virtuais(id) WHERE status = 'active';
CREATE INDEX idx_sync_running ON sync_empresas(empresa_id) WHERE status = 'running';
```