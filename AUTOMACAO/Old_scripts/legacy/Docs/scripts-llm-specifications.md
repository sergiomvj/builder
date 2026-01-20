# 📋 VCM - Especificações Técnicas dos Scripts LLM

## 🎯 Script 1: Gerador de Biografias com LLM

### Parâmetros de Entrada
```json
{
  "empresa": {
    "nome": "TechCorp Solutions",
    "industria": "tecnologia",
    "setor": "desenvolvimento de software",
    "tamanho": "50-200 funcionários",
    "localizacao": "Brasil, São Paulo",
    "cultura": "inovadora, colaborativa, data-driven"
  },
  "configuracao": {
    "total_personas": 16,
    "distribuicao": {
      "ceo": 1,
      "executivos": 4,
      "especialistas": 6,
      "assistentes": 5
    },
    "diversidade": {
      "genero": "equilibrado",
      "idade": "25-55 anos",
      "nacionalidades": ["brasileira", "argentina", "mexicana"],
      "linguas": ["português", "inglês", "espanhol"]
    }
  }
}
```

### Templates de Prompt

#### CEO Biography Prompt
```
Contexto: Você é um especialista em recursos humanos criando biografias realistas.

Tarefa: Gere uma biografia completa para um CEO de uma empresa de [industria] no [pais].

Empresa: [nome_empresa]
- Setor: [setor_especifico]  
- Tamanho: [tamanho_funcionarios]
- Cultura: [cultura_organizacional]

Requisitos da biografia:
1. Nome completo realista para [nacionalidade]
2. Idade entre 35-50 anos
3. Formação executiva de elite (MBA, universidades reconhecidas)
4. Trajetória profissional progressiva (min 15 anos)
5. Experiência internacional (min 2 países)
6. Especialização relevante ao setor
7. Idiomas (min 3, incluindo inglês)
8. Conquistas mensuráveis
9. Estilo de liderança definido

Formato de output:
```json
{
  "nome_completo": "",
  "idade": 0,
  "nacionalidade": "",
  "formacao": "",
  "experiencia_anos": 0,
  "especializacao": "",
  "idiomas": [],
  "conquistas": [],
  "estilo_lideranca": "",
  "biografia_completa": "# Nome\n\n## Biografia...",
  "linkedin_summary": ""
}
```

Importante: Base-se em perfis reais de CEOs do LinkedIn, mas crie uma pessoa fictícia única.
```

#### Especialista Biography Prompt
```
Contexto: Gere biografia para especialista em [area_especializacao] 

Empresa: [nome_empresa] - [industria]
Cargo: [titulo_cargo]
Área: [departamento]

Perfil desejado:
- Gênero: [genero]
- Idade: 28-40 anos
- Nacionalidade: [nacionalidade]
- Nível: Senior/Pleno

Competências core necessárias:
[lista_competencias_especificas]

Ferramentas que deve dominar:
[lista_ferramentas_tecnologias]

Requisitos:
1. Nome realista para [nacionalidade]
2. Formação específica da área
3. Certificações relevantes
4. Experiência 5-12 anos
5. Projetos demonstráveis
6. Especialização técnica profunda
7. Soft skills para colaboração

Output JSON format:
{
  "area_especializacao": "",
  "nivel_senioridade": "",
  "certificacoes": [],
  "projetos_relevantes": [],
  "tecnologias_dominadas": [],
  "soft_skills": []
}
```

### Validação de Qualidade

#### Quality Validation Prompt
```
Analise esta biografia gerada por IA e avalie:

Biografia: [biografia_gerada]

Critérios de avaliação (0-10):
1. Realismo: Parece uma pessoa real?
2. Coerência: Trajetória profissional faz sentido?
3. Especificidade: Detalhes suficientes e relevantes?
4. Diversidade: Evita clichês e estereótipos?
5. Adequação: Fit com empresa e cargo?

Para cada critério, explique a nota e sugira melhorias.

Output:
{
  "scores": {
    "realismo": 0,
    "coerencia": 0,
    "especificidade": 0,
    "diversidade": 0,
    "adequacao": 0
  },
  "score_total": 0,
  "aprovado": boolean,
  "sugestoes_melhoria": []
}
```

