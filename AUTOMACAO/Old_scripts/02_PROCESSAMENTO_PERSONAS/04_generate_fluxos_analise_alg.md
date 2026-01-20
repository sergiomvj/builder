# Algoritmo: Análise de Fluxos e Task Mapping

## Arquivo: `04_generate_fluxos_analise.py`

### Objetivo
Analisar competências e tech specs para identificar fluxos de trabalho e mapear tarefas algoritmicamente para cada persona.

### Entrada (Input)
- Competências: `04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{nome}/script1_competencias/competencias_core.json`
- Tech Specs: 
  - `04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{nome}/script2_tech_specs/ai_config.json`
  - `04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{nome}/script2_tech_specs/tools_config.json`

### Saída (Output)
- `04_PERSONAS_SCRIPTS_1_2_3/{categoria}/{nome}/script4_fluxos/`
  - `tasktodo.md`: Documento de tarefas e fluxos mapeados
  - `fluxos_analysis.json`: Análise estruturada dos fluxos

### Algoritmo Principal

#### 1. INICIALIZAÇÃO
```
FUNÇÃO __init__(output_dir):
    DEFINIR output_dir para base de dados
    INICIALIZAR personas_data como dict vazio
    
    DEFINIR assistentes_config:
        coordenador: {
            role: "Assistente Coordenador Geral",
            description: "Coordena todos os fluxos de trabalho da persona",
            ai_model: "gpt-4-turbo-preview",
            temperature: 0.3,
            max_tokens: 2000
        }
FIM FUNÇÃO
```

#### 2. CARREGAMENTO DE DADOS DA PERSONA
```
FUNÇÃO load_persona_data(persona_path):
    // Parse do caminho categoria/nome
    parts = persona_path.split('/')
    categoria = parts[0]
    persona_name = parts[1]
    
    // Carregar competências
    competencias_path = output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name / "script1_competencias" / "competencias_core.json"
    competencias = LER competencias_path
    
    // Carregar tech specs
    ai_config_path = output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name / "script2_tech_specs" / "ai_config.json"
    tools_config_path = output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name / "script2_tech_specs" / "tools_config.json"
    
    INICIALIZAR tech_specs = {}
    
    SE ai_config_path existe:
        tech_specs['ai_config'] = LER ai_config_path
    FIM SE
    
    SE tools_config_path existe:
        tech_specs['tools'] = LER tools_config_path
    FIM SE
    
    RETORNAR {
        "competencias": competencias,
        "tech_specs": tech_specs,
        "persona_name": persona_name,
        "categoria": categoria,
        "full_path": persona_path
    }
FIM FUNÇÃO
```

#### 3. ANÁLISE DE FLUXO DE TAREFA
```
FUNÇÃO analyze_task_flow(task, competencias, tech_specs, categoria_temporal):
    INICIALIZAR flow_analysis = {
        "task_id": uuid.uuid4(),
        "task_name": task,
        "categoria_temporal": categoria_temporal,
        "timestamp": datetime.now().isoformat()
    }
    
    // Análise das fases do fluxo
    flow_analysis["data_source"] = _identify_data_source(task, competencias)
    flow_analysis["processing"] = _identify_processing(task, tech_specs)
    flow_analysis["output_destination"] = _identify_output_destination(task, competencias)
    flow_analysis["assistant_config"] = _create_flow_assistant(task, categoria_temporal)
    flow_analysis["dependencies"] = _identify_dependencies(task, competencias)
    flow_analysis["tools_required"] = _identify_tools(task, tech_specs)
    flow_analysis["validation_criteria"] = _create_validation_criteria(task)
    
    RETORNAR flow_analysis
FIM FUNÇÃO
```

