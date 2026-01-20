/**
 * VCM API Gateway - Sistema Central de Integrações
 * Gerencia todas as APIs externas com rate limiting, retry logic e monitoramento
 */

interface APIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  retryAttempts: number;
  timeout: number; // milliseconds
  headers?: Record<string, string>;
  category: 'ai' | 'email' | 'crm' | 'finance' | 'automation' | 'analytics' | 'social';
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitRemaining?: number;
  retryAfter?: number;
  requestId?: string;
}

interface RateLimitInfo {
  requests: number;
  resetTime: number;
  remaining: number;
}

class APIGateway {
  private static instance: APIGateway;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private requestQueues: Map<string, Array<() => Promise<void>>> = new Map();
  private configs: Map<string, APIConfig> = new Map();

  private constructor() {
    this.initializeAPIs();
  }

  public static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  private initializeAPIs() {
    // AI APIs
    this.registerAPI('openai', {
      name: 'OpenAI GPT-4',
      baseUrl: 'https://api.openai.com/v1',
      rateLimit: 60,
      retryAttempts: 3,
      timeout: 30000,
      category: 'ai'
    });

    this.registerAPI('anthropic', {
      name: 'Anthropic Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      rateLimit: 50,
      retryAttempts: 3,
      timeout: 30000,
      category: 'ai'
    });

    this.registerAPI('google-ai', {
      name: 'Google Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      rateLimit: 60,
      retryAttempts: 3,
      timeout: 30000,
      category: 'ai'
    });

    // Email Marketing APIs
    this.registerAPI('sendgrid', {
      name: 'SendGrid',
      baseUrl: 'https://api.sendgrid.com/v3',
      rateLimit: 100,
      retryAttempts: 3,
      timeout: 15000,
      category: 'email'
    });

    this.registerAPI('mailchimp', {
      name: 'Mailchimp',
      baseUrl: 'https://us1.api.mailchimp.com/3.0',
      rateLimit: 120,
      retryAttempts: 3,
      timeout: 15000,
      category: 'email'
    });

    // CRM APIs
    this.registerAPI('salesforce', {
      name: 'Salesforce',
      baseUrl: 'https://login.salesforce.com',
      rateLimit: 100,
      retryAttempts: 3,
      timeout: 20000,
      category: 'crm'
    });

    this.registerAPI('hubspot', {
      name: 'HubSpot',
      baseUrl: 'https://api.hubapi.com',
      rateLimit: 120,
      retryAttempts: 3,
      timeout: 15000,
      category: 'crm'
    });

    // Communication APIs
    this.registerAPI('twilio', {
      name: 'Twilio',
      baseUrl: 'https://api.twilio.com/2010-04-01',
      rateLimit: 60,
      retryAttempts: 3,
      timeout: 15000,
      category: 'crm'
    });

    this.registerAPI('whatsapp-business', {
      name: 'WhatsApp Business',
      baseUrl: 'https://graph.facebook.com/v18.0',
      rateLimit: 80,
      retryAttempts: 3,
      timeout: 15000,
      category: 'crm'
    });

    // Financial APIs
    this.registerAPI('stripe', {
      name: 'Stripe',
      baseUrl: 'https://api.stripe.com/v1',
      rateLimit: 100,
      retryAttempts: 3,
      timeout: 15000,
      category: 'finance'
    });

    this.registerAPI('paypal', {
      name: 'PayPal',
      baseUrl: 'https://api.paypal.com/v1',
      rateLimit: 60,
      retryAttempts: 3,
      timeout: 15000,
      category: 'finance'
    });

    this.registerAPI('mercadopago', {
      name: 'Mercado Pago',
      baseUrl: 'https://api.mercadopago.com/v1',
      rateLimit: 80,
      retryAttempts: 3,
      timeout: 15000,
      category: 'finance'
    });

    // Automation APIs
    this.registerAPI('zapier', {
      name: 'Zapier',
      baseUrl: 'https://zapier.com/api/v1',
      rateLimit: 60,
      retryAttempts: 3,
      timeout: 20000,
      category: 'automation'
    });

    this.registerAPI('make', {
      name: 'Make (Integromat)',
      baseUrl: 'https://www.make.com/api/v2',
      rateLimit: 80,
      retryAttempts: 3,
      timeout: 20000,
      category: 'automation'
    });

    // Analytics APIs
    this.registerAPI('google-analytics', {
      name: 'Google Analytics',
      baseUrl: 'https://analyticsreporting.googleapis.com/v4',
      rateLimit: 100,
      retryAttempts: 3,
      timeout: 15000,
      category: 'analytics'
    });

    this.registerAPI('mixpanel', {
      name: 'Mixpanel',
      baseUrl: 'https://mixpanel.com/api/2.0',
      rateLimit: 60,
      retryAttempts: 3,
      timeout: 15000,
      category: 'analytics'
    });
  }

