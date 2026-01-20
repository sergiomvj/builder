# Algoritmo: Gerador de Competências

## Arquivo: `01_generate_competencias.py`

### Objetivo
Analisar biografias das personas e gerar competências técnicas e comportamentais estruturadas.

### Entrada (Input)
- Arquivos markdown de biografias em `04_PERSONAS_COMPLETAS/{categoria}/`
- Estrutura: `{nome}_{sobrenome}.md`

### Saída (Output) 
- `competencias_output/{categoria}/{nome}/`
  - `competencias.json`: Dados estruturados
  - `competencias.md`: Documentação markdown
- `competencias_summary.json`: Resumo geral

### Algoritmo Principal

#### 1. INICIALIZAÇÃO
```
FUNÇÃO __init__(base_path=None):
    SE base_path fornecido:
        self.base_path = Path(base_path)
    SENÃO:
        self.base_path = Path(__file__).parent.parent
    FIM SE
    
    DEFINIR personas_path = base_path / "04_PERSONAS_COMPLETAS"
    DEFINIR output_path = base_path / "competencias_output"
    CRIAR output_path se não existir
    
    DEFINIR competencias_templates por categoria:
        - assistente: {tecnicas, comportamentais}
        - executivo: {tecnicas, comportamentais}  
        - especialista: {tecnicas, comportamentais}
        - gestor: {tecnicas, comportamentais}
FIM FUNÇÃO
```

#### 2. EXTRAÇÃO DE INFORMAÇÕES DA BIOGRAFIA
```
FUNÇÃO extract_bio_info(bio_content):
    INICIALIZAR bio_info = {}
    
    // Extrair nome do cabeçalho
    BUSCAR padrão "# (.+)" em bio_content
    SE encontrado:
        bio_info["nome"] = match.group(1).strip()
    FIM SE
    
    // Extrair idade
    BUSCAR padrão "Idade.*?(\d+)" em bio_content
    SE encontrado:
        bio_info["idade"] = int(match.group(1))
    FIM SE
    
    // Extrair país
    BUSCAR padrão "País.*?([A-Za-z\s]+)" em bio_content
    SE encontrado:
        bio_info["pais"] = match.group(1).strip()
    FIM SE
    
    // Extrair educação
    BUSCAR padrão "Educação.*?([^\n]+)" em bio_content
    SE encontrado:
        bio_info["educacao"] = match.group(1).strip()
    FIM SE
    
    // Extrair idiomas
    BUSCAR padrão "Idiomas.*?([^\n]+)" em bio_content
    SE encontrado:
        idiomas_texto = match.group(1)
        DIVIDIR por vírgulas e limpar
        bio_info["idiomas"] = lista_idiomas
    FIM SE
    
    // Extrair especialização (se existir)
    BUSCAR padrões de especialização
    bio_info["especializacao"] = especializacao encontrada
    
    // Extrair experiências profissionais
    BUSCAR seção "Biografia Profissional" ou similar
    bio_info["experiencias"] = texto extraído
    
    RETORNAR bio_info
FIM FUNÇÃO
```

#### 3. GERAÇÃO DE COMPETÊNCIAS
```
FUNÇÃO generate_competencias_from_bio(bio_info, role_type):
    OBTER template_base = competencias_templates[role_type]
    
    INICIALIZAR competencias = {
        "tecnicas": [],
        "comportamentais": [],
        "especializadas": [],
        "idiomas": bio_info.get("idiomas", [])
    }
    
    // Competências técnicas base
    competencias["tecnicas"] = template_base["tecnicas"].copy()
    
    // Competências comportamentais base  
    competencias["comportamentais"] = template_base["comportamentais"].copy()
    
    // Competências especializadas baseadas na biografia
    SE bio_info["especializacao"]:
        SWITCH bio_info["especializacao"]:
            CASE "hr":
                ADICIONAR ["Recrutamento", "Treinamento", "Avaliação de Performance"]
            CASE "marketing":
                ADICIONAR ["SEO/SEM", "Analytics", "Campaign Management"] 
            CASE "tecnologia":
                ADICIONAR ["Programação", "DevOps", "Cloud Computing"]
            CASE "financeiro":
                ADICIONAR ["Análise Financeira", "Controladoria", "Planning"]
            // ... outros casos
        FIM SWITCH
    FIM SE
    
    // Ajustes baseados na idade/experiência
    SE bio_info["idade"] > 40:
        ADICIONAR competências de liderança sênior
    FIM SE
    
    SE bio_info["idade"] < 30:
        ADICIONAR competências de tecnologia/inovação
    FIM SE
    
    RETORNAR competencias
FIM FUNÇÃO
```

#### 4. CRIAÇÃO DE ESTRUTURA COMPLETA
```
FUNÇÃO create_competencias_structure(persona_path):
    // Ler biografia
    bio_file = persona_path / "biografia.md" OU arquivo .md principal
    bio_content = LER arquivo
    
    // Extrair informações
    bio_info = extract_bio_info(bio_content)
    
    // Determinar tipo de role
    categoria = OBTER de persona_path.parent.name
    role_type = MAPEAR categoria para template
    
    // Gerar competências
    competencias = generate_competencias_from_bio(bio_info, role_type)
    
    // Criar estrutura de dados completa
    estrutura = {
        "metadata": {
            "nome": bio_info["nome"],
            "categoria": categoria,
            "gerado_em": datetime.now().isoformat(),
            "versao": "1.0.0"
        },
        "perfil": bio_info,
        "competencias": competencias,
        "avaliacao": {
            "nivel_senioridade": CALCULAR baseado na idade/experiência,
            "score_tecnico": CALCULAR baseado nas competências,
            "score_lideranca": CALCULAR baseado na categoria
        }
    }
    
    // Criar diretório output
    output_dir = output_path / categoria / bio_info["nome"]
    CRIAR output_dir
    
    // Salvar JSON
    ESCREVER estrutura em output_dir / "competencias.json"
    
    // Gerar e salvar markdown
    markdown_content = generate_competencias_md(competencias, bio_info)
    ESCREVER markdown_content em output_dir / "competencias.md"
    
    RETORNAR True se sucesso
FIM FUNÇÃO
```

