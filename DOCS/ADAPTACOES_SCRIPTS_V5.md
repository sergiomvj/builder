# 🔄 ADAPTAÇÕES NECESSÁRIAS NOS SCRIPTS 01-11

## 📋 Visão Geral das Mudanças

Com a implementação do **Script 00 (Company Foundation)**, os scripts 01-11 precisam ser adaptados para o paradigma **top-down**:

```
Script 00 (NOVO) → Blocos Funcionais → OKRs → Value Stream
         ↓
Script 01 → Criar personas baseadas nos blocos (não mais cargos genéricos)
         ↓
Script 02 → Biografias com contexto de OKR ownership
         ↓
Script 03 → Atribuições = Responsabilidades por resultados (não tarefas)
         ↓
Scripts 04-11 → Continuar fluxo com contexto estratégico
```

---

## 🔧 SCRIPT 01 - Create Personas from Structure

### ❌ Comportamento Atual (v4.0)
```javascript
// Gera cargos genéricos via LLM
const prompt = `
  Crie uma estrutura organizacional com 8-12 cargos.
  EMPRESA: ${empresa.nome}
  Retorne: ["CEO", "CTO", "Desenvolvedor Senior", ...]
`;
```

### ✅ Comportamento Necessário (v5.0)
```javascript
// Buscar blocos funcionais do Script 00
const { data: blocos } = await supabase
  .from('empresas_blocos_funcionais')
  .select('*')
  .eq('empresa_id', empresaId);

// Buscar OKRs com ownership
const { data: okrs } = await supabase
  .from('empresas_okrs')
  .select('*')
  .eq('empresa_id', empresaId);

// Para cada bloco funcional, criar personas necessárias
for (const bloco of blocos) {
  // Quantas personas esse bloco precisa?
  const prompt = `
    BLOCO FUNCIONAL: ${bloco.nome}
    OBJETIVO DO BLOCO: ${bloco.objetivo}
    KPIs DO BLOCO: ${bloco.kpis.join(', ')}
    
    Defina quantos cargos são necessários e quais:
    - 1 líder/gerente (owner de OKRs)
    - N executores (especialistas)
    
    Retorne JSON:
    {
      "cargos": [
        {
          "titulo": "Gerente de Marketing",
          "nivel": "gerencial",
          "okr_owner_id": "uuid_do_okr",
          "responsabilidade_resultado": "Aumentar leads em 30%"
        }
      ]
    }
  `;
}
```

### 📝 Mudanças Específicas

**1. Adicionar função para buscar blocos funcionais:**
```javascript
async function buscarBlocosFuncionais(empresaId) {
  const { data: blocos, error } = await supabase
    .from('empresas_blocos_funcionais')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('nome');
  
  if (error) throw error;
  return blocos || [];
}
```

**2. Adicionar função para buscar OKRs:**
```javascript
async function buscarOKRs(empresaId) {
  const { data: okrs, error } = await supabase
    .from('empresas_okrs')
    .select('*, objetivo:empresas_objetivos_estrategicos(*)')
    .eq('empresa_id', empresaId);
  
  if (error) throw error;
  return okrs || [];
}
```

**3. Modificar geração de cargos:**
```javascript
async function gerarCargosDoBloco(bloco, okrsRelacionados, empresa) {
  const prompt = `
Você é um especialista em design organizacional.

EMPRESA: ${empresa.nome}
BLOCO FUNCIONAL: ${bloco.nome}
OBJETIVO DO BLOCO: ${bloco.objetivo}
KPIs: ${bloco.kpis.join(', ')}

OKRs DESTE BLOCO:
${okrsRelacionados.map(okr => `
- ${okr.titulo}
  KR1: ${okr.key_result_1}
  KR2: ${okr.key_result_2}
  KR3: ${okr.key_result_3}
`).join('\n')}

Defina 2-5 cargos necessários para este bloco.

REGRAS:
1. Pelo menos 1 cargo GERENCIAL (owner de OKRs)
2. Cargos ESPECIALISTAS (executam tarefas específicas)
3. Cada cargo deve ter RESPONSABILIDADE POR RESULTADO, não só tarefas

Retorne JSON:
{
  "cargos": [
    {
      "titulo": "Nome do cargo",
      "nivel": "gerencial|especialista|operacional",
      "bloco_funcional": "${bloco.nome}",
      "okr_owner_ids": ["uuid1", "uuid2"],
      "responsabilidade_resultado": "Resultado mensurável que garante",
      "metricas_responsabilidade": ["Métrica 1", "Métrica 2"],
      "departamento": "Nome do departamento"
    }
  ]
}
`;

  const response = await generateWithFallback(activeLLM, prompt, {
    temperature: 0.75,
    maxTokens: 2000
  });
  
  return JSON.parse(response);
}
```

