# 📋 PLANO FINAL DE AJUSTES — VCM V5.0

**Documento de Planejamento Executivo**  
**Data:** 07/12/2025  
**Versão:** 1.0  
**Autor:** GitHub Copilot (Claude Sonnet 4.5)  
**Status:** 🚧 Em Planejamento

---

## 🎯 OBJETIVO

Consolidar todas as alterações necessárias identificadas na **Arquitetura V2.0** e criar um roadmap executável para finalizar o projeto VCM com as 3 novas dimensões críticas:

1. **💬 Comunicações Inter-Personas**
2. **👔 Supervisão Hierárquica**
3. **🎮 Interface Usuário ↔ Sistema**

---

## 📊 ESTADO ATUAL DO PROJETO

### ✅ Componentes Completos

| Componente | Status | Evidência |
|------------|--------|-----------|
| **Foundation Layer** | ✅ 100% | 26 personas + biografias + atribuições |
| **Subsistemas VCM** | ✅ 100% | 12 subsistemas configurados com APIs documentadas |
| **Scripts 01-03 V5.0** | ✅ 100% | Executados com sucesso |
| **Scripts 04-05 V5.0** | ✅ Criados | Não executados ainda |
| **Frontend Links** | ✅ 100% | 4 arquivos atualizados para V5.0 |
| **Documento Arquitetura V2.0** | ✅ 100% | 120+ páginas com 3 dimensões |

### ⏳ Componentes Pendentes

| Componente | Status | Prioridade |
|------------|--------|------------|
| **Schemas SQL (4 tabelas novas)** | ❌ Não criado | 🔴 CRÍTICO |
| **Scripts 06-11 V5.0** | ❌ Não adaptado | 🟡 ALTA |
| **Biblioteca de Templates (30-50)** | ❌ Não criado | 🟡 ALTA |
| **UI Components (5 componentes)** | ❌ Não criado | 🟢 MÉDIA |
| **API Endpoints (5 rotas)** | ❌ Não criado | 🟢 MÉDIA |
| **N8N Deploy** | ❌ Não configurado | 🟢 MÉDIA |
| **Integrações Externas** | ❌ Não integrado | 🔵 BAIXA |

---

## 🗓️ ROADMAP EXECUTÁVEL

### 🚀 SPRINT 1: Database & Core Scripts (5 dias)

**Objetivo:** Criar infraestrutura de dados e executar scripts básicos.

#### Dia 1: Schemas SQL

**Tarefas:**

1. **Criar `SQL/create_communications_table.sql`**
   ```sql
   CREATE TABLE personas_communications (
     -- [Estrutura completa conforme doc arquitetura]
   );
   ```

2. **Criar `SQL/create_supervision_tables.sql`**
   ```sql
   CREATE TABLE task_supervision_chains ( ... );
   CREATE TABLE task_supervision_logs ( ... );
   ```

3. **Criar `SQL/create_interventions_table.sql`**
   ```sql
   CREATE TABLE user_interventions ( ... );
   ```

4. **Executar migrations**
   ```bash
   psql -h fzyokrvdyeczhfqlwxzb.supabase.co -U postgres -d postgres \
     -f SQL/create_communications_table.sql
   psql ... -f SQL/create_supervision_tables.sql
   psql ... -f SQL/create_interventions_table.sql
   ```

**Validação:**
- [ ] 4 tabelas criadas no Supabase
- [ ] Índices criados corretamente
- [ ] Foreign keys funcionando

---

#### Dia 2-3: Executar Scripts 04-05 V5.0

**Tarefas:**

1. **Executar Script 04 (Competências)**
   ```bash
   cd AUTOMACAO
   node 04_generate_competencias_v5.js --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4
   ```

2. **Executar Script 05 (Avatares)**
   ```bash
   node 05_generate_avatares_v5.js --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4
   ```

3. **Validar Resultados**
   ```sql
   -- Verificar competências
   SELECT COUNT(*) FROM personas_competencias;
   
   -- Verificar avatares
   SELECT COUNT(*) FROM personas_avatares WHERE avatar_image_prompt IS NOT NULL;
   ```

**Deliverables:**
- [ ] 26 personas com competências
- [ ] 26 personas com prompts de avatar
- [ ] Logs de execução salvos

---

