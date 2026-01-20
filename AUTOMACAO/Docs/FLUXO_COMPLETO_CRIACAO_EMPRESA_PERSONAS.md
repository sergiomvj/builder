# 🏢 FLUXO COMPLETO: CRIAÇÃO DE EMPRESA → PERSONAS → DADOS LLM

**Data:** 1 de Dezembro de 2025  
**Status:** ✅ Documentação Completa  
**Objetivo:** Mapear TODO o processo desde criação da empresa até dados finais

---

## 📊 VISÃO GERAL DA CASCATA COMPLETA

```
FASE 1: CRIAÇÃO DA EMPRESA (Frontend)
  ↓
FASE 2: CRIAÇÃO DE PLACEHOLDERS (Script 00_create)
  ↓
FASE 3: GERAÇÃO DE BIOGRAFIAS (Script 01)
  ↓
FASE 4: GERAÇÃO DE ATRIBUIÇÕES (Script 01.5)
  ↓
FASE 5: GERAÇÃO DE COMPETÊNCIAS (Script 02)
  ↓
FASE 6: GERAÇÃO DE AVATARES (Script 00_avatares)
```

---

## 🎯 FASE 1: CRIAÇÃO DA EMPRESA (Frontend)

### Componente: `src/components/company-form.tsx`

#### 📝 Dados Coletados do Usuário:

```typescript
{
  // DADOS BÁSICOS
  nome: "ARVA Tech Solutions",
  codigo: "ARVA",
  industria: "tecnologia",
  dominio: "arvabot.com",
  descricao: "Empresa de IA e automação...",
  pais: "BR",
  status: "ativa",
  
  // ESTRUTURA ORGANIZACIONAL (Manual ou via IA)
  ceo_gender: "feminino",
  executives_male: 2,
  executives_female: 2,
  assistants_male: 2,
  assistants_female: 3,
  specialists_male: 3,
  specialists_female: 3,
  
  // NACIONALIDADES (Distribuição percentual)
  nationalities: [
    { tipo: "americanos", percentual: 40 },
    { tipo: "brasileiros", percentual: 30 },
    { tipo: "europeus", percentual: 20 },
    { tipo: "asiaticos", percentual: 10 }
  ],
  
  // IDIOMAS
  idiomas: ["Português", "Inglês", "Espanhol"]
}
```

#### 🤖 Opção: Gerar Estrutura com IA (OpenAI)

**Função:** `gerarEstruturaOrganizacional()`  
**Modelo:** Gemini 2.0 Flash (via OpenRouter)  
**Input:**
```typescript
{
  nome: "ARVA Tech Solutions",
  descricao: "Empresa de IA e automação",
  industria: "tecnologia",
  porte: "medio",
  pais: "BR"
}
```

**Output:**
```json
{
  "departamentos": [
    {
      "nome": "Executivo",
      "cargos": ["CEO", "CTO", "CFO"]
    },
    {
      "nome": "Tecnologia",
      "cargos": ["Tech Lead", "Senior Engineer", "DevOps Engineer"]
    }
  ],
  "total_posicoes": 15
}
```

**Conversão:** `converterParaCargosNecessarios()`
```javascript
['CEO', 'CTO', 'CFO', 'Tech Lead', 'Senior Engineer', 'DevOps Engineer', ...]
```

#### 💾 Salvamento no Banco (Tabela `empresas`):

```json
{
  "id": "7761ddfd-0ecc-4a11-95fd-5ee913a6dd17",
  "nome": "ARVA Tech Solutions",
  "codigo": "ARVA",
  "industria": "tecnologia",
  "dominio": "arvabot.com",
  "descricao": "...",
  "pais": "BR",
  "cargos_necessarios": ["CEO", "CTO", "CFO", ...], // 15 cargos
  "nationalities": [
    {"tipo": "americanos", "percentual": 40},
    {"tipo": "brasileiros", "percentual": 30},
    {"tipo": "europeus", "percentual": 20},
    {"tipo": "asiaticos", "percentual": 10}
  ],
  "idiomas": ["Português", "Inglês", "Espanhol"],
  "equipe_gerada": false, // ❗ IMPORTANTE
  "total_personas": 15,
  "scripts_status": {
    "create_personas": false,
    "avatares": false,
    "biografias": false,
    "atribuicoes": false,
    "competencias": false
  }
}
```

