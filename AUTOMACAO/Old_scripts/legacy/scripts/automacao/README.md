# Scripts de Automação VCM

Este diretório contém os 6 scripts principais da automação VCM (Virtual Company Manager) para geração completa de dados das empresas e personas.

## 📋 Sequência de Execução (ORDEM OBRIGATÓRIA)

Execute os scripts **OBRIGATORIAMENTE** nesta ordem sequencial para gerar dados completos:

### Script 01 - Geração de Biografias (PRIMEIRO)
```bash
node 01_generate_biografias.js --empresaId=COMPANY_ID
```
- **Função**: Cria biografias estruturadas completas das personas
- **Input**: Dados básicos das personas (nome, cargo, departamento)  
- **Output**: Campos de biografia na tabela `personas`
- **LLM**: Google Gemini + OpenAI (fallback)
- **⚠️ OBRIGATÓRIO EXECUTAR PRIMEIRO** - Base para todos os outros scripts

### Script 02 - Análise de Competências (SEGUNDO)
```bash
node 02_generate_competencias.js --empresaId=COMPANY_ID
```
- **Função**: Analisa competências técnicas e comportamentais
- **Input**: Biografias estruturadas das personas (Script 01)
- **Output**: Tabela `personas_competencias`
- **LLM**: Google Gemini + OpenAI (fallback)
- **Requer**: Script 01 executado com sucesso

### Script 03 - Geração de Avatares (TERCEIRO)
```bash
node 03_generate_avatares.js --empresaId=COMPANY_ID
```
- **Função**: Gera avatares visuais baseados no perfil completo
- **Input**: Biografias (Script 01) + Competências (Script 02)
- **Output**: Tabela `avatares_personas` com perfis visuais detalhados
- **LLM**: Google Gemini (primário)
- **Requer**: Scripts 01 e 02 executados com sucesso

### Script 04 - Especificações Técnicas (QUARTO)
```bash
node 04_generate_tech_specs.js --empresaId=COMPANY_ID
```
- **Função**: Gera especificações técnicas para a empresa
- **Input**: Competências consolidadas das personas
- **Output**: Tabela `empresas_tech_specs`
- **LLM**: Google Gemini + OpenAI (fallback)
- **Requer**: Scripts 01, 02 e 03 executados

### Script 05 - Base de Conhecimento RAG (QUINTO)
```bash
node 05_generate_rag_knowledge.js --empresaId=COMPANY_ID
```
- **Função**: Consolida base de conhecimento para IA conversacional
- **Input**: Todos os dados dos scripts anteriores
- **Output**: Tabela `empresas_knowledge_base`
- **LLM**: Google Gemini
- **Requer**: Scripts 01, 02, 03 e 04 executados

### Script 06 - Análise de Workflows (SEXTO - FINAL)
```bash
node 06_generate_fluxos_sdr.js --empresaId=COMPANY_ID
```
- **Função**: Mapeia fluxos de trabalho e oportunidades de automação
- **Input**: Base de conhecimento completa e todos os dados
- **Output**: Tabela `empresas_workflows`
- **LLM**: Google Gemini + OpenAI (fallback)
- **Requer**: TODOS os scripts anteriores (01-05) executados

## 🎯 Empresa de Teste Atual

**ARVA Tech Solutions**
- ID: `7761ddfd-0ecc-4a11-95fd-5ee913a6dd17`
- Personas: 15
- Status: Ativa

### Comando de Teste - SEQUÊNCIA COMPLETA
```bash
# Executar cascata completa na ORDEM OBRIGATÓRIA
node 01_generate_biografias.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
node 02_generate_competencias.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
node 03_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
node 04_generate_tech_specs.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
node 05_generate_rag_knowledge.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
node 06_generate_fluxos_sdr.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

## ⚠️ IMPORTANTE: ORDEM DE EXECUÇÃO

A ordem é **CRÍTICA** porque cada script depende dos dados gerados pelo anterior:

1. **Biografias** (01) → Cria perfil base das personas
2. **Competências** (02) → Analisa skills baseadas na biografia  
3. **Avatares** (03) → Gera visual baseado no perfil completo (bio + skills)
4. **Tech Specs** (04) → Especificações técnicas baseadas em competências
5. **Knowledge Base** (05) → Consolida todos os dados anteriores
6. **Workflows** (06) → Análise final baseada em toda a base de conhecimento

## ⚙️ Configuração

### Variáveis de Ambiente
Certifique-se de ter o arquivo `.env` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_AI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### Dependências
```bash
npm install @supabase/supabase-js @google/generative-ai openai dotenv
```

## 📊 Estrutura de Dados

### Tabelas Utilizadas
- `empresas` - Dados principais das empresas
- `personas` - Dados das personas (biografia, skills)
- `avatares_personas` - Avatares visuais gerados via LLM
- `personas_competencias` - Análise detalhada de competências
- `empresas_tech_specs` - Especificações técnicas da empresa
- `empresas_knowledge_base` - Base de conhecimento RAG
- `empresas_workflows` - Análise de fluxos de trabalho

### Rate Limiting
- **Pausa entre personas**: 2 segundos
- **Pausa entre scripts**: Recomendado 30 segundos
- **API Limits**: Gemini 60 req/min, OpenAI varia por tier

## 🔍 Monitoramento

### Status dos Scripts
O status de execução é armazenado em `empresas.scripts_status`:

```json
{
  "biografias": { "running": false, "last_result": "success", "last_run": "2024-11-21T..." },
  "competencias": { "running": false, "last_result": "success", "last_run": "2024-11-21T..." },
  "avatares": { "running": false, "last_result": "success", "last_run": "2024-11-21T..." },
  "tech_specs": { "running": false, "last_result": "success", "last_run": "2024-11-21T..." },
  "knowledge_base": { "running": false, "last_result": "success", "last_run": "2024-11-21T..." },
  "workflows": { "running": false, "last_result": "success", "last_run": "2024-11-21T..." }
}
```

### Logs e Backups
- **Console logs**: Detalhados para cada execução
- **Backups locais**: Salvos em `output/{script_name}/{company_name}/`
- **Formato**: JSON estruturado com metadados

## 🚨 Troubleshooting

### Problemas Comuns
1. **Erro de API Key**: Verificar `.env` e chaves ativas
2. **Rate Limit**: Aguardar ou usar fallback OpenAI
3. **Tabela inexistente**: Executar migrations do Supabase
4. **JSON Parse Error**: LLM retornou formato inválido (usa fallback)

### Recuperação
- Scripts são **idempotentes** - podem ser re-executados
- Dados existentes são **atualizados**, não duplicados
- **Fallback estruturado** quando LLMs falham

## 🎉 Finalização

Após executar todos os scripts, o sistema VCM terá:
- ✅ Biografias estruturadas completas (base de tudo)
- ✅ Análise detalhada de competências baseada nas biografias
- ✅ Avatares visuais baseados no perfil completo
- ✅ Especificações técnicas da empresa
- ✅ Base de conhecimento para IA conversacional
- ✅ Mapeamento de workflows e automação

Os dados estarão prontos para uso no dashboard Next.js e sistemas de IA.