#### 4. IDENTIFICAÇÃO DE FONTE DE DADOS
```
FUNÇÃO _identify_data_source(task, competencias):
    INICIALIZAR sources = []
    
    // Análise baseada nas competências técnicas
    tecnicas = competencias.get("competencias_tecnicas", [])
    comportamentais = competencias.get("competencias_comportamentais", [])
    
    // Mapear competências para fontes de dados
    SE "análise de dados" EM tecnicas OU "analytics" EM task.lower():
        sources.ADICIONAR("database_analytics")
        sources.ADICIONAR("external_apis")
    FIM SE
    
    SE "gestão" EM comportamentais OU "liderança" EM comportamentais:
        sources.ADICIONAR("team_reports")
        sources.ADICIONAR("management_dashboard")
    FIM SE
    
    SE "atendimento" EM tecnicas OU "cliente" EM task.lower():
        sources.ADICIONAR("crm_system")
        sources.ADICIONAR("customer_feedback")
    FIM SE
    
    SE "marketing" EM tecnicas OU "social media" EM tecnicas:
        sources.ADICIONAR("social_media_apis")
        sources.ADICIONAR("marketing_platforms")
    FIM SE
    
    SE "financeiro" EM tecnicas OU "contábil" EM tecnicas:
        sources.ADICIONAR("financial_systems")
        sources.ADICIONAR("accounting_data")
    FIM SE
    
    // Fonte padrão se nenhuma específica encontrada
    SE sources está vazio:
        sources.ADICIONAR("general_database")
    FIM SE
    
    RETORNAR sources
FIM FUNÇÃO
```

#### 5. IDENTIFICAÇÃO DE PROCESSAMENTO
```
FUNÇÃO _identify_processing(task, tech_specs):
    INICIALIZAR processing = {
        "method": "ai_assisted",
        "ai_model": "gpt-4-turbo-preview",
        "temperature": 0.7,
        "processing_steps": []
    }
    
    // Configurar baseado nas tech specs
    SE tech_specs["ai_config"] existe:
        ai_config = tech_specs["ai_config"]
        processing["ai_model"] = ai_config.get("model", "gpt-4-turbo-preview")
        processing["temperature"] = ai_config.get("temperature", 0.7)
        processing["max_tokens"] = ai_config.get("max_tokens", 2000)
    FIM SE
    
    // Determinar passos de processamento baseado na tarefa
    SE "análise" EM task.lower():
        processing["processing_steps"].ADICIONAR([
            "data_collection",
            "data_cleaning", 
            "pattern_analysis",
            "insight_extraction",
            "report_generation"
        ])
        processing["method"] = "analytical_processing"
    
    SE "comunicação" OU "resposta" EM task.lower():
        processing["processing_steps"].ADICIONAR([
            "context_understanding",
            "tone_analysis",
            "response_generation",
            "quality_check"
        ])
        processing["method"] = "communication_processing"
    
    SE "planejamento" OU "estratégia" EM task.lower():
        processing["processing_steps"].ADICIONAR([
            "situation_analysis",
            "goal_definition",
            "strategy_formulation", 
            "action_plan_creation"
        ])
        processing["method"] = "strategic_processing"
    
    // Processamento padrão
    SE processing["processing_steps"] está vazio:
        processing["processing_steps"] = [
            "input_analysis",
            "ai_processing",
            "output_formatting"
        ]
    FIM SE
    
    RETORNAR processing
FIM FUNÇÃO
```

#### 6. IDENTIFICAÇÃO DE DESTINO DE OUTPUT
```
FUNÇÃO _identify_output_destination(task, competencias):
    INICIALIZAR destinations = []
    
    // Determinar destinos baseado na natureza da tarefa e competências
    SE "relatório" OU "análise" EM task.lower():
        destinations.ADICIONAR("document_storage")
        destinations.ADICIONAR("email_notification")
    FIM SE
    
    SE "cliente" OU "atendimento" EM task.lower():
        destinations.ADICIONAR("crm_update")
        destinations.ADICIONAR("customer_communication")
    FIM SE
    
    SE "reunião" OU "agenda" EM task.lower():
        destinations.ADICIONAR("calendar_system")
        destinations.ADICIONAR("meeting_platform")
    FIM SE
    
    SE "social" OU "marketing" EM task.lower():
        destinations.ADICIONAR("social_media_platforms")
        destinations.ADICIONAR("marketing_dashboard")
    FIM SE
    
    SE "financeiro" OU "pagamento" EM task.lower():
        destinations.ADICIONAR("financial_system")
        destinations.ADICIONAR("accounting_records")
    FIM SE
    
    // Destinos padrão
    destinations.ADICIONAR("supabase_database")
    destinations.ADICIONAR("n8n_webhook")
    
    RETORNAR destinations
FIM FUNÇÃO
```