**✅ RESULTADO:** Empresa criada com estrutura definida, **SEM personas ainda**

---

## 👥 FASE 2: CRIAÇÃO DE PLACEHOLDERS DE PERSONAS

### Script: `AUTOMACAO/00_create_personas_from_structure.js`

#### Comando:
```bash
cd AUTOMACAO
node 00_create_personas_from_structure.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

#### 📋 Processo Detalhado:

##### 1. **Buscar Empresa**
```javascript
const { data: empresa } = await supabase
  .from('empresas')
  .select('*')
  .eq('id', targetEmpresaId)
  .single();

// Valida que empresa.equipe_gerada === false
if (empresa.equipe_gerada) {
  throw new Error('Empresa já tem equipe gerada!');
}
```

##### 2. **Distribuir Nacionalidades**

**Input:**
- `cargos_necessarios`: `['CEO', 'CTO', 'CFO', 'Tech Lead', ...]` (15 cargos)
- `nationalities`: `[{tipo: 'americanos', percentual: 40}, ...]`

**Função:** `distribuirNacionalidades(cargos, nacionalidades)`

**Algoritmo:**
```javascript
// Total: 15 cargos
// 40% americanos = 6 personas
// 30% brasileiros = 5 personas
// 20% europeus = 3 personas
// 10% asiáticos = 1 persona

const distribuicao = [
  { cargo: 'CEO', nacionalidade: 'americanos' },
  { cargo: 'CTO', nacionalidade: 'americanos' },
  { cargo: 'CFO', nacionalidade: 'brasileiros' },
  { cargo: 'Tech Lead', nacionalidade: 'europeus' },
  // ... 15 total
];
```

##### 3. **Criar Placeholders**

Para cada cargo, cria **placeholder SEM dados pessoais**:

```javascript
const persona = {
  persona_code: `ARVA-P001`,
  empresa_id: empresa.id,
  full_name: `[Placeholder 1] CEO`, // ❗ Será substituído
  email: null,                      // ❗ Será gerado depois
  role: 'CEO',
  department: 'Executive',
  specialty: 'Leadership',
  nacionalidade: 'americanos',      // ✅ JÁ TEM
  genero: null,                     // ❗ Será gerado depois
  experiencia_anos: null,           // ❗ Será preenchido depois
  biografia_completa: null          // ❗ Será gerado depois
};
```

##### 4. **Salvar no Banco**

```javascript
const { data: personas } = await supabase
  .from('personas')
  .insert(placeholders)
  .select();

console.log(`✅ ${personas.length} placeholders criados`);
```

##### 5. **Atualizar Status**

```javascript
await supabase
  .from('empresas')
  .update({ 
    scripts_status: {
      ...empresa.scripts_status,
      create_personas: true // ✅
    }
  })
  .eq('id', empresa.id);
```

**✅ RESULTADO:** 15 placeholders criados com:
- ✅ Cargo definido
- ✅ Nacionalidade definida
- ❌ Nome NULL
- ❌ Email NULL
- ❌ Gênero NULL
- ❌ Biografia NULL

---

## 📝 FASE 3: GERAÇÃO DE BIOGRAFIAS

### Script: `AUTOMACAO/01_generate_biografias_REAL.js`

#### Comando:
```bash
node 01_generate_biografias_REAL.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

#### 📋 Processo:

##### 1. **Buscar Placeholders**

```javascript
const { data: personas } = await supabase
  .from('personas')
  .select('*')
  .eq('empresa_id', empresaId)
  .eq('status', 'active');
```