#### Dia 4-5: Scripts 06-07 V5.0 (Automação + Workflows)

**Tarefas:**

1. **Adaptar Script 06 para incluir supervisão**
   - Adicionar campo `supervision_required` na análise
   - Identificar `supervisor_role` para cada tarefa
   - Gerar `approval_threshold` baseado em valor/risco

2. **Criar Script 06.5: `generate_communication_matrix.js`**
   ```javascript
   // Gera matriz de comunicação entre personas
   // Baseado em: atribuições + subsistemas compartilhados
   // Output: JSON com pares (persona_A, persona_B, tipo_comunicacao)
   ```

3. **Criar Script 07.5: `generate_supervision_chains.js`**
   ```javascript
   // Gera cadeias de supervisão
   // Baseado em: nivel_hierarquico + bloco_funcional
   // Output: Insere em task_supervision_chains
   ```

4. **Adaptar Script 07 para incluir nós de comunicação e supervisão**
   - Adicionar nó "Check Supervision Needed"
   - Adicionar nó "Send Communication"
   - Adicionar nó "Wait Approval"

**Deliverables:**
- [ ] Script 06 V5.0 executado
- [ ] Matriz de comunicação gerada
- [ ] Cadeias de supervisão criadas
- [ ] Workflows N8N com supervisão

---

### 🎨 SPRINT 2: Interface & Templates (5 dias)

**Objetivo:** Criar biblioteca de templates e UI components.

#### Dia 1-2: Biblioteca de Templates

**Tarefas:**

1. **Criar `AUTOMACAO/lib/task_templates.ts`**
   ```typescript
   export const TASK_TEMPLATES = {
     gerar_leads: { ... },
     fechar_venda: { ... },
     processar_pedido: { ... },
     // ... 30 templates totais
   };
   ```

2. **Categorizar templates por bloco funcional**
   - Marketing: 6 templates
   - Vendas: 5 templates
   - Financeiro: 4 templates
   - Produção: 4 templates
   - RH: 3 templates
   - Operações: 3 templates
   - Outros: 5 templates

3. **Criar Script 08.5: `validate_task_templates.js`**
   ```javascript
   // Valida que todos os templates têm:
   // - required_params definidos
   // - success_metrics definidos
   // - workflow_template referenciado
   ```

**Deliverables:**
- [ ] Arquivo `task_templates.ts` com 30 templates
- [ ] Documentação de cada template
- [ ] Script de validação

---

#### Dia 3-4: UI Components (React + TypeScript)

**Tarefas:**

1. **Criar `src/components/TaskCreationWizard.tsx`**
   - Seletor de template
   - Form de parâmetros dinâmico
   - Preview da tarefa
   - Botão de submit

2. **Criar `src/components/CommunicationInbox.tsx`**
   - Lista de comunicações pendentes
   - Filtros por tipo/prioridade
   - Ações rápidas (aprovar, rejeitar, responder)

3. **Criar `src/components/SupervisionDashboard.tsx`**
   - Métricas de supervisão
   - Gráfico de aprovações vs rejeições
   - Lista de supervisões atrasadas

4. **Criar `src/components/ApprovalQueue.tsx`**
   - Fila de aprovações pendentes
   - Detalhes da solicitação
   - Botões de ação (aprovar com/sem modificações, rejeitar, escalar)

5. **Criar `src/components/RealWorldMetricsDashboard.tsx`**
   - Métricas tangíveis por tarefa
   - Comparação atual vs target
   - Botão de confirmação manual

**Deliverables:**
- [ ] 5 componentes React funcionais
- [ ] Styled com Tailwind CSS
- [ ] Integrados com Supabase

---

#### Dia 5: Páginas de UI

**Tarefas:**

1. **Criar `src/app/tasks/create/page.tsx`**
   - Usa TaskCreationWizard
   - POST `/api/tasks/create`

2. **Criar `src/app/communications/page.tsx`**
   - Usa CommunicationInbox
   - GET `/api/communications/:personaId`

3. **Criar `src/app/supervision/page.tsx`**
   - Usa SupervisionDashboard
   - GET `/api/supervision/dashboard`

4. **Atualizar navegação em `src/app/layout.tsx`**

**Deliverables:**
- [ ] 3 páginas navegáveis
- [ ] Links na navbar
- [ ] Testes de navegação

