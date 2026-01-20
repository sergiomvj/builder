# 🚀 SCRIPT 01 V5.0 - GUIA DE USO

## 📋 Visão Geral

O **Script 01 V5.0** substitui o antigo Script 01, implementando o paradigma **top-down** do VCM v5.0.

### Diferenças vs Versão Antiga

| Aspecto | Script 01 (v4.0) | Script 01 V5.0 |
|---------|------------------|----------------|
| **Input** | Nada (gera cargos genéricos) | Blocos Funcionais + OKRs (Script 00) |
| **Lógica** | LLM cria "CEO, CTO, Dev..." | LLM cria cargos baseados em OKRs |
| **Output** | Cargos genéricos | Cargos com ownership de resultados |
| **Vinculação** | Nenhuma | Persona → OKR → Objetivo Estratégico |

---

## ⚙️ Pré-requisitos

### 1. Executar Script 00 Primeiro
```bash
cd AUTOMACAO
node 00_generate_company_foundation.js
```

O Script 00 deve ter criado:
- ✅ Blocos Funcionais (tabela `empresas_blocos_funcionais`)
- ✅ OKRs (tabela `empresas_okrs`)
- ✅ Cadeia de Valor (tabela `empresas_value_stream`)

### 2. Adicionar Campos na Tabela personas
```sql
-- Execute o SQL no Supabase SQL Editor:
psql -h [host] -U [user] -d [database] -f add_personas_v5_fields.sql

-- OU copie e cole o conteúdo de add_personas_v5_fields.sql
-- no Supabase Dashboard > SQL Editor
```

Campos adicionados:
- `bloco_funcional_id` (UUID)
- `bloco_funcional_nome` (TEXT)
- `okr_owner_ids` (UUID[])
- `responsabilidade_resultado` (TEXT)
- `metricas_responsabilidade` (TEXT[])
- `nivel_hierarquico` (TEXT)

---

## 🚀 Como Executar

### Comando Básico
```bash
cd AUTOMACAO
node 01_create_personas_from_structure_v5.js --empresaId=UUID_DA_EMPRESA
```

### Exemplo com ARVA Tech
```bash
node 01_create_personas_from_structure_v5.js --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4
```

---

## 📊 O Que o Script Faz

### STEP 1: Buscar Fundação Estratégica
```
✅ Blocos Funcionais (ex: Marketing & Aquisição, Vendas & Fechamento)
✅ OKRs com ownership (ex: Aumentar leads em 30%)
✅ Cadeia de Valor (6 estágios)
```

### STEP 2: Gerar Cargos por Bloco Funcional
Para cada bloco funcional, a LLM gera 2-5 cargos:

**Exemplo para "Marketing & Aquisição":**
```json
{
  "cargos": [
    {
      "titulo": "Gerente de Marketing Digital",
      "nivel_hierarquico": "gerencial",
      "responsabilidade_resultado": "Gerar 150 leads qualificados/mês com CAC < $50",
      "metricas_responsabilidade": ["CAC", "Leads qualificados", "Taxa de conversão"],
      "okr_owner_ids": ["uuid-do-okr-de-leads"]
    },
    {
      "titulo": "Especialista em SEO",
      "nivel_hierarquico": "especialista",
      "responsabilidade_resultado": "Aumentar tráfego orgânico em 40%",
      "metricas_responsabilidade": ["Sessões orgânicas", "Posição média Google", "CTR"]
    }
  ]
}
```

### STEP 3: Criar Personas no Banco
```sql
INSERT INTO personas (
  persona_code,
  specialty,
  department,
  bloco_funcional_id,
  okr_owner_ids,
  responsabilidade_resultado,
  metricas_responsabilidade,
  nivel_hierarquico,
  ...
) VALUES (...);
```

---

## 📤 Output Esperado

