# ALGORITMO: 05_generate_workflows_n8n.py
## GERADOR DE WORKFLOWS N8N PARA PERSONAS

### FUNÇÃO PRINCIPAL
Transformar dados de análise de fluxo de tarefas (TaskTodo) em workflows N8N funcionais para automação de processos empresariais.

---

## ALGORITMO PRINCIPAL

### ENTRADA
```
INPUT: 
- output_dir: Diretório base da empresa
- Dados do Script 4 (script4_tasktodo) em 04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{persona}/script4_tasktodo/
```

### PROCESSO

#### 1. INICIALIZAÇÃO DA CLASSE N8NWorkflowGenerator
```
INICIALIZAR:
  output_dir = Path(output_dir)
  node_counter = 0 (contador global de nós)
```

#### 2. DESCOBERTA DE PERSONAS COM TASKTODO
```
PARA cada categoria EM 04_PERSONAS_SCRIPTS_1_2_3/:
  PARA cada persona EM categoria/:
    SE exists(persona/script4_tasktodo/):
      ADD "{categoria}/{persona}" TO personas_list
```

#### 3. PROCESSAMENTO INDIVIDUAL DE CADA PERSONA
```
PARA cada persona EM personas_list:
  persona_data = load_tasktodo_data(persona)
  workflow = create_workflow_from_tasktodo(persona_data)
  validation_report = validate_workflow_consistency(workflow, persona_data)
  save_workflow(workflow, persona, validation_report)
```

---

## ALGORITMO: load_tasktodo_data()

### ENTRADA
```
INPUT: persona_path (formato: "categoria/persona")
```

### PROCESSO
```
EXTRAIR categoria, persona_name FROM persona_path
SET persona_dir = 04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{persona_name}
SET tasktodo_dir = persona_dir/script4_tasktodo

SE NOT exists(tasktodo_dir):
  RETURN None

CARREGAR arquivos:
  biografia_path = persona_dir/script1_biografia/biografia_{persona_name}.json
  competencias_path = persona_dir/script2_competencias/competencias_{persona_name}.json  
  tech_specs_path = persona_dir/script3_tech_specs/tech_specs_{persona_name}.json
  tasktodo_path = tasktodo_dir/tasktodo_{persona_name}.json

PARA cada arquivo:
  SE exists(arquivo):
    data[chave] = JSON.load(arquivo)
  SENAO:
    LOG warning("Arquivo não encontrado: {arquivo}")

RETURN data consolidada
```

---

## ALGORITMO: create_workflow_from_tasktodo()

### ENTRADA
```
INPUT: persona_data (dict com biografia, competencias, tech_specs, fluxos)
```

### PROCESSO

#### 1. ESTRUTURA BASE DO WORKFLOW
```
workflow = {
  "name": "Workflow {persona_name}",
  "nodes": [],
  "connections": {},
  "active": False,
  "staticData": null,
  "meta": {
    "persona": persona_name,
    "generated_by": "VCM Script 5",
    "version": "2.0.0",
    "created": ISO_timestamp,
    "tech_specs": persona_data.tech_specs
  }
}
```

#### 2. CRIAÇÃO DO NÓ COORDENADOR PRINCIPAL
```
coordenador_node = create_coordenador_node(persona_data.persona_name)
ADD coordenador_node TO workflow.nodes
```

#### 3. CRIAÇÃO DOS NÓS DE CATEGORIA TEMPORAL
```
categorias_nodes = {}
node_positions = {"x": 300, "y": 100}

PARA cada categoria EM ["diario", "semanal", "mensal"]:
  SE exists(persona_data.fluxos[categoria]):
    categoria_node = create_categoria_node(categoria, len(persona_data.fluxos[categoria]))
    categoria_node.position = node_positions
    ADD categoria_node TO workflow.nodes
    categorias_nodes[categoria] = categoria_node.id
    add_connection(workflow, "coordenador", categoria_node.id)
    UPDATE node_positions.y += 200
```

