# FLUXO CORRETO DE CRIAÇÃO DE PERSONAS (REVISADO)

## 📅 Data: 30 de Novembro de 2025

## ⚠️ **CORREÇÃO CRÍTICA**

O fluxo anterior estava **gerando nomes prematuramente**, antes de ter dados contextuais suficientes.

---

## ✅ **FLUXO CORRETO (REVISADO)**

### **FASE 1: Criação de Empresa via Interface**
```
Interface → Nova Empresa
  ↓
Define:
  - Dados básicos (nome, indústria, descrição)
  - Estrutura de cargos (CEO, Executives, Assistants, Specialists)
  - Nacionalidades com percentuais (40% americanos, 30% brasileiros...)
  ↓
Salvar:
  empresas {
    cargos_necessarios: ['CEO', 'Executive', 'Executive', ...],
    nationalities: [{tipo: 'americanos', percentual: 40}, ...],
    equipe_gerada: false
  }
```

### **FASE 2: Criação de Placeholders**
```bash
node 00_create_personas_from_structure.js --empresaId=UUID
```

**O que faz:**
- ✅ Cria registros na tabela `personas`
- ✅ Define apenas:
  - `role` (CEO, VP, Assistant, Specialist)
  - `department` (Executive, Management, Operations, Sales)
  - `specialty` (Leadership, Strategy, Support, Technical)
  - `nacionalidade` (americanos, brasileiros, europeus, asiáticos)
- ❌ **NÃO gera:**
  - `full_name` = NULL
  - `email` = NULL
  - `genero` = NULL
  - `biografia_completa` = NULL

**Resultado:**
```json
{
  "id": "uuid-123",
  "empresa_id": "uuid-empresa",
  "role": "CEO",
  "department": "Executive",
  "specialty": "Leadership",
  "nacionalidade": "americanos",
  "full_name": null,
  "email": null,
  "genero": null,
  "biografia_completa": null
}
```

### **FASE 3: Atribuições Contextualizadas (Script 01.5)**
```bash
node 01.5_atribuicoes.js --empresaId=UUID
```

**O que adiciona:**
- Define `atribuicoes` específicas para cada cargo
- Contextualiza responsabilidades baseado em:
  - Cargo
  - Departamento
  - Indústria da empresa

**Resultado:**
```json
{
  "atribuicoes": "Responsável pela estratégia corporativa, liderança executiva..."
}
```

### **FASE 4: Competências Técnicas/Comportamentais (Script 02)**
```bash
node 02_generate_competencias_vcm.js --empresaId=UUID
```

**O que adiciona:**
- Define `competencias` técnicas e comportamentais
- Mapeia subsistemas VCM necessários
- Define tarefas diárias/semanais/mensais

**Resultado:**
```json
{
  "competencias": {
    "tecnicas": ["Strategic Planning", "Financial Management"],
    "comportamentais": ["Leadership", "Decision Making"],
    "subsistemas": ["FINANCEIRO", "RECURSOS_HUMANOS"]
  }
}
```

### **FASE 5: Geração de Perfis Completos via LLM (Script 00 - Avatares)**
```bash
node 00_generate_avatares.js --empresaId=UUID
```

**✨ AGORA SIM gera tudo baseado em CONTEXTO COMPLETO:**

1. **Verifica se `full_name` é NULL**
2. **Se NULL, gera nome apropriado à nacionalidade:**
   - Americanos → James Anderson, Sarah Johnson
   - Brasileiros → João Silva, Maria Santos
   - Europeus → Hans Mueller, Sophie Dubois
   - Asiáticos → Kenji Tanaka, Mei Wang
3. **Gera gênero** (masculino/feminino)
4. **Gera email** baseado no nome real
5. **Atualiza persona** com nome, email, gênero
6. **Envia para LLM** TODOS os dados:
   ```json
   {
     "nome": "James Anderson",
     "nacionalidade": "americanos",
     "genero": "masculino",
     "cargo": "CEO",
     "atribuicoes": "Estratégia corporativa...",
     "competencias": ["Strategic Planning", ...],
     "industria": "tecnologia"
   }
   ```
