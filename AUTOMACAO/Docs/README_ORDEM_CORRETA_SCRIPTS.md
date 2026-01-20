# 🎯 ORDEM CORRETA DE EXECUÇÃO DOS SCRIPTS - ATUALIZADO

**Data de Atualização:** 1 de Dezembro de 2025  
**Status:** ✅ Scripts Renomeados e Corrigidos

---

## 📋 RESUMO DA CASCATA COMPLETA

```
1. Criar Empresa (Frontend)           → company-form.tsx
2. Script 01 - Placeholders           → 01_create_personas_from_structure.js
3. Script 02 - Biografias + Dados     → 02_generate_biografias_COMPLETO.js
4. Script 03 - Atribuições            → 03_generate_atribuicoes_contextualizadas.cjs
5. Script 04 - Competências + Metas   → 04_generate_competencias_grok.cjs
6. Script 05 - Avatares               → 05_generate_avatares.js
7. Script 06 - Análise Automação      → 06_analyze_tasks_for_automation.js
8. Script 07 - Workflows N8N          → 07_generate_n8n_workflows.js
9. Script 08 - Machine Learning       → 08_generate_machine_learning.js
10. Script 09 - Auditoria             → 09_generate_auditoria.js
```

---

## 🏢 FASE 0: CRIAR EMPRESA (Frontend)

### Interface: `src/components/company-form.tsx`

#### O que fazer:
1. Acessar dashboard: `http://localhost:3001`
2. Clicar em "Nova Empresa"
3. Preencher formulário:
   - **Dados Básicos:** nome, código, indústria, descrição
   - **Estrutura:** CEO gender, executives, assistants, specialists
   - **Nacionalidades:** distribuição percentual (deve somar 100%)
   - **Idiomas:** selecionar idiomas da empresa

#### Opção: Gerar Estrutura com IA
- Clicar em "✨ Gerar Estrutura com IA"
- IA (Gemini 2.0 Flash) sugere cargos baseados na descrição
- Revisar e editar se necessário

#### Resultado:
```json
{
  "cargos_necessarios": ["CEO", "CTO", "CFO", ...],
  "nationalities": [
    {"tipo": "americanos", "percentual": 40},
    {"tipo": "brasileiros", "percentual": 30}
  ],
  "equipe_gerada": false
}
```

---

## 👥 SCRIPT 01: CRIAR PLACEHOLDERS

### Arquivo: `AUTOMACAO/01_create_personas_from_structure.js`

#### O que faz:
- Cria **placeholders** de personas com:
  - ✅ Cargo (role, department, specialty)
  - ✅ Nacionalidade distribuída proporcionalmente
  - ❌ Nome = NULL (será gerado pelo Script 02)
  - ❌ Email = NULL
  - ❌ Gênero = NULL
  - ❌ Experiência = NULL

#### Comando:
```bash
cd AUTOMACAO
node 01_create_personas_from_structure.js --empresaId=UUID_EMPRESA
```

#### Exemplo:
```bash
node 01_create_personas_from_structure.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

#### Saída:
```
✅ 15 placeholders criados
✅ Distribuição: 40% americanos, 30% brasileiros, 20% europeus, 10% asiáticos
```

---

## 📝 SCRIPT 02: GERAR BIOGRAFIAS + DADOS BÁSICOS

### Arquivo: `AUTOMACAO/02_generate_biografias_COMPLETO.js`

#### ⭐ NOVIDADES (SCRIPT CORRIGIDO):
Este script agora faz **TUDO DE UMA VEZ**:
1. ✅ Gera **nome real** baseado na nacionalidade
2. ✅ Gera **email** com domínio da empresa
3. ✅ Calcula **experiência (anos)** baseado no cargo
4. ✅ Determina **gênero** (masculino/feminino)
5. ✅ Gera **biografia estruturada** com LLM (Gemini ou OpenAI)
6. ✅ Salva em `personas` (dados básicos) e `personas_biografias` (JSONB)

#### Comando:
```bash
node 02_generate_biografias_COMPLETO.js --empresaId=UUID_EMPRESA
```

#### Exemplo de Saída:
```
[1/15] Processando CEO...
  👤 Nome gerado: Sarah Thompson (americanos, feminino)
  📧 Email: sarah.thompson@arvabot.com
  💼 Experiência: 12 anos
  🤖 Gerando biografia via LLM...
  ✅ Biografia completa salva!
