/**
 * N8N API Client
 * Classe para comunicação com a API do N8N
 * 
 * Documentação oficial: https://docs.n8n.io/api/
 */

export interface N8NCredentials {
  url: string;
  apiKey: string;
}

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  mode: 'manual' | 'trigger' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  finished: boolean;
  status: 'success' | 'error' | 'waiting' | 'running';
  data?: any;
}

export interface N8NWorkflowCreate {
  name: string;
  nodes: any[];
  connections: any;
  settings?: any;
  active?: boolean;
  tags?: string[];
}

export class N8NClient {
  private baseUrl: string;
  private apiKey: string;
  private headers: HeadersInit;

  constructor(credentials: N8NCredentials) {
    // Remover trailing slash da URL
    this.baseUrl = credentials.url.replace(/\/$/, '');
    this.apiKey = credentials.apiKey;
    
    this.headers = {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': this.apiKey,
    };
  }

  /**
   * Testa a conexão com a instância N8N
   */
  async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      // N8N não tem endpoint /health, mas podemos listar workflows
      const response = await fetch(`${this.baseUrl}/api/v1/workflows?limit=1`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            message: 'API Key inválida. Verifique suas credenciais.',
          };
        }
        return {
          success: false,
          message: `Erro HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        version: data.version || 'unknown',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro de conexão: ${error.message}. Verifique se a URL está correta e acessível.`,
      };
    }
  }

  /**
   * Lista todos os workflows
   */
  async getWorkflows(options?: { active?: boolean; tags?: string[] }): Promise<N8NWorkflow[]> {
    try {
      let url = `${this.baseUrl}/api/v1/workflows`;
      const params = new URLSearchParams();

      if (options?.active !== undefined) {
        params.append('active', String(options.active));
      }

      if (options?.tags && options.tags.length > 0) {
        params.append('tags', options.tags.join(','));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar workflows:', error);
      throw new Error(`Falha ao buscar workflows: ${error.message}`);
    }
  }

  /**
   * Obtém um workflow específico por ID
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflow> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Erro ao buscar workflow ${workflowId}:`, error);
      throw new Error(`Falha ao buscar workflow: ${error.message}`);
    }
  }

  /**
   * Cria um novo workflow no N8N
   */
  async createWorkflow(workflow: N8NWorkflowCreate): Promise<N8NWorkflow> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao criar workflow:', error);
      throw new Error(`Falha ao criar workflow: ${error.message}`);
    }
  }

  /**
   * Atualiza um workflow existente
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<N8NWorkflowCreate>
  ): Promise<N8NWorkflow> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Erro ao atualizar workflow ${workflowId}:`, error);
      throw new Error(`Falha ao atualizar workflow: ${error.message}`);
    }
  }

  /**
   * Ativa ou desativa um workflow
   */
  async activateWorkflow(workflowId: string, active: boolean): Promise<N8NWorkflow> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ active }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Erro ao ativar/desativar workflow ${workflowId}:`, error);
      throw new Error(`Falha ao alterar status do workflow: ${error.message}`);
    }
  }

  /**
   * Deleta um workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error(`Erro ao deletar workflow ${workflowId}:`, error);
      throw new Error(`Falha ao deletar workflow: ${error.message}`);
    }
  }

  /**
   * Lista execuções de workflows
   */
  async getExecutions(options?: {
    workflowId?: string;
    limit?: number;
    status?: 'success' | 'error' | 'waiting' | 'running';
  }): Promise<N8NExecution[]> {
    try {
      let url = `${this.baseUrl}/api/v1/executions`;
      const params = new URLSearchParams();

      if (options?.workflowId) {
        params.append('workflowId', options.workflowId);
      }

      if (options?.limit) {
        params.append('limit', String(options.limit));
      }

      if (options?.status) {
        params.append('status', options.status);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar execuções:', error);
      throw new Error(`Falha ao buscar execuções: ${error.message}`);
    }
  }

  /**
   * Obtém detalhes de uma execução específica
   */
  async getExecution(executionId: string): Promise<N8NExecution> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Erro ao buscar execução ${executionId}:`, error);
      throw new Error(`Falha ao buscar execução: ${error.message}`);
    }
  }

  /**
   * Executa um workflow manualmente
   */
  async executeWorkflow(workflowId: string, data?: any): Promise<N8NExecution> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ data: data || {} }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Erro ao executar workflow ${workflowId}:`, error);
      throw new Error(`Falha ao executar workflow: ${error.message}`);
    }
  }

  /**
   * Importa um workflow a partir de JSON
   */
  async importWorkflow(workflowJson: any): Promise<N8NWorkflow> {
    try {
      // N8N aceita o workflow completo no POST
      return await this.createWorkflow(workflowJson);
    } catch (error: any) {
      console.error('Erro ao importar workflow:', error);
      throw new Error(`Falha ao importar workflow: ${error.message}`);
    }
  }
}

/**
 * Helper para obter credenciais N8N do ambiente ou banco
 */
export async function getN8NCredentials(): Promise<N8NCredentials | null> {
  // Primeiro tenta pegar do .env.local
  const url = process.env.N8N_INSTANCE_URL || process.env.NEXT_PUBLIC_N8N_INSTANCE_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (url && apiKey) {
    return { url, apiKey };
  }

  // Se não encontrou no .env, busca do banco (implementar depois)
  // TODO: Buscar de system_integrations WHERE provider = 'n8n'
  
  return null;
}

/**
 * Helper para criar instância do client
 */
export async function createN8NClient(): Promise<N8NClient | null> {
  const credentials = await getN8NCredentials();
  
  if (!credentials) {
    console.warn('N8N credentials not found. Configure in Integrações.');
    return null;
  }

  return new N8NClient(credentials);
}
