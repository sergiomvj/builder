# 🎭 Sistema de Fila para Geração de Avatares

## 📋 Visão Geral

Sistema inteligente de fila que gerencia a geração de avatares respeitando os limites do Google AI Studio Free, permitindo processar **qualquer quantidade de personas** de forma automática e resiliente.

## 🎯 Características

✅ **Fila Persistente** - Salva progresso em arquivo JSON  
✅ **Retomada Automática** - Continue de onde parou  
✅ **Respeita Limites** - 120s entre requests, máx 15/dia  
✅ **Retry Logic** - 3 tentativas com backoff  
✅ **Progress Tracking** - Acompanhe em tempo real  
✅ **Batch Processing** - Processa em lotes diários  

## 🚀 Como Usar

### 1. Inicializar Fila (Primeira Vez)

```bash
cd c:\Projetos\vcm_vite_react
node AUTOMACAO/avatar_queue_manager.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 --start
```

**O que acontece:**
- Busca todas as personas sem avatar
- Cria arquivo `avatar_queue.json` com a fila
- Inicia processamento do **primeiro lote (15 personas)**
- Tempo estimado: **~30 minutos**

### 2. Ver Status da Fila

```bash
node AUTOMACAO/avatar_queue_manager.js --status
```

**Mostra:**
```
📊 STATUS DA FILA DE AVATARES

============================================================
🏢 Empresa: 7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
📅 Criada em: 26/11/2025 14:30:00
⏰ Última execução: 26/11/2025 15:00:00

📊 Progresso: 15/60
✅ Completados: 15
❌ Falhas: 0
📋 Na fila: 45
```

### 3. Continuar Processamento (Dia Seguinte)

```bash
node AUTOMACAO/avatar_queue_manager.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 --start
```

**O script automaticamente:**
- Detecta fila existente
- Continua de onde parou
- Processa próximo lote de 15

### 4. Resetar Fila (Recomeçar)

```bash
node AUTOMACAO/avatar_queue_manager.js --reset
```

## 📊 Exemplo de Execução

```bash
🚀 PROCESSAMENTO DA FILA DE AVATARES

============================================================
📊 Total na fila: 60
✅ Já processados: 0
❌ Falhas: 0
🎯 Lote atual: até 15 personas
============================================================

[1/60] Sarah Johnson (CEO)
  🤖 Gerando avatar via Gemini...
  ✅ Avatar gerado com sucesso!
  ⏳ Aguardando 120s...

[2/60] Michael Johnson (CTO)
  🤖 Gerando avatar via Gemini...
  ✅ Avatar gerado com sucesso!
  ⏳ Aguardando 120s...

...

[15/60] John Smith (SDR Junior)
  🤖 Gerando avatar via Gemini...
  ✅ Avatar gerado com sucesso!

============================================================
📊 RELATÓRIO DA SESSÃO

✅ Sucessos: 15
❌ Falhas: 0
📋 Restantes na fila: 45
🎯 Progresso total: 15/60

💡 Execute novamente amanhã para processar os 45 restantes.
```

## 🗂️ Estrutura do Arquivo `avatar_queue.json`

```json
{
  "empresa_id": "7761ddfd-0ecc-4a11-95fd-5ee913a6dd17",
  "created_at": "2025-11-26T17:30:00.000Z",
  "last_run": "2025-11-26T18:00:00.000Z",
  "total_personas": 60,
  "processed": 15,
  "failed": 0,
  "queue": [
    {
      "id": "uuid-persona-16",
      "full_name": "Amanda Davis",
      "role": "Marketing Manager",
      "status": "pending",
      "attempts": 0,
      "last_attempt": null,
      "error": null
    }
  ],
  "completed": [
    {
      "id": "uuid-persona-1",
      "full_name": "Sarah Johnson",
      "role": "CEO",
      "status": "completed",
      "attempts": 1,
      "last_attempt": "2025-11-26T17:35:00.000Z",
      "error": null
    }
  ],
  "errors": []
}
```