```

#### Dados Gerados:

**Tabela `personas`:**
```sql
UPDATE personas SET
  full_name = 'Sarah Thompson',
  email = 'sarah.thompson@arvabot.com',
  genero = 'feminino',
  experiencia_anos = 12
WHERE id = 'UUID';
```

**Tabela `personas_biografias`:**
```json
{
  "biografia_completa": "Sarah Thompson é CTO na ARVA Tech Solutions...",
  "historia_profissional": "Iniciou sua carreira...",
  "soft_skills": { "comunicacao": 9, "lideranca": 9, ... },
  "hard_skills": { "tecnologicas": {...}, "ferramentas": [...] },
  "educacao": { "formacao_superior": [...], ... },
  "certificacoes": [...],
  "idiomas_fluencia": { "nativo": ["Inglês"], ... }
}
```

---

## 🎯 SCRIPT 03: GERAR ATRIBUIÇÕES CONTEXTUALIZADAS

### Arquivo: `AUTOMACAO/03_generate_atribuicoes_contextualizadas.cjs`

#### ⭐ CORREÇÕES IMPLEMENTADAS:
- ✅ Busca biografia de `personas_biografias`
- ✅ Inclui `hard_skills` e `soft_skills` no prompt
- ✅ Salva em `personas_atribuicoes` (tabela normalizada)

#### Comando:
```bash
node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=UUID_EMPRESA
```

#### Modos de Execução:
```bash
# Incremental (padrão) - Só personas sem atribuições
node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=UUID

# Completo - Substitui atribuições de todas
node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=UUID --all

# Força total - Limpa e regenera tudo
node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=UUID --force
```

#### Saída:
```
[1/15] Sarah Thompson (CTO)
  🤖 Buscando biografia estruturada...
  ✅ Biografia encontrada (hard_skills, soft_skills)
  🤖 Gerando atribuições contextualizadas...
  ✅ 8 atribuições salvas em personas_atribuicoes
```

#### Dados Salvos (`personas_atribuicoes`):
```sql
INSERT INTO personas_atribuicoes (persona_id, atribuicao, ordem)
VALUES
  ('UUID', 'Definir e executar estratégia tecnológica', 1),
  ('UUID', 'Liderar equipe de 30+ engenheiros', 2),
  ('UUID', 'Avaliar e implementar novas tecnologias', 3),
  ...
```

---

## 🎓 SCRIPT 04: GERAR COMPETÊNCIAS

### Arquivo: `AUTOMACAO/04_generate_competencias_grok.cjs`

#### ⭐ CORREÇÕES IMPLEMENTADAS:
- ✅ Busca biografia **COMPLETA** de `personas_biografias` (SEM truncar)
- ✅ Busca atribuições de `personas_atribuicoes`
- ✅ Inclui `hard_skills`, `soft_skills`, `educacao`, `certificacoes`
- ✅ Contexto rico para competências detalhadas

#### Comando:
```bash
node 04_generate_competencias_grok.cjs --empresaId=UUID_EMPRESA
```

#### Modos de Execução:
```bash
# Incremental (padrão)
node 04_generate_competencias_grok.cjs --empresaId=UUID

# Completo
node 04_generate_competencias_grok.cjs --empresaId=UUID --all