#### 4. CRIAÇÃO DOS WORKFLOWS DE FLUXO
```
PARA cada categoria EM persona_data.fluxos:
  PARA cada fluxo EM categoria:
    fluxo_workflow = create_fluxo_workflow(fluxo, categoria)
    
    # Adicionar todos os nós do fluxo ao workflow principal
    PARA cada node EM fluxo_workflow.nodes:
      ADD node TO workflow.nodes
    
    # Adicionar todas as conexões do fluxo
    PARA cada connection EM fluxo_workflow.connections:
      ADD connection TO workflow.connections
    
    # Conectar categoria ao primeiro nó do fluxo
    first_node = fluxo_workflow.nodes[0].id
    add_connection(workflow, categorias_nodes[categoria], first_node)
```

### SAÍDA
```
OUTPUT: workflow_completo (JSON estruturado para N8N)
```

---

## ALGORITMO: create_coordenador_node()

### ENTRADA
```
INPUT: persona_name (string)
```

### PROCESSO
```
node_id = get_next_node_id()

coordenador_node = {
  "id": node_id,
  "name": "Coordenador {persona_name}",
  "type": "n8n-nodes-base.manualTrigger",
  "typeVersion": 1,
  "position": [100, 300],
  "parameters": {
    "description": "Coordenador principal para workflows de {persona_name}",
    "metadata": {
      "persona": persona_name,
      "role": "coordinator"
    }
  }
}

RETURN coordenador_node
```

---

## ALGORITMO: create_categoria_node()

### ENTRADA
```
INPUT: categoria (string), num_fluxos (int)
```

### PROCESSO
```
node_id = get_next_node_id()

categoria_node = {
  "id": node_id,
  "name": "Categoria {categoria.upper()}",
  "type": "n8n-nodes-base.if",
  "typeVersion": 1,
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{$node[\"Coordenador\"].json[\"categoria\"]}}",
          "operation": "equal",
          "value2": categoria
        }
      ]
    },
    "metadata": {
      "categoria": categoria,
      "total_fluxos": num_fluxos
    }
  }
}

RETURN categoria_node
```

---

## ALGORITMO: create_fluxo_workflow()

### ENTRADA
```
INPUT: fluxo (dict), categoria (string)
```

### PROCESSO

#### 1. CRIAR NÓS DO PIPELINE
```
nodes = []
connections = {}

# Nó de Input
input_node = create_input_node(fluxo)
ADD input_node TO nodes

# Nó de Assistente Virtual
assistant_node = create_assistant_node(fluxo)
ADD assistant_node TO nodes

# Nós de Processamento
processing_nodes = create_processing_nodes(fluxo)
ADD processing_nodes TO nodes

# Nó de Validação
validation_node = create_validation_node(fluxo)
ADD validation_node TO nodes

# Nó de Output
output_node = create_output_node(fluxo)
ADD output_node TO nodes

# Nó de Log
log_node = create_log_node(fluxo)
ADD log_node TO nodes
```

#### 2. CONECTAR PIPELINE SEQUENCIAL
```
# Sequência: Input → Assistant → Processing → Validation → Output
add_connection(connections, input_node.id, assistant_node.id)
add_connection(connections, assistant_node.id, processing_nodes[0].id)

PARA i EM range(len(processing_nodes)-1):
  add_connection(connections, processing_nodes[i].id, processing_nodes[i+1].id)

add_connection(connections, processing_nodes[-1].id, validation_node.id)
add_connection(connections, validation_node.id, output_node.id)

# Log paralelo de cada etapa
PARA cada node EM [input_node, assistant_node, validation_node, output_node]:
  add_connection(connections, node.id, log_node.id)
```

### SAÍDA
```
OUTPUT: {
  "nodes": nodes,
  "connections": connections
}
```

---

## ALGORITMO: create_input_node()

### ENTRADA
```
INPUT: fluxo (dict com task_name, context, origens, etc.)
```

### PROCESSO
```
node_id = get_next_node_id()

# Determinar tipo de input baseado nas origens
SE "api" EM fluxo.origens:
  operation = "webhook"
  parameters = get_input_parameters(fluxo.origens, "webhook")
SENAO SE "database" EM fluxo.origens:
  operation = "select"
  parameters = get_input_parameters(fluxo.origens, "select")
SENAO:
  operation = "manual"
  parameters = {}

input_node = {
  "id": node_id,
  "name": "Input: {fluxo.task_name}",
  "type": get_node_type_for_operation(operation),
  "typeVersion": 1,
  "parameters": parameters,
  "metadata": {
    "task": fluxo.task_name,
    "step": "input",
    "origens": fluxo.origens
  }
}

RETURN input_node
```

