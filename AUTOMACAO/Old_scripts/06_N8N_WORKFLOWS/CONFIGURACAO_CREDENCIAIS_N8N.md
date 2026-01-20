# 🔐 Guia de Configuração de Credenciais N8N

**Data:** 28/11/2025  
**Empresa:** ARVA Tech Solutions  
**Workflows gerados:** 5 workflows financeiros para Richard Garcia (Asst Fin)

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Supabase](#1-supabase)
3. [Google Sheets](#2-google-sheets)
4. [Gmail](#3-gmail)
5. [Slack](#4-slack)
6. [APIs Bancárias](#5-apis-bancárias-opcional)
7. [Importação dos Workflows](#6-importação-dos-workflows)
8. [Testes e Ativação](#7-testes-e-ativação)
9. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### ✅ Você precisa ter:
- [ ] Conta N8N (self-hosted ou cloud)
- [ ] Acesso admin ao N8N
- [ ] Conta Google Workspace ou Gmail
- [ ] Conta Supabase (já configurada: `fzyokrvdyeczhfqlwxzb.supabase.co`)
- [ ] Workspace Slack da empresa (opcional)
- [ ] APIs bancárias (opcional, para reconciliação)

### 📁 Workflows disponíveis:
```
AUTOMACAO/06_N8N_WORKFLOWS/
├── ARVATE49_Richard_Garcia_Preparao_do_relatrio_financeiro_semanal.json
├── ARVATE49_Richard_Garcia_Atualizao_diria_de_fluxo_de_caixa.json
├── ARVATE49_Richard_Garcia_Verificar_emails_de_atualizaes_financeiras.json
├── ARVATE49_Richard_Garcia_Anlise_mensal_de_custos_e_despesas.json
└── ARVATE49_Richard_Garcia_Reconciliao_bancria_semanal.json
```

---

## 1. 🗄️ Supabase

### Informações da Credencial
- **Nome da credencial no N8N:** `Supabase ARVATE49`
- **Tipo:** Supabase API
- **ID esperado nos workflows:** `supabase_ARVATE49`

### Passos de Configuração

#### 1.1. Obter credenciais do Supabase
1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/settings/api
2. Copie as seguintes informações:
   - **Project URL:** `https://fzyokrvdyeczhfqlwxzb.supabase.co`
   - **Anon/Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key:** (use com cuidado, full access)

#### 1.2. Configurar no N8N
1. No N8N, vá em: **Credentials** → **New** → **Supabase API**
2. Preencha:
   ```
   Name: Supabase ARVATE49
   Host: https://fzyokrvdyeczhfqlwxzb.supabase.co
   Service Role Secret: [Cole a Service Role Key do passo 1.1]
   ```
3. Clique em **Save**
4. ⚠️ **IMPORTANTE:** Edite o campo `id` da credencial para `supabase_ARVATE49` (se possível via JSON)

#### 1.3. Tabelas utilizadas pelos workflows
```sql
-- Tabelas acessadas:
- financial_data          (relatórios financeiros)
- cash_flow               (fluxo de caixa)
- expenses                (despesas)
- bank_transactions       (transações bancárias)
- automation_opportunities (metadados de automação)
- personas_workflows      (histórico de execuções)
```

#### 1.4. Verificar permissões
Execute no SQL Editor do Supabase:
```sql
-- Garantir que anon/service role tem acesso:
GRANT SELECT, INSERT, UPDATE ON financial_data TO anon, service_role;
GRANT SELECT, INSERT, UPDATE ON cash_flow TO anon, service_role;
GRANT SELECT, INSERT, UPDATE ON expenses TO anon, service_role;
GRANT SELECT, INSERT, UPDATE ON bank_transactions TO anon, service_role;
```

---

## 2. 📊 Google Sheets

### Informações da Credencial
- **Nome da credencial no N8N:** `Google Sheets ARVATE49`
- **Tipo:** Google Sheets OAuth2
- **ID esperado nos workflows:** `gsheets_ARVATE49`

### Passos de Configuração

#### 2.1. Criar projeto no Google Cloud Console
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto: **ARVA N8N Workflows**
3. Habilite as APIs:
   - **Google Sheets API**
   - **Google Drive API** (para acessar planilhas)

#### 2.2. Criar credenciais OAuth 2.0
1. No Google Cloud Console, vá em: **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Nome: **N8N Workflows ARVA**
5. Authorized redirect URIs:
   ```
   https://SEU_N8N_DOMAIN/rest/oauth2-credential/callback
   ```
   (substitua pelo domínio do seu N8N)
6. Copie:
   - **Client ID**
   - **Client Secret**

#### 2.3. Configurar no N8N
1. No N8N, vá em: **Credentials** → **New** → **Google Sheets OAuth2 API**
2. Preencha:
   ```
   Name: Google Sheets ARVATE49
   Client ID: [Cole do passo 2.2]
   Client Secret: [Cole do passo 2.2]
   ```
3. Clique em **Connect my account**
4. Autorize o acesso às planilhas
5. ⚠️ **IMPORTANTE:** Edite o campo `id` da credencial para `gsheets_ARVATE49`

#### 2.4. Criar planilhas necessárias
Crie as seguintes planilhas no Google Drive:
```
1. "Relatório Financeiro Semanal ARVA" (compartilhar com richard.garcia@arvabot.com)
2. "Fluxo de Caixa ARVA" (compartilhar com finance@arvatech.com)
3. "Análise de Custos ARVA" (compartilhar com finance@arvatech.com)
```

#### 2.5. Estrutura das planilhas
**Exemplo: Relatório Financeiro Semanal**
```
Sheet1:
| Data       | Receitas | Despesas | Lucro  | Categoria | Observações |
|------------|----------|----------|--------|-----------|-------------|
| 2025-11-28 | 50000    | 30000    | 20000  | Vendas    | ...         |
```

---

## 3. 📧 Gmail

### Informações da Credencial
- **Nome da credencial no N8N:** `Gmail ARVATE49`
- **Tipo:** Gmail OAuth2
- **ID esperado nos workflows:** `gmail_ARVATE49`

### Passos de Configuração

#### 3.1. Usar o mesmo projeto do Google Sheets
1. No Google Cloud Console (projeto criado no passo 2.1)
2. Habilite a API: **Gmail API**

#### 3.2. Configurar no N8N
1. No N8N, vá em: **Credentials** → **New** → **Gmail OAuth2 API**
2. Preencha:
   ```
   Name: Gmail ARVATE49
   Client ID: [Mesmo do Google Sheets, passo 2.2]
   Client Secret: [Mesmo do Google Sheets, passo 2.2]
   ```
3. Clique em **Connect my account**
4. Autorize o acesso ao Gmail
5. ⚠️ **IMPORTANTE:** Edite o campo `id` da credencial para `gmail_ARVATE49`

#### 3.3. Destinatários dos workflows
```
Workflow 1 (Relatório Financeiro): finance@arvatech.com
Workflow 2 (Fluxo de Caixa): finance@arvatech.com
Workflow 3 (Verificar Emails): richard.garcia@arvabot.com
Workflow 4 (Análise de Custos): finance@arvatech.com, ceo@arvatech.com
Workflow 5 (Reconciliação): finance@arvatech.com
```

#### 3.4. Templates de Email
Os workflows usam os seguintes templates:

**Relatório Financeiro:**
```
Assunto: Relatório Financeiro Semanal - {{ $now.format('DD/MM/YYYY') }}
Corpo:
Olá,

O relatório financeiro semanal foi atualizado automaticamente.

📊 Resumo:
- Receitas: R$ {{ $json.totalRevenue }}
- Despesas: R$ {{ $json.totalExpenses }}
- Lucro: R$ {{ $json.profit }}

Por favor, verifique o Google Sheets para detalhes completos.

Link: [URL da planilha]

Atenciosamente,
Sistema Automatizado ARVA
```

---

## 4. 💬 Slack

### Informações da Credencial
- **Nome da credencial no N8N:** `Slack ARVATE49`
- **Tipo:** Slack OAuth2
- **ID esperado nos workflows:** `slack_ARVATE49`

### Passos de Configuração

#### 4.1. Criar Slack App
1. Acesse: https://api.slack.com/apps
2. Clique em **Create New App** → **From scratch**
3. Nome: **ARVA Workflows Bot**
4. Workspace: Selecione o workspace da ARVA

#### 4.2. Configurar OAuth & Permissions
1. No app criado, vá em: **OAuth & Permissions**
2. Adicione os seguintes **Bot Token Scopes**:
   ```
   - chat:write          (enviar mensagens)
   - chat:write.public   (postar em canais públicos)
   - files:write         (anexar arquivos)
   - channels:read       (ler canais)
   - users:read          (ler usuários)
   ```
3. Em **Redirect URLs**, adicione:
   ```
   https://SEU_N8N_DOMAIN/rest/oauth2-credential/callback
   ```
4. Clique em **Install to Workspace**
5. Copie o **Bot User OAuth Token** (começa com `xoxb-`)

#### 4.3. Configurar no N8N
1. No N8N, vá em: **Credentials** → **New** → **Slack OAuth2 API**
2. Preencha:
   ```
   Name: Slack ARVATE49
   Access Token: [Cole o Bot User OAuth Token do passo 4.2]
   ```
3. Clique em **Save**
4. ⚠️ **IMPORTANTE:** Edite o campo `id` da credencial para `slack_ARVATE49`

#### 4.4. Criar canais Slack
Crie os seguintes canais:
```
#financeiro          (notificações financeiras gerais)
#alertas-workflows   (erros e alertas dos workflows)
#relatorios-auto     (relatórios automáticos)
```

#### 4.5. Adicionar o bot aos canais
1. Em cada canal, digite: `/invite @ARVA Workflows Bot`
2. Confirme a adição

---

## 5. 🏦 APIs Bancárias (Opcional)

### Informações da Credencial
- **Nome da credencial no N8N:** `Bank API ARVATE49`
- **Tipo:** HTTP Request (Generic Credentials)
- **ID esperado nos workflows:** `bankapi_ARVATE49`

### Passos de Configuração

#### 5.1. Obter credenciais do banco
Dependendo do banco, você precisará:
- **Open Banking Brasil:** Registrar aplicação no diretório de participantes
- **API proprietária:** Contatar o banco para acesso

Exemplos:
```
Banco do Brasil: https://developers.bb.com.br/
Itaú: https://developer.itau.com.br/
Bradesco: https://api.bradesco.com/
Santander: https://developer.santander.com.br/
```

#### 5.2. Configurar no N8N (exemplo com HTTP Request)
1. No N8N, vá em: **Credentials** → **New** → **HTTP Request Auth**
2. Preencha:
   ```
   Name: Bank API ARVATE49
   Authentication: Bearer Token ou OAuth2
   Token: [Cole o token da API bancária]
   Base URL: [URL da API do banco]
   ```
3. Headers adicionais (se necessário):
   ```
   Content-Type: application/json
   X-API-Key: [Se aplicável]
   ```

#### 5.3. Endpoints utilizados
```
GET /transactions      (buscar transações)
GET /balance          (consultar saldo)
POST /reconcile       (reconciliar transações)
```

⚠️ **NOTA:** A reconciliação bancária pode exigir integração customizada dependendo do banco.

---

## 6. 📥 Importação dos Workflows

### 6.1. Via Interface Web N8N

#### Método 1: Importar arquivo por arquivo
1. No N8N, clique em **Workflows** → **Import from File**
2. Selecione um arquivo JSON (ex: `ARVATE49_Richard_Garcia_Preparao_do_relatrio_financeiro_semanal.json`)
3. Clique em **Import**
4. O workflow será criado com status **Inactive**
5. Repita para os 5 workflows

#### Método 2: Importar via Copy/Paste
1. Abra o arquivo JSON em um editor de texto
2. Copie todo o conteúdo (Ctrl+A, Ctrl+C)
3. No N8N, clique em **Workflows** → **Import from URL/Text**
4. Cole o JSON e clique em **Import**

### 6.2. Via API N8N (bulk import)

Se você tem acesso à API do N8N:

```bash
# PowerShell script para importar todos os workflows
$N8N_API_URL = "https://SEU_N8N_DOMAIN/api/v1"
$N8N_API_KEY = "SEU_API_KEY"

$workflows = Get-ChildItem "C:\Projetos\vcm_vite_react\AUTOMACAO\06_N8N_WORKFLOWS\ARVATE49_*.json"

foreach ($workflow in $workflows) {
    $json = Get-Content $workflow.FullName -Raw
    
    $headers = @{
        "X-N8N-API-KEY" = $N8N_API_KEY
        "Content-Type" = "application/json"
    }
    
    Invoke-RestMethod -Uri "$N8N_API_URL/workflows" `
        -Method POST `
        -Headers $headers `
        -Body $json
    
    Write-Host "✅ Importado: $($workflow.Name)"
}
```

### 6.3. Verificar credenciais após importação

Após importar, **cada workflow mostrará avisos de credenciais faltantes**:

```
⚠️ Credential "supabase_ARVATE49" not found
⚠️ Credential "gsheets_ARVATE49" not found
⚠️ Credential "gmail_ARVATE49" not found
⚠️ Credential "slack_ARVATE49" not found
```

**Para corrigir:**
1. Abra cada workflow
2. Clique nos nós com avisos (ícone ⚠️)
3. Na aba **Credentials**, selecione a credencial correspondente criada nas seções anteriores
4. Se o nome não corresponder exatamente, atualize manualmente
5. Clique em **Save**

---

## 7. ✅ Testes e Ativação

### 7.1. Testar cada workflow individualmente

#### Workflow 1: Preparação do relatório financeiro semanal
```
1. Abrir workflow no N8N
2. Verificar nós:
   - Trigger (Cron): configurado para segunda-feira 9h
   - Supabase: testando query (botão "Execute Node")
   - Google Sheets: verificando conexão
   - Gmail: enviando email de teste
   - Slack: postando no #relatorios-auto
3. Clicar em "Execute Workflow" (botão de play no topo)
4. Verificar execução completa (todos os nós verdes ✅)
5. Confirmar:
   - Dados inseridos no Google Sheets
   - Email recebido
   - Mensagem no Slack
```

#### Workflow 2: Atualização diária de fluxo de caixa
```
1. Trigger: Cron diário às 8h
2. Supabase: buscar transações do dia
3. Google Sheets: atualizar planilha de fluxo
4. Teste completo: "Execute Workflow"
```

#### Workflow 3: Verificar e-mails de atualizações financeiras
```
1. Trigger: Cron a cada 2 horas
2. Gmail: ler emails da caixa de entrada
3. Function: filtrar emails relevantes (palavras-chave: "fatura", "pagamento", "nota fiscal")
4. Slack: notificar #financeiro com resumo
```

#### Workflow 4: Análise mensal de custos e despesas
```
1. Trigger: Cron mensal (dia 1 às 10h)
2. Supabase: buscar despesas do mês anterior
3. Function: calcular totais por categoria
4. Google Sheets: gerar relatório mensal
5. Gmail: enviar para finance + ceo
```

#### Workflow 5: Reconciliação bancária semanal
```
1. Trigger: Cron semanal (sexta-feira 17h)
2. Bank API: buscar transações do banco
3. Supabase: buscar transações registradas
4. Function: comparar e identificar discrepâncias
5. Gmail: enviar relatório de divergências
```

### 7.2. Ativar workflows em produção

Após testes bem-sucedidos:

```
1. No N8N, abra cada workflow
2. Clique no toggle "Active" (canto superior direito)
3. Confirmar que o status mudou para "Active" (verde)
4. Verificar na lista de workflows que todos estão ativos
```

### 7.3. Monitorar execuções

#### Via Interface N8N:
1. **Executions** → Visualizar histórico de execuções
2. Filtrar por workflow, status (success/error), data
3. Clicar em cada execução para ver detalhes completos

#### Via Supabase (tabela personas_workflows):
```sql
SELECT 
    workflow_name,
    status,
    last_execution_at,
    total_executions,
    success_count,
    error_count,
    avg_execution_time
FROM personas_workflows
WHERE persona_id = '20ae86c4-137e-412f-9c35-99fd7ce11ebf'
ORDER BY last_execution_at DESC;
```

#### Via Slack (#alertas-workflows):
Todos os workflows têm um nó de erro que posta no Slack em caso de falha.

---

## 8. 🔧 Troubleshooting

### Problema: "Credential not found"
**Solução:**
1. Verificar se o nome da credencial corresponde exatamente ao ID no JSON
2. Opção 1: Renomear credencial no N8N
3. Opção 2: Editar workflow e selecionar credencial correta manualmente

### Problema: "Supabase query failed"
**Solução:**
1. Verificar se as tabelas existem:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('financial_data', 'cash_flow', 'expenses');
   ```
2. Criar tabelas faltantes (se necessário)
3. Verificar permissões RLS (Row Level Security)
4. Testar query manualmente no SQL Editor do Supabase

### Problema: "Google Sheets permission denied"
**Solução:**
1. Re-autorizar credencial OAuth2 no N8N
2. Verificar se a planilha está compartilhada com a conta do OAuth
3. Verificar se a API do Google Sheets está habilitada no Google Cloud Console

### Problema: "Gmail send failed"
**Solução:**
1. Verificar quota da API (Gmail tem limite de ~100 emails/dia por conta gratuita)
2. Verificar se o endereço de destino está correto
3. Re-autorizar credencial OAuth2
4. Verificar se a conta Gmail não está bloqueada por atividade suspeita

### Problema: "Slack message failed"
**Solução:**
1. Verificar se o bot está adicionado ao canal
2. Verificar scopes do bot (chat:write, chat:write.public)
3. Re-instalar o app no workspace
4. Testar com ID do canal explícito (ex: `C12345ABCD`) ao invés do nome

### Problema: "Workflow execution timeout"
**Solução:**
1. Aumentar timeout no N8N settings (default: 120s)
2. Otimizar queries (adicionar índices no Supabase)
3. Dividir workflow em etapas menores
4. Usar "Wait" node para processar em lotes

### Problema: "Cron não disparou no horário esperado"
**Solução:**
1. Verificar timezone do N8N (deve ser `America/Sao_Paulo`)
2. Verificar expressão cron:
   ```
   0 9 * * 1    = Segunda-feira às 9h
   0 8 * * *    = Todo dia às 8h
   0 10 1 * *   = Dia 1 de cada mês às 10h
   0 17 * * 5   = Toda sexta às 17h
   ```
3. Testar com "Execute Workflow" manualmente primeiro

---

## 📊 Checklist Final de Configuração

### Credenciais
- [ ] Supabase ARVATE49 configurada e testada
- [ ] Google Sheets ARVATE49 configurada e autorizada
- [ ] Gmail ARVATE49 configurada e autorizada
- [ ] Slack ARVATE49 configurada e bot adicionado aos canais
- [ ] Bank API ARVATE49 configurada (se aplicável)

### Planilhas Google Sheets
- [ ] "Relatório Financeiro Semanal ARVA" criada e compartilhada
- [ ] "Fluxo de Caixa ARVA" criada e compartilhada
- [ ] "Análise de Custos ARVA" criada e compartilhada
- [ ] Headers configurados nas planilhas

### Canais Slack
- [ ] #financeiro criado
- [ ] #alertas-workflows criado
- [ ] #relatorios-auto criado
- [ ] Bot ARVA Workflows adicionado aos 3 canais

### Workflows Importados
- [ ] Workflow 1: Preparação do relatório financeiro semanal (importado e testado)
- [ ] Workflow 2: Atualização diária de fluxo de caixa (importado e testado)
- [ ] Workflow 3: Verificar e-mails de atualizações financeiras (importado e testado)
- [ ] Workflow 4: Análise mensal de custos e despesas (importado e testado)
- [ ] Workflow 5: Reconciliação bancária semanal (importado e testado)

### Workflows Ativos
- [ ] Workflow 1 ativo (trigger: segunda 9h)
- [ ] Workflow 2 ativo (trigger: diário 8h)
- [ ] Workflow 3 ativo (trigger: a cada 2h)
- [ ] Workflow 4 ativo (trigger: mensal dia 1 10h)
- [ ] Workflow 5 ativo (trigger: sexta 17h)

### Monitoramento
- [ ] Dashboard N8N configurado para mostrar execuções
- [ ] Alertas Slack funcionando para erros
- [ ] Tabela personas_workflows no Supabase registrando execuções
- [ ] Emails de notificação chegando corretamente

---

## 📞 Suporte

### Documentação Oficial
- **N8N:** https://docs.n8n.io/
- **Supabase:** https://supabase.com/docs
- **Google Sheets API:** https://developers.google.com/sheets/api
- **Gmail API:** https://developers.google.com/gmail/api
- **Slack API:** https://api.slack.com/

### Logs e Debugging
- **N8N Logs:** `Settings → Log Streaming`
- **Supabase Logs:** Dashboard → Logs
- **Executions History:** N8N → Executions (filtrar por workflow)

### Contatos
- **Sistema VCM:** richard.garcia@arvabot.com
- **Financeiro ARVA:** finance@arvatech.com
- **Suporte Técnico:** dev@arvatech.com

---

**✅ Configuração completa!** Seus workflows estão prontos para automatizar 71% das tarefas financeiras do Richard Garcia.

**Tempo economizado estimado:** ~15 horas/semana por persona.
