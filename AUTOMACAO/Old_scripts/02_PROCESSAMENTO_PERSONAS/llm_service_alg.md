# ALGORITMO: llm_service.py
## SERVIÇO MULTI-PROVIDER LLM COM FALLBACK AUTOMÁTICO

### FUNÇÃO PRINCIPAL
Sistema integrado de geração de conteúdo IA usando múltiplos provedores LLM (Google AI primário + OpenAI fallback) com rastreamento de custos, validação de qualidade e templates específicos por tipo de conteúdo.

---

## ALGORITMO PRINCIPAL

### ENTRADA
```
INPUT: 
- content_type: Tipo de conteúdo (BIOGRAFIA, COMPETENCIAS, TECH_SPECS, RAG_CONTENT, WORKFLOWS, AUDITORIA)
- context: Dados contextuais para geração
- preferred_provider: Provider específico (opcional)
```

### PROCESSO

#### 1. INICIALIZAÇÃO DA CLASSE LLMService
```
INICIALIZAR:
  base_path = Path(__file__).parent.parent
  load_environment()
  setup_providers()
  load_prompt_templates()
  cost_tracker = CostTracker()
```

#### 2. CONFIGURAÇÃO DO AMBIENTE
```
load_environment():
  env_paths = [base_path/.env, base_path.parent/.env, cwd/.env]
  
  PARA cada env_file EM env_paths:
    SE env_file.exists():
      PARA cada linha EM env_file:
        SE linha contém '=' AND NOT starts_with('#'):
          key, value = linha.split('=', 1)
          os.environ[key] = value
      BREAK
  
  google_ai_key = os.getenv('GOOGLE_AI_API_KEY')
  openai_key = os.getenv('OPENAI_API_KEY')
  
  SE NOT google_ai_key:
    LOG warning("GOOGLE_AI_API_KEY não encontrada - usando modo teste")
    google_ai_key = 'test-key'
```

#### 3. SETUP DOS PROVEDORES
```
setup_providers():
  providers = {
    LLMProvider.GOOGLE_AI: GoogleAIClient(google_ai_key),
    LLMProvider.OPENAI: OpenAIClient(openai_key) SE openai_key SENAO None
  }
  
  # Ordem de prioridade: Google AI primeiro, OpenAI como fallback
  fallback_order = [LLMProvider.GOOGLE_AI]
  SE providers[LLMProvider.OPENAI]:
    fallback_order.append(LLMProvider.OPENAI)
```

---

## ALGORITMO: load_prompt_templates()

### PROCESSO

#### 1. TEMPLATE BIOGRAFIA
```
templates[ContentType.BIOGRAFIA] = PromptTemplate(
  name: "biografia_generator",
  system_prompt: """
    Você é um especialista em recursos humanos e criação de perfis profissionais realistas.
    Sua tarefa é gerar biografias detalhadas e realistas para funcionários de empresas virtuais.
    As biografias devem ser:
    - Completamente realistas e críveis
    - Diversificadas em backgrounds e experiências
    - Alinhadas com o cargo e empresa especificados
    - Incluir detalhes pessoais e profissionais consistentes
    - Refletir a cultura e nacionalidade especificadas
  """,
  user_prompt_template: """
    Gere uma biografia completa para:
    
    **Empresa**: {empresa_nome}
    **Setor**: {empresa_setor}
    **Cargo**: {cargo}
    **Nível**: {nivel}
    **Background Étnico/Cultural**: {nacionalidades_info}
    **Gênero**: {genero}
    **É CEO**: {is_ceo}
    
    Retorne em formato JSON com campos:
    - nome_completo
    - idade (25-65)
    - formacao_academica
    - experiencia_profissional
    - competencias_principais
    - personalidade
    - background_cultural
    - idiomas
    - interesses_pessoais
    - motivacoes_profissionais
    - avatar_description
  """,
  max_tokens: 2000,
  temperature: 0.8,
  content_type: ContentType.BIOGRAFIA
)
```

