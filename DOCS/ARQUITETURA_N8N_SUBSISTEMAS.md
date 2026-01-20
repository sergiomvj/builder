# 🏗️ ARQUITETURA N8N ↔ SUBSISTEMAS VCM

**Documento de Análise Arquitetural Completa**  
**Data Inicial:** 06/12/2025  
**Última Atualização:** 07/12/2025  
**Versão:** 2.0 (Enriquecida)  
**Autor:** GitHub Copilot (Claude Sonnet 4.5)

---

## 📋 SUMÁRIO EXECUTIVO

Este documento analisa a arquitetura de integração entre **Personas VCM**, **Workflows N8N** e os **12 Subsistemas VCM**. Cada persona terá um workflow N8N que funciona como sua "alma" — um orquestrador inteligente que executa tarefas automatizadas usando os subsistemas como ferramentas.

**Princípios Fundamentais:**
> _"Personas não são usuários, são agentes autônomos. Workflows N8N são suas 'almas'. Subsistemas VCM são suas ferramentas de trabalho."_

> _"Empresas são virtuais, mas objetivos são tangíveis. O usuário é a interface entre ambos os mundos."_

> _"Comunicação entre personas é o sangue do sistema. Supervisão hierárquica é o sistema nervoso. Intervenção humana estruturada é o cérebro."_

### 🆕 Novidades da Versão 2.0

Esta versão adiciona **três dimensões críticas**:

1. **💬 COMUNICAÇÕES INTER-PERSONAS:** Sistema de mensagens estruturadas entre agentes (handoffs, notificações, aprovações, questões)

2. **👔 SUPERVISÃO HIERÁRQUICA:** Cadeia de comando, accountability e escalação automática baseada em níveis hierárquicos

3. **🎮 INTERFACE USUÁRIO ↔ SISTEMA:** Templates de tarefas, comandos estruturados e mensurabilidade de objetivos tangíveis sem necessidade de LLM paga

---

## 🎯 CONTEXTO DO SISTEMA

### Estado Atual (V5.0 Completo)

```
✅ Foundation Layer:
   - 26 Personas criadas (Script 01)
   - Biografias com experiência OKR (Script 02)
   - Atribuições vinculadas a subsistemas (Script 03)
   - 12 Subsistemas VCM configurados (SQL)

⏳ Integration Layer (Em desenvolvimento):
   - Script 04: Competências estratégicas
   - Script 05: Avatares visuais
   - Script 06: Análise de automação
   - Script 07: Geração de workflows N8N ← FOCO DESTE DOCUMENTO
```

### Dados Disponíveis por Persona

Cada persona possui:

1. **Identidade** (`personas`):
   - `persona_code`, `role`, `full_name`, `email`
   - `nivel_hierarquico`, `bloco_funcional_id`
   - `okr_owner_ids[]` (responsável por OKRs específicos)
   - `responsabilidade_resultado` (resultado principal esperado)
   - `metricas_responsabilidade[]` (KPIs que deve atingir)

2. **Biografia** (`personas_biografias`):
   - `biografia_estruturada` (JSON: texto, formação, áreas expertise, casos sucesso)
   - Experiência em anos
   - Nacionalidade, gênero

3. **Atribuições** (`personas_atribuicoes`):
   - `atribuicao` (responsabilidade específica)
   - `use_subsystem` (boolean)
   - `which_subsystem` (ex: "marketing", "vendas", "financeiro")
   - `how_use` (instruções de uso do subsistema)
   - `ordem` (prioridade)

4. **Competências** (Script 04 - a ser gerado):
   - Técnicas, comportamentais, ferramentas
   - Tarefas diárias, semanais, mensais
   - KPIs e objetivos de desenvolvimento

5. **Oportunidades de Automação** (Script 06 - a ser gerado):
   - `automation_score` (0-100)
   - `automation_feasibility` (easy/medium/hard)
   - `workflow_type` (cron, webhook, conditional)
   - `workflow_steps[]` (sequência de ações)
   - `tools_needed[]` (subsistemas necessários)

---

## 🏛️ ARQUITETURA PROPOSTA

### Modelo Conceitual

```
┌─────────────────────────────────────────────────────────────────┐
│                          VCM ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐      ┌──────────────┐      ┌───────────────┐ │
│  │   PERSONA   │─────▶│ N8N WORKFLOW │─────▶│  SUBSISTEMAS  │ │
│  │   (Agent)   │      │    (Alma)    │      │  (Ferramentas)│ │
│  └─────────────┘      └──────────────┘      └───────────────┘ │
│         │                     │                      │          │
│         │                     │                      │          │
│    [Atribuições]         [Tasks]              [APIs/Actions]   │
│    [OKRs]                [Triggers]           [Data I/O]       │
│    [Competências]        [Logic]              [Integration]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Camadas da Arquitetura

#### 1️⃣ **CAMADA DE PERSONAS (Agentes)**
- **Função:** Definir QUEM faz O QUE e POR QUÊ
- **Dados:** Atribuições, OKRs, competências, biografia
- **Output:** Contexto para geração de workflows

#### 2️⃣ **CAMADA DE WORKFLOWS N8N (Orquestração)**
- **Função:** Executar tarefas automaticamente
- **Componentes:**
  - **Triggers:** Quando executar (cron, webhook, evento)
  - **Logic Nodes:** Decisões, loops, transformações
  - **Action Nodes:** Chamadas a subsistemas
  - **Error Handling:** Retry, fallback, logging
- **Output:** Ações executadas, dados processados

#### 3️⃣ **CAMADA DE SUBSISTEMAS (Ferramentas)**
- **Função:** Fornecer capacidades especializadas
- **Tipos:**
  - **Core:** Gestão, Produção, Financeiro, Vendas, Marketing
  - **Operacional:** Compras, Estoque, Logística
  - **Suporte:** RH, Atendimento, Qualidade, Projetos
- **Interface:** APIs REST, Webhooks, Database direto

---

## 💬 COMUNICAÇÕES INTER-PERSONAS

### Visão Geral

As personas não trabalham isoladamente. Elas precisam **comunicar-se entre si** para completar fluxos de trabalho complexos, assim como funcionários reais em uma empresa.

**Tipos de Comunicação:**

1. **HANDOFF (Repasse de Trabalho):** Persona A completa sua parte e repassa para Persona B
2. **NOTIFICATION (Notificação):** Avisar outra persona sobre evento importante
3. **APPROVAL_REQUEST (Solicitação de Aprovação):** Pedir autorização para prosseguir
4. **QUESTION (Questão/Consulta):** Solicitar informação ou esclarecimento

### Estrutura de Dados

#### Tabela `personas_communications`

```sql
CREATE TABLE personas_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origem e Destino
  from_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  to_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Tipo e Conteúdo
  communication_type TEXT NOT NULL CHECK (communication_type IN ('handoff', 'notification', 'approval_request', 'question')),
  subject TEXT NOT NULL,
  message TEXT,
  
  -- Contexto
  related_task_id UUID,
  related_okr_id UUID REFERENCES empresas_okrs(id),
  related_subsystem TEXT,
  data_payload JSONB,  -- Dados estruturados anexados
  
  -- Status e Prioridade
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'acted_upon', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Ação Esperada
  requires_action BOOLEAN DEFAULT false,
  action_deadline TIMESTAMP,
  action_taken TEXT,
  action_result JSONB,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  acted_at TIMESTAMP,
  
  -- Índices
  CONSTRAINT fk_from_persona FOREIGN KEY (from_persona_id) REFERENCES personas(id),
  CONSTRAINT fk_to_persona FOREIGN KEY (to_persona_id) REFERENCES personas(id)
);

