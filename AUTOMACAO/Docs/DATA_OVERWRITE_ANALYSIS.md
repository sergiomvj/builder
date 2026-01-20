# 🔄 Análise de Sobrescrita de Dados - Scripts de Automação

## 📊 Status Atual dos Scripts

### ⚠️ **PROBLEMA IDENTIFICADO: COMPORTAMENTO INCONSISTENTE**

Cada script tem comportamento diferente em relação à sobrescrita de dados:

---

## 🔍 Análise Detalhada por Script

### Script 00: `00_generate_avatares.js` 
**Tabelas afetadas:** `avatares_personas`, `personas.system_prompt`

**Comportamento Atual:**
```javascript
// avatares_personas: INSERT simples (SEM upsert)
const { error: insertError } = await supabase
  .from('avatares_personas')
  .insert(avatarRecord);

// personas.system_prompt: UPDATE direto
const { error: updateError } = await supabase
  .from('personas')
  .update({ system_prompt: JSON.stringify(systemPrompt, null, 2) })
  .eq('id', persona.id);
```

**Status:** 🔴 **DUPLICA DADOS**
- ❌ Cada execução **adiciona novo registro** em `avatares_personas`
- ✅ System Prompt é sobrescrito corretamente (UPDATE)
- ⚠️ Sem controle de versão ou histórico

**Problema:**
- Se rodar 3x → terá 3 registros idênticos em `avatares_personas`
- FK pode permitir múltiplos avatares por persona
- Sem constraint UNIQUE em `persona_id`

---

### Script 01: `01_generate_biografias_REAL.js`
**Tabela afetada:** `personas_biografias`

**Comportamento Atual:**
```javascript
// UPSERT com onConflict
const { data, error } = await supabase
  .from('personas_biografias')
  .upsert(biografiaRecord, {
    onConflict: 'persona_id'
  })
  .select();
```

**Status:** ✅ **SOBRESCREVE CORRETAMENTE**
- ✅ Usa `upsert` com `onConflict: 'persona_id'`
- ✅ Substitui biografia existente
- ✅ Mantém 1 biografia por persona
- ⚠️ Sem versionamento histórico

**Comportamento:**
- Primeira execução → INSERT
- Segunda execução → UPDATE (substitui tudo)
- Terceira execução → UPDATE (substitui tudo novamente)

---

### Script 01.5: `01.5_generate_atribuicoes_contextualizadas.js`
**Tabela afetada:** `personas_atribuicoes`

**Comportamento Atual:**
```javascript
// INSERT em lote (SEM upsert)
const { error: insertError } = await supabase
  .from('personas_atribuicoes')
  .insert(records)
```

**Status:** 🔴 **DUPLICA DADOS**
- ❌ Cada execução **adiciona novos registros**
- ❌ Sem verificação de duplicatas
- ❌ Sem limpeza prévia
- ⚠️ Pode criar 100+ atribuições duplicadas

**Problema:**
- Atribuições são geradas via LLM → podem variar
- Se rodar 2x → terá versões diferentes misturadas
- Sem constraint UNIQUE

---

### Script 06: `06_generate_workplace_scenes.js`
**Tabelas afetadas:** `workplace_scenes` (quando implementado)

**Comportamento Atual:**
```javascript
// Apenas gera prompts em arquivos .txt e .json
// NÃO insere no banco ainda
```

**Status:** ⚪ **NÃO AFETA BANCO**
- ℹ️ Apenas gera arquivos locais
- ⚠️ Sobrescreve arquivos com mesmo timestamp improvável
- ✅ Sem impacto no banco de dados

---

## 🎯 Impacto Real da Sobrescrita

### Cenário 1: Rodar Script 00 três vezes
```
Execução 1:
- avatares_personas: 15 registros novos
- personas.system_prompt: 15 atualizados

Execução 2:
- avatares_personas: +15 registros DUPLICADOS (total: 30) ❌
- personas.system_prompt: 15 sobrescritos (total: 15) ✅

Execução 3:
- avatares_personas: +15 registros DUPLICADOS (total: 45) ❌
- personas.system_prompt: 15 sobrescritos (total: 15) ✅
```

### Cenário 2: Rodar Script 01 três vezes
```
Execução 1:
- personas_biografias: 15 registros novos

Execução 2:
- personas_biografias: 15 SOBRESCRITOS (total: 15) ✅

Execução 3:
- personas_biografias: 15 SOBRESCRITOS (total: 15) ✅
```