##### 2. **Para Cada Persona: Gerar Biografia com LLM**

**Dados Enviados à LLM:**
```javascript
const prompt = `
DADOS DA PESSOA:
- Nome: [Placeholder 1] CEO      // ❗ Ainda é placeholder
- Cargo: CEO
- Especialidade: Leadership
- Departamento: Executive
- Anos de Experiência: null      // ❗ NULL
- Nacionalidade: americanos      // ✅ TEM

DADOS DA EMPRESA:
- Nome: ARVA Tech Solutions
- Setor: tecnologia
- País: BR

Crie uma biografia estruturada em JSON...
`;
```

**⚠️ PROBLEMA IDENTIFICADO:**
- Script recebe placeholders **SEM nome real**
- `experiencia_anos` é NULL
- LLM gera biografia genérica sem contexto adequado

**Output LLM:**
```json
{
  "biografia_completa": "Profissional experiente em liderança...",
  "historia_profissional": "Carreira sólida...",
  "motivacoes": { ... },
  "soft_skills": { ... },
  "hard_skills": { ... },
  "educacao": { ... },
  "certificacoes": [ ... ],
  "idiomas_fluencia": { ... }
}
```

##### 3. **Salvar em `personas_biografias`**

```javascript
await supabase
  .from('personas_biografias')
  .upsert({
    persona_id: persona.id,
    biografia_estruturada: biografiaData, // ✅ JSONB completo
    updated_at: new Date().toISOString()
  });
```

**✅ RESULTADO:** Biografias criadas na tabela `personas_biografias`

---

## 🎯 FASE 4: GERAÇÃO DE ATRIBUIÇÕES

### Script: `AUTOMACAO/01.5_generate_atribuicoes_contextualizadas.cjs`

#### Comando:
```bash
node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=UUID
```

#### ⚠️ PROBLEMA ATUAL:

**Dados enviados à LLM:**
```javascript
const prompt = `
CONTEXTO DA EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.setor || 'Tecnologia'}  // ⚠️ Fallback genérico
- País: ${empresa.pais}

DADOS DA PERSONA:
- Nome: [Placeholder] CEO
- Cargo: CEO
- Departamento: Executive

// ❌ NÃO USA biografia estruturada!
// ❌ NÃO USA hard_skills!
// ❌ NÃO USA soft_skills!
`;
```

**Salvamento:**
```javascript
// ❌ PROBLEMA: Salva em ia_config (campo JSONB genérico)
await supabase
  .from('personas')
  .update({
    ia_config: {
      atribuicoes_especificas: atribuicoesGeradas
    }
  })
  .eq('id', persona.id);
```

**❌ DEVERIA SALVAR EM:** `personas_atribuicoes` (tabela normalizada)

---

## 🎓 FASE 5: GERAÇÃO DE COMPETÊNCIAS

### Script: `AUTOMACAO/02_generate_competencias_grok.cjs`

#### ⚠️ PROBLEMAS ATUAIS:

**1. Biografia Truncada:**
```javascript
const biografia = persona.biografia_completa || ''; // ❌ Campo legacy
const biografiaResumida = biografia.substring(0, 500); // ❌ TRUNCA!
```

**2. Não Usa Tabela Normalizada:**
```javascript
// ❌ Busca campo legacy
const biografia = persona.biografia_completa;

// ✅ DEVERIA BUSCAR:
const { data: biografiaData } = await supabase
  .from('personas_biografias')
  .select('biografia_estruturada')
  .eq('persona_id', persona.id)
  .single();
```

**3. Não Inclui Atribuições:**
```javascript
// ❌ Prompt não inclui atribuições contextualizadas
const prompt = `
PERSONA: ${persona.full_name}
CARGO: ${persona.role}
BIOGRAFIA (resumida): ${biografiaResumida} // ❌ 500 chars!
`;
```

---