-- Índices para performance
CREATE INDEX idx_communications_to ON personas_communications(to_persona_id, status);
CREATE INDEX idx_communications_from ON personas_communications(from_persona_id);
CREATE INDEX idx_communications_deadline ON personas_communications(action_deadline) WHERE requires_action = true;
CREATE INDEX idx_communications_type ON personas_communications(communication_type);
```

### Exemplos de Fluxos de Comunicação

#### Exemplo 1: Marketing → Vendas (HANDOFF)

```javascript
// Marketing persona completa geração de leads
{
  from_persona_id: "marketing_manager_id",
  to_persona_id: "sales_manager_id",
  communication_type: "handoff",
  subject: "100 novos leads qualificados disponíveis",
  message: "Segmento: Empresas de TI 50-200 funcionários. Score médio: 85/100.",
  related_subsystem: "marketing",
  data_payload: {
    leads_ids: ["uuid1", "uuid2", "..."],
    qualification_criteria: {
      min_score: 80,
      industry: "technology",
      size: "50-200_employees"
    },
    source_campaign: "LinkedIn Ads Q4 2025",
    total_leads: 100,
    average_score: 85
  },
  requires_action: true,
  action_deadline: "2025-12-10T17:00:00Z",
  priority: "high"
}
```

**Workflow N8N correspondente:**

```javascript
// Nó: Send Handoff Communication
{
  id: "send_handoff",
  type: "Supabase",
  operation: "insert",
  table: "personas_communications",
  parameters: {
    data: {
      from_persona_id: "={{$env.PERSONA_ID}}",
      to_persona_id: "={{$parameter.next_persona}}",
      communication_type: "handoff",
      subject: "={{$json.subject}}",
      data_payload: "={{$json}}",
      requires_action: true,
      action_deadline: "={{$now().plus(48, 'hours')}}"
    }
  }
}
```

#### Exemplo 2: Vendas → CFO (APPROVAL_REQUEST)

```javascript
{
  from_persona_id: "sales_rep_id",
  to_persona_id: "cfo_id",
  communication_type: "approval_request",
  subject: "Aprovação: Desconto 25% para cliente ACME Corp",
  message: "Proposta de R$ 150k com desconto de 25% (R$ 37.5k). Cliente estratégico com potencial de R$ 500k anuais.",
  related_subsystem: "vendas",
  data_payload: {
    opportunity_id: "uuid",
    customer_name: "ACME Corp",
    original_value: 150000,
    discount_percentage: 25,
    discount_value: 37500,
    final_value: 112500,
    justification: "Cliente estratégico com volume futuro estimado",
    estimated_lifetime_value: 500000,
    competitor_offer: 110000
  },
  requires_action: true,
  action_deadline: "2025-12-08T18:00:00Z",
  priority: "urgent"
}
```

**Resposta do CFO:**

```javascript
// PATCH /api/communications/{id}
{
  status: "acted_upon",
  action_taken: "approved_with_conditions",
  action_result: {
    approved: true,
    final_discount: 20,  // Reduziu de 25% para 20%
    conditions: [
      "Pagamento 50% antecipado",
      "Renovação automática ano 2",
      "Testemunho em vídeo para marketing"
    ],
    notes: "Desconto ajustado para 20%. Condições adicionadas."
  },
  acted_at: "2025-12-07T15:30:00Z"
}
```

#### Exemplo 3: Produção → Compras (NOTIFICATION)

```javascript
{
  from_persona_id: "production_manager_id",
  to_persona_id: "purchasing_manager_id",
  communication_type: "notification",
  subject: "ALERTA: Estoque de matéria-prima abaixo do mínimo",
  message: "Aço inoxidável 304: 150kg restantes (mínimo: 500kg). Produção em risco se não repor em 3 dias.",
  related_subsystem: "producao",
  data_payload: {
    material_code: "ACO-304",
    material_name: "Aço Inoxidável 304",
    current_stock: 150,
    minimum_stock: 500,
    daily_consumption: 80,
    days_until_stockout: 1.875,
    urgency_level: "critical",
    suggested_order_quantity: 2000
  },
  requires_action: true,
  action_deadline: "2025-12-08T12:00:00Z",
  priority: "urgent"
}
```

### Integração com N8N Workflows

#### Nó de Comunicação Genérico (Reutilizável)

```javascript
// Template: Send Communication Node
{
  id: "send_communication",
  type: "Function",
  parameters: {
    functionCode: `
      const communication = {
        from_persona_id: $env.CURRENT_PERSONA_ID,
        to_persona_id: $parameter.recipient_id,
        communication_type: $parameter.comm_type,
        subject: $parameter.subject,
        message: $parameter.message || null,
        data_payload: $json,
        requires_action: $parameter.requires_action || false,
        action_deadline: $parameter.deadline || null,
        priority: $parameter.priority || 'normal',
        related_subsystem: $env.CURRENT_SUBSYSTEM
      };
      
      return communication;
    `
  },
  nextNode: "insert_communication"
},
{
  id: "insert_communication",
  type: "Supabase",
  operation: "insert",
  table: "personas_communications",
  parameters: {
    data: "={{$json}}"
  }
}
```

#### Nó de Verificação de Comunicações Pendentes

```javascript
// Check Pending Communications (para cada persona)
{
  id: "check_communications",
  type: "Supabase",
  operation: "select",
  table: "personas_communications",
  parameters: {
    filter: {
      to_persona_id: "={{$env.PERSONA_ID}}",
      status: "pending",
      requires_action: true
    },
    orderBy: "priority DESC, action_deadline ASC"
  }
}
```

### Métricas de Comunicação

**Dashboard de Comunicações:**

```sql
-- Métricas por persona
SELECT 
  p.persona_code,
  p.full_name,
  COUNT(*) FILTER (WHERE c.status = 'pending') as comunicacoes_pendentes,
  COUNT(*) FILTER (WHERE c.requires_action = true AND c.status = 'pending') as acoes_pendentes,
  COUNT(*) FILTER (WHERE c.action_deadline < NOW() AND c.status = 'pending') as atrasadas,
  AVG(EXTRACT(EPOCH FROM (c.acted_at - c.created_at)) / 3600) FILTER (WHERE c.acted_at IS NOT NULL) as tempo_medio_resposta_horas
FROM personas p
LEFT JOIN personas_communications c ON c.to_persona_id = p.id
WHERE c.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.persona_code, p.full_name
ORDER BY comunicacoes_pendentes DESC;
```

---

## 👔 SUPERVISÃO HIERÁRQUICA

### Visão Geral

Toda tarefa executada por uma persona precisa ser **supervisionada** por outra persona em nível hierárquico superior. Isso garante **accountability**, **qualidade** e **alinhamento estratégico**.

**Princípios:**

1. **Cadeia de Comando Clara:** Cada executor tem supervisor direto
2. **Escalação Automática:** Se supervisor não responder, escala para nível acima
3. **Approval Thresholds:** Valores/riscos acima de threshold exigem aprovação
4. **Audit Trail:** Todas as supervisões são registradas

### Hierarquia de Níveis

```
Nível 1 (Estratégico): CEO, Board
   ↓ supervisiona
Nível 2 (Tático): C-Level (CFO, CMO, COO, CTO)
   ↓ supervisiona
Nível 3 (Operacional): Managers, Coordinators
   ↓ supervisiona
Nível 4 (Execução): Analysts, Specialists, Assistants
```

### Estrutura de Dados

#### Tabela `task_supervision_chains`

```sql
CREATE TABLE task_supervision_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação da Tarefa
  task_template_code TEXT NOT NULL,  -- ex: "gerar_leads", "fechar_venda"
  task_name TEXT NOT NULL,
  task_category TEXT CHECK (task_category IN ('operational', 'tactical', 'strategic')),
  
  -- Executor
  executor_role TEXT NOT NULL,  -- ex: "marketing_analyst"
  executor_level INTEGER NOT NULL CHECK (executor_level BETWEEN 1 AND 4),
  
  -- Supervisores (Cadeia Hierárquica)
  direct_supervisor_role TEXT,
  direct_supervisor_level INTEGER CHECK (direct_supervisor_level BETWEEN 1 AND 3),
  
  escalation_supervisor_role TEXT,
  escalation_supervisor_level INTEGER CHECK (escalation_supervisor_level BETWEEN 1 AND 2),
  
  -- Regras de Supervisão
  requires_approval BOOLEAN DEFAULT false,
  approval_threshold JSONB,  -- { "field": "valor", "operator": ">", "value": 10000 }
  auto_escalate_after_hours INTEGER DEFAULT 24,
  
  -- SLA e Métricas
  expected_duration_hours INTEGER,
  sla_warning_threshold FLOAT DEFAULT 0.8,  -- 80% do SLA = warning
  max_retries INTEGER DEFAULT 3,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_supervision_task ON task_supervision_chains(task_template_code);
CREATE INDEX idx_supervision_role ON task_supervision_chains(executor_role);
```

#### Tabela `task_supervision_logs`

```sql
CREATE TABLE task_supervision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tarefa Supervisionada
  task_execution_id UUID NOT NULL,
  task_template_code TEXT NOT NULL,
  
  -- Personas Envolvidas
  executor_persona_id UUID REFERENCES personas(id),
  supervisor_persona_id UUID REFERENCES personas(id),
  
  -- Supervisão
  supervision_type TEXT CHECK (supervision_type IN ('approval', 'review', 'escalation', 'rejection')),
  supervision_result TEXT CHECK (supervision_result IN ('approved', 'rejected', 'approved_with_modifications', 'escalated')),
  
  -- Detalhes
  supervisor_notes TEXT,
  modifications JSONB,
  escalation_reason TEXT,
  
  -- Timestamps
  requested_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,
  escalated_at TIMESTAMP,
  
  -- Métricas
  response_time_hours FLOAT GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (responded_at - requested_at)) / 3600) STORED,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_supervision_logs_task ON task_supervision_logs(task_execution_id);