---

### 🔌 SPRINT 3: APIs & Integrações (5 dias)

**Objetivo:** Criar endpoints de API e integrações externas.

#### Dia 1-2: API Endpoints (Next.js)

**Tarefas:**

1. **Criar `src/app/api/tasks/create/route.ts`**
   ```typescript
   POST /api/tasks/create
   Body: { template_code, parameters, assigned_to, priority }
   - Valida template existe
   - Valida parâmetros obrigatórios
   - Atribui persona (auto ou manual)
   - Cria registro em user_interventions
   - Retorna task_id
   ```

2. **Criar `src/app/api/communications/[personaId]/route.ts`**
   ```typescript
   GET /api/communications/:personaId
   Query: { status?, type?, priority? }
   - Retorna comunicações filtradas
   - Ordenadas por deadline
   ```

3. **Criar `src/app/api/approvals/[taskId]/respond/route.ts`**
   ```typescript
   POST /api/approvals/:taskId/respond
   Body: { decision, modifications?, notes }
   - Atualiza comunicação
   - Registra em task_supervision_logs
   - Notifica executor
   ```

4. **Criar `src/app/api/supervision/dashboard/route.ts`**
   ```typescript
   GET /api/supervision/dashboard
   - Retorna métricas agregadas
   - Supervisões por status
   - Tempos médios de resposta
   ```

5. **Criar `src/app/api/interventions/route.ts`**
   ```typescript
   POST /api/interventions
   Body: { intervention_type, command_data }
   - Registra intervenção usuário
   - Executa comando
   - Retorna resultado
   ```

**Deliverables:**
- [ ] 5 rotas de API funcionais
- [ ] Validação de entrada
- [ ] Error handling
- [ ] Testes com Postman

---

#### Dia 3-4: Integrações Externas (Opcional)

**Tarefas:**

1. **Integração Pipedrive CRM**
   ```typescript
   // src/lib/integrations/pipedrive.ts
   export async function fetchLeads(filters) { ... }
   export async function createDeal(data) { ... }
   ```

2. **Integração Google Ads**
   ```typescript
   // src/lib/integrations/google_ads.ts
   export async function getCampaignMetrics(campaignId) { ... }
   ```

3. **Criar `src/app/api/metrics/external/route.ts`**
   ```typescript
   GET /api/metrics/external/:source/:metricName
   - Fetcha métrica de fonte externa
   - Cache por 1 hora
   - Retorna valor atual
   ```

**Deliverables:**
- [ ] 2 integrações funcionais
- [ ] Rate limiting implementado
- [ ] Cache de resultados

---

#### Dia 5: Webhooks N8N

**Tarefas:**

1. **Criar webhook receiver em N8N**
   ```javascript
   // Workflow: Webhook Receiver
   Trigger: Webhook (POST /webhook/vcm/task-complete)
   Actions:
     - Parse payload
     - Update task status in Supabase
     - Send notification to user
   ```

2. **Criar `src/app/api/webhooks/n8n/route.ts`**
   ```typescript
   POST /api/webhooks/n8n
   Body: { workflow_id, execution_id, status, result }
   - Valida signature
   - Processa resultado
   - Atualiza task_execution
   ```

**Deliverables:**
- [ ] Webhook N8N configurado
- [ ] Endpoint de recebimento
- [ ] Validação de assinatura

---

### 🐳 SPRINT 4: Deploy & Testes (3 dias)

**Objetivo:** Deploy N8N e testes end-to-end.

#### Dia 1: N8N Self-Hosted

**Tarefas:**

1. **Criar `docker-compose.n8n.yml`**
   ```yaml
   version: '3.8'
   services:
     n8n:
       image: n8nio/n8n:latest
       ports:
         - "5678:5678"
       environment:
         - N8N_BASIC_AUTH_ACTIVE=true
         - N8N_BASIC_AUTH_USER=admin
         - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
         - WEBHOOK_URL=https://vcm.yourdomain.com
       volumes:
         - n8n_data:/home/node/.n8n
   ```

2. **Deploy N8N**
   ```bash
   docker-compose -f docker-compose.n8n.yml up -d
   ```