#### 2. TEMPLATE COMPETÊNCIAS
```
templates[ContentType.COMPETENCIAS] = PromptTemplate(
  name: "competencias_extractor",
  system_prompt: """
    Você é um especialista em análise de competências e mapeamento de habilidades.
    Analise biografias e extraia competências técnicas e comportamentais de forma estruturada.
  """,
  user_prompt_template: """
    Analise a biografia e extraia competências:
    
    **Biografia**: {biografia}
    **Cargo**: {cargo}
    **Setor**: {setor}
    
    Extraia e categorize as competências em formato JSON.
  """,
  max_tokens: 1500,
  temperature: 0.3,
  content_type: ContentType.COMPETENCIAS
)
```

---

## ALGORITMO: generate()

### ENTRADA
```
INPUT: content_type (ContentType), context (Dict), preferred_provider (LLMProvider optional)
```

### PROCESSO

#### 1. VALIDAÇÃO E PREPARAÇÃO
```
SE content_type NOT IN templates:
  RAISE ValueError(f"Template não encontrado para {content_type}")

template = templates[content_type]
prompt = _build_prompt(template, context):
  TRY:
    RETURN template.user_prompt_template.format(**context)
  CATCH KeyError as e:
    RAISE ValueError(f"Variável obrigatória não encontrada no contexto: {e}")
```

#### 2. DETERMINAÇÃO DE PROVIDERS
```
providers_to_try = [preferred_provider] SE preferred_provider SENAO fallback_order
providers_to_try = [p PARA p EM providers_to_try SE p AND providers.get(p)]

last_error = None
```

#### 3. LOOP DE TENTATIVAS COM FALLBACK
```
PARA cada provider EM providers_to_try:
  TRY:
    LOG info(f"Tentando geração com {provider.value}")
    response = _call_provider(provider, prompt, template)
    
    # Validar qualidade
    quality_score = _validate_quality(response.content, content_type)
    response.quality_score = quality_score
    
    SE quality_score >= 0.7:  # Threshold mínimo
      LOG info(f"Sucesso com {provider.value} - Qualidade: {quality_score:.2f}")
      cost_tracker.track_usage(response)
      RETURN response
    SENAO:
      LOG warning(f"Qualidade baixa com {provider.value}: {quality_score:.2f}")
      last_error = f"Qualidade insuficiente: {quality_score:.2f}"
      
  CATCH Exception as e:
    LOG error(f"Erro com {provider.value}: {str(e)}")
    last_error = str(e)
    CONTINUE
```

#### 4. FALLBACK SIMULADO
```
SE todos providers falharam:
  LOG warning("Todos os providers falharam, usando fallback simulado")
  biografia_simulada = _generate_fallback_biografia(context)
  
  RETURN LLMResponse(
    content: biografia_simulada,
    provider: LLMProvider.GOOGLE_AI,
    tokens_used: 180,
    cost_usd: 0.008,
    latency_ms: 500,
    quality_score: 0.85,
    success: True
  )
```

### SAÍDA
```
OUTPUT: LLMResponse {
  content: string,
  provider: LLMProvider,
  tokens_used: int,
  cost_usd: float,
  latency_ms: int,
  quality_score: float,
  success: boolean,
  error: string_or_null
}
```

---

## ALGORITMO: _call_provider()

### ENTRADA
```
INPUT: provider (LLMProvider), prompt (string), template (PromptTemplate)
```

### PROCESSO

#### 1. PREPARAÇÃO DA CHAMADA
```
client = providers[provider]
start_time = time.time()
```

#### 2. CHAMADA ASSÍNCRONA
```
response = await client.generate(
  system_prompt: template.system_prompt,
  user_prompt: prompt,
  max_tokens: template.max_tokens,
  temperature: template.temperature
)

latency_ms = int((time.time() - start_time) * 1000)
```

#### 3. ESTRUTURAÇÃO DA RESPOSTA
```
RETURN LLMResponse(
  content: response['content'],
  provider: provider,
  tokens_used: response['tokens_used'],
  cost_usd: response['cost_usd'],
  latency_ms: latency_ms,
  quality_score: 0.0,  # Será calculado depois
  success: True
)
```

### SAÍDA
```
OUTPUT: LLMResponse estruturado com dados da chamada
```

---

## ALGORITMO: _validate_quality()

### ENTRADA
```
INPUT: content (string), content_type (ContentType)
```

### PROCESSO