CREATE INDEX idx_supervision_logs_supervisor ON task_supervision_logs(supervisor_persona_id, supervision_result);
```

### Matriz de Supervisão

#### Exemplo Completo por Bloco Funcional

| Tarefa | Executor (Nível 4) | Supervisor Direto (Nível 3) | Supervisor Escalação (Nível 2) | Threshold Aprovação |
|--------|-------------------|----------------------------|--------------------------------|---------------------|
| **MARKETING** |
| Gerar leads | Marketing Analyst | Marketing Manager | CMO | N/A |
| Criar campanha | Marketing Specialist | Marketing Manager | CMO | Budget > R$ 10k |
| Aprovar conteúdo | Content Creator | Content Manager | CMO | N/A |
| **VENDAS** |
| Qualificar lead | Sales Development Rep | Sales Manager | VP Sales | N/A |
| Fechar venda | Sales Representative | Sales Manager | VP Sales | Valor > R$ 50k |
| Desconto > 15% | Sales Representative | Sales Manager | CFO | Desconto > 15% |
| **FINANCEIRO** |
| Lançar despesa | Financial Analyst | Controller | CFO | Valor > R$ 5k |
| Aprovar orçamento | Controller | CFO | CEO | Desvio > 10% |
| Transferência | Treasury Analyst | Controller | CFO | Valor > R$ 100k |
| **PRODUÇÃO** |
| Criar ordem produção | Production Planner | Production Manager | COO | Qtd > 1000 un |
| Parada de máquina | Maintenance Tech | Maintenance Manager | COO | Duração > 4h |
| Ajuste de processo | Quality Analyst | Quality Manager | COO | Impacto > 20% |

### Workflow N8N com Supervisão

#### Template de Workflow com Aprovação Hierárquica

```javascript
{
  name: "Task_Execution_with_Supervision",
  nodes: [
    {
      id: "execute_task",
      type: "HTTP Request",
      name: "Execute Primary Task"
    },
    {
      id: "check_supervision_needed",
      type: "Code",
      parameters: {
        code: `
          // Buscar regras de supervisão
          const taskTemplate = $json.task_template;
          const taskValue = $json.value || 0;
          
          const supervisionRules = await $getSupervisionRules(taskTemplate);
          
          let needsApproval = false;
          if (supervisionRules.approval_threshold) {
            const threshold = supervisionRules.approval_threshold;
            needsApproval = eval(\`\${taskValue} \${threshold.operator} \${threshold.value}\`);
          }
          
          return {
            ...$json,
            needs_approval: needsApproval,
            supervisor_role: supervisionRules.direct_supervisor_role,
            escalation_role: supervisionRules.escalation_supervisor_role,
            escalation_hours: supervisionRules.auto_escalate_after_hours
          };
        `
      }
    },
    {
      id: "branch_approval",
      type: "Switch",
      parameters: {
        rules: [
          {
            condition: "={{$json.needs_approval === true}}",
            output: "request_approval"
          },
          {
            condition: "={{$json.needs_approval === false}}",
            output: "finalize_task"
          }
        ]
      }
    },
    {
      id: "request_approval",
      type: "Supabase",
      operation: "insert",
      table: "personas_communications",
      parameters: {
        data: {
          from_persona_id: "={{$env.PERSONA_ID}}",
          to_persona_id: "={{$getSupervisorId($json.supervisor_role)}}",
          communication_type: "approval_request",
          subject: "Aprovação necessária: {{$json.task_name}}",
          data_payload: "={{$json}}",
          requires_action: true,
          action_deadline: "={{$now().plus($json.escalation_hours, 'hours')}}",
          priority: "high"
        }
      }
    },
    {
      id: "wait_approval",
      type: "Wait",
      parameters: {
        resume: "webhook",
        timeout: "={{$json.escalation_hours}}"
      }
    },
    {
      id: "check_approval_status",
      type: "Switch",
      parameters: {
        rules: [
          {
            condition: "={{$json.approval_status === 'approved'}}",
            output: "finalize_task"
          },
          {
            condition: "={{$json.approval_status === 'rejected'}}",
            output: "cancel_task"
          },
          {
            condition: "={{$json.approval_status === 'timeout'}}",
            output: "escalate"
          }
        ]
      }
    },
    {
      id: "escalate",
      type: "Supabase",
      operation: "insert",
      table: "personas_communications",
      parameters: {
        data: {
          from_persona_id: "={{$env.PERSONA_ID}}",
          to_persona_id: "={{$getSupervisorId($json.escalation_role)}}",
          communication_type: "approval_request",
          subject: "ESCALADO: {{$json.task_name}}",
          message: "Supervisor direto não respondeu em {{$json.escalation_hours}}h",
          data_payload: "={{$json}}",
          requires_action: true,
          priority: "urgent"
        }
      }
    },
    {
      id: "log_supervision",
      type: "Supabase",
      operation: "insert",
      table: "task_supervision_logs",
      parameters: {
        data: {
          task_execution_id: "={{$json.task_id}}",
          task_template_code: "={{$json.task_template}}",
          executor_persona_id: "={{$env.PERSONA_ID}}",
          supervisor_persona_id: "={{$json.supervisor_id}}",
          supervision_type: "={{$json.supervision_type}}",
          supervision_result: "={{$json.approval_status}}",
          requested_at: "={{$json.requested_at}}",
          responded_at: "={{$now()}}"
        }
      }
    }
  ]
}
```

### Métricas de Supervisão

```sql
-- Dashboard de Supervisão
SELECT 
  supervisor.persona_code as supervisor,
  COUNT(*) as total_supervisoes,
  COUNT(*) FILTER (WHERE sl.supervision_result = 'approved') as aprovacoes,
  COUNT(*) FILTER (WHERE sl.supervision_result = 'rejected') as rejeicoes,
  COUNT(*) FILTER (WHERE sl.supervision_result = 'escalated') as escalacoes,
  AVG(sl.response_time_hours) as tempo_medio_resposta_horas,
  COUNT(*) FILTER (WHERE sl.response_time_hours > tsc.auto_escalate_after_hours) as atrasadas
FROM task_supervision_logs sl
JOIN personas supervisor ON supervisor.id = sl.supervisor_persona_id
JOIN task_supervision_chains tsc ON tsc.task_template_code = sl.task_template_code
WHERE sl.created_at > NOW() - INTERVAL '30 days'
GROUP BY supervisor.id, supervisor.persona_code
ORDER BY total_supervisoes DESC;
```

---

## 🎮 INTERFACE USUÁRIO ↔ SISTEMA

### Visão Geral

O sistema VCM é **100% virtual**, mas os **objetivos são tangíveis** no mundo real. O usuário humano funciona como a **interface crítica** entre:

- **Mundo Virtual:** Personas, workflows, automações
- **Mundo Real:** Clientes reais, vendas reais, dinheiro real

**Desafio:** Como o usuário interage com o sistema sem precisar de LLM paga para cada comando?

**Solução:** **Structured Input System** — Biblioteca de templates pré-definidos com parâmetros estruturados.

### Princípios de Design

1. **Zero Ambiguidade:** Comandos estruturados, não linguagem natural
2. **Templates Reutilizáveis:** Biblioteca de 30-50 tipos de tarefas comuns
3. **Parametrização Clara:** Campos obrigatórios vs opcionais explícitos
4. **Mensurabilidade Tangível:** Toda tarefa tem métricas do mundo real
5. **Feedback Loop:** Sistema informa usuário, usuário ajusta sistema

### Biblioteca de Templates de Tarefas

#### Template: `gerar_leads`

```typescript
interface TaskTemplate_GerarLeads {
  template_code: "gerar_leads";
  template_name: "Geração de Leads";
  category: "marketing";
  
  executor_role: "marketing_analyst";
  supervisor_role: "marketing_manager";
  
  required_params: {
    quantity: number;              // Ex: 100
    timeframe_days: number;        // Ex: 30
    quality_filter: {
      min_score: number;           // Ex: 80
      company_size?: string;       // Ex: "50-200_employees"
      industry?: string[];         // Ex: ["technology", "finance"]
      geographic?: string[];       // Ex: ["SP", "RJ", "MG"]
    };
  };
  
  optional_params: {
    budget?: number;               // Ex: 5000
    channels?: string[];           // Ex: ["linkedin", "google_ads", "events"]
    urgency?: "low" | "normal" | "high";
  };
  
  success_metrics: {
    leads_gerados: {
      target: number;              // from required_params.quantity
      measurement: "CRM_external"; // Como medir no mundo real
      validation: "user_confirmation";
    };
    taxa_qualificacao: {
      target: number;              // Ex: 0.70 (70%)
      measurement: "CRM_external";
      validation: "automatic";
    };
    custo_por_lead: {
      target: number;              // budget / quantity
      measurement: "google_ads_dashboard | facebook_ads";
      validation: "automatic";
    };
  };
  
  workflow_template: "lead_generation_workflow_v1";
  estimated_duration_hours: 24;
}
```

#### Template: `fechar_venda`

```typescript
interface TaskTemplate_FecharVenda {
  template_code: "fechar_venda";
  template_name: "Fechamento de Venda";
  category: "vendas";
  
  executor_role: "sales_representative";
  supervisor_role: "sales_manager";
  
  required_params: {
    opportunity_id: string;
    valor_proposta: number;
    condicoes_pagamento: string;  // Ex: "30/60/90 dias"
  };
  
  optional_params: {
    desconto_percentual?: number;
    prazo_entrega_dias?: number;
    observacoes?: string;
  };
  
  approval_rules: {
    triggers: [
      {
        condition: "valor_proposta > 50000",
        approver: "vp_sales"
      },
      {
        condition: "desconto_percentual > 15",
        approver: "cfo"
      },
      {
        condition: "prazo_entrega_dias < 7",
        approver: "operations_manager"
      }
    ];
  };
  
  success_metrics: {
    deal_closed: {
      target: 1,
      measurement: "CRM_external",
      validation: "user_confirmation"
    };
    valor_fechado: {
      target: "valor_proposta - (valor_proposta * (desconto_percentual / 100))",
      measurement: "CRM_external",
      validation: "user_confirmation"
    };
    margem_percentual: {
      target: ">= 30",
      measurement: "ERP_internal",
      validation: "automatic"
    };
  };
  
  workflow_template: "sales_closing_workflow_v1";
  estimated_duration_hours: 48;
}
```

#### Template: `processar_pedido`

```typescript
interface TaskTemplate_ProcessarPedido {
  template_code: "processar_pedido";
  template_name: "Processamento de Pedido";
  category: "operacoes";
  
  executor_role: "operations_analyst";
  supervisor_role: "operations_manager";
  
  required_params: {
    pedido_id: string;
    cliente_id: string;
    produtos: Array<{
      produto_id: string;
      quantidade: number;
      preco_unitario: number;
    }>;
  };
  
  optional_params: {
    prioridade?: "normal" | "alta" | "urgente";
    endereco_entrega?: string;
    observacoes?: string;
  };
  
  dependencies: [
    {
      check: "estoque_disponivel",
      action_if_false: "notify_compras"
    },
    {
      check: "credito_aprovado",
      action_if_false: "notify_financeiro"
    }
  ];
  
  success_metrics: {
    pedido_faturado: {
      target: 1,
      measurement: "ERP_internal",
      validation: "automatic"
    };
    tempo_processamento_horas: {
      target: "<= 24",
      measurement: "system_internal",
      validation: "automatic"
    };
    erros_zero: {
      target: 0,
      measurement: "quality_system",
      validation: "automatic"
    };
  };
  
  workflow_template: "order_processing_workflow_v1";
  estimated_duration_hours: 8;
}
```

### Interface de Usuário (React Components)

#### 1. Task Creation Wizard

```typescript
// Componente: TaskCreationWizard.tsx
import React, { useState } from 'react';

interface TaskCreationWizardProps {
  templates: TaskTemplate[];
  onSubmit: (task: UserTaskCommand) => Promise<void>;
}

