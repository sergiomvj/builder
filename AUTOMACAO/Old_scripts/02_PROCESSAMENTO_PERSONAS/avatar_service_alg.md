# ALGORITMO: avatar_service.py
## GERADOR DE AVATARES PARA PERSONAS COM NANO BANANA

### FUNÇÃO PRINCIPAL
Gerar avatares realistas para personas do sistema VCM usando integração com Nano Banana API, incluindo simulação para desenvolvimento e rastreamento de custos.

---

## ALGORITMO PRINCIPAL

### ENTRADA
```
INPUT: 
- persona_data: Dados completos da persona (biografia, cargo, características)
- request_custom: Parâmetros customizados (description, gender, ethnicity, age_range, style)
```

### PROCESSO

#### 1. INICIALIZAÇÃO DA CLASSE NanoBananaClient
```
INICIALIZAR:
  base_path = Path(__file__).parent.parent
  load_environment()
  setup_client()
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
  
  # Configuração Nano Banana
  api_key = os.getenv('NANO_BANANA_API_KEY', 'placeholder-key')
  base_url = "https://api.nanobanana.com/v1"  # URL placeholder
```

#### 3. SETUP DO CLIENTE
```
setup_client():
  session = None
  cost_tracker = AvatarCostTracker()
```

---

## ALGORITMO: generate_avatar()

### ENTRADA
```
INPUT: request (AvatarRequest com description, gender, ethnicity, age_range, style, size)
```

### PROCESSO

#### 1. DETERMINAÇÃO DO MODO DE OPERAÇÃO
```
start_time = time.time()

TRY:
  SE api_key == 'placeholder-key':
    RETURN _simulate_avatar_generation(request, start_time)
  SENAO:
    RETURN _call_nano_banana_api(request, start_time)
    
CATCH Exception as e:
  LOG error(f"Erro na geração de avatar: {str(e)}")
  RETURN AvatarResponse(
    image_url: None,
    image_base64: None,
    success: False,
    cost_usd: 0.0,
    generation_time_ms: int((time.time() - start_time) * 1000),
    error: str(e)
  )
```

### SAÍDA
```
OUTPUT: AvatarResponse {
  image_url: string_or_null,
  image_base64: string_or_null,
  success: boolean,
  cost_usd: float,
  generation_time_ms: int,
  error: string_or_null
}
```

---

## ALGORITMO: _simulate_avatar_generation()

### ENTRADA
```
INPUT: request (AvatarRequest), start_time (float)
```

### PROCESSO

#### 1. SIMULAÇÃO DE TEMPO DE PROCESSAMENTO
```
await asyncio.sleep(1.5)  # Simula latência da API
```

#### 2. GERAÇÃO DE PLACEHOLDER
```
description_hash = hashlib.md5(request.description.encode()).hexdigest()[:8]
placeholder_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={description_hash}&backgroundColor=transparent"
```

#### 3. CÁLCULO DE MÉTRICAS SIMULADAS
```
simulated_cost = 0.05  # $0.05 per avatar
generation_time = int((time.time() - start_time) * 1000)

response = AvatarResponse(
  image_url: placeholder_url,
  image_base64: None,
  success: True,
  cost_usd: simulated_cost,
  generation_time_ms: generation_time,
  error: None
)

cost_tracker.track_generation(response)
LOG info(f"Avatar simulado - Custo: ${simulated_cost:.3f}, Tempo: {generation_time}ms")
```

### SAÍDA
```
OUTPUT: AvatarResponse com URL placeholder e métricas simuladas
```

---

## ALGORITMO: _call_nano_banana_api()

### ENTRADA
```
INPUT: request (AvatarRequest), start_time (float)
```

### PROCESSO

#### 1. PREPARAÇÃO DA REQUISIÇÃO
```
headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}

payload = {
  "prompt": _build_nano_banana_prompt(request),
  "style": request.style,
  "size": request.size,
  "format": "url",  # ou "base64"
  "quality": "high"
}

url = f"{base_url}/generate/avatar"
```

#### 2. CHAMADA À API
```
async com aiohttp.ClientSession() as session:
  async com session.post(url, json=payload, headers=headers) as response:
    SE response.status != 200:
      error_text = await response.text()
      RAISE Exception(f"Nano Banana API error {response.status}: {error_text}")
    
    result = await response.json()
    generation_time = int((time.time() - start_time) * 1000)
```

#### 3. ESTRUTURAÇÃO DA RESPOSTA
```
avatar_response = AvatarResponse(
  image_url: result.get('image_url'),
  image_base64: result.get('image_base64'),
  success: True,
  cost_usd: result.get('cost', 0.05),
  generation_time_ms: generation_time,
  error: None
)

cost_tracker.track_generation(avatar_response)
RETURN avatar_response
```

### SAÍDA
```
OUTPUT: AvatarResponse com dados reais da API Nano Banana
```

---

## ALGORITMO: _build_nano_banana_prompt()

### ENTRADA
```
INPUT: request (AvatarRequest)
```

### PROCESSO