---

## 🎯 Script 2: Extração de Competências LLM

### Competency Extraction Prompt
```
Analise esta biografia e extraia competências técnicas e comportamentais:

Biografia: [biografia_completa]
Cargo: [cargo_atual]
Empresa: [nome_empresa] - [industria]

Extraia:

1. COMPETÊNCIAS TÉCNICAS
   - Ferramentas/Software (com nível 1-5)
   - Linguagens/Frameworks
   - Metodologias
   - Certificações
   - Conhecimentos específicos

2. COMPETÊNCIAS COMPORTAMENTAIS  
   - Liderança
   - Comunicação
   - Resolução de problemas
   - Adaptabilidade
   - Trabalho em equipe
   - Gestão de tempo
   - Pensamento crítico

3. EVIDÊNCIAS
   Para cada competência, cite a evidência da biografia

4. GAPS IDENTIFICADOS
   Competências que seriam esperadas mas não foram mencionadas

Formato JSON:
{
  "tecnicas": [
    {
      "nome": "",
      "categoria": "",
      "nivel": 1-5,
      "evidencia": "",
      "anos_experiencia": 0
    }
  ],
  "comportamentais": [
    {
      "nome": "",
      "nivel": 1-5,
      "evidencia": "",
      "contexto_aplicacao": ""
    }
  ],
  "gaps_identificados": [],
  "competencias_emergentes": []
}
```

### Cross-Validation Prompt
```
Valide consistência entre competências extraídas:

Pessoa: [nome] - [cargo]
Competências extraídas: [competencias_json]

Verificações:
1. Níveis coerentes com experiência?
2. Competências técnicas atualizadas?
3. Soft skills adequadas ao cargo?
4. Faltam competências críticas?
5. Há competências irrelevantes?

Sugira ajustes para melhor adequação ao cargo e empresa.
```

---

## 🎯 Script 3: Tech Specs LLM

### Technology Stack Prompt
```
Defina stack tecnológico para:

Pessoa: [nome] - [cargo]
Competências: [competencias_tecnicas]
Empresa: [empresa] - [industria]
Orçamento: [faixa_orcamentaria]

Especifique:

1. SOFTWARE NECESSÁRIO
   - Licenças individuais
   - Ferramentas gratuitas
   - Plataformas SaaS
   - Versões específicas

2. HARDWARE REQUERIDO
   - Especificações mínimas
   - Especificações recomendadas
   - Periféricos necessários

3. ACESSO E PERMISSÕES
   - Sistemas internos
   - APIs externas
   - Níveis de acesso
   - Políticas de segurança

4. INTEGRAÇÕES
   - Com outros departamentos
   - Ferramentas de comunicação
   - Sistemas de gestão

Output JSON:
{
  "software": [
    {
      "nome": "",
      "categoria": "",
      "licenca": "",
      "custo_mensal": 0,
      "justificativa": "",
      "alternativas": []
    }
  ],
  "hardware": {
    "minimo": {},
    "recomendado": {},
    "custo_estimado": 0
  },
  "acessos": [],
  "integracoes": []
}
```

---

## 🎯 Script 4: RAG Knowledge Base LLM

### Knowledge Generation Prompt
```
Crie base de conhecimento para:

Função: [cargo] 
Competências: [competencias]
Tech Stack: [tecnologias]
Empresa: [contexto_empresa]

Gere conteúdo estruturado:

1. PROCEDIMENTOS OPERACIONAIS
   - Rotinas diárias
   - Protocolos específicos
   - Checklists

2. GUIAS TÉCNICOS
   - Setup de ferramentas
   - Troubleshooting comum
   - Best practices

3. CONHECIMENTO CONTEXTUAL
   - Políticas da empresa
   - Processos interdepartamentais
   - Padrões de qualidade

4. RECURSOS DE APRENDIZADO
   - Documentação essencial
   - Cursos recomendados
   - Comunidades relevantes

Formato para vetorização:
{
  "documentos": [
    {
      "titulo": "",
      "categoria": "",
      "conteudo": "",
      "tags": [],
      "relevancia": 1-10,
      "dependencias": []
    }
  ]
}
```