7. **LLM gera perfil biométrico CONTEXTUALIZADO:**
   - Idade apropriada ao cargo (CEO = 45-55 anos, Junior = 22-28)
   - Características físicas típicas da nacionalidade
   - Estilo de vestimenta apropriado à indústria
   - Acessórios profissionais (óculos, relógio, etc.)
   - Trajetória profissional coerente

**Resultado:**
```json
{
  "full_name": "James Anderson",
  "email": "james.anderson@empresa.com",
  "genero": "masculino",
  "nacionalidade": "americanos",
  "biometrics": {
    "idade_aparente": "45-50 anos",
    "genero": "masculino",
    "etnia": "caucasiano",
    "cabelo_cor": "castanho com fios grisalhos",
    "olhos_cor": "azul claro",
    "pele_tom": "clara bronzeada",
    "estilo_vestimenta": "executivo formal",
    "acessorios": "óculos discretos, relógio executivo"
  },
  "history": {
    "background_educacional": "MBA em Harvard, Engenharia MIT",
    "experiencia_internacional": "Trabalhou em Silicon Valley 15 anos",
    "trajetoria_carreira": "VP Google → Fundador startup → CEO atual"
  }
}
```

### **FASE 6: Biografias Detalhadas (Script 01)**
```bash
node 01_generate_biografias_REAL.js --empresaId=UUID
```

**O que faz:**
- Expande biografias usando TODOS os dados anteriores
- Cria narrativa profissional coerente
- Adiciona detalhes de personalidade e histórico

### **FASES 7-10: Scripts Finais**
```bash
node 03_generate_tech_specs.js --empresaId=UUID      # Tech specs
node 04_generate_rag_knowledge.js --empresaId=UUID   # Knowledge base
node 05_generate_fluxos_sdr.js --empresaId=UUID      # Sales flows
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=fal  # Fotos AI
```

---

## 📊 **COMPARAÇÃO: ANTES vs DEPOIS**

### ❌ ANTES (Errado)
```
00_create_personas_from_structure.js:
  ↓ Gera nome IMEDIATAMENTE
  ↓ Sem contexto de atribuições
  ↓ Sem contexto de competências
  ↓ Nome genérico, descontextualizado
```

**Problema:** Nome "João Silva CEO" sem saber se é CEO tech startup ou CEO banco tradicional.

### ✅ DEPOIS (Correto)
```
00_create_personas_from_structure.js:
  ↓ Cria apenas PLACEHOLDER (cargo + nacionalidade)

01.5_atribuicoes.js:
  ↓ Define atribuições contextualizadas

02_competencias.js:
  ↓ Define competências técnicas/comportamentais

00_generate_avatares.js:
  ↓ AGORA SIM gera nome + perfil biométrico
  ↓ LLM tem TODOS os dados para contextualizar
  ↓ Resultado: "James Anderson, CEO, 48 anos, MBA Harvard, 
     15 anos Silicon Valley, estilo executivo tech"
```

---

## 🎯 **ORDEM DE EXECUÇÃO CORRETA**

```bash
# 1. Criar empresa via interface
# 2. Executar scripts NA ORDEM:

cd c:\Projetos\vcm_vite_react\AUTOMACAO

# Criar placeholders (apenas cargo + nacionalidade)
node 00_create_personas_from_structure.js --empresaId=UUID

# Adicionar atribuições contextualizadas
node 01.5_atribuicoes.js --empresaId=UUID

# Adicionar competências técnicas/comportamentais
node 02_generate_competencias_vcm.js --empresaId=UUID

# AGORA gerar nomes + perfis completos via LLM
node 00_generate_avatares.js --empresaId=UUID

# Expandir biografias
node 01_generate_biografias_REAL.js --empresaId=UUID

# Scripts finais
node 03_generate_tech_specs.js --empresaId=UUID
node 04_generate_rag_knowledge.js --empresaId=UUID
node 05_generate_fluxos_sdr.js --empresaId=UUID
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=fal
```

