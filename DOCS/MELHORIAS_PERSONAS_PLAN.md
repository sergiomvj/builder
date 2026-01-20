# Plano de Melhorias - Personas Detail Page

**Data:** 06/12/2025  
**Objetivo:** Tornar Atribuições, Competências/Metas e Tarefas editáveis e mais detalhadas

---

## 📊 ANÁLISE ATUAL

### 1. Atribuições (`personas_atribuicoes`)
**Campos atuais:**
- `id`, `persona_id`, `atribuicao` (JSONB), `ordem`, `created_at`, `updated_at`
- **Estrutura do JSONB**: `{titulo, descricao, frequencia, importancia, categoria}`

**Status:** ✅ Estrutura boa, só falta UI de edição

---

### 2. Competências (`personas_competencias`)  
**Campos atuais:**
- `competencias_tecnicas` (array)
- `competencias_comportamentais` (array)
- `ferramentas` (array)
- `tarefas_diarias/semanais/mensais` (arrays)
- `kpis` (array) - **Formato texto livre**
- `objetivos_desenvolvimento` (array)

**Problemas:**
- ❌ KPIs são strings simples ("Taxa de precisão - 90%")
- ❌ Não há metas objetivas estruturadas (SMART)
- ❌ Não há tracking de progresso

**Necessidades:**
- ✅ Nova tabela `personas_metas` para metas objetivas
- ✅ Manter competências atuais editáveis
- ✅ KPIs transformados em metas mensuráveis

---

### 3. Tarefas (`personas_tasks`)
**Campos atuais:**
- `title`, `description`, `task_type`, `priority`, `status`
- `estimated_duration`, `actual_duration`, `due_date`
- `required_subsystems` (array) - **VAZIO**
- `inputs_from` (array) - **VAZIO**  
- `outputs_to` (array) - **VAZIO**
- `success_criteria` (text) - **NULL**
- `complexity_score` (int) - **NULL**

**Problemas:**
- ❌ Campos importantes vazios (subsystems, inputs, outputs)
- ❌ Sem procedimentos de execução detalhados
- ❌ Sem mapeamento de dependências

**Necessidades:**
- ✅ Adicionar campo `procedimento_execucao` (JSONB com steps)
- ✅ Preencher `required_subsystems` com os 12 subsistemas VCM
- ✅ Popular `inputs_from` e `outputs_to` com dependências
- ✅ Gerar `success_criteria` automaticamente

---

## 🎯 IMPLEMENTAÇÃO

### FASE 1: Atribuições Editáveis (2h)

**Backend:**
```sql
-- Tabela já existe, sem alterações
```

**API Routes:**
```typescript
POST   /api/personas/atribuicoes     // Adicionar nova
PUT    /api/personas/atribuicoes/:id // Editar
DELETE /api/personas/atribuicoes/:id // Remover
PATCH  /api/personas/atribuicoes/:id/order // Reordenar
```

**Frontend (PersonaDetailPage.tsx - AtribuicoesSection):**
- [ ] Botão "➕ Adicionar Atribuição"
- [ ] Formulário modal: título, descrição, frequência, importância, categoria
- [ ] Botão "✏️ Editar" em cada item
- [ ] Botão "🗑️ Deletar" com confirmação
- [ ] Drag & drop para reordenar (opcional v2)

---

### FASE 2: Sistema de Metas Objetivas (3h)

**Backend - Nova Tabela:**
```sql
CREATE TABLE personas_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Identificação
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT, -- 'performance', 'desenvolvimento', 'kpi', 'projeto'
  
  -- SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
  valor_alvo NUMERIC NOT NULL,
  valor_atual NUMERIC DEFAULT 0,
  unidade_medida TEXT, -- '%', 'unidades', 'horas', 'R$', etc
  
  -- Prazo
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_prazo DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'nao_iniciada', -- nao_iniciada, em_progresso, concluida, pausada, cancelada
  progresso_percentual INT DEFAULT 0, -- 0-100
  
  -- Metadata
  prioridade INT DEFAULT 2, -- 1=alta, 2=media, 3=baixa
  responsavel TEXT, -- pode ser outro persona_id ou nome
  observacoes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metas_persona ON personas_metas(persona_id);
CREATE INDEX idx_metas_status ON personas_metas(status);
CREATE INDEX idx_metas_prazo ON personas_metas(data_prazo);
```

**API Routes:**
```typescript
GET    /api/personas/metas?personaId=UUID
POST   /api/personas/metas
PUT    /api/personas/metas/:id
PATCH  /api/personas/metas/:id/progresso  // Atualizar valor_atual
DELETE /api/personas/metas/:id
```

**Frontend - Nova Seção "Metas":**
- [ ] Card com lista de metas (separado de Competências)
- [ ] Badge de status colorido (🟢 concluída, 🟡 em progresso, ⚪ não iniciada)
- [ ] Barra de progresso visual
- [ ] Prazo com countdown (dias restantes)
- [ ] Botão "➕ Nova Meta"
- [ ] Formulário SMART completo

