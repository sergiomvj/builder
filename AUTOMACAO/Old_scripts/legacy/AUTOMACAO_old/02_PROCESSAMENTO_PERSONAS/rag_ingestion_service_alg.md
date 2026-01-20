# ALGORITMO: rag_ingestion_service.py
## SERVIÇO DE INGESTÃO DE DADOS PARA RAG KNOWLEDGE BASE

### FUNÇÃO PRINCIPAL
Processar e ingerir dados de empresas virtuais (biografias, competências, workflows, knowledge) em uma estrutura RAG (Retrieval-Augmented Generation) no Supabase.

---

## ALGORITMO PRINCIPAL

### ENTRADA
```
INPUT: 
- empresa_id: ID da empresa para ingestão
- force_update: Boolean para forçar limpeza e reprocessamento
```

### PROCESSO

#### 1. INICIALIZAÇÃO DA CLASSE RAGIngestionService
```
INICIALIZAR:
  base_path = Path(__file__).parent.parent
  load_environment()
  setup_supabase()
```

#### 2. CONFIGURAÇÃO DO AMBIENTE
```
load_environment():
  BUSCAR .env EM [base_path/.env, base_path.parent/.env, cwd/.env]
  PARA cada linha EM .env:
    SE linha contém '=' AND NOT starts_with('#'):
      key, value = linha.split('=', 1)
      os.environ[key] = value
```

#### 3. SETUP SUPABASE
```
setup_supabase():
  url = os.getenv('VCM_SUPABASE_URL')
  key = os.getenv('VCM_SUPABASE_SERVICE_ROLE_KEY')
  
  SE url AND key:
    self.supabase = create_client(url, key)
  SENAO:
    self.supabase = None
    LOG error("Credenciais Supabase não encontradas")
```

---

## ALGORITMO: ingest_empresa_data()

### ENTRADA
```
INPUT: empresa_id (string), force_update (boolean)
```

### PROCESSO

#### 1. CRIAÇÃO DO JOB DE INGESTÃO
```
job_id = uuid4()
job_data = {
  'id': job_id,
  'empresa_id': empresa_id,
  'job_type': 'full_sync',
  'status': 'running',
  'started_at': datetime.now().isoformat()
}

supabase.table('rag_ingestion_jobs').insert(job_data)
```

#### 2. LIMPEZA CONDICIONAL
```
SE force_update == True:
  _clean_empresa_rag_data(empresa_id):
    docs_result = supabase.table('rag_documents').select('id').eq('empresa_id', empresa_id)
    
    PARA cada doc_id EM docs_result.data:
      supabase.table('rag_chunks').delete().eq('document_id', doc_id)
    
    supabase.table('rag_documents').delete().eq('empresa_id', empresa_id)
```

#### 3. PROCESSAMENTO EM CASCATA
```
results = {
  'job_id': job_id,
  'empresa_id': empresa_id,
  'biografias': 0,
  'competencias': 0,
  'workflows': 0,
  'knowledge': 0,
  'errors': []
}

# Sequência obrigatória:
bio_result = _process_biografias(empresa_id)
comp_result = _process_competencias(empresa_id)
work_result = _process_workflows(empresa_id)
know_result = _process_knowledge_base(empresa_id)

# Consolidar resultados
results.update(todos_resultados)
```

#### 4. FINALIZAÇÃO DO JOB
```
total_items = biografias + competencias + workflows + knowledge

job_update = {
  'status': 'completed',
  'completed_at': datetime.now().isoformat(),
  'total_items': total_items,
  'success_items': total_items - len(errors),
  'failed_items': len(errors),
  'error_details': errors
}

supabase.table('rag_ingestion_jobs').update(job_update).eq('id', job_id)
```

### SAÍDA
```
OUTPUT: {
  'job_id': job_id,
  'empresa_id': empresa_id,
  'biografias': count,
  'competencias': count,
  'workflows': count,
  'knowledge': count,
  'errors': [error_list]
}
```

---

## ALGORITMO: _process_biografias()

### ENTRADA
```
INPUT: empresa_id (string)
```

### PROCESSO

#### 1. BUSCAR PERSONAS DA EMPRESA
```
personas_result = supabase.table('personas').select('*').eq('empresa_id', empresa_id)

result = {'success_count': 0, 'errors': []}
```