---

## 💡 **POR QUE ESSA ORDEM?**

### 1. **Placeholders primeiro**
- Permite scripts subsequentes terem IDs de personas para trabalhar
- Estrutura básica está pronta

### 2. **Atribuições e Competências antes dos Nomes**
- LLM pode gerar nomes mais apropriados
- Exemplo: CEO com "Strategic Planning" → nome mais sênior
- Exemplo: Junior com "Prospecting" → nome mais jovem

### 3. **Nacionalidade é distribuída desde o início**
- Garante proporção correta (40% americanos, 30% brasileiros)
- LLM usa nacionalidade para características físicas apropriadas

### 4. **Perfis biométricos contextualizados**
- LLM considera TUDO: cargo, atribuições, competências, nacionalidade
- Resultado muito mais realista e coerente

---

## ✅ **ARQUIVOS ATUALIZADOS**

1. **`AUTOMACAO/00_create_personas_from_structure.js`**
   - Remove geração de nomes
   - Remove geração de biografias
   - Cria apenas placeholders

2. **`AUTOMACAO/00_generate_avatares.js`**
   - Detecta personas sem nome (`full_name = NULL`)
   - Gera nome apropriado à nacionalidade
   - Gera email baseado no nome
   - Atualiza persona no banco
   - Envia TODOS os dados para LLM
   - LLM gera perfil completo contextualizado

3. **`src/components/empresas-page.tsx`**
   - Alerta atualizado com fluxo correto
   - Mostra ordem dos scripts

4. **`docs/FLUXO_CORRETO_CRIACAO_PERSONAS.md`**
   - Documentação completa do fluxo correto

---

## 🧪 **TESTE DO SISTEMA**

### Empresa de Teste: Nova Tech Startup

```bash
# 1. Criar empresa via interface com:
#    - 1 CEO
#    - 2 Executives  
#    - 3 SDR Juniors
#    - Nacionalidades: 50% americanos, 30% brasileiros, 20% europeus

# 2. Executar scripts:
cd AUTOMACAO

# Placeholders (sem nomes)
node 00_create_personas_from_structure.js --empresaId=UUID
# Resultado: 6 registros com role, department, nacionalidade, mas full_name=NULL

# Atribuições
node 01.5_atribuicoes.js --empresaId=UUID
# Resultado: atribuições contextualizadas para cada cargo

# Competências
node 02_generate_competencias_vcm.js --empresaId=UUID
# Resultado: competências técnicas/comportamentais + subsistemas

# AGORA gerar nomes e perfis
node 00_generate_avatares.js --empresaId=UUID
# Resultado esperado:
#   CEO: "James Anderson" (americano, 48 anos, executivo sênior)
#   Executive 1: "Sophie Dubois" (europeia, 42 anos, estratégica)
#   Executive 2: "Maria Santos" (brasileira, 38 anos, operacional)
#   SDR 1: "Michael Johnson" (americano, 25 anos, energético)
#   SDR 2: "Pedro Silva" (brasileiro, 23 anos, proativo)
#   SDR 3: "Hans Mueller" (europeu, 26 anos, metódico)
```

---

## 🎉 **BENEFÍCIOS DO FLUXO CORRETO**

1. ✅ **Nomes contextualizados** - não são gerados no vácuo
2. ✅ **Perfis realistas** - LLM tem dados completos
3. ✅ **Coerência total** - nome, idade, cargo, experiência tudo alinhado
4. ✅ **Nacionalidades apropriadas** - características físicas corretas
5. ✅ **Trajetórias verossímeis** - histórico profissional faz sentido

---

**FIM DO DOCUMENTO**
