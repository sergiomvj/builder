# Sistema de Tarefas Multi-Persona - VCM

## 📋 Visão Geral

O VCM utiliza **exclusivamente** `personas_tasks` para gerenciar tarefas. Não existe tabela `tasks` genérica, pois **todas as tarefas são sempre atribuídas a uma ou mais personas**.

## 🏗️ Arquitetura de Banco de Dados

### Tabela Principal: `personas_tasks`
Armazena as tarefas com metadados completos:
- `id` (uuid) - Identificador único
- `empresa_id` (uuid) - Empresa proprietária
- `task_id` (varchar) - ID legível (ex: TASK-12345)
- `title` (varchar) - Título da tarefa
- `description` (text) - Descrição detalhada
- `task_type` - Tipo: daily, weekly, monthly, ad_hoc
- `priority` - Prioridade: LOW, MEDIUM, HIGH, URGENT
- `status` - Estado: pending, in_progress, completed, cancelled, overdue
- `estimated_duration` (integer) - Duração estimada em minutos
- `actual_duration` (integer) - Duração real em minutos
- `due_date` (timestamptz) - Data limite
- `completed_at` (timestamptz) - Data de conclusão
- `required_subsystems` (jsonb) - Subsistemas necessários
- `inputs_from` (jsonb) - Entradas de outros agentes
- `outputs_to` (jsonb) - Saídas para outros agentes
- `success_criteria` (text) - Critérios de sucesso
- `complexity_score` (1-10) - Pontuação de complexidade
- `ai_generated` (boolean) - Gerado por IA?
- `generation_context` (jsonb) - Contexto da geração

### Tabela de Relacionamento: `task_persona_assignments`
Implementa many-to-many entre tarefas e personas:
- `id` (uuid) - Identificador único
- `task_id` (uuid) - FK para personas_tasks
- `persona_id` (uuid) - FK para personas
- `assigned_at` (timestamptz) - Quando foi atribuída
- `assigned_by` (uuid) - Quem atribuiu (opcional)
- `status` - Estado específico da persona: pending, in_progress, completed, skipped
- `completed_at` (timestamptz) - Quando a persona completou
- `notes` (text) - Notas específicas da persona

**Constraint**: UNIQUE(task_id, persona_id) - Uma persona não pode ser atribuída 2x na mesma tarefa

## 🔄 Fluxos de Uso

### 1. Criar Tarefa com Múltiplas Personas

```javascript
// POST /api/tasks
{
  "title": "Preparar proposta comercial",
  "description": "Criar proposta para cliente XYZ",
  "priority": "HIGH",
  "task_type": "ad_hoc",
  "due_date": "2025-11-30T23:59:59Z",
  "persona_ids": [
    "uuid-gestor-comercial",
    "uuid-analista-vendas",
    "uuid-designer"
  ]
}
```

### 2. Buscar Tarefas de uma Empresa

```javascript
// GET /api/tasks?empresa_id=uuid-da-empresa
// Retorna todas as tarefas com suas atribuições
```

### 3. Buscar Tarefas de uma Persona Específica

```javascript
// GET /api/tasks?persona_id=uuid-da-persona
// Retorna apenas tarefas atribuídas a essa persona
```

### 4. Atualizar Atribuições de Personas

```javascript
// PUT /api/tasks
{
  "id": "uuid-da-tarefa",
  "persona_ids": [
    "uuid-nova-persona-1",
    "uuid-nova-persona-2"
  ]
}
// Remove atribuições antigas e cria novas
```

## 🎯 Casos de Uso

### Tarefa para Uma Persona
```json
{
  "title": "Responder emails diários",
  "persona_ids": ["uuid-assistente-executivo"]
}
```

### Tarefa para Múltiplas Personas (Colaborativa)
```json
{
  "title": "Desenvolver novo produto",
  "persona_ids": [
    "uuid-gerente-produto",
    "uuid-desenvolvedor-senior",
    "uuid-designer-ux"
  ]
}
```

### Tarefa para Todas as Personas da Empresa
```javascript
// No frontend, usar botão "Selecionar Todas"
// Isso atribui a tarefa a todas as personas disponíveis
```

## 🖥️ Interface do Usuário

### Criação de Tarefas
1. **Campos Básicos**: título e descrição
2. **Seleção de Personas**: 
   - Checkboxes com lista de todas as personas
   - Botão "Selecionar Todas" para tarefas organizacionais
   - Botão "Limpar" para resetar seleção
   - Contador de personas selecionadas

### Visualização de Tarefas
- **Card de Tarefa** mostra:
  - Título e badges de prioridade/status
  - Descrição
  - Lista de personas atribuídas com seus status individuais
  - Data de criação
  - Ações (remover, editar)

## 🔧 Migrations Necessárias

### 1. Criar tabela de atribuições
```bash
# No Supabase SQL Editor, executar:
AUTOMACAO/08_DATABASE_SCHEMAS/create_task_persona_assignments.sql
```

Esta migration:
- ✅ Cria `task_persona_assignments`
- ✅ Adiciona índices para performance
- ✅ Migra dados existentes de `persona_id` (se existirem)
- ⚠️ **Mantém** coluna `persona_id` em `personas_tasks` por compatibilidade (pode remover depois)

## 📊 Queries Úteis

### Ver todas as tarefas de uma persona com detalhes
```sql
SELECT 
  pt.*,
  tpa.status as assignment_status,
  tpa.assigned_at,
  tpa.completed_at
FROM personas_tasks pt
INNER JOIN task_persona_assignments tpa ON pt.id = tpa.task_id
WHERE tpa.persona_id = 'uuid-da-persona'
ORDER BY pt.created_at DESC;
```

### Ver todas as personas atribuídas a uma tarefa
```sql
SELECT 
  p.nome,
  p.cargo,
  tpa.status,
  tpa.assigned_at,
  tpa.completed_at
FROM personas p
INNER JOIN task_persona_assignments tpa ON p.id = tpa.persona_id
WHERE tpa.task_id = 'uuid-da-tarefa';
```

### Tarefas pendentes por persona (dashboard)
```sql
SELECT 
  p.nome,
  COUNT(*) as tarefas_pendentes
FROM personas p
INNER JOIN task_persona_assignments tpa ON p.id = tpa.persona_id
INNER JOIN personas_tasks pt ON tpa.task_id = pt.id
WHERE tpa.status = 'pending'
GROUP BY p.id, p.nome
ORDER BY tarefas_pendentes DESC;
```

## 🚀 Próximos Passos

1. ✅ **Migration executada** - criar `task_persona_assignments`
2. ✅ **API atualizada** - suporte a múltiplas personas
3. ✅ **UI atualizada** - seleção múltipla de personas
4. 🔜 **Dashboard de personas** - visualizar tarefas por persona
5. 🔜 **Filtros avançados** - status, prioridade, tipo
6. 🔜 **Notificações** - alertar personas sobre novas tarefas
7. 🔜 **Analytics** - métricas de produtividade por persona

## ⚠️ Nota Importante

**NÃO criar tabela `tasks` genérica.** O sistema VCM é fundamentalmente baseado em personas, e todas as tarefas devem ter pelo menos uma persona atribuída. Isso garante:
- ✅ Rastreabilidade total
- ✅ Accountability clara
- ✅ Métricas precisas por persona
- ✅ Fluxos de trabalho definidos
- ✅ Coordenação multi-agente eficiente
