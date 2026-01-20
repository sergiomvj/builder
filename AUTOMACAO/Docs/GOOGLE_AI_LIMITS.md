# 🤖 Google AI (Gemini) - Limites e Otimização

## 📊 **Limites do Free Tier (Atualizado Nov 2024)**

### **Gemini 1.5 Flash** (Modelo Recomendado)
| Métrica | Limite Free | Custo se exceder |
|---------|-------------|------------------|
| **RPM** (Requests/minuto) | 15 | Bloqueio temporário |
| **RPD** (Requests/dia) | 1,500 | Bloqueio 24h |
| **Tokens/dia** | 1,000,000 | GRÁTIS (sem cobrança) |
| **Tokens/minuto** | ~32,000 | Bloqueio temporário |
| **Contexto máximo** | 1 milhão tokens | - |

### **Gemini 1.5 Pro** (Modelo Avançado)
| Métrica | Limite Free | Custo se exceder |
|---------|-------------|------------------|
| **RPM** | 2 | Muito restritivo |
| **RPD** | 50 | Muito restritivo |
| **Tokens/dia** | 50,000 | GRÁTIS |

**⚠️ IMPORTANTE:** Use **Gemini 1.5 Flash** para automação em larga escala!

---

## ✅ **Nossa Estratégia de Rate Limiting**

### **Configuração Atual (run_full_pipeline_optimized.js)**

```javascript
GEMINI_CONFIG = {
  DELAY_BETWEEN_CALLS: 4500ms,    // 4.5s = ~13 RPM (margem de segurança)
  BATCH_SIZE: 10,                  // 10 personas por batch
  DELAY_BETWEEN_BATCHES: 65000ms,  // 65s = pausa entre batches
  MODEL: 'gemini-1.5-flash'        // Melhor custo-benefício
}
```

### **Cálculos para 15 Personas (ARVA)**

| Métrica | Valor | Observação |
|---------|-------|------------|
| Tarefas por persona | ~5 | Média estimada |
| Total de chamadas LLM | ~75 | 15 personas × 5 tarefas |
| Tokens por tarefa | ~2,000 | Input (500) + Output (1,500) |
| **Total de tokens** | **~150,000** | **15% do limite diário** ✅ |
| **Tempo estimado** | **~30 minutos** | Com rate limiting seguro |
| Batches | 2 | 10 + 5 personas |

**✅ CONCLUSÃO:** Dentro dos limites! Pode executar com segurança.

---

## 🚀 **Como Executar**

### **Opção 1: Pipeline Otimizado (RECOMENDADO)**
```bash
cd C:\Projetos\vcm_vite_react\AUTOMACAO
node run_full_pipeline_optimized.js
```

**Vantagens:**
- ✅ Rate limiting automático
- ✅ Batches de 10 personas
- ✅ Pausa de 1 minuto entre batches
- ✅ Estimativas de tempo e tokens
- ✅ Recuperação de erros
- ✅ Contador de progresso

### **Opção 2: Execução Manual (Controle Total)**
```bash
# Para uma persona específica
node 02.5_analyze_tasks_for_automation.js \
  --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 \
  --personaId=UUID_DA_PERSONA \
  --llm=gemini

# Aguardar 4-5 segundos antes de executar a próxima persona
```

---

## ⚠️ **Códigos de Erro Comuns**

### **429 - Too Many Requests**
```
Error: 429 Resource has been exhausted
```
**Causa:** Excedeu 15 RPM  
**Solução:** Aguardar 60 segundos e tentar novamente

### **503 - Service Unavailable**
```
Error: 503 The model is overloaded
```
**Causa:** Servidores do Google sobrecarregados  
**Solução:** Aguardar 2-5 minutos

### **400 - Invalid Model**
```
Error: models/gemini-pro not found in v1beta
```
**Causa:** Modelo não disponível na API v1beta  
**Solução:** Usar `gemini-1.5-flash` em vez de `gemini-pro`

---

## 📈 **Monitoramento de Uso**

### **Durante a Execução**
O script `run_full_pipeline_optimized.js` exibe:
- ✅ Tarefas analisadas por persona
- 📊 Tokens usados (estimativa)
- ⏱️ Tempo decorrido
- 🔄 Progresso (X/15 personas)

### **Verificar Uso Real**
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique na sua API Key
3. Veja "Usage" → últimas 24h

---

## 🎯 **Otimizações Implementadas**

### **1. Modelo Correto**
- ❌ `gemini-pro` → Não disponível em v1beta
- ✅ `gemini-1.5-flash` → Rápido, barato, 15 RPM

### **2. Rate Limiting Conservador**
- 4.5s entre chamadas = **13 RPM** (margem de 2 RPM)
- Pausa de 65s entre batches
- Timeout de 3 minutos por persona

### **3. Batches Inteligentes**
- 10 personas por batch
- Pausa entre batches para "esfriar" o rate limit
- Recuperação automática de erros 429

### **4. Estimativas Precisas**
- Cálculo de tokens antes de executar
- Verificação se está dentro dos limites
- Alerta se ultrapassar 80% do limite diário

---

## 💡 **Boas Práticas**

### ✅ **FAÇA:**
1. Use `gemini-1.5-flash` para análise de tarefas
2. Execute o pipeline otimizado (run_full_pipeline_optimized.js)
3. Execute durante horários de baixo tráfego (madrugada UTC)
4. Monitore os logs em tempo real
5. Aguarde completar antes de executar novamente

### ❌ **NÃO FAÇA:**
1. Executar múltiplas instâncias do script simultaneamente
2. Reduzir o delay abaixo de 4 segundos
3. Usar `gemini-pro` (muito restritivo)
4. Interromper o script no meio (desperdício de chamadas)
5. Executar mais de 2x por dia (limite de 1500 RPD)

---

## 🔮 **Estimativas Futuras**

### **Cenário 1: 50 Personas**
- Chamadas: ~250
- Tokens: ~500,000 (50% do limite)
- Tempo: ~90 minutos
- **Status:** ✅ Viável

### **Cenário 2: 100 Personas**
- Chamadas: ~500
- Tokens: ~1,000,000 (100% do limite)
- Tempo: ~3 horas
- **Status:** ⚠️ Limite do dia

### **Cenário 3: 200+ Personas**
- **Status:** ❌ Dividir em 2 dias ou usar OpenAI

---

## 🆘 **Suporte e Troubleshooting**

### **Script travou?**
1. Verifique se não excedeu 15 RPM
2. Aguarde 2 minutos
3. Execute novamente (script retoma do ponto)

### **Erro 429 frequente?**
1. Aumente `DELAY_BETWEEN_CALLS` para 5000ms
2. Reduza `BATCH_SIZE` para 5
3. Verifique se outra aplicação está usando a mesma API key

### **Tokens insuficientes?**
- Free tier tem 1M tokens/dia GRÁTIS
- Se precisar mais: considere OpenAI GPT-4o-mini (mais barato)

---

## 📞 **Contatos Úteis**

- **Google AI Studio:** https://aistudio.google.com
- **Documentação:** https://ai.google.dev/docs
- **Status da API:** https://status.cloud.google.com/
- **Pricing:** https://ai.google.dev/pricing

---

**Última atualização:** 28 de novembro de 2024  
**Autor:** Sistema VCM - Virtual Company Manager
