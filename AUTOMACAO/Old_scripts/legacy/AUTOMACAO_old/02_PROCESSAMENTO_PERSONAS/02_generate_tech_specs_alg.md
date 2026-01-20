# Algoritmo: Gerador de Especificações Técnicas

## Arquivo: `02_generate_tech_specs.py`

### Objetivo
Gerar especificações técnicas de IA para cada persona baseadas em biografias, competências e responsabilidades.

### Entrada (Input)
- Biografias das personas: `04_PERSONAS_COMPLETAS/{categoria}/`
- Competências (opcional): `competencias_output/`

### Saída (Output)
- `tech_specs_output/{categoria}/{nome}/`
  - `tech_specs.json`: Configurações técnicas estruturadas
  - `tech_specs.md`: Documentação das especificações
- `tech_specs_summary.json`: Resumo do processamento

### Algoritmo Principal

#### 1. INICIALIZAÇÃO
```
FUNÇÃO __init__(base_path=None):
    DEFINIR base_path (atual ou fornecido)
    DEFINIR personas_path = base_path / "04_PERSONAS_COMPLETAS"
    CRIAR output_path = base_path / "tech_specs_output"
    
    DEFINIR ai_configs_templates por role:
        assistente: {
            ai_model: "gpt-4-turbo-preview",
            max_tokens: 1500,
            temperature: 0.6,
            response_format: "structured",
            priority_level: "medium",
            decision_authority: "operational",
            access_scope: "assigned_executive",
            base_tools: [email, calendar, supabase, n8n_webhooks, ...]
        }
        
        executivo: {
            ai_model: "gpt-4-turbo-preview", 
            max_tokens: 2000,
            temperature: 0.7,
            priority_level: "high",
            decision_authority: "department",
            access_scope: "department_systems",
            base_tools: [email, calendar, crm, proposals, analytics, ...]
        }
        
        especialista: {
            ai_model: "gpt-4-turbo-preview",
            max_tokens: 2000,
            temperature: 0.7,
            priority_level: "high", 
            decision_authority: "technical",
            access_scope: "specialization_area",
            base_tools: [technical_tools, analysis, reporting, ...]
        }
        
        gestor: {
            ai_model: "gpt-4-turbo-preview",
            max_tokens: 3000,
            temperature: 0.8,
            priority_level: "critical",
            decision_authority: "company",
            access_scope: "full_company_systems",
            base_tools: [all_company_tools]
        }
FIM FUNÇÃO
```

#### 2. CARREGAMENTO DE DADOS DA PERSONA
```
FUNÇÃO load_persona_data(persona_path):
    INICIALIZAR persona_data = {}
    
    // Carregar biografia principal
    bio_file = ENCONTRAR arquivo .md em persona_path
    SE bio_file existe:
        bio_content = LER bio_file
        persona_data["biografia"] = extract_bio_info(bio_content)
    FIM SE
    
    // Carregar competências (se existir)
    comp_path = correspondente em competencias_output
    SE comp_path existe:
        competencias_json = LER competencias.json
        persona_data["competencias"] = competencias_json
    FIM SE
    
    RETORNAR persona_data
FIM FUNÇÃO
```

#### 3. EXTRAÇÃO DE INFORMAÇÕES BIOGRÁFICAS
```
FUNÇÃO extract_bio_info(bio_content):
    INICIALIZAR bio_info = {}
    
    // Extrair dados básicos usando regex
    bio_info["nome"] = EXTRAIR "# (.+)" 
    bio_info["idade"] = EXTRAIR "Idade.*?(\d+)"
    bio_info["pais"] = EXTRAIR "País.*?([A-Za-z\s]+)"
    bio_info["educacao"] = EXTRAIR "Educação.*?([^\n]+)"
    bio_info["idiomas"] = EXTRAIR e PROCESSAR "Idiomas.*?([^\n]+)"
    
    // Extrair especialização se existir
    bio_info["especializacao"] = DETECTAR área especializada
    
    // Extrair experiências e responsabilidades
    bio_info["experiencias"] = EXTRAIR seção biografia profissional
    
    RETORNAR bio_info
FIM FUNÇÃO
```

