# 🚀 INSTRUÇÕES: Executar Migrations V5.0 no Supabase

**Data:** 07/12/2025  
**Objetivo:** Criar 4 novas tabelas para o sistema de Comunicações e Supervisão

---

## ⚠️ IMPORTANTE

As tabelas precisam ser criadas **MANUALMENTE** no Supabase SQL Editor porque:
1. Supabase não permite execução de SQL arbitrário via API por segurança
2. Os scripts contêm ENUMs, TRIGGERs e FUNCTIONs complexas
3. Execução manual garante review de cada comando

---

## 📋 CHECKLIST DE EXECUÇÃO

### Passo 1: Abrir Supabase SQL Editor

🔗 **Link direto:** https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql

**Credenciais:**
- URL: `https://fzyokrvdyeczhfqlwxzb.supabase.co`
- Login: Conta Supabase do projeto

---

### Passo 2: Executar Script 1 — Comunicações

**Arquivo:** `SQL/create_personas_communications.sql`

**O que cria:**
- ✅ ENUM `communication_type` (handoff, notification, approval_request, question)
- ✅ ENUM `communication_priority` (low, normal, high, urgent)
- ✅ ENUM `communication_status` (pending, read, acted_upon, archived)
- ✅ Tabela `personas_communications` (8 índices)
- ✅ Trigger `communications_updated_at`
- ✅ Views: `v_communications_pending`, `v_communication_metrics`
- ✅ Função: `create_communication(...)`

**Como executar:**

1. Abra o arquivo `c:\Projetos\vcm_vite_react\SQL\create_personas_communications.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no Supabase SQL Editor
4. Clique em **RUN** (ou pressione F5)
5. ✅ Aguarde a mensagem "Success. No rows returned"

**Validação:**
```sql
-- Execute no SQL Editor para validar:
SELECT * FROM personas_communications LIMIT 0;
-- Deve retornar: "0 rows" (sem erro)
```

---

### Passo 3: Executar Script 2 — Supervisão

**Arquivo:** `SQL/create_task_supervision.sql`

**O que cria:**
- ✅ ENUM `hierarchy_level` (execution, operational, tactical, strategic)
- ✅ ENUM `supervision_type` (approval, notification, escalation, audit)
- ✅ ENUM `trigger_criteria` (value_threshold, risk_level, always, never, custom)
- ✅ ENUM `supervision_decision` (approved, approved_with_modifications, rejected, escalated, pending)
- ✅ Tabela `task_supervision_chains` (5 índices)
- ✅ Tabela `task_supervision_logs` (8 índices)
- ✅ Triggers: `supervision_chains_updated_at`, `supervision_logs_updated_at`, `supervision_logs_response_time`
- ✅ Views: `v_supervision_pending`, `v_supervision_metrics`
- ✅ Funções: `create_supervision_log(...)`, `process_supervision_escalations()`

**Como executar:**

1. Abra o arquivo `c:\Projetos\vcm_vite_react\SQL\create_task_supervision.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no Supabase SQL Editor
4. Clique em **RUN**
5. ✅ Aguarde "Success. No rows returned"

**Validação:**
```sql
-- Execute no SQL Editor:
SELECT * FROM task_supervision_chains LIMIT 0;
SELECT * FROM task_supervision_logs LIMIT 0;
-- Ambos devem retornar: "0 rows" (sem erro)
```

---

### Passo 4: Executar Script 3 — Intervenções de Usuário

**Arquivo:** `SQL/create_user_interventions.sql`

**O que cria:**
- ✅ ENUM `intervention_type` (create_task, modify_task, cancel_task, approve_supervision, etc)
- ✅ ENUM `intervention_status` (received, validating, processing, completed, failed, cancelled)
- ✅ Tabela `user_interventions` (7 índices)
- ✅ Trigger `interventions_updated_at`
- ✅ Views: `v_interventions_recent`, `v_intervention_metrics_by_user`
- ✅ Funções: `create_user_intervention(...)`, `update_intervention_status(...)`, `confirm_intervention_metrics(...)`

**Como executar:**