## 🎭 FASE 6: GERAÇÃO DE AVATARES

### Script: `AUTOMACAO/00_generate_avatares.js`

#### ⚠️ PROBLEMA CRÍTICO: ORDEM ERRADA!

**Executado ANTES das biografias existirem:**

```javascript
const personaData = {
  biografia: persona.biografia_completa || 'Profissional experiente', // ❌
  atribuicoes: persona.atribuicoes || 'Em definição',                 // ❌
  competencias: persona.competencias || 'Em definição',               // ❌
  personalidade: persona.personalidade || 'Profissional'              // ❌
};
```

**Resultado:** Avatares genéricos sem contexto real

---

## ✅ ORDEM CORRETA DE EXECUÇÃO

### ❌ ORDEM ATUAL (INCORRETA):
```
1. Criar empresa (Frontend)
2. 00_create_personas → placeholders
3. 00_generate_avatares → ❌ ANTES da biografia!
4. 01_generate_biografias
5. 01.5_generate_atribuicoes
6. 02_generate_competencias
```

### ✅ ORDEM CORRETA (NOVA):
```
1. Criar empresa (Frontend)
   └─ Salva: cargos_necessarios, nationalities, idiomas

2. 00_create_personas_from_structure.js
   └─ Cria: placeholders com cargo + nacionalidade

3. 01_generate_biografias_REAL.js ← DEVE SER PRIMEIRO!
   └─ Salva em: personas_biografias (biografia_estruturada)

4. 01.5_generate_atribuicoes_contextualizadas.cjs (CORRIGIDO)
   ├─ Busca: biografia estruturada
   └─ Salva em: personas_atribuicoes (linhas ordenadas)

5. 02_generate_competencias_grok.cjs (CORRIGIDO)
   ├─ Busca: biografia + atribuições
   └─ Salva em: personas_competencias (8 campos JSONB)

6. 00_generate_avatares.js (CORRIGIDO)
   ├─ Busca: biografia + atribuições + competências
   └─ Gera: perfil visual completo + nomes reais
```

---

## 📊 TABELAS DO BANCO DE DADOS

### `empresas`
```sql
id UUID
nome TEXT
codigo TEXT
industria TEXT
dominio TEXT
descricao TEXT
pais TEXT (ex: 'BR', 'US')
cargos_necessarios JSONB -- ['CEO', 'CTO', ...]
nationalities JSONB -- [{tipo, percentual}, ...]
idiomas TEXT[] -- ['Português', 'Inglês']
equipe_gerada BOOLEAN -- false até personas criadas
total_personas INTEGER
scripts_status JSONB
```

### `personas`
```sql
id UUID
empresa_id UUID (FK)
persona_code TEXT -- 'ARVA-P001'
full_name TEXT -- NULL inicialmente, preenchido por avatares
email TEXT -- NULL inicialmente
role TEXT -- 'CEO', 'CTO'
department TEXT -- 'Executive'
specialty TEXT -- 'Leadership'
nacionalidade TEXT -- 'americanos', 'brasileiros'
genero TEXT -- NULL inicialmente
experiencia_anos INTEGER -- NULL inicialmente
biografia_completa TEXT -- LEGACY (não usar)
system_prompt JSONB -- Descrição física (avatares)
```

### `personas_biografias` (Normalizada ✅)
```sql
persona_id UUID (FK, UNIQUE)
biografia_estruturada JSONB
  ├─ biografia_completa TEXT
  ├─ historia_profissional TEXT
  ├─ motivacoes JSONB
  ├─ desafios JSONB
  ├─ soft_skills JSONB (com scores)
  ├─ hard_skills JSONB
  ├─ educacao JSONB
  ├─ certificacoes ARRAY
  ├─ idiomas_fluencia JSONB
  └─ experiencia_internacional JSONB
updated_at TIMESTAMP
```

### `personas_atribuicoes` (Normalizada ✅)
```sql
id UUID
persona_id UUID (FK)
atribuicao TEXT
ordem INTEGER
created_at TIMESTAMP
```