# Força total
node 04_generate_competencias_grok.cjs --empresaId=UUID --force
```

#### Prompt Melhorado:
```javascript
const prompt = `
PERSONA: ${persona.full_name}
CARGO: ${persona.role}

=== BIOGRAFIA PROFISSIONAL COMPLETA ===
${biografiaCompleta.biografia_completa}  // ✅ SEM TRUNCAR!

=== HARD SKILLS ===
${JSON.stringify(biografiaCompleta.hard_skills, null, 2)}

=== SOFT SKILLS ===
${JSON.stringify(biografiaCompleta.soft_skills, null, 2)}

=== ATRIBUIÇÕES (${atribuicoes.length}) ===
${atribuicoes.map((a, i) => `${i+1}. ${a.atribuicao}`).join('\n')}

=== CERTIFICAÇÕES ===
${biografiaCompleta.certificacoes.join(', ')}

Gere competências técnicas, comportamentais, ferramentas, tarefas e KPIs...
`;
```

#### Dados Salvos (`personas_competencias`):
```json
{
  "competencias_tecnicas": ["Cloud Architecture", "AI/ML", ...],
  "competencias_comportamentais": ["Liderança estratégica", ...],
  "ferramentas": ["AWS", "Kubernetes", "Terraform", ...],
  "tarefas_diarias": ["Code reviews", "Architecture decisions", ...],
  "tarefas_semanais": ["Sprint planning", "Tech talks", ...],
  "tarefas_mensais": ["Budget review", "Performance reviews", ...],
  "kpis": [
    "System Uptime - 99.9% availability - Manter acima de 99.9%",
    "Deploy Frequency - Daily deployments - 10+ deploys/dia"
  ],
  "objetivos_desenvolvimento": ["Certificação AWS Advanced", ...]
}
```

---

## 🎭 SCRIPT 05: GERAR AVATARES

### Arquivo: `AUTOMACAO/05_generate_avatares.js`

#### ⭐ CORREÇÕES IMPLEMENTADAS:
- ✅ Executa **ÚLTIMO** (após biografia, atribuições, competências)
- ✅ Busca biografia estruturada de `personas_biografias`
- ✅ Busca atribuições de `personas_atribuicoes`
- ✅ Busca competências de `personas_competencias`
- ✅ Contexto **COMPLETO** para aparência visual realista

#### Comando:
```bash
node 05_generate_avatares.js --empresaId=UUID_EMPRESA
```

#### ⚠️ ATENÇÃO - Rate Limits:
```
Google AI Studio Free:
- Delay obrigatório: 120s entre requisições
- Limite diário: ~15 imagens
- Tempo total para 15 personas: ~30 minutos
```

#### Prompt Melhorado:
```javascript
const personaData = {
  nome: persona.full_name,
  nacionalidade: persona.nacionalidade,
  genero: persona.genero,
  cargo: persona.role,
  experiencia_anos: persona.experiencia_anos,
  
  // ✅ NOVOS CAMPOS (biografia completa)
  biografia_completa: biografiaCompleta.biografia_completa,
  historia_profissional: biografiaCompleta.historia_profissional,
  soft_skills: biografiaCompleta.soft_skills,
  hard_skills: biografiaCompleta.hard_skills,
  educacao: biografiaCompleta.educacao,
  valores: biografiaCompleta.motivacoes.valores_pessoais,
  
  // ✅ ATRIBUIÇÕES
  atribuicoes: atribuicoes.map(a => a.atribuicao),
  
  // ✅ COMPETÊNCIAS
  competencias_tecnicas: competencias.competencias_tecnicas,
  competencias_comportamentais: competencias.competencias_comportamentais
};
```

#### Dados Salvos:

**Tabela `personas_avatares`:**
```json
{
  "avatar_url": "https://images.unsplash.com/...",
  "prompt_usado": "Professional woman, 40-45 years, CTO...",
  "biometrics": {
    "idade_aparente": "40-45 anos",
    "genero": "feminino",
    "etnia": "caucasiano",
    "cabelo_cor": "castanho escuro",
    "olhos_cor": "castanhos",
    "pele_tom": "bronzeada clara",
    ...
  }
}
```

**Tabela `personas` (system_prompt):**
```json
{
  "descricao_fisica_completa": {
    "tom_pele": "bronzeada clara",
    "formato_rosto": "oval",
    "olhos": { "cor": "castanhos", "formato": "amendoados" },
    "cabelo": { "cor": "castanho escuro", "estilo": "liso médio" },
    ...
  }
}
```

---

## 🤖 SCRIPT 06: ANÁLISE DE AUTOMAÇÃO DE TAREFAS

### Arquivo: `AUTOMACAO/06_analyze_tasks_for_automation.js`

#### ⭐ O QUE FAZ:
- Analisa tarefas das personas usando **OpenAI GPT-4**
- Identifica oportunidades de automação
- Calcula **automation_score** (0-100)
- Define tipo de workflow necessário
- Mapeia integrações/APIs necessárias
- Gera sequência de passos (workflow_steps)

#### DEPENDE DE:
- ✅ Script 04: `personas_competencias` (tarefas_diarias, tarefas_semanais, tarefas_mensais)

#### Comando:
```bash
node 06_analyze_tasks_for_automation.js --empresaId=UUID_EMPRESA
```

#### Modos de Execução:
```bash
# Analisar todas as personas
node 06_analyze_tasks_for_automation.js --empresaId=UUID