---

## ALGORITMO: create_assistant_node()

### ENTRADA
```
INPUT: fluxo (dict)
```

### PROCESSO
```
node_id = get_next_node_id()

# Extrair configuração de IA do contexto
ai_config = EXTRACT ai_settings FROM fluxo.context

assistant_node = {
  "id": node_id,
  "name": "AI Assistant: {fluxo.task_name}",
  "type": "n8n-nodes-base.openAi",
  "typeVersion": 1,
  "parameters": {
    "resource": "chat",
    "operation": "create",
    "model": ai_config.get("model", "gpt-4-turbo-preview"),
    "messages": {
      "values": [
        {
          "role": "system",
          "content": generate_system_prompt(fluxo)
        },
        {
          "role": "user", 
          "content": "={{JSON.stringify($node[\"Input\"].json)}}"
        }
      ]
    },
    "options": {
      "temperature": ai_config.get("temperature", 0.3),
      "maxTokens": ai_config.get("max_tokens", 2000)
    }
  }
}

RETURN assistant_node
```

---

## ALGORITMO: create_processing_nodes()

### ENTRADA
```
INPUT: fluxo (dict)
```

### PROCESSO
```
processing_nodes = []

PARA cada operation EM fluxo.operations:
  node_id = get_next_node_id()
  
  SE operation.type == "analysis":
    node = {
      "id": node_id,
      "name": "Análise: {operation.name}",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "parameters": {
        "language": "javascript",
        "jsCode": generate_analysis_code(fluxo)
      }
    }
  
  SENAO SE operation.type == "transformation":
    node = {
      "id": node_id,
      "name": "Transformação: {operation.name}",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": operation.transformations
        }
      }
    }
  
  SENAO SE operation.type == "external_api":
    node = {
      "id": node_id,
      "name": "API: {operation.name}",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": operation.endpoint,
        "method": operation.method,
        "headers": operation.headers
      }
    }
  
  ADD node TO processing_nodes

RETURN processing_nodes
```

---

## ALGORITMO: create_validation_node()

### ENTRADA
```
INPUT: fluxo (dict)
```

### PROCESSO
```
node_id = get_next_node_id()

validation_rules = EXTRACT validation FROM fluxo.context

validation_node = {
  "id": node_id,
  "name": "Validação: {fluxo.task_name}",
  "type": "n8n-nodes-base.if",
  "typeVersion": 1,
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{$node[\"Processing\"].json[\"status\"]}}",
          "operation": "equal",
          "value2": "success"
        }
      ],
      "number": [
        {
          "value1": "={{$node[\"Processing\"].json[\"confidence\"]}}",
          "operation": "larger",
          "value2": validation_rules.get("min_confidence", 0.8)
        }
      ]
    },
    "metadata": {
      "validation_rules": validation_rules,
      "task": fluxo.task_name
    }
  }
}

RETURN validation_node
```

---

## ALGORITMO: create_output_node()

### ENTRADA
```
INPUT: fluxo (dict)
```

### PROCESSO
```
node_id = get_next_node_id()

# Determinar destinos de output
destinos = fluxo.get("destinos", ["supabase"])

SE "supabase" EM destinos:
  output_type = "supabase"
  parameters = {
    "operation": "insert",
    "table": f"resultados_{fluxo.task_name.lower()}",
    "columns": extract_output_columns(fluxo)
  }

SENAO SE "email" EM destinos:
  output_type = "email"
  parameters = {
    "to": "={{$node[\"Input\"].json[\"email\"]}}",
    "subject": f"Resultado: {fluxo.task_name}",
    "body": "={{JSON.stringify($node[\"Processing\"].json)}}"
  }

SENAO:
  output_type = "webhook"
  parameters = {
    "url": fluxo.output_webhook,
    "method": "POST"
  }

output_node = {
  "id": node_id,
  "name": "Output: {fluxo.task_name}",
  "type": get_output_node_type(output_type),
  "typeVersion": 1,
  "parameters": parameters,
  "metadata": {
    "task": fluxo.task_name,
    "step": "output",
    "destinos": destinos
  }
}

RETURN output_node
```

