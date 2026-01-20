# Algoritmo: Gerador de RAG Personalizado

## Arquivo: `03_generate_rag.py`

### Objetivo
Gerar bases de conhecimento RAG personalizadas para cada persona baseadas em biografia, competências e especificações técnicas.

### Entrada (Input)
- Biografias: `04_PERSONAS_COMPLETAS/{categoria}/`
- Competências: `competencias_output/` (opcional)
- Tech Specs: `tech_specs_output/` (opcional)

### Saída (Output)
- `rag_output/{categoria}/{nome}/`
  - `rag_config.json`: Configuração RAG personalizada
  - `context_rules.md`: Regras de contexto em linguagem natural
  - `search_config.json`: Configurações de busca
- `rag_summary.json`: Resumo do processamento

### Algoritmo Principal

#### 1. INICIALIZAÇÃO
```
FUNÇÃO __init__(base_path=None):
    DEFINIR base_path e personas_path
    CRIAR rag_output_path
    
    DEFINIR knowledge_templates por especialização:
        nutrição: {
            core_topics: ["Carnivore Diet", "Nutritional Analysis", ...],
            procedures: ["Assessment Protocol", "Meal Planning", ...],
            tools_knowledge: ["Food tracking apps", "Nutrition databases", ...]
        }
        
        marketing: {
            core_topics: ["Digital Strategy", "Social Media", "Content Creation", ...],
            procedures: ["Campaign Planning", "Content Workflow", ...],
            tools_knowledge: ["Social platforms", "Analytics tools", ...]
        }
        
        tecnologia: {
            core_topics: ["Software Development", "DevOps", "Cloud Architecture", ...],
            procedures: ["Code Review", "Deployment", "Monitoring", ...],
            tools_knowledge: ["Development tools", "Cloud platforms", ...]
        }
        
        financeiro: {
            core_topics: ["Financial Analysis", "Budgeting", "Risk Management", ...],
            procedures: ["Financial Planning", "Report Generation", ...],
            tools_knowledge: ["Financial software", "Analytics platforms", ...]
        }
        
        // ... outras especializações
FIM FUNÇÃO
```

#### 2. CARREGAMENTO DE DADOS DA PERSONA
```
FUNÇÃO load_persona_data(persona_path):
    INICIALIZAR persona_data = {}
    
    // Carregar biografia
    bio_file = ENCONTRAR arquivo .md em persona_path
    bio_content = LER bio_file
    persona_data["biografia"] = extract_bio_info(bio_content)
    
    // Carregar competências (se existir)
    comp_path = competencias_output / categoria / nome
    SE comp_path / "competencias.json" existe:
        competencias = LER competencias.json
        persona_data["competencias"] = competencias
    FIM SE
    
    // Carregar tech specs (se existir)
    specs_path = tech_specs_output / categoria / nome  
    SE specs_path / "tech_specs.json" existe:
        tech_specs = LER tech_specs.json
        persona_data["tech_specs"] = tech_specs
    FIM SE
    
    RETORNAR persona_data
FIM FUNÇÃO
```

#### 3. EXTRAÇÃO DE INFORMAÇÕES BIOGRÁFICAS
```
FUNÇÃO extract_bio_info(bio_content):
    USAR mesma lógica do script 1:
        - nome, idade, país, educação, idiomas
        - experiências profissionais
        - especialização detectada
    RETORNAR bio_info estruturado
FIM FUNÇÃO
```

#### 4. DETERMINAÇÃO DA ÁREA DE ESPECIALIZAÇÃO
```
FUNÇÃO determine_specialization_area(persona_data):
    // Prioridade 1: Tech specs
    SE persona_data["tech_specs"] existe:
        especializacao = persona_data["tech_specs"]["persona_profile"]["especializacao"]
        SE especializacao:
            RETORNAR especializacao
        FIM SE
    FIM SE
    
    // Prioridade 2: Competências
    SE persona_data["competencias"] existe:
        competencias = persona_data["competencias"]["competencias"]
        especializacao = DETECTAR área das competências especializadas
        SE especializacao:
            RETORNAR especializacao
        FIM SE
    FIM SE
    
    // Prioridade 3: Biografia
    biografia = persona_data["biografia"]
    especializacao = biografia.get("especializacao")
    SE especializacao:
        RETORNAR especializacao
    FIM SE
    
    // Fallback: Detectar por educação/experiência
    educacao = biografia.get("educacao", "")
    experiencias = biografia.get("experiencias", "")
    
    SE "marketing" EM (educacao + experiencias).lower():
        RETORNAR "marketing"
    SE "tecnologia" OU "computação" EM (educacao + experiencias).lower():
        RETORNAR "tecnologia"
    SE "financeiro" OU "contábil" EM (educacao + experiencias).lower():
        RETORNAR "financeiro"
    // ... outras detecções
    
    RETORNAR "geral"  // Fallback padrão
FIM FUNÇÃO
```