# Analisar apenas uma persona
node 06_analyze_tasks_for_automation.js --empresaId=UUID --personaId=UUID
```

#### Exemplo de Análise Gerada:

**Input (Tarefa da Competência):**
```
Tarefa: "Code reviews de pull requests da equipe"
Frequência: Diária
Persona: Sarah Thompson (CTO)
```

**Output (Análise):**
```json
{
  "automation_score": 45,
  "automation_level": "parcial",
  "workflow_type": "event",
  "required_integrations": ["github", "slack", "linear"],
  "workflow_steps": [
    {
      "step": 1,
      "node_type": "webhook",
      "action": "Receber notificação de novo PR",
      "config": {
        "httpMethod": "POST",
        "path": "webhook/github/pr"
      }
    },
    {
      "step": 2,
      "node_type": "function",
      "action": "Analisar complexidade do PR",
      "config": {
        "code": "const files = $input.item.json.files; ..."
      }
    },
    {
      "step": 3,
      "node_type": "if",
      "action": "Se complexidade > 50 linhas, notificar CTO",
      "config": {
        "conditions": {
          "number": [{"value1": "{{$json.complexity}}", "operation": "larger", "value2": 50}]
        }
      }
    },
    {
      "step": 4,
      "node_type": "slack",
      "action": "Enviar mensagem para #code-reviews",
      "config": {
        "channel": "code-reviews",
        "text": "🔍 PR #{{$json.pr_number}} precisa de review"
      }
    }
  ],
  "estimated_time_saved": "30 minutos/dia",
  "roi_score": 75,
  "complexity": "medium",
  "reasoning": "Automação parcial: notificação e triagem automáticas, mas review final requer humano"
}
```

#### Dados Salvos (`automation_opportunities`):
```sql
CREATE TABLE automation_opportunities (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  task_id UUID REFERENCES personas_tasks(id),
  automation_score INT,          -- 0-100
  automation_level TEXT,          -- "baixo", "parcial", "alto"
  workflow_type TEXT,            -- "cron", "webhook", "event", "manual"
  required_integrations JSONB,   -- ["github", "slack", ...]
  workflow_steps JSONB,          -- Array de steps
  estimated_time_saved TEXT,
  roi_score INT,
  complexity TEXT,               -- "low", "medium", "high"
  reasoning TEXT,
  created_at TIMESTAMP
);
```

---

## ⚙️ SCRIPT 07: GERAÇÃO DE WORKFLOWS N8N

### Arquivo: `AUTOMACAO/07_generate_n8n_workflows.js`

#### ⭐ O QUE FAZ:
- Lê `automation_opportunities` com score >= 60
- Converte `workflow_steps` em **nós N8N** executáveis
- Conecta nós automaticamente em sequência
- Adiciona error handling
- Configura credenciais por empresa
- Gera **JSON 100% importável** no N8N
- Salva arquivos JSON prontos para uso

#### DEPENDE DE:
- ✅ Script 06: `automation_opportunities` (análises de tarefas)

#### Comando:
```bash
node 07_generate_n8n_workflows.js --empresaId=UUID_EMPRESA
```

#### Modos de Execução:
```bash
# Gerar todos workflows com score >= 60 (padrão)
node 07_generate_n8n_workflows.js --empresaId=UUID

# Gerar apenas workflows com score >= 70
node 07_generate_n8n_workflows.js --empresaId=UUID --minScore=70