#### 1. CONSTRUÇÃO DE PARTES DO PROMPT
```
prompt_parts = []

# Descrição base
prompt_parts.append(request.description)

# Características demográficas
SE request.gender:
  prompt_parts.append(f"gender: {request.gender}")

SE request.ethnicity:
  prompt_parts.append(f"ethnicity: {request.ethnicity}")
  
SE request.age_range:
  prompt_parts.append(f"age: {request.age_range}")
```

#### 2. MAPEAMENTO DE ESTILOS
```
style_prompts = {
  "professional": "professional business attire, office background, confident pose",
  "casual": "casual clothing, relaxed pose, friendly expression",
  "corporate": "formal business suit, executive style, professional lighting",
  "creative": "creative outfit, artistic background, expressive pose"
}

SE request.style EM style_prompts:
  prompt_parts.append(style_prompts[request.style])
```

#### 3. FINALIZAÇÃO
```
# Qualidade geral
prompt_parts.append("high quality, realistic, professional photography")

RETURN ", ".join(prompt_parts)
```

### SAÍDA
```
OUTPUT: string com prompt otimizado para Nano Banana
```

---

## ALGORITMO: generate_avatar_for_persona()

### ENTRADA
```
INPUT: persona_data (Dict com biografia completa)
```

### PROCESSO

#### 1. EXTRAÇÃO DE DADOS DA PERSONA
```
nome = persona_data.get('nome_completo', '')
idade = persona_data.get('idade', 35)
genero = _extract_gender_from_name(nome)
nacionalidade = persona_data.get('background_cultural', 'brasileira')
cargo = persona_data.get('cargo', 'funcionário')
```

#### 2. CONSTRUÇÃO DA DESCRIÇÃO
```
description = persona_data.get('avatar_description', '')
SE NOT description:
  description = _generate_description_from_persona(persona_data)
```

#### 3. MAPEAMENTO DE CARACTERÍSTICAS
```
ethnicity = _map_nationality_to_ethnicity(nacionalidade)
age_range = _get_age_range(idade)
style = _get_style_for_cargo(cargo)
```

#### 4. CRIAÇÃO E EXECUÇÃO DO REQUEST
```
request = AvatarRequest(
  description: description,
  gender: genero,
  ethnicity: ethnicity,
  age_range: age_range,
  style: style
)

RETURN await generate_avatar(request)
```

### SAÍDA
```
OUTPUT: AvatarResponse com avatar específico para a persona
```

---

## ALGORITMO: _extract_gender_from_name()

### ENTRADA
```
INPUT: nome (string)
```

### PROCESSO

#### 1. ANÁLISE DE TERMINAÇÕES
```
nome_lower = nome.lower()

# Terminações femininas comuns em português
femininas = ['a', 'ana', 'ina', 'ela', 'isa', 'ria']

PARA cada fem EM femininas:
  SE nome_lower.endswith(fem):
    RETURN "female"

RETURN "male"  # Default
```

### SAÍDA
```
OUTPUT: "male" ou "female"
```

---

## ALGORITMO: _map_nationality_to_ethnicity()

### ENTRADA
```
INPUT: nacionalidade (string)
```

### PROCESSO
```
mapping = {
  'brasileira': 'latin',
  'latina': 'latin',
  'americana': 'caucasian',
  'europeia': 'caucasian',
  'asiatica': 'asian',
  'africana': 'african',
  'arabe': 'middle_eastern'
}

RETURN mapping.get(nacionalidade.lower(), 'latin')
```

### SAÍDA
```
OUTPUT: ethnicity string mapeada
```

---

## ALGORITMO: _get_age_range()

### ENTRADA
```
INPUT: idade (int)
```

### PROCESSO
```
SE idade < 25:
  RETURN "young_adult"
SENAO SE idade < 40:
  RETURN "adult"
SENAO SE idade < 55:
  RETURN "middle_aged"
SENAO:
  RETURN "senior"
```

### SAÍDA
```
OUTPUT: faixa etária categorizada
```

---

## ALGORITMO: _get_style_for_cargo()

### ENTRADA
```
INPUT: cargo (string)
```

### PROCESSO
```
cargo_lower = cargo.lower()

SE any(term EM cargo_lower PARA term EM ['ceo', 'diretor', 'gerente', 'executivo']):
  RETURN "corporate"
SENAO SE any(term EM cargo_lower PARA term EM ['designer', 'criativo', 'marketing']):
  RETURN "creative"
SENAO SE any(term EM cargo_lower PARA term EM ['desenvolvedor', 'analista', 'técnico']):
  RETURN "professional"
SENAO:
  RETURN "professional"
```

### SAÍDA
```
OUTPUT: estilo apropriado para o cargo
```

---

## ALGORITMO: _generate_description_from_persona()

### ENTRADA
```
INPUT: persona_data (Dict)
```

### PROCESSO

#### 1. EXTRAÇÃO DE CARACTERÍSTICAS
```
nome = persona_data.get('nome_completo', '')
cargo = persona_data.get('cargo', '')
personalidade = persona_data.get('personalidade', '')

description_parts = []
```

