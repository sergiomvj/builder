# 🔍 VALIDAÇÃO DE PROMPTS LLM - AUDITORIA COMPLETA

**Data:** 1 de Dezembro de 2025  
**Status:** ✅ Auditoria Concluída  
**Objetivo:** Garantir que dados enviados às LLMs geram outputs esperados

---

## 📊 RESUMO EXECUTIVO

| Script | Status | Dados Enviados | Output | Problemas |
|--------|--------|----------------|--------|-----------|
| `00_generate_avatares.js` | ⚠️ **CRÍTICO** | Incompletos | `personas_avatares` | Falta biografia real |
| `01_generate_biografias_REAL.js` | ✅ **OK** | Completos | `personas_biografias` | Nenhum |
| `01.5_generate_atribuicoes` | ⚠️ **AVISO** | Parciais | `ia_config.atribuicoes` | Não usa biografia |
| `02_generate_competencias_grok` | ⚠️ **CRÍTICO** | Incompletos | `personas_competencias` | Biografia truncada |

---

## 🎭 SCRIPT 00 - AVATARES (Elemento 4)

### ✅ **O QUE ESTÁ CORRETO:**
```javascript
const personaData = {
  nome: nomeCompleto,                    // ✅
  nacionalidade: persona.nacionalidade,  // ✅
  genero: genero,                        // ✅
  cargo: persona.role,                   // ✅
  departamento: persona.department,      // ✅
  especialidade: persona.specialty,      // ✅
  experiencia_anos: persona.experiencia_anos, // ✅
  empresa: empresaInfo.nome,             // ✅
  industria: empresaInfo.industria       // ✅
}
```

### ❌ **PROBLEMAS CRÍTICOS:**

#### 1. **Biografia Incompleta**
```javascript
biografia: persona.biografia_completa || 'Profissional experiente',  // ❌ PROBLEMA
```
**Impacto:** Avatares genéricos sem contexto profissional real  
**Razão:** Campo `biografia_completa` só existe DEPOIS do Script 01  
**Solução:** Script 00 deve rodar APÓS Script 01

#### 2. **Campos Genéricos**
```javascript
atribuicoes: persona.atribuicoes || 'Em definição',      // ❌ Muito genérico
competencias: persona.competencias || 'Em definição',    // ❌ Muito genérico
personalidade: persona.personalidade || 'Profissional',  // ❌ Muito genérico
```
**Impacto:** LLM não tem contexto suficiente para gerar aparência contextualizada

#### 3. **Ordem de Execução Errada**
```
ORDEM ATUAL (ERRADA):
00_avatares → 01_biografias → 01.5_atribuicoes → 02_competencias

ORDEM CORRETA:
01_biografias → 01.5_atribuicoes → 02_competencias → 00_avatares
```

### 🔧 **CORREÇÃO NECESSÁRIA:**

```javascript
// NOVO: Script 00 deve rodar APÓS biografia estar pronta
async function generateAvatarWithLLM(persona, empresaInfo) {
  
  // 1. BUSCAR BIOGRAFIA DA TABELA personas_biografias
  const { data: biografiaData, error: bioError } = await supabase
    .from('personas_biografias')
    .select('biografia_estruturada')
    .eq('persona_id', persona.id)
    .single();
  
  if (bioError || !biografiaData) {
    console.error(`❌ Persona ${persona.full_name} não tem biografia!`);
    console.error(`   Execute Script 01 antes de rodar Script 00`);
    return false;
  }
  
  const bioCompleta = biografiaData.biografia_estruturada;
  
  // 2. DADOS COMPLETOS para LLM
  const personaData = {
    nome: nomeCompleto,
    nacionalidade: persona.nacionalidade,
    genero: genero,
    cargo: persona.role,
    departamento: persona.department,
    especialidade: persona.specialty,
    experiencia_anos: persona.experiencia_anos,
    empresa: empresaInfo.nome,
    industria: empresaInfo.industria,
    
    // NOVOS CAMPOS (de personas_biografias):
    biografia_completa: bioCompleta.biografia_completa,
    historia_profissional: bioCompleta.historia_profissional,
    soft_skills: bioCompleta.soft_skills,
    hard_skills: bioCompleta.hard_skills,
    educacao: bioCompleta.educacao,
    certificacoes: bioCompleta.certificacoes,
    idiomas: bioCompleta.idiomas_fluencia,
    valores: bioCompleta.motivacoes?.valores_pessoais || [],
    
    // CONTEXTO VISUAL IMPORTANTE:
    estilo_vida: bioCompleta.motivacoes?.paixoes || [],
    ambiente_trabalho: persona.department,
    senioridade: persona.experiencia_anos >= 10 ? 'senior' : 'pleno'
  };
  
  // Agora o prompt tem CONTEXTO REAL
}
```