  public registerAPI(id: string, config: APIConfig) {
    this.configs.set(id, config);
    this.rateLimits.set(id, {
      requests: 0,
      resetTime: Date.now() + 60000,
      remaining: config.rateLimit
    });
    this.requestQueues.set(id, []);
  }

  public async request<T = any>(
    apiId: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const config = this.configs.get(apiId);
    if (!config) {
      return { success: false, error: `API '${apiId}' não configurada` };
    }

    // Check rate limits
    if (!this.canMakeRequest(apiId)) {
      const rateLimitInfo = this.rateLimits.get(apiId)!;
      return {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)
      };
    }

    const requestId = this.generateRequestId();
    
    try {
      const response = await this.makeRequest(config, endpoint, options, requestId);
      this.updateRateLimit(apiId);
      
      return {
        success: true,
        data: response.data,
        rateLimitRemaining: this.rateLimits.get(apiId)?.remaining,
        requestId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  private async makeRequest(
    config: APIConfig,
    endpoint: string,
    options: RequestInit,
    requestId: string
  ): Promise<any> {
    const url = `${config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...config.headers,
      ...options.headers as Record<string, string>
    };

    // Add API key based on service
    if (config.apiKey) {
      if (config.name.includes('OpenAI')) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.name.includes('Anthropic')) {
        headers['x-api-key'] = config.apiKey;
      } else if (config.name.includes('SendGrid')) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    let attempt = 0;
    while (attempt < config.retryAttempts) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, status: response.status };
      } catch (error: any) {
        attempt++;
        if (attempt >= config.retryAttempts) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  private canMakeRequest(apiId: string): boolean {
    const rateLimit = this.rateLimits.get(apiId);
    if (!rateLimit) return false;

    const now = Date.now();
    if (now > rateLimit.resetTime) {
      // Reset rate limit
      const config = this.configs.get(apiId)!;
      rateLimit.requests = 0;
      rateLimit.resetTime = now + 60000;
      rateLimit.remaining = config.rateLimit;
    }

    return rateLimit.remaining > 0;
  }

  private updateRateLimit(apiId: string) {
    const rateLimit = this.rateLimits.get(apiId);
    if (rateLimit) {
      rateLimit.requests++;
      rateLimit.remaining--;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Monitoring Methods
  public getAPIStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.configs.forEach((config, apiId) => {
      const rateLimit = this.rateLimits.get(apiId);
      status[apiId] = {
        name: config.name,
        category: config.category,
        status: 'active',
        rateLimit: {
          limit: config.rateLimit,
          remaining: rateLimit?.remaining || 0,
          resetTime: rateLimit?.resetTime || 0
        }
      };
    });

    return status;
  }

  public getAPIsByCategory(category: string): string[] {
    return Array.from(this.configs.entries())
      .filter(([_, config]) => config.category === category)
      .map(([apiId, _]) => apiId);
  }

  public updateAPIKey(apiId: string, apiKey: string) {
    const config = this.configs.get(apiId);
    if (config) {
      config.apiKey = apiKey;
    }
  }
}

// Service Classes for specific integrations
class AIService {
  private gateway = APIGateway.getInstance();

  async generateContent(prompt: string, model: 'openai' | 'anthropic' | 'google' = 'openai'): Promise<APIResponse<string>> {
    switch (model) {
      case 'openai':
        return this.gateway.request('openai', '/chat/completions', {
          method: 'POST',
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }]
          })
        });
      case 'anthropic':
        return this.gateway.request('anthropic', '/messages', {
          method: 'POST',
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });
      default:
        return { success: false, error: 'Modelo não suportado' };
    }
  }
}

class EmailService {
  private gateway = APIGateway.getInstance();

  async sendCampaign(campaign: any, provider: 'sendgrid' | 'mailchimp' = 'sendgrid'): Promise<APIResponse> {
    switch (provider) {
      case 'sendgrid':
        return this.gateway.request('sendgrid', '/mail/send', {
          method: 'POST',
          body: JSON.stringify(campaign)
        });
      case 'mailchimp':
        return this.gateway.request('mailchimp', '/campaigns', {
          method: 'POST',
          body: JSON.stringify(campaign)
        });
      default:
        return { success: false, error: 'Provider não suportado' };
    }
  }
}

class CRMService {
  private gateway = APIGateway.getInstance();

  async createContact(contact: any, provider: 'salesforce' | 'hubspot' = 'hubspot'): Promise<APIResponse> {
    switch (provider) {
      case 'salesforce':
        return this.gateway.request('salesforce', '/sobjects/Contact', {
          method: 'POST',
          body: JSON.stringify(contact)
        });
      case 'hubspot':
        return this.gateway.request('hubspot', '/crm/v3/objects/contacts', {
          method: 'POST',
          body: JSON.stringify(contact)
        });
      default:
        return { success: false, error: 'Provider não suportado' };
    }
  }

  async sendWhatsApp(message: any): Promise<APIResponse> {
    return this.gateway.request('whatsapp-business', `/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }
}

class PaymentService {
  private gateway = APIGateway.getInstance();

  async createPayment(payment: any, provider: 'stripe' | 'paypal' | 'mercadopago' = 'stripe'): Promise<APIResponse> {
    switch (provider) {
      case 'stripe':
        return this.gateway.request('stripe', '/payment_intents', {
          method: 'POST',
          body: JSON.stringify(payment)
        });
      case 'paypal':
        return this.gateway.request('paypal', '/payments/payment', {
          method: 'POST',
          body: JSON.stringify(payment)
        });
      case 'mercadopago':
        return this.gateway.request('mercadopago', '/payments', {
          method: 'POST',
          body: JSON.stringify(payment)
        });
      default:
        return { success: false, error: 'Provider não suportado' };
    }
  }
}

class AutomationService {
  private gateway = APIGateway.getInstance();

  async createWorkflow(workflow: any, provider: 'zapier' | 'make' = 'zapier'): Promise<APIResponse> {
    switch (provider) {
      case 'zapier':
        return this.gateway.request('zapier', '/zaps', {
          method: 'POST',
          body: JSON.stringify(workflow)
        });
      case 'make':
        return this.gateway.request('make', '/scenarios', {
          method: 'POST',
          body: JSON.stringify(workflow)
        });
      default:
        return { success: false, error: 'Provider não suportado' };
    }
  }
}

class AnalyticsService {
  private gateway = APIGateway.getInstance();

  async getAnalytics(query: any, provider: 'google-analytics' | 'mixpanel' = 'google-analytics'): Promise<APIResponse> {
    switch (provider) {
      case 'google-analytics':
        return this.gateway.request('google-analytics', '/reports:batchGet', {
          method: 'POST',
          body: JSON.stringify(query)
        });
      case 'mixpanel':
        return this.gateway.request('mixpanel', '/export', {
          method: 'GET'
        });
      default:
        return { success: false, error: 'Provider não suportado' };
    }
  }
}

// Export the singleton instance
export const apiGateway = APIGateway.getInstance();
export { AIService, EmailService, CRMService, PaymentService, AutomationService, AnalyticsService };