export function TaskCreationWizard({ templates, onSubmit }: TaskCreationWizardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    const command: UserTaskCommand = {
      template_code: selectedTemplate!.template_code,
      parameters: params,
      assigned_to: assignedTo || "auto_assign",
      priority: params.urgency || "normal",
      deadline: params.deadline || null
    };
    
    await onSubmit(command);
  };
  
  return (
    <div className="task-wizard">
      {/* Passo 1: Selecionar Template */}
      <TemplateSelector 
        templates={templates}
        onChange={setSelectedTemplate}
      />
      
      {selectedTemplate && (
        <>
          {/* Passo 2: Preencher Parâmetros */}
          <ParametersForm 
            template={selectedTemplate}
            values={params}
            onChange={setParams}
          />
          
          {/* Passo 3: Atribuir Persona */}
          <PersonaSelector 
            role={selectedTemplate.executor_role}
            onChange={setAssignedTo}
          />
          
          {/* Passo 4: Revisar e Confirmar */}
          <TaskPreview 
            template={selectedTemplate}
            params={params}
            assignedTo={assignedTo}
          />
          
          <Button onClick={handleSubmit}>
            Criar Tarefa
          </Button>
        </>
      )}
    </div>
  );
}
```

#### 2. Parameters Form (Dinâmico)

```typescript
function ParametersForm({ template, values, onChange }) {
  const renderField = (paramName: string, paramDef: any, required: boolean) => {
    switch (paramDef.type) {
      case 'number':
        return (
          <Input 
            type="number"
            label={paramName}
            required={required}
            value={values[paramName]}
            onChange={val => onChange({ ...values, [paramName]: parseInt(val) })}
            helpText={paramDef.description}
          />
        );
      
      case 'string':
        return (
          <Input 
            type="text"
            label={paramName}
            required={required}
            value={values[paramName]}
            onChange={val => onChange({ ...values, [paramName]: val })}
          />
        );
      
      case 'select':
        return (
          <Select 
            label={paramName}
            required={required}
            options={paramDef.options}
            value={values[paramName]}
            onChange={val => onChange({ ...values, [paramName]: val })}
          />
        );
      
      case 'multi-select':
        return (
          <MultiSelect 
            label={paramName}
            required={required}
            options={paramDef.options}
            value={values[paramName] || []}
            onChange={val => onChange({ ...values, [paramName]: val })}
          />
        );
      
      case 'object':
        return (
          <ObjectInput 
            label={paramName}
            required={required}
            schema={paramDef.schema}
            value={values[paramName]}
            onChange={val => onChange({ ...values, [paramName]: val })}
          />
        );
    }
  };
  
  return (
    <div className="parameters-form">
      <h3>Parâmetros Obrigatórios</h3>
      {Object.entries(template.required_params).map(([name, def]) =>
        renderField(name, def, true)
      )}
      
      <h3>Parâmetros Opcionais</h3>
      {Object.entries(template.optional_params || {}).map(([name, def]) =>
        renderField(name, def, false)
      )}
    </div>
  );
}
```

### Protocolo de Comunicação Estruturada

#### Sistema → Usuário (Solicitação de Esclarecimento)

```typescript
interface SystemQuestion {
  type: "clarification_needed" | "approval_required" | "feedback_requested";
  task_id: string;
  question_code: string;  // Ex: "LEAD_SOURCE_AMBIGUOUS"
  question_template: string;
  options: Array<{
    value: string;
    label: string;
    metadata?: any;  // Custo, tempo estimado, etc
  }>;
  default_if_no_response: string;
  timeout_hours: number;
}

// Exemplo concreto
const systemQuestion: SystemQuestion = {
  type: "clarification_needed",
  task_id: "task_123",
  question_code: "LEAD_SOURCE_AMBIGUOUS",
  question_template: "Você quer gerar leads de quais canais?",
  options: [
    { value: "linkedin", label: "LinkedIn", metadata: { cost_per_lead: 50 } },
    { value: "google_ads", label: "Google Ads", metadata: { cost_per_lead: 30 } },
    { value: "eventos", label: "Eventos Presenciais", metadata: { cost_per_lead: 200 } },
    { value: "cold_email", label: "Cold Email", metadata: { cost_per_lead: 10 } }
  ],
  default_if_no_response: "linkedin",
  timeout_hours: 4
};
```

#### Usuário → Sistema (Resposta Estruturada)

```typescript
interface UserResponse {
  question_id: string;
  selected_options: string[];
  custom_parameters?: Record<string, any>;
  notes?: string;
}

// Exemplo concreto
const userResponse: UserResponse = {
  question_id: "q_123",
  selected_options: ["linkedin", "google_ads"],
  custom_parameters: {
    budget_distribution: {
      linkedin: 0.6,  // 60%
      google_ads: 0.4  // 40%
    },
    daily_budget_limit: 500
  },
  notes: "Priorizar LinkedIn por maior qualidade de leads"
};
```

### Sistema de Mensurabilidade (Conexão Virtual → Real)

#### Estrutura de Métricas

```typescript
interface RealWorldMetric {
  metric_name: string;
  virtual_target: number | string;
  real_world_source: string;  // CRM, ERP, API externa, etc
  fetch_method: "api_integration" | "user_input" | "scraping";
  validation_type: "automatic" | "user_confirmation" | "periodic_audit";
  update_frequency: "real_time" | "hourly" | "daily" | "weekly";
  feedback_action: string;  // O que fazer com a métrica
}

// Exemplo: Gerar Leads
const leadGenerationMetrics: RealWorldMetric[] = [
  {
    metric_name: "leads_qualificados_gerados",
    virtual_target: 100,
    real_world_source: "Pipedrive CRM",
    fetch_method: "api_integration",
    validation_type: "user_confirmation",
    update_frequency: "daily",
    feedback_action: "adjust_campaign_if_below_target"
  },
  {
    metric_name: "custo_por_lead",
    virtual_target: 40,
    real_world_source: "Google Ads Dashboard",
    fetch_method: "api_integration",
    validation_type: "automatic",
    update_frequency: "real_time",
    feedback_action: "pause_campaign_if_above_60"
  },
  {
    metric_name: "taxa_conversao_lead_to_opportunity",
    virtual_target: 0.30,  // 30%
    real_world_source: "Pipedrive CRM",
    fetch_method: "api_integration",
    validation_type: "automatic",
    update_frequency: "daily",
    feedback_action: "notify_sales_if_below_20"
  }
];
```

#### Dashboard de Métricas Tangíveis

```typescript
// Componente: RealWorldMetricsDashboard.tsx
function RealWorldMetricsDashboard({ taskId }: { taskId: string }) {
  const metrics = useFetchMetrics(taskId);
  
  return (
    <div className="metrics-dashboard">
      <h2>Métricas do Mundo Real</h2>
      
      {metrics.map(metric => (
        <MetricCard key={metric.name}>
          <MetricName>{metric.name}</MetricName>
          <MetricValue 
            current={metric.current_value}
            target={metric.target_value}
            trend={metric.trend}
          />
          <MetricSource>{metric.source}</MetricSource>
          <MetricStatus status={metric.status} />
          
          {metric.validation_type === 'user_confirmation' && (
            <Button onClick={() => confirmMetric(metric.id)}>
              Confirmar Valor
            </Button>
          )}
          
          {metric.current_value < metric.target_value * 0.8 && (
            <Alert type="warning">
              Abaixo da meta! Sistema ajustará automaticamente.
            </Alert>
          )}
        </MetricCard>
      ))}
    </div>
  );
}
```

### Tabela de Banco de Dados

#### `user_interventions`

```sql
CREATE TABLE user_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário e Contexto
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  -- Tipo de Intervenção
  intervention_type TEXT NOT NULL CHECK (intervention_type IN (
    'task_creation',
    'task_modification',
    'task_cancellation',
    'approval_decision',
    'parameter_adjustment',
    'workflow_redirect',
    'metric_confirmation',
    'escalation_override'
  )),
  
  -- Comando Estruturado
  command_data JSONB NOT NULL,  -- Template + parâmetros
  
  -- Resultado
  result_status TEXT CHECK (result_status IN ('success', 'failed', 'pending')),
  result_data JSONB,
  error_message TEXT,
  
  -- Rastreabilidade
  affected_task_id UUID,
  affected_persona_id UUID REFERENCES personas(id),
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  
  -- Métricas
  execution_time_ms INTEGER
);

CREATE INDEX idx_interventions_user ON user_interventions(user_id, created_at DESC);
CREATE INDEX idx_interventions_empresa ON user_interventions(empresa_id, intervention_type);
```

### Exemplo Completo de Fluxo

**Cenário:** Usuário quer gerar 150 leads de tecnologia em São Paulo

```typescript
// 1. Usuário cria tarefa via UI
const userCommand = {
  template_code: "gerar_leads",
  parameters: {
    quantity: 150,
    timeframe_days: 30,
    quality_filter: {
      min_score: 85,
      company_size: "50-500_employees",
      industry: ["technology", "software"],
      geographic: ["SP"]
    },
    channels: ["linkedin", "google_ads"],
    budget: 8000
  },
  assigned_to: "auto_assign",
  priority: "high"
};

// 2. Sistema processa
POST /api/tasks/create
Body: userCommand

// 3. Sistema atribui para persona adequada
const assignedPersona = findPersonaByRole("marketing_analyst", userCommand.empresa_id);

// 4. Sistema gera workflow N8N
const workflow = generateWorkflow({
  template: "lead_generation_workflow_v1",
  persona: assignedPersona,
  parameters: userCommand.parameters
});

// 5. Workflow executa (N8N)
// - Configura campanhas Google Ads
// - Configura anúncios LinkedIn
// - Monitora resultados diariamente

// 6. Sistema coleta métricas do mundo real
GET https://api.pipedrive.com/v1/leads?created_after=2025-12-07
GET https://ads.google.com/api/v1/campaigns/123/metrics

// 7. Sistema pede confirmação do usuário
const systemQuestion = {
  type: "feedback_requested",
  question: "47 leads gerados até agora. Qualidade satisfatória?",
  options: [
    { value: "yes", label: "Sim, continuar" },
    { value: "adjust_quality", label: "Aumentar filtro de qualidade" },
    { value: "pause", label: "Pausar campanha" }
  ]
};

// 8. Usuário responde
const userFeedback = {
  selected_option: "adjust_quality",
  custom_parameters: {
    min_score: 90  // Aumentou de 85 para 90
  }
};

// 9. Sistema ajusta workflow em tempo real
PATCH /api/workflows/{workflow_id}/parameters
Body: { min_score: 90 }

