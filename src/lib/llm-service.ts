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
      Atue como uma Consultoria Estratégica de Elite (Produto, Operações e Go-to-Market).
      Sua missão é transformar a ideia bruta do usuário em um plano de execução completo e profissional.

      CRITÉRIOS DE AVALIAÇÃO DE VIABILIDADE (VCM SCORE 0-100):
      Avalie severamente usando estes 4 pilares para compor a nota final:
      1. Dor de Mercado: Alta (Urgente/Crítico) | Média (Real mas contornável) | Baixa (Nice to have)
      2. Viabilidade Técnica: Alta (Tecnologia madura) | Média (Complexo) | Baixa (P&D/Inviável)
      3. Potencial de Receita: Alta (Escalável/LTV alto) | Média (Margens apertadas) | Baixa (Incerto)
      4. Cenário Competitivo: Alta (Oceano Azul/Nicho) | Média (Diferenciação possível) | Baixa (Saturado/Oceano Vermelho)

      ENTREGÁVEIS OBRIGATÓRIOS (Responda neste JSON estrito):
      {
        "project_name": "Nome comercial sugerido",
        "tagline": "Slogan de impacto",
        "executive_summary": "Resumo executivo decisório (3-4 parágrafos) analisando a viabilidade e o 'big picture'",
        "business_potential_diagnosis": {
           "market_size": "Estimativa de mercado (TAM/SAM/SOM se possível)",
           "compelling_reason": "Por que agora? (Why Now)",
           "viability_score": "0-100",
           "viability_analysis": "Justificativa detalhada baseada em: 1) Dor do Mercado, 2) Viabilidade Técnica, 3) Potencial de Receita, 4) Competição."
        },
        "mission": "Missão",
        "vision": "Visão",
        "values": ["Valor 1", "Valor 2", "Valor 3", "Valor 4", "Valor 5"],
        "target_audience": "Descrição detalhada do público-alvo",
        "pain_points": ["Dor 1", "Dor 2", "Dor 3"],
        "marketing_strategy": {
           "value_proposition": "Proposta de Valor clara e concisa",
           "target_audience": "Definição do público alvo para marketing",
           "approach_strategy": "Definição de Abordagem (Ex: Inbound, Outbound, PLG, etc)",
           "channels": ["Canal 1", "Canal 2"],
           "tactics": ["Tática 1", "Tática 2"],
           "launch_plan_steps": ["Semana 1: ...", "Semana 2: ...", "Mês 1: ..."]
        },
        "lead_generation_strategy": {
           "lead_magnets": ["Ebook: ...", "Webinar: ..."],
           "conversion_tactics": ["Landing Page com ...", "Sequência de email..."],
           "tools_suggested": ["Hubspot", "Mailchimp"]
        },
        "systems_and_modules": [
           {
             "module_name": "Ex: Módulo de Aquisição",
             "description": "O que este módulo faz",
             "features": ["Feature A", "Feature B"]
           },
           {
             "module_name": "Ex: Motor de Processamento (Core)",
             "description": "Descrição...",
             "features": ["Feature C", "Feature D"]
           }
        ],
        "roadmap": [
           { "phase": "Fase 1 - MVP", "duration": "1 mês", "deliverables": ["Item A", "Item B"] },
           { "phase": "Fase 2 - Tração", "duration": "3 meses", "deliverables": ["Item C", "Item D"] }
        ],
        "backlog_preview": [
           { "title": "Tarefa Técnica 1", "priority": "High", "category": "Backend" },
           { "title": "Tarefa de Design 1", "priority": "Medium", "category": "UX" }
        ],
        "revenue_streams": ["Fonte 1", "Fonte 2"],
        "swot": {
          "strengths": ["S1", "S2"],
          "weaknesses": ["W1", "W2"],
          "opportunities": ["O1", "O2"],
          "threats": ["T1", "T2"]
        },
        "key_metrics": ["Metric 1", "Metric 2", "Metric 3"],
        "risks_and_gaps": ["Risco 1", "Risco 2"],
        "improvement_suggestions": ["Melhoria 1", "Melhoria 2"]
      }

      IMPORTANTE:
      - Seja profundo, crítico e tático.
      - NÃO seja genérico. Use a terminologia do setor da ideia.
      - Se a viability_score for menor que 99, preencha 'improvement_suggestions' com ações concretas para aumentar a nota.
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