### Cenário 3: Rodar Script 01.5 três vezes
```
Execução 1:
- personas_atribuicoes: ~100 registros novos

Execução 2:
- personas_atribuicoes: +~100 DUPLICADOS (total: 200) ❌

Execução 3:
- personas_atribuicoes: +~100 DUPLICADOS (total: 300) ❌
```

---

## 🛡️ Soluções Propostas

### Solução 1: **Limpeza Prévia (DELETE before INSERT)**
Adicionar limpeza no início de cada script:

```javascript
// No início do Script 00
async function cleanupAvatares(empresaId) {
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);
  
  const personaIds = personas.map(p => p.id);
  
  await supabase
    .from('avatares_personas')
    .delete()
    .in('persona_id', personaIds);
  
  console.log('🧹 Avatares anteriores removidos');
}

// No início do Script 01.5
async function cleanupAtribuicoes(empresaId) {
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);
  
  const personaIds = personas.map(p => p.id);
  
  await supabase
    .from('personas_atribuicoes')
    .delete()
    .in('persona_id', personaIds);
  
  console.log('🧹 Atribuições anteriores removidas');
}
```

**Vantagens:**
- ✅ Garante dados limpos
- ✅ Simples de implementar
- ✅ Controle total sobre limpeza

**Desvantagens:**
- ❌ Perde histórico completamente
- ❌ Sem rollback se algo falhar

---

### Solução 2: **UPSERT com Constraint UNIQUE**
Modificar schema para usar UNIQUE constraints:

```sql
-- Para avatares_personas
ALTER TABLE avatares_personas 
ADD CONSTRAINT unique_avatar_per_persona 
UNIQUE (persona_id);

-- Para personas_atribuicoes (se fizer sentido)
ALTER TABLE personas_atribuicoes
ADD CONSTRAINT unique_atribuicao
UNIQUE (persona_id, categoria, titulo);
```

Depois modificar scripts:
```javascript
// Script 00
await supabase
  .from('avatares_personas')
  .upsert(avatarRecord, {
    onConflict: 'persona_id'
  });

// Script 01.5
await supabase
  .from('personas_atribuicoes')
  .upsert(records, {
    onConflict: 'persona_id,categoria,titulo'
  });
```

**Vantagens:**
- ✅ Garante unicidade no banco
- ✅ Comportamento consistente
- ✅ Seguro contra duplicatas

**Desvantagens:**
- ❌ Requer mudança no schema
- ❌ Pode quebrar se já houver duplicatas
- ⚠️ Precisa definir bem o que é "duplicata"

---

### Solução 3: **Sistema de Versionamento**
Adicionar versionamento com tabela de histórico:

```sql
-- Adicionar coluna version
ALTER TABLE avatares_personas ADD COLUMN version INT DEFAULT 1;
ALTER TABLE personas_atribuicoes ADD COLUMN version INT DEFAULT 1;

-- Marcar versão ativa
ALTER TABLE avatares_personas ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE personas_atribuicoes ADD COLUMN is_active BOOLEAN DEFAULT true;
```

Modificar scripts:
```javascript
// Desativar versões antigas
await supabase
  .from('avatares_personas')
  .update({ is_active: false })
  .eq('persona_id', personaId);

// Inserir nova versão
const version = existingVersions.length + 1;
await supabase
  .from('avatares_personas')
  .insert({ ...avatarRecord, version, is_active: true });
```

**Vantagens:**
- ✅ Mantém histórico completo
- ✅ Permite rollback
- ✅ Auditoria total

**Desvantagens:**
- ❌ Mais complexo
- ❌ Ocupa mais espaço
- ❌ Queries precisam filtrar `is_active = true`

---

### Solução 4: **Flag --force para Limpeza Opcional**
Adicionar parâmetro CLI para controlar sobrescrita:

```javascript
// Detectar flag --force
const forceClean = process.argv.includes('--force');

if (forceClean) {
  console.log('⚠️  Flag --force detectada: limpando dados anteriores...');
  await cleanupAvatares(empresaId);
} else {
  console.log('ℹ️  Modo incremental: verificando duplicatas...');
  // Pular personas que já têm avatar
}
```

**Uso:**
```bash
# Modo incremental (default)
node 00_generate_avatares.js --empresaId=xxx

# Modo force (limpa e regera tudo)
node 00_generate_avatares.js --empresaId=xxx --force
```