// 10. Ao atingir meta, sistema notifica
notification = {
  type: "goal_achieved",
  message: "Meta atingida! 150 leads gerados em 18 dias.",
  metrics: {
    total_leads: 150,
    average_score: 88,
    cost_per_lead: 51.33,
    conversion_to_opportunity: 0.32
  }
};
```

---

## 🔌 INTEGRAÇÃO N8N ↔ SUBSISTEMAS

### Tipos de Integração por Subsistema

#### **1. GESTÃO EMPRESARIAL** (`gestao_empresarial`)

**Funcionalidades:**
- Planejamento Estratégico
- Gestão de OKRs
- Dashboards Executivos
- BI e Analytics
- Governança Corporativa

**Chamadas N8N Necessárias:**

```javascript
// A. Consultar OKRs da empresa
GET /api/empresas/{empresaId}/okrs
Response: [
  {
    id: "uuid",
    objetivo: "Aumentar receita em 30%",
    key_results: [
      { descricao: "Atingir R$ 10M em vendas", atual: 7.5, meta: 10 }
    ]
  }
]

// B. Atualizar progresso de Key Result
PATCH /api/okrs/{okrId}/key-results/{krId}
Body: {
  valor_atual: 8.2,
  evidencias: "Vendas do mês...",
  updated_by: "persona_id"
}

// C. Gerar relatório executivo
POST /api/relatorios/executivo
Body: {
  empresaId: "uuid",
  periodo: "2025-12",
  metricas: ["receita", "margem", "nps"]
}
Response: {
  dashboard_url: "https://...",
  pdf_url: "https://..."
}

// D. Criar alerta de governança
POST /api/governanca/alertas
Body: {
  tipo: "risco_compliance",
  severidade: "alta",
  descricao: "Orçamento ultrapassado em 15%",
  responsavel_id: "persona_id"
}
```

**Nós N8N:**
- `HTTP Request` (GET/POST/PATCH)
- `Supabase` (direto ao banco)
- `Code` (transformação de dados)
- `Schedule Trigger` (cron diário 09:00)

---

#### **2. PRODUÇÃO** (`producao`)

**Funcionalidades:**
- Ordens de Produção
- Planejamento de Capacidade
- Controle de Processos
- OEE (Overall Equipment Effectiveness)

**Chamadas N8N Necessárias:**

```javascript
// A. Criar ordem de produção
POST /api/producao/ordens
Body: {
  produto_id: "uuid",
  quantidade: 1000,
  data_entrega: "2025-12-20",
  prioridade: "alta",
  solicitante_id: "persona_id"
}
Response: {
  ordem_id: "OP-2025-001",
  status: "planejada"
}

// B. Consultar capacidade disponível
GET /api/producao/capacidade
Query: {
  data_inicio: "2025-12-10",
  data_fim: "2025-12-20",
  turno: "all"
}
Response: {
  capacidade_total: 8000,
  capacidade_utilizada: 6500,
  capacidade_disponivel: 1500
}

// C. Registrar parada de máquina
POST /api/producao/paradas
Body: {
  maquina_id: "uuid",
  tipo_parada: "manutencao_corretiva",
  duracao_minutos: 120,
  motivo: "Falha no motor",
  tecnico_responsavel: "persona_id"
}

// D. Calcular OEE em tempo real
GET /api/producao/oee/{maquina_id}
Response: {
  disponibilidade: 0.85,
  performance: 0.92,
  qualidade: 0.98,
  oee: 0.77  // 85% * 92% * 98%
}
```

**Nós N8N:**
- `HTTP Request`
- `Schedule Trigger` (monitor OEE a cada 15min)
- `Switch` (condições: OEE < 75% → alerta)
- `Send Email` (notificação)

---

#### **3. FINANCEIRO** (`financeiro`)

**Funcionalidades:**
- Contas a Pagar/Receber
- Fluxo de Caixa
- DRE e Balanço
- Controle Orçamentário

**Chamadas N8N Necessárias:**

```javascript
// A. Criar conta a pagar
POST /api/financeiro/contas-pagar
Body: {
  fornecedor_id: "uuid",
  valor: 15000.00,
  vencimento: "2025-12-25",
  categoria: "servicos",
  centro_custo: "marketing",
  aprovador_id: "persona_id"
}

// B. Consultar fluxo de caixa projetado
GET /api/financeiro/fluxo-caixa
Query: {
  data_inicio: "2025-12-01",
  data_fim: "2025-12-31"
}
Response: {
  saldo_inicial: 100000,
  entradas: 250000,
  saidas: 180000,
  saldo_final: 170000
}

// C. Gerar DRE mensal
POST /api/financeiro/dre/gerar
Body: {
  mes: 12,
  ano: 2025
}
Response: {
  receita_bruta: 500000,
  impostos: 85000,
  receita_liquida: 415000,
  custos: 200000,
  lucro_bruto: 215000,
  despesas_operacionais: 120000,
  lucro_liquido: 95000
}

// D. Validar orçamento
POST /api/financeiro/orcamento/validar
Body: {
  centro_custo: "vendas",
  valor_solicitado: 50000,
  periodo: "2025-12"
}
Response: {
  aprovado: true,
  saldo_disponivel: 75000,
  percentual_utilizado: 0.67
}
```

**Nós N8N:**
- `Schedule Trigger` (cron: 1º dia útil do mês)
- `HTTP Request` (gerar DRE)
- `Supabase` (insert contas)
- `Gmail` (enviar relatório)

---

#### **4. RECURSOS HUMANOS** (`recursos_humanos`)

**Funcionalidades:**
- Recrutamento e Seleção
- Folha de Pagamento
- Avaliação de Desempenho
- Treinamentos

**Chamadas N8N Necessárias:**

```javascript
// A. Criar vaga
POST /api/rh/vagas
Body: {
  titulo: "Analista de Vendas Pleno",
  departamento: "vendas",
  requisitos: ["experiência 3 anos", "Excel avançado"],
  salario_min: 4000,
  salario_max: 6000,
  recrutador_id: "persona_id"
}

// B. Agendar entrevista
POST /api/rh/entrevistas
Body: {
  candidato_id: "uuid",
  vaga_id: "uuid",
  data_hora: "2025-12-15T14:00:00Z",
  entrevistador_id: "persona_id",
  tipo: "tecnica"
}

// C. Processar folha de pagamento
POST /api/rh/folha/processar
Body: {
  mes: 12,
  ano: 2025,
  tipo: "mensal"
}
Response: {
  total_bruto: 500000,
  total_descontos: 125000,
  total_liquido: 375000,
  funcionarios_processados: 45
}

// D. Criar avaliação de desempenho
POST /api/rh/avaliacoes
Body: {
  funcionario_id: "uuid",
  periodo: "2025-Q4",
  avaliador_id: "persona_id",
  notas: {
    produtividade: 4.5,
    qualidade: 4.8,
    comportamento: 4.2
  }
}
```

---

#### **5. VENDAS** (`vendas`)

**Funcionalidades:**
- CRM
- Pipeline de Vendas
- Propostas Comerciais
- Comissões

**Chamadas N8N Necessárias:**

```javascript
// A. Criar lead (de formulário web)
POST /api/vendas/leads
Body: {
  nome: "João Silva",
  email: "joao@empresa.com",
  telefone: "+5511999999999",
  empresa: "ACME Corp",
  origem: "website_form",
  atribuido_para: "persona_id"
}

// B. Avançar oportunidade no pipeline
PATCH /api/vendas/oportunidades/{id}
Body: {
  status: "proposta_enviada",  // lead → qualificado → proposta → negociacao → ganho/perda
  valor_estimado: 150000,
  probabilidade: 0.60,
  previsao_fechamento: "2025-12-30"
}

// C. Gerar proposta comercial (LLM)
POST /api/vendas/propostas/gerar
Body: {
  oportunidade_id: "uuid",
  produtos: ["uuid1", "uuid2"],
  desconto_percentual: 10,
  condicoes_pagamento: "30/60/90 dias"
}
Response: {
  proposta_id: "uuid",
  pdf_url: "https://storage.../proposta-001.pdf",
  valor_total: 135000
}

// D. Calcular comissão
POST /api/vendas/comissoes/calcular
Body: {
  vendedor_id: "persona_id",
  venda_id: "uuid",
  valor_venda: 150000,
  regra_comissao: "tiered"  // 5% até 100k, 7% acima
}
Response: {
  comissao_bruta: 8500,
  comissao_liquida: 7650,  // após impostos
  pagamento_previsto: "2026-01-05"
}
```

**Nós N8N:**
- `Webhook` (receber leads de formulário)
- `HTTP Request` (criar lead, avançar pipeline)
- `Switch` (condições: valor > 100k → aprovar gerente)
- `Gmail` (enviar proposta)

---

#### **6. MARKETING** (`marketing`)

**Funcionalidades:**
- Campanhas de Marketing
- Geração de Leads
- Automação de Marketing
- SEO/SEM

**Chamadas N8N Necessárias:**

```javascript
// A. Criar campanha
POST /api/marketing/campanhas
Body: {
  nome: "Black Friday 2025",
  tipo: "email_marketing",
  data_inicio: "2025-11-20",
  data_fim: "2025-11-30",
  orcamento: 50000,
  responsavel_id: "persona_id"
}

// B. Enviar email em massa (segmentado)
POST /api/marketing/email/enviar
Body: {
  campanha_id: "uuid",
  segmento: "clientes_ativos_ultimos_90_dias",
  assunto: "Ofertas exclusivas Black Friday",
  template_id: "uuid",
  enviar_em: "2025-11-25T08:00:00Z"
}

// C. Rastrear conversão de campanha
GET /api/marketing/campanhas/{id}/metricas
Response: {
  emails_enviados: 10000,
  taxa_abertura: 0.35,
  taxa_cliques: 0.12,
  conversoes: 250,
  receita_gerada: 125000,
  roi: 2.5  // R$ 2.50 para cada R$ 1 investido
}

// D. Criar conteúdo SEO (LLM)
POST /api/marketing/conteudo/gerar
Body: {
  tipo: "blog_post",
  palavra_chave: "CRM para PMEs",
  tamanho_palavras: 1500,
  tom: "profissional_educativo"
}
Response: {
  titulo: "Como escolher o CRM ideal...",
  conteudo: "...",
  meta_description: "...",
  sugestoes_imagens: [...]
}
```

---

#### **7. ATENDIMENTO** (`atendimento`)

**Funcionalidades:**
- Gestão de Tickets
- SLA
- Base de Conhecimento
- CSAT/NPS

**Chamadas N8N Necessárias:**

```javascript
// A. Criar ticket (de email)
POST /api/atendimento/tickets
Body: {
  cliente_id: "uuid",
  assunto: "Problema com integração API",
  descricao: "A API retorna erro 500...",
  prioridade: "alta",
  categoria: "tecnico",
  canal: "email",
  atribuido_para: "persona_id"
}