---

## ALGORITMO: create_log_node()

### ENTRADA
```
INPUT: fluxo (dict)
```

### PROCESSO
```
node_id = get_next_node_id()

log_node = {
  "id": node_id,
  "name": "Log Auditoria: {fluxo.task_name}",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "parameters": {
    "operation": "insert",
    "table": "audit_logs",
    "data": {
      "persona": "={{$node[\"Coordenador\"].json[\"persona\"]}}",
      "task": fluxo.task_name,
      "execution_id": "={{$workflow.id}}",
      "timestamp": "={{new Date().toISOString()}}",
      "input_data": "={{JSON.stringify($node[\"Input\"].json)}}",
      "processing_result": "={{JSON.stringify($node[\"Processing\"].json)}}",
      "validation_result": "={{JSON.stringify($node[\"Validation\"].json)}}",
      "output_data": "={{JSON.stringify($node[\"Output\"].json)}}",
      "status": "completed"
    }
  },
  "metadata": {
    "task": fluxo.task_name,
    "step": "audit",
    "purpose": "compliance_logging"
  }
}

RETURN log_node
```

---

## ALGORITMO: validate_workflow_consistency()

### ENTRADA
```
INPUT: workflow (dict), persona_data (dict)
```

### PROCESSO

#### 1. INICIALIZAR RELATÓRIO DE VALIDAÇÃO
```
validation_report = {
  "persona": persona_data.persona_name,
  "workflow_name": workflow.name,
  "validations": [],
  "errors": [],
  "warnings": []
}
```

#### 2. VALIDAR MAPEAMENTO DE COMPETÊNCIAS
```
total_tarefas = 0
total_fluxos = 0

PARA categoria EM ["tarefas_diarias", "tarefas_semanais", "tarefas_mensais"]:
  SE categoria EM persona_data.competencias:
    total_tarefas += len(persona_data.competencias[categoria])

PARA categoria_fluxos EM persona_data.fluxos.values():
  total_fluxos += len(categoria_fluxos)

SE total_tarefas != total_fluxos:
  ADD "Diferença entre tarefas ({total_tarefas}) e fluxos ({total_fluxos})" TO warnings
```

#### 3. VALIDAR TECH SPECS
```
tech_specs = persona_data.tech_specs
SE "ai_config" EM tech_specs:
  ADD "Tech specs AI config encontrada" TO validations
SENAO:
  ADD "Tech specs AI config não encontrada" TO warnings
```

#### 4. VALIDAR ESTRUTURA DO WORKFLOW
```
SE len(workflow.nodes) == 0:
  ADD "Workflow sem nós" TO errors

SE NOT workflow.connections:
  ADD "Workflow sem conexões" TO warnings

# Validar que todos os nós têm conexões válidas
PARA cada node EM workflow.nodes:
  SE node.id NOT IN workflow.connections AND node.type != "trigger":
    ADD f"Nó {node.name} sem conexões de saída" TO warnings
```

#### 5. GERAR SUMÁRIO
```
validation_report.summary = {
  "total_nodes": len(workflow.nodes),
  "total_connections": len(workflow.connections),
  "validation_status": "PASS" SE NOT validation_report.errors SENAO "FAIL"
}

RETURN validation_report
```

---

## ALGORITMO: save_workflow()

### ENTRADA
```
INPUT: workflow (dict), persona_path (string), validation_report (dict)
```

### PROCESSO

#### 1. EXTRAIR INFORMAÇÕES DE LOCALIZAÇÃO
```
categoria, persona_name = persona_path.split('/')
persona_dir = 04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{persona_name}
workflows_dir = persona_dir/script5_workflows_n8n
CREATE workflows_dir IF NOT EXISTS
```

#### 2. SALVAR WORKFLOW N8N
```
workflow_path = workflows_dir/workflow_{persona_name.lower()}.json
SAVE workflow TO workflow_path WITH encoding='utf-8'
```

#### 3. SALVAR RELATÓRIO DE VALIDAÇÃO
```
validation_path = workflows_dir/validation_{persona_name.lower()}.json
SAVE validation_report TO validation_path WITH encoding='utf-8'
```

