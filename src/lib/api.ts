// API client para comunicar com FastAPI backend ou Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';  // Empty for same-origin requests

export interface NacionalidadePercentual {
  tipo: string;
  percentual: number;
}

export interface BiografiaRequest {
  empresa_codigo?: string;
  empresa_nome: string;
  empresa_industry: string;
  empresa_pais: string;
  empresa_descricao: string;
  empresa_tamanho: 'startup' | 'pequena' | 'media' | 'grande';
  empresa_cultura: 'formal' | 'casual' | 'hibrida';
  nacionalidades: NacionalidadePercentual[]; // Array de nacionalidades com percentuais
  ceo_genero: string;
  executivos_homens: number;
  executivos_mulheres: number;
  assistentes_homens: number;
  assistentes_mulheres: number;
  especialistas_homens: number;
  especialistas_mulheres: number;
  idiomas_extras: string[];
}

export interface ScriptResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  output?: string;
  execution_time?: number;
}

export interface ExecutionStatus {
  biografia: { running: boolean; last_run: string | null; last_result: string | null };
  script_1: { running: boolean; last_run: string | null; last_result: string | null };
  script_2: { running: boolean; last_run: string | null; last_result: string | null };
  script_3: { running: boolean; last_run: string | null; last_result: string | null };
  script_4: { running: boolean; last_run: string | null; last_result: string | null };
  script_5: { running: boolean; last_run: string | null; last_result: string | null };
  cascade: { running: boolean; last_run: string | null; last_result: string | null };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Status de execução
  async getStatus(): Promise<{ execution_status: ExecutionStatus; timestamp: string }> {
    return this.request('/status');
  }

  // Gerar biografias
  async generateBiografias(request: BiografiaRequest): Promise<ScriptResponse> {
    return this.request('/generate-biografias', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Executar script específico (1-5)
  async runScript(scriptNumber: number, forceRegenerate = false): Promise<ScriptResponse> {
    return this.request(`/run-script/${scriptNumber}`, {
      method: 'POST',
      body: JSON.stringify({ script_number: scriptNumber, force_regenerate: forceRegenerate }),
    });
  }

  // Executar cascata completa
  async runCascade(): Promise<ScriptResponse> {
    return this.request('/run-cascade', {
      method: 'POST',
    });
  }

  // Listar outputs
  async listOutputs() {
    return this.request('/outputs');
  }
}

export const apiClient = new ApiClient();