---

## 📝 SCRIPT 01 - BIOGRAFIAS (Elemento 3)

### ✅ **STATUS: BOM**

#### Dados Enviados à LLM:
```javascript
const prompt = `
DADOS DA PESSOA:
- Nome: ${persona.full_name}              // ✅
- Cargo: ${persona.role}                  // ✅
- Especialidade: ${persona.specialty}     // ✅
- Departamento: ${persona.department}     // ✅
- Anos de Experiência: ${persona.experiencia_anos} // ✅

DADOS DA EMPRESA:
- Nome: ${empresa.nome}         // ✅
- Setor: ${empresa.industria}   // ✅
- País: ${empresa.pais}         // ✅
```

#### Output Esperado:
```json
{
  "biografia_completa": "string",
  "historia_profissional": "string",
  "motivacoes": { /* object */ },
  "desafios": { /* object */ },
  "soft_skills": { /* object com scores */ },
  "hard_skills": { /* object */ },
  "educacao": { /* object */ },
  "certificacoes": ["array"],
  "idiomas_fluencia": { /* object */ },
  "experiencia_internacional": { /* object */ },
  "redes_sociais": { /* object */ }
}
```

### ✅ **SEM PROBLEMAS** - Prompt está completo e estruturado

---

## 🎯 SCRIPT 01.5 - ATRIBUIÇÕES (Elemento 5)

### ⚠️ **STATUS: PODE MELHORAR**

#### Dados Enviados à LLM:
```javascript
const prompt = `
CONTEXTO DA EMPRESA:
- Nome: ${empresa.nome}                    // ✅
- Setor: ${empresa.setor || 'Tecnologia'}  // ⚠️ Fallback genérico
- País: ${empresa.pais}                    // ✅
```

### ❌ **PROBLEMA: NÃO USA BIOGRAFIA**

O script não busca dados de `personas_biografias`! Isso gera atribuições genéricas.

### 🔧 **CORREÇÃO NECESSÁRIA:**

```javascript
async function gerarAtribuicoesLLM(persona, empresa) {
  
  // 1. BUSCAR BIOGRAFIA ESTRUTURADA
  const { data: biografiaData } = await supabase
    .from('personas_biografias')
    .select('biografia_estruturada')
    .eq('persona_id', persona.id)
    .single();
  
  if (!biografiaData) {
    console.error(`❌ Biografia não encontrada para ${persona.full_name}`);
    return null;
  }
  
  const bio = biografiaData.biografia_estruturada;
  
  const prompt = `Você é um especialista em RH.

CONTEXTO DA EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.setor || 'Tecnologia'}
- País: ${empresa.pais}

DADOS DA PERSONA:
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Departamento: ${persona.department}
- Experiência: ${persona.experiencia_anos} anos

BIOGRAFIA PROFISSIONAL:
${bio.biografia_completa}

HARD SKILLS:
${JSON.stringify(bio.hard_skills, null, 2)}

SOFT SKILLS:
${JSON.stringify(bio.soft_skills, null, 2)}

CERTIFICAÇÕES:
${bio.certificacoes.join(', ')}

Com base nos dados acima, gere atribuições ESPECÍFICAS e CONTEXTUALIZADAS...
`;
}
```

---

## 🎓 SCRIPT 02 - COMPETÊNCIAS (Elemento 6+7)

### ⚠️ **STATUS: CRÍTICO**

#### Dados Enviados à LLM:
```javascript
const biografia = persona.biografia_completa || persona.biografia_resumida || '';
const biografiaResumida = biografia.substring(0, 500); // ❌ PROBLEMA

const prompt = `
PERSONA: ${persona.full_name}
CARGO: ${persona.role}
EMPRESA: ${empresaInfo.nome}

