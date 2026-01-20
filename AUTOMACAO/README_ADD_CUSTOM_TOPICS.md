# 🎯 Script 06.76 - Adicionar Tópicos Customizados ao RAG

## 📋 Objetivo

Permite **ampliar as recomendações RAG** geradas automaticamente pelo Script 06.5 com **tópicos especializados** definidos manualmente, mantendo integração completa com personas e sistema de conhecimento.

---

## 🎯 Casos de Uso

### 1. Conhecimento Específico do Setor
```bash
# Exemplo: Empresa veterinária
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  --cargo="Veterinário" \
  --topicos="Nutrição de ruminantes,Legislação MAPA,Vacinação equina"
```

### 2. Processos Internos da Empresa
```bash
# Exemplo: Fluxo de vendas específico
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  --department="Vendas" \
  --topicos="Fluxo vendas B2B distribuidores,Negociação grandes contas"
```

### 3. Conhecimento Jurídico/Regulatório
```bash
# Exemplo: Aspectos legais
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  --cargo="Advogado" \
  --topicos="Regulamentação ANVISA,Contratos distribuição,Compliance farmacêutico"
```

### 4. Tópico para Persona Específica
```bash
# Exemplo: Diretor precisa de conhecimento exclusivo
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  --personaId=UUID_DO_DIRETOR \
  --topicos="Fusões e aquisições no agronegócio,Estratégia de expansão regional"
```

---

## 🚀 Formas de Uso

### **OPÇÃO 1: Linha de Comando (Rápido)**

```bash
# Sintaxe básica
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  [--personaId=UUID | --cargo="Cargo" | --department="Depto"] \
  --topicos="Tópico 1,Tópico 2,Tópico 3" \
  [--areas="Área 1,Área 2"]

# Exemplos práticos

# 1. Todos os veterinários
node 06.76_add_custom_topics.js \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --cargo="Veterinário" \
  --topicos="Nutrição animal,Legislação MAPA" \
  --areas="Medicina preventiva,Regulamentação"

# 2. Todo o departamento jurídico
node 06.76_add_custom_topics.js \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --department="Jurídico" \
  --topicos="Lei 13.123/2015,Regulamento ANVISA 2024"

# 3. Persona específica
node 06.76_add_custom_topics.js \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --personaId=abc123-def456-ghi789 \
  --topicos="Gestão de crise,Comunicação executiva"
```

---

### **OPÇÃO 2: Arquivo JSON (Em Massa)**

**Criar arquivo `topicos_veterinaria.json`:**
```json
[
  {
    "cargo": "Veterinário",
    "topicos": [
      "Nutrição e alimentação de ruminantes",
      "Manejo sanitário de bovinos de corte",
      "Protocolos de vacinação em equinos",
      "Diagnóstico de doenças aviárias",
      "Legislação veterinária brasileira atualizada"
    ],
    "areas": [
      "Medicina veterinária preventiva",
      "Nutrição animal avançada",
      "Regulamentação MAPA"
    ]
  },
  {
    "cargo": "Advogado",
    "topicos": [
      "Legislação de medicamentos veterinários",
      "Regulamentação ANVISA para produtos vet",
      "Contratos de distribuição B2B",
      "Compliance em vendas de controlados"
    ],
    "areas": [
      "Direito sanitário",
      "Direito comercial veterinário"
    ]
  },
  {
    "department": "Vendas",
    "topicos": [
      "Fluxo de vendas B2B para distribuidores",
      "Negociação com grandes contas",
      "Ciclo de vendas consultivas produtos técnicos"
    ]
  }
]
```

**Executar:**
```bash
node 06.76_add_custom_topics.js \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --file=topicos_veterinaria.json
```

