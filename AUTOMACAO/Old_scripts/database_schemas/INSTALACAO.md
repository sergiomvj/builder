# 🚀 INSTALAÇÃO DAS TABELAS DO SISTEMA DE WORKFLOWS

**Ordem de execução:** Este guia mostra a ordem correta para criar as tabelas no Supabase.

---

## ⚠️ IMPORTANTE: ORDEM DE CRIAÇÃO

Execute os scripts SQL **NESTA ORDEM** para evitar erros de dependência:

### 1️⃣ **PRIMEIRO:** automation_opportunities.sql
```bash
# Esta tabela NÃO tem dependências externas (exceto empresas e personas que já existem)
```

### 2️⃣ **DEPOIS:** personas_workflows.sql
```bash
# Esta tabela DEPENDE de automation_opportunities
```

---

## 📋 INSTRUÇÕES PASSO-A-PASSO

### Método 1: Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor
2. Vá em **SQL Editor** → **New Query**
3. Execute os scripts NA ORDEM:

**Passo 1:**
```sql
-- Copie e cole TODO o conteúdo de: automation_opportunities.sql
-- Execute (Run)
```

**Passo 2:**
```sql
-- Copie e cole TODO o conteúdo de: personas_workflows.sql
-- Execute (Run)
```

---

### Método 2: Supabase CLI

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link para o projeto
supabase link --project-ref fzyokrvdyeczhfqlwxzb

# Executar migrations
supabase db push

# Ou executar scripts individualmente:
psql $DATABASE_URL < AUTOMACAO/database_schemas/automation_opportunities.sql
psql $DATABASE_URL < AUTOMACAO/database_schemas/personas_workflows.sql
```

---

### Método 3: Node.js Script (Automático)

Criei o script `install_tables.js` que executa automaticamente na ordem correta.

```bash
cd AUTOMACAO
node install_tables.js
```

---

## ✅ VERIFICAÇÃO PÓS-INSTALAÇÃO

Após executar os scripts, verifique no Supabase Dashboard:

### Tabelas criadas:
- [ ] `automation_opportunities` (com 15+ colunas)
- [ ] `personas_workflows` (com 20+ colunas)

### Views criadas:
- [ ] `automation_opportunities_priority`
- [ ] `automation_roi_by_empresa`
- [ ] `workflows_active_metrics`
- [ ] `workflows_by_persona_summary`
- [ ] `workflows_need_attention`

### Funções criadas:
- [ ] `update_automation_opportunities_updated_at()`
- [ ] `mark_opportunity_workflow_created()`
- [ ] `reject_automation_opportunity()`
- [ ] `update_personas_workflows_updated_at()`
- [ ] `update_opportunity_on_workflow_create()`
- [ ] `record_workflow_execution()`
- [ ] `activate_workflow()`
- [ ] `pause_workflow()`
- [ ] `archive_workflow()`

### Query de teste:
```sql
-- Testar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('automation_opportunities', 'personas_workflows');

-- Deve retornar 2 linhas
```

---

## 🐛 TROUBLESHOOTING

### Erro: "relation automation_opportunities does not exist"
**Solução:** Você executou `personas_workflows.sql` ANTES de `automation_opportunities.sql`
- Execute primeiro `automation_opportunities.sql`
- Depois execute `personas_workflows.sql`

### Erro: "extension uuid-ossp does not exist"
**Solução:** Habilitar extensão no Supabase
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "permission denied"
**Solução:** Usar service_role key ou executar via Dashboard
- O Dashboard tem permissões administrativas automaticamente

---

## 📝 PRÓXIMOS PASSOS

Após instalação bem-sucedida:

1. ✅ Executar script de geração de tarefas (se ainda não tiver):
   ```bash
   node 01.5_generate_tasks_from_atribuicoes.js --empresaId=UUID
   ```

2. ✅ Executar análise de automação:
   ```bash
   node 02.5_analyze_tasks_for_automation.js --empresaId=UUID
   ```

3. ✅ Gerar workflows N8N:
   ```bash
   node 03_generate_n8n_from_tasks.js --empresaId=UUID
   ```

---

**Data:** 28/11/2025  
**Autor:** VCM Auto-Generator