#### 4. DETERMINAÇÃO DO TIPO DE ROLE
```
FUNÇÃO determine_role_type(persona_path):
    categoria = persona_path.parent.name
    
    SWITCH categoria:
        CASE "assistentes": RETORNAR "assistente"
        CASE "especialistas": RETORNAR "especialista" 
        CASE "executivos": RETORNAR "executivo"
        DEFAULT: RETORNAR "assistente"
    FIM SWITCH
FIM FUNÇÃO
```

#### 5. GERAÇÃO DE CONFIGURAÇÃO DE IA
```
FUNÇÃO generate_ai_config(persona_data, role_type):
    OBTER base_config = ai_configs_templates[role_type]
    ai_config = COPIAR base_config
    
    // Ajustes baseados na persona
    SE persona_data["biografia"]["especializacao"]:
        especializacao = persona_data["biografia"]["especializacao"]
        
        SWITCH especializacao:
            CASE "hr":
                ai_config["specialized_tools"].ADICIONAR([
                    "recruitment_system",
                    "hr_analytics", 
                    "employee_portal"
                ])
                ai_config["knowledge_domains"].ADICIONAR([
                    "human_resources",
                    "labor_law",
                    "organizational_psychology"
                ])
            
            CASE "marketing":
                ai_config["specialized_tools"].ADICIONAR([
                    "marketing_automation",
                    "social_media_apis",
                    "analytics_platforms"
                ])
                ai_config["knowledge_domains"].ADICIONAR([
                    "digital_marketing", 
                    "brand_management",
                    "consumer_psychology"
                ])
            
            CASE "tecnologia":
                ai_config["specialized_tools"].ADICIONAR([
                    "code_repositories",
                    "deployment_tools",
                    "monitoring_systems"
                ])
                ai_config["knowledge_domains"].ADICIONAR([
                    "software_development",
                    "infrastructure",
                    "cybersecurity"
                ])
            
            // ... outros casos
        FIM SWITCH
    FIM SE
    
    // Ajustes baseados na idade/senioridade
    idade = persona_data["biografia"]["idade"]
    SE idade > 45:
        ai_config["decision_authority"] = ELEVAR nível
        ai_config["priority_level"] = ELEVAR nível
    FIM SE
    
    // Ajustes baseados em idiomas
    idiomas = persona_data["biografia"]["idiomas"]
    ai_config["supported_languages"] = idiomas
    
    RETORNAR ai_config
FIM FUNÇÃO
```

#### 6. GERAÇÃO DE CONFIGURAÇÃO DE COMUNICAÇÃO
```
FUNÇÃO generate_communication_config(persona_data, role_type):
    INICIALIZAR comm_config = {
        "default_language": "português",
        "tone_of_voice": "professional",
        "communication_style": "direct",
        "response_time_sla": "24h",
        "escalation_rules": [],
        "notification_preferences": {}
    }
    
    // Configurar baseado no role
    SWITCH role_type:
        CASE "assistente":
            comm_config["tone_of_voice"] = "helpful"
            comm_config["communication_style"] = "supportive"
            comm_config["response_time_sla"] = "2h"
            
        CASE "executivo":
            comm_config["tone_of_voice"] = "authoritative"
            comm_config["communication_style"] = "strategic"
            comm_config["response_time_sla"] = "4h"
            
        CASE "especialista":
            comm_config["tone_of_voice"] = "expert"
            comm_config["communication_style"] = "detailed"
            comm_config["response_time_sla"] = "8h"
            
        CASE "gestor":
            comm_config["tone_of_voice"] = "executive"
            comm_config["communication_style"] = "visionary"
            comm_config["response_time_sla"] = "12h"
    FIM SWITCH
    
    // Configurar idiomas
    idiomas = persona_data["biografia"]["idiomas"]
    comm_config["supported_languages"] = idiomas
    SE "inglês" EM idiomas:
        comm_config["international_ready"] = True
    FIM SE
    
    RETORNAR comm_config
FIM FUNÇÃO
```