**Saída:**
```
➕ SCRIPT 06.76 - ADICIONAR TÓPICOS CUSTOMIZADOS
===================================================

🏢 Empresa: LifeWayUSA (LIFEWAY)

3️⃣ Processando tópicos customizados...

👥 Encontradas 3 persona(s):
   • Dr. João Silva (Veterinário Especialista)
   • Dr. Maria Santos (Veterinária Clínica)
   • Dr. Pedro Costa (Veterinário Chefe)

   ✅ Dr. João Silva: 2 registro(s) criado(s)
   ✅ Dr. Maria Santos: 2 registro(s) criado(s)
   ✅ Dr. Pedro Costa: 2 registro(s) criado(s)

👥 Encontradas 1 persona(s):
   • Dra. Ana Oliveira (Advogada)

   ✅ Dra. Ana Oliveira: 2 registro(s) criado(s)

👥 Encontradas 8 persona(s) no departamento Vendas
   ✅ Carlos Mendes: 1 registro(s) criado(s)
   [... mais 7 personas ...]

📊 RELATÓRIO FINAL
==================
✅ Personas atualizadas: 12
📝 Tópicos/áreas adicionados: 16
❌ Erros: 0

🚀 PRÓXIMOS PASSOS:
   1. Execute o Script 06.75 para exportar TODOS os tópicos:
      node 06.75_export_topics_for_generation.js --empresaId=UUID
   
   2. Gere documentos completos para os novos tópicos
   
   3. Salve em knowledge_docs/
   
   4. Execute Script 10 para ingestão
```

---

## 🔄 Fluxo Completo Integrado

```
┌──────────────────────────────────────────────────────────────────┐
│  1. GERAR RECOMENDAÇÕES AUTOMÁTICAS (Script 06.5)               │
└──────────────────────────────────────────────────────────────────┘
   node 06.5_generate_rag_recommendations.js --empresaId=UUID
   
   Saída: 40 personas × 4 registros = 160 recomendações em rag_knowledge

┌──────────────────────────────────────────────────────────────────┐
│  2. ADICIONAR TÓPICOS CUSTOMIZADOS (Script 06.76) ⭐ NOVO        │
└──────────────────────────────────────────────────────────────────┘
   node 06.76_add_custom_topics.js --empresaId=UUID --file=custom.json
   
   Saída: +12 personas atualizadas, +45 tópicos especializados
   Total: 160 + 45 = 205 recomendações

┌──────────────────────────────────────────────────────────────────┐
│  3. EXPORTAR TODOS OS TÓPICOS (Script 06.75)                    │
└──────────────────────────────────────────────────────────────────┘
   node 06.75_export_topics_for_generation.js --empresaId=UUID
   
   Saída: RAG_TOPICS_EMPRESA.txt
   • 85 tópicos automáticos + 45 customizados = 130 tópicos únicos

┌──────────────────────────────────────────────────────────────────┐
│  4. GERAR DOCUMENTOS (Interface LLM Externa)                     │
└──────────────────────────────────────────────────────────────────┘
   ChatGPT/Claude: Transformar 130 tópicos em documentos completos
   
   Saída: knowledge_docs/ com 130 arquivos .txt

┌──────────────────────────────────────────────────────────────────┐
│  5. INGERIR CONHECIMENTO (Script 10)                            │
└──────────────────────────────────────────────────────────────────┘
   node 10_generate_knowledge_base.js --empresaId=UUID --source=knowledge_docs/
   
   Saída: ~1.900 chunks + embeddings prontos para RAG
```

---

## 📊 Estrutura no Banco de Dados

### Tabela: `rag_knowledge`

```sql
-- Registro customizado criado pelo Script 06.76
{
  persona_id: "abc-123-def-456",
  tipo: "documento",
  titulo: "Tópicos Customizados",
  conteudo: "Nutrição de ruminantes\nLegislação MAPA\nVacinação equina",
  categoria: "custom",
  tags: ["custom", "manual"],
  relevancia: 1.0,
  ativo: true
}

-- Se já existe, ATUALIZA (adiciona aos tópicos existentes, sem duplicatas)
```

---

## 🎯 Exemplo Prático Completo

### **Cenário: Empresa Veterinária**

