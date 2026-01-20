// =====================================================
// MÓDULO PROVISIONAMENTO - INTERFACES & TIPOS
// =====================================================

export interface ProvisionamentoEmpresa {
  id: string;
  codigo: string;
  nome: string;
  industria: string;
  pais: string;
  status: string;
  total_personas: number;
  created_at: Date;
  
  // Estatísticas para Empacotamento
  databases_size_mb: number;
  workflows_count: number;
  knowledge_base_size: number;
  assets_count: number;
  estimated_package_size_mb: number;
}

export interface ProvisionamentoPacote {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  package_code: string; // Código único do pacote
  
  // Configuração do Pacote
  package_type: 'full' | 'lite' | 'personas_only' | 'workflows_only' | 'custom';
  version: string;
  description?: string;
  
  // Componentes Inclusos
  components: {
    database_schema: boolean;
    initial_data: boolean;
    personas: boolean;
    workflows: boolean;
    knowledge_base: boolean;
    configurations: boolean;
    sync_scripts: boolean;
    documentation: boolean;
    assets: boolean;
  };
  
  // Dados do Pacote
  included_personas: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    included: boolean;
  }>;
  
  included_workflows: Array<{
    id: string;
    name: string;
    type: string;
    persona_id: string;
    included: boolean;
  }>;
  
  // Configurações de Deploy
  deploy_config: {
    target_environment: 'production' | 'staging' | 'development';
    supabase_project_id?: string;
    database_url?: string;
    custom_domain?: string;
    ssl_enabled: boolean;
    backup_enabled: boolean;
  };
  
  // Sincronização
  sync_config: {
    bidirectional_sync: boolean;
    sync_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    conflict_resolution: 'central_wins' | 'client_wins' | 'manual_review';
    auto_merge_enabled: boolean;
  };
  
  // Status e Processamento
  build_status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';
  build_progress: number; // 0-100
  build_started_at?: Date;
  build_completed_at?: Date;
  build_error?: string;
  
  // Arquivos Gerados
  package_files: Array<{
    name: string;
    type: 'sql' | 'json' | 'js' | 'md' | 'env' | 'zip';
    size_bytes: number;
    path: string;
    description: string;
  }>;
  
  // Download
  download_url?: string;
  download_expires_at?: Date;
  download_count: number;
  package_size_bytes: number;
  
  // Metadados
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProvisionamentoSyncStatus {
  id: string;
  empresa_id: string;
  sync_type: 'deploy_to_client' | 'update_from_client' | 'bidirectional';
  
  // Status da Sincronização
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  
  // Configuração
  source_environment: 'vcm_central' | 'client_production' | 'client_staging';
  target_environment: 'vcm_central' | 'client_production' | 'client_staging';
  
  // Dados Transferidos
  sync_items: Array<{
    table_name: string;
    operation: 'insert' | 'update' | 'delete' | 'upsert';
    records_count: number;
    success_count: number;
    error_count: number;
    errors: string[];
  }>;
  
  // Conflitos
  conflicts: Array<{
    table_name: string;
    record_id: string;
    field_name: string;
    central_value: any;
    client_value: any;
    resolution: 'manual' | 'central_wins' | 'client_wins';
    resolved: boolean;
    resolved_by?: string;
    resolved_at?: Date;
  }>;
  
  // Validação
  validation_results: {
    schema_valid: boolean;
    data_integrity_valid: boolean;
    references_valid: boolean;
    constraints_valid: boolean;
    validation_errors: string[];
  };
  
  // Backup e Rollback
  backup_created: boolean;
  backup_location?: string;
  rollback_available: boolean;
  rollback_data?: any;
  
  // Timing
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  
  // Logs e Debug
  log_entries: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  }>;
  
  created_at: Date;
}

export interface ProvisionamentoClientEnvironment {
  id: string;
  empresa_id: string;
  environment_name: string;
  environment_type: 'production' | 'staging' | 'development' | 'testing';
  
  // Configuração do Cliente
  client_config: {
    supabase_url: string;
    supabase_anon_key: string;
    supabase_service_key: string;
    database_url?: string;
    api_base_url?: string;
    custom_domain?: string;
  };
  
  // Informações de Deploy
  deploy_info: {
    last_deployed_at?: Date;
    deployed_version?: string;
    deployed_package_id?: string;
    deployment_method: 'manual' | 'automated' | 'ci_cd';
  };
  
  // Status de Saúde
  health_status: 'healthy' | 'warning' | 'error' | 'unknown';
  last_health_check: Date;
  health_metrics: {
    database_responsive: boolean;
    api_responsive: boolean;
    sync_functioning: boolean;
    error_rate: number;
    response_time_ms: number;
  };
  