#### 5. GERAÇÃO DA BASE DE CONHECIMENTO
```
FUNÇÃO generate_knowledge_base(persona_data, specialization):
    OBTER template = knowledge_templates.get(specialization, knowledge_templates["geral"])
    
    INICIALIZAR knowledge_base = {
        "core_topics": template["core_topics"].copy(),
        "procedures": template["procedures"].copy(), 
        "tools_knowledge": template["tools_knowledge"].copy(),
        "company_specific": [],
        "personal_context": []
    }
    
    // Adicionar conhecimento da biografia
    biografia = persona_data["biografia"]
    knowledge_base["personal_context"].ADICIONAR([
        f"Nome: {biografia['nome']}",
        f"Idade: {biografia['idade']} anos",
        f"País: {biografia['pais']}",
        f"Educação: {biografia['educacao']}",
        f"Idiomas: {', '.join(biografia['idiomas'])}"
    ])
    
    // Adicionar conhecimento das competências
    SE persona_data["competencias"] existe:
        competencias = persona_data["competencias"]["competencias"]
        
        // Adicionar competências técnicas como tópicos
        para comp em competencias["tecnicas"]:
            knowledge_base["core_topics"].ADICIONAR(comp)
        FIM PARA
        
        // Adicionar competências especializadas
        SE "especializadas" EM competencias:
            para comp em competencias["especializadas"]:
                knowledge_base["tools_knowledge"].ADICIONAR(comp)
            FIM PARA
        FIM SE
    FIM SE
    
    // Adicionar ferramentas das tech specs
    SE persona_data["tech_specs"] existe:
        ai_config = persona_data["tech_specs"]["ai_configuration"]
        
        SE "base_tools" EM ai_config:
            para tool em ai_config["base_tools"]:
                knowledge_base["tools_knowledge"].ADICIONAR(tool)
            FIM PARA
        FIM SE
        
        SE "specialized_tools" EM ai_config:
            para tool em ai_config["specialized_tools"]:
                knowledge_base["tools_knowledge"].ADICIONAR(tool)
            FIM PARA
        FIM SE
    FIM SE
    
    // Remover duplicatas
    para categoria em knowledge_base:
        knowledge_base[categoria] = list(set(knowledge_base[categoria]))
    FIM PARA
    
    RETORNAR knowledge_base
FIM FUNÇÃO
```

#### 6. GERAÇÃO DE CONFIGURAÇÃO DE ACESSO
```
FUNÇÃO generate_access_config(persona_data, specialization):
    biografia = persona_data["biografia"]
    categoria = DETERMINAR categoria da persona (assistente/especialista/executivo)
    
    INICIALIZAR access_config = {
        "search_scope": "department",
        "access_level": "standard",
        "knowledge_domains": [specialization],
        "restricted_areas": [],
        "priority_sources": []
    }
    
    // Configurar baseado na categoria
    SWITCH categoria:
        CASE "assistente":
            access_config["search_scope"] = "assigned_executive"
            access_config["access_level"] = "basic"
            access_config["priority_sources"] = [
                "company_procedures",
                "contact_directory",
                "meeting_templates"
            ]
            
        CASE "executivo":
            access_config["search_scope"] = "department"
            access_config["access_level"] = "elevated"
            access_config["priority_sources"] = [
                "strategic_documents",
                "financial_reports", 
                "department_data"
            ]
            
        CASE "especialista":
            access_config["search_scope"] = "specialization_area"
            access_config["access_level"] = "expert"
            access_config["knowledge_domains"].ADICIONAR("technical_documentation")
            access_config["priority_sources"] = [
                "technical_docs",
                "best_practices",
                "project_histories"
            ]
    FIM SWITCH
    
    // Adicionar domínios da especialização
    SE specialization != "geral":
        access_config["knowledge_domains"].ADICIONAR(f"{specialization}_expertise")
    FIM SE
    
    RETORNAR access_config
FIM FUNÇÃO
```

