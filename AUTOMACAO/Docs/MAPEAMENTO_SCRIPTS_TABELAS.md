# 📊 MAPEAMENTO COMPLETO: SCRIPTS → TABELAS

**Data:** 01/12/2025  
**Status:** LEVANTAMENTO OFICIAL COMPLETO

---

## 🎯 PADRÃO DEFINIDO

### Nomenclatura Obrigatória:
- **Tabela principal:** `personas`
- **Tabelas relacionadas:** `personas_*` (avatares, atribuicoes, biografias, competencias, etc.)
- **❌ NUNCA usar tabelas sem prefixo `personas_`** (ex: `competencias`, `atribuicoes`, `biografias`)

---

## 📋 TABELAS EXISTENTES NO BANCO

| Tabela | Registros | Status | Uso Correto |
|--------|-----------|--------|-------------|
| `personas` | 51 | ✅ ATIVA | Tabela principal |
| `personas_avatares` | 44 | ✅ ATIVA | Perfis visuais |
| `personas_atribuicoes` | 0 | ❌ VAZIA | DEVERIA ter atribuições |
| `personas_biografias` | 0 | ❌ VAZIA | DEVERIA ter biografias |
| `personas_competencias` | N/A | ❌ NÃO EXISTE | DEVERIA existir |
| `competencias` | 0 | ❌ INCORRETA | Nome errado, descartar |
| `atribuicoes` | N/A | ❌ NÃO EXISTE | - |
| `biografias` | N/A | ❌ NÃO EXISTE | - |

---

## 🔧 SCRIPTS PRINCIPAIS (Ordem de Execução)

### **00. Criar Placeholders**
📄 **Script:** `00_create_personas_from_structure.js`  
📊 **Tabelas usadas:**
- ✅ `personas` (INSERT) - cria registros base
- ✅ `empresas` (UPDATE) - atualiza total_personas

**Status:** ✅ CORRETO

---

### **00.5. Gerar Nomes Reais**
📄 **Script:** `00.5_generate_personas_names_grok.cjs`  
📊 **Tabelas usadas:**
- ✅ `personas` (UPDATE) - atualiza campo `full_name`
- ✅ `empresas` (SELECT) - busca configurações

**Status:** ✅ CORRETO

---

### **01. Gerar Avatares**
📄 **Script:** `00_generate_avatares_grok.cjs`  
📊 **Tabelas usadas:**
- ✅ `personas_avatares` (INSERT) - cria perfis visuais
- ✅ `personas` (UPDATE) - atualiza `system_prompt`
- ✅ `empresas` (SELECT) - busca dados

**Backup local:** `04_BIOS_PERSONAS_REAL/*.json`

**Status:** ✅ CORRETO

---

### **01.3. Gerar Imagens**
📄 **Script:** `01.3_generate_avatar_images.cjs`  
📊 **Tabelas usadas:**
- ✅ `personas_avatares` (UPDATE) - atualiza campo `avatar_url`
- ✅ `personas` (SELECT) - busca personas
- ✅ `empresas` (SELECT) - busca empresa

**Arquivos gerados:** `public/avatars/*.png`

**Status:** ✅ CORRETO

---

### **01.5. Gerar Biografias**
📄 **Script:** `01_generate_biografias_REAL.js`  
📊 **Tabelas usadas:**
- ⚠️ `personas` (UPDATE) - salva em campo JSONB `ia_config.biografia_estruturada`
- ✅ `empresas` (SELECT) - busca dados

**❌ PROBLEMA:** Deveria salvar em `personas_biografias` (tabela separada)  
**Status atual:** Salva em `personas.ia_config` (campo JSONB)

**Status:** ⚠️ PRECISA CORREÇÃO

---

### **01.7. Atribuições Contextualizadas**
📄 **Script:** `01.5_generate_atribuicoes_contextualizadas.cjs`  
📊 **Tabelas usadas:**
- ⚠️ `personas` (UPDATE) - salva em campo JSONB `ia_config.atribuicoes_especificas`
- ✅ `empresas` (SELECT) - busca dados

**❌ PROBLEMA:** Deveria salvar em `personas_atribuicoes` (tabela separada)  
**Status atual:** Salva em `personas.ia_config` (campo JSONB)

**Backup local:** Nenhum (só banco)

**Status:** ⚠️ PRECISA CORREÇÃO

---

### **02. Gerar Competências**
📄 **Script:** `02_generate_competencias_grok.cjs`  
📊 **Tabelas usadas:**
- ⚠️ `personas` (UPDATE) - salva em campo JSONB `ia_config.tarefas_metas`
- ✅ `empresas` (SELECT) - busca dados

**❌ PROBLEMA:** Deveria salvar em `personas_competencias` (tabela separada)  
**Status atual:** Salva em `personas.ia_config` (campo JSONB)

**Backup local:** `competencias_output/*.json`

**Status:** ⚠️ PRECISA CORREÇÃO