## ⚙️ Configurações

```javascript
DELAY_BETWEEN_REQUESTS = 120000  // 120 segundos (2 minutos)
MAX_DAILY_BATCH = 15             // Máximo por dia
MAX_RETRIES = 3                  // Tentativas por persona
```

## 🔄 Fluxo de Trabalho para 60 Personas

**Dia 1:** 15 avatares (30min)  
**Dia 2:** 15 avatares (30min)  
**Dia 3:** 15 avatares (30min)  
**Dia 4:** 15 avatares (30min)  
**Total:** 4 dias, ~2 horas totais de processamento

## 🚨 Tratamento de Erros

### Erro 429 (Rate Limit)
```
⚠️ Limite diário atingido! Salvando progresso...

📊 SESSÃO INTERROMPIDA (Limite Diário)
✅ Processados hoje: 12
📅 Execute novamente amanhã para continuar
```

**Ação:** Script salva progresso e para. Execute novamente no dia seguinte.

### Erro em Persona Específica
```
[8/60] Thomas Anderson (HR Manager)
  🤖 Gerando avatar via Gemini...
  ⚠️ Erro (tentativa 1/3): Invalid JSON response
  ⏳ Aguardando 120s...
```

**Ação:** Tenta até 3x. Se falhar, marca como `failed` e continua.

## 💡 Dicas

### Para Processar Mais Rápido
Migre para Google AI Studio pago:
- Sem limite de 15/dia
- Sem throttling
- ~$0.002/request

### Para Evitar Interrupções
Execute em horários de baixo tráfego (madrugada EUA):
- 02:00-06:00 AM (horário de Brasília)
- Menor chance de throttling

### Monitoramento
Use `--status` frequentemente para acompanhar:
```bash
watch -n 300 "node AUTOMACAO/avatar_queue_manager.js --status"
```

## 📝 Logs e Backup

**Arquivo de Fila:**  
`AUTOMACAO/avatar_queue.json`

**Avatares Salvos:**  
- Banco: `avatares_personas` table
- Backup local: `04_BIOS_PERSONAS_REAL/[empresa]/avatar_*.json`

## 🎯 Casos de Uso

### Cenário 1: Startup com 15 personas
```bash
# Executa uma vez e termina
node AUTOMACAO/avatar_queue_manager.js --empresaId=UUID --start
```

### Cenário 2: Empresa com 100 personas
```bash
# Dia 1: primeiras 15
node AUTOMACAO/avatar_queue_manager.js --empresaId=UUID --start

# Dia 2: próximas 15
node AUTOMACAO/avatar_queue_manager.js --empresaId=UUID --start

# Repetir por 7 dias...
```

### Cenário 3: Adicionar novas personas depois
```bash
# Resetar e recriar fila (só pega quem não tem avatar)
node AUTOMACAO/avatar_queue_manager.js --reset
node AUTOMACAO/avatar_queue_manager.js --empresaId=UUID --start
```

## ✅ Vantagens sobre Script Original

| Feature | Script Original | Sistema de Fila |
|---------|----------------|-----------------|
| Respeita limites | ❌ Não (2s delay) | ✅ Sim (120s) |
| Limite diário | ❌ Ignora | ✅ Respeita (15) |
| Retomada | ❌ Recomeça do zero | ✅ Continua |
| Progresso | ❌ Perde se parar | ✅ Salvo em JSON |
| Grandes lotes | ❌ Falha | ✅ Processa em dias |
| Retry logic | ❌ Básico | ✅ 3 tentativas |

## 🎉 Resultado Final

Após todos os lotes:
```
🎉 FILA COMPLETA! Todos os avatares foram processados.

📊 ESTATÍSTICAS FINAIS:
✅ Total processado: 60/60
❌ Falhas permanentes: 0
⏱️ Tempo total: 4 dias (~2h de processamento)
🎯 Taxa de sucesso: 100%
```