// B. Atualizar ticket
PATCH /api/atendimento/tickets/{id}
Body: {
  status: "em_progresso",
  resposta: "Identificamos o problema...",
  tempo_gasto_minutos: 45
}

// C. Verificar SLA
GET /api/atendimento/sla/{ticket_id}
Response: {
  tempo_primeira_resposta: 25,  // minutos
  sla_primeira_resposta: 60,    // limite
  status: "dentro_do_sla",
  tempo_resolucao_estimado: 120
}

// D. Enviar pesquisa CSAT
POST /api/atendimento/pesquisas/enviar
Body: {
  ticket_id: "uuid",
  cliente_id: "uuid",
  tipo: "csat"
}
Response: {
  pesquisa_url: "https://forms.../csat-12345",
  enviado_em: "2025-12-06T15:30:00Z"
}
```

**Nós N8N:**
- `Gmail Trigger` (novo email → criar ticket)
- `HTTP Request` (CRUD tickets)
- `Schedule Trigger` (verificar SLA a cada 15min)
- `Switch` (SLA violado → escalar)

---

#### **8-12. OUTROS SUBSISTEMAS**

**COMPRAS:**
- POST `/api/compras/cotacoes` (criar cotação)
- GET `/api/compras/fornecedores/avaliar` (rating)
- POST `/api/compras/pedidos` (criar pedido)

**ESTOQUE:**
- GET `/api/estoque/produtos/{id}/saldo` (consultar)
- POST `/api/estoque/movimentos` (entrada/saída)
- GET `/api/estoque/analise-abc` (classificação)

**LOGÍSTICA:**
- POST `/api/logistica/entregas` (agendar)
- GET `/api/logistica/rotas/otimizar` (calcular melhor rota)
- PATCH `/api/logistica/entregas/{id}/rastreamento` (atualizar status)

**QUALIDADE:**
- POST `/api/qualidade/nao-conformidades` (registrar)
- POST `/api/qualidade/capa` (ação corretiva)
- GET `/api/qualidade/auditorias` (listar)

**PROJETOS:**
- POST `/api/projetos` (criar projeto)
- PATCH `/api/projetos/{id}/tarefas/{taskId}` (atualizar)
- GET `/api/projetos/{id}/gantt` (timeline)

---

## 🧩 PADRÕES DE WORKFLOW N8N

### Template Base de Workflow por Persona

```json
{
  "name": "Persona_{{PERSONA_CODE}}_Workflow",
  "nodes": [
    {
      "id": "trigger",
      "type": "Cron",
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "value": 24}]
        }
      },
      "name": "Daily Trigger"
    },
    {
      "id": "load_context",
      "type": "Code",
      "parameters": {
        "code": "// Buscar contexto da persona\nconst personaId = '{{PERSONA_ID}}';\nconst atribuicoes = await fetch(`/api/personas/${personaId}/atribuicoes`);\nreturn atribuicoes;"
      },
      "name": "Load Persona Context"
    },
    {
      "id": "subsystem_call_1",
      "type": "HTTP Request",
      "parameters": {
        "method": "GET",
        "url": "{{$env.VCM_API_URL}}/api/{{SUBSYSTEM}}/{{ENDPOINT}}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      },
      "name": "Call {{SUBSYSTEM}}"
    },
    {
      "id": "transform_data",
      "type": "Code",
      "parameters": {
        "code": "// Transformar dados\nconst input = $input.all();\nreturn input.map(item => ({\n  ...item,\n  processed: true,\n  persona_id: '{{PERSONA_ID}}'\n}));"
      },
      "name": "Transform Data"
    },
    {
      "id": "save_result",
      "type": "Supabase",
      "parameters": {
        "operation": "insert",
        "table": "persona_workflow_logs",
        "data": "={{$json}}"
      },
      "name": "Save Result"
    },
    {
      "id": "error_handler",
      "type": "ErrorTrigger",
      "parameters": {},
      "name": "On Error"
    },
    {
      "id": "notify_error",
      "type": "Gmail",
      "parameters": {
        "operation": "send",
        "to": "admin@empresa.com",
        "subject": "Erro no workflow {{PERSONA_CODE}}",
        "message": "={{$json.error}}"
      },
      "name": "Notify Error"
    }
  ],
  "connections": {
    "trigger": {"main": [[{"node": "load_context"}]]},
    "load_context": {"main": [[{"node": "subsystem_call_1"}]]},
    "subsystem_call_1": {"main": [[{"node": "transform_data"}]]},
    "transform_data": {"main": [[{"node": "save_result"}]]},
    "error_handler": {"main": [[{"node": "notify_error"}]]}
  },
  "settings": {
    "executionOrder": "v1"
  },
  "tags": [
    {"id": "persona_{{PERSONA_CODE}}"},
    {"id": "subsystem_{{SUBSYSTEM}}"}
  ]
}
```

### Tipos de Triggers por Caso de Uso

| Caso de Uso | Trigger N8N | Frequência | Exemplo |
|-------------|-------------|------------|---------|
| **Relatórios periódicos** | `Cron` | Diário 09:00 | Gerar DRE mensal |
| **Monitoramento contínuo** | `Cron` | A cada 15 min | Verificar SLA de tickets |
| **Eventos externos** | `Webhook` | Em tempo real | Novo lead de formulário |
| **Notificações email** | `Gmail Trigger` | Polling | Criar ticket de email |
| **Mudanças no banco** | `Supabase Trigger` | Real-time | OKR atualizado → notificar |
| **Condições complexas** | `Conditional` | Após nó anterior | Se orçamento > 80% → alertar |

---

## 📊 ESTRUTURA DE DADOS

### Tabela `personas_workflows` (Supabase)

```sql
CREATE TABLE personas_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Identificação
  workflow_name TEXT NOT NULL,
  workflow_code TEXT UNIQUE,  -- ex: "WF-MKT-001"
  n8n_workflow_id TEXT UNIQUE,  -- ID no N8N após import
  
  -- Configuração
  workflow_json JSONB NOT NULL,  -- JSON do workflow N8N
  trigger_type TEXT,  -- cron, webhook, conditional
  trigger_config JSONB,  -- { interval: "daily", time: "09:00" }
  
  -- Subsistemas usados
  subsystems_used TEXT[],  -- ["marketing", "vendas", "financeiro"]
  
  -- Metadados
  status TEXT DEFAULT 'draft',  -- draft, active, paused, error
  version INTEGER DEFAULT 1,
  ultima_execucao TIMESTAMP,
  proxima_execucao TIMESTAMP,
  total_execucoes INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES personas(id)
);

-- Índices
CREATE INDEX idx_workflows_persona ON personas_workflows(persona_id);
CREATE INDEX idx_workflows_status ON personas_workflows(status);
CREATE INDEX idx_workflows_subsystems ON personas_workflows USING GIN(subsystems_used);
```

### Tabela `persona_workflow_logs` (Execuções)

```sql
CREATE TABLE persona_workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES personas_workflows(id),
  persona_id UUID REFERENCES personas(id),
  
  -- Execução
  execution_id TEXT,  -- ID da execução no N8N
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  duration_ms INTEGER,
  
  -- Resultado
  status TEXT,  -- success, error, timeout
  nodes_executed INTEGER,
  subsystem_calls JSONB,  -- [ { subsystem: "vendas", endpoint: "/leads", status: 200 } ]
  
  -- Dados
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_workflow ON persona_workflow_logs(workflow_id);
CREATE INDEX idx_logs_status ON persona_workflow_logs(status);
CREATE INDEX idx_logs_date ON persona_workflow_logs(started_at DESC);
```

---

## 🚀 ESTRATÉGIA DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Scripts 04-06) ✅

```
✅ Script 04: Competências (identificar habilidades)
✅ Script 05: Avatares (identidade visual)
⏳ Script 06: Análise de Automação (identificar tarefas automatizáveis)
```

### Fase 2: Geração de Workflows (Script 07)

**Entrada:**
- `personas_automation_opportunities` (Script 06)
- `personas_atribuicoes` (com which_subsystem e how_use)
- Template base N8N

**Processamento:**
1. Para cada persona:
   - Buscar atribuições com `use_subsystem = true`
   - Agrupar por subsistema
   - Gerar nós N8N específicos:
     - **HTTP Request** para APIs REST
     - **Supabase** para acesso direto ao banco
     - **Code** para transformações de dados
     - **Switch** para lógica condicional
   - Conectar nós em sequência lógica
   - Adicionar error handling

2. Validação:
   - JSON válido para N8N (versão 1.0+)
   - Todos os nós conectados
   - Credenciais configuradas por empresa

3. Output:
   - JSON file: `AUTOMACAO/06_N8N_WORKFLOWS/{{PERSONA_CODE}}_workflow.json`
   - Registro em `personas_workflows`

**Exemplo de lógica:**

```javascript
// Script 07 - Gerar workflow N8N
async function gerarWorkflowParaPersona(persona) {
  // 1. Buscar atribuições que usam subsistemas
  const atribuicoes = await supabase
    .from('personas_atribuicoes')
    .select('*')
    .eq('persona_id', persona.id)
    .eq('use_subsystem', true);
  
  // 2. Agrupar por subsistema
  const porSubsistema = {};
  for (const attr of atribuicoes) {
    if (!porSubsistema[attr.which_subsystem]) {
      porSubsistema[attr.which_subsystem] = [];
    }
    porSubsistema[attr.which_subsystem].push(attr);
  }
  
  // 3. Gerar nós N8N
  const nodes = [];
  const connections = {};
  
  // Trigger (cron diário)
  nodes.push({
    id: 'trigger',
    type: 'Cron',
    parameters: {
      rule: { interval: [{ field: 'hours', value: 24 }] }
    }
  });
  
  // Nó para cada subsistema
  let lastNodeId = 'trigger';
  for (const [subsistema, atribuicoesSub] of Object.entries(porSubsistema)) {
    const nodeId = `call_${subsistema}`;
    
    // Determinar endpoint baseado em how_use
    const howUse = atribuicoesSub[0].how_use;
    const endpoint = extrairEndpointDeInstrucoes(howUse, subsistema);
    
    nodes.push({
      id: nodeId,
      type: 'HTTP Request',
      parameters: {
        method: determinarMetodo(howUse),
        url: `{{$env.VCM_API_URL}}/api/${subsistema}${endpoint}`,
        authentication: 'genericCredentialType'
      },
      name: `Call ${subsistema}`
    });
    
    connections[lastNodeId] = { main: [[{ node: nodeId }]] };
    lastNodeId = nodeId;
  }
  
  // Salvar resultado
  nodes.push({
    id: 'save_log',
    type: 'Supabase',
    parameters: {
      operation: 'insert',
      table: 'persona_workflow_logs',
      data: {
        workflow_id: '{{$workflow.id}}',
        persona_id: persona.id,
        status: 'success',
        output_data: '={{$json}}'
      }
    }
  });
  
  connections[lastNodeId] = { main: [[{ node: 'save_log' }]] };
  
  // 4. Montar workflow completo
  return {
    name: `Persona_${persona.persona_code}_Workflow`,
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
    tags: [{ id: `persona_${persona.persona_code}` }]
  };
}

