# 🗄️ Database Migrations - VCM Personas

## 📋 Resumo das Alterações

### Migration 01: Criar tabela `personas_metas`
- **Objetivo**: Sistema de metas SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- **Funcionalidades**: 
  - Metas vinculadas a personas
  - Tracking de progresso (0-100%)
  - Categorização (performance, desenvolvimento, KPI, projeto)
  - Status (não iniciada, em progresso, concluída, pausada, cancelada)
  - Prioridade (alta, média, baixa)
  - Prazos e acompanhamento temporal

### Migration 02: Expandir tabela `personas_tasks`
- **Objetivo**: Adicionar procedimentos detalhados para execução de tarefas
- **Campo adicionado**: `procedimento_execucao` (JSONB)
- **Estrutura**: Array de steps com ação, ferramenta, tempo estimado e detalhes

---

## 🚀 Como Executar as Migrations

### Passo 1: Acessar Supabase SQL Editor
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `fzyokrvdyeczhfqlwxzb`
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar Migration 01 (personas_metas)
1. Abra o arquivo: `01_create_personas_metas.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso

**O que será criado:**
- Tabela `personas_metas` com 17 campos
- 4 índices para performance (persona_id, status, data_prazo, categoria)
- Trigger para atualizar `updated_at` automaticamente
- Comentários de documentação

### Passo 3: Executar Migration 02 (personas_tasks)
1. Abra o arquivo: `02_alter_personas_tasks_add_procedures.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso

**O que será criado:**
- Campo `procedimento_execucao` (JSONB) em `personas_tasks`
- Comentários de documentação para todos os campos relacionados

### Passo 4: Verificar se tudo funcionou
Execute o script de verificação:

```bash
cd AUTOMACAO/migrations
node verify_migrations.cjs
```

**Resultado esperado:**
```
✅ Tabela personas_metas existe!
✅ Campo procedimento_execucao existe em personas_tasks!
✅ TODAS AS MIGRATIONS APLICADAS COM SUCESSO!
```

---

## 📊 Estrutura das Novas Tabelas

### Tabela `personas_metas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `persona_id` | UUID | Foreign key para personas |
| `titulo` | TEXT | Título curto da meta |
| `descricao` | TEXT | Descrição detalhada |
| `categoria` | TEXT | performance / desenvolvimento / kpi / projeto |
| `valor_alvo` | NUMERIC | Valor que se quer atingir |
| `valor_atual` | NUMERIC | Valor atual alcançado |
| `unidade_medida` | TEXT | %, unidades, horas, R$, etc |
| `data_inicio` | DATE | Data de início |
| `data_prazo` | DATE | Data limite |
| `status` | TEXT | nao_iniciada / em_progresso / concluida / pausada / cancelada |
| `progresso_percentual` | INT | 0-100 |
| `prioridade` | INT | 1=alta, 2=média, 3=baixa |
| `responsavel` | TEXT | Nome ou ID do responsável |
| `observacoes` | TEXT | Notas adicionais |
| `vinculada_kpi` | TEXT | Referência ao KPI original |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

### Campo `procedimento_execucao` em `personas_tasks`

**Tipo**: JSONB (Array de objetos)

**Estrutura de cada step:**
```json
{
  "step": 1,
  "acao": "Descrição da ação a realizar",
  "ferramenta": "Nome da ferramenta utilizada",
  "tempo_estimado_min": 15,
  "detalhes": "Informações complementares"
}
```

**Exemplo completo:**
```json
[
  {
    "step": 1,
    "acao": "Acessar HubSpot e selecionar campanha",
    "ferramenta": "HubSpot",
    "tempo_estimado_min": 5,
    "detalhes": "Fazer login, navegar até Campaigns > Email Marketing"
  },
  {
    "step": 2,
    "acao": "Configurar segmentação de público",
    "ferramenta": "HubSpot Lists",
    "tempo_estimado_min": 15,
    "detalhes": "Criar lista filtrada por: última interação < 30 dias"
  }
]
```

---

## 🔄 Próximos Passos (Após Migrations)