# Gerar workflows de uma persona específica
node 07_generate_n8n_workflows.js --empresaId=UUID --personaId=UUID
```

#### Exemplo de Workflow N8N Gerado:

**Input (da análise):**
```json
{
  "workflow_type": "cron",
  "workflow_steps": [
    {
      "step": 1,
      "node_type": "cron",
      "action": "Diariamente às 9h"
    },
    {
      "step": 2,
      "node_type": "supabase",
      "action": "Buscar leads criados ontem"
    },
    {
      "step": 3,
      "node_type": "function",
      "action": "Calcular lead score"
    },
    {
      "step": 4,
      "node_type": "slack",
      "action": "Enviar relatório para #sales"
    }
  ]
}
```

**Output (Workflow N8N JSON):**
```json
{
  "name": "ARVA - Sarah Thompson - Daily Lead Report",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 24,
              "triggerAtHour": 9,
              "triggerAtMinute": 0
            }
          ]
        }
      },
      "id": "node-1",
      "name": "Diariamente às 9h",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "select",
        "table": "leads",
        "filterType": "manual",
        "conditions": {
          "conditions": [
            {
              "keyName": "created_at",
              "value": "{{ $now.minus({ days: 1 }).toISO() }}"
            }
          ]
        }
      },
      "id": "node-2",
      "name": "Buscar leads criados ontem",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 300],
      "credentials": {
        "supabaseApi": {
          "id": "arva-supabase",
          "name": "ARVA Supabase"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "const leads = $input.all();\nfor (const lead of leads) {\n  lead.json.score = calculateScore(lead.json);\n}\nreturn leads;"
      },
      "id": "node-3",
      "name": "Calcular lead score",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "channel": "sales",
        "text": "📊 Relatório de Leads ({{$json.count}} novos)",
        "attachments": [
          {
            "text": "{{$json.summary}}"
          }
        ]
      },
      "id": "node-4",
      "name": "Enviar relatório para #sales",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.1,
      "position": [900, 300],
      "credentials": {
        "slackApi": {
          "id": "arva-slack",
          "name": "ARVA Slack"
        }
      }
    }
  ],
  "connections": {
    "node-1": {
      "main": [[{"node": "node-2", "type": "main", "index": 0}]]
    },
    "node-2": {
      "main": [[{"node": "node-3", "type": "main", "index": 0}]]
    },
    "node-3": {
      "main": [[{"node": "node-4", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "1",
  "meta": {
    "instanceId": "arva-tech-solutions"
  },
  "tags": [
    {"id": "automation", "name": "Automation"},
    {"id": "daily", "name": "Daily"},
    {"id": "leads", "name": "Leads"}
  ]
}
```

#### Arquivos Gerados:

```
06_N8N_WORKFLOWS/
├── ARVA_Tech_Solutions/
│   ├── sarah_thompson_daily_lead_report.json
│   ├── sarah_thompson_weekly_code_review.json
│   ├── john_doe_monthly_budget_report.json
│   └── ...
└── README.md
```

#### Importação no N8N:

1. Abrir N8N: `http://localhost:5678`
2. Clicar em **"Add Workflow" → "Import from File"**
3. Selecionar arquivo JSON gerado
4. Configurar credenciais (Supabase, Slack, etc.)
5. Ativar workflow

#### Dados Salvos (`personas_workflows`):
```sql
CREATE TABLE personas_workflows (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  opportunity_id UUID REFERENCES automation_opportunities(id),
  workflow_name TEXT,
  workflow_type TEXT,
  n8n_json JSONB,              -- Workflow completo
  file_path TEXT,              -- Caminho do arquivo JSON
  status TEXT,                 -- "draft", "active", "paused"
  automation_score INT,
  estimated_time_saved TEXT,
  created_at TIMESTAMP
);
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Antes de executar os scripts, verifique:

### Pré-requisitos:
- [ ] Empresa criada no frontend
- [ ] `cargos_necessarios` definidos (array com cargos)
- [ ] `nationalities` definidas (total = 100%)
- [ ] `equipe_gerada = false`
- [ ] Variáveis de ambiente configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GOOGLE_AI_API_KEY`
  - `OPENROUTER_API_KEY`

### Ordem de Execução:
- [ ] **Script 01** executado (placeholders criados)
- [ ] **Script 02** executado (biografias + dados básicos)
- [ ] **Script 03** executado (atribuições)
- [ ] **Script 04** executado (competências)
- [ ] **Script 05** executado (avatares)

### Validação de Dados:
- [ ] Personas têm `full_name` preenchido
- [ ] Personas têm `email` com domínio correto
- [ ] Personas têm `experiencia_anos` (não NULL)
- [ ] Tabela `personas_biografias` populada
- [ ] Tabela `personas_atribuicoes` populada
- [ ] Tabela `personas_competencias` populada
- [ ] Tabela `personas_avatares` populada

---

## 🎯 COMANDOS COMPLETOS (EXEMPLO REAL)

```bash
# Empresa ARVA Tech Solutions
EMPRESA_ID="7761ddfd-0ecc-4a11-95fd-5ee913a6dd17"

# 1. Placeholders
cd AUTOMACAO
node 01_create_personas_from_structure.js --empresaId=$EMPRESA_ID

# 2. Biografias + Dados Básicos
node 02_generate_biografias_COMPLETO.js --empresaId=$EMPRESA_ID

# 3. Atribuições Contextualizadas
node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=$EMPRESA_ID

# 4. Competências Detalhadas
node 04_generate_competencias_grok.cjs --empresaId=$EMPRESA_ID

# 5. Avatares (último!)
node 05_generate_avatares.js --empresaId=$EMPRESA_ID
```

---

## 🔧 TROUBLESHOOTING

### Erro: "Empresa já tem equipe gerada"
```bash
# Script 01 não roda se equipe_gerada = true
# Solução: deletar personas existentes ou criar nova empresa
```

### Erro: "Biografia não encontrada"
```bash
# Scripts 03, 04, 05 precisam de biografia
# Solução: executar Script 02 primeiro
```

### Erro: "Rate limit atingido"
```bash
# Google AI Free tem limite diário
# Solução: aguardar 24h ou usar API key paga
```

### Erro: "Nacionalidades não somam 100%"
```bash
# Validação no frontend
# Solução: ajustar percentuais para somar exatamente 100%
```

---

## 📈 MELHORIAS IMPLEMENTADAS

### Script 02 (Biografias):
- ✅ Gera nomes reais baseados em nacionalidade
- ✅ Gera emails com domínio da empresa
- ✅ Calcula experiência baseada no cargo
- ✅ Determina gênero automaticamente

### Script 03 (Atribuições):
- ✅ Busca biografia estruturada
- ✅ Usa hard_skills e soft_skills no contexto
- ✅ Salva em tabela normalizada

### Script 04 (Competências):
- ✅ Biografia completa (sem truncar)
- ✅ Inclui atribuições no prompt
- ✅ Contexto rico e detalhado

### Script 05 (Avatares):
- ✅ Executa por último
- ✅ Usa todos os dados gerados anteriormente
- ✅ Aparência visual contextualizada e realista

### Script 06 (Análise de Automação):
- ✅ Analisa tarefas com OpenAI GPT-4
- ✅ Calcula automation_score (0-100)
- ✅ Identifica tipo de workflow (cron, webhook, event, manual)
- ✅ Mapeia integrações necessárias
- ✅ Gera workflow_steps detalhados

### Script 07 (Workflows N8N):
- ✅ Converte análises em workflows N8N executáveis
- ✅ Conecta nós automaticamente
- ✅ Adiciona error handling
- ✅ Gera JSON 100% importável no N8N

### Script 08 (Machine Learning):
- ✅ Gera modelo de ML para previsão de comportamento
- ✅ Treina com dados históricos de todas as fases
- ✅ Calcula métricas (accuracy, precision, recall, F1)
- ✅ Identifica bottlenecks e tendências
- ✅ Sugere otimizações com base em predições

### Script 09 (Auditoria):
- ✅ Audita completude de dados em todas as 9 fases
- ✅ Calcula quality_score (0-100) por persona
- ✅ Identifica gaps e dados faltantes
- ✅ Gera relatório detalhado com recomendações
- ✅ Categoriza personas (alta/média/baixa qualidade)

---

## 🤖 SCRIPT 08: MACHINE LEARNING MODELS

### Arquivo: `AUTOMACAO/08_generate_machine_learning.js`

#### ⭐ O QUE FAZ:
- Coleta dados históricos de **todas as 7 fases anteriores**
- Gera modelo de ML usando **Google Gemini Pro**
- Treina modelo de previsão de comportamento
- Calcula **métricas de performance** (accuracy, precision, recall)
- Identifica **padrões e bottlenecks**
- Sugere **otimizações** baseadas em predições
- Salva em `personas_ml_models` + arquivo JSON

#### DEPENDE DE:
- ✅ Script 04: `personas_competencias` (tarefas)
- ✅ Script 06: `automation_opportunities`
- ✅ Script 07: `personas_workflows`

#### Comando:
```bash
node 08_generate_machine_learning.js --empresaId=UUID_EMPRESA
```

#### Modos de Execução:
```bash
# Treinar apenas personas sem modelo ML (incremental)
node 08_generate_machine_learning.js --empresaId=UUID

# Treinar apenas uma persona específica
node 08_generate_machine_learning.js --empresaId=UUID --personaId=UUID

# Retreinar TODOS os modelos existentes
node 08_generate_machine_learning.js --empresaId=UUID --retrain
```

#### Tabela Criada: `personas_ml_models`
```sql
CREATE TABLE personas_ml_models (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  model_type TEXT DEFAULT 'behavior_prediction',
  training_data JSONB,           -- Dados históricos usados no treino
  model_parameters JSONB,        -- Hiperparâmetros do modelo
  performance_metrics JSONB,     -- Accuracy, precision, recall, F1
  predictions JSONB,             -- Predições específicas
  optimization_suggestions JSONB, -- Sugestões de melhoria
  last_trained_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Exemplo de Modelo Gerado:
```json
{
  "model_type": "behavior_prediction",
  "training_data_summary": {
    "total_tasks": 18,
    "total_workflows": 3,
    "automation_opportunities": 5,
    "data_quality_score": 0.92
  },
  "model_parameters": {
    "algorithm": "neural_network",
    "input_features": [
      "task_complexity",
      "automation_score",
      "workflow_frequency",
      "time_spent"
    ],
    "output_predictions": [
      "task_completion_time",
      "automation_impact",
      "productivity_trend"
    ],
    "hyperparameters": {
      "learning_rate": 0.01,
      "epochs": 100,
      "batch_size": 32
    }
  },
  "performance_metrics": {
    "accuracy": 0.92,
    "precision": 0.89,
    "recall": 0.91,
    "f1_score": 0.90,
    "mae": 0.12,
    "rmse": 0.18
  },
  "predictions": {
    "task_completion_time": {
      "predicted_avg_hours": 2.5,
      "confidence": 0.87
    },
    "automation_impact": {
      "time_saved_percentage": 35,
      "confidence": 0.82
    },
    "productivity_trend": {
      "direction": "increasing",
      "monthly_change": 5.2,
      "confidence": 0.79
    },
    "bottlenecks": [
      {
        "task_type": "manual_reviews",
        "time_impact_hours": 8,
        "frequency": "daily"
      }
    ]
  },
  "optimization_suggestions": [
    {
      "area": "workflow_automation",
      "suggestion": "Automatizar aprovações de baixo risco",
      "expected_impact": "Reduzir 40% do tempo em aprovações",
      "priority": "high",
      "implementation_complexity": "medium"
    }
  ],
  "confidence_score": 0.85,
  "next_retrain_date": "2026-01-01T00:00:00Z"
}
```

#### Arquivos Gerados:
```
ml_models_output/
├── Sarah_Thompson_ml_model.json
├── John_Doe_ml_model.json
└── ...
```

---

## 🔍 SCRIPT 09: AUDITORIA COMPLETA

### Arquivo: `AUTOMACAO/09_generate_auditoria.js`

#### ⭐ O QUE FAZ:
- Audita **completude de dados** em todas as 9 fases
- Valida **integridade referencial** entre tabelas
- Calcula **quality_score** (0-100) por persona
- Identifica **gaps e dados faltantes**
- Detecta **inconsistências**
- Gera **recomendações** de correção
- Salva em `personas_audit_logs` + relatório JSON

#### DEPENDE DE:
- ✅ TODAS as fases anteriores (01-08)

#### Comando:
```bash
node 09_generate_auditoria.js --empresaId=UUID_EMPRESA
```

#### Modos de Execução:
```bash
# Auditoria rápida (verifica existência de dados)
node 09_generate_auditoria.js --empresaId=UUID

# Auditar apenas uma persona específica
node 09_generate_auditoria.js --empresaId=UUID --personaId=UUID

# Auditoria completa (valida conteúdo e consistência profunda)
node 09_generate_auditoria.js --empresaId=UUID --full
```

#### Tabela Criada: `personas_audit_logs`
```sql
CREATE TABLE personas_audit_logs (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  audit_type TEXT DEFAULT 'completeness_check',
  quality_score INT,             -- Score geral 0-100
  phase_scores JSONB,            -- Score por fase
  missing_data JSONB,            -- Dados faltantes
  inconsistencies JSONB,         -- Inconsistências detectadas
  warnings JSONB,                -- Avisos
  recommendations JSONB,         -- Recomendações de correção
  audit_date TIMESTAMP,
  created_at TIMESTAMP
);
```

#### Fases Auditadas:

| Fase | Checks | Peso |
|------|--------|------|
| **01 - Placeholders** | id, role, department, specialty, nacionalidade | 5% |
| **02 - Biografias** | full_name, email, genero, experiencia_anos, biografia completa | 20% |
| **03 - Atribuições** | mínimo 3 atribuições, ordem definida | 15% |
| **04 - Competências** | competências técnicas (≥3), comportamentais (≥3), ferramentas, tarefas, KPIs, metas | 20% |
| **05 - Avatares** | avatar exists, biometrics (≥10 campos), descrição física | 10% |
| **06 - Automação** | automation opportunities (≥1), score ≥60 | 10% |
| **07 - Workflows** | workflows N8N (≥1), JSON válido | 10% |
| **08 - ML** | modelo ML, métricas, predições, accuracy ≥0.7 | 10% |

#### Exemplo de Relatório de Auditoria:
```json
{
  "persona_id": "uuid",
  "persona_name": "Sarah Thompson",
  "audit_type": "completeness_check",
  "quality_score": 87,
  "phase_scores": {
    "01_placeholders": { "score": 100, "checks": {...} },
    "02_biografias": { "score": 100, "checks": {...} },
    "03_atribuicoes": { "score": 100, "checks": {...}, "count": 5 },
    "04_competencias": { "score": 100, "checks": {...} },
    "05_avatares": { "score": 100, "checks": {...} },
    "06_automation": { "score": 67, "checks": {...}, "count": 2 },
    "07_workflows": { "score": 67, "checks": {...}, "count": 2 },
    "08_machine_learning": { "score": 100, "checks": {...} }
  },
  "missing_data": [],
  "warnings": [
    {
      "phase": "06_automation",
      "score": 67,
      "severity": "medium",
      "message": "Fase 06_automation com completude média (67%)"
    }
  ],
  "recommendations": [
    {
      "priority": "medium",
      "action": "Analisar oportunidades de automação",
      "script": "06_analyze_tasks_for_automation.js",
      "reason": "Aumentar cobertura de automação"
    }
  ],
  "audit_date": "2025-12-01T03:00:00Z"
}
```

#### Relatório Geral (empresa):
```json
{
  "empresa": {
    "id": "uuid",
    "nome": "ARVA Tech Solutions"
  },
  "audit_summary": {
    "total_personas": 15,
    "high_quality": 12,      // Score ≥80
    "medium_quality": 3,     // Score 60-79
    "low_quality": 0,        // Score <60
    "avg_quality_score": 87
  },
  "audits": [...]
}
```

#### Arquivos Gerados:
```
auditoria_output/
├── auditoria_ARVA_Tech_Solutions_2025-12-01.json
└── ...
```

#### Interpretação dos Scores:

- **🟢 80-100**: Alta qualidade - Persona completa e consistente
- **🟡 60-79**: Média qualidade - Alguns dados faltantes
- **🔴 <60**: Baixa qualidade - Dados críticos ausentes

---

**Fim do guia**
