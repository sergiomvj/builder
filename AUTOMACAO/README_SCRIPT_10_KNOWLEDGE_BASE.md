# Script 10: Knowledge Base Generation - Guia de Uso

## 📚 Visão Geral

O Script 10 completa o sistema RAG (Retrieval-Augmented Generation) do VCM, transformando as recomendações do Script 6.5 em uma base de conhecimento vetorial pesquisável.

## 🔄 Fluxo de Processamento

```
Documentos → Chunking → Embeddings → Vector Storage → RAG Ready
```

### Componentes Criados:

1. **src/sql/create_knowledge_chunks_table.sql**
   - Tabela PostgreSQL com suporte a pgvector
   - Índice HNSW para busca vetorial otimizada
   - Campos: id, persona_id, topic, content, embedding (1536d), source, chunk_index, metadata

2. **AUTOMACAO/lib/text-chunker.js**
   - 3 estratégias: fixed-size, semantic, hybrid (recomendada)
   - Overlap configurável para manter contexto
   - Validação de chunks (tamanho, tokens, limites do modelo)

3. **AUTOMACAO/lib/embedding-generator.js**
   - OpenAI text-embedding-3-small (1536 dimensões)
   - Batch processing com retry logic
   - Estimativa de custos: $0.00002/1K tokens
   - Validação de embeddings (normalização, dimensões)

4. **AUTOMACAO/10_generate_knowledge_base.js**
   - Script principal de processamento
   - Suporta arquivos TXT e MD (expansível para PDF/DOCX)
   - Matching inteligente de personas baseado em tópicos (Script 6.5)
   - ExecutionTracker integrado para monitoramento real-time

5. **src/app/api/knowledge/upload/route.ts**
   - API endpoint para upload de documentos
   - Validação de extensão e tamanho (max 10MB)
   - Organização por empresa em diretórios

## 🚀 Como Usar

### Passo 1: Criar tabela no banco (executar uma vez)

Execute o SQL no Supabase:

```bash
# Via Supabase Dashboard → SQL Editor
# Cole o conteúdo de src/sql/create_knowledge_chunks_table.sql
```

Ou via psql:

```bash
psql -h db.fzyokrvdyeczhfqlwxzb.supabase.co -U postgres -d postgres -f src/sql/create_knowledge_chunks_table.sql
```

### Passo 2: Preparar documentos

Crie arquivos de texto com conhecimento específico para suas personas:

```
AUTOMACAO/knowledge_uploads/
├── sales_training.txt
├── crm_best_practices.md
├── customer_service_guide.txt
└── technical_documentation.md
```

### Passo 3: Executar processamento

```bash
cd AUTOMACAO

# Processar um arquivo
node 10_generate_knowledge_base.js \
  --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4 \
  --source=knowledge_uploads/sales_training.txt

# Processar um diretório completo
node 10_generate_knowledge_base.js \
  --empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4 \
  --source=knowledge_uploads/
```

### Passo 4 (Opcional): Upload via API

```bash
# Upload de arquivo via API
curl -X POST http://localhost:3001/api/knowledge/upload \
  -F "file=@documento.txt" \
  -F "empresaId=27470d32-9cce-4975-9a62-1d76f3ab77a4" \
  -F "topic=Sales Training"
```

A resposta inclui o comando para processar:

```json
{
  "success": true,
  "command": "node AUTOMACAO/10_generate_knowledge_base.js --empresaId=... --source=..."
}
```

## 📊 Saída do Script

