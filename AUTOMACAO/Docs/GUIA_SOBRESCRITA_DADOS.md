# 🔄 Guia de Sobrescrita de Dados - Scripts de Automação

## 📋 Resumo Rápido

### ✅ O QUE VOCÊ PRECISA SABER

Quando você **roda um script pela segunda vez**, o comportamento depende do script:

| Script | Comportamento Padrão | Com `--force` |
|--------|---------------------|---------------|
| **00_generate_avatares.js** | ⚠️ Duplica dados em `avatares_personas` | ✅ Limpa tudo e regera |
| **01_generate_biografias_REAL.js** | ✅ Sobrescreve automaticamente | ✅ Sobrescreve (igual) |
| **01.5_generate_atribuicoes_contextualizadas.js** | ⚠️ Duplica atribuições | ✅ Limpa tudo e regera |

---

## 🎯 Comandos Recomendados

### 🟢 PRIMEIRA EXECUÇÃO (Dados Novos)
Use o comando normal:

```bash
# Script 00 - Avatares
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# Script 01 - Biografias
node 01_generate_biografias_REAL.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# Script 01.5 - Atribuições
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

### 🔴 SEGUNDA EXECUÇÃO (Regenerar Tudo)
**SEMPRE use `--force` para garantir dados limpos:**

```bash
# Script 00 - Avatares (RECOMENDADO --force)
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 --force

# Script 01 - Biografias (--force opcional, já sobrescreve)
node 01_generate_biografias_REAL.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# Script 01.5 - Atribuições (RECOMENDADO --force)
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 --force
```

---

## 🚨 Problemas e Soluções

### Problema 1: "Tenho avatares duplicados"
**Causa:** Rodou Script 00 múltiplas vezes sem `--force`

**Solução:**
```bash
# Limpar manualmente no Supabase SQL Editor
DELETE FROM avatares_personas 
WHERE persona_id IN (
  SELECT id FROM personas WHERE empresa_id = 'SEU_EMPRESA_ID'
);

# Ou rodar script com --force
node 00_generate_avatares.js --empresaId=SEU_ID --force
```

### Problema 2: "Tenho centenas de atribuições duplicadas"
**Causa:** Rodou Script 01.5 múltiplas vezes sem `--force`

**Solução:**
```bash
# Limpar manualmente no Supabase SQL Editor
DELETE FROM personas_atribuicoes 
WHERE persona_id IN (
  SELECT id FROM personas WHERE empresa_id = 'SEU_EMPRESA_ID'
);

# Ou rodar script com --force
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=SEU_ID --force
```

### Problema 3: "Quero manter versões antigas"
**Resposta:** Atualmente os scripts **NÃO suportam versionamento**. 

**Opções:**
1. **Backup manual antes de rodar:** Exporte tabela do Supabase
2. **Aguardar implementação de versionamento** (planejado para próxima versão)
3. **Usar flag --force conscientemente** sabendo que dados antigos serão perdidos

---

## ⚡ Fluxo de Trabalho Recomendado

### Cenário 1: Primeira Vez (Empresa Nova)
```bash
cd AUTOMACAO

# 1. Gerar avatares
node 00_generate_avatares.js --empresaId=NEW_ID
# ⏱️ ~30 minutos (15 personas com delay de 120s)

# 2. Gerar biografias
node 01_generate_biografias_REAL.js --empresaId=NEW_ID
# ⏱️ ~5 minutos

# 3. Gerar atribuições
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=NEW_ID
# ⏱️ ~1 minuto
```

### Cenário 2: Regenerar Tudo (Melhorar Qualidade)
```bash
cd AUTOMACAO

# ⚠️ SEMPRE use --force para evitar duplicatas

# 1. Limpar e regenerar avatares
node 00_generate_avatares.js --empresaId=EXISTING_ID --force

# 2. Regenerar biografias (já sobrescreve)
node 01_generate_biografias_REAL.js --empresaId=EXISTING_ID

# 3. Limpar e regenerar atribuições
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=EXISTING_ID --force
```

### Cenário 3: Atualizar Apenas Um Script
```bash
# Se quer regenerar apenas biografias (sem tocar avatares)
node 01_generate_biografias_REAL.js --empresaId=EXISTING_ID

# Se quer regenerar apenas atribuições
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=EXISTING_ID --force
```

---

## 📊 O Que Acontece com `--force`?

### Script 00 (Avatares)
```
SEM --force:
1. Verifica quais personas JÁ têm avatar
2. Gera avatar APENAS para quem não tem
3. ⚠️ Se rodar 2x, primeira execução já criou, segunda pula
4. ⚠️ MAS system_prompt é sempre sobrescrito

COM --force:
1. 🧹 DELETA todos os avatares da empresa
2. 🧹 LIMPA system_prompt de todas as personas
3. ✅ Gera avatares NOVOS para TODAS as personas
4. ✅ Gera system_prompts NOVOS
```

### Script 01.5 (Atribuições)
```
SEM --force:
1. Para cada persona, DELETA atribuições antigas dela
2. Insere novas atribuições
3. ⚠️ Se persona já tinha 10 atribuições, agora tem mais 10 (DUPLICA)