  // Sincronização
  sync_enabled: boolean;
  last_sync_at?: Date;
  next_sync_at?: Date;
  sync_errors: string[];
  
  // Monitoramento
  monitoring_enabled: boolean;
  alert_webhooks: string[];
  notification_emails: string[];
  
  // Metadados
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface ProvisionamentoTemplate {
  id: string;
  name: string;
  description: string;
  template_type: 'full_company' | 'department' | 'role_based' | 'industry_specific';
  
  // Configurações Padrão
  default_components: {
    database_schema: boolean;
    initial_data: boolean;
    personas: boolean;
    workflows: boolean;
    knowledge_base: boolean;
    configurations: boolean;
    sync_scripts: boolean;
    documentation: boolean;
  };
  
  // Templates de Personas
  persona_templates: Array<{
    role: string;
    department: string;
    level: 'junior' | 'senior' | 'manager' | 'director' | 'c_level';
    required: boolean;
    default_included: boolean;
  }>;
  
  // Templates de Workflows
  workflow_templates: Array<{
    name: string;
    type: string;
    description: string;
    required_roles: string[];
    default_included: boolean;
  }>;
  
  // Configurações Específicas
  industry_specific: {
    compliance_requirements: string[];
    mandatory_workflows: string[];
    required_integrations: string[];
  };
  
  // Validação
  validation_rules: {
    min_personas: number;
    max_personas: number;
    required_roles: string[];
    mandatory_components: string[];
  };
  
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// =====================================================
// INTERFACES PARA SYNC ENGINE
// =====================================================

export interface SyncOperation {
  id: string;
  operation_type: 'full_sync' | 'incremental_sync' | 'conflict_resolution';
  direction: 'central_to_client' | 'client_to_central' | 'bidirectional';
  
  // Configuração
  tables_to_sync: string[];
  filter_criteria?: Record<string, any>;
  conflict_resolution_strategy: 'central_wins' | 'client_wins' | 'manual_review';
  
  // Dados da Operação
  records_to_process: number;
  records_processed: number;
  records_success: number;
  records_failed: number;
  records_skipped: number;
  
  // Checkpoints para Resume
  last_processed_id?: string;
  batch_size: number;
  current_batch: number;
  total_batches: number;
  
  // Status
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  can_resume: boolean;
  
  // Timing
  estimated_duration_seconds?: number;
  actual_duration_seconds?: number;
  started_at?: Date;
  completed_at?: Date;
  
  // Logs
  log_entries: Array<{
    timestamp: Date;
    level: 'debug' | 'info' | 'warning' | 'error';
    message: string;
    context?: any;
  }>;
}

// =====================================================
// INTERFACES PARA APIS DO PROVISIONAMENTO
// =====================================================

export interface ProvisionamentoAPI {
  // Empresas e Pacotes
  getEmpresasDisponiveis(): Promise<ProvisionamentoEmpresa[]>;
  createPacote(config: Partial<ProvisionamentoPacote>): Promise<ProvisionamentoPacote>;
  getPacotes(empresaId?: string): Promise<ProvisionamentoPacote[]>;
  getPacoteById(id: string): Promise<ProvisionamentoPacote>;
  buildPacote(id: string): Promise<void>;
  downloadPacote(id: string): Promise<Blob>;
  
  // Templates
  getTemplates(): Promise<ProvisionamentoTemplate[]>;
  createPacoteFromTemplate(templateId: string, empresaId: string): Promise<ProvisionamentoPacote>;
  
  // Ambientes Cliente
  getClientEnvironments(empresaId: string): Promise<ProvisionamentoClientEnvironment[]>;
  createClientEnvironment(config: Partial<ProvisionamentoClientEnvironment>): Promise<ProvisionamentoClientEnvironment>;
  updateClientEnvironment(id: string, updates: Partial<ProvisionamentoClientEnvironment>): Promise<ProvisionamentoClientEnvironment>;
  checkEnvironmentHealth(id: string): Promise<void>;
  
  // Sincronização
  startSync(empresaId: string, config: Partial<SyncOperation>): Promise<ProvisionamentoSyncStatus>;
  getSyncStatus(syncId: string): Promise<ProvisionamentoSyncStatus>;
  getSyncHistory(empresaId: string): Promise<ProvisionamentoSyncStatus[]>;
  cancelSync(syncId: string): Promise<void>;
  
  // Conflict Resolution
  getConflicts(syncId: string): Promise<any[]>;
  resolveConflict(syncId: string, conflictId: string, resolution: any): Promise<void>;
  
  // Utilities
  validatePackageData(pacoteId: string): Promise<any>;
  generateSyncScripts(empresaId: string): Promise<any>;
  exportSchemas(empresaId: string): Promise<any>;
}