#### 7. CRIAÇÃO DE ASSISTENTE DE FLUXO
```
FUNÇÃO _create_flow_assistant(task, categoria_temporal):
    INICIALIZAR assistant_config = {
        "assistant_id": f"flow_{uuid.uuid4()}",
        "name": f"Assistente para {task}",
        "role": "task_coordinator",
        "categoria_temporal": categoria_temporal,
        "ai_configuration": {}
    }
    
    // Configurar baseado na categoria temporal
    SWITCH categoria_temporal:
        CASE "imediata":
            assistant_config["ai_configuration"] = {
                "model": "gpt-4-turbo-preview",
                "temperature": 0.3,  // Mais determinístico para tarefas urgentes
                "max_tokens": 1500,
                "response_time_priority": "high"
            }
            
        CASE "diaria":
            assistant_config["ai_configuration"] = {
                "model": "gpt-4-turbo-preview", 
                "temperature": 0.5,
                "max_tokens": 2000,
                "response_time_priority": "medium"
            }
            
        CASE "planejamento":
            assistant_config["ai_configuration"] = {
                "model": "gpt-4-turbo-preview",
                "temperature": 0.7,  // Mais criativo para planejamento
                "max_tokens": 3000,
                "response_time_priority": "standard"
            }
    FIM SWITCH
    
    // Adicionar responsabilidades específicas
    assistant_config["responsibilities"] = [
        f"Coordenar execução da tarefa: {task}",
        "Monitorar progresso e dependências",
        "Comunicar status e resultados",
        "Escalar problemas quando necessário"
    ]
    
    RETORNAR assistant_config
FIM FUNÇÃO
```

#### 8. IDENTIFICAÇÃO DE DEPENDÊNCIAS
```
FUNÇÃO _identify_dependencies(task, competencias):
    INICIALIZAR dependencies = []
    
    // Analisar competências para identificar dependências
    tecnicas = competencias.get("competencias_tecnicas", [])
    
    SE "gestão de equipe" EM tecnicas:
        dependencies.ADICIONAR("team_availability")
        dependencies.ADICIONAR("team_coordination")
    FIM SE
    
    SE "análise" EM task.lower():
        dependencies.ADICIONAR("data_availability")
        dependencies.ADICIONAR("system_access")
    FIM SE
    
    SE "comunicação externa" OU "cliente" EM task.lower():
        dependencies.ADICIONAR("client_availability")
        dependencies.ADICIONAR("communication_channels")
    FIM SE
    
    SE "aprovação" OU "decisão" EM task.lower():
        dependencies.ADICIONAR("management_approval")
        dependencies.ADICIONAR("stakeholder_input")
    FIM SE
    
    // Dependências técnicas básicas
    dependencies.ADICIONAR("system_connectivity")
    dependencies.ADICIONAR("authentication_access")
    
    RETORNAR dependencies
FIM FUNÇÃO
```

#### 9. IDENTIFICAÇÃO DE FERRAMENTAS
```
FUNÇÃO _identify_tools(task, tech_specs):
    INICIALIZAR tools = []
    
    // Ferramentas básicas sempre disponíveis
    base_tools = ["email", "calendar", "supabase", "n8n_webhooks"]
    tools.EXTEND(base_tools)
    
    // Adicionar ferramentas das tech specs
    SE tech_specs["tools"] existe:
        tools_config = tech_specs["tools"]
        SE "specialized_tools" EM tools_config:
            tools.EXTEND(tools_config["specialized_tools"])
        FIM SE
        SE "integration_tools" EM tools_config:
            tools.EXTEND(tools_config["integration_tools"])
        FIM SE
    FIM SE
    
    // Ferramentas específicas baseadas na tarefa
    SE "análise" EM task.lower():
        tools.ADICIONAR("analytics_platform")
        tools.ADICIONAR("data_visualization")
    FIM SE
    
    SE "documento" OU "relatório" EM task.lower():
        tools.ADICIONAR("document_editor")
        tools.ADICIONAR("pdf_generator")
    FIM SE
    
    SE "social" OU "marketing" EM task.lower():
        tools.ADICIONAR("social_media_scheduler")
        tools.ADICIONAR("content_creator")
    FIM SE
    
    // Remover duplicatas
    tools = list(set(tools))
    
    RETORNAR tools
FIM FUNÇÃO
```