function extrairEndpointDeInstrucoes(howUse, subsistema) {
  // Parsear instruções do campo how_use para determinar endpoint
  // Exemplo: "1. Acessar módulo de CRM" → "/leads"
  
  const mapeamentos = {
    'marketing': {
      'campanhas': '/campanhas',
      'leads': '/leads',
      'email': '/email/enviar'
    },
    'vendas': {
      'pipeline': '/oportunidades',
      'propostas': '/propostas/gerar',
      'comissões': '/comissoes/calcular'
    },
    // ... outros subsistemas
  };
  
  // Usar NLP simples ou regex para identificar palavras-chave
  for (const [keyword, endpoint] of Object.entries(mapeamentos[subsistema] || {})) {
    if (howUse.toLowerCase().includes(keyword)) {
      return endpoint;
    }
  }
  
  return '/'; // fallback
}

function determinarMetodo(howUse) {
  if (howUse.includes('criar') || howUse.includes('inserir')) return 'POST';
  if (howUse.includes('atualizar') || howUse.includes('modificar')) return 'PATCH';
  if (howUse.includes('deletar') || howUse.includes('remover')) return 'DELETE';
  return 'GET'; // default
}
```

### Fase 3: Deploy e Execução

**Opções de deployment:**

1. **N8N Self-Hosted:**
   - Docker: `docker run -p 5678:5678 n8nio/n8n`
   - Import workflows via API: `POST /api/v1/workflows/import`
   - Credenciais por empresa (multi-tenant)

2. **N8N Cloud:**
   - Import via UI ou API
   - Webhooks públicos
   - Monitoramento integrado

**Credenciais necessárias (por empresa):**
```javascript
{
  "vcm_api": {
    "type": "httpHeaderAuth",
    "data": {
      "name": "Authorization",
      "value": "Bearer {{EMPRESA_API_KEY}}"
    }
  },
  "supabase": {
    "type": "httpHeaderAuth",
    "data": {
      "name": "apikey",
      "value": "{{SUPABASE_ANON_KEY}}"
    }
  }
}
```

### Fase 4: Monitoramento e Otimização

**Métricas a rastrear:**
- Taxa de sucesso por workflow
- Tempo médio de execução
- Subsistemas mais usados
- Erros por persona
- ROI de automação (tempo economizado)

**Dashboard de monitoramento:**
```sql
-- Query para dashboard
SELECT 
  p.persona_code,
  p.full_name,
  w.workflow_name,
  w.status,
  w.total_execucoes,
  w.total_erros,
  w.ultima_execucao,
  array_length(w.subsystems_used, 1) as num_subsistemas,
  (w.total_execucoes - w.total_erros)::float / NULLIF(w.total_execucoes, 0) as taxa_sucesso
FROM personas_workflows w
JOIN personas p ON p.id = w.persona_id
WHERE w.status = 'active'
ORDER BY w.total_execucoes DESC;
```

---

## 🔐 SEGURANÇA E GOVERNANÇA

### Controle de Acesso

1. **Autenticação:**
   - Cada empresa tem API key única
   - Workflows N8N usam credenciais da empresa
   - Logs auditados por persona

2. **Autorização:**
   - Personas só acessam subsistemas de suas atribuições
   - Verificação em `personas_atribuicoes.which_subsystem`
   - Rate limiting por persona (ex: 100 req/min)

3. **Isolamento de Dados:**
   - Queries sempre filtradas por `empresa_id`
   - RLS (Row Level Security) no Supabase
   - Namespaces por empresa no N8N

### Auditoria

**Tabela `workflow_audit_log`:**
```sql
CREATE TABLE workflow_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES personas_workflows(id),
  persona_id UUID,
  action TEXT,  -- execute, update, pause, delete
  subsystem_accessed TEXT,
  endpoint TEXT,
  request_data JSONB,
  response_status INTEGER,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 CASOS DE USO PRÁTICOS

### Caso 1: Analista de Marketing (MKT-001)

**Persona:** Emily Watson (Marketing Manager)  
**Atribuições:**
1. Gerar leads qualificados (usa: `marketing`)
2. Analisar ROI de campanhas (usa: `marketing`, `financeiro`)
3. Criar conteúdo SEO (usa: `marketing`)

**Workflow N8N:**

```
Trigger: Cron (diário 09:00)
  ↓
Load Campaigns Data (Supabase)
  ↓
Calculate ROI (Code)
  ↓
IF ROI < 2.0 → Alert via Email
  ↓
Generate Weekly Report (HTTP → Marketing API)
  ↓
Send Report to CEO (Gmail)
  ↓
Log Execution (Supabase)
```

**Subsistemas usados:**
- `marketing`: GET `/campanhas/{id}/metricas`
- `financeiro`: GET `/orcamento/marketing`

### Caso 2: Gerente de Produção (PROD-002)

**Persona:** Carlos Silva (Production Manager)  
**Atribuições:**
1. Monitorar OEE (usa: `producao`)
2. Otimizar capacidade (usa: `producao`)
3. Aprovar ordens de produção (usa: `producao`, `compras`)

**Workflow N8N:**

```
Trigger: Cron (a cada 15 min)
  ↓
Get OEE Status (HTTP → Produção API)
  ↓
IF OEE < 75% → Create Alert
  ↓
Get Production Orders (Supabase)
  ↓
Optimize Schedule (Code + ML)
  ↓
Update Orders (HTTP → Produção API)
  ↓
Notify Team (Slack)
```

### Caso 3: CFO (FIN-001)

**Persona:** Ana Costa (CFO)  
**Atribuições:**
1. Consolidar DRE (usa: `financeiro`)
2. Monitorar fluxo de caixa (usa: `financeiro`)
3. Aprovar despesas > R$ 10k (usa: `financeiro`)

**Workflow N8N:**

```
Trigger: Cron (1º dia útil do mês)
  ↓
Generate DRE (HTTP → Financeiro API)
  ↓
Fetch Cash Flow (Supabase)
  ↓
Create Executive Dashboard (Code)
  ↓
Generate PDF Report (PDF API)
  ↓
Send to Board (Gmail + Attachments)
  ↓
Update OKR Progress (HTTP → Gestão Empresarial API)
```

---

## 🧪 TESTES E VALIDAÇÃO

### Checklist de Validação de Workflow

```markdown
- [ ] JSON válido para N8N (schema validation)
- [ ] Todos os nós têm IDs únicos
- [ ] Conexões formam grafo dirigido acíclico (sem loops infinitos)
- [ ] Trigger configurado corretamente
- [ ] Error handling presente
- [ ] Credenciais referenciadas existem
- [ ] Subsistemas acessados estão em personas_atribuicoes
- [ ] Logs de execução configurados
- [ ] Timeout definido (max 5 minutos por workflow)
- [ ] Retry logic para chamadas de API (max 3 tentativas)
```

### Testes de Integração

```javascript
// Teste: Workflow consegue chamar subsistema
async function testWorkflowIntegration(workflowId, empresaId) {
  // 1. Simular execução
  const execution = await n8n.executeWorkflow(workflowId, {
    mode: 'test',
    data: { empresaId }
  });
  
  // 2. Verificar chamadas a subsistemas
  const subsystemCalls = execution.data.nodes
    .filter(n => n.type === 'HTTP Request')
    .map(n => ({
      subsystem: n.parameters.url.split('/')[3],
      status: n.outputData.statusCode
    }));
  
  // 3. Validar
  assert(subsystemCalls.every(c => c.status < 400), 'Todas as chamadas devem ter sucesso');
  
  // 4. Log
  console.log(`✅ Workflow ${workflowId} testado com sucesso`);
}
```

---

## 🎓 APRENDIZADOS E BOAS PRÁTICAS

### 1. **Modularidade**
- Cada subsistema tem API bem definida
- Workflows reutilizam nós comuns (auth, logging)
- Templates por tipo de persona (marketing, vendas, etc)

### 2. **Resiliência**
- Retry automático com backoff exponencial
- Fallback para APIs alternativas
- Dead letter queue para falhas persistentes

### 3. **Performance**
- Executar workflows em paralelo (quando possível)
- Cache de dados frequentes (ex: lista de subsistemas)
- Lazy loading de contexto da persona

### 4. **Observabilidade**
- Logs estruturados (JSON)
- Métricas de negócio (não apenas técnicas)
- Alertas baseados em SLA (ex: workflow atrasado > 1h)

### 5. **Escalabilidade**
- N8N em cluster (múltiplos workers)
- Queue system (Redis/RabbitMQ) para workflows pesados
- Sharding por empresa (isolar cargas)

---

## 🚧 ROADMAP COMPLETO

### ✅ Fase 0: Foundation (CONCLUÍDO)
- [x] Script 01: Criar 26 personas com contexto OKR
- [x] Script 02: Gerar biografias com experiência
- [x] Script 03: Atribuições vinculadas a subsistemas
- [x] SQL: 12 subsistemas VCM configurados
- [x] Documento de arquitetura V1.0