### 1. APIs REST (Backend)
- [ ] `POST /api/personas/metas` - Criar meta
- [ ] `GET /api/personas/[id]/metas` - Listar metas de uma persona
- [ ] `PUT /api/personas/metas/[metaId]` - Atualizar meta
- [ ] `PATCH /api/personas/metas/[metaId]/progresso` - Atualizar progresso
- [ ] `DELETE /api/personas/metas/[metaId]` - Deletar meta
- [ ] `POST /api/personas/atribuicoes` - Adicionar atribuição
- [ ] `PUT /api/personas/atribuicoes/[id]` - Editar atribuição
- [ ] `DELETE /api/personas/atribuicoes/[id]` - Deletar atribuição
- [ ] `PATCH /api/personas/tasks/[id]/procedimento` - Atualizar procedimento

### 2. Interface (Frontend)
- [ ] Tab "Metas" em PersonaDetailPage
  - Lista de metas com progress bars
  - Formulário de criação/edição
  - Status badges e countdown timers
- [ ] Botões de edição em "Atribuições"
  - ➕ Adicionar nova
  - ✏️ Editar inline
  - 🗑️ Deletar
- [ ] Expansão da tab "Tarefas"
  - Accordion com procedimentos step-by-step
  - Visualização de subsistemas necessários
  - Mapa de dependências

### 3. Automação (Scripts)
- [ ] Atualizar `04_generate_competencias_grok.js`
  - Gerar metas SMART automaticamente
  - Converter KPIs em metas estruturadas
- [ ] Atualizar `06_analyze_tasks_for_automation.js`
  - Gerar procedimentos detalhados
  - Mapear subsistemas necessários
  - Inferir inputs/outputs

---

## ⚠️ Rollback (Se necessário)

### Reverter Migration 01:
```sql
DROP TRIGGER IF EXISTS trigger_update_personas_metas_updated_at ON personas_metas;
DROP FUNCTION IF EXISTS update_personas_metas_updated_at();
DROP TABLE IF EXISTS personas_metas CASCADE;
```

### Reverter Migration 02:
```sql
ALTER TABLE personas_tasks DROP COLUMN IF EXISTS procedimento_execucao;
```

---

## 📚 Referências

### Subsistemas VCM (12 tipos)
1. `gestao_personas` - Gestão de Personas
2. `gestao_kpis` - Gestão de KPIs e Métricas
3. `comunicacao` - Comunicação (Chat/Email/Voice)
4. `automacao_workflows` - Automação e Workflows (N8N)
5. `rag_knowledge` - RAG (Knowledge Base)
6. `documentacao` - Documentação e Arquivos
7. `gestao_tarefas` - Gestão de Tarefas
8. `gestao_projetos` - Gestão de Projetos
9. `gestao_financeira` - Gestão Financeira
10. `business_intelligence` - Business Intelligence (Analytics)
11. `integracao_externa` - Integração Externa (APIs)
12. `seguranca_auditoria` - Segurança e Auditoria

### Categorias de Metas
- **performance**: Melhoria de indicadores operacionais
- **desenvolvimento**: Capacitação e aprendizado
- **kpi**: Metas vinculadas a KPIs específicos
- **projeto**: Metas de projetos específicos

### Status de Metas
- `nao_iniciada`: Meta criada mas ainda não começou
- `em_progresso`: Meta em execução
- `concluida`: Meta alcançada (progresso = 100%)
- `pausada`: Meta temporariamente suspensa
- `cancelada`: Meta abandonada

---

## 🐛 Troubleshooting

### Erro: "relation 'personas_metas' does not exist"
**Solução**: Execute a migration 01 no SQL Editor do Supabase.

### Erro: "column 'procedimento_execucao' does not exist"
**Solução**: Execute a migration 02 no SQL Editor do Supabase.

### Erro de permissão no Supabase
**Solução**: 
1. Verifique se está usando o projeto correto
2. Verifique se o usuário tem permissões de admin
3. Execute as migrations pelo SQL Editor (não pela API)

### Verificação falha mas SQL executou sem erros
**Solução**:
1. Aguarde 10-30 segundos (propagação do cache)
2. Execute `node verify_migrations.cjs` novamente
3. Se persistir, reinicie o servidor Next.js (`npm run dev`)

---

**Data**: 06/12/2025  
**Autor**: GitHub Copilot  
**Status**: ✅ Pronto para execução