#### 4. GERAR README DOCUMENTADO
```
readme_content = generate_workflow_readme(workflow, validation_report)
readme_path = workflows_dir/README_{persona_name.lower()}.md
SAVE readme_content TO readme_path WITH encoding='utf-8'
```

### SAÍDA
```
OUTPUT: (workflow_path, validation_path, readme_path)
```

---

## ALGORITMO: generate_workflow_readme()

### ENTRADA
```
INPUT: workflow (dict), validation_report (dict)
```

### PROCESSO
```
GERAR conteúdo markdown com:
1. INFORMAÇÕES GERAIS (nome, persona, métricas)
2. ESTRUTURA DO WORKFLOW (componentes principais)
3. VALIDAÇÕES REALIZADAS (sucessos, avisos, erros)
4. INSTRUÇÕES DE USO (importação, configuração, execução)
5. CONFIGURAÇÕES NECESSÁRIAS (APIs, credenciais)
6. MÉTRICAS DE EXECUÇÃO (tempo, recursos)

RETURN markdown_content
```

---

## ALGORITMOS AUXILIARES

### get_input_parameters()
```
INPUT: origens (list), operation (string)

SE operation == "select":
  RETURN {
    "operation": "select",
    "table": "clientes", 
    "filterType": "manual"
  }

SENAO SE operation == "webhook":
  RETURN {
    "path": f"webhook-{uuid4()[:8]}",
    "httpMethod": "POST",
    "responseMode": "responseNode"
  }

SENAO:
  RETURN {}
```

### generate_analysis_code()
```
INPUT: fluxo (dict)

RETURN JavaScript code template:
  - Loop através dos items de input
  - Aplicar análise específica do fluxo
  - Calcular métricas (qualidade, completude, precisão)
  - Retornar resultados estruturados
```

### add_connection()
```
INPUT: workflow (dict), source_id (string), target_id (string), output_index (int), input_index (int)

GARANTIR workflow.connections[source_id].main[output_index] existe
ADD {
  "node": target_id,
  "type": "main", 
  "index": input_index
} TO workflow.connections[source_id].main[output_index]
```

### get_next_node_id()
```
INCREMENT node_counter
RETURN f"node_{node_counter}"
```

---

## ESTRUTURAS DE DADOS

### Workflow N8N
```
{
  "name": "string",
  "nodes": [
    {
      "id": "string",
      "name": "string", 
      "type": "string",
      "typeVersion": "int",
      "position": "[x, y]",
      "parameters": "object",
      "metadata": "object"
    }
  ],
  "connections": {
    "node_id": {
      "main": [
        [
          {
            "node": "target_id",
            "type": "main",
            "index": "int"
          }
        ]
      ]
    }
  },
  "active": "boolean",
  "staticData": "null",
  "meta": "object"
}
```

### Validation Report
```
{
  "persona": "string",
  "workflow_name": "string", 
  "validations": ["string"],
  "errors": ["string"],
  "warnings": ["string"],
  "summary": {
    "total_nodes": "int",
    "total_connections": "int",
    "validation_status": "PASS|FAIL"
  }
}
```

---

## SAÍDA FINAL

### ARQUIVOS GERADOS
```
04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{persona}/script5_workflows_n8n/
├── workflow_{persona}.json (Workflow N8N importável)
├── validation_{persona}.json (Relatório de validação)
└── README_{persona}.md (Documentação completa)
```

### MÉTRICAS DE SUCESSO
- Workflows gerados com estrutura válida para N8N
- Validação algorítmica de consistência
- Documentação automática completa
- Arquivos prontos para importação em N8N

---

## CARACTERÍSTICAS TÉCNICAS

### INTEGRAÇÃO COM N8N
- Estrutura JSON compatível com N8N v0.234+
- Tipos de nós suportados: manualTrigger, if, openAi, code, set, httpRequest, supabase
- Conexões sequenciais e paralelas
- Metadados para rastreabilidade

### AUTOMAÇÃO INTELIGENTE
- Mapeamento algorítmico de fluxos para nós
- Geração automática de código JavaScript
- Configuração automática de parâmetros de IA
- Validação de consistência estrutural

### AUDITORIA E COMPLIANCE
- Log completo de execuções
- Rastreabilidade de dados
- Relatórios de validação
- Documentação automática