**4. Salvar persona com contexto estratégico:**
```javascript
// Ao criar persona, adicionar campos novos:
const personaData = {
  codigo_persona: `${empresa.codigo}-${bloco.nome.substring(0,3).toUpperCase()}${index+1}`,
  empresa_id: empresaId,
  specialty: cargo.titulo,
  department: cargo.departamento,
  bloco_funcional_id: bloco.id,  // NOVO
  okr_owner_ids: cargo.okr_owner_ids,  // NOVO
  responsabilidade_resultado: cargo.responsabilidade_resultado,  // NOVO
  metricas_responsabilidade: cargo.metricas_responsabilidade,  // NOVO
  nivel_hierarquico: cargo.nivel,  // NOVO
  // ... outros campos
};
```

---

## 🔧 SCRIPT 02 - Generate Biografias

### ❌ Comportamento Atual (v4.0)
```javascript
const prompt = `
  Crie uma biografia para:
  Cargo: ${persona.specialty}
  Empresa: ${empresa.nome}
`;
```

### ✅ Comportamento Necessário (v5.0)
```javascript
// Buscar contexto estratégico da persona
const { data: okrsOwned } = await supabase
  .from('empresas_okrs')
  .select('*, objetivo:empresas_objetivos_estrategicos(*)')
  .contains('owner_persona_id', [persona.id]);

const { data: blocoFuncional } = await supabase
  .from('empresas_blocos_funcionais')
  .select('*')
  .eq('id', persona.bloco_funcional_id)
  .single();

const prompt = `
  Crie uma biografia profissional REALISTA para:
  
  CARGO: ${persona.specialty}
  BLOCO FUNCIONAL: ${blocoFuncional.nome}
  
  RESPONSABILIDADE DE RESULTADO:
  ${persona.responsabilidade_resultado}
  
  OKRs QUE É OWNER:
  ${okrsOwned.map(okr => `
    - ${okr.titulo}
      Meta: ${okr.objetivo.metrica_alvo}
      KR1: ${okr.key_result_1}
      KR2: ${okr.key_result_2}
      KR3: ${okr.key_result_3}
  `).join('\n')}
  
  MÉTRICAS DE RESPONSABILIDADE:
  ${persona.metricas_responsabilidade.join(', ')}
  
  A biografia deve REFLETIR:
  - Experiência prévia com gestão de resultados similares
  - Conhecimento nas métricas que monitora
  - Cases de sucesso com OKRs parecidos
  
  Retorne JSON...
`;
```

### 📝 Mudanças Específicas

**1. Adicionar busca de contexto estratégico:**
```javascript
async function buscarContextoEstrategico(persona) {
  const [okrs, bloco, valueStream] = await Promise.all([
    supabase
      .from('empresas_okrs')
      .select('*, objetivo:empresas_objetivos_estrategicos(*)')
      .contains('owner_persona_id', [persona.id]),
    
    supabase
      .from('empresas_blocos_funcionais')
      .select('*')
      .eq('id', persona.bloco_funcional_id)
      .single(),
    
    supabase
      .from('empresas_value_stream')
      .select('*')
      .eq('responsavel_persona_id', persona.id)
  ]);
  
  return {
    okrs: okrs.data || [],
    bloco: bloco.data,
    valueStream: valueStream.data || []
  };
}
```

**2. Enriquecer prompt com contexto:**
```javascript
async function generateBiografia(persona, empresa, contexto) {
  const prompt = `
EMPRESA: ${empresa.nome}
CARGO: ${persona.specialty}
DEPARTAMENTO: ${persona.department}

CONTEXTO ESTRATÉGICO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 BLOCO FUNCIONAL: ${contexto.bloco?.nome || 'N/A'}
   Objetivo: ${contexto.bloco?.objetivo || 'N/A'}
   KPIs: ${contexto.bloco?.kpis?.join(', ') || 'N/A'}

🎯 RESPONSABILIDADE DE RESULTADO:
   ${persona.responsabilidade_resultado || 'Não definida'}

📈 MÉTRICAS QUE MONITORA:
   ${persona.metricas_responsabilidade?.join(', ') || 'Nenhuma'}

