# ⚡ SISTEMA AUTÔNOMO VCM - GUIA COMPLETO

## 🎯 Visão Geral

O **Sistema Autônomo VCM** é uma solução completa que usa **LLM (GPT-4)** para atribuir tarefas inteligentemente às personas das empresas virtuais. O sistema opera de forma **100% autônoma**, executando arbitragem de tarefas baseada em:

- **Análise contextual com LLM** das empresas e personas
- **Integração com 12 subsistemas** do VCM
- **Scheduler automático** para execução contínua
- **Arbitragem inteligente** baseada em cargo, competências e prioridades

## 🏗️ Arquitetura do Sistema

```
🤖 Sistema Autônomo VCM
├── 🧠 LLM Engine (GPT-4)
│   ├── Análise de contexto empresarial
│   ├── Geração de tarefas específicas
│   └── Priorização inteligente
│
├── ⏰ Scheduler Automático
│   ├── Execução a cada 2 horas (8h-18h)
│   ├── Arbitragem semanal (segunda-feira)
│   └── Limpeza automática de dados
│
├── 🔗 Integração Subsistemas
│   ├── Email Marketing
│   ├── CRM & Vendas  
│   ├── Redes Sociais
│   ├── Analytics & BI
│   └── 8 outros subsistemas
│
└── 💾 Banco de Dados
    ├── Supabase PostgreSQL
    ├── Logging automático
    └── Métricas de performance
```

## 🚀 Configuração e Instalação

### 1. Pré-requisitos

```bash
# Node.js 18+ instalado
node --version

# Variáveis de ambiente configuradas (.env)
VCM_SUPABASE_URL=sua_url_supabase
VCM_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key  
VCM_OPENAI_API_KEY=sua_openai_api_key
```

### 2. Instalação Automática

```powershell
# Executar configuração completa
node setup_autonomous_system.js

# Instalar dependências específicas
Copy-Item "package-autonomous.json" "package.json" -Force
npm install
```

### 3. Estrutura do Banco de Dados

```sql
-- Executar schema antes da primeira execução
psql -h host -U user -d database -f database-schema-tarefas.sql
```

## ⚡ Modos de Execução

### 🤖 Modo Autônomo (Contínuo)

```powershell
# Iniciar sistema autônomo (recomendado)
.\start_autonomous_vcm.ps1

# Ou diretamente
node autonomous_task_arbitrator.js
```

**O que acontece no modo autônomo:**
- ✅ Execução automática a cada 2 horas durante horário comercial
- ✅ Arbitragem especial toda segunda-feira para planejamento semanal  
- ✅ Limpeza automática de tarefas antigas
- ✅ Logging detalhado de todas as operações
- ✅ Monitoramento contínuo de empresas ativas

### 🎯 Modo Manual (Execução Única)

```powershell
# Executar arbitragem uma única vez
node autonomous_task_arbitrator.js --manual
# ou
npm run manual
```

## 🧠 Como Funciona a Arbitragem Inteligente

### 1. Análise Contextual com LLM

O sistema usa **GPT-4** para analisar cada empresa virtual:

```javascript
// Entrada para LLM
{
  empresa: "Nome da Empresa",
  setor: "Tecnologia", 
  personas: ["CEO", "CTO", "Marketing Manager"],
  contexto_temporal: "Segunda-feira, 09:00",
  subsistemas_disponíveis: ["crm", "email", "analytics", ...]
}

// Saída da LLM
{
  priorities: ["vendas", "marketing", "operações"],
  focus_subsystems: ["crm", "email", "social"],
  key_personas: ["Sales Manager", "Marketing Manager"],
  urgency_level: "high",
  reasoning: "É segunda-feira, foco em planejamento semanal..."
}
```

### 2. Geração de Tarefas Específicas

Para cada persona, o sistema gera tarefas personalizadas:

```javascript
// Exemplo de tarefa gerada para CEO
{
  title: "Revisar métricas estratégicas Q4",
  description: "Analisar KPIs de vendas, marketing e operações...",
  priority: "high",
  estimated_duration: 45,
  required_subsystems: ["analytics", "bi", "crm"],
  inputs_from: ["CFO", "Head of Sales"],
  outputs_to: ["Board de Diretores"],
  success_criteria: "Decisões estratégicas documentadas"
}
```

### 3. Mapeamento Subsistema → Persona

```javascript
const subsystemMapping = {
  'CEO': ['analytics', 'bi', 'financial'],
  'CTO': ['ai', 'analytics'],  
  'Marketing Manager': ['email', 'social', 'content'],
  'Sales Manager': ['crm', 'email', 'analytics'],
  'CFO': ['financial', 'analytics', 'bi']
}
```

## 📊 Monitoramento e Logs

### Sistema de Logs Automático

```bash
# Logs são salvos automaticamente em:
logs/autonomous_arbitrator.log

# Formato dos logs:
[INFO] 2024-11-16 09:00:15: 🏢 Processando empresa: TechCorp
[SUCCESS] 2024-11-16 09:01:20: ✅ 12 tarefas criadas para CEO
[WARNING] 2024-11-16 09:02:10: ⚠️ Nenhuma persona ativa para StartupAI
```

### Métricas Automáticas

O sistema coleta automaticamente:
- ✅ **Taxa de execução**: Quantas arbitragens foram concluídas
- ✅ **Tarefas criadas**: Total por empresa/persona/subsistema
- ✅ **Performance LLM**: Tempo de resposta e qualidade
- ✅ **Utilização subsistemas**: Quais são mais/menos usados
- ✅ **Erros e falhas**: Monitoramento proativo

