# 🔄 Sistema de Retry Inteligente - Guia de Uso

## Visão Geral

Sistema que identifica e reprocessa **APENAS** registros que falharam, sem desperdiçar tempo/recursos reprocessando sucessos.

---

## 🎯 Características Principais

### 1. Detecção Automática de Falhas
- Analisa campos NULL ou ausentes
- Verifica existência de registros em tabelas relacionadas
- Mantém histórico de tentativas

### 2. Estratégias Inteligentes
- **Backoff Exponencial:** Aumenta delay entre tentativas
- **Limite de Tentativas:** Evita loops infinitos (padrão: 3x)
- **Histórico Persistente:** Salva tentativas em `retry_logs/`

### 3. Integração Simples
- Uso standalone via `retry_failed.js`
- Integração direta nos scripts via `RetryManager`

---

## 📋 Métodos de Uso

### Método 1: Script Standalone (Recomendado)

```bash
# Verificar falhas (apenas relatório)
node retry_failed.js --script=02_generate_biografias --empresaId=UUID --report

# Reprocessar falhas de um script específico
node retry_failed.js --script=02_generate_biografias --empresaId=UUID

# Reprocessar TODOS os scripts
node retry_failed.js --script=ALL --empresaId=UUID

# Com opções customizadas
node retry_failed.js \
  --script=02_generate_biografias \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --maxRetries=5 \
  --delay=3000 \
  --backoff=true
```

### Método 2: Integração Direta no Script

Adicionar ao final de cada script (exemplo: `02_generate_biografias_COMPLETO.js`):

```javascript
import { RetryManager } from './lib/retry_manager.js';

// ... código existente do script ...

async function main() {
  // ... processamento normal ...
  
  console.log('\n🔄 Verificando falhas para reprocessamento...');
  
  const retry = new RetryManager('02_generate_biografias', targetEmpresaId);
  const failed = await retry.identifyFailed();
  
  if (failed.length > 0) {
    console.log(`⚠️  ${failed.length} registros falharam`);
    console.log('💡 Execute: node retry_failed.js --script=02_generate_biografias --empresaId=' + targetEmpresaId);
  } else {
    console.log('✅ Nenhuma falha detectada!');
  }
}
```

---

## 🔍 Como Funciona

### Validações por Script

Cada script tem sua própria lógica de validação:

| Script | Validação |
|--------|-----------|
| **01_create_personas** | Verifica `persona_code`, `role`, `department` |
| **02_generate_biografias** | Verifica `full_name`, `email`, `experiencia_anos` + existência em `personas_biografias` |
| **03_generate_atribuicoes** | Verifica existência em `personas_atribuicoes` |
| **04_generate_competencias** | Verifica existência em `personas_competencias` |
| **05_generate_avatares** | Verifica existência em `personas_avatares` |
| **06_analyze_automation** | Verifica existência em `automation_opportunities` |
| **06.5_generate_communications** | Verifica se persona tem comunicações em `inter_persona_communications` |
| **07_generate_workflows** | Verifica existência em `personas_workflows` |
| **07.5_generate_supervision** | Verifica se persona está em `task_supervision_chains` |
| **08_generate_ml** | Verifica existência em `personas_ml_models` |
| **09_generate_auditoria** | Verifica existência em `personas_audit_logs` |

### Histórico de Tentativas

Estrutura do arquivo `retry_logs/{script}_{empresaId}_retries.json`:

```json
{
  "script": "02_generate_biografias",
  "empresa_id": "b356b561-cd43-4760-8377-98a0cc1463ad",
  "attempts": [
    {
      "timestamp": "2025-12-08T15:30:00.000Z",
      "total_to_retry": 5
    }
  ],
  "failed_items": {
    "persona-uuid-1": {
      "record_id": "persona-uuid-1",
      "record_name": "Executivo de Vendas 3",
      "attempts": 2,
      "last_error": "Todos os provedores LLM falharam",
      "history": [
        {
          "timestamp": "2025-12-08T15:30:05.000Z",
          "attempt": 1,
          "status": "failed",
          "error": "Timeout após 25s"
        },
        {
          "timestamp": "2025-12-08T15:35:10.000Z",
          "attempt": 2,
          "status": "failed",
          "error": "Todos os provedores LLM falharam"
        }
      ]
    }
  }
}
```

---

## 📊 Exemplo de Fluxo Completo

### Cenário: Script 02 teve 1 falha de 40 personas