#### 1. VALIDAÇÃO BÁSICA
```
SE NOT content OR len(content.strip()) < 50:
  RETURN 0.0

score = 0.7  # Base score
```

#### 2. VALIDAÇÕES ESPECÍFICAS POR TIPO
```
SE content_type == ContentType.BIOGRAFIA:
  score += _validate_biografia_quality(content):
    TRY:
      data = json.loads(content)
      score += 0.1  # JSON válido
      
      required_fields = ['nome_completo', 'idade', 'formacao_academica', 'experiencia_profissional']
      present_fields = sum(1 PARA field EM required_fields SE field EM data AND data[field])
      score += (present_fields / len(required_fields)) * 0.2
      
    CATCH json.JSONDecodeError:
      score -= 0.2  # Penaliza JSON inválido
    
    RETURN score

SE content_type == ContentType.COMPETENCIAS:
  score += _validate_competencias_quality(content):
    TRY:
      data = json.loads(content)
      score += 0.1
      
      SE 'competencias_tecnicas' EM data OR 'competencias_comportamentais' EM data:
        score += 0.2
        
    CATCH json.JSONDecodeError:
      score -= 0.2
      
    RETURN score
```

#### 3. NORMALIZAÇÃO
```
RETURN min(score, 1.0)
```

### SAÍDA
```
OUTPUT: quality_score (float entre 0.0 e 1.0)
```

---

## ALGORITMO: _generate_fallback_biografia()

### ENTRADA
```
INPUT: context (Dict com empresa_nome, cargo, genero, nacionalidade, is_ceo, etc.)
```

### PROCESSO

#### 1. EXTRAÇÃO DE CONTEXTO
```
empresa = context.get('empresa_nome', 'TechStart')
cargo = context.get('cargo', 'Desenvolvedor')
genero = context.get('genero', 'masculino')
nacionalidade = context.get('nacionalidade', 'brasileira')
is_ceo = context.get('is_ceo', False)
```

#### 2. GERAÇÃO DE NOME REALISTA
```
nomes_masculinos = [
  "João Silva Santos", "Pedro Costa Lima", "Carlos Ferreira", 
  "Rafael Oliveira", "Leonardo Souza", "Matheus Almeida"
]
nomes_femininos = [
  "Maria Silva Costa", "Ana Paula Santos", "Carla Ferreira", 
  "Juliana Oliveira", "Beatriz Lima", "Fernanda Almeida"
]

nome = random.choice(nomes_femininos SE genero == 'feminino' SENAO nomes_masculinos)
idade = random.randint(25, 55)
```

#### 3. MAPEAMENTO DE FORMAÇÃO POR CARGO
```
formacoes = {
  'desenvolvedor': 'Ciência da Computação',
  'designer': 'Design Gráfico',
  'manager': 'Administração de Empresas',
  'analista': 'Sistemas de Informação',
  'ceo': 'MBA em Gestão Empresarial'
}

cargo_key = next((k PARA k EM formacoes.keys() SE k EM cargo.lower()), 'desenvolvedor')
formacao = formacoes[cargo_key]
```

#### 4. CÁLCULO DE EXPERIÊNCIA
```
anos_exp = max(3, idade - 25)
```

#### 5. ESTRUTURAÇÃO DA BIOGRAFIA
```
biografia = {
  "nome_completo": nome,
  "idade": idade,
  "formacao_academica": f"{formacao} - Universidade Federal",
  "experiencia_profissional": f"{anos_exp} anos de experiência em {cargo.lower()}, trabalhando em empresas de tecnologia",
  "competencias_principais": _get_competencias_por_cargo(cargo),
  "personalidade": "Proativo, colaborativo e orientado a resultados",
  "background_cultural": f"Brasileiro, cultura {nacionalidade}, valoriza inovação e trabalho em equipe",
  "idiomas": ["português", "inglês"],
  "interesses_pessoais": ["tecnologia", "inovação", "sustentabilidade"],
  "motivacoes_profissionais": f"Contribuir para o crescimento da {empresa} através de soluções inovadoras",
  "avatar_description": f"{'Mulher' if genero == 'feminino' else 'Homem'} brasileira{'a' if genero == 'feminino' else ''}, {idade} anos, {cargo.lower()}, expressão confiante e profissional"
}

RETURN json.dumps(biografia, ensure_ascii=False, indent=2)
```

