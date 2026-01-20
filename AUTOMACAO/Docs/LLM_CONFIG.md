# 🤖 CONFIGURAÇÃO DE LLMs - REFERÊNCIA OFICIAL

**ÚLTIMA ATUALIZAÇÃO**: 3 de Dezembro de 2025

---

## ⚠️ IMPORTANTE - LEIA ANTES DE MODIFICAR CÓDIGO

Este arquivo contém as configurações **OFICIAIS** e **TESTADAS** dos LLMs.
**NÃO ALTERE** sem consultar este documento primeiro.

---

## 🎯 Grok (Prioridade 1)

### Endpoint Correto
```
https://openrouter.ai/x-ai/grok-4.1-fast:free
```

### Configuração OpenAI Client
```javascript
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://vcm.arvabot.com",
    "X-Title": "VCM - Virtual Company Manager"
  }
});
```

### Model String
```javascript
model: "x-ai/grok-4.1-fast:free"
```

### Variável de Ambiente
```
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 🤖 OpenAI (Prioridade 2)

### Endpoint
```
https://api.openai.com/v1
```

### Model String
```javascript
model: "gpt-4o-mini"
```

### Variável de Ambiente
```
OPENAI_API_KEY=sk-proj-...
```

---

## 🧠 Google AI / Gemini (Prioridade 3)

### Model String
```javascript
model: "gemini-2.0-flash-exp"
```

### Variável de Ambiente
```
GOOGLE_AI_API_KEY=AIza...
```

---

## 📋 Ordem de Prioridade (NUNCA ALTERAR)

1. **Grok** (`x-ai/grok-4.1-fast:free`) - Mais rápido e grátis
2. **OpenAI** (`gpt-4o-mini`) - Confiável, quota limitada
3. **Google AI** (`gemini-2.0-flash-exp`) - Fallback final

---

## 🔧 Arquivos que Usam Essas Configurações

- `llm_health_checker.cjs` ✅
- `02_generate_biografias_COMPLETO.js`
- `03_generate_atribuicoes_contextualizadas.cjs`
- `04_generate_competencias_grok.cjs`
- `05_generate_avatares.js`
- `06_analyze_tasks_for_automation_v2.js`
- `07_generate_n8n_workflows.js`
- `08_generate_machine_learning.cjs` ✅
- `09_generate_auditoria.cjs`

---

## ⚠️ ERROS COMUNS A EVITAR

### ❌ ERRADO
```javascript
model: "x-ai/grok-beta"  // Modelo antigo/inexistente
model: "grok-4.1-fast"   // Falta prefixo x-ai/
model: "x-ai/grok-4.1"   // Falta sufixo :free
```

### ✅ CORRETO
```javascript
model: "x-ai/grok-4.1-fast:free"
```

---

## 📝 Checklist de Implementação

Ao adicionar LLM em novo script:

- [ ] Importar `llm_health_checker.cjs`
- [ ] Chamar `testLLMs()` no início do `main()`
- [ ] Usar `generateWithFallback()` para chamadas
- [ ] Verificar modelo string: `x-ai/grok-4.1-fast:free`
- [ ] Testar com timeout de 5 segundos
- [ ] Adicionar logs de qual LLM está ativo

---

**LEMBRETE**: Se você está vendo este arquivo, é porque alguém (provavelmente a IA) esqueceu essa configuração. Consulte SEMPRE antes de alterar endpoints de LLM!