**Vantagens:**
- ✅ Flexibilidade máxima
- ✅ Não quebra comportamento existente
- ✅ Desenvolvedor escolhe comportamento

**Desvantagens:**
- ⚠️ Pode gerar confusão sobre qual usar
- ⚠️ Documentação clara é crítica

---

## 📋 Recomendação Final

### **Abordagem Híbrida Recomendada:**

1. **Imediato (Hotfix):**
   - ✅ Adicionar limpeza prévia nos Scripts 00 e 01.5
   - ✅ Adicionar flag `--force` para controle
   - ✅ Documentar comportamento no README

2. **Médio Prazo (Schema):**
   - ✅ Adicionar UNIQUE constraints onde faz sentido
   - ✅ Migrar Script 00 para usar UPSERT
   - ✅ Considerar se `personas_atribuicoes` deve permitir múltiplas ou não

3. **Longo Prazo (Versionamento):**
   - ✅ Implementar sistema de versões para auditoria
   - ✅ Adicionar `is_active` flag
   - ✅ Criar views que filtram automaticamente versão ativa

---

## 🔧 Código de Implementação Imediata

### Para Script 00:
```javascript
// Adicionar no início da função main(), antes do loop
async function cleanupAvatares(empresaId) {
  console.log('\n🧹 Limpando avatares anteriores...');
  
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);
  
  if (!personas || personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada');
    return;
  }
  
  const personaIds = personas.map(p => p.id);
  
  const { error } = await supabase
    .from('avatares_personas')
    .delete()
    .in('persona_id', personaIds);
  
  if (error) {
    console.error('❌ Erro ao limpar avatares:', error.message);
  } else {
    console.log(`✅ Avatares anteriores removidos (${personaIds.length} personas)`);
  }
}

// Detectar flag --force
const forceClean = process.argv.includes('--force');

if (forceClean) {
  console.log('⚠️  FLAG --force DETECTADA: Limpando dados anteriores...');
  await cleanupAvatares(empresaId);
}
```

### Para Script 01.5:
```javascript
async function cleanupAtribuicoes(empresaId) {
  console.log('\n🧹 Limpando atribuições anteriores...');
  
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);
  
  if (!personas || personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada');
    return;
  }
  
  const personaIds = personas.map(p => p.id);
  
  const { error } = await supabase
    .from('personas_atribuicoes')
    .delete()
    .in('persona_id', personaIds);
  
  if (error) {
    console.error('❌ Erro ao limpar atribuições:', error.message);
  } else {
    console.log(`✅ Atribuições anteriores removidas (${personaIds.length} personas)`);
  }
}

// Detectar flag --force
const forceClean = process.argv.includes('--force');

if (forceClean) {
  console.log('⚠️  FLAG --force DETECTADA: Limpando dados anteriores...');
  await cleanupAtribuicoes(empresaId);
}
```

---

## 📖 Documentação de Uso

### Comando Padrão (Incremental - pode duplicar)
```bash
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```
- ⚠️ **ATENÇÃO**: Pode criar duplicatas em `avatares_personas`
- ✅ System Prompt será sobrescrito (seguro)

### Comando Force (Limpa e Regera)
```bash
node 00_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 --force
```
- ✅ **RECOMENDADO**: Remove avatares antigos antes de gerar novos
- ✅ Garante dados limpos e consistentes
- ❌ Perde histórico de versões anteriores

---

## ✅ Checklist de Segurança

Antes de rodar qualquer script em produção:

- [ ] Fazer backup do banco de dados
- [ ] Verificar se há dados existentes: `SELECT COUNT(*) FROM avatares_personas;`
- [ ] Decidir se quer manter histórico ou sobrescrever
- [ ] Usar flag `--force` se quiser limpeza garantida
- [ ] Documentar qual abordagem foi usada
- [ ] Testar primeiro em empresa de teste (ARVA Tech)
- [ ] Validar resultados antes de continuar cascade

---

## 🎯 Conclusão

**Status Atual:** 🔴 **INSEGURO - Pode duplicar dados**

**Comportamento por Script:**
- Script 00 (avatares): 🔴 **DUPLICA**
- Script 01 (biografias): ✅ **SOBRESCREVE**
- Script 01.5 (atribuições): 🔴 **DUPLICA**
- Script 06 (workplace): ⚪ **SEM IMPACTO**

**Ação Requerida:** Implementar Solução 4 (Flag --force) + Documentação

**Próximo Passo:** Modificar scripts 00 e 01.5 com cleanup opcional
