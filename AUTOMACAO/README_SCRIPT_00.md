# 🏢 SCRIPT 00 - COMPANY FOUNDATION GENERATOR

## 📋 Visão Geral

O **Script 00** é o **PRIMEIRO** script a ser executado ao criar uma nova empresa no VCM. Ele estabelece a **fundação estratégica** completa da empresa usando o paradigma **top-down**:

```
Missão → Objetivos → OKRs → Value Stream → Blocos Funcionais → Governança
```

Este é o **novo ponto de partida** do VCM v5.0, alinhado com a filosofia de **Company Operating System**.

---

## 🎯 O Que Este Script Faz

### 1. **Coleta Dados do Usuário** (Formulário CLI)
- 🆔 ID da Empresa (UUID)
- 🎯 Escopo de Atuação
- 📦 Produtos/Serviços
- 💎 Proposta de Valor
- 🧭 Missão Operacional (opcional - pode ser gerada pela LLM)
- 🎯 Objetivos Estratégicos Iniciais (opcional)

### 2. **Gera com LLM (Google Gemini)**
- ✅ Missão Operacional estruturada
- ✅ 3-7 Objetivos Estratégicos Globais quantificáveis
- ✅ OKRs detalhados (Objectives & Key Results) com ownership
- ✅ Cadeia de Valor completa (6 estágios)
- ✅ Blocos Funcionais necessários (departamentos)
- ✅ Regras de Governança (quem decide, executa, mede, corrige, audita)

### 3. **Salva no Banco de Dados** (6 Novas Tabelas)
- `empresas_missao`
- `empresas_objetivos_estrategicos`
- `empresas_okrs`
- `empresas_value_stream`
- `empresas_blocos_funcionais`
- `empresas_governanca`

---

## 🚀 Como Executar

### Pré-requisitos
```bash
# 1. Ter uma empresa criada no banco
# 2. Ter as variáveis de ambiente configuradas (.env.local):
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
GOOGLE_AI_API_KEY=sua_chave_gemini
```

### Execução
```bash
cd AUTOMACAO
node 00_generate_company_foundation.js
```

### Exemplo de Input
```
🆔 ID da Empresa (UUID): 27470d32-9cce-4975-9a62-1d76f3ab77a4

🎯 Escopo de Atuação: Consultoria especializada em programas de vacinação para rebanhos bovinos

📦 Produtos/Serviços: Consultoria técnica, treinamentos presenciais, auditoria de programas de vacinação, desenvolvimento de protocolos personalizados

💎 Proposta de Valor: Reduzir mortalidade de rebanhos em até 40% através de programas de vacinação cientificamente otimizados

🧭 Missão Operacional (deixe vazio para gerar via LLM): [ENTER]

🎯 Objetivos Estratégicos Iniciais: Aumentar receita em 30%, Expandir para 5 estados, Treinar 200 produtores
```

---

## 📊 Output Esperado

### Console
```
🏢 SCRIPT 00 - COMPANY FOUNDATION GENERATOR
============================================

1️⃣ GERANDO MISSÃO OPERACIONAL...
✅ Missão operacional gerada com sucesso
📝 Fornecer consultoria técnica especializada em programas...

2️⃣ GERANDO OBJETIVOS ESTRATÉGICOS GLOBAIS...
✅ 5 objetivos estratégicos gerados:
   1. Crescer receita recorrente em 30% nos próximos 12 meses
   2. Expandir atuação para 5 estados até o final do ano
   ...

3️⃣ GERANDO OKRs PARA: "Crescer receita recorrente em 30%"...
✅ 1 OKR(s) gerado(s):
   OKR 1: Aumentar base de clientes
      KR1: Aumentar leads qualificados em 40%
      KR2: Melhorar taxa de conversão em 20%
      KR3: Reduzir custo de aquisição em 15%
      Owner: Marketing & Aquisição

[... mais OKRs ...]

4️⃣ GERANDO CADEIA DE VALOR (VALUE STREAM)...
✅ Cadeia de valor mapeada (6 estágios)

5️⃣ GERANDO BLOCOS FUNCIONAIS...
✅ 8 blocos funcionais criados

6️⃣ GERANDO REGRAS DE GOVERNANÇA...
✅ Governança definida para 8 áreas

7️⃣ SALVANDO DADOS NO BANCO...
✅ TODOS OS DADOS SALVOS COM SUCESSO!

🎉 FUNDAÇÃO DA EMPRESA CRIADA COM SUCESSO!
```