```bash
# PASSO 1: Gerar recomendações automáticas (base)
cd AUTOMACAO
node 06.5_generate_rag_recommendations.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad

# Output: 40 personas → 160 recomendações

# PASSO 2: Adicionar conhecimento especializado
node 06.76_add_custom_topics.js \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --file=topicos_veterinaria.json

# Output: +45 tópicos customizados para veterinários, advogados e vendas

# PASSO 3: Exportar TUDO (automático + customizado)
node 06.75_export_topics_for_generation.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad

# Output: RAG_TOPICS_LIFEWAY_1733712345.txt
#         130 tópicos únicos (85 auto + 45 custom)

# PASSO 4: Gerar documentos no ChatGPT
# [Processo manual - usar tópicos do arquivo exportado]

# PASSO 5: Ingerir documentos
node 10_generate_knowledge_base.js \
  --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad \
  --source=knowledge_docs/

# Output: 130 docs → 1.900 chunks + embeddings
```

---

## 🔍 Comportamento Inteligente

### **Atualização sem Duplicatas**
```bash
# Primeira execução
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  --cargo="Veterinário" \
  --topicos="Nutrição,Legislação"

# Output: ✅ 2 tópicos adicionados

# Segunda execução (mesmo cargo, novos tópicos)
node 06.76_add_custom_topics.js \
  --empresaId=UUID \
  --cargo="Veterinário" \
  --topicos="Legislação,Vacinação,Diagnóstico"  # "Legislação" já existe

# Output: ✅ 2 novo(s) tópico(s) adicionado(s) (atualizado)
#         (Vacinação e Diagnóstico adicionados, Legislação ignorada)
```

---

## 💡 Dicas e Boas Práticas

### ✅ DO - Recomendado

```bash
# 1. Use nomes descritivos e específicos
✅ "Nutrição e alimentação de ruminantes em sistemas intensivos"
❌ "Nutrição"

# 2. Separe tópicos relacionados
✅ --topicos="Legislação MAPA 2024,Regulamento ANVISA,Compliance farmacêutico"
❌ --topicos="Legislação e regulamentação"

# 3. Use arquivo JSON para múltiplas personas
✅ node 06.76_add_custom_topics.js --file=topicos_setor.json
❌ Executar script 40 vezes manualmente

# 4. Execute Script 06.75 DEPOIS de adicionar customizados
✅ 06.5 → 06.76 → 06.75 → ChatGPT → 10
❌ 06.5 → 06.75 → 06.76 (tópicos custom ficam de fora)
```

### ❌ DON'T - Evitar

```bash
# 1. Tópicos muito genéricos
❌ --topicos="Vendas,Marketing,Gestão"

# 2. Duplicar tópicos que já existem no 06.5
❌ Adicionar "Gestão de tempo" se já foi gerado automaticamente

# 3. Tópicos sem relação com a persona
❌ Adicionar "Medicina veterinária" para persona de Finanças
```

---

## 📂 Arquivos de Exemplo

O repositório inclui:
- `topicos_custom_EXAMPLE.json` - Template completo
- `README_ADD_CUSTOM_TOPICS.md` - Esta documentação

---

## 🆘 Troubleshooting

### Erro: "Nenhuma persona encontrada"
```bash
# Verifique se o cargo/department existe
node 06.76_add_custom_topics.js --empresaId=UUID --cargo="Veterinario"  # ❌ sem acento
node 06.76_add_custom_topics.js --empresaId=UUID --cargo="Veterinário" # ✅ com acento
```

### Erro: "Nenhum tópico ou área fornecido"
```bash
# Certifique-se de passar --topicos OU --areas
node 06.76_add_custom_topics.js --empresaId=UUID --cargo="Vet"  # ❌ faltou --topicos
node 06.76_add_custom_topics.js --empresaId=UUID --cargo="Vet" --topicos="X,Y"  # ✅
```

### Arquivo JSON inválido
```json
// ❌ ERRADO
{
  "cargo": "Veterinário",
  "topicos": ["X", "Y"]
}

// ✅ CORRETO (deve ser array)
[
  {
    "cargo": "Veterinário",
    "topicos": ["X", "Y"]
  }
]
```

---

## 🎉 Pronto!

Agora você tem controle total sobre o conhecimento RAG:
- ✅ Recomendações automáticas via Script 06.5
- ✅ Tópicos customizados via Script 06.76
- ✅ Exportação consolidada via Script 06.75
- ✅ Ingestão unificada via Script 10

**Sistema RAG completo e extensível! 🚀**