BIOGRAFIA (resumida): ${biografiaResumida}  // ❌ TRUNCADA!
```

### ❌ **PROBLEMAS CRÍTICOS:**

#### 1. **Biografia Truncada**
- Limita biografia a 500 caracteres
- Perde informações críticas de competências

#### 2. **Não Usa Tabela Normalizada**
- Busca `persona.biografia_completa` (campo legacy)
- Deveria buscar `personas_biografias.biografia_estruturada`

#### 3. **Prompt Incompleto**
- Não inclui hard_skills existentes
- Não inclui soft_skills existentes
- Não inclui certificações

### 🔧 **CORREÇÃO NECESSÁRIA:**

```javascript
async function gerarCompetenciasComGrok(persona, empresaInfo) {
  
  // 1. BUSCAR BIOGRAFIA COMPLETA
  const { data: biografiaData } = await supabase
    .from('personas_biografias')
    .select('biografia_estruturada')
    .eq('persona_id', persona.id)
    .single();
  
  if (!biografiaData) {
    console.error(`❌ Biografia não encontrada para ${persona.full_name}`);
    return false;
  }
  
  const bio = biografiaData.biografia_estruturada;
  
  // 2. BUSCAR ATRIBUIÇÕES
  const { data: atribuicoesData } = await supabase
    .from('personas_atribuicoes')
    .select('atribuicao')
    .eq('persona_id', persona.id)
    .order('ordem');
  
  const atribuicoes = atribuicoesData?.map(a => a.atribuicao) || [];
  
  // 3. PROMPT COMPLETO
  const prompt = `Gere competências profissionais para:

PERSONA: ${persona.full_name}
CARGO: ${persona.role}
DEPARTAMENTO: ${persona.department}
EMPRESA: ${empresaInfo.nome}
INDÚSTRIA: ${empresaInfo.industria}

=== BIOGRAFIA PROFISSIONAL ===
${bio.biografia_completa}

=== HARD SKILLS EXISTENTES ===
${JSON.stringify(bio.hard_skills, null, 2)}

=== SOFT SKILLS EXISTENTES ===
${JSON.stringify(bio.soft_skills, null, 2)}

=== CERTIFICAÇÕES ===
${bio.certificacoes?.join(', ') || 'Nenhuma'}

=== ATRIBUIÇÕES DO CARGO ===
${atribuicoes.map((a, i) => `${i+1}. ${a}`).join('\n')}

=== FORMAÇÃO ACADÊMICA ===
${JSON.stringify(bio.educacao, null, 2)}

Com base nos dados acima, gere:

1. **Competências Técnicas** (5-7): Específicas para as atribuições listadas
2. **Competências Comportamentais** (5-7): Alinhadas com soft_skills
3. **Ferramentas** (4-6): Ferramentas reais para executar atribuições
4. **Tarefas Diárias** (4-6): Baseadas nas atribuições
5. **Tarefas Semanais** (3-4): Tarefas de consolidação semanal
6. **Tarefas Mensais** (3-4): Tarefas estratégicas mensais
7. **KPIs** (3-5): KPIs SMART (Específico, Mensurável, Atingível, Relevante, Temporal)
8. **Objetivos de Desenvolvimento** (3-4): Plano de crescimento profissional

Retorne APENAS JSON válido...
`;
}
```

---

## 🎯 ORDEM CORRETA DE EXECUÇÃO

### ❌ **ORDEM ATUAL (INCORRETA):**
```
00_generate_avatares.js          ← Roda ANTES da biografia existir ❌
  ↓
01_generate_biografias_REAL.js   ← Cria biografia
  ↓
01.5_generate_atribuicoes        ← Não usa biografia ❌
  ↓
02_generate_competencias_grok    ← Biografia truncada ❌
```

### ✅ **ORDEM CORRETA (NOVA):**
```
01_generate_biografias_REAL.js          ← Cria biografia estruturada
  ↓
01.5_generate_atribuicoes (CORRIGIDO)   ← Usa biografia para contexto
  ↓
02_generate_competencias_grok (CORRIGIDO) ← Usa biografia + atribuições
  ↓