3. **Importar workflows gerados (Script 07)**
   ```bash
   # Via API N8N
   curl -X POST http://localhost:5678/api/v1/workflows/import \
     -H "Authorization: Bearer ${N8N_API_KEY}" \
     -F "file=@workflow.json"
   ```

**Deliverables:**
- [ ] N8N rodando em container
- [ ] Workflows importados
- [ ] Credenciais configuradas

---

#### Dia 2: Testes End-to-End

**Cenários de Teste:**

1. **Teste: Criar Tarefa "Gerar Leads"**
   - Usuário acessa `/tasks/create`
   - Seleciona template "gerar_leads"
   - Preenche: quantity=50, timeframe_days=15, channels=["linkedin"]
   - Submit → Cria tarefa
   - **Validação:** Workflow N8N inicia, persona recebe tarefa

2. **Teste: Aprovação de Desconto**
   - Persona Vendas tenta fechar venda com desconto 20%
   - Sistema verifica threshold (15%) → Aprovação necessária
   - Cria comunicação para Sales Manager
   - Manager aprova com modificação (desconto 18%)
   - **Validação:** Venda prossegue com desconto ajustado

3. **Teste: Escalação Automática**
   - Tarefa criada, aprovação necessária
   - Supervisor não responde em 24h
   - Sistema escala automaticamente para CFO
   - **Validação:** CFO recebe comunicação "ESCALADO"

4. **Teste: Métricas Tangíveis**
   - Tarefa "Gerar Leads" executada
   - Sistema fetcha leads do Pipedrive CRM (API)
   - Compara: 47 leads gerados vs 50 target
   - Exibe alerta: "Abaixo da meta, ajustando campanha"
   - **Validação:** Usuário vê métrica do mundo real

**Deliverables:**
- [ ] 4 cenários testados e aprovados
- [ ] Screenshots/vídeos de evidência
- [ ] Bugs identificados corrigidos

---

#### Dia 3: Documentação Final

**Tarefas:**

1. **Criar `USER_MANUAL_V2.md`**
   - Como criar tarefas
   - Como responder comunicações
   - Como aprovar/rejeitar solicitações
   - Como monitorar métricas

2. **Criar `DEVELOPER_GUIDE.md`**
   - Como adicionar novos templates
   - Como criar workflows N8N customizados
   - Como integrar novos subsistemas

3. **Atualizar `README.md`**
   - Overview V5.0 + 3 dimensões
   - Screenshots da UI
   - Instruções de deploy

**Deliverables:**
- [ ] 3 documentos de usuário/dev
- [ ] README atualizado
- [ ] Changelog V5.0

---

## 📦 ENTREGÁVEIS FINAIS

### Código

- [ ] **4 Schemas SQL** (communications, supervision, interventions)
- [ ] **6 Scripts V5.0** (04, 05, 06, 06.5, 07, 07.5)
- [ ] **Biblioteca de 30 Templates** (task_templates.ts)
- [ ] **5 UI Components** (React + TypeScript)
- [ ] **3 Páginas** (/tasks/create, /communications, /supervision)
- [ ] **5 API Endpoints** (tasks, communications, approvals, supervision, interventions)
- [ ] **2 Integrações Externas** (Pipedrive, Google Ads)
- [ ] **1 Docker Compose N8N** (self-hosted)

### Documentação

- [ ] **Arquitetura V2.0** (120+ páginas) ✅ JÁ CONCLUÍDO
- [ ] **Plano Final de Ajustes** (este documento)
- [ ] **User Manual V2** (guia do usuário)
- [ ] **Developer Guide** (guia do desenvolvedor)
- [ ] **README atualizado**
- [ ] **Changelog V5.0**

### Banco de Dados

- [ ] **4 Tabelas Novas** (personas_communications, task_supervision_chains, task_supervision_logs, user_interventions)
- [ ] **26 Personas Completas** (biografias + atribuições + competências + avatares)
- [ ] **Matriz de Comunicação** (pares de personas que se comunicam)
- [ ] **Cadeias de Supervisão** (hierarquia de aprovações)

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Templates insuficientes** | Média | Alto | Criar templates genéricos reutilizáveis + permitir customização |
| **N8N performance baixa** | Baixa | Alto | Usar Redis para queue, limitar workflows concorrentes |
| **Integrações externas falhando** | Alta | Médio | Implementar fallbacks, retry logic, cache |
| **UI complexa demais** | Média | Médio | Wizard step-by-step, tooltips explicativos |
| **Escalação de supervisão lenta** | Baixa | Alto | Notificações push, SLA configurável |