#### 2. CARACTERÍSTICAS PROFISSIONAIS
```
SE 'ceo' EM cargo.lower() OR 'diretor' EM cargo.lower():
  description_parts.append("confident executive appearance")
SENAO SE 'desenvolvedor' EM cargo.lower():
  description_parts.append("tech professional appearance")
```

#### 3. CARACTERÍSTICAS DE PERSONALIDADE
```
SE 'extrovertido' EM personalidade.lower():
  description_parts.append("friendly and approachable expression")
SENAO SE 'analítico' EM personalidade.lower():
  description_parts.append("thoughtful and focused expression")
```

#### 4. FALLBACK
```
SE NOT description_parts:
  description_parts.append("professional business appearance")

RETURN ", ".join(description_parts)
```

### SAÍDA
```
OUTPUT: descrição textual baseada na persona
```

---

## ALGORITMO: AvatarCostTracker

### track_generation()
```
INPUT: response (AvatarResponse)

today = time.strftime('%Y-%m-%d')

SE today NOT IN daily_costs:
  daily_costs[today] = {'cost': 0.0, 'generations': 0}

daily_costs[today]['cost'] += response.cost_usd
daily_costs[today]['generations'] += 1

generation_log.append({
  'timestamp': time.time(),
  'cost': response.cost_usd,
  'generation_time': response.generation_time_ms,
  'success': response.success
})

LOG info(f"Avatar gerado - Custo: ${response.cost_usd:.3f}, Tempo: {response.generation_time_ms}ms")
```

### get_daily_summary()
```
INPUT: date (string optional)

SE NOT date:
  date = time.strftime('%Y-%m-%d')

RETURN daily_costs.get(date, {'cost': 0.0, 'generations': 0})
```

---

## ESTRUTURAS DE DADOS

### AvatarRequest
```
{
  description: string,
  gender: string,
  ethnicity: string,
  age_range: string,
  style: string = "professional",
  size: string = "512x512"
}
```

### AvatarResponse
```
{
  image_url: string_or_null,
  image_base64: string_or_null,
  success: boolean,
  cost_usd: float,
  generation_time_ms: int,
  error: string_or_null
}
```

### AvatarStyle (Enum)
```
PROFESSIONAL = "professional"
CASUAL = "casual"
CORPORATE = "corporate"
CREATIVE = "creative"
```

---

## FUNÇÕES DE CONVENIÊNCIA

### generate_avatar_for_persona()
```
async def generate_avatar_for_persona(persona_data: Dict[str, Any]) -> AvatarResponse:
  return await avatar_client.generate_avatar_for_persona(persona_data)
```

### generate_custom_avatar()
```
async def generate_custom_avatar(description: str, gender: str, ethnicity: str) -> AvatarResponse:
  request = AvatarRequest(
    description: description,
    gender: gender,
    ethnicity: ethnicity,
    age_range: "adult"
  )
  return await avatar_client.generate_avatar(request)
```

### get_avatar_cost_summary()
```
def get_avatar_cost_summary() -> Dict[str, Any]:
  return avatar_client.cost_tracker.get_daily_summary()
```

---

## CARACTERÍSTICAS TÉCNICAS

### INTEGRAÇÃO NANO BANANA
- **API Placeholder**: Sistema preparado para integração futura
- **Simulação realista**: Fallback com placeholders durante desenvolvimento
- **Formato flexível**: Suporte a URL e base64
- **Qualidade configurável**: Parâmetros de qualidade ajustáveis

### PERSONALIZAÇÃO AUTOMÁTICA
- **Análise de gênero**: Extração automática do nome
- **Mapeamento étnico**: Conversão nacionalidade → ethnicity
- **Estilo por cargo**: Automática baseada no cargo
- **Descrição inteligente**: Geração a partir da biografia

### CONTROLE DE CUSTOS
- **Tracking granular**: Por avatar gerado
- **Métricas de performance**: Tempo de geração
- **Resumos diários**: Análise de uso
- **Log detalhado**: Auditoria completa

### FALLBACK ROBUSTO
- **Placeholder inteligente**: Baseado em hash do conteúdo
- **Métricas simuladas**: Custos e tempos realistas
- **Error handling**: Captura e relatório de erros
- **Desenvolvimento offline**: Funciona sem API key

### ESCALABILIDADE
- **Sessões assíncronas**: Para múltiplas gerações
- **Rate limiting**: Preparado para limitações da API
- **Batch processing**: Suporte a gerações em lote
- **Caching potencial**: Estrutura para cache futuro

### MAPEAMENTOS INTELIGENTES

#### Nacionalidade → Ethnicity
```
brasileira/latina → latin
americana/europeia → caucasian
asiatica → asian
africana → african
arabe → middle_eastern
```

#### Idade → Faixa Etária
```
< 25 → young_adult
25-39 → adult
40-54 → middle_aged
55+ → senior
```

#### Cargo → Estilo
```
CEO/Diretor/Executivo → corporate
Designer/Criativo/Marketing → creative
Desenvolvedor/Analista/Técnico → professional
Outros → professional
```

### QUALIDADE E REALISMO
- **Prompts otimizados** para Nano Banana
- **Características demográficas** preservadas
- **Estilo profissional** consistente
- **Background contextual** apropriado