#### 2. PROCESSAR CADA PERSONA
```
PARA cada persona EM personas_result.data:
  SE NOT persona.biografia_completa:
    CONTINUE
  
  # Criar documento RAG
  doc_data = {
    'id': uuid4(),
    'collection_id': _get_or_create_collection(empresa_id),
    'external_id': f"biografia_{persona.id}",
    'title': f"Biografia: {persona.full_name}",
    'content_raw': persona.biografia_completa,
    'content_length': len(biografia_completa),
    'document_type': 'biografia',
    'language': 'pt',
    'metadata': {
      'persona_id': persona.id,
      'persona_name': persona.full_name,
      'persona_role': persona.role,
      'empresa_id': empresa_id
    },
    'is_active': True,
    'processed_at': datetime.now().isoformat()
  }
  
  # Inserir documento
  supabase.table('rag_documents').insert(doc_data)
  
  # Criar chunks
  _create_chunks(doc_data.id, persona.biografia_completa)
  
  result.success_count += 1
```

### SAÍDA
```
OUTPUT: {'success_count': int, 'errors': [error_list]}
```

---

## ALGORITMO: _process_competencias()

### ENTRADA
```
INPUT: empresa_id (string)
```

### PROCESSO

#### 1. BUSCAR PERSONAS E SUAS COMPETÊNCIAS
```
personas_result = supabase.table('personas').select('id, full_name').eq('empresa_id', empresa_id)

PARA cada persona EM personas_result.data:
  comp_result = supabase.table('competencias').select('*').eq('persona_id', persona.id)
  
  SE NOT comp_result.data:
    CONTINUE
```

#### 2. FORMATAR COMPETÊNCIAS EM TEXTO
```
competencias_text = _format_competencias_text(comp_result.data, persona.full_name):
  text = f"Competências de {persona_name}:\n\n"
  
  # Agrupar por tipo
  tipos = {}
  PARA cada comp EM competencias:
    tipo = comp.get('tipo', 'geral')
    tipos[tipo].append(comp)
  
  PARA cada tipo, comps EM tipos:
    text += f"## {tipo.upper()}\n"
    PARA cada comp EM comps:
      text += f"- {comp.nome}"
      SE comp.descricao:
        text += f": {comp.descricao}"
      text += f" (Nível: {comp.nivel})\n"
    text += "\n"
  
  RETURN text
```

#### 3. CRIAR DOCUMENTO RAG
```
doc_data = {
  'id': uuid4(),
  'collection_id': _get_or_create_collection(empresa_id),
  'external_id': f"competencias_{persona.id}",
  'title': f"Competências: {persona.full_name}",
  'content_raw': competencias_text,
  'document_type': 'competencia',
  'language': 'pt',
  'metadata': {
    'persona_id': persona.id,
    'competencias_count': len(comp_result.data),
    'empresa_id': empresa_id
  }
}

supabase.table('rag_documents').insert(doc_data)
_create_chunks(doc_data.id, competencias_text)
```

### SAÍDA
```
OUTPUT: {'success_count': int, 'errors': [error_list]}
```

---

## ALGORITMO: _process_workflows()

### ENTRADA
```
INPUT: empresa_id (string)
```

### PROCESSO

#### 1. BUSCAR WORKFLOWS POR PERSONA
```
personas_result = supabase.table('personas').select('id, full_name').eq('empresa_id', empresa_id)

PARA cada persona EM personas_result.data:
  work_result = supabase.table('workflows').select('*').eq('persona_id', persona.id)
```

#### 2. PROCESSAR CADA WORKFLOW
```
PARA cada workflow EM work_result.data:
  workflow_text = _format_workflow_text(workflow, persona.full_name):
    text = f"Workflow: {workflow.nome}\n"
    text += f"Responsável: {persona_name}\n"
    text += f"Tipo: {workflow.tipo}\n"
    text += f"Prioridade: {workflow.prioridade}\n\n"
    
    SE workflow.descricao:
      text += f"Descrição:\n{workflow.descricao}\n\n"
    
    SE workflow.config:
      text += f"Configurações:\n{JSON.stringify(workflow.config)}\n\n"
    
    SE workflow.triggers:
      text += f"Triggers:\n{JSON.stringify(workflow.triggers)}\n\n"
    
    SE workflow.actions:
      text += f"Ações:\n{JSON.stringify(workflow.actions)}\n\n"
    
    RETURN text
```

#### 3. CRIAR DOCUMENTO RAG
```
doc_data = {
  'id': uuid4(),
  'external_id': f"workflow_{workflow.id}",
  'title': f"Workflow: {workflow.nome} - {persona.full_name}",
  'content_raw': workflow_text,
  'document_type': 'workflow',
  'metadata': {
    'workflow_id': workflow.id,
    'workflow_type': workflow.tipo,
    'workflow_priority': workflow.prioridade,
    'empresa_id': empresa_id
  }
}

supabase.table('rag_documents').insert(doc_data)
_create_chunks(doc_data.id, workflow_text)
```

