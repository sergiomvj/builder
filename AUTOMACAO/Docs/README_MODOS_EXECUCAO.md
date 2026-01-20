# 📖 Guia de Modos de Execução dos Scripts

## 🎯 Visão Geral

Todos os scripts principais de automação do BuildCorp agora suportam **3 modos de execução** para máxima flexibilidade e eficiência.

---

## 🔄 Modos Disponíveis

### 1️⃣ **MODO INCREMENTAL** (Padrão) ⏭️

**Quando usar:** Uso diário, correção de falhas pontuais, adição de novas personas

```bash
node SCRIPT_NAME.cjs --empresaId=UUID
```

**O que faz:**
- ✅ Processa **apenas** items sem dados (personas sem nomes, sem imagens, sem atribuições, etc.)
- ✅ **Pula** automaticamente items já processados
- ✅ **Econômico**: Não gasta créditos LLM desnecessariamente
- ✅ **Rápido**: Processa só o necessário

**Exemplo de saída:**
```
⏭️  MODO INCREMENTAL: Processando apenas personas sem atribuições
⏭️  Pulando 24 personas que já têm atribuições
    Hans Weber, Emily Carter, Nathan Cole, Torvald Fisker, Soo-min Kim...

🎯 1 personas serão processadas
```

---

### 2️⃣ **MODO COMPLETO** 🔄

**Quando usar:** Atualizar prompts/lógica, substituir dados com nova versão

```bash
node SCRIPT_NAME.cjs --empresaId=UUID --all
```

**O que faz:**
- 🔄 **Substitui** dados de todas as personas
- 🔄 **NÃO limpa** dados anteriores (apenas sobrescreve)
- 🔄 Útil para aplicar novos prompts ou ajustes de lógica
- ⚠️ Gasta créditos LLM em todas as personas

**Exemplo de saída:**
```
🔄 MODO COMPLETO: Substituindo atribuições de todas personas

📋 Total de personas a processar: 25
```

---

### 3️⃣ **MODO FORÇA TOTAL** 🧹

**Quando usar:** Reset completo, problemas graves, mudança de estrutura

```bash
node SCRIPT_NAME.cjs --empresaId=UUID --force
```

**O que faz:**
- 🧹 **LIMPA TUDO** antes de começar
- 🧹 Remove todos os dados anteriores da empresa
- 🧹 Regenera tudo do zero
- ⚠️ **IRREVERSÍVEL** - usa com cautela!
- ⚠️ Gasta créditos LLM em todas as personas

**Exemplo de saída:**
```
🧹 MODO FORÇA TOTAL: Limpando TODAS as atribuições anteriores...
✅ Atribuições anteriores removidas (25 personas)

📋 Total de personas a processar: 25
```

---

## 📋 Scripts que Suportam os 3 Modos

| Script | Descrição | Incremental detecta |
|--------|-----------|---------------------|
| `00.5_generate_personas_names_grok.cjs` | Gera nomes reais | Personas com `[Placeholder` no nome |
| `01.3_generate_avatar_images.cjs` | Gera imagens fal.ai | Personas sem `avatar_url` |
| `01.5_generate_atribuicoes_contextualizadas.cjs` | Gera atribuições LLM | Personas com menos de 3 atribuições |

---

## 🖥️ Interface Web (UI)

Cada script tem **2 botões** na interface:

### Botão 1: **Executar / Re-executar** (Verde/Azul)
- Modo: **INCREMENTAL** (padrão)
- Ícone: ▶️ Play
- Tooltip: "Processa apenas o que falta"

### Botão 2: **Força Total** (Vermelho)
- Modo: **FORÇA TOTAL** (--force)
- Ícone: 🗑️ Lixeira
- Tooltip: "Limpa tudo e regenera do zero"

---

## 💡 Recomendações de Uso

### ✅ Use INCREMENTAL quando:
- Tiver 1-2 personas que falharam por erro de rede
- Adicionar novas personas à empresa
- Rodar scripts regularmente
- Economizar créditos LLM

### 🔄 Use COMPLETO quando:
- Atualizar prompts de todos os scripts
- Ajustar lógica de geração
- Melhorar qualidade dos dados existentes

### 🧹 Use FORÇA TOTAL quando:
- Tiver dados corrompidos ou inconsistentes
- Mudar estrutura de campos no banco
- Resetar empresa completamente
- Solucionar problemas graves

---

## 🔍 Como Verificar Resultados

### Modo Incremental
```bash
# Executar script
node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=abc123

# Verificar quantos foram processados
# Se todos já têm dados:
✅ Todas as personas já têm atribuições!
💡 Use --force para regenerar tudo ou --all para substituir existentes

# Se alguns faltam:
⏭️  Pulando 24 personas que já têm atribuições
🎯 1 personas serão processadas
```

### Logs Detalhados
Todos os scripts incluem:
- 📊 Contagem de personas processadas vs puladas
- ✅ Lista de sucessos
- ❌ Lista de erros com detalhes
- ⏱️ Tempo total de execução

---

## 🚨 Avisos Importantes

1. **Modo Força Total é IRREVERSÍVEL**
   - Confirme duas vezes antes de usar
   - Não há backup automático

2. **Créditos LLM**
   - Modo Incremental economiza créditos
   - Força Total gasta créditos em todas personas

3. **Tempo de Execução**
   - Incremental: Segundos a minutos (depende de quantos faltam)
   - Completo/Força: ~15-20 minutos para 25 personas

4. **Rate Limiting**
   - Scripts têm pause de 2s entre personas
   - Respeita limites da API Grok/OpenRouter

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs no terminal
2. Confirme variáveis de ambiente (`.env.local`)
3. Use modo incremental para reprocessar falhas
4. Reporte erros com output completo do terminal

---

**Última atualização:** Dezembro 2024  
**Versão:** BuildCorp 2.0