1. Abra o arquivo `c:\Projetos\vcm_vite_react\SQL\create_user_interventions.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no Supabase SQL Editor
4. Clique em **RUN**
5. ✅ Aguarde "Success. No rows returned"

**Validação:**
```sql
-- Execute no SQL Editor:
SELECT * FROM user_interventions LIMIT 0;
-- Deve retornar: "0 rows" (sem erro)
```

---

### Passo 5: Validação Final

Após executar os 3 scripts, execute o comando de validação:

```bash
cd C:\Projetos\vcm_vite_react\AUTOMACAO
node execute_migrations.js
```

**Resultado esperado:**
```
✅ Tabelas existentes: 4
❌ Tabelas ausentes: 0

🎉 Todas as tabelas V5.0 foram criadas!
```

---

## 🛠️ TROUBLESHOOTING

### Erro: "type X already exists"
**Solução:** Ignorar. Significa que o ENUM já foi criado anteriormente.

### Erro: "relation X already exists"
**Solução:** A tabela já existe. Pode pular esse script.

### Erro: "permission denied"
**Solução:** Verificar se está usando uma conta com permissão de admin no projeto Supabase.

### Erro: "syntax error near..."
**Solução:** Verificar se copiou o arquivo completo (incluindo o final `-- FIM DO SCRIPT`).

---

## 📊 ESTRUTURA CRIADA

Após execução completa, você terá:

### Tabelas (4)
1. `personas_communications` → Comunicações entre personas
2. `task_supervision_chains` → Regras de supervisão
3. `task_supervision_logs` → Histórico de supervisões
4. `user_interventions` → Comandos do usuário

### ENUMs (10)
- `communication_type`, `communication_priority`, `communication_status`
- `hierarchy_level`, `supervision_type`, `trigger_criteria`, `supervision_decision`
- `intervention_type`, `intervention_status`

### Views (6)
- `v_communications_pending` → Comunicações pendentes
- `v_communication_metrics` → Métricas de comunicação por persona
- `v_supervision_pending` → Supervisões pendentes
- `v_supervision_metrics` → Métricas de supervisão por persona
- `v_interventions_recent` → Últimas 100 intervenções
- `v_intervention_metrics_by_user` → Métricas por usuário

### Functions (6)
- `create_communication(...)` → Criar comunicação com validação
- `create_supervision_log(...)` → Criar log de supervisão
- `process_supervision_escalations()` → Processar escalações automáticas
- `create_user_intervention(...)` → Criar intervenção com validação
- `update_intervention_status(...)` → Atualizar status de intervenção
- `confirm_intervention_metrics(...)` → Confirmar métricas do mundo real

### Triggers (5)
- `communications_updated_at` → Atualiza timestamp automaticamente
- `supervision_chains_updated_at` → Atualiza timestamp automaticamente
- `supervision_logs_updated_at` → Atualiza timestamp automaticamente
- `supervision_logs_response_time` → Calcula tempo de resposta automaticamente
- `interventions_updated_at` → Atualiza timestamp automaticamente

---

## ✅ PRÓXIMOS PASSOS (Após Migrations)

Com as tabelas criadas, você poderá:

1. **Executar Scripts 04-05 V5.0:**
   ```bash
   cd AUTOMACAO
   node 04_generate_competencias_v5.js --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4
   node 05_generate_avatares_v5.js --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4
   ```

2. **Criar Script 06.5 (Matriz de Comunicação):**
   - Analisa atribuições + subsistemas
   - Gera pares (persona_A, persona_B, tipo_comunicacao)
   - Insere em `personas_communications` (inicialização)

3. **Criar Script 07.5 (Cadeias de Supervisão):**
   - Analisa nivel_hierarquico + bloco_funcional
   - Gera regras de supervisão
   - Insere em `task_supervision_chains`

4. **Testar Comunicações:**
   ```sql
   -- Exemplo de teste:
   SELECT create_communication(
     (SELECT id FROM personas WHERE nome_completo ILIKE '%marketing%' LIMIT 1),
     (SELECT id FROM personas WHERE nome_completo ILIKE '%vendas%' LIMIT 1),
     'handoff',
     'Teste de handoff',
     'Transferindo 10 leads qualificados...',
     '{"test": true}'::jsonb,
     'normal',
     true,
     NOW() + INTERVAL '24 hours'
   );
   ```

---

**Data de criação:** 07/12/2025  
**Versão:** 1.0  
**Autor:** GitHub Copilot (Claude Sonnet 4.5)