### SAÍDA
```
OUTPUT: {'success_count': int, 'errors': [error_list]}
```

---

## ALGORITMO: _process_knowledge_base()

### ENTRADA
```
INPUT: empresa_id (string)
```

### PROCESSO

#### 1. BUSCAR KNOWLEDGE BASE POR PERSONA
```
personas_result = supabase.table('personas').select('id, full_name').eq('empresa_id', empresa_id)

PARA cada persona EM personas_result.data:
  know_result = supabase.table('rag_knowledge').select('*').eq('persona_id', persona.id)
```

#### 2. PROCESSAR CADA ITEM DE KNOWLEDGE
```
PARA cada knowledge EM know_result.data:
  SE NOT knowledge.ativo:
    CONTINUE
  
  doc_data = {
    'id': uuid4(),
    'external_id': f"knowledge_{knowledge.id}",
    'title': knowledge.titulo,
    'content_raw': knowledge.conteudo,
    'document_type': knowledge.tipo,
    'metadata': {
      'knowledge_id': knowledge.id,
      'knowledge_type': knowledge.tipo,
      'categoria': knowledge.categoria,
      'relevancia': knowledge.relevancia,
      'tags': knowledge.tags,
      'empresa_id': empresa_id
    }
  }
  
  supabase.table('rag_documents').insert(doc_data)
  _create_chunks(doc_data.id, knowledge.conteudo)
```

### SAÍDA
```
OUTPUT: {'success_count': int, 'errors': [error_list]}
```

---

## ALGORITMO: _get_or_create_collection()

### ENTRADA
```
INPUT: empresa_id (string)
```

### PROCESSO

#### 1. BUSCAR COLLECTION EXISTENTE
```
result = supabase.table('rag_collections').select('id').eq('code', f'empresa_{empresa_id}')

SE result.data:
  RETURN result.data[0].id
```

#### 2. CRIAR NOVA COLLECTION
```
empresa_data = _get_empresa_data(empresa_id)
empresa_nome = empresa_data.nome SE empresa_data SENAO 'Unknown'

collection_data = {
  'id': uuid4(),
  'code': f'empresa_{empresa_id}',
  'name': f'Knowledge Base - {empresa_nome}',
  'description': f'Base de conhecimento da empresa {empresa_nome}',
  'visibility': 'internal',
  'metadata': {
    'empresa_id': empresa_id,
    'auto_generated': True
  },
  'is_active': True
}

insert_result = supabase.table('rag_collections').insert(collection_data)
RETURN insert_result.data[0].id
```

### SAÍDA
```
OUTPUT: collection_id (string)
```

---

## ALGORITMO: _create_chunks()

### ENTRADA
```
INPUT: document_id (string), content (string), chunk_size (int = 1000)
```

### PROCESSO

#### 1. DIVIDIR TEXTO EM CHUNKS
```
chunks = _split_text_into_chunks(content, chunk_size):
  SE len(text) <= chunk_size:
    RETURN [text]
  
  chunks = []
  start = 0
  overlap = 200
  
  ENQUANTO start < len(text):
    end = start + chunk_size
    
    SE end >= len(text):
      chunks.append(text[start:])
      BREAK
    
    # Tentar quebrar em frase completa
    chunk = text[start:end]
    last_period = chunk.rfind('.')
    last_newline = chunk.rfind('\n')
    break_point = max(last_period, last_newline)
    
    SE break_point > start + chunk_size // 2:
      actual_end = start + break_point + 1
      chunks.append(text[start:actual_end])
      start = actual_end - overlap
    SENAO:
      chunks.append(chunk)
      start = end - overlap
    
    start = max(0, start)
  
  RETURN chunks
```

#### 2. INSERIR CHUNKS NO SUPABASE
```
PARA i, chunk_content EM enumerate(chunks):
  chunk_data = {
    'id': uuid4(),
    'document_id': document_id,
    'chunk_index': i,
    'content': chunk_content,
    'content_length': len(chunk_content),
    'metadata': {
      'chunk_number': i + 1,
      'total_chunks': len(chunks)
    }
  }
  
  supabase.table('rag_chunks').insert(chunk_data)
```

### SAÍDA
```
OUTPUT: None (efeito colateral: chunks inseridos no banco)
```

---

## ALGORITMO: get_ingestion_status()

### ENTRADA
```
INPUT: empresa_id (string)
```

### PROCESSO