#### 7. GERAÇÃO DE CONFIGURAÇÃO RAG
```
FUNÇÃO generate_rag_config(persona_data, role_type):
    INICIALIZAR rag_config = {
        "knowledge_base_access": [],
        "document_types": [],
        "search_scope": "department",
        "relevance_threshold": 0.8,
        "max_context_length": 4000
    }
    
    // Configurar acesso baseado no role
    SWITCH role_type:
        CASE "assistente":
            rag_config["knowledge_base_access"] = [
                "company_procedures",
                "contact_directory", 
                "meeting_templates"
            ]
            rag_config["search_scope"] = "assigned_executive"
            
        CASE "executivo":
            rag_config["knowledge_base_access"] = [
                "strategic_documents",
                "financial_reports",
                "department_data", 
                "client_information"
            ]
            rag_config["search_scope"] = "department"
            
        CASE "especialista":
            rag_config["knowledge_base_access"] = [
                "technical_documentation",
                "best_practices",
                "industry_standards",
                "project_histories"
            ]
            rag_config["search_scope"] = "specialization_area"
            
        CASE "gestor":
            rag_config["knowledge_base_access"] = [
                "all_company_knowledge",
                "strategic_planning",
                "board_documents",
                "financial_data"
            ]
            rag_config["search_scope"] = "company_wide"
    FIM SWITCH
    
    // Ajustes baseados na especialização
    SE persona_data["biografia"]["especializacao"]:
        especializacao = persona_data["biografia"]["especializacao"]
        rag_config["specialized_knowledge"].ADICIONAR(especializacao)
    FIM SE
    
    RETORNAR rag_config
FIM FUNÇÃO
```

#### 8. CRIAÇÃO DA ESTRUTURA COMPLETA
```
FUNÇÃO create_tech_specs_structure(persona_path):
    // Carregar dados da persona
    persona_data = load_persona_data(persona_path)
    role_type = determine_role_type(persona_path)
    
    // Gerar configurações
    ai_config = generate_ai_config(persona_data, role_type)
    comm_config = generate_communication_config(persona_data, role_type)
    rag_config = generate_rag_config(persona_data, role_type)
    
    // Estrutura completa
    tech_specs = {
        "metadata": {
            "persona_id": persona_data["biografia"]["nome"],
            "role_type": role_type,
            "generated_at": datetime.now().isoformat(),
            "version": "2.0.0"
        },
        "persona_profile": persona_data["biografia"],
        "ai_configuration": ai_config,
        "communication_configuration": comm_config,
        "rag_configuration": rag_config,
        "integration_points": {
            "supabase_tables": DETERMINAR tabelas relevantes,
            "n8n_workflows": DETERMINAR workflows relevantes,
            "external_apis": DETERMINAR APIs baseadas na especialização
        }
    }
    
    // Criar diretório output
    categoria = persona_path.parent.name
    nome = persona_data["biografia"]["nome"]
    output_dir = output_path / categoria / nome
    CRIAR output_dir
    
    // Salvar arquivos
    ESCREVER tech_specs em output_dir / "tech_specs.json"
    
    markdown = generate_tech_specs_md(persona_data, role_type, ai_config, comm_config, rag_config)
    ESCREVER markdown em output_dir / "tech_specs.md"
    
    RETORNAR True
FIM FUNÇÃO
```