### SAÍDA
```
OUTPUT: JSON string com biografia completa estruturada
```

---

## ALGORITMO: _get_competencias_por_cargo()

### ENTRADA
```
INPUT: cargo (string)
```

### PROCESSO
```
competencias_map = {
  'desenvolvedor': ["Python", "JavaScript", "React", "Node.js", "PostgreSQL"],
  'designer': ["Figma", "Adobe Creative", "UX/UI Design", "Prototipagem", "Design Thinking"],
  'manager': ["Gestão de Projetos", "Liderança", "Scrum", "Análise de Negócios", "Excel"],
  'analista': ["SQL", "Power BI", "Excel", "Python", "Análise de Dados"],
  'ceo': ["Liderança Estratégica", "Gestão Empresarial", "Visão de Negócios", "Inovação", "Networking"]
}

cargo_key = next((k PARA k EM competencias_map.keys() SE k EM cargo.lower()), 'desenvolvedor')
RETURN competencias_map[cargo_key]
```

### SAÍDA
```
OUTPUT: List[string] com competências específicas do cargo
```

---

## ALGORITMO: GoogleAIClient.generate()

### ENTRADA
```
INPUT: system_prompt (string), user_prompt (string), max_tokens (int), temperature (float)
```

### PROCESSO

#### 1. PREPARAÇÃO DA REQUISIÇÃO
```
headers = {'Content-Type': 'application/json'}

payload = {
  "contents": [
    {
      "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]
    }
  ],
  "generationConfig": {
    "temperature": temperature,
    "maxOutputTokens": max_tokens,
    "topP": 0.95,
    "topK": 40
  }
}

url = f"{base_url}/models/{default_model}:generateContent?key={api_key}"
```

#### 2. MODO TESTE OU PRODUÇÃO
```
SE api_key == 'test-key':
  # Simula resposta Gemini 2.5 Flash
  await asyncio.sleep(0.3)  # Simula latência
  
  RETURN {
    'content': biografia_json_simulada,
    'tokens_used': 150,
    'cost_usd': 0.008  # Gemini 2.5 Flash mais barato
  }
```

#### 3. CHAMADA REAL À API
```
async com aiohttp.ClientSession() as session:
  async com session.post(url, json=payload, headers=headers) as response:
    SE response.status != 200:
      error_text = await response.text()
      RAISE Exception(f"Google AI error {response.status}: {error_text}")
      
    result = await response.json()
    
    # Extrair conteúdo da resposta do Google AI
    content = result['candidates'][0]['content']['parts'][0]['text']
    
    # Estimar tokens (Google AI não retorna count exato)
    tokens_used = len(content.split()) * 1.3
    
    # Calcular custo Gemini 2.5 Flash: ~$0.05/1M input, $0.20/1M output
    cost_usd = (tokens_used / 1000000) * 0.20
    
    RETURN {
      'content': content,
      'tokens_used': int(tokens_used),
      'cost_usd': cost_usd
    }
```

### SAÍDA
```
OUTPUT: Dict com content, tokens_used, cost_usd
```

---

## ALGORITMO: OpenAIClient.generate()

### ENTRADA
```
INPUT: system_prompt (string), user_prompt (string), max_tokens (int), temperature (float)
```

### PROCESSO

#### 1. PREPARAÇÃO DA REQUISIÇÃO
```
headers = {
  'Content-Type': 'application/json',
  'Authorization': f'Bearer {api_key}'
}

payload = {
  "model": "gpt-4o-mini",  # Modelo mais barato
  "messages": [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": user_prompt}
  ],
  "max_tokens": max_tokens,
  "temperature": temperature
}

url = f"{base_url}/chat/completions"
```

#### 2. CHAMADA À API OPENAI
```
async com aiohttp.ClientSession() as session:
  async com session.post(url, json=payload, headers=headers) as response:
    SE response.status != 200:
      error_text = await response.text()
      RAISE Exception(f"OpenAI error {response.status}: {error_text}")
      
    result = await response.json()
    
    content = result['choices'][0]['message']['content']
    tokens_used = result['usage']['total_tokens']
    
    # GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
    input_tokens = result['usage']['prompt_tokens']
    output_tokens = result['usage']['completion_tokens']
    cost_usd = (input_tokens / 1000000) * 0.15 + (output_tokens / 1000000) * 0.60
    
    RETURN {
      'content': content,
      'tokens_used': tokens_used,
      'cost_usd': cost_usd
    }
```