---

## 📈 MÉTRICAS DE SUCESSO

Ao final da implementação, devemos ter:

- [ ] **100% das personas** com competências e avatares
- [ ] **30+ templates** de tarefas disponíveis
- [ ] **5 UI components** funcionais e integrados
- [ ] **5 API endpoints** testados e documentados
- [ ] **N8N self-hosted** com workflows importados
- [ ] **4 cenários end-to-end** testados com sucesso
- [ ] **Taxa de erro < 5%** em execuções de workflow
- [ ] **Tempo médio de resposta < 4h** em comunicações
- [ ] **Taxa de escalação < 10%** em supervisões

---

## 🎓 LIÇÕES APRENDIDAS

### Do Desenvolvimento Até Agora

1. **Schema Discovery:** Usar scripts de debug para descobrir estrutura real do banco antes de assumir campo names
2. **LLM Fallback:** Ter múltiplos providers (OpenAI, OpenRouter, Gemini) evita downtime
3. **Rate Limiting:** Pausa de 2-3s entre requests é essencial para evitar 429
4. **Type Safety:** TypeScript + Supabase types reduz 90% dos bugs de integração
5. **Incremental Testing:** Testar cada script individualmente antes de executar cascade completo

### Para Aplicar Neste Plano

1. **Validar schemas SQL** antes de criar scripts que os usam
2. **Criar UI mockups** antes de implementar componentes
3. **Testar APIs com Postman** antes de integrar no frontend
4. **Deploy N8N em staging** antes de produção
5. **Documentar decisões** em tempo real (não deixar para depois)

---

## 🚦 CRITÉRIOS DE APROVAÇÃO

Para considerar o projeto **FINALIZADO**, todos os itens abaixo devem estar ✅:

### Funcionalidades Core
- [ ] Usuário pode criar tarefa via template estruturado
- [ ] Persona recebe tarefa e executa workflow N8N
- [ ] Persona pode enviar comunicação para outra persona
- [ ] Supervisor recebe solicitação de aprovação
- [ ] Supervisor pode aprovar/rejeitar/modificar
- [ ] Sistema escala automaticamente após timeout
- [ ] Métricas tangíveis são exibidas no dashboard
- [ ] Usuário pode confirmar/ajustar métricas

### Qualidade
- [ ] Cobertura de testes > 80% (unit + integration)
- [ ] Zero erros no console (frontend + backend)
- [ ] Performance: páginas carregam em < 2s
- [ ] Responsivo: funciona em mobile e desktop
- [ ] Acessível: WCAG 2.1 Level AA

### Documentação
- [ ] README completo com instruções de setup
- [ ] User Manual para usuários finais
- [ ] Developer Guide para contribuidores
- [ ] API documentada (Swagger/OpenAPI)
- [ ] Changelog com todas as mudanças

---

## 📞 PRÓXIMOS PASSOS IMEDIATOS

**AMANHÃ (08/12/2025):**

1. ☑️ Revisar este plano com o time
2. ☑️ Criar branch `feature/v5-communications-supervision`
3. ☑️ Começar Sprint 1 Dia 1: Criar schemas SQL
4. ☑️ Executar migrations no Supabase
5. ☑️ Validar que tabelas foram criadas corretamente

**Esta Semana (08-12/12):**
- Completar Sprint 1 (Database & Core Scripts)
- Executar Scripts 04-07
- Validar que workflows são gerados corretamente

**Próxima Semana (15-19/12):**
- Completar Sprint 2 (Interface & Templates)
- Criar biblioteca de 30 templates
- Desenvolver 5 UI components

**Semana Final (20-22/12):**
- Completar Sprint 3 (APIs & Integrações)
- Completar Sprint 4 (Deploy & Testes)
- Documentação final

---

**🎯 META: Projeto VCM V5.0 finalizado até 22/12/2025**

---

**Fim do Plano**  
_Documento criado por: GitHub Copilot (Claude Sonnet 4.5)_  
_Data: 07/12/2025, 09:00 BRT_  
_Status: 📋 Aguardando aprovação para início_
