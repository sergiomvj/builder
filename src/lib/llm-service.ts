import OpenAI from 'openai';
import { getSupabase } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

export type LLMProvider = 'openrouter' | 'openai';

export interface LLMRequestConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
  responseFormat?: any; // Allow explicit response format (e.g. json_schema)
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Builder MVP';

// Default configuration - will be overridden by database config
let DEFAULT_PROVIDER: LLMProvider = 'openai';
let DEFAULT_MODEL = 'gpt-4o';
const FALLBACK_MODELS = [
  'gpt-4o-mini',
  'gpt-3.5-turbo'
];

export class LLMService {
  private openRouterClient: OpenAI | null = null;
  private openAIClient: OpenAI | null = null;
  private configLoaded = false;

  constructor() {
    if (OPENROUTER_API_KEY) {
      this.openRouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
        },
      });
    }

    if (OPENAI_API_KEY) {
      this.openAIClient = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }
  }

  /**
   * Load configuration from database
   */
  private async loadConfig() {
    if (this.configLoaded) return;

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value')
        .in('key', ['llm_provider', 'llm_model']);

      if (!error && data) {
        data.forEach((config: any) => {
          if (config.key === 'llm_provider') {
            DEFAULT_PROVIDER = config.value as LLMProvider;
          } else if (config.key === 'llm_model') {
            DEFAULT_MODEL = config.value;
          }
        });
      }

      this.configLoaded = true;
    } catch (e) {
      console.warn('Failed to load config from database, using defaults', e);
    }
  }

  /**
   * Load custom prompt from markdown file or database
   */
  private async loadPrompt(fileKey: string, defaultPrompt: string): Promise<string> {
    try {
      // Map file keys (kebab-case) to DB keys (snake_case)
      const keyMapping: Record<string, string> = {
        'genesis-analysis': 'genesis_prompt',
        'team-generation': 'team_prompt',
        'workflow-generation': 'workflow_prompt'
      };

      const dbKey = keyMapping[fileKey] || fileKey;

      // First, try to load from database
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', dbKey)
        .single();

      if (!error && data && data.value && data.value.trim() !== '') {
        // If value is a JSON string (sometimes happens with JSONB), parse it if needed
        // But here we expect a raw string for the prompt
        let promptContent = data.value;
        // Clean up if it was saved as a JSON string quote-wrapped
        if (promptContent.startsWith('"') && promptContent.endsWith('"')) {
          try { promptContent = JSON.parse(promptContent); } catch { }
        }
        return promptContent;
      }

      // If not in database, try to load from file
      const promptPath = path.join(process.cwd(), 'prompts', `${fileKey}.md`);
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, 'utf-8');
      }
    } catch (e) {
      console.warn(`Failed to load custom prompt for ${fileKey}, using default`, e);
    }

    return defaultPrompt;
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logs LLM interaction to database for deeper observability
   */
  private async logLLMInteraction(
    promptType: string,
    fullPrompt: string,
    response: any,
    expectedKeys: string[],
    projectId?: string
  ) {
    try {
      const supabase = getSupabase();

      // Calculate missing keys
      const getByPath = (obj: any, path: string) => {
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
      };

      const missingKeys = expectedKeys.filter(k => {
        const val = getByPath(response, k);
        // Strict validation: missing if undefined, null, empty string, empty array, or empty object
        if (val === undefined || val === null) return true;
        if (typeof val === 'string' && val.trim() === '') return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === 'object' && Object.keys(val).length === 0) return true;
        return false;
      });

      const status = missingKeys.length === 0 ? 'success' : 'partial_failure';

      await supabase.from('llm_logs').insert({
        project_id: projectId,
        prompt_type: promptType,
        full_prompt_sent: fullPrompt,
        llm_response: response,
        expected_deliverables: expectedKeys,
        missing_deliverables: missingKeys,
        status: status
      });

      if (missingKeys.length > 0) {
        console.warn(`[LLM Validation] Missing keys for ${promptType}:`, missingKeys);
      }
    } catch (e) {
      // Fail silently so we don't block the user flow if logging fails (e.g. table missing)
      console.warn('[LLM Logging] Failed to log interaction:', e);
    }
  }

  /**
   * Generates a completion using the specified or default LLM configuration.
   */
  async generateCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    config: LLMRequestConfig = {}
  ): Promise<string | null> {
    // Load configuration from database
    await this.loadConfig();

    const provider = config.provider || DEFAULT_PROVIDER;
    let model = config.model || DEFAULT_MODEL;
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens;
    // Use explicit responseFormat if provided, otherwise fallback to jsonMode
    const responseFormat = config.responseFormat || (config.jsonMode ? { type: 'json_object' as const } : undefined);

    try {
      let client: OpenAI | null = null;

      if (provider === 'openrouter') {
        if (!this.openRouterClient) throw new Error('OpenRouter API Key not configured');
        client = this.openRouterClient;
      } else if (provider === 'openai') {
        if (!this.openAIClient) throw new Error('OpenAI API Key not configured');
        client = this.openAIClient;
      } else {
        throw new Error(`Invalid provider: ${provider}`);
      }

      console.log(`[LLM] Requesting completion from ${provider}/${model}`);
      // Log messages for debugging (truncate long content)
      console.log(`[LLM] System Prompt: ${messages.find(m => m.role === 'system')?.content?.slice(0, 100)}...`);

      try {
        const response = await client.chat.completions.create({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          response_format: responseFormat,
        });

        const content = response.choices[0]?.message?.content || null;
        console.log(`[LLM] Response received (${content?.length || 0} chars)`);
        // console.log(`[LLM] Raw Response: ${content?.slice(0, 500)}...`); // Uncomment for deep debugging
        return content;
      } catch (primaryError: any) {
        // Fallback logic for errors (429 Rate Limit, 503 Service Unavailable, 500 Server Error)
        if (primaryError.status === 429 || primaryError.status >= 500) {
          console.warn(`Primary model ${model} failed with ${primaryError.status}. Attempting fallbacks...`);

          for (const fallbackModel of FALLBACK_MODELS) {
            console.log(`Trying fallback model: ${fallbackModel}`);
            await this.sleep(1000); // Wait 1s before retry

            try {
              const response = await client.chat.completions.create({
                model: fallbackModel,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens,
                response_format: responseFormat,
              });
              return response.choices[0]?.message?.content || null;
            } catch (fallbackError: any) {
              console.warn(`Fallback model ${fallbackModel} failed: ${fallbackError.message}`);
              // Continue to next fallback
            }
          }

          throw primaryError; // Throw original error if all fallbacks fail
        }
        throw primaryError;
      }

    } catch (error) {
      console.error(`LLM Generation Error (${provider}/${model}):`, error);
      throw error;
    }
  }

  /**
        },
        "key_metrics": ["North Star Metric", "Counter Metric", "Growth Metric"],
        "risks_and_gaps": ["Risco fatal 1", "Gap de competência 1"],
        "improvement_suggestions": ["Ação concreta para elevar o Score 1", "Ação concreta 2"]
      }

      IMPORTANTE:
      - Seja profundo, crítico e tático.
      - NÃO seja genérico. Use a terminologia do setor da ideia.
      - Liste Módulos SISTÊMICOS exaustivos.
      - Detalhe o Roadmap com AÇÕES OBJETIVAS E IMPERATIVAS (Nada de "fazer setup", use "Configurar X no Y").
      - Tudo em Português do Brasil.
    `;

    const userMessage = `
      Analise o projeto a seguir com profundidade extrema:
      "${ideaDescription}"
      
      Siga rigorosamente a estrutura JSON solicitada.
    `;

    try {
      const result = await this.generateCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        {
          ...config,
          jsonMode: true, // Force JSON mode
        }
      );

      if (!result) throw new Error('Failed to generate analysis');

      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsedAndValidated = JSON.parse(cleanedResult);

      // Log and Validate
      const expectedKeys = [
        'project_name', 'tagline', 'executive_summary', 'viability_score', 
        'business_diagnosis', 'why_now', 'why_not_100', 'potential_improvements', 
        'execution_plan', 'marketing_strategy', 'lead_generation_strategy', 
        'key_metrics', 'risks', 'swot'
      ];
      
      // Allow passing project ID if we had it, but usually we generate ID after analysis. 
      // So we log without ID or update later. For now, log without ID.
      await this.logLLMInteraction(
        'genesis', 
        JSON.stringify(messages), 
        parsedAndValidated, 
        expectedKeys
      );

      return parsedAndValidated;
    } catch (e) {
      console.error("Failed to parse LLM JSON response or LLM failed.", e);
      throw e; // Propagate error instead of returning mock data
    }
  }

  /**
   * Generates a virtual team structure based on project strategy
   */
  async generateTeamStructure(projectContext: any, config: LLMRequestConfig = {}) {
    const defaultPrompt = `
# Prompt de Geração de Equipe - HR Strategist

## IDENTIDADE
Você é um **HR Strategist de Elite** e **Organizational Designer** especializado em montar equipes de alto desempenho para startups e empresas inovadoras.

## MISSÃO
Criar uma equipe virtual de **5 a 7 personas C-Level/Heads** perfeitamente alinhadas com a missão, visão e objetivos do projeto.

## ESTRUTURA OBRIGATÓRIA DO JSON
{
  "team": [
    {
      "role": "Cargo (ex: CEO, CTO, CMO, CFO, CPO)",
      "name": "Nome Completo Criativo e Realista",
      "description": "Descrição detalhada do papel e foco principal (2-3 frases)",
      "seniority": "C-Level / Head / Lead",
      "skills": [
        { "name": "Habilidade Técnica 1", "type": "hard", "level": "expert" },
        { "name": "Habilidade Comportamental 1", "type": "soft", "level": "expert" }
      ],
      "responsibilities": ["Responsabilidade Estratégica 1", "Responsabilidade Operacional 1"],
      "kpis": ["KPI Mensurável 1", "KPI Mensurável 2"],
      "tools": ["Ferramenta Específica 1", "Ferramenta Específica 2"],
      "personality_traits": ["Traço 1", "Traço 2"],
      "languages": ["Idioma Nativo", "Inglês - Fluente", "Espanhol - Avançado"],
      "background": "Background profissional resumido",
      "why_this_role": "Por que esta pessoa é essencial"
    }
  ]
}

IMPORTANTE: Responda APENAS em Português do Brasil. Retorne APENAS JSON válido, sem markdown.
`;

    // Load custom prompt from database or file
    const systemPrompt = config.systemPrompt || await this.loadPrompt('team-generation', defaultPrompt);

    const userMessage = `
      Project Name: ${projectContext.name}
      Mission: ${projectContext.mission}
      Objectives: ${projectContext.objectives?.join(', ')}
      Target Audience: ${projectContext.target_audience}
      Core Strategy: ${projectContext.pain_points?.join(', ')}
      
      Create a high-performance team to execute this vision.
      Responda APENAS em Português do Brasil.
    `;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    try {
      const result = await this.generateCompletion(
        messages,
        {
          ...config,
          jsonMode: true,
        }
      );

      if (!result) throw new Error('Failed to generate team structure');

      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResult);

      // Log and Validate
      await this.logLLMInteraction(
        'team_generation',
        JSON.stringify(messages),
        parsed,
        ['team']
      );

      return parsed;
    } catch (e) {
      console.error("Failed to generate or parse team structure.", e);
      throw e; // Propagate error instead of returning mock data
    }
  }

  /**
   * Generates N8N automation opportunities
   */
  async generateWorkflowSuggestions(projectContext: any, teamContext: any[], config: LLMRequestConfig = {}) {
    const defaultPrompt = `
# Prompt de Geração de Workflows - Automation Architect

## IDENTIDADE
Você é um **Automation Architect de Elite** especializado em **N8N** e automação de processos empresariais.

## MISSÃO
Analisar a estratégia da empresa e a equipe virtual para identificar os **workflows de automação mais impactantes** (mínimo 5, máximo 10).

## ESTRUTURA OBRIGATÓRIA DO JSON
{
  "workflows": [
    {
      "title": "Título Descritivo do Workflow",
      "description": "Descrição detalhada: O QUE faz, POR QUE é importante, QUAL problema resolve",
      "trigger_type": "webhook | schedule | email | manual | database | form_submission",
      "trigger_details": "Detalhes específicos do gatilho",
      "actions": [
        {
          "step": 1,
          "action": "Ação Específica",
          "tool": "Ferramenta/Serviço",
          "details": "Detalhes da ação"
        }
      ],
      "assigned_persona_role": "Cargo do responsável",
      "complexity": "low | medium | high",
      "estimated_time_saved": "Tempo economizado",
      "roi_impact": "Impacto no ROI",
      "priority": "critical | high | medium | low",
      "dependencies": ["Dependência 1"],
      "success_metrics": ["Métrica de Sucesso 1"]
    }
  ]
}

IMPORTANTE: Responda APENAS em Português do Brasil. Retorne APENAS JSON válido, sem markdown.
Gere entre 5 e 10 workflows baseado nas tarefas da equipe.
`;

    // Load custom prompt from database or file
    const systemPrompt = config.systemPrompt || await this.loadPrompt('workflow-generation', defaultPrompt);

    const userMessage = `
      Project: ${projectContext.name}
      Mission: ${projectContext.mission}
      
      Team Members:
      ${teamContext.map(m => `- ${m.nome} (${m.cargo}): ${m.descricao_funcao}`).join('\n')}
      
      Responda APENAS em Português do Brasil.
    `;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    try {
      const result = await this.generateCompletion(
        messages,
        {
          ...config,
          jsonMode: true,
        }
      );

      if (!result) throw new Error('Failed to generate workflows');

      // Clean up potential markdown formatting (```json ... ```)
      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResult);

      // Log and Validate
      await this.logLLMInteraction(
        'workflow_generation',
        JSON.stringify(messages),
        parsed,
        ['workflows']
      );

      return parsed;
    } catch (e) {
      console.error("Failed to generate or parse workflows.", e);
      throw e; // Propagate error instead of returning mock data
    }
  }

  /**
   * Analyze a business idea and return structured report
   */
  async analyzeIdea(ideaDescription: string, config: LLMRequestConfig = {}) {
    const defaultPrompt = `
# IDENTIDADE
Você é uma Consultoria Estratégica de Elite especializada em análise de viabilidade empresarial.

# ESTRUTURA OBRIGATÓRIA DO JSON

Retorne APENAS um JSON válido com EXATAMENTE esta estrutura:

{
  "project_name": "Nome do Projeto",
  "tagline": "Slogan em uma linha",
  
  "executive_summary": {
    "content": "Resumo executivo estratégico em 3-4 parágrafos explicando: 1) O problema, 2) A solução, 3) O mercado, 4) A oportunidade"
  },
  
  "viability_score": {
    "total": 75,
    "breakdown": {
      "market_pain": {
        "score": 20,
        "rationale": "Justificativa detalhada"
      },
      "technical_feasibility": {
        "score": 18,
        "rationale": "Justificativa detalhada"
      },
      "revenue_potential": {
        "score": 19,
        "rationale": "Justificativa detalhada"
      },
      "competitive_landscape": {
        "score": 18,
        "rationale": "Justificativa detalhada"
      }
    }
  },
  
  "business_diagnosis": {
    "content": "Diagnóstico completo do negócio em 2-3 parágrafos"
  },
  
  "why_now": {
    "content": "Por que este é o momento certo (1-2 parágrafos)"
  },
  
  "why_not_100": {
    "summary": "Por que não alcançou 100/100 (2-3 frases)",
    "critical_gaps": [
      {
        "gap": "Gap crítico 1",
        "impact_on_score": "-5 pontos",
        "pillar_affected": "Competitive Landscape",
        "severity": "High",
        "mitigation_path": "Como melhorar"
      }
    ]
  },
  
  "potential_improvements": {
    "content": "3-5 melhorias potenciais em parágrafos"
  },
  
  "marketing_strategy": {
    "value_proposition": {
      "content": "Proposta de valor única (1-2 parágrafos)"
    },
    "target_audience": {
      "primary": "Público-alvo primário detalhado",
      "secondary": "Público-alvo secundário"
    },
    "approach_strategy": {
      "content": "Estratégia de abordagem (2-3 parágrafos)"
    },
    "channels": [
      {
        "name": "LinkedIn",
        "description": "Como usar este canal",
        "priority": "High"
      }
    ],
    "tactics": [
      {
        "tactic": "Content Marketing",
        "description": "Descrição da tática",
        "timeline": "Curto prazo"
      }
    ]
  },
  
  "lead_generation_strategy": {
    "lead_magnets": [
      {
        "name": "E-book Gratuito",
        "description": "Descrição do lead magnet",
        "target": "Público-alvo específico"
      }
    ],
    "conversion_tactics": [
      {
        "tactic": "Landing Page Otimizada",
        "description": "Descrição da tática",
        "expected_rate": "5-10%"
      }
    ]
  },
  
  "key_metrics": {
    "content": "Métricas-chave: CAC, LTV, Churn, MRR (em parágrafos)"
  },
  
  "risks": {
    "content": "Riscos e mitigação (2-3 parágrafos)"
  },
  
  "swot": {
    "strengths": [
      "Força 1: Descrição",
      "Força 2: Descrição"
    ],
    "weaknesses": [
      "Fraqueza 1: Descrição",
      "Fraqueza 2: Descrição"
    ],
    "opportunities": [
      "Oportunidade 1: Descrição",
      "Oportunidade 2: Descrição"
    ],
    "threats": [
      "Ameaça 1: Descrição",
      "Ameaça 2: Descrição"
    ]
  },
  
  "project_genesis": {
    "content": "História da gênese do projeto (2-3 parágrafos)"
  }
}

# CRITÉRIOS DE AVALIAÇÃO DE VIABILIDADE (VCM SCORE 0-100)

Avalie **severamente** usando estes 4 pilares para compor a nota final:

## 1. Dor de Mercado (0-25 pontos)
- **Alta (20-25)**: Urgente/Crítico - Problema que causa dor imediata e significativa
- **Média (10-19)**: Real mas contornável - Problema existe mas há workarounds
- **Baixa (0-9)**: Nice to have - Conveniência, não necessidade

## 2. Viabilidade Técnica (0-25 pontos)
- **Alta (20-25)**: Tecnologia madura - Implementável com stack atual
- **Média (10-19)**: Complexo - Requer expertise especializada mas é viável
- **Baixa (0-9)**: P&D/Inviável - Requer pesquisa ou tecnologia inexistente

## 3. Potencial de Receita (0-25 pontos)
- **Alta (20-25)**: Escalável/LTV alto - Modelo recorrente, margens saudáveis
- **Média (10-19)**: Margens apertadas - Receita possível mas competitiva
- **Baixa (0-9)**: Incerto - Modelo de monetização não claro

## 4. Cenário Competitivo (0-25 pontos)
- **Alta (20-25)**: Oceano Azul/Nicho - Pouca ou nenhuma competição direta
- **Média (10-19)**: Diferenciação possível - Mercado existente com espaço para inovação
- **Baixa (0-9)**: Saturado/Oceano Vermelho - Mercado commoditizado

**IMPORTANTE**: Seja CRÍTICO. Notas altas exigem evidências concretas de inovação e oportunidade real.

IMPORTANTE: Retorne APENAS JSON válido, sem markdown, sem explicações.
`;

    // Load custom prompt from database or file
    const rawSystemPrompt = config.systemPrompt || await this.loadPrompt('genesis-analysis', defaultPrompt);

    // Remove the explicit "Format Output" section to avoid conflict with Structured Outputs (JSON Schema)
    // The Schema itself guides the structure, the prompt should focus on instructions/context.
    const systemPrompt = rawSystemPrompt.split('## 3. FORMATO DE SAÍDA')[0].trim();

    const userMessage = `Analise esta ideia de negócio:\n\n${ideaDescription}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    // DEFINING STRICT JSON SCHEMA FOR GENESIS ANALYSIS
    const genesisSchema = {
      name: "genesis_analysis_output",
      strict: true,
      schema: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Nome sugerido do projeto." },
          tagline: { type: "string", description: "Slogan curto e impactante." },
          executive_summary: {
            type: "object",
            properties: { content: { type: "string", description: "Sintetize a ideia em 3-4 parágrafos. Cubra: O Problema, A Solução, O Mercado e A Oportunidade (Q1)." } },
            required: ["content"],
            additionalProperties: false
          },
          viability_score: {
            type: "object",
            properties: {
              total: { type: "number", description: "Nota total de 0 a 100." },
              breakdown: {
                type: "object",
                properties: {
                  market_pain: { type: "object", properties: { score: { type: "number" }, rationale: { type: "string", description: "A dor é aguda e frequente? (0-25)" } }, required: ["score", "rationale"], additionalProperties: false },
                  technical_feasibility: { type: "object", properties: { score: { type: "number" }, rationale: { type: "string", description: "É possível construir? (0-25)" } }, required: ["score", "rationale"], additionalProperties: false },
                  revenue_potential: { type: "object", properties: { score: { type: "number" }, rationale: { type: "string", description: "Existe dinheiro? (0-25)" } }, required: ["score", "rationale"], additionalProperties: false },
                  competitive_landscape: { type: "object", properties: { score: { type: "number" }, rationale: { type: "string", description: "Oceano azul? (0-25)" } }, required: ["score", "rationale"], additionalProperties: false }
                },
                required: ["market_pain", "technical_feasibility", "revenue_potential", "competitive_landscape"],
                additionalProperties: false
              }
            },
            required: ["total", "breakdown"],
            additionalProperties: false
          },
          business_diagnosis: {
            type: "object",
            properties: { content: { type: "string", description: "Veredito claro ('Go/No-Go')." } },
            required: ["content"],
            additionalProperties: false
          },
          why_now: {
            type: "object",
            properties: { content: { type: "string", description: "Por que agora? (Tecnologia, Cultura, Lei)." } },
            required: ["content"],
            additionalProperties: false
          },
          why_not_100: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Explicação curta do porquê não foi 100." },
              critical_gaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    gap: { type: "string", description: "Descrição do gap." },
                    impact_on_score: { type: "string", description: "Impacto negativo na nota (ex: -5)." },
                    mitigation_path: { type: "string", description: "Como resolver." }
                  },
                  required: ["gap", "impact_on_score", "mitigation_path"],
                  additionalProperties: false
                }
              }
            },
            required: ["summary", "critical_gaps"],
            additionalProperties: false
          },
          execution_plan: {
            type: "object",
            properties: {
              systems_breakdown: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, tech_stack: { type: "string" } }, required: ["name", "description", "tech_stack"], additionalProperties: false }, description: "Lista de módulos técnicos necessários." },
              roadmap: { type: "array", items: { type: "object", properties: { phase: { type: "string", description: "Mês 1, 3, 6" }, goal: { type: "string" }, actions: { type: "array", items: { type: "string" } } }, required: ["phase", "goal", "actions"], additionalProperties: false }, description: "O que construir." },
              backlog_preview: { type: "array", items: { type: "string" }, description: "Histórias de usuário iniciais." }
            },
            required: ["systems_breakdown", "roadmap", "backlog_preview"],
            additionalProperties: false
          },
          marketing_strategy: {
            type: "object",
            properties: {
              value_proposition: { type: "object", properties: { content: { type: "string", description: "O que torna único?" } }, required: ["content"], additionalProperties: false },
              target_audience: { type: "object", properties: { primary: { type: "string" }, secondary: { type: "string" } }, required: ["primary", "secondary"], additionalProperties: false },
              approach_strategy: { type: "object", properties: { content: { type: "string" } }, required: ["content"], additionalProperties: false },
              channels: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, priority: { type: "string" } }, required: ["name", "description", "priority"], additionalProperties: false }, description: "Onde estão?" },
              tactics: { type: "array", items: { type: "object", properties: { tactic: { type: "string" }, description: { type: "string" }, timeline: { type: "string" } }, required: ["tactic", "description", "timeline"], additionalProperties: false }, description: "O que fazer?" }
            },
            required: ["value_proposition", "target_audience", "approach_strategy", "channels", "tactics"],
            additionalProperties: false
          },
          lead_generation_strategy: {
            type: "object",
            properties: {
              lead_magnets: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"], additionalProperties: false }, description: "O que dar de graça?" },
              conversion_tactics: { type: "array", items: { type: "object", properties: { tactic: { type: "string" }, description: { type: "string" } }, required: ["tactic", "description"], additionalProperties: false }, description: "Como fechar?" }
            },
            required: ["lead_magnets", "conversion_tactics"],
            additionalProperties: false
          },
          key_metrics: {
            type: "object",
            properties: { content: { type: "string", description: "Lista de KPIs importantes." } },
            required: ["content"],
            additionalProperties: false
          },
          risks: {
            type: "object",
            properties: { content: { type: "string", description: "Riscos principais e como mitigar." } },
            required: ["content"],
            additionalProperties: false
          },
          swot: {
            type: "object",
            properties: {
              strengths: { type: "array", items: { type: "string" }, description: "Forças" },
              weaknesses: { type: "array", items: { type: "string" }, description: "Fraquezas" },
              opportunities: { type: "array", items: { type: "string" }, description: "Oportunidades" },
              threats: { type: "array", items: { type: "string" }, description: "Ameaças" }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"],
            additionalProperties: false
          },
          potential_improvements: {
            type: "object",
            properties: { content: { type: "string", description: "Sugestões extras de melhoria." } },
            required: ["content"],
            additionalProperties: false
          }
        },
        required: [
          "project_name", "tagline", "executive_summary", "viability_score",
          "business_diagnosis", "why_now", "why_not_100", "execution_plan",
          "marketing_strategy", "lead_generation_strategy", "key_metrics",
          "risks", "swot", "potential_improvements"
        ],
        additionalProperties: false
      }
    };

    try {
      const result = await this.generateCompletion(
        messages,
        {
          ...config,
          responseFormat: { type: 'json_schema', json_schema: genesisSchema }
        }
      );

      if (!result) throw new Error('Failed to analyze idea');

      // Clean markdown if present
      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResult);

      // Define expected keys for validation (Deep Validation matches genesis-analysis.md v2.1)
      const expectedKeys = [
        'project_name',
        'tagline',
        'executive_summary.content',
        'viability_score.breakdown.market_pain',
        'viability_score.breakdown.technical_feasibility',
        'viability_score.breakdown.revenue_potential',
        'viability_score.breakdown.competitive_landscape',
        'business_diagnosis.content',
        'why_now.content',
        'why_not_100.summary',
        'why_not_100.critical_gaps',
        'execution_plan.systems_breakdown',
        'execution_plan.roadmap',
        'execution_plan.backlog_preview',
        'marketing_strategy.value_proposition',
        'marketing_strategy.target_audience',
        'marketing_strategy.channels',
        'marketing_strategy.tactics',
        'marketing_strategy.approach_strategy.content', // Added
        'lead_generation_strategy.lead_magnets',
        'lead_generation_strategy.conversion_tactics',
        'key_metrics',
        'risks',
        'swot.strengths',
        'swot.weaknesses',
        'swot.opportunities',
        'swot.threats',
        'potential_improvements.content' // Added
      ];

      // Log the interaction
      await this.logLLMInteraction(
        'genesis_analysis',
        messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n---\n\n'),
        parsed,
        expectedKeys
      );

      return parsed;
    } catch (e) {
      console.error("Failed to analyze idea:", e);
      throw e;
    }
  }
}

export const llmService = new LLMService();