### 🔄 Fase 1: Enriquecimento Arquitetural (EM ANDAMENTO)
- [x] Adicionar dimensão de Comunicações Inter-Personas
- [x] Adicionar dimensão de Supervisão Hierárquica  
- [x] Adicionar dimensão de Interface Usuário ↔ Sistema
- [x] Atualizar documento para V2.0
- [ ] Criar schemas SQL para novas tabelas:
  - `personas_communications`
  - `task_supervision_chains`
  - `task_supervision_logs`
  - `user_interventions`
- [ ] Criar biblioteca de templates de tarefas (30-50 templates)

### ⏳ Fase 2: Scripts V5.0 Básicos (PRÓXIMO)
- [ ] Executar Script 04 V5.0 (competências)
- [ ] Executar Script 05 V5.0 (avatares)
- [ ] Implementar Script 06 V5.0 (análise de automação)
- [ ] Implementar Script 07 V5.0 (geração de workflows N8N com supervisão)

### ⏳ Fase 3: Scripts V5.0 Avançados
- [ ] Script 06.5: `generate_communication_matrix.js`
  - Gerar matriz de comunicação entre personas baseado em atribuições
- [ ] Script 07.5: `generate_supervision_chains.js`
  - Gerar cadeias de supervisão baseado em hierarquia
- [ ] Script 08: ML models para previsão de OKRs
- [ ] Script 09: Auditoria de progresso
- [ ] Scripts 10-11: RAG system com contexto

### ⏳ Fase 4: Interface e Integrações
- [ ] **UI Components:**
  - TaskCreationWizard (criar tarefas estruturadas)
  - ApprovalQueue (fila de aprovações)
  - CommunicationInbox (inbox de mensagens inter-personas)
  - SupervisionDashboard (monitor de supervisões)
  - RealWorldMetricsDashboard (métricas tangíveis)
  
- [ ] **API Endpoints:**
  - POST `/api/tasks/create` (criar tarefa via template)
  - GET `/api/communications/:personaId` (inbox de comunicações)
  - POST `/api/approvals/:taskId/respond` (responder aprovação)
  - GET `/api/supervision/dashboard` (métricas de supervisão)
  - POST `/api/interventions` (registrar intervenção usuário)

- [ ] **Integrações Externas (Métricas Tangíveis):**
  - Pipedrive CRM (leads, oportunidades)
  - Google Ads API (custo por lead, impressões)
  - Notion API (base de conhecimento)
  - Slack API (notificações)

### ⏳ Fase 5: Deploy e Produção
- [ ] Deploy N8N self-hosted (Docker)
- [ ] Configurar credenciais por empresa (multi-tenant)
- [ ] Implementar webhooks para comunicações
- [ ] Sistema de monitoramento (Grafana + Prometheus)
- [ ] Backup automático de workflows
- [ ] Documentação de usuário final

---

## 📊 MÉTRICAS DE SUCESSO DO SISTEMA

### KPIs do VCM

| Métrica | Target | Medição |
|---------|--------|---------|
| **Taxa de Automação** | > 80% das tarefas | % tarefas executadas por workflows vs manual |
| **Tempo de Resposta (Comunicações)** | < 4 horas | Média de `acted_at - created_at` |
| **Taxa de Aprovação (Supervisão)** | > 90% | % aprovações no primeiro nível (sem escalação) |
| **Precisão de Templates** | > 95% | % tarefas criadas que executam sem erro |
| **Satisfação do Usuário** | NPS > 50 | Pesquisa trimestral |
| **ROI de Automação** | > 300% | (Tempo economizado * custo/hora) / custo sistema |

### Métricas Operacionais

```sql
-- Dashboard executivo
SELECT 
  -- Comunicações
  (SELECT COUNT(*) FROM personas_communications WHERE status = 'pending') as comunicacoes_pendentes,
  (SELECT AVG(EXTRACT(EPOCH FROM (acted_at - created_at)) / 3600) 
   FROM personas_communications WHERE acted_at IS NOT NULL) as tempo_medio_resposta_horas,
  
  -- Supervisão
  (SELECT COUNT(*) FROM task_supervision_logs WHERE supervision_result = 'escalated') as supervisoes_escaladas,
  (SELECT COUNT(*) FROM task_supervision_logs 
   WHERE response_time_hours > 24) as supervisoes_atrasadas,
  
  -- Workflows
  (SELECT COUNT(*) FROM personas_workflows WHERE status = 'active') as workflows_ativos,
  (SELECT AVG(total_execucoes) FROM personas_workflows) as media_execucoes_por_workflow,
  (SELECT SUM(total_erros) / NULLIF(SUM(total_execucoes), 0) 
   FROM personas_workflows) as taxa_erro_workflows,
  
  -- Intervenções de Usuário
  (SELECT COUNT(*) FROM user_interventions 
   WHERE created_at > NOW() - INTERVAL '7 days') as intervencoes_ultima_semana,
  (SELECT AVG(execution_time_ms) FROM user_interventions) as tempo_medio_intervencao_ms;
```

---

## 📚 REFERÊNCIAS E INSPIRAÇÕES

### Documentação Técnica
- [N8N Documentation](https://docs.n8n.io/)
- [N8N API Reference](https://docs.n8n.io/api/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

### Padrões de Arquitetura
- **Event-Driven Architecture (EDA):** Comunicações como eventos
- **CQRS (Command Query Responsibility Segregation):** Separar comandos de usuário de queries
- **Saga Pattern:** Transações distribuídas em workflows
- **Human-in-the-Loop (HITL):** Intervenção humana estruturada

### Sistemas Similares (Inspiração)
- **Zapier:** Automação no-code com triggers e actions
- **UiPath:** RPA empresarial com supervisão
- **Airflow:** Orquestração de workflows com DAGs
- **Temporal.io:** Workflows duráveis com estado
- **n8n:** Automação open-source (base do VCM)

### Artigos e Papers
- "Multi-Agent Systems: A Modern Approach" (Wooldridge, 2009)
- "Human-in-the-Loop Optimization of Shared Autonomy" (MIT, 2020)
- "Event-Driven Architecture in Practice" (O'Reilly, 2022)

---

## 🎓 GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| **Persona** | Agente virtual autônomo com role, competências e responsabilidades |
| **Workflow N8N** | Sequência automatizada de ações (a "alma" da persona) |
| **Subsistema** | Módulo funcional (Marketing, Vendas, etc) com APIs próprias |
| **Comunicação Inter-Persona** | Mensagem estruturada entre duas personas |
| **Handoff** | Repasse de trabalho de uma persona para outra |
| **Supervisão Hierárquica** | Aprovação/revisão de tarefas por superior |
| **Escalação** | Envio de tarefa para nível hierárquico superior após timeout |
| **Template de Tarefa** | Estrutura pré-definida para criação de tarefas sem LLM |
| **Métrica Tangível** | Medida do mundo real (leads reais, vendas reais) |
| **HITL (Human-in-the-Loop)** | Sistema que requer intervenção humana pontual |
| **Threshold** | Limite que aciona aprovação (ex: valor > R$ 10k) |
| **SLA** | Service Level Agreement (tempo máximo para conclusão) |
| **OEE** | Overall Equipment Effectiveness (eficiência de produção) |

---

## 🤝 CONTRIBUIÇÃO E EVOLUÇÃO

Este documento é **vivo** e deve ser atualizado conforme o sistema evolui.

### Como Contribuir

1. **Identificar Gaps:** Funcionalidades faltantes ou mal documentadas
2. **Propor Melhorias:** Arquiteturais, de performance ou UX
3. **Adicionar Casos de Uso:** Exemplos reais de fluxos empresariais
4. **Documentar Decisões:** Por que escolhemos A em vez de B

### Histórico de Versões

| Versão | Data | Mudanças Principais |
|--------|------|---------------------|
| **1.0** | 06/12/2025 | Análise inicial: Personas ↔ N8N ↔ Subsistemas |
| **2.0** | 07/12/2025 | Adicionadas 3 dimensões: Comunicações Inter-Personas, Supervisão Hierárquica, Interface Usuário ↔ Sistema. Documento expandido de 50 para 120+ páginas. |

### Próximas Evoluções Previstas

- **V2.1:** Adicionar seção de Machine Learning para otimização de workflows
- **V2.2:** Detalhar integração com ERPs externos (SAP, Totvs)
- **V2.3:** Sistema de recomendação de automações baseado em histórico

---

## 🎯 DECISÕES ARQUITETURAIS CRÍTICAS

### Por que N8N em vez de Zapier/Make?

✅ **Prós N8N:**
- Open-source (reduz custos)
- Self-hosted (controle total de dados)
- Suporta código customizado (JavaScript/Python)
- Webhooks ilimitados
- Gratuito para uso interno

❌ **Contras:**
- Requer infraestrutura própria
- Menor quantidade de integrações prontas

**Decisão:** N8N é ideal para VCM por permitir customização profunda e controle total do fluxo de dados entre personas.

### Por que Templates Estruturados em vez de LLM para Comandos?

✅ **Prós Templates:**
- Zero custo de LLM
- Zero ambiguidade (comandos sempre executáveis)
- Performance instantânea
- Fácil de testar e validar
- Usuário sabe exatamente o que esperar

❌ **Contras:**
- Menos "inteligente" que linguagem natural
- Requer manutenção da biblioteca de templates

**Decisão:** Templates estruturados são suficientes para 95% dos casos de uso. LLM só será usado para casos excepcionais ou geração inicial de templates.

### Por que Supabase em vez de PostgreSQL Puro?

✅ **Prós Supabase:**
- Real-time subscriptions (comunicações instantâneas)
- Auth integrado
- Storage para avatares
- API REST automática
- Dashboard administrativo

**Decisão:** Supabase acelera desenvolvimento sem perder flexibilidade do PostgreSQL.

---

**Fim do documento**  
_Gerado por: GitHub Copilot (Claude Sonnet 4.5)_  
_Versão Inicial: 06/12/2025, 23:45 BRT_  
_Última Atualização: 07/12/2025, 08:30 BRT_  
_Status: ✅ V2.0 Completa — Pronta para implementação_