---

### **02.5. Análise de Automação**
📄 **Script:** `02.5_analyze_tasks_for_automation.js`  
📊 **Tabelas usadas:**
- (A verificar - não analisado ainda)

**Status:** ⏳ PENDENTE ANÁLISE

---

### **03. Workflows N8N**
📄 **Script:** `03_generate_n8n_from_tasks.js`  
📊 **Tabelas usadas:**
- (A verificar - não analisado ainda)

**Status:** ⏳ PENDENTE ANÁLISE

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **DADOS EM CAMPO JSONB AO INVÉS DE TABELAS SEPARADAS**

**Situação atual:**
```
personas.ia_config = {
  biografia_estruturada: {...},      // DEVERIA estar em personas_biografias
  atribuicoes_especificas: [...],    // DEVERIA estar em personas_atribuicoes
  tarefas_metas: {...},              // DEVERIA estar em personas_competencias
  biografia_updated_at: "...",
  atribuicoes_updated_at: "...",
  competencias_updated_at: "..."
}
```

**Impacto:**
- ❌ Dificulta queries SQL específicas
- ❌ Não segue padrão de nomenclatura
- ❌ Mistura dados de diferentes domínios
- ✅ Mais rápido (1 query ao invés de 4)
- ✅ Mantém atomicidade

---

### 2. **TABELAS CRIADAS MAS NÃO USADAS**

| Tabela | Status | Ação |
|--------|--------|------|
| `personas_atribuicoes` | Vazia | Criar ou dropar |
| `personas_biografias` | Vazia | Criar ou dropar |
| `competencias` | Vazia + nome errado | DROPAR |

---

### 3. **FALTA TABELA PERSONAS_COMPETENCIAS**

Não existe no banco, mas deveria existir se seguirmos o padrão.

---

## 🎯 DECISÕES NECESSÁRIAS

### Opção A: **MANTER EM ia_config** (Mais Rápido)

**Vantagens:**
- ✅ Já funciona
- ✅ Menos queries (1 ao invés de 4)
- ✅ Atomicidade garantida
- ✅ Sem necessidade de migrations

**Desvantagens:**
- ❌ Não segue padrão de nomenclatura
- ❌ Queries complexas em JSONB
- ❌ Dificulta análises SQL

**Ações:**
1. Dropar tabelas vazias: `personas_atribuicoes`, `personas_biografias`, `competencias`
2. Documentar que dados estão em `ia_config`
3. Atualizar README e documentação

---

### Opção B: **MIGRAR PARA TABELAS SEPARADAS** (Mais Correto)

**Vantagens:**
- ✅ Segue padrão de nomenclatura
- ✅ Queries SQL simples
- ✅ Melhor para análises
- ✅ Escalável

**Desvantagens:**
- ❌ Requer refatoração de 3 scripts
- ❌ Migration complexa (25 personas × 3 tipos de dados)
- ❌ Mais queries (joins necessários)
- ❌ Risco de perder dados na migração

**Ações:**
1. Criar tabela `personas_competencias`
2. Script de migração: `ia_config` → tabelas separadas
3. Atualizar 3 scripts para salvar em tabelas
4. Testar com 1 persona antes de migrar todas
5. Atualizar queries no frontend

---

## 📁 ESTRUTURA DE ARQUIVOS BACKUP

Todos os scripts salvam backup em JSON local:

```
AUTOMACAO/
├── 04_BIOS_PERSONAS_REAL/          # Avatares (perfis completos)
├── competencias_output/             # Competências
├── biografias_output/               # Biografias (se existir)
└── (outros outputs por script)
```

**✅ Backup local funciona INDEPENDENTE da decisão sobre banco**

---

## 🎯 RECOMENDAÇÃO FINAL

### 🥇 **OPÇÃO RECOMENDADA: B (Migrar para tabelas)**

**Justificativa:**
1. Projeto está em fase inicial (51 personas, dados de teste)
2. Padrão correto desde o início evita débito técnico
3. Facilita expansão futura (relatórios, APIs, integrações)
4. Melhor para trabalho em equipe (queries claras)

**Plano de ação:**
1. ✅ Criar tabelas faltantes (personas_competencias)
2. ✅ Script de migração de dados (com rollback)
3. ✅ Atualizar 3 scripts principais
4. ✅ Testar pipeline completo em empresa teste
5. ✅ Migrar dados de produção
6. ✅ Dropar tabelas erradas (competencias)
7. ✅ Atualizar documentação

**Prazo estimado:** 2-3 horas de trabalho

---

## 📞 PRÓXIMOS PASSOS

**Aguardando decisão:**
- [ ] Escolher Opção A ou B
- [ ] Autorizar início da implementação
- [ ] Definir empresa de teste (ou usar ARVA)

**Após decisão:**
- [ ] Executar plano escolhido
- [ ] Validar com testes
- [ ] Atualizar este documento como OFICIAL
