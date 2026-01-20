# Google AI Studio - Limites da Conta Free

## 📋 Resumo dos Limites (Novembro 2025)

### 🖼️ Geração de Imagens (Avatares)
**Modelo:** `gemini-2.5-flash-image` (Nano Banana 🍌)

| Métrica | Limite Free | Recomendação Segura |
|---------|-------------|---------------------|
| **RPM** (Requests por Minuto) | 1-2 | **1 a cada 2 minutos** |
| **RPD** (Requests por Dia) | ~100 (teórico) | **10-15 imagens/dia** |
| **Delay entre requests** | N/A | **120 segundos** |
| **Reset diário** | Meia-noite PT | ~04:00-05:00 AM (Brasil) |

⚠️ **IMPORTANTE:** O limite teórico é 100/dia, mas o Google aplica **throttling dinâmico** baseado na carga dos servidores. Na prática, contas Free são bloqueadas após 10-20 imagens.

### 💬 Geração de Texto (Chat/Assistente)
**Modelo:** `gemini-1.5-flash`

| Métrica | Limite Free | Recomendação Segura |
|---------|-------------|---------------------|
| **RPM** | 15-60 | **15 RPM** |
| **RPD** | 1.500 | 1.500 mensagens |
| **Delay entre requests** | N/A | **4 segundos** |
| **Contexto máximo** | 1M tokens | **30.000 tokens** por request |

✅ **Texto tem limites muito mais generosos** do que imagens.

---

## 🚨 Erros Comuns e Soluções

### Erro 429: Resource Exhausted
```
Error: 429 Resource Exhausted
```

**Causa:** Você atingiu o limite de requisições (por minuto ou por dia).

**Soluções:**
1. **Para Imagens:** Aguarde até o próximo dia (reset à meia-noite PT)
2. **Para Texto:** Implemente backoff de 60 segundos e tente novamente
3. **Definitivo:** Migre para API Key paga no Google AI Studio

### Erro: Quota Exceeded
```
Error: Quota for service 'generativelanguage.googleapis.com' has been exhausted
```

**Causa:** Limite diário atingido.

**Solução:** Aguarde reset do dia seguinte.

---

## 🛠️ Configurações dos Scripts VCM

### Script 00: Geração de Avatares
```javascript
DELAY_BETWEEN_REQUESTS = 120000  // 120 segundos (2 minutos)
MAX_DAILY_LIMIT = 15             // Máximo 15 personas por dia
MAX_RETRIES = 3                  // 3 tentativas com backoff
```

**Tempo estimado:**
- 15 personas = **~30 minutos** de execução

**Backoff strategy:**
- 1ª tentativa falhada: aguarda 60s
- 2ª tentativa falhada: aguarda 120s
- 3ª tentativa falhada: **aborta e recomenda executar amanhã**

### Script 01: Geração de Biografias
```javascript
DELAY_BETWEEN_REQUESTS = 4000    // 4 segundos
MAX_RPM = 15                     // 15 requests por minuto
```

**Tempo estimado:**
- 15 personas = **~1-2 minutos** de execução

### Script 01.5: Geração de Tarefas
```javascript
DELAY_BETWEEN_REQUESTS = 4000    // 4 segundos (texto)
```

**Tempo estimado:**
- 15 personas = **~1-2 minutos** de execução

---

## 📊 Comparação Free vs Pago

| Feature | Free | Pay-as-you-go |
|---------|------|---------------|
| **Imagens/dia** | 10-15 (prático) | Ilimitado |
| **Texto/dia** | 1.500 | Ilimitado |
| **RPM** | Limitado | Alto |
| **Throttling** | Sim (dinâmico) | Não |
| **Custo** | $0 | ~$0.002/request |

---

## 💡 Boas Práticas para Conta Free

### ✅ DO:
1. **Gere avatares em lotes pequenos** (5-10 por vez)
2. **Respeite os delays** (120s para imagens, 4s para texto)
3. **Execute scripts em horários de baixo tráfego** (madrugada nos EUA)
4. **Implemente backoff** para erros 429
5. **Monitore o consumo** e pare se atingir limite

### ❌ DON'T:
1. **Não tente gerar 50+ avatares de uma vez**
2. **Não reduza o delay abaixo de 120s para imagens**
3. **Não ignore erros 429** (você será bloqueado por mais tempo)
4. **Não use loops agressivos** sem delays

---

## 🔄 Estratégia de Migração para Produção

Quando seu sistema crescer e precisar gerar avatares para dezenas/centenas de personas:

### Opção 1: Usar OpenAI DALL-E (Pago)
- Melhor qualidade
- Sem throttling
- ~$0.02/imagem

### Opção 2: Google AI Studio Pago
- Migrar para API Key paga
- Limites muito maiores
- ~$0.002/request

### Opção 3: Usar avatares estáticos
- Biblioteca de avatares pré-gerados
- Sem custo de API
- Atribuir aleatoriamente às personas

---

## 📝 Logs de Execução

O script `00_generate_avatares.js` agora mostra:

```
🎭 SCRIPT 0 - GERAÇÃO DE AVATARES VIA LLM
==========================================
⚠️  LIMITES DO GOOGLE AI STUDIO FREE:
    - Máximo: 10-15 imagens/dia
    - Delay obrigatório: 120s entre requisições
    - Este script levará ~30 minutos para 15 personas
==========================================

⏱️  Processando 15 personas com delay de 120s entre cada
⏰ Tempo estimado total: 30 minutos

[1/15] Processando Sarah Johnson...
  🤖 Gerando avatar via LLM...
  ✅ Avatar LLM gerado: business - feminino
  ⏳ Aguardando 120s antes da próxima requisição...

[2/15] Processando Michael Johnson...
  🤖 Gerando avatar via LLM...
  ⚠️  Erro 429 (Rate Limit Google AI Free) - Tentativa 1/3
  ⏳ Aguardando 60s antes de tentar novamente...
  ✅ Avatar LLM gerado: formal - masculino
  ⏳ Aguardando 120s antes da próxima requisição...
```

---

## 🎯 Resumo para Desenvolvedores

**TL;DR:**
- Imagens: 120s de delay, máx 15/dia na Free
- Texto: 4s de delay, máx 1500/dia na Free
- Scripts VCM já ajustados para respeitar limites
- Erros 429 → aguardar ou executar amanhã