## 🔄 Scheduler Automático Detalhado

### Configuração de Horários

```javascript
// Arbitragem regular (horário comercial)
'0 8,10,12,14,16,18 * * *' // A cada 2 horas das 8h às 18h

// Arbitragem semanal (segunda-feira)  
'0 7 * * 1' // Segunda-feira às 7h

// Limpeza de dados (diário)
'0 23 * * *' // Todo dia às 23h
```

### Lógica de Processamento

1. **Buscar empresas ativas** → Filtrar apenas empresas com `ativa: true`
2. **Buscar personas ativas** → Para cada empresa, buscar personas com `ativa: true`
3. **Análise LLM por empresa** → Contexto completo enviado para GPT-4
4. **Geração de tarefas por persona** → Tarefas específicas baseadas no cargo
5. **Persistência no banco** → Salvar no Supabase com metadata completa
6. **Logging detalhado** → Registro de toda operação

## 🛠️ Manutenção e Troubleshooting

### Comandos Úteis

```powershell
# Verificar status do sistema
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Verificar logs em tempo real
Get-Content -Path "logs\autonomous_arbitrator.log" -Wait

# Restart do sistema
taskkill /f /im node.exe
.\start_autonomous_vcm.ps1

# Teste de conexão rápida
node -e "console.log('Testando...'); require('./autonomous_task_arbitrator.js')"
```

### Problemas Comuns

**❌ "Erro ao conectar ao banco"**
```bash
Solução: Verificar variáveis VCM_SUPABASE_* no .env
```

**❌ "OpenAI API key inválida"**
```bash
Solução: Verificar OPENAI_API_KEY no .env e créditos na conta
```

**❌ "Nenhuma empresa ativa encontrada"**
```bash
Solução: Verificar se existem empresas com ativa=true no banco
```

**❌ "Scheduler não está executando"**
```bash
Solução: Verificar se processo Node.js está ativo e logs de erro
```

## 🎯 Personalização e Extensões

### Adicionando Novos Subsistemas

```javascript
// Em initializeSubsystems()
novo_subsistema: {
  name: 'Novo Sistema',
  capabilities: ['cap1', 'cap2'],
  dependencies: ['analytics'],
  personas: ['Cargo Específico']
}
```

### Customizando Templates LLM

```javascript
// Modificar prompts em analyzeCompanyContext() e generateTasksWithLLM()
const customPrompt = `
Seu prompt personalizado aqui...
Considere fatores específicos da sua empresa...
`;
```

### Alterando Frequência do Scheduler

```javascript
// Modificar em setupAutonomousScheduler()
cron.schedule('0 */1 * * *', async () => {
  // Executar a cada 1 hora ao invés de 2
});
```

## 📈 Métricas e Analytics

### Dashboard de Métricas (Próxima Fase)

O sistema está preparado para integração com dashboard React:

```tsx
// Componente de métricas em tempo real
<AutonomousMetricsDashboard 
  showRealTime={true}
  metricsInterval={5000}
  autoRefresh={true}
/>
```

### Dados Coletados Automaticamente

```sql
-- Queries úteis para análise
SELECT 
  COUNT(*) as total_tasks,
  priority,
  status
FROM persona_tasks 
WHERE created_by = 'autonomous_system'
GROUP BY priority, status;

-- Performance por subsistema
SELECT 
  jsonb_array_elements_text(required_subsystems) as subsystem,
  COUNT(*) as usage_count
FROM persona_tasks 
GROUP BY subsystem
ORDER BY usage_count DESC;
```

## 🚀 Próximos Passos para Modo Totalmente Autônomo

### 1. Deploy em Servidor

```bash
# Para executar 24/7, considere:
# - VPS/Cloud server (AWS, DigitalOcean, etc.)
# - PM2 para gerenciamento de processo
# - Docker para containerização
# - Monitoring com Grafana/Prometheus
```

### 2. Integração com Webhooks

```javascript
// Notificações automáticas via webhook
const webhook = {
  url: 'https://hooks.slack.com/your-webhook',
  events: ['task_created', 'arbitration_completed', 'error_occurred']
};
```

### 3. Machine Learning Avançado

```javascript
// Análise preditiva de cargas de trabalho
const mlPredictor = {
  predictTaskLoad: true,
  optimizeScheduling: true,
  autoAdjustPriorities: true
};
```

## ✅ Resultado Final

O **Sistema Autônomo VCM** oferece:

🎯 **Arbitragem 100% Automática** - Zero intervenção manual necessária  
🧠 **Inteligência com LLM** - Decisões contextuais inteligentes  
⏰ **Execução Contínua** - Funciona 24/7 com scheduler robusto  
📊 **Logging Completo** - Monitoramento total da operação  
🔗 **Integração Total** - 12 subsistemas VCM integrados  
🚀 **Escalabilidade** - Suporta múltiplas empresas virtuais  

**Status: SISTEMA TOTALMENTE AUTÔNOMO ✅**

---

### Comandos para Iniciar Agora:

```powershell
# 1. Configurar sistema
node setup_autonomous_system.js

# 2. Iniciar modo autônomo
.\start_autonomous_vcm.ps1

# 3. Monitorar logs
Get-Content -Path "logs\autonomous_arbitrator.log" -Wait
```

**O sistema agora opera completamente sozinho! 🤖✨**