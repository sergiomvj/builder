import OpenAI from 'openai';

export type LLMProvider = 'openrouter' | 'openai';

export interface LLMRequestConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Builder MVP';

// Default configuration as requested by user
const DEFAULT_PROVIDER: LLMProvider = 'openai';
const DEFAULT_MODEL = 'gpt-4o';
const FALLBACK_MODELS = [
  'gpt-4o-mini',
  'gpt-3.5-turbo'
];

export class LLMService {
  private openRouterClient: OpenAI | null = null;
  private openAIClient: OpenAI | null = null;

  constructor() {
    if (OPENROUTER_API_KEY) {
      this.openRouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': SITE_URL, // Optional, for including your app on openrouter.ai rankings.
          'X-Title': SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
        },
      });
    }

    if (OPENAI_API_KEY) {
      this.openAIClient = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates a completion using the specified or default LLM configuration.
   * Prioritizes OpenRouter with free models as requested.
   */
  async generateCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    config: LLMRequestConfig = {}
  ): Promise<string | null> {
    const provider = config.provider || DEFAULT_PROVIDER;
    let model = config.model || (provider === 'openrouter' ? DEFAULT_MODEL : 'gpt-4o');
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens;
    const responseFormat = config.jsonMode ? { type: 'json_object' as const } : undefined;

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
   * Helper specifically for analyzing ideas (JSON output)
   */
  async analyzeIdea(ideaDescription: string, config: LLMRequestConfig = {}) {
    const systemPrompt = config.systemPrompt || `
      Atue como uma Consultoria Estratégica de Elite (Nível McKinsey/BCG + CTO de Big Tech + CMO de Growth).
      Sua missão é transformar a ideia bruta do usuário em um plano de execução tático, técnico e comercial de profundidade extrema.

      CRITÉRIOS DE AVALIAÇÃO DE VIABILIDADE (VCM SCORE 0-100):
      O Score deve ser a média ponderada de 4 pilares. SEJA CRÍTICO. Notas altas exigem inovação real.
      1. Dor de Mercado (30%): A dor é latente, urgente e frequente?
      2. Viabilidade Técnica (20%): É factível com tecnologia atual? Custo vs Benefício.
      3. Potencial de Receita (30%): Escalabilidade, LTV, Margem.
      4. Cenário Competitivo (20%): Diferenciação clara vs Players atuais.

      ENTREGÁVEIS OBRIGATÓRIOS (Responda neste JSON estrito):
      {
        "project_name": "Nome comercial sugerido (Moderno, curto, memorável)",
        "tagline": "Slogan de impacto (Value proposition em 1 frase)",
        "executive_summary": "Análise crítica de 3-4 parágrafos. Não apenas descreva a ideia, mas julgue a oportunidade. Aponte o 'Why Now'.",
        "business_potential_diagnosis": {
           "market_size": "Estimativa quantitativa (TAM/SAM/SOM) com raciocínio lógico.",
           "compelling_reason": "O gatilho de mercado que torna isso urgente agora.",
           "viability_score": "0-100 (Seja rigoroso, evite notas infladas)",
           "viability_score_breakdown": {
              "market_pain": "0-100",
              "tech_feasibility": "0-100",
              "revenue_potential": "0-100",
              "competitive_landscape": "0-100"
           },
           "viability_analysis": "Justificativa detalhada de cada nota do breakdown.",
           "score_gap_analysis": "Se a nota for menor que 100, explique exatamente POR QUE não é 100 (Ex: 'Why 76 and not 100?'). Liste os gaps específicos."
        },
        "mission": "Propósito transformador massivo.",
        "vision": "Onde a empresa estará em 5-10 anos.",
        "values": ["Valor 1", "Valor 2", "Valor 3", "Valor 4", "Valor 5"],
        "target_audience": "Definição granular (Ex: idade, cargo, comportamento, dores psicográficas).",
        "pain_points": ["Dor profunda 1", "Dor profunda 2", "Dor profunda 3"],
        "marketing_strategy": {
           "value_proposition": "Proposta de Valor Única (UVP).",
           "target_audience": "Segmentação psicográfica detalhada para campanhas.",
           "approach_strategy": "Ex: Product-Led Growth, ABM, Viral Loop, Content-First.",
           "channels": ["Canal A (Ex: LinkedIn Ads com foco em CTOs)", "Canal B (Ex: Parcerias com Influencers de Niche)"],
           "tactics": ["Campanha específica 1 (Descreva o hook)", "Campanha específica 2 (Descreva a oferta)"],
           "launch_plan_steps": ["Semana 1-2: [Ação Específica]", "Semana 3-4: [Ação Específica]", "Mês 2: [Ação Específica]"]
        },
        "lead_generation_strategy": {
           "lead_magnets": ["Ideia de Ebook/Tool Grátis Específica", "Ideia de Webinar/Evento Exclusivo"],
           "conversion_tactics": ["Funil detalhado (Ex: Quiz -> Aula Grátis -> Oferta)"],
           "tools_suggested": ["Ferramenta específica para o nicho", "CRM sugerido"]
        },
        "systems_and_modules": [
           {
             "module_name": "Nome Técnico (Ex: Order Processing Microservice)",
             "description": "Responsabilidade única do módulo.",
             "features": ["Feature técnica A", "Feature técnica B"],
             "tech_stack_recommendation": "Linguagem/DB sugerido para este módulo"
           },
           {
             "module_name": "Nome Técnico (Ex: AI Recommendation Engine)",
             "description": "Responsabilidade...",
             "features": ["Feature C", "Feature D"],
             "tech_stack_recommendation": "Technology hint"
           }
        ],
        "roadmap": [
           { 
             "phase": "Fase 1: MVP (Mês 1-2)", 
             "duration": "8 semanas", 
             "deliverables": [
                { "area": "Tech", "task": "Configurar Supabase Auth e criar tabelas de usuários." },
                { "area": "Product", "task": "Rodar 10 entrevistas de problem-fit com nicho alvo." },
                { "area": "Marketing", "task": "Lançar Landing Page com captura de e-mail (Waitlist)." }
             ] 
           },
           { 
             "phase": "Fase 2: Beta Launch (Mês 3)", 
             "duration": "4 semanas", 
             "deliverables": [
                { "area": "Tech", "task": "Integrar Gateway Stripe e Webhooks de pagamento." },
                { "area": "Product", "task": "Refinar onboarding com base no feedback dos primeiros 50 usuários." },
                { "area": "Marketing", "task": "Disparar sequência de e-mail marketing (3 emails) para lista de espera." }
             ]
           }
        ],
        "backlog_preview": [
           { "title": "Tarefa Técnica Crítica", "priority": "High", "category": "Backend", "effort": "Large" },
           { "title": "Melhoria de UX/UI Chave", "priority": "Medium", "category": "Design", "effort": "Medium" }
        ],
        "revenue_streams": ["Modelo de Receita 1 detalhado", "Modelo de Receita 2 detalhado"],
        "swot": {
          "strengths": ["Força interna 1", "Força interna 2"],
          "weaknesses": ["Fraqueza interna real 1", "Fraqueza interna real 2"],
          "opportunities": ["Oportunidade externa acionável 1", "Oportunidade externa acionável 2"],
          "threats": ["Ameaça de mercado específica 1", "Ameaça regulatória/competitiva 2"]
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
      return JSON.parse(cleanedResult);
    } catch (e) {
      console.error("Failed to parse LLM JSON response or LLM failed.", e);
      throw e; // Propagate error instead of returning mock data
    }
  }

  /**
   * Generates a virtual team structure based on project strategy
   */
  async generateTeamStructure(projectContext: any, config: LLMRequestConfig = {}) {
    const systemPrompt = config.systemPrompt || `
      You are an expert HR Strategist and Organizational Designer.
      Based on the company mission, vision, and objectives, define the perfect 5-person initial core team (C-Level/Heads).
      
      IMPORTANT: All content MUST be in Portuguese (Brazil).
      
      The team MUST cover these key areas: Leadership, Tech, Product/Growth, Ops/Finance.
      
      Output strictly valid JSON:
      {
        "team": [
          {
            "role": "Job Title (e.g., CTO, CMO)",
            "name": "Creative Full Name",
            "description": "Role description and primary focus",
            "seniority": "C-Level / Head / Lead",
            "skills": [
              { "name": "Skill 1", "type": "hard" },
              { "name": "Skill 2", "type": "soft" }
            ],
            "responsibilities": ["Daily Task 1", "Strategic Task 2", "Management Task 3"],
            "kpis": ["KPI 1", "KPI 2"],
            "tools": ["Tool 1", "Tool 2"],
            "personality_traits": ["Trait 1", "Trait 2"]
          }
        ]
      }
      (Generate exactly 5 personas)
    `;

    const userMessage = `
      Project Name: ${projectContext.name}
      Mission: ${projectContext.mission}
      Objectives: ${projectContext.objectives?.join(', ')}
      Target Audience: ${projectContext.target_audience}
      Core Strategy: ${projectContext.pain_points?.join(', ')}
      
      Create a high-performance team to execute this vision.
      Responda APENAS em Português do Brasil.
    `;

    try {
      const result = await this.generateCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        {
          ...config,
          jsonMode: true,
        }
      );

      if (!result) throw new Error('Failed to generate team structure');

      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResult);
    } catch (e) {
      console.error("Failed to generate or parse team structure.", e);
      throw e; // Propagate error instead of returning mock data
    }
  }

  /**
   * Generates N8N automation opportunities
   */
  async generateWorkflowSuggestions(projectContext: any, teamContext: any[], config: LLMRequestConfig = {}) {
    const systemPrompt = config.systemPrompt || `
      You are an expert Automation Architect specializing in N8N.
      Analyze the company strategy and the hired virtual team to identify the top 5 most high-impact automation workflows.
      
      IMPORTANT: All content MUST be in Portuguese (Brazil).

      For each workflow, provide:
      - Title (in PT-BR)
      - Description (What it does and why it's important, in PT-BR)
      - Triggers (e.g., Webhook, Schedule, Email)
      - Actions (e.g., Send Email, Update CRM, Generate Content)
      - Assigned Persona (Which team member "owns" this workflow)

      Output strictly valid JSON:
      {
        "workflows": [
          {
            "title": "Workflow Title",
            "description": "Description...",
            "trigger_type": "webhook",
            "assigned_persona_role": "CTO",
            "complexity": "medium"
          }
        ]
      }
    `;

    const userMessage = `
      Project: ${projectContext.name}
      Mission: ${projectContext.mission}
      
      Team Members:
      ${teamContext.map(m => `- ${m.nome} (${m.cargo}): ${m.descricao_funcao}`).join('\n')}
      
      Responda APENAS em Português do Brasil.
    `;

    try {
      const result = await this.generateCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        {
          ...config,
          jsonMode: true,
        }
      );

      if (!result) throw new Error('Failed to generate workflows');

      // Clean up potential markdown formatting (```json ... ```)
      const cleanedResult = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResult);
    } catch (e) {
      console.error("Failed to generate or parse workflows.", e);
      throw e; // Propagate error instead of returning mock data
    }
  }
}

export const llmService = new LLMService();