```
📚 Script 10: Knowledge Base Generation

📂 Carregando documentos...
✅ 1 documento(s) carregado(s)
   📄 sales_training.txt (15432 chars, ~4409 tokens)

👥 Buscando personas...
✅ 16 personas encontradas

🎯 Buscando recomendações RAG...
✅ 16 recomendações encontradas

📖 Processando: sales_training.txt
   🔪 Dividindo em chunks (500-1500 chars)...
   ✅ 12 chunks criados
   🧠 Gerando embeddings...
   📦 Processando lote 1/1 (12 textos)...
   ✅ 12 embeddings gerados (4409 tokens, $0.0001)
   💾 Salvando chunks no banco...
   ✅ 48 chunks salvos (12 chunks × 4 personas relevantes)

======================================================================
📊 RESUMO FINAL
======================================================================
📄 Documentos processados: 1
🔪 Total de chunks: 12
🧠 Total de embeddings: 12
💾 Chunks salvos no banco: 48
⚠️ Erros: 0
🪙 Tokens consumidos: 4,409
💰 Custo estimado: $0.0001
======================================================================
```

## 🔍 Matching de Personas

O script usa recomendações do Script 6.5 para associar chunks às personas relevantes:

1. **Score por tópico recomendado**: +3 pontos
2. **Score por área de conhecimento**: +2 pontos
3. **Score por cargo/departamento**: +1 ponto

Exemplo:
- Chunk sobre "CRM Management" → Personas: Sales Manager, Sales Representative, Customer Support
- Chunk sobre "Financial Analysis" → Personas: CFO, Financial Analyst, Accounting Specialist

## 💰 Custos Estimados

OpenAI text-embedding-3-small: **$0.00002 por 1K tokens**

Exemplos:
- Documento de 10 páginas (~5K tokens) = $0.0001
- Manual de 100 páginas (~50K tokens) = $0.001
- Base de 1000 páginas (~500K tokens) = $0.01

**Muito mais barato que LLM de geração!**

## 🎯 Próximos Passos

Após executar Script 10, sua base de conhecimento vetorial estará pronta para:

### 1. Busca Semântica (Similarity Search)

```sql
-- Buscar top 5 chunks mais relevantes para uma query
SELECT 
  kc.content,
  kc.topic,
  p.nome AS persona_nome,
  1 - (kc.embedding <=> $query_embedding) AS similarity
FROM knowledge_chunks kc
JOIN personas p ON p.id = kc.persona_id
WHERE p.empresa_id = $empresa_id
  AND kc.persona_id = $persona_id
ORDER BY kc.embedding <=> $query_embedding
LIMIT 5;
```

### 2. RAG Integration (Script 11 - futuro)

Próximo script integrará:
- Query embedding generation
- Top-k retrieval
- Context injection em prompts LLM
- Resposta aumentada com conhecimento específico

### 3. Interface de Chat

Criar interface onde usuário:
- Seleciona persona
- Faz pergunta
- Recebe resposta baseada em conhecimento vetorial + LLM

## 🐛 Troubleshooting

### Erro: "pgvector extension not found"

```sql
-- Habilitar extensão no Supabase
CREATE EXTENSION IF NOT EXISTS vector;
```

### Erro: "OPENAI_API_KEY não configurada"

```bash
# Adicionar em .env.local
OPENAI_API_KEY=sk-proj-...
```

### Chunks muito grandes

Ajustar configuração em `10_generate_knowledge_base.js`:

```javascript
const CHUNK_MAX_SIZE = 1000; // Reduzir de 1500 para 1000
const CHUNK_OVERLAP = 150;   // Reduzir proporcionalmente
```

### Nenhuma persona relevante

Script atribui conhecimento a TODAS personas quando não encontra match específico. Verifique recomendações do Script 6.5:

```bash
node 06.5_generate_rag_recommendations.js --empresaId=...
```

## 📈 Monitoramento

Status do Script 10 aparece na UI da empresa:

- ✅ **knowledge_base: true** → Chunks processados e armazenados
- ⏳ **knowledge_base: false** → Nenhum documento processado ainda

LiveExecutionMonitor mostra progresso em tempo real:
- Documento sendo processado
- Chunks criados
- Embeddings gerados
- Salvamento no banco

## 🔗 Referências

- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