---

## 🎯 Script 5: Workflows LLM

### Workflow Generation Prompt
```
Crie workflows para:

Pessoa: [nome] - [cargo]
Competências: [competencias]
Knowledge Base: [rag_summary]
Objetivos: [objetivos_funcao]

Gere:

1. WORKFLOWS INDIVIDUAIS
   - Processos diários
   - Tarefas recorrentes  
   - Responsabilidades específicas

2. WORKFLOWS COLABORATIVOS
   - Interações com equipe
   - Aprovações necessárias
   - Handoffs entre departamentos

3. AUTOMAÇÕES POSSÍVEIS
   - Tasks repetitivas
   - Notificações automáticas
   - Integração de sistemas

4. MÉTRICAS E KPIS
   - Indicadores de performance
   - Pontos de medição
   - Relatórios necessários

Output N8N-ready:
{
  "workflows": [
    {
      "nome": "",
      "descricao": "",
      "trigger": "",
      "steps": [],
      "outputs": [],
      "metrics": []
    }
  ]
}
```

---

## 🎯 Script 6: Auditoria LLM

### Objective Breakdown Prompt
```
Usuário definiu objetivos da empresa:
"[objetivos_usuario_input]"

Empresa: [nome_empresa] - [industria]
Estrutura: [organograma]

Subdivida objetivos por função:

1. ANÁLISE DOS OBJETIVOS
   - Clareza e especificidade
   - Viabilidade e prazo
   - Interdependências

2. DECOMPOSIÇÃO POR FUNÇÃO
   Para cada cargo, defina:
   - Contribuição específica
   - KPIs mensuráveis
   - Entregáveis concretos
   - Prazos realistas

3. MATRIZ DE DEPENDÊNCIAS
   - Quem depende de quem
   - Recursos compartilhados
   - Gargalos potenciais

Output:
{
  "objetivos_por_funcao": {
    "ceo": [],
    "marketing": [],
    "vendas": [],
    etc...
  },
  "matriz_dependencias": [],
  "cronograma": [],
  "riscos_identificados": []
}
```

### Alignment Audit Prompt
```
Analise alinhamento entre:

OBJETIVOS: [objetivos_decompostos]
COMPETÊNCIAS: [todas_competencias]  
WORKFLOWS: [todos_workflows]

Empresa: [contexto_empresa]

Identifique:

1. GAPS DE COMPETÊNCIAS
   - Competências ausentes para objetivos
   - Níveis insuficientes
   - Necessidades de treinamento

2. GAPS DE PROCESSOS
   - Workflows inexistentes
   - Processos inadequados
   - Gargalos operacionais

3. DESALINHAMENTOS
   - Objetivos conflitantes
   - Recursos mal alocados
   - Responsabilidades ambíguas

4. OPORTUNIDADES
   - Automações possíveis
   - Eficiências a ganhar
   - Sinergias não exploradas

Score de alinhamento: 0-100
Plano de ação priorizado.
```

---

## 🔧 Configurações Técnicas

### LLM Settings
```yaml
openai:
  model: "gpt-4-turbo"
  temperature: 0.7
  max_tokens: 4000
  top_p: 0.9

anthropic:
  model: "claude-3-opus"
  temperature: 0.7
  max_tokens: 4000

fallback_strategy:
  - primary: openai
  - secondary: anthropic
  - retry_attempts: 3
  - timeout: 60s
```

### Quality Thresholds
```yaml
quality_gates:
  biografia_score_minimo: 7.5
  competencias_cobertura: 85%
  workflow_completeness: 90%
  alinhamento_score: 80%
```

---

*Especificações técnicas v2.0.0 - LLM Integration*