#### 9. GERAÇÃO DE MARKDOWN
```
FUNÇÃO generate_tech_specs_md(persona_data, role_type, ai_config, comm_config, rag_config):
    INICIALIZAR markdown com cabeçalho da persona
    
    ADICIONAR seção "Configuração de IA":
        - Modelo: {ai_config["ai_model"]}
        - Tokens máximos: {ai_config["max_tokens"]}
        - Temperatura: {ai_config["temperature"]}
        - Nível de prioridade: {ai_config["priority_level"]}
        - Autoridade de decisão: {ai_config["decision_authority"]}
    
    ADICIONAR seção "Ferramentas e Acessos":
        LISTAR base_tools + specialized_tools
    
    ADICIONAR seção "Configuração de Comunicação":
        - Tom de voz: {comm_config["tone_of_voice"]}
        - Estilo: {comm_config["communication_style"]}
        - SLA de resposta: {comm_config["response_time_sla"]}
        - Idiomas suportados: {comm_config["supported_languages"]}
    
    ADICIONAR seção "Configuração RAG":
        - Escopo de busca: {rag_config["search_scope"]}
        - Bases de conhecimento: LISTAR knowledge_base_access
        - Tipos de documento: LISTAR document_types
        - Limite de relevância: {rag_config["relevance_threshold"]}
    
    ADICIONAR seção "Pontos de Integração":
        - Tabelas Supabase relevantes
        - Workflows N8N
        - APIs externas
    
    RETORNAR markdown
FIM FUNÇÃO
```

#### 10. PROCESSAMENTO EM LOTE
```
FUNÇÃO process_all_personas():
    INICIALIZAR results = {
        "processed": 0,
        "successful": 0, 
        "errors": 0,
        "details": []
    }
    
    PARA cada categoria em ["assistentes", "especialistas", "executivos"]:
        categoria_path = personas_path / categoria
        
        SE categoria_path existe:
            PARA cada arquivo/pasta em categoria_path:
                TENTAR:
                    success = create_tech_specs_structure(arquivo_path)
                    SE success:
                        results["successful"] += 1
                    FIM SE
                CAPTURAR erro:
                    results["errors"] += 1
                    REGISTRAR erro
                FIM TENTAR
                
                results["processed"] += 1
            FIM PARA
        FIM SE
    FIM PARA
    
    // Salvar summary
    ESCREVER results em "tech_specs_summary.json"
    
    RETORNAR results
FIM FUNÇÃO
```

### Dependências
- `os`, `sys`: Operações de sistema
- `json`: Manipulação de JSON
- `re`: Expressões regulares
- `pathlib.Path`: Manipulação de caminhos
- `datetime`: Timestamps
- `typing`: Type hints

### Estruturas de Dados

#### Saída (tech_specs.json):
```json
{
  "metadata": {
    "persona_id": "Maria Silva",
    "role_type": "especialista",
    "generated_at": "2025-11-11T15:30:00",
    "version": "2.0.0"
  },
  "persona_profile": {
    "nome": "Maria Silva",
    "idade": 32,
    "especializacao": "marketing"
  },
  "ai_configuration": {
    "ai_model": "gpt-4-turbo-preview",
    "max_tokens": 2000,
    "temperature": 0.7,
    "priority_level": "high",
    "decision_authority": "technical",
    "access_scope": "specialization_area",
    "base_tools": ["email", "calendar", "supabase"],
    "specialized_tools": ["marketing_automation", "social_media_apis"],
    "knowledge_domains": ["digital_marketing", "brand_management"]
  },
  "communication_configuration": {
    "tone_of_voice": "expert",
    "communication_style": "detailed", 
    "response_time_sla": "8h",
    "supported_languages": ["português", "inglês"]
  },
  "rag_configuration": {
    "knowledge_base_access": ["technical_documentation", "best_practices"],
    "search_scope": "specialization_area",
    "relevance_threshold": 0.8
  }
}
```

### Fluxo de Execução
1. Para cada persona, carregar biografia e competências
2. Determinar role type baseado na categoria
3. Aplicar template de configuração AI apropriado
4. Customizar baseado na especialização e perfil
5. Gerar configurações de comunicação e RAG
6. Definir pontos de integração (Supabase, N8N, APIs)
7. Salvar especificações técnicas em JSON e MD
8. Gerar relatório de summary

### Características Especiais
- **Templates por role:** Configurações diferentes para cada tipo
- **Especialização automática:** Tools específicas por área
- **Configuração RAG dinâmica:** Acesso baseado no nível/área
- **Integração completa:** Define pontos de conexão com sistemas
- **Escalabilidade:** SLA e prioridades baseadas no nível hierárquico