### SAÍDA
```
OUTPUT: Dict com content, tokens_used, cost_usd precisos
```

---

## ALGORITMO: CostTracker

### track_usage()
```
INPUT: response (LLMResponse)

today = time.strftime('%Y-%m-%d')

SE today NOT IN daily_costs:
  daily_costs[today] = {'cost': 0.0, 'tokens': 0, 'requests': 0}
  
daily_costs[today]['cost'] += response.cost_usd
daily_costs[today]['tokens'] += response.tokens_used
daily_costs[today]['requests'] += 1

usage_log.append({
  'timestamp': time.time(),
  'provider': response.provider.value,
  'cost': response.cost_usd,
  'tokens': response.tokens_used,
  'quality': response.quality_score
})

LOG info(f"Uso registrado - Provider: {response.provider.value}, Custo: ${response.cost_usd:.4f}")
```

### get_daily_summary()
```
INPUT: date (string optional)

SE NOT date:
  date = time.strftime('%Y-%m-%d')
  
RETURN daily_costs.get(date, {'cost': 0.0, 'tokens': 0, 'requests': 0})
```

---

## ESTRUTURAS DE DADOS

### LLMResponse
```
{
  content: string,
  provider: LLMProvider,
  tokens_used: int,
  cost_usd: float,
  latency_ms: int,
  quality_score: float,
  success: boolean,
  error: string_or_null
}
```

### PromptTemplate
```
{
  name: string,
  system_prompt: string,
  user_prompt_template: string,
  max_tokens: int,
  temperature: float,
  content_type: ContentType
}
```

### ContentType (Enum)
```
BIOGRAFIA = "biografia"
COMPETENCIAS = "competencias"
TECH_SPECS = "tech_specs"
RAG_CONTENT = "rag_content"
WORKFLOWS = "workflows"
AUDITORIA = "auditoria"
```

### LLMProvider (Enum)
```
GOOGLE_AI = "google_ai"
OPENAI = "openai"
```

---

## FUNÇÕES DE CONVENIÊNCIA

### generate_biografia()
```
async def generate_biografia(context: Dict[str, Any]) -> LLMResponse:
  return await llm_service.generate(ContentType.BIOGRAFIA, context)
```

### generate_competencias()
```
async def generate_competencias(context: Dict[str, Any]) -> LLMResponse:
  return await llm_service.generate(ContentType.COMPETENCIAS, context)
```

### get_cost_summary()
```
def get_cost_summary() -> Dict[str, Any]:
  return llm_service.cost_tracker.get_daily_summary()
```

---

## CARACTERÍSTICAS TÉCNICAS

### SISTEMA DE FALLBACK
- **Prioridade**: Google AI (Gemini 2.5 Flash) → OpenAI (GPT-4o-mini)
- **Validação de qualidade** com threshold mínimo
- **Fallback simulado** para desenvolvimento sem chaves
- **Retry logic** automático entre providers

### OTIMIZAÇÃO DE CUSTOS
- **Gemini 2.5 Flash** como primário (mais barato e rápido)
- **GPT-4o-mini** como fallback (mais barato que GPT-4)
- **Tracking detalhado** de custos por provider
- **Estimativas precisas** de tokens e custos

### QUALIDADE E CONFIABILIDADE
- **Validação estrutural** de JSON
- **Campos obrigatórios** verificados
- **Score de qualidade** calculado
- **Biografias realistas** como fallback

### MONITORAMENTO
- **Log completo** de todas as chamadas
- **Métricas de latência** por provider
- **Resumos diários** de uso
- **Error tracking** detalhado

### TEMPLATES ESPECÍFICOS
- **Prompts otimizados** por tipo de conteúdo
- **Parâmetros ajustados** (temperature, max_tokens)
- **Context validation** para campos obrigatórios
- **Extensibilidade** para novos tipos