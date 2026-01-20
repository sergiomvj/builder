# 🔍 Implementação do LLM Health Check em Todos os Scripts

## 📋 O que foi criado

**Arquivo**: `llm_health_checker.cjs`
- Testa disponibilidade de LLMs antes de executar scripts
- **Ordem de prioridade**: Grok > OpenAI > Google AI
- Timeout de 5 segundos por teste
- Retorna o primeiro LLM que responder

## 🎯 Como Implementar em Cada Script

### 1. Importar no início do arquivo

```javascript
const { testLLMs, generateWithFallback } = require('./llm_health_checker.cjs');
```

### 2. Testar LLMs na função main (ANTES de processar personas)

```javascript
async function main() {
  // ... parsing de argumentos ...

  // ✅ TESTAR LLMs ANTES DE COMEÇAR
  const activeLLM = await testLLMs();
  if (!activeLLM) {
    console.error('❌ Nenhum LLM disponível. Script abortado.');
    process.exit(1);
  }

  // ... resto do código ...
}
```

### 3. Usar `generateWithFallback()` no lugar de chamadas diretas

**Antes:**
```javascript
const result = await model.generateContent(prompt);
const text = result.response.text();
```

**Depois:**
```javascript
const text = await generateWithFallback(activeLLM, prompt, {
  systemPrompt: 'Você é um especialista em...',
  temperature: 0.7,
  maxTokens: 2000
});
```

## 📝 Scripts que precisam ser atualizados

### ✅ Já implementado:
- [x] `08_generate_machine_learning.cjs`

### ⏳ Pendentes:
- [ ] `02_generate_biografias_COMPLETO.js`
- [ ] `03_generate_atribuicoes_contextualizadas.cjs`
- [ ] `04_generate_competencias_grok.cjs`
- [ ] `05_generate_avatares.js`
- [ ] `06_analyze_tasks_for_automation_v2.js`
- [ ] `07_generate_n8n_workflows.js`
- [ ] `09_generate_auditoria.cjs`

## 🎬 Output Esperado

```
🔍 Testando disponibilidade de LLMs...

  ✅ Grok: Operacional

✅ LLM ativo: GROK (x-ai/grok-beta)

🏢 Empresa ID: 3c3bee15-b3a4-4442-89e9-5859c06e7575
```

Ou se Grok falhar:

```
🔍 Testando disponibilidade de LLMs...

  ❌ Grok: Connection timeout
  ✅ OpenAI: Operacional

✅ LLM ativo: OPENAI (gpt-4o-mini)
```

## 🔧 Benefícios

1. **Resiliência**: Fallback automático entre LLMs
2. **Velocidade**: Detecta problemas em 5 segundos (não 60s+ por tentativa)
3. **Clareza**: Usuário sabe qual LLM está sendo usado
4. **Confiabilidade**: Scripts não falham por quota exceeded
5. **Prioridade**: Sempre tenta Grok primeiro (mais rápido e barato)

## 📊 Exemplo Completo - Script 08

Ver arquivo: `08_generate_machine_learning.cjs` (linhas 1-320)

## 🚀 Próximos Passos

1. Implementar em Script 02 (biografias) - PRIORIDADE ALTA
2. Implementar em Script 06 (automação) - PRIORIDADE ALTA  
3. Implementar nos demais scripts
4. Testar execução completa da cascata

---

**Nota**: O módulo `llm_health_checker.cjs` é CommonJS (`.cjs`) e funciona em todos os scripts, independentemente de serem `.js` ou `.cjs`.