### Console
```
🏗️  SCRIPT 01 V5.0 - CRIAÇÃO DE PERSONAS (TOP-DOWN)
===================================================

✅ Empresa: ARVA Tech Solutions

1️⃣ Buscando blocos funcionais...
✅ 8 blocos funcionais encontrados:
   1. Estratégia & Gestão
   2. Marketing & Aquisição
   3. Vendas & Fechamento
   ...

2️⃣ Buscando OKRs...
✅ 12 OKRs encontrados:
   1. Aumentar leads qualificados em 30%
   2. Melhorar taxa de conversão em 20%
   ...

3️⃣ Gerando cargos para bloco: Marketing & Aquisição...
✅ 3 cargo(s) gerado(s):
   1. Gerente de Marketing Digital (gerencial)
      Responsabilidade: Gerar 150 leads/mês com CAC < $50
      Métricas: CAC, Leads qualificados, Taxa de conversão

   2. Especialista em SEO (especialista)
      Responsabilidade: Aumentar tráfego orgânico em 40%
      Métricas: Sessões orgânicas, CTR, Posição média

   3. Analista de Performance (especialista)
      Responsabilidade: Reduzir custo por lead em 15%
      Métricas: CAC, ROI de campanhas, Budget vs. resultado

[... repetir para cada bloco ...]

4️⃣ Criando personas no banco de dados...
🌍 Distribuindo 24 cargos entre nacionalidades
   ✅ ARVA-EST1 - CEO (gerencial)
   ✅ ARVA-EST2 - Diretor de Estratégia (gerencial)
   ✅ ARVA-MAR1 - Gerente de Marketing Digital (gerencial)
   ...

✅ 24 personas criadas/atualizadas com sucesso!

📄 Estrutura salva em: estrutura_organizacional_output/ARVA_structure_v5.json

🎉 SCRIPT 01 V5.0 CONCLUÍDO COM SUCESSO!
```

### Arquivo JSON Gerado
```json
{
  "empresa": {
    "id": "27470d32-9cce-4975-9a62-1d76f3ab77a4",
    "nome": "ARVA Tech Solutions",
    "codigo": "ARVA"
  },
  "blocos_funcionais": 8,
  "okrs_total": 12,
  "personas_criadas": 24,
  "estrutura": [
    {
      "bloco": {
        "id": "uuid",
        "nome": "Marketing & Aquisição",
        "objetivo": "Gerar 150 leads qualificados/mês",
        "kpis": ["CAC", "Leads qualificados", "Taxa de conversão"]
      },
      "cargos": [
        {
          "titulo": "Gerente de Marketing Digital",
          "nivel_hierarquico": "gerencial",
          "responsabilidade_resultado": "Gerar 150 leads/mês com CAC < $50",
          "metricas_responsabilidade": ["CAC", "Leads", "Conversão"],
          "okr_owner_ids": ["uuid-okr-1", "uuid-okr-2"]
        }
      ],
      "okrsRelacionados": [...]
    }
  ],
  "gerado_em": "2025-12-06T..."
}
```

### Banco de Dados
```sql
-- Verificar personas criadas
SELECT 
  persona_code,
  specialty,
  bloco_funcional_nome,
  responsabilidade_resultado,
  nivel_hierarquico,
  array_length(okr_owner_ids, 1) as total_okrs
FROM personas
WHERE empresa_id = '27470d32-9cce-4975-9a62-1d76f3ab77a4'
ORDER BY bloco_funcional_nome, nivel_hierarquico DESC;
```

---

## 🎯 Níveis Hierárquicos

### **Gerencial**
- Owner de 1+ OKRs
- Toma decisões estratégicas
- Gerencia equipe
- Exemplo: "Gerente de Marketing Digital"

### **Especialista**
- Executa com autonomia
- Especialista técnico
- Não gerencia pessoas
- Exemplo: "Especialista em SEO"

### **Operacional**
- Executa tarefas específicas
- Menos autonomia
- Suporte a especialistas
- Exemplo: "Assistente de Marketing"

---

## 🔗 Vinculações Criadas

### Persona → Bloco Funcional
```
Gerente de Marketing → Marketing & Aquisição
```