#### 1. BUSCAR JOBS RECENTES
```
result = supabase.table('rag_ingestion_jobs')
  .select('*')
  .eq('empresa_id', empresa_id)
  .order('created_at', desc=True)
  .limit(10)
```

#### 2. BUSCAR ESTATÍSTICAS RAG
```
stats_result = supabase.rpc('rag_empresa_stats', {'target_empresa_id': empresa_id})
```

#### 3. CONSOLIDAR STATUS
```
status = {
  'recent_jobs': result.data SE result.data SENAO [],
  'stats': stats_result.data[0] SE stats_result.data SENAO {},
  'last_sync': result.data[0].completed_at SE result.data[0].completed_at SENAO None
}
```

### SAÍDA
```
OUTPUT: {
  'recent_jobs': [job_list],
  'stats': stats_object,
  'last_sync': timestamp_or_null
}
```

---

## ALGORITMOS AUXILIARES

### _get_empresa_data()
```
INPUT: empresa_id (string)

result = supabase.table('empresas').select('*').eq('id', empresa_id)

SE result.data:
  RETURN result.data[0]
SENAO:
  RETURN None
```

---

## ESTRUTURAS DE DADOS

### RAG Document
```
{
  'id': 'uuid',
  'collection_id': 'uuid',
  'external_id': 'string', 
  'title': 'string',
  'content_raw': 'string',
  'content_length': 'int',
  'document_type': 'biografia|competencia|workflow|knowledge',
  'language': 'pt',
  'metadata': {
    'persona_id': 'uuid',
    'persona_name': 'string',
    'empresa_id': 'uuid',
    // campos específicos por tipo
  },
  'is_active': 'boolean',
  'processed_at': 'timestamp'
}
```

### RAG Chunk
```
{
  'id': 'uuid',
  'document_id': 'uuid',
  'chunk_index': 'int',
  'content': 'string',
  'content_length': 'int',
  'metadata': {
    'chunk_number': 'int',
    'total_chunks': 'int'
  }
}
```

### RAG Collection
```
{
  'id': 'uuid',
  'code': 'empresa_ID',
  'name': 'string',
  'description': 'string',
  'visibility': 'internal',
  'metadata': {
    'empresa_id': 'uuid',
    'auto_generated': 'boolean'
  },
  'is_active': 'boolean'
}
```

### Ingestion Job
```
{
  'id': 'uuid',
  'empresa_id': 'uuid',
  'job_type': 'full_sync',
  'status': 'running|completed|failed',
  'started_at': 'timestamp',
  'completed_at': 'timestamp',
  'total_items': 'int',
  'processed_items': 'int',
  'success_items': 'int',
  'failed_items': 'int',
  'error_details': [error_list]
}
```

---

## SAÍDA FINAL

### ARQUIVOS PROCESSADOS
- **Biografias**: Texto completo das biografias convertido em documentos RAG
- **Competências**: Competências agrupadas por persona em formato estruturado
- **Workflows**: Workflows completos com metadados em texto pesquisável
- **Knowledge Base**: Base de conhecimento existente preservada e indexada

### ESTRUTURA RAG CRIADA
```
rag_collections/
├── empresa_{ID}/ (Collection principal)
    ├── biografia_documents/ (Biografias das personas)
    ├── competencia_documents/ (Competências estruturadas)
    ├── workflow_documents/ (Workflows N8N documentados)
    └── knowledge_documents/ (Base de conhecimento existente)

rag_documents/ (Documentos indexados)
└── chunks/ (Fragmentos para busca semântica)
```

### RASTREABILIDADE
- **Jobs de ingestão**: Log completo de cada execução
- **Status tracking**: Monitoramento em tempo real
- **Error handling**: Captura e relatório de erros detalhados
- **Metadados preservados**: Todos os dados originais mantidos

---

## CARACTERÍSTICAS TÉCNICAS

### INTEGRAÇÃO SUPABASE
- **Transações atômicas** para consistência de dados
- **Cleanup automático** em force_update
- **RPC functions** para estatísticas avançadas
- **Batch processing** para eficiência

### CHUNKING INTELIGENTE
- **Quebras semânticas** em frases completas
- **Overlap configurável** para contexto
- **Preservação de formatação** importante
- **Metadados de navegação** entre chunks

### PROCESSAMENTO ASSÍNCRONO
- **Non-blocking operations** para UX
- **Error isolation** por documento
- **Progress tracking** granular
- **Retry logic** para falhas temporárias

### AUDITORIA COMPLETA
- **Job tracking** com UUIDs únicos
- **Timestamp precision** para debugging
- **Error categorization** para análise
- **Success metrics** para monitoramento