### Banco de Dados
```sql
-- 6 tabelas preenchidas:
SELECT * FROM empresas_missao WHERE empresa_id = '...';
SELECT * FROM empresas_objetivos_estrategicos WHERE empresa_id = '...';
SELECT * FROM empresas_okrs WHERE empresa_id = '...';
SELECT * FROM empresas_value_stream WHERE empresa_id = '...';
SELECT * FROM empresas_blocos_funcionais WHERE empresa_id = '...';
SELECT * FROM empresas_governanca WHERE empresa_id = '...';
```

---

## 🔗 Próximos Passos

Após executar o Script 00, a ordem correta é:

```
✅ Script 00 - Company Foundation (EXECUTADO)
⬇️
01 - Create Personas (cria personas baseadas nos blocos funcionais)
⬇️
02 - Generate Biografias (gera biografias vinculadas aos OKRs)
⬇️
03 - Generate Atribuições (atribuições = responsabilidades por resultados)
⬇️
04 - Generate Competências (competências alinhadas aos KPIs dos blocos)
⬇️
05 - Generate Avatares
⬇️
06-11 - Automação, Workflows, ML, RAG, Auditoria
```

---

## 🎨 Interface Web (Company OS)

Acesse no dashboard: **`/company-os`**

Visualize:
- 🎯 Missão Operacional
- 🚀 Objetivos Estratégicos (cards com prioridade)
- 📈 OKRs com progresso visual
- 🔁 Cadeia de Valor (diagrama de fluxo)
- 🏢 Blocos Funcionais (cards com KPIs)
- 🛡️ Status de governança

---

## ⚙️ Configurações Técnicas

### Temperatura LLM
```javascript
// Valores padrão (ajustáveis no código):
- Missão: 0.7 (mais conservadora)
- Objetivos: 0.75 (equilibrada)
- OKRs: 0.8 (mais criativa)
- Value Stream: 0.7 (estruturada)
- Blocos: 0.75 (equilibrada)
- Governança: 0.7 (conservadora)
```

### Rate Limiting
```javascript
// Pausa de 2 segundos entre cada etapa LLM
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Modelo LLM
```javascript
// Google Gemini 1.5 Flash
model: 'gemini-1.5-flash'
responseMimeType: 'application/json'
```

---

## 🐛 Troubleshooting

### Erro: "Empresa não encontrada"
```bash
# Verifique se o UUID está correto:
SELECT id, nome FROM empresas WHERE ativo = true;
```

### Erro: "GOOGLE_AI_API_KEY not found"
```bash
# Configure no .env.local:
echo "GOOGLE_AI_API_KEY=sua_chave" >> .env.local
```

### Erro: "JSON parse error"
```bash
# A LLM retornou texto inválido. Re-execute o script.
# O script tem retry automático em caso de erros de rede.
```

---

## 📚 Referências

- **Documento base**: `Company_direction.md`
- **Filosofia**: Top-down (Missão → Cargos), não Bottom-up (Cargos → Tarefas)
- **Paradigma**: Company Operating System (empresas vivas e autônomas)
- **Inspiração**: OKRs do Google, Value Stream Mapping (Lean), RACI Matrix

---

## 🎯 Diferenças vs VCM v4.0

| Aspecto | VCM v4.0 (Antigo) | VCM v5.0 (Novo) |
|---------|-------------------|-----------------|
| **Ponto de partida** | Estrutura de cargos | Missão operacional |
| **Lógica** | Bottom-up | Top-down |
| **Cargos** | Têm tarefas | Têm ownership de resultados |
| **Métricas** | Individuais | Alinhadas a OKRs globais |
| **Estrutura** | Fixa | Dinâmica (baseada em objetivos) |
| **Governança** | Implícita | Explícita (RACI) |

---

**Versão**: 5.0.0  
**Data**: Dezembro 2025  
**Autor**: VCM Team  
**Status**: ✅ Pronto para produção