#### 5. GERAÇÃO DE MARKDOWN
```
FUNÇÃO generate_competencias_md(comp_data, bio_info):
    INICIALIZAR markdown = ""
    
    ADICIONAR cabeçalho:
        # Competências - {bio_info["nome"]}
        
        ## Perfil Profissional
        - **Idade:** {idade}
        - **País:** {pais}  
        - **Educação:** {educacao}
        - **Idiomas:** {idiomas}
    
    ADICIONAR seção técnicas:
        ## Competências Técnicas
        PARA cada competencia em comp_data["tecnicas"]:
            - {competencia}
        FIM PARA
    
    ADICIONAR seção comportamentais:
        ## Competências Comportamentais  
        PARA cada competencia em comp_data["comportamentais"]:
            - {competencia}
        FIM PARA
    
    SE existem competências especializadas:
        ADICIONAR seção:
            ## Competências Especializadas
            PARA cada competencia em comp_data["especializadas"]:
                - {competencia}
            FIM PARA
    FIM SE
    
    ADICIONAR rodapé com metadados
    
    RETORNAR markdown
FIM FUNÇÃO
```

#### 6. PROCESSAMENTO EM LOTE
```
FUNÇÃO process_all_personas():
    INICIALIZAR resultados = {
        "processadas": 0,
        "sucessos": 0, 
        "erros": 0,
        "detalhes": []
    }
    
    // Processar cada categoria
    PARA cada categoria em ["assistentes", "especialistas", "executivos"]:
        categoria_path = personas_path / categoria
        
        SE categoria_path existe:
            // Processar cada persona
            PARA cada arquivo .md em categoria_path:
                TENTAR:
                    sucesso = create_competencias_structure(arquivo.parent)
                    SE sucesso:
                        resultados["sucessos"] += 1
                    FIM SE
                CAPTURAR erro:
                    resultados["erros"] += 1
                    REGISTRAR erro em log
                FIM TENTAR
                
                resultados["processadas"] += 1
            FIM PARA
        FIM SE
    FIM PARA
    
    // Salvar resumo
    ESCREVER resultados em "competencias_summary.json"
    
    RETORNAR resultados
FIM FUNÇÃO
```

### Dependências
- `os`, `sys`: Operações de sistema
- `json`: Manipulação de JSON
- `re`: Expressões regulares para parsing
- `pathlib.Path`: Manipulação de caminhos
- `datetime`: Timestamps
- `typing`: Type hints

### Estruturas de Dados

#### Entrada (biografia.md):
```markdown
# Maria Silva

## Informações Pessoais
- **Idade:** 32 anos
- **País:** Brasil
- **Educação:** MBA em Marketing Digital
- **Idiomas:** português, inglês, espanhol

## Biografia Profissional
Especialista em marketing digital com 8 anos de experiência...
```

#### Saída (competencias.json):
```json
{
  "metadata": {
    "nome": "Maria Silva",
    "categoria": "especialistas", 
    "gerado_em": "2025-11-11T15:30:00",
    "versao": "1.0.0"
  },
  "perfil": {
    "nome": "Maria Silva",
    "idade": 32,
    "pais": "Brasil",
    "educacao": "MBA em Marketing Digital",
    "idiomas": ["português", "inglês", "espanhol"],
    "especializacao": "marketing"
  },
  "competencias": {
    "tecnicas": [
      "SEO/SEM",
      "Google Analytics", 
      "Campaign Management",
      "Social Media Marketing"
    ],
    "comportamentais": [
      "Criatividade",
      "Análise de dados",
      "Comunicação persuasiva", 
      "Orientação a resultados"
    ],
    "especializadas": [
      "Growth Hacking",
      "Marketing Automation",
      "Conversion Optimization"
    ],
    "idiomas": ["português", "inglês", "espanhol"]
  },
  "avaliacao": {
    "nivel_senioridade": "senior",
    "score_tecnico": 85,
    "score_lideranca": 70
  }
}
```

### Fluxo de Execução
1. Varrer diretórios de personas por categoria
2. Para cada arquivo .md encontrado:
   - Ler e parse do conteúdo da biografia
   - Extrair informações estruturadas (regex)
   - Determinar tipo de role/categoria
   - Aplicar template de competências apropriado
   - Gerar competências especializadas baseadas no perfil
   - Calcular scores e níveis
   - Salvar JSON e MD no diretório output
3. Gerar relatório de summary com estatísticas

### Características Especiais
- **Parsing robusto:** Usa regex para extrair dados dos MDs
- **Templates contextuais:** Competências diferentes por categoria
- **Especialização automática:** Detecta área e adiciona skills relevantes
- **Scoring inteligente:** Calcula níveis baseado em idade/experiência
- **Output duplo:** JSON estruturado + MD legível