```bash
# 1. Executar script normalmente
node 02_generate_biografias_COMPLETO.js --empresaId=UUID
# Output: ✅ 39 sucessos, ❌ 1 falha

# 2. Verificar falhas (opcional)
node retry_failed.js --script=02_generate_biografias --empresaId=UUID --report
# Output: 📋 1 falha detectada (Executivo de Vendas 3)

# 3. Reprocessar apenas a falha
node retry_failed.js --script=02_generate_biografias --empresaId=UUID
# Output:
# [1/1] 🔄 Reprocessando: Executivo de Vendas 3...
#   🤖 Tentando Grok 4.1 Fast...
#   ✅ Sucesso com Grok 4.1 Fast (18.3s)
#   ✅ Sucesso no reprocessamento
# 
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 RESULTADO DO REPROCESSAMENTO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ Sucessos: 1
# ❌ Falhas: 0
# ⏭️  Pulados: 0
# 📈 Taxa de sucesso: 100.0%

# 4. Verificar se ainda há falhas
node retry_failed.js --script=02_generate_biografias --empresaId=UUID --report
# Output: ✅ Nenhuma falha detectada!
```

---

## 🚀 Casos de Uso Avançados

### 1. Reprocessar Após Rate Limit

Se um script falhou por rate limit da API:

```bash
# Reprocessar com delay maior e backoff
node retry_failed.js \
  --script=02_generate_biografias \
  --empresaId=UUID \
  --delay=5000 \
  --backoff=true
```

### 2. Forçar Retry de Item Específico

```javascript
import { RetryManager } from './lib/retry_manager.js';

const retry = new RetryManager('02_generate_biografias', empresaId);

// Resetar histórico de uma persona específica
retry.resetItem('persona-uuid-123');

// Agora pode reprocessar mesmo que tenha ultrapassado max retries
```

### 3. Limpar Todo Histórico

```javascript
const retry = new RetryManager('02_generate_biografias', empresaId);
retry.resetAll(); // Limpa histórico completo
```

### 4. Obter Estatísticas

```javascript
const retry = new RetryManager('02_generate_biografias', empresaId);
const stats = retry.getStats();

console.log(stats);
// {
//   total_attempts: 2,
//   current_failures: 3,
//   permanent_failures: 1,
//   retriable_failures: 2,
//   last_attempt: "2025-12-08T15:30:00.000Z"
// }
```

---

## ⚡ Integração com Scripts Existentes

### Padrão Recomendado

Adicionar no final de cada script:

```javascript
// ============================================================================
// RETRY MANAGER - Detecção e Reprocessamento de Falhas
// ============================================================================

import { RetryManager } from './lib/retry_manager.js';

async function main() {
  // ... código existente ...
  
  // AO FINAL DO PROCESSAMENTO
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 VERIFICANDO FALHAS');
  console.log('═'.repeat(60) + '\n');
  
  try {
    const retry = new RetryManager('SCRIPT_NAME', targetEmpresaId);
    const failed = await retry.identifyFailed();
    
    if (failed.length > 0) {
      console.log(`⚠️  ${failed.length} registros com falha detectados\n`);
      console.log('💡 Para reprocessar, execute:');
      console.log(`   node retry_failed.js --script=SCRIPT_NAME --empresaId=${targetEmpresaId}\n`);
      
      retry.generateFailureReport();
    } else {
      console.log('✅ Todos os registros foram processados com sucesso!\n');
    }
  } catch (error) {
    console.error('⚠️  Erro ao verificar falhas:', error.message);
  }
}
```

---

## 🛠️ Próximos Passos

1. **Testar com LifeWayUSA:**
   ```bash
   node retry_failed.js \
     --script=02_generate_biografias \
     --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
     --report
   ```

2. **Implementar Funções de Reprocessamento:**
   - Editar `retry_failed.js`
   - Adicionar lógica específica em `PROCESSING_FUNCTIONS`
   - Para cada script que usa LLM

3. **Integrar em Todos os Scripts:**
   - Adicionar código de verificação no final de cada script 01-09

4. **Automatizar:**
   - Criar script `retry_all.sh` que checa e reprocessa todos os scripts automaticamente

---

## 📝 Checklist de Implementação

- [x] RetryManager criado (`lib/retry_manager.js`)
- [x] Script standalone criado (`retry_failed.js`)
- [x] Documentação completa
- [ ] Implementar funções de reprocessamento para todos os scripts
- [ ] Integrar verificação de falhas em todos os scripts 01-09
- [ ] Testar com LifeWayUSA (1 falha no Script 02)
- [ ] Criar wrapper para automação completa

---

## 🎯 Benefícios

✅ **Economia de Tempo:** Reprocessa apenas falhas (não refaz 39 sucessos)  
✅ **Economia de Custos:** Não faz chamadas LLM desnecessárias  
✅ **Rastreabilidade:** Histórico completo de tentativas  
✅ **Resiliência:** Backoff automático evita rate limits  
✅ **Auditável:** Logs JSON estruturados  
✅ **Escalável:** Funciona para todos os 11 scripts  