COM --force:
1. 🧹 DELETA TODAS as atribuições de TODAS as personas da empresa
2. ✅ Gera atribuições NOVAS para todas
3. ✅ Sem duplicatas
```

---

## 🛡️ Checklist de Segurança

Antes de rodar qualquer script pela segunda vez:

- [ ] **Backup:** Exportei tabelas do Supabase? (opcional mas recomendado)
- [ ] **Confirmar empresa:** Tenho certeza do `--empresaId`?
- [ ] **Uso correto de --force:**
  - [ ] Script 00: Vou usar `--force` para evitar duplicatas?
  - [ ] Script 01.5: Vou usar `--force` para evitar duplicatas?
- [ ] **Tempo disponível:** Tenho 30+ minutos para Script 00?
- [ ] **Limites API:** Já usei Google AI hoje? (limite: 15 requisições/dia)

---

## 🔍 Como Verificar Duplicatas

### Verificar Avatares Duplicados
```sql
-- No Supabase SQL Editor
SELECT persona_id, COUNT(*) as quantidade
FROM avatares_personas
GROUP BY persona_id
HAVING COUNT(*) > 1;
```

**Interpretação:**
- **Resultado vazio:** ✅ Sem duplicatas
- **Resultado com linhas:** ❌ Tem duplicatas! Use `--force` para limpar

### Verificar Atribuições Duplicadas
```sql
-- No Supabase SQL Editor
SELECT persona_id, COUNT(*) as quantidade
FROM personas_atribuicoes
GROUP BY persona_id
ORDER BY quantidade DESC;
```

**Interpretação:**
- **5-15 atribuições por persona:** ✅ Normal
- **50+ atribuições por persona:** ❌ Provavelmente duplicado! Use `--force`

---

## 💡 Perguntas Frequentes

### P: Por que Script 01 (biografias) não precisa de `--force`?
**R:** Porque ele usa `UPSERT` com `onConflict: 'persona_id'`. Isso significa que se a biografia já existe, ele **substitui automaticamente**. Scripts 00 e 01.5 usam `INSERT` simples, por isso podem duplicar.

### P: Perco meus dados se usar `--force`?
**R:** Sim, dados antigos são **deletados permanentemente**. Se quiser manter histórico, faça backup antes.

### P: Posso usar `--force` sempre por segurança?
**R:** **SIM!** É a forma mais segura de garantir dados limpos. O único "custo" é que leva mais tempo (regenera tudo).

### P: E se eu parar o script no meio?
**R:** Com `--force`, ele já deletou os dados antigos, então você terá dados **incompletos**. Precisará rodar novamente até o fim.

### P: Posso rodar scripts em paralelo?
**R:** **NÃO!** Especialmente Script 00 tem limite de API. Rode sempre **um por vez**, em ordem: 00 → 01 → 01.5

### P: Como sei se preciso usar `--force`?
**R:** Use quando:
- ✅ Já rodou o script antes
- ✅ Quer melhorar qualidade dos dados
- ✅ Viu duplicatas no banco
- ✅ Mudou prompt do LLM e quer regenerar

---

## 🎓 Exemplo Completo - Do Zero ao Final

```bash
# EMPRESA NOVA (primeira vez)
cd c:\Projetos\vcm_vite_react\AUTOMACAO

# Passo 1: Gerar avatares (primeira vez)
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
# ✅ 15 avatares criados

# Passo 2: Gerar biografias
node 01_generate_biografias_REAL.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
# ✅ 15 biografias criadas

# Passo 3: Gerar atribuições
node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
# ✅ ~100 atribuições criadas

# -------------------------------------------------------
# DIAS DEPOIS: Você quer melhorar os prompts e regenerar
# -------------------------------------------------------

# ERRADO (vai duplicar):
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
# ❌ Agora você tem 30 avatares (15 antigos + 15 novos)

# CORRETO (limpa e regera):
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 --force
# ✅ Deletou 30 antigos, criou 15 novos = 15 total
```

---

## 🔮 Próximas Melhorias (Roadmap)

### Em Planejamento:
1. **Versionamento Automático**
   - Coluna `version` em todas as tabelas
   - Flag `is_active` para marcar versão atual
   - Views que filtram automaticamente versão ativa

2. **Constraint UNIQUE**
   - `avatares_personas.persona_id` UNIQUE
   - Usar UPSERT em todos os scripts
   - Impossível criar duplicatas

3. **Modo --dry-run**
   - Simula execução sem salvar no banco
   - Mostra preview dos dados que seriam gerados

4. **Dashboard de Duplicatas**
   - Interface web para detectar e limpar duplicatas
   - Comparação lado a lado de versões
   - Rollback com um clique

---

## 📞 Suporte

**Dúvidas?**
- 📖 Leia: `DATA_OVERWRITE_ANALYSIS.md` (análise técnica completa)
- 🔍 Verifique: `DATA_CHAIN_VALIDATION.md` (validação de segurança)
- ✅ Execute: `validate_data_chain.js` (verificação automática)

**Problemas?**
1. Verifique duplicatas com queries SQL acima
2. Use `--force` para limpar e regenerar
3. Se persistir, delete manualmente via SQL

---

**✨ Regra de Ouro: Na dúvida, use `--force` para garantir dados limpos!**
