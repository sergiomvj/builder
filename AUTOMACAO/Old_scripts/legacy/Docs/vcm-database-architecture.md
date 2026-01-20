# 🏗️ VCM Database Architecture - Estratégia Definitiva

## 📊 Visão Geral da Arquitetura

O sistema VCM utiliza uma **arquitetura híbrida** para acomodar diferentes cenários de empresas:

### 🔧 Estratégias Disponíveis

#### 1. **LEGACY_SEPARATE** (LifewayUSA)
```
VCM Central DB ←→ Empresa RAG DB (separado)
     ↑                    ↑
   Referências        Dados Completos
```

#### 2. **UNIFIED_SINGLE** (Novas Empresas)  
```
VCM Central DB ←→ Empresa Unified DB
     ↑                    ↑
   Referências      Dados + RAG + Workflows
```

## 🎯 Casos de Uso

### LifewayUSA (Legado)
- **Motivo**: Estrutura pré-existente com tabelas complexas
- **Banco RAG**: `neaoblaycbdunfxgunjo.supabase.co`
- **Sincronização**: Manual via script `sync_lifeway_personas.py`
- **Vantagem**: Preserva estrutura existente
- **Desvantagem**: Requer sincronização complexa

### Novas Empresas (Padrão)
- **Motivo**: Arquitetura otimizada desde o início
- **Banco Único**: `[empresa]_supabase_url.supabase.co`
- **Sincronização**: Automática via hooks
- **Vantagem**: Simplicidade e consistência
- **Desvantagem**: N/A

## 🔄 Processo de Sincronização

### Para LifewayUSA
```python
# Detectar estratégia automaticamente
db_config = get_database_strategy("LifewayUSA")

# Usar clientes apropriados
vcm_client = create_client(db_config.vcm_url, db_config.vcm_key)
rag_client = create_client(db_config.rag_url, db_config.rag_key)

# Sincronizar dados
sync_personas_from_rag_to_vcm()
```

### Para Novas Empresas
```python
# Detectar estratégia automaticamente  
db_config = get_database_strategy("NovaEmpresa")

# Usar cliente unificado
company_client = create_client(db_config.company_url, db_config.company_key)

# Sincronização simples
sync_personas_unified()
```

## 📂 Estrutura de Variáveis de Ambiente

### LifewayUSA (Legado)
```env
# VCM Central
VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
VCM_SUPABASE_SERVICE_ROLE_KEY=xxx

# LifewayUSA RAG (separado)
LIFEWAY_SUPABASE_URL=https://neaoblaycbdunfxgunjo.supabase.co  
LIFEWAY_SUPABASE_SERVICE_KEY=xxx
```

### Nova Empresa
```env
# VCM Central
VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
VCM_SUPABASE_SERVICE_ROLE_KEY=xxx

# Nova Empresa (unificado)
NOVAEMPRESA_SUPABASE_URL=https://xyz123.supabase.co
NOVAEMPRESA_SUPABASE_SERVICE_KEY=xxx
```

## 🛠️ Scripts Disponíveis

### Sincronização LifewayUSA
```bash
python sync_lifeway_personas.py
```
- Sincroniza personas do banco RAG para VCM Central
- Evita duplicatas
- Atualiza contadores
- Gera logs detalhados

### Teste de Estratégia
```bash
python vcm_database_strategy.py
```
- Testa detecção de estratégias
- Valida configurações
- Lista empresas por estratégia

## 🔍 Como Funciona a Detecção

### Automática por Nome da Empresa
```python
# LifewayUSA → LEGACY_SEPARATE automaticamente
lifeway_config = get_database_strategy("LifewayUSA")

# QualquerOutraEmpresa → UNIFIED_SINGLE automaticamente
other_config = get_database_strategy("MinhaEmpresa")
```

### Baseada em Variáveis de Ambiente
```python
# Sistema procura por:
# 1. Nome na lista LEGACY_COMPANIES
# 2. Variáveis específicas da empresa
# 3. Fallback para estratégia unificada
```

## 📋 Tabelas por Estratégia

### VCM Central (Todas)
```sql
empresas          -- Registro master de todas as empresas
personas          -- Referências sincronizadas (IDs + básico)
configuracoes     -- Settings globais do sistema
```

### LifewayUSA RAG DB
```sql
personas          -- Dados completos das personas
rag_knowledge     -- Base de conhecimento RAG  
competencias      -- Skills e competências
workflows         -- Fluxos N8N
rag_chunks        -- Fragmentos de conhecimento
```

### Nova Empresa Unified DB
```sql
personas          -- Dados completos das personas
rag_knowledge     -- Base de conhecimento RAG
competencias      -- Skills e competências  
workflows         -- Fluxos N8N
rag_chunks        -- Fragmentos de conhecimento
empresas_config   -- Configurações específicas da empresa
```

## 🚀 Fluxo de Criação de Empresa

### LifewayUSA (Já Existe)
1. ✅ Banco RAG criado manualmente
2. ✅ Personas geradas via scripts 1-5
3. ✅ Sincronização manual via `sync_lifeway_personas.py`
4. ✅ Dashboard funcional

### Nova Empresa (Futuro)
1. 🔄 Criação via dashboard
2. 🔄 Geração automática do banco unificado
3. 🔄 Execução automática dos scripts 1-5
4. 🔄 Sincronização automática com VCM Central
5. 🔄 Dashboard funcional

## ⚡ Benefícios da Arquitetura

### Flexibilidade
- Suporta empresas legadas sem migração
- Otimiza novas empresas desde o início
- Permite diferentes estratégias por empresa

### Escalabilidade  
- Cada empresa tem seu próprio banco
- Isolamento de dados por empresa
- Performance otimizada

### Manutenibilidade
- Código único com estratégias automáticas
- Detecção transparente de configuração
- Scripts reutilizáveis

## 🔧 Implementação no Dashboard

### Frontend (React)
```typescript
// Hooks automáticos detectam estratégia
const { data: personas } = usePersonasByEmpresa(empresaId);

// Sistema transparente para o usuário
// Funciona igual para LifewayUSA e novas empresas
```

### Backend (FastAPI)
```python
# API endpoints universais
@app.get("/empresas/{empresa_id}/personas")
def get_personas(empresa_id: str):
    # Detecção automática da estratégia
    config = get_database_strategy(empresa_name)
    # Busca de dados apropriada
    return fetch_personas_with_strategy(config)
```

## 📈 Roadmap

### Curto Prazo
- ✅ LifewayUSA funcional
- 🔄 Interface para criação de novas empresas
- 🔄 Scripts automáticos para novas empresas

### Médio Prazo  
- 🔄 Migração opcional de LifewayUSA para unificado
- 🔄 Dashboard de monitoramento de sincronização
- 🔄 APIs REST para gestão de estratégias

### Longo Prazo
- 🔄 Multi-tenancy avançado
- 🔄 Backup e restore por empresa
- 🔄 Analytics cross-empresa

---

**Esta arquitetura garante que o sistema seja robusto, flexível e capaz de acomodar tanto cenários legados quanto novas implementações de forma transparente e eficiente.**