#### 7. GERAÇÃO DE PERSONALIZAÇÃO
```
FUNÇÃO generate_personalization(persona_data, specialization):
    biografia = persona_data["biografia"]
    
    INICIALIZAR personalization = {
        "language_preferences": extract_language_preferences(biografia),
        "expertise_level": determine_expertise_level(persona_data, specialization),
        "communication_style": determine_communication_style(persona_data),
        "focus_areas": extract_focus_areas(persona_data.get("competencias", {})),
        "learning_preferences": determine_learning_preferences(specialization)
    }
    
    RETORNAR personalization
FIM FUNÇÃO
```

#### 8. EXTRAÇÃO DE PREFERÊNCIAS DE IDIOMA
```
FUNÇÃO extract_language_preferences(bio_info):
    idiomas = bio_info.get("idiomas", ["português"])
    
    INICIALIZAR preferences = {
        "primary_language": "português",
        "supported_languages": idiomas,
        "international_content": False
    }
    
    SE "inglês" EM idiomas:
        preferences["international_content"] = True
        SE bio_info.get("pais") EM ["Estados Unidos", "Reino Unido", "Canadá"]:
            preferences["primary_language"] = "inglês"
        FIM SE
    FIM SE
    
    RETORNAR preferences
FIM FUNÇÃO
```

#### 9. DETERMINAÇÃO DO NÍVEL DE EXPERTISE
```
FUNÇÃO determine_expertise_level(competencias, specialization):
    SE não competencias:
        RETORNAR "intermediate"
    FIM SE
    
    comp_data = competencias.get("competencias", {})
    especializadas = comp_data.get("especializadas", [])
    tecnicas = comp_data.get("tecnicas", [])
    
    total_competencias = len(especializadas) + len(tecnicas)
    
    SE total_competencias >= 15:
        RETORNAR "expert"
    SE total_competencias >= 10:
        RETORNAR "advanced"  
    SE total_competencias >= 5:
        RETORNAR "intermediate"
    SENÃO:
        RETORNAR "beginner"
    FIM SE
FIM FUNÇÃO
```

#### 10. CRIAÇÃO DA ESTRUTURA RAG COMPLETA
```
FUNÇÃO create_rag_structure(persona_path):
    // Carregar todos os dados da persona
    persona_data = load_persona_data(persona_path)
    specialization = determine_specialization_area(persona_data)
    
    // Gerar componentes
    knowledge_base = generate_knowledge_base(persona_data, specialization)
    access_config = generate_access_config(persona_data, specialization)
    personalization = generate_personalization(persona_data, specialization)
    search_config = generate_search_config(persona_data, specialization)
    
    // Estrutura RAG completa
    rag_config = {
        "metadata": {
            "persona_id": persona_data["biografia"]["nome"],
            "specialization": specialization,
            "generated_at": datetime.now().isoformat(),
            "version": "1.0.0"
        },
        "persona_profile": persona_data["biografia"],
        "knowledge_base": knowledge_base,
        "access_configuration": access_config,
        "personalization": personalization,
        "search_configuration": search_config,
        "context_integration": {
            "supabase_sync": True,
            "real_time_updates": True,
            "cross_persona_learning": access_config["access_level"] != "basic"
        }
    }
    
    // Criar diretório output
    categoria = persona_path.parent.name
    nome = persona_data["biografia"]["nome"]
    output_dir = rag_output_path / categoria / nome
    CRIAR output_dir
    
    // Salvar arquivos
    ESCREVER rag_config em output_dir / "rag_config.json"
    
    context_rules = generate_context_rules(persona_data, specialization, knowledge_base)
    ESCREVER context_rules em output_dir / "context_rules.md"
    
    ESCREVER search_config em output_dir / "search_config.json"
    
    RETORNAR True
FIM FUNÇÃO
```