#### 10. CRIAÇÃO DE CRITÉRIOS DE VALIDAÇÃO
```
FUNÇÃO _create_validation_criteria(task):
    INICIALIZAR criteria = {
        "quality_checks": [],
        "success_metrics": [],
        "completion_requirements": []
    }
    
    // Critérios baseados no tipo de tarefa
    SE "análise" EM task.lower():
        criteria["quality_checks"] = [
            "Data accuracy verification",
            "Statistical significance check",
            "Conclusion validity assessment"
        ]
        criteria["success_metrics"] = [
            "Insights generated",
            "Actionable recommendations provided",
            "Stakeholder satisfaction score"
        ]
        
    SE "comunicação" EM task.lower():
        criteria["quality_checks"] = [
            "Message clarity check",
            "Tone appropriateness verification",
            "Grammar and spelling validation"
        ]
        criteria["success_metrics"] = [
            "Response time compliance",
            "Recipient satisfaction",
            "Message effectiveness"
        ]
        
    SE "planejamento" EM task.lower():
        criteria["quality_checks"] = [
            "Goal alignment verification",
            "Resource availability check", 
            "Timeline feasibility assessment"
        ]
        criteria["success_metrics"] = [
            "Plan completeness",
            "Stakeholder approval",
            "Implementation readiness"
        ]
    FIM SE
    
    // Critérios de conclusão padrão
    criteria["completion_requirements"] = [
        "All defined steps completed",
        "Output delivered to designated destination",
        "Quality criteria met",
        "Stakeholders notified"
    ]
    
    RETORNAR criteria
FIM FUNÇÃO
```

#### 11. GERAÇÃO DE DOCUMENTO TASKTODO
```
FUNÇÃO generate_tasktodo_document(persona_data):
    competencias = persona_data["competencias"]
    tech_specs = persona_data["tech_specs"]
    persona_name = persona_data["persona_name"]
    categoria = persona_data["categoria"]
    
    // Identificar tarefas baseadas nas competências
    tarefas_identificadas = []
    
    tecnicas = competencias.get("competencias_tecnicas", [])
    PARA cada competencia EM tecnicas:
        // Mapear competências para tarefas específicas
        SE "gestão" EM competencia.lower():
            tarefas_identificadas.ADICIONAR("Coordenar equipe")
            tarefas_identificadas.ADICIONAR("Acompanhar progresso de projetos")
        FIM SE
        
        SE "análise" EM competencia.lower():
            tarefas_identificadas.ADICIONAR("Analisar dados e métricas")
            tarefas_identificadas.ADICIONAR("Gerar relatórios analíticos")
        FIM SE
        
        SE "comunicação" EM competencia.lower():
            tarefas_identificadas.ADICIONAR("Responder comunicações")
            tarefas_identificadas.ADICIONAR("Agendar reuniões")
        FIM SE
    FIM PARA
    
    // Analisar fluxos para cada tarefa
    INICIALIZAR fluxos_analysis = []
    
    PARA cada tarefa EM tarefas_identificadas:
        // Categorizar por urgência/temporalidade
        categoria_temporal = DETERMINAR baseado na tarefa:
            - "imediata": tarefas de resposta rápida
            - "diaria": tarefas rotineiras
            - "planejamento": tarefas estratégicas
        
        flow_analysis = analyze_task_flow(tarefa, competencias, tech_specs, categoria_temporal)
        fluxos_analysis.ADICIONAR(flow_analysis)
    FIM PARA
    
    // Gerar conteúdo markdown
    markdown_content = _generate_markdown_content(persona_name, fluxos_analysis)
    
    // Salvar arquivos
    output_path = output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name / "script4_fluxos"
    CRIAR output_path
    
    ESCREVER markdown_content EM output_path / "tasktodo.md"
    ESCREVER fluxos_analysis EM output_path / "fluxos_analysis.json"
    
    RETORNAR True
FIM FUNÇÃO
```