🚀 OKRs QUE É OWNER (${contexto.okrs.length}):
${contexto.okrs.map(okr => `
   • ${okr.titulo}
     Objetivo Global: ${okr.objetivo?.titulo}
     KR1: ${okr.key_result_1}
     KR2: ${okr.key_result_2}
     KR3: ${okr.key_result_3}
     Progresso Atual: ${okr.progresso_percentual}%
`).join('\n')}

🔁 ETAPAS DA CADEIA DE VALOR SOB SUA RESPONSABILIDADE:
${contexto.valueStream.map(vs => `
   • ${vs.estagio.toUpperCase()}: ${vs.descricao}
     Métricas: ${JSON.stringify(vs.metricas_chave)}
`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crie uma biografia REALISTA que demonstre:
1. Experiência prévia com resultados mensuráveis similares aos OKRs
2. Cases de sucesso com as métricas que monitora
3. Formação e certificações relevantes para as responsabilidades
4. Soft skills necessárias para ownership de resultados
5. Background que justifica estar nesta posição estratégica

FORMATO JSON:
{
  "biografia_estruturada": {
    "resumo_executivo": "3-4 frases destacando experiência com OKRs e resultados",
    "experiencia_profissional": [
      {
        "empresa": "Nome",
        "cargo": "Cargo",
        "periodo": "2020-2023",
        "realizacoes_mensuradas": ["Aumentou X em Y%", "Reduziu Z em W%"]
      }
    ],
    "competencias_chave": {
      "tecnicas": ["Relacionadas aos KPIs"],
      "gerenciais": ["Relacionadas a ownership de OKRs"],
      "ferramentas": ["Usadas para medir métricas"]
    },
    "cases_de_sucesso": [
      {
        "contexto": "Situação similar ao OKR atual",
        "acao": "O que fez",
        "resultado": "Resultado mensurável"
      }
    ]
  }
}
`;

  return await generateJSONWithFallback(prompt, 0.85);
}
```

---

## 🔧 SCRIPT 03 - Generate Atribuições

### ❌ Comportamento Atual (v4.0)
```javascript
// Gera TAREFAS
atribuicoes: [
  "Criar campanhas de marketing",
  "Gerenciar redes sociais",
  "Analisar métricas de engajamento"
]
```

### ✅ Comportamento Necessário (v5.0)
```javascript
// Gera RESPONSABILIDADES POR RESULTADOS
atribuicoes: [
  {
    "resultado": "Aumentar leads qualificados em 30%",
    "como_mede": "Google Analytics + CRM (leads com score >70)",
    "baseline_atual": "100 leads/mês",
    "meta_numerica": "130 leads/mês",
    "prazo": "2025-06-30",
    "quem_depende": ["Vendas", "Customer Success"],
    "inputs_necessarios": ["Budget aprovado", "Conteúdo de produto"],
    "outputs_entrega": ["Leads qualificados no CRM", "Relatório semanal"],
    "autonomia_decisao": ["Escolher canais", "Definir budget por canal"],
    "precisa_aprovacao": ["Budget total mensal", "Mudança de estratégia"]
  }
]
```

### 📝 Mudanças Específicas

**1. Modificar estrutura de dados:**
```javascript
// ANTES: personas_atribuicoes
CREATE TABLE personas_atribuicoes (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  atribuicao TEXT,  -- ❌ Texto simples
  ordem INT
);

// DEPOIS: adicionar campos
ALTER TABLE personas_atribuicoes ADD COLUMN resultado TEXT;
ALTER TABLE personas_atribuicoes ADD COLUMN como_mede TEXT;
ALTER TABLE personas_atribuicoes ADD COLUMN meta_numerica TEXT;
ALTER TABLE personas_atribuicoes ADD COLUMN prazo DATE;
ALTER TABLE personas_atribuicoes ADD COLUMN dependencias JSONB;
ALTER TABLE personas_atribuicoes ADD COLUMN autonomia JSONB;
```

**2. Novo prompt baseado em resultados:**
```javascript
const prompt = `
PERSONA: ${persona.full_name}
CARGO: ${persona.specialty}
RESPONSABILIDADE GLOBAL: ${persona.responsabilidade_resultado}

OKRs QUE É OWNER:
${okrs.map(okr => `
- ${okr.titulo}
  KR1: ${okr.key_result_1}
  KR2: ${okr.key_result_2}
  KR3: ${okr.key_result_3}
`).join('\n')}

Para CADA Key Result, defina:

1. RESULTADO ESPERADO (mensurável)
2. COMO MEDE (ferramenta + métrica)
3. BASELINE ATUAL
4. META NUMÉRICA
5. PRAZO
6. QUEM DEPENDE deste resultado
7. INPUTS NECESSÁRIOS (de outras áreas)
8. OUTPUTS ENTREGA (para outras áreas)
9. AUTONOMIA DE DECISÃO (pode decidir sozinho)
10. PRECISA APROVAÇÃO (requer validação superior)

IMPORTANTE:
- Evite tarefas genéricas ("fazer reuniões")
- Foque em RESULTADOS MENSURÁVEIS
- Seja específico nas métricas
- Defina claramente dependências

Retorne JSON:
{
  "atribuicoes": [
    {
      "resultado": "string",
      "como_mede": "string",
      "baseline_atual": "string",
      "meta_numerica": "string",
      "prazo": "YYYY-MM-DD",
      "quem_depende": ["area1", "area2"],
      "inputs_necessarios": ["input1", "input2"],
      "outputs_entrega": ["output1", "output2"],
      "autonomia_decisao": ["decisao1", "decisao2"],
      "precisa_aprovacao": ["item1", "item2"]
    }
  ]
}
`;
```

---

## 🔧 SCRIPT 04 - Generate Competências

### ✅ Mudanças Necessárias

**1. Alinhar competências com KPIs dos blocos funcionais:**
```javascript
const { data: bloco } = await supabase
  .from('empresas_blocos_funcionais')
  .select('*')
  .eq('id', persona.bloco_funcional_id)
  .single();

const prompt = `
PERSONA: ${persona.full_name}
BLOCO: ${bloco.nome}
KPIs DO BLOCO: ${bloco.kpis.join(', ')}

Liste competências TÉCNICAS necessárias para:
1. Monitorar esses KPIs
2. Tomar decisões baseadas neles
3. Melhorar essas métricas

Para cada competência, defina:
- Nome da competência
- Como ela impacta qual KPI
- Nível atual (1-5)
- Nível desejado (1-5)
- Plano de desenvolvimento

Retorne JSON...
`;
```

---

## 📊 RESUMO DAS ADAPTAÇÕES

| Script | Mudança Principal | Prioridade |
|--------|-------------------|------------|
| **01** | Criar personas baseadas em blocos funcionais + OKRs | 🔴 CRÍTICA |
| **02** | Biografias com contexto de OKR ownership | 🔴 CRÍTICA |
| **03** | Atribuições = Responsabilidades por resultados | 🔴 CRÍTICA |
| **04** | Competências alinhadas aos KPIs dos blocos | 🟡 ALTA |
| **05** | Avatares (sem mudanças necessárias) | 🟢 BAIXA |
| **06** | Automação baseada em atribuições-resultado | 🟡 ALTA |
| **07** | Workflows N8N (sem mudanças necessárias) | 🟢 BAIXA |
| **08** | ML para otimizar OKRs | 🟡 MÉDIA |
| **09** | Auditoria de progresso de OKRs | 🟡 MÉDIA |
| **10** | RAG com contexto estratégico | 🟡 MÉDIA |
| **11** | Test RAG (sem mudanças necessárias) | 🟢 BAIXA |

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Scripts Críticos (Esta Sprint)**
```bash
✅ Script 00 - Company Foundation (JÁ IMPLEMENTADO)
🔄 Script 01 - Adaptar para blocos funcionais
🔄 Script 02 - Enriquecer biografias com OKRs
🔄 Script 03 - Mudar de tarefas para resultados
```

### **Fase 2: Scripts Complementares (Próxima Sprint)**
```bash
🔄 Script 04 - Alinhar competências com KPIs
🔄 Script 06 - Automação baseada em resultados
🔄 Script 08 - ML para otimizar OKRs
🔄 Script 09 - Auditoria de progresso
```

### **Fase 3: Otimizações (Sprint Futura)**
```bash
🔄 Script 10 - RAG com contexto estratégico
✅ Scripts 05, 07, 11 - Já funcionam sem alterações
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após adaptar cada script, validar:

- [ ] Script busca dados das novas tabelas (empresas_*)
- [ ] Prompts LLM incluem contexto estratégico
- [ ] Dados salvos incluem vínculos (bloco_funcional_id, okr_owner_ids)
- [ ] Output é baseado em RESULTADOS, não TAREFAS
- [ ] Logs mostram contexto estratégico carregado
- [ ] Testes com empresa real (ARVA) funcionam

---

**Status:** 📋 Documento de planejamento  
**Próximo passo:** Implementar adaptações nos Scripts 01-03 (críticos)  
**Estimativa:** 2-3 dias de trabalho focado