#### 11. GERAÇÃO DE REGRAS DE CONTEXTO
```
FUNÇÃO generate_context_rules(persona_data, specialization, knowledge_base):
    biografia = persona_data["biografia"]
    
    INICIALIZAR rules_md = f"""
# Regras de Contexto RAG - {biografia['nome']}

## Identidade e Papel
Você é {biografia['nome']}, {specialization} com {biografia['idade']} anos.
Sua especialização principal é em {specialization}.

## Conhecimento Base
Você tem acesso completo aos seguintes tópicos:
"""
    
    // Adicionar tópicos core
    para topic em knowledge_base["core_topics"]:
        rules_md += f"- {topic}\n"
    FIM PARA
    
    rules_md += """
## Procedimentos Conhecidos
Você está familiarizado com:
"""
    
    // Adicionar procedimentos
    para procedure em knowledge_base["procedures"]:
        rules_md += f"- {procedure}\n"
    FIM PARA
    
    rules_md += """
## Ferramentas e Sistemas
Você tem experiência com:
"""
    
    // Adicionar ferramentas
    para tool em knowledge_base["tools_knowledge"]:
        rules_md += f"- {tool}\n"
    FIM PARA
    
    // Adicionar regras de comportamento
    personalization = generate_personalization(persona_data, specialization)
    
    rules_md += f"""
## Estilo de Comunicação
- Nível de expertise: {personalization['expertise_level']}
- Estilo: {personalization['communication_style']}
- Idiomas preferidos: {', '.join(personalization['language_preferences']['supported_languages'])}

## Áreas de Foco
- Focar especialmente em: {', '.join(personalization['focus_areas'])}
- Preferências de aprendizado: {personalization['learning_preferences']}

## Contexto Pessoal
- Educação: {biografia['educacao']}
- País de origem: {biografia['pais']}
- Experiência: Baseada na biografia profissional
"""
    
    RETORNAR rules_md
FIM FUNÇÃO
```

#### 12. PROCESSAMENTO EM LOTE
```
FUNÇÃO process_all_personas():
    // Mesma estrutura dos scripts anteriores
    PARA cada categoria em ["assistentes", "especialistas", "executivos"]:
        PARA cada persona na categoria:
            TENTAR:
                create_rag_structure(persona_path)
                INCREMENT sucessos
            CAPTURAR erro:
                REGISTRAR erro
                INCREMENT erros
            FIM TENTAR
        FIM PARA
    FIM PARA
    
    SALVAR summary em "rag_summary.json"
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

#### Saída (rag_config.json):
```json
{
  "metadata": {
    "persona_id": "Maria Silva",
    "specialization": "marketing",
    "generated_at": "2025-11-11T15:30:00",
    "version": "1.0.0"
  },
  "knowledge_base": {
    "core_topics": [
      "Digital Marketing Strategy",
      "Social Media Best Practices",
      "SEO/SEM",
      "Google Analytics"
    ],
    "procedures": [
      "Campaign Planning Process",
      "Content Approval Workflow"
    ],
    "tools_knowledge": [
      "Social media management platforms",
      "Analytics and tracking tools"
    ],
    "personal_context": [
      "Nome: Maria Silva",
      "Especialização: marketing digital"
    ]
  },
  "access_configuration": {
    "search_scope": "specialization_area",
    "access_level": "expert",
    "knowledge_domains": ["marketing", "marketing_expertise"],
    "priority_sources": ["technical_docs", "best_practices"]
  },
  "personalization": {
    "language_preferences": {
      "primary_language": "português",
      "supported_languages": ["português", "inglês"],
      "international_content": true
    },
    "expertise_level": "advanced",
    "communication_style": "detailed",
    "focus_areas": ["digital marketing", "social media"]
  }
}
```

### Fluxo de Execução
1. Carregar dados completos da persona (bio + competências + tech specs)
2. Determinar área de especialização automaticamente
3. Aplicar template de knowledge base da especialização
4. Personalizar baseado no perfil individual
5. Configurar acesso e escopo de busca
6. Gerar regras de contexto em linguagem natural
7. Salvar configuração RAG completa
8. Processar todas as personas em lote

### Características Especiais
- **Knowledge base especializada:** Templates por área de expertise
- **Personalização completa:** Baseada em biografia, competências e tech specs
- **Contexto rico:** Regras de comportamento em linguagem natural
- **Acesso granular:** Configuração de escopo e nível por hierarquia
- **Integração multiplataforma:** Configurado para Supabase e sistemas externos