### Persona → OKR (Owner)
```
Gerente de Marketing → OKR "Aumentar leads em 30%"
```

### OKR → Objetivo Estratégico
```
OKR "Aumentar leads em 30%" → Objetivo "Crescer receita em 25%"
```

### Cadeia Completa
```
Missão da Empresa
    ↓
Objetivo Estratégico: Crescer receita em 25%
    ↓
OKR: Aumentar leads em 30%
    ↓
Persona: Gerente de Marketing Digital
    ↓
Responsabilidade: Gerar 150 leads/mês com CAC < $50
    ↓
Métricas: CAC, Leads qualificados, Taxa de conversão
```

---

## 🐛 Troubleshooting

### Erro: "Nenhum bloco funcional encontrado"
```bash
# Solução: Execute o Script 00 primeiro
node 00_generate_company_foundation.js
```

### Erro: "column personas.bloco_funcional_id does not exist"
```bash
# Solução: Execute o SQL de migração
# Copie o conteúdo de add_personas_v5_fields.sql
# Cole no Supabase SQL Editor e execute
```

### Erro: "LLM retornou JSON inválido"
```bash
# Solução: O script tem fallback automático
# Se persistir, verifique se GOOGLE_AI_API_KEY está configurada
echo $GOOGLE_AI_API_KEY
```

### Personas criadas mas sem OKR ownership
```bash
# Solução: Verifique se os OKRs têm area_responsavel correspondente
SELECT id, titulo, area_responsavel FROM empresas_okrs;

# A LLM vincula OKRs baseado em nome do bloco vs area_responsavel
```

---

## ✅ Validação

Após executar o script, valide:

```sql
-- 1. Verificar personas criadas
SELECT COUNT(*) FROM personas WHERE empresa_id = 'UUID';

-- 2. Verificar vinculação com blocos
SELECT 
  bloco_funcional_nome,
  COUNT(*) as total_personas
FROM personas
WHERE empresa_id = 'UUID'
GROUP BY bloco_funcional_nome;

-- 3. Verificar owners de OKRs
SELECT 
  p.specialty,
  array_length(p.okr_owner_ids, 1) as total_okrs_owned
FROM personas p
WHERE p.empresa_id = 'UUID'
AND p.okr_owner_ids IS NOT NULL
ORDER BY total_okrs_owned DESC;

-- 4. Verificar níveis hierárquicos
SELECT 
  nivel_hierarquico,
  COUNT(*) as total
FROM personas
WHERE empresa_id = 'UUID'
GROUP BY nivel_hierarquico;
```

---

## 📋 Próximos Passos

Após executar o Script 01 V5.0:

```bash
# 1. Executar Script 02 V5.0 (biografias com contexto de OKRs)
node 02_generate_biografias_COMPLETO_v5.js --empresaId=UUID

# 2. Executar Script 03 V5.0 (atribuições = resultados)
node 03_generate_atribuicoes_contextualizadas_v5.js --empresaId=UUID

# 3. Continuar com Scripts 04-11 normalmente
node 04_generate_competencias_grok.js --empresaId=UUID
# ...
```

---

## 📊 Comparação de Resultados

### ANTES (Script 01 v4.0)
```
16 personas criadas com cargos genéricos:
- CEO
- CTO
- Desenvolvedor Senior
- Designer
- Gerente de Vendas
...
```

### DEPOIS (Script 01 v5.0)
```
24 personas criadas com contexto estratégico:

Bloco: Marketing & Aquisição (3 personas)
  - Gerente de Marketing Digital (owner de 2 OKRs)
  - Especialista em SEO
  - Analista de Performance

Bloco: Vendas & Fechamento (2 personas)
  - Gerente de Vendas (owner de 1 OKR)
  - Executivo de Contas

...
```

---

**Versão:** 5.0.0  
**Data:** Dezembro 2025  
**Status:** ✅ Pronto para uso  
**Dependências:** Script 00, SQL migrations