00_generate_avatares (CORRIGIDO)        ← Usa biografia para aparência contextualizada
```

---

## 📋 CHECKLIST DE CORREÇÕES

### 🔴 **PRIORIDADE ALTA (Executar Imediatamente):**

- [ ] **1. Corrigir Script 02 (competencias_grok)**
  - [ ] Buscar biografia de `personas_biografias`
  - [ ] Buscar atribuições de `personas_atribuicoes`
  - [ ] Incluir todos os campos no prompt
  - [ ] Remover limite de 500 caracteres

- [ ] **2. Corrigir Script 01.5 (atribuicoes)**
  - [ ] Buscar biografia estruturada
  - [ ] Incluir hard_skills no prompt
  - [ ] Incluir soft_skills no prompt
  - [ ] Contexto mais rico

- [ ] **3. Corrigir Script 00 (avatares)**
  - [ ] Buscar biografia estruturada
  - [ ] Incluir história profissional
  - [ ] Incluir valores pessoais
  - [ ] Verificar biografia existe antes de rodar

### 🟡 **PRIORIDADE MÉDIA:**

- [ ] **4. Atualizar documentação**
  - [ ] README com ordem correta
  - [ ] Atualizar instruções de uso
  - [ ] Documentar dependências entre scripts

- [ ] **5. Criar validações**
  - [ ] Script não roda se dependência falta
  - [ ] Mensagens claras de erro
  - [ ] Sugestão de ordem correta

### 🟢 **PRIORIDADE BAIXA:**

- [ ] **6. Otimizações**
  - [ ] Cache de biografias
  - [ ] Reutilizar dados já buscados
  - [ ] Logging mais detalhado

---

## 🎯 EXEMPLO DE PROMPT PERFEITO

### Script 02 - Competências (VERSÃO CORRIGIDA)

```javascript
const prompt = `Você é um especialista em Gestão de Competências e Desenvolvimento de Talentos.

=== DADOS DA EMPRESA ===
Nome: ARVA Tech Solutions
Indústria: Inteligência Artificial e Automação
País: Brasil
Cultura: Inovadora, colaborativa, orientada a resultados

=== DADOS DA PERSONA ===
Nome: Sarah Thompson
Cargo: Chief Technology Officer (CTO)
Departamento: Tecnologia
Experiência: 12 anos
Nacionalidade: Americana

=== BIOGRAFIA PROFISSIONAL COMPLETA ===
Sarah Thompson é CTO na ARVA Tech Solutions, trazendo 12 anos de experiência em liderança tecnológica. 
Iniciou sua carreira como desenvolvedora full-stack em startups do Vale do Silício, onde rapidamente 
avançou para posições de arquitetura de software. Possui mestrado em Ciência da Computação pela Stanford 
University e MBA Executivo pela Harvard Business School. É reconhecida por sua capacidade de transformar 
visões tecnológicas em produtos escaláveis, tendo liderado equipes de 50+ engenheiros em empresas de 
hipercrescimento. Especialista em cloud computing, IA/ML e arquitetura de microsserviços.

=== HARD SKILLS EXISTENTES (com níveis) ===
{
  "tecnologicas": {
    "cloud_architecture": 9,
    "ai_ml_implementation": 8,
    "system_design": 9,
    "devops": 8,
    "security": 7
  },
  "ferramentas": ["AWS", "Kubernetes", "Terraform", "Python", "Go"],
  "metodologias": ["Agile", "Scrum", "DevOps", "CI/CD"],
  "areas_conhecimento": ["Distributed Systems", "Machine Learning", "Cloud Computing"]
}

=== SOFT SKILLS EXISTENTES (com níveis) ===
{
  "comunicacao": 9,
  "lideranca": 9,
  "trabalho_equipe": 8,
  "resolucao_problemas": 9,
  "criatividade": 7,
  "adaptabilidade": 8,
  "inteligencia_emocional": 8,
  "pensamento_critico": 9
}

=== FORMAÇÃO ACADÊMICA ===
{
  "formacao_superior": ["B.S. Computer Science - Stanford University"],
  "pos_graduacao": ["M.S. Computer Science - Stanford", "MBA - Harvard Business School"],
  "certificacoes": ["AWS Solutions Architect Professional", "Kubernetes Administrator (CKA)"],
  "instituicoes": ["Stanford University", "Harvard Business School"]
}

=== ATRIBUIÇÕES DO CARGO (15 atribuições específicas) ===
1. Definir e executar a estratégia tecnológica da empresa alinhada aos objetivos de negócio
2. Liderar equipe multidisciplinar de 30+ profissionais de tecnologia (engenheiros, DevOps, QA)
3. Avaliar e implementar novas tecnologias que aumentem competitividade e eficiência
4. Garantir segurança, escalabilidade e performance da infraestrutura tecnológica
5. Estabelecer processos de CI/CD e cultura DevOps
6. Gerenciar orçamento anual de tecnologia ($2M+)
7. Representar a empresa em eventos técnicos e comunidades de desenvolvedores
8. Criar roadmap técnico trimestral e anual
9. Estabelecer métricas de performance técnica (SLA, uptime, latência)
10. Conduzir code reviews e architecture design reviews
11. Implementar práticas de desenvolvimento seguro (DevSecOps)
12. Gerenciar relacionamento com fornecedores de tecnologia (AWS, vendors)
13. Desenvolver programa de upskilling para equipe técnica
14. Liderar projetos de transformação digital
15. Garantir compliance com regulamentações (LGPD, SOC2, ISO 27001)

=== CONTEXTO ADICIONAL ===
- Empresa em fase de crescimento acelerado (Series B)
- Equipe técnica cresceu 300% no último ano
- Foco em produtos de IA para automação empresarial
- Clientes enterprise B2B (Fortune 500)

=== TAREFA ===
Com base nos dados acima, gere competências detalhadas e contextualizadas:

1. **competencias_tecnicas** (array de 5-7 strings):
   - Específicas para atribuições listadas
   - Alinhadas com hard_skills existentes
   - Nível CTO em empresa de IA

2. **competencias_comportamentais** (array de 5-7 strings):
   - Derivadas de soft_skills
   - Essenciais para liderança sênior
   - Contexto startup em crescimento

3. **ferramentas** (array de 4-6 strings):
   - Ferramentas REAIS que CTO usa diariamente
   - Não repetir ferramentas já listadas em hard_skills
   - Focar em ferramentas de gestão + técnicas

4. **tarefas_diarias** (array de 4-6 strings):
   - Baseadas nas 15 atribuições
   - Específicas, mensuráveis
   - Formato: "Verbo + objeto + contexto"

5. **tarefas_semanais** (array de 3-4 strings):
   - Consolidação semanal
   - Reuniões estratégicas
   - Reviews e planejamento

6. **tarefas_mensais** (array de 3-4 strings):
   - Planejamento estratégico
   - Budget reviews
   - Avaliações de equipe

7. **kpis** (array de 3-5 strings):
   - Formato: "Nome do KPI - Métrica - Meta"
   - KPIs SMART (Específico, Mensurável, Atingível, Relevante, Temporal)
   - Exemplos:
     * "System Uptime - 99.9% availability - Manter acima de 99.9% mensalmente"
     * "Deploy Frequency - Daily deployments - Atingir 10+ deploys/dia"

8. **objetivos_desenvolvimento** (array de 3-4 strings):
   - Plano de crescimento profissional
   - Alinhado com gap analysis
   - Próximos 6-12 meses

Retorne APENAS JSON válido (sem markdown, sem texto adicional):

{
  "competencias_tecnicas": [...],
  "competencias_comportamentais": [...],
  "ferramentas": [...],
  "tarefas_diarias": [...],
  "tarefas_semanais": [...],
  "tarefas_mensais": [...],
  "kpis": [...],
  "objetivos_desenvolvimento": [...]
}
`;
```

---

## 📊 IMPACTO DAS CORREÇÕES

### Antes (Status Atual):
- Avatares genéricos sem contexto profissional
- Atribuições básicas não contextualizadas
- Competências superficiais e repetitivas
- Taxa de qualidade: **~40%**

### Depois (Pós-Correção):
- Avatares alinhados com biografia e personalidade
- Atribuições específicas baseadas em competências
- Competências detalhadas e contextualizadas
- Taxa de qualidade esperada: **~85%**

---

## 🎯 PRÓXIMOS PASSOS

1. **Implementar correções nos scripts** (Prioridade Alta)
2. **Testar cascata completa** em empresa limpa
3. **Validar outputs** manualmente (sample de 3 personas)
4. **Documentar nova ordem** no README principal
5. **Criar script de validação** que verifica dependências

---

**Documento gerado automaticamente em:** 1 de Dezembro de 2025  
**Última atualização:** Auditoria inicial completa