#### 12. GERAÇÃO DE CONTEÚDO MARKDOWN
```
FUNÇÃO _generate_markdown_content(persona_name, fluxos_analysis):
    INICIALIZAR markdown = f"""
# TaskTodo - {persona_name}

## Análise de Fluxos de Trabalho

Documento gerado automaticamente em {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Resumo
Total de fluxos identificados: {len(fluxos_analysis)}
Categorias temporais: {set(f["categoria_temporal"] for f in fluxos_analysis)}

## Fluxos Detalhados
"""
    
    // Agrupar por categoria temporal
    por_categoria = {}
    PARA cada flow EM fluxos_analysis:
        categoria = flow["categoria_temporal"]
        SE categoria NÃO está em por_categoria:
            por_categoria[categoria] = []
        FIM SE
        por_categoria[categoria].ADICIONAR(flow)
    FIM PARA
    
    // Gerar seções por categoria
    PARA cada categoria EM ["imediata", "diaria", "planejamento"]:
        SE categoria EM por_categoria:
            markdown += f"\n### Tarefas {categoria.title()}\n"
            
            PARA cada flow EM por_categoria[categoria]:
                markdown += f"""
#### {flow["task_name"]}
- **ID:** {flow["task_id"]}
- **Fontes de Dados:** {', '.join(flow["data_source"])}
- **Processamento:** {flow["processing"]["method"]}
- **Destinos:** {', '.join(flow["output_destination"])}
- **Ferramentas:** {', '.join(flow["tools_required"])}
- **Dependências:** {', '.join(flow["dependencies"])}

**Assistente Configurado:**
- Nome: {flow["assistant_config"]["name"]}
- Modelo: {flow["assistant_config"]["ai_configuration"]["model"]}
- Temperatura: {flow["assistant_config"]["ai_configuration"]["temperature"]}

**Critérios de Validação:**
{chr(10).join(f"- {criteria}" for criteria in flow["validation_criteria"]["completion_requirements"])}
"""
            FIM PARA
        FIM SE
    FIM PARA
    
    // Adicionar configuração geral
    markdown += """
## Configuração Geral

### Integração com Sistemas
- **Supabase:** Armazenamento de dados e logs
- **N8N:** Workflows e automações
- **APIs Externas:** Conforme especialização

### Monitoramento
- Status de execução registrado em tempo real
- Métricas de performance coletadas
- Alertas configurados para falhas

### Backup e Recuperação
- Logs de execução preservados
- Estados intermediários salvos
- Rollback automático em caso de erro
"""
    
    RETORNAR markdown
FIM FUNÇÃO
```

### Dependências
- `json`: Manipulação de JSON
- `os`: Operações de sistema
- `logging`: Sistema de logs
- `pathlib.Path`: Manipulação de caminhos
- `datetime`: Timestamps
- `uuid`: Identificadores únicos

### Estruturas de Dados

#### Saída (fluxos_analysis.json):
```json
[
  {
    "task_id": "uuid-123",
    "task_name": "Analisar dados e métricas",
    "categoria_temporal": "diaria",
    "timestamp": "2025-11-11T15:30:00",
    "data_source": ["database_analytics", "external_apis"],
    "processing": {
      "method": "analytical_processing",
      "ai_model": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "processing_steps": [
        "data_collection",
        "data_cleaning", 
        "pattern_analysis",
        "insight_extraction",
        "report_generation"
      ]
    },
    "output_destination": ["document_storage", "email_notification"],
    "assistant_config": {
      "assistant_id": "flow_uuid-456",
      "name": "Assistente para Analisar dados e métricas",
      "role": "task_coordinator",
      "categoria_temporal": "diaria"
    },
    "dependencies": ["data_availability", "system_access"],
    "tools_required": ["email", "calendar", "analytics_platform"],
    "validation_criteria": {
      "quality_checks": ["Data accuracy verification"],
      "completion_requirements": ["All defined steps completed"]
    }
  }
]
```

### Fluxo de Execução
1. Carregar competências e tech specs da persona
2. Identificar tarefas baseadas nas competências técnicas
3. Para cada tarefa:
   - Categorizar por temporalidade (imediata/diária/planejamento)
   - Analisar fluxo completo (fonte → processamento → destino)
   - Criar assistente configurado para a tarefa
   - Identificar dependências e ferramentas necessárias
   - Definir critérios de validação
4. Gerar documento tasktodo.md estruturado
5. Salvar análise estruturada em JSON

### Características Especiais
- **Mapeamento algorítmico:** Tarefas identificadas automaticamente das competências
- **Assistentes especializados:** Configuração de IA por tarefa
- **Análise de dependências:** Identificação automática de pré-requisitos
- **Validação estruturada:** Critérios de qualidade e conclusão
- **Categorização temporal:** Organização por urgência e tipo