### `personas_competencias` (Normalizada ✅)
```sql
persona_id UUID (FK, UNIQUE)
competencias_tecnicas JSONB
competencias_comportamentais JSONB
ferramentas JSONB
tarefas_diarias JSONB
tarefas_semanais JSONB
tarefas_mensais JSONB
kpis JSONB
objetivos_desenvolvimento JSONB
updated_at TIMESTAMP
```

### `personas_avatares` (Normalizada ✅)
```sql
persona_id UUID (FK)
avatar_url TEXT
prompt_usado TEXT
estilo TEXT
biometrics JSONB -- 15+ parâmetros físicos
history JSONB
metadados JSONB
ativo BOOLEAN
versao INTEGER
```

---

## 🎯 DADOS COMPLETOS POR PERSONA (11 ELEMENTOS)

### ✅ Elemento 1: Dados Básicos
**Fonte:** Tabela `personas`
- Nome completo (gerado por avatares)
- Email (gerado por avatares)
- Cargo, Departamento, Especialidade
- Nacionalidade (definida em placeholders)
- Gênero (gerado por avatares)
- Experiência (anos)

### ✅ Elemento 2: Status de Scripts
**Fonte:** `empresas.scripts_status` (calculado)

### ✅ Elemento 3: Biografia
**Fonte:** Tabela `personas_biografias`

### ✅ Elemento 4: Avatar
**Fonte:** Tabela `personas_avatares`

### ✅ Elemento 5: Atribuições
**Fonte:** Tabela `personas_atribuicoes`

### ✅ Elemento 6-7: Competências + Metas
**Fonte:** Tabela `personas_competencias`

### ⚠️ Elemento 8: Análise de Automação
**Status:** ❌ Script não implementado
**Campo:** `personas.ia_config.automation_opportunities`

### ⚠️ Elemento 9: Workflows N8N
**Status:** ❌ Script não implementado
**Campo:** `personas.ia_config.n8n_workflows`

### ❌ Elemento 10: Machine Learning
**Status:** Módulo não construído
**Tabela futura:** `personas_ml_models`

### ❌ Elemento 11: Auditoria
**Status:** Módulo não construído
**Tabela futura:** `personas_audit_logs`

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 🔴 PRIORIDADE ALTA:

1. **Script 01 (Biografias)**
   - [ ] Executar PRIMEIRO (não terceiro)
   - [ ] Gerar nome real baseado em nacionalidade
   - [ ] Preencher `experiencia_anos` baseado em cargo
   - [ ] Gerar email com domínio da empresa

2. **Script 01.5 (Atribuições)**
   - [ ] Buscar biografia de `personas_biografias`
   - [ ] Incluir `hard_skills` e `soft_skills` no prompt
   - [ ] Salvar em `personas_atribuicoes` (não `ia_config`)

3. **Script 02 (Competências)**
   - [ ] Buscar biografia de `personas_biografias`
   - [ ] Buscar atribuições de `personas_atribuicoes`
   - [ ] Remover limite de 500 caracteres
   - [ ] Incluir todos os campos no prompt

4. **Script 00 (Avatares)**
   - [ ] Executar ÚLTIMO (não primeiro)
   - [ ] Buscar biografia estruturada
   - [ ] Buscar atribuições e competências
   - [ ] Gerar nome real + email
   - [ ] Contexto visual completo

---

## 📋 CHECKLIST DE VALIDAÇÃO

Antes de rodar scripts, verificar:

- [ ] Empresa tem `cargos_necessarios` definidos
- [ ] Empresa tem `nationalities` com total = 100%
- [ ] Empresa tem `equipe_gerada = false`
- [ ] Placeholders criados com nacionalidades
- [ ] Biografias executadas ANTES de avatares
- [ ] Todos os scripts salvam em tabelas normalizadas

---

**Fim do documento**