**Script - Atualizar 04_generate_competencias_grok.js:**
- [ ] Manter geração de competências atual
- [ ] **ADICIONAR** geração de 3-5 metas objetivas por persona
- [ ] Converter KPIs textuais em metas estruturadas
- [ ] Usar prompt específico para gerar metas SMART

---

### FASE 3: Tarefas Detalhadas (4h)

**Backend - Alterar Tabela:**
```sql
ALTER TABLE personas_tasks 
  ADD COLUMN IF NOT EXISTS procedimento_execucao JSONB DEFAULT '[]';
  
-- Estrutura do JSONB:
-- [
--   {"step": 1, "acao": "...", "ferramenta": "...", "tempo_estimado": 10},
--   {"step": 2, "acao": "...", "ferramenta": "...", "tempo_estimado": 15}
-- ]

-- Os campos já existem, mas precisam ser populados:
-- required_subsystems: ['gestao_kpis', 'comunicacao', 'documentacao']
-- inputs_from: ['persona_id_1', 'subsistema_x']
-- outputs_to: ['persona_id_2', 'subsistema_y']
-- success_criteria: 'Campanha com CTR > 3%, alcance de 10k pessoas'
-- complexity_score: 1-10
```

**API Routes:**
```typescript
GET    /api/personas/tasks/:id/procedures
PUT    /api/personas/tasks/:id/procedures
PATCH  /api/personas/tasks/:id/subsystems
```

**Frontend - Expandir TasksSection:**
- [ ] Accordion para cada tarefa (expandir detalhes)
- [ ] Aba "Procedimento":
  - [ ] Lista numerada de steps
  - [ ] Botão "✏️ Editar Procedimento"
  - [ ] Cada step: ação, ferramenta, tempo
- [ ] Aba "Subsistemas":
  - [ ] Chips com os 12 subsistemas VCM
  - [ ] Checkbox para marcar quais são usados
- [ ] Aba "Dependências":
  - [ ] Inputs: de onde vêm os dados (persona/subsistema)
  - [ ] Outputs: para onde vão os resultados
- [ ] Badge de complexidade (1-10 estrelas)

**Script - Atualizar 06_analyze_tasks_for_automation.js:**
- [ ] **ADICIONAR** geração de `procedimento_execucao` para cada tarefa
- [ ] Gerar lista de steps detalhados com LLM
- [ ] **MAPEAR** `required_subsystems` baseado nas atribuições
- [ ] **INFERIR** `inputs_from` e `outputs_to` por análise de fluxo
- [ ] **CALCULAR** `complexity_score` (1-10) automaticamente
- [ ] **GERAR** `success_criteria` específicos e mensuráveis

---

## 🔧 SUBSISTEMAS VCM (Para referência)

1. Gestão de Personas
2. Gestão de KPIs
3. Comunicação (Chat/Email/Voice)
4. Automação e Workflows
5. RAG (Knowledge Base)
6. Documentação
7. Gestão de Tarefas
8. Gestão de Projetos
9. Gestão Financeira
10. Business Intelligence
11. Integração Externa (APIs)
12. Segurança e Auditoria

---

## 📅 CRONOGRAMA SUGERIDO

**Dia 1 (4h):**
- ✅ Análise de schemas (concluído)
- [ ] FASE 1: Atribuições editáveis (2h)
- [ ] Criar tabela personas_metas (30min)
- [ ] APIs de metas (1h30)

**Dia 2 (4h):**
- [ ] FASE 2: Frontend de metas (2h)
- [ ] Atualizar Script 04 para gerar metas (2h)

**Dia 3 (4h):**
- [ ] FASE 3: Alterar personas_tasks (30min)
- [ ] APIs de procedimentos (1h)
- [ ] Frontend expandido de tarefas (2h30)

**Dia 4 (3h):**
- [ ] Atualizar Script 06 para gerar procedimentos (2h)
- [ ] Testes end-to-end (1h)

---

## 🎯 RESULTADO ESPERADO

### Atribuições:
- ✅ Totalmente editáveis via UI
- ✅ Adicionar/remover/reordenar
- ✅ Mantém geração automática inicial

### Competências + Metas:
- ✅ Competências atuais editáveis
- ✅ **NOVO:** Sistema de metas SMART
- ✅ Tracking de progresso visual
- ✅ Prazos e alertas
- ✅ Scripts geram metas automaticamente

### Tarefas:
- ✅ **NOVO:** Procedimentos step-by-step
- ✅ **NOVO:** Mapeamento de subsistemas
- ✅ **NOVO:** Inputs/outputs claros
- ✅ **NOVO:** Critérios de sucesso
- ✅ **NOVO:** Score de complexidade
- ✅ Scripts geram tudo automaticamente
- ✅ Edição manual posterior via UI

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. Criar SQL para tabela `personas_metas`
2. Criar APIs REST para CRUD de atribuições
3. Implementar UI de adição de atribuições (mais simples)
4. Testar e iterar

**Pronto para começar?** 🎯
