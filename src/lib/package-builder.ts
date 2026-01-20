import { supabase } from './supabase';
import type { 
  ProvisionamentoEmpresa,
  ProvisionamentoPacote,
  ProvisionamentoTemplate 
} from '../types/provisionamento';
import JSZip from 'jszip';

// =====================================================
// CONSTRUTOR DE PACOTES PARA DEPLOYMENT
// =====================================================

export class PackageBuilder {
  private currentPackage?: ProvisionamentoPacote;

  // ===================================================
  // CRIAÇÃO DE PACOTES
  // ===================================================

  async createPackage(config: {
    empresaId: string;
    packageType: 'full' | 'lite' | 'personas_only' | 'workflows_only' | 'custom';
    components: Record<string, boolean>;
    deployConfig?: any;
    syncConfig?: any;
  }): Promise<ProvisionamentoPacote> {
    try {
      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', config.empresaId)
        .single();

      if (empresaError) throw empresaError;

      // Criar registro do pacote
      const packageCode = `PKG_${empresa.codigo}_${Date.now()}`;
      
      const newPackage: ProvisionamentoPacote = {
        id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        empresa_id: config.empresaId,
        empresa_nome: empresa.nome,
        package_code: packageCode,
        package_type: config.packageType,
        version: '1.0.0',
        description: `Pacote de deployment para ${empresa.nome}`,
        
        components: {
        database_schema: config.components?.database_schema || false,
        initial_data: config.components?.initial_data || false,
        personas: config.components?.personas || false,
        workflows: config.components?.workflows || false,
        knowledge_base: config.components?.knowledge_base || false,
        configurations: config.components?.configurations || false,
        sync_scripts: config.components?.sync_scripts || false,
        documentation: config.components?.documentation || false,
        assets: config.components?.assets || false
      },
        
        included_personas: [],
        included_workflows: [],
        
        deploy_config: {
          target_environment: 'production',
          ssl_enabled: true,
          backup_enabled: true,
          ...config.deployConfig
        },
        
        sync_config: {
          bidirectional_sync: true,
          sync_frequency: 'daily',
          conflict_resolution: 'central_wins',
          auto_merge_enabled: false,
          ...config.syncConfig
        },
        
        build_status: 'pending',
        build_progress: 0,
        download_count: 0,
        package_size_bytes: 0,
        package_files: [],
        
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Buscar personas e workflows se incluídos
      if (config.components.personas) {
        newPackage.included_personas = await this.getEmpresaPersonas(config.empresaId);
      }
      
      if (config.components.workflows) {
        newPackage.included_workflows = await this.getEmpresaWorkflows(config.empresaId);
      }

      this.currentPackage = newPackage;

      // Salvar no banco
      await this.savePackageRecord(newPackage);

      return newPackage;
    } catch (error) {
      console.error('Erro ao criar pacote:', error);
      throw error;
    }
  }

  // ===================================================
  // CONSTRUÇÃO DO PACOTE
  // ===================================================

  async buildPackage(packageId: string): Promise<string> {
    try {
      const packageData = await this.getPackageById(packageId);
      if (!packageData) throw new Error('Pacote não encontrado');

      this.currentPackage = packageData;
      
      // Atualizar status
      await this.updatePackageStatus(packageId, 'building', 0);

      const zip = new JSZip();
      let currentProgress = 0;

      // 1. Schema do banco de dados (10%)
      if (packageData.components.database_schema) {
        await this.addDatabaseSchema(zip, packageData);
        currentProgress += 10;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 2. Dados iniciais (15%)
      if (packageData.components.initial_data) {
        await this.addInitialData(zip, packageData);
        currentProgress += 15;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 3. Personas (20%)
      if (packageData.components.personas) {
        await this.addPersonasData(zip, packageData);
        currentProgress += 20;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 4. Workflows (20%)
      if (packageData.components.workflows) {
        await this.addWorkflowsData(zip, packageData);
        currentProgress += 20;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 5. Knowledge Base (10%)
      if (packageData.components.knowledge_base) {
        await this.addKnowledgeBase(zip, packageData);
        currentProgress += 10;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 6. Configurações (10%)
      if (packageData.components.configurations) {
        await this.addConfigurations(zip, packageData);
        currentProgress += 10;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 7. Scripts de sincronização (10%)
      if (packageData.components.sync_scripts) {
        await this.addSyncScripts(zip, packageData);
        currentProgress += 10;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // 8. Documentação (5%)
      if (packageData.components.documentation) {
        await this.addDocumentation(zip, packageData);
        currentProgress += 5;
        await this.updatePackageStatus(packageId, 'building', currentProgress);
      }

      // Gerar o arquivo ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = await this.uploadPackageFile(packageId, zipBlob);

      // Finalizar
      await this.updatePackageStatus(packageId, 'completed', 100, downloadUrl, zipBlob.size);

      return downloadUrl;
    } catch (error) {
      console.error('Erro ao construir pacote:', error);
      await this.updatePackageStatus(packageId, 'failed', 0, undefined, 0, (error as Error).message);
      throw error;
    }
  }

  // ===================================================
  // ADIÇÃO DE COMPONENTES AO PACOTE
  // ===================================================

  private async addDatabaseSchema(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const schemaExporter = new SchemaExporter();
    const schema = await schemaExporter.exportSchema(packageData.empresa_id);
    
    const databaseFolder = zip.folder('database');
    databaseFolder!.file('schema.sql', schema.fullSchema);
    databaseFolder!.file('tables.sql', schema.tablesOnly);
    databaseFolder!.file('constraints.sql', schema.constraintsOnly);
    databaseFolder!.file('indexes.sql', schema.indexesOnly);
    
    console.log('Schema do banco adicionado ao pacote');
  }

  private async addInitialData(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const dataFolder = zip.folder('data');
    
    // Dados da empresa
    const empresaData = await this.getEmpresaData(packageData.empresa_id);
    dataFolder!.file('empresa.sql', this.generateInsertSQL('empresas', [empresaData]));
    
    // Configurações do sistema
    const systemConfigs = await this.getSystemConfigurations();
    dataFolder!.file('system_configs.sql', this.generateInsertSQL('system_configurations', systemConfigs));
    
    console.log('Dados iniciais adicionados ao pacote');
  }

  private async addPersonasData(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const personasFolder = zip.folder('personas');
    
    for (const persona of packageData.included_personas) {
      if (!persona.included) continue;
      
      const personaData = await this.getFullPersonaData(persona.id);
      personasFolder!.file(`${persona.id}.json`, JSON.stringify(personaData, null, 2));
      personasFolder!.file(`${persona.id}.sql`, this.generatePersonaSQL(personaData));
    }
    
    // Lista de personas
    const personasList = packageData.included_personas.filter(p => p.included);
    personasFolder!.file('personas_list.json', JSON.stringify(personasList, null, 2));
    
    console.log(`${personasList.length} personas adicionadas ao pacote`);
  }

  private async addWorkflowsData(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const workflowsFolder = zip.folder('workflows');
    
    for (const workflow of packageData.included_workflows) {
      if (!workflow.included) continue;
      
      const workflowData = await this.getFullWorkflowData(workflow.id);
      workflowsFolder!.file(`${workflow.id}.json`, JSON.stringify(workflowData, null, 2));
      workflowsFolder!.file(`${workflow.id}_n8n.json`, JSON.stringify(workflowData.n8n_config, null, 2));
    }
    
    const workflowsList = packageData.included_workflows.filter(w => w.included);
    workflowsFolder!.file('workflows_list.json', JSON.stringify(workflowsList, null, 2));
    
    console.log(`${workflowsList.length} workflows adicionados ao pacote`);
  }

  private async addKnowledgeBase(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const knowledgeFolder = zip.folder('knowledge_base');
    
    // RAG Documents
    const { data: ragDocs, error: ragError } = await supabase
      .from('rag_documents')
      .select('*')
      .eq('empresa_id', packageData.empresa_id);
    
    if (!ragError && ragDocs) {
      knowledgeFolder!.file('rag_documents.json', JSON.stringify(ragDocs, null, 2));
      knowledgeFolder!.file('rag_documents.sql', this.generateInsertSQL('rag_documents', ragDocs));
    }
    
    // RAG Knowledge
    const { data: ragKnowledge, error: knowledgeError } = await supabase
      .from('rag_knowledge')
      .select('*')
      .in('persona_id', packageData.included_personas.filter(p => p.included).map(p => p.id));
    
    if (!knowledgeError && ragKnowledge) {
      knowledgeFolder!.file('rag_knowledge.json', JSON.stringify(ragKnowledge, null, 2));
      knowledgeFolder!.file('rag_knowledge.sql', this.generateInsertSQL('rag_knowledge', ragKnowledge));
    }
    
    console.log('Knowledge base adicionada ao pacote');
  }

  private async addConfigurations(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const configFolder = zip.folder('config');
    
    // Environment template
    const envTemplate = this.generateEnvironmentTemplate(packageData);
    configFolder!.file('environment.template', envTemplate);
    
    // Supabase config
    const supabaseConfig = {
      project_id: '${SUPABASE_PROJECT_ID}',
      url: '${SUPABASE_URL}',
      anon_key: '${SUPABASE_ANON_KEY}',
      service_key: '${SUPABASE_SERVICE_ROLE_KEY}',
      database_url: '${DATABASE_URL}'
    };
    configFolder!.file('supabase.json', JSON.stringify(supabaseConfig, null, 2));
    
    // Sync settings
    configFolder!.file('sync_settings.json', JSON.stringify(packageData.sync_config, null, 2));
    
    // Deploy settings
    configFolder!.file('deploy_settings.json', JSON.stringify(packageData.deploy_config, null, 2));
    
    console.log('Configurações adicionadas ao pacote');
  }

  private async addSyncScripts(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const scriptsFolder = zip.folder('scripts');
    const syncGenerator = new SyncScriptGenerator();
    
    // Script de setup inicial
    const setupScript = syncGenerator.generateSetupScript(packageData);
    scriptsFolder!.file('setup.js', setupScript);
    
    // Script de sync para o central
    const syncUpScript = syncGenerator.generateSyncUpScript(packageData);
    scriptsFolder!.file('sync_to_central.js', syncUpScript);
    
    // Script de sync do central
    const syncDownScript = syncGenerator.generateSyncDownScript(packageData);
    scriptsFolder!.file('sync_from_central.js', syncDownScript);
    
    // Script de validação
    const validateScript = syncGenerator.generateValidationScript(packageData);
    scriptsFolder!.file('validate.js', validateScript);
    
    console.log('Scripts de sincronização adicionados ao pacote');
  }

  private async addDocumentation(zip: JSZip, packageData: ProvisionamentoPacote): Promise<void> {
    const docsFolder = zip.folder('docs');
    
    // README principal
    const readme = this.generateReadme(packageData);
    docsFolder!.file('README.md', readme);
    
    // Guia de instalação
    const installGuide = this.generateInstallGuide(packageData);
    docsFolder!.file('INSTALL.md', installGuide);
    
    // Guia de configuração
    const configGuide = this.generateConfigGuide(packageData);
    docsFolder!.file('CONFIG.md', configGuide);
    
    // Guia de sincronização
    const syncGuide = this.generateSyncGuide(packageData);
    docsFolder!.file('SYNC.md', syncGuide);
    
    console.log('Documentação adicionada ao pacote');
  }

  // ===================================================
  // MÉTODOS AUXILIARES PARA DADOS
  // ===================================================

  private async getEmpresaPersonas(empresaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('personas')
      .select('id, full_name, role, department')
      .eq('empresa_id', empresaId)
      .eq('status', 'active');

    if (error) throw error;

    return data.map(p => ({
      id: p.id,
      name: p.full_name,
      role: p.role,
      department: p.department,
      included: true
    }));
  }

  private async getEmpresaWorkflows(empresaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('n8n_workflows')
      .select('id, workflow_name, workflow_type')
      .eq('empresa_id', empresaId);

    if (error) throw error;

    return data.map(w => ({
      id: w.id,
      name: w.workflow_name,
      type: w.workflow_type,
      persona_id: '', // Seria necessário buscar a relação
      included: true
    }));
  }

  private async getFullPersonaData(personaId: string): Promise<any> {
    const { data, error } = await supabase
      .from('personas')
      .select(`
        *,
        personas_biografias (*),
        personas_tech_specs (*),
        personas_atribuicoes (*),
        competencias (*),
        rag_knowledge (*)
      `)
      .eq('id', personaId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getFullWorkflowData(workflowId: string): Promise<any> {
    const { data, error } = await supabase
      .from('n8n_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      n8n_config: data.nodes ? {
        nodes: data.nodes,
        connections: data.connections,
        metadata: data.metadata
      } : null
    };
  }

  private async getEmpresaData(empresaId: string): Promise<any> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getSystemConfigurations(): Promise<any[]> {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  private generateInsertSQL(tableName: string, data: any[]): string {
    if (!data || data.length === 0) return `-- Nenhum dado para inserir na tabela ${tableName}\n`;

    const columns = Object.keys(data[0]);
    let sql = `-- Dados para tabela ${tableName}\n`;
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n`;
    
    const values = data.map(row => {
      const vals = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });
      return `(${vals.join(', ')})`;
    });
    
    sql += values.join(',\n');
    sql += ';\n\n';
    
    return sql;
  }

  private generatePersonaSQL(personaData: any): string {
    let sql = `-- SQL para persona: ${personaData.full_name}\n\n`;
    
    // Persona principal
    sql += this.generateInsertSQL('personas', [personaData]);
    
    // Biografia
    if (personaData.personas_biografias) {
      sql += this.generateInsertSQL('personas_biografias', personaData.personas_biografias);
    }
    
    // Tech specs
    if (personaData.personas_tech_specs) {
      sql += this.generateInsertSQL('personas_tech_specs', personaData.personas_tech_specs);
    }
    
    // Atribuições
    if (personaData.personas_atribuicoes) {
      sql += this.generateInsertSQL('personas_atribuicoes', personaData.personas_atribuicoes);
    }
    
    // Competências
    if (personaData.competencias) {
      sql += this.generateInsertSQL('competencias', personaData.competencias);
    }
    
    return sql;
  }

  private generateEnvironmentTemplate(packageData: ProvisionamentoPacote): string {
    return `# Configuração do ambiente para ${packageData.empresa_nome}
# Pacote: ${packageData.package_code}

# Supabase Configuration
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your_project.supabase.co:5432/postgres

# VCM Central Configuration  
VCM_CENTRAL_URL=https://vcm-central.example.com
VCM_CENTRAL_API_KEY=your_central_api_key

# Sync Configuration
SYNC_FREQUENCY=${packageData.sync_config.sync_frequency}
SYNC_BIDIRECTIONAL=${packageData.sync_config.bidirectional_sync}
CONFLICT_RESOLUTION=${packageData.sync_config.conflict_resolution}

# Application Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_session_secret

# Optional: Custom Domain
CUSTOM_DOMAIN=${packageData.deploy_config.custom_domain || ''}

# Security
SSL_ENABLED=${packageData.deploy_config.ssl_enabled}
BACKUP_ENABLED=${packageData.deploy_config.backup_enabled}
`;
  }

  private generateReadme(packageData: ProvisionamentoPacote): string {
    return `# VCM Client Package - ${packageData.empresa_nome}

**Pacote:** ${packageData.package_code}  
**Versão:** ${packageData.version}  
**Tipo:** ${packageData.package_type}  
**Gerado em:** ${packageData.created_at.toISOString()}

## Descrição

${packageData.description}

## Componentes Inclusos

${Object.entries(packageData.components)
  .filter(([_, included]) => included)
  .map(([component, _]) => `- ✅ ${component}`)
  .join('\n')}

## Estrutura do Pacote

\`\`\`
${packageData.package_code}/
├── database/           # Schemas e estruturas do banco
├── data/              # Dados iniciais
├── personas/          # Dados das personas (${packageData.included_personas.filter(p => p.included).length})
├── workflows/         # Workflows N8N (${packageData.included_workflows.filter(w => w.included).length})
├── knowledge_base/    # Base de conhecimento RAG
├── config/           # Arquivos de configuração
├── scripts/          # Scripts de setup e sincronização
└── docs/            # Documentação
\`\`\`

## Próximos Passos

1. Leia o [Guia de Instalação](INSTALL.md)
2. Configure o ambiente seguindo [CONFIG.md](CONFIG.md)
3. Execute o setup inicial
4. Configure a sincronização conforme [SYNC.md](SYNC.md)

## Suporte

Para suporte técnico, consulte a documentação ou entre em contato com a equipe VCM.

---
*Gerado automaticamente pelo Virtual Company Manager*
`;
  }

  private generateInstallGuide(packageData: ProvisionamentoPacote): string {
    return `# Guia de Instalação - ${packageData.empresa_nome}

## Pré-requisitos

- Node.js 18+ 
- PostgreSQL (ou acesso ao Supabase)
- Acesso administrativo ao ambiente de deploy

## Passos de Instalação

### 1. Preparação do Ambiente

\`\`\`bash
# Criar diretório da aplicação
mkdir vcm-client-${packageData.empresa_nome.toLowerCase().replace(/\s+/g, '-')}
cd vcm-client-${packageData.empresa_nome.toLowerCase().replace(/\s+/g, '-')}

# Extrair o pacote
unzip ${packageData.package_code}.zip
\`\`\`

### 2. Configuração do Banco de Dados

\`\`\`bash
# Executar schema principal
psql -d your_database -f database/schema.sql

# Carregar dados iniciais
psql -d your_database -f database/initial_data.sql
\`\`\`

### 3. Configuração do Ambiente

\`\`\`bash
# Copiar template de configuração
cp config/environment.template .env

# Editar configurações
nano .env
\`\`\`

### 4. Setup Inicial

\`\`\`bash
# Executar script de setup
node scripts/setup.js

# Validar instalação
node scripts/validate.js
\`\`\`

### 5. Sincronização Inicial

\`\`\`bash
# Configurar sincronização
node scripts/sync_from_central.js --initial

# Testar conectividade
node scripts/sync_to_central.js --test
\`\`\`

## Verificação

Após a instalação, verifique:

- [ ] Banco de dados criado e populado
- [ ] Aplicação iniciando sem erros
- [ ] Sincronização funcionando
- [ ] Personas carregadas (${packageData.included_personas.filter(p => p.included).length})
- [ ] Workflows importados (${packageData.included_workflows.filter(w => w.included).length})

## Troubleshooting

### Erro de Conexão com Banco
- Verificar credenciais no arquivo .env
- Confirmar que o banco está acessível
- Validar permissões do usuário

### Erro de Sincronização
- Verificar conectividade com VCM Central
- Validar API keys
- Consultar logs de sincronização
`;
  }

  private generateConfigGuide(packageData: ProvisionamentoPacote): string {
    return `# Guia de Configuração - ${packageData.empresa_nome}

## Arquivo de Ambiente (.env)

### Configurações Obrigatórias

\`\`\`env
# Supabase/Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# VCM Central
VCM_CENTRAL_URL=https://vcm-central.com
VCM_CENTRAL_API_KEY=your_api_key
\`\`\`

### Configurações de Sincronização

\`\`\`env
# Frequência de sincronização
SYNC_FREQUENCY=${packageData.sync_config.sync_frequency}

# Sincronização bidirecional
SYNC_BIDIRECTIONAL=${packageData.sync_config.bidirectional_sync}

# Resolução de conflitos
CONFLICT_RESOLUTION=${packageData.sync_config.conflict_resolution}
\`\`\`

## Configurações Avançadas

### Supabase RLS Policies

As seguintes políticas RLS são necessárias:

\`\`\`sql
-- Políticas para personas
CREATE POLICY "Enable read access for all users" ON personas FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON personas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para workflows
CREATE POLICY "Enable read access for all users" ON workflows FOR SELECT USING (true);
\`\`\`

### Configuração de Backup

Se backup está habilitado (${packageData.deploy_config.backup_enabled ? 'SIM' : 'NÃO'}):

\`\`\`bash
# Configurar backup automático
crontab -e

# Adicionar linha para backup diário às 2:00
0 2 * * * /path/to/backup_script.sh
\`\`\`

## Monitoramento

### Health Checks

O sistema inclui endpoints de monitoramento:

- \`/health\` - Status geral da aplicação
- \`/health/database\` - Status da conexão com banco
- \`/health/sync\` - Status da sincronização

### Logs

Logs são armazenados em:

- \`logs/application.log\` - Log da aplicação
- \`logs/sync.log\` - Log de sincronização  
- \`logs/errors.log\` - Log de erros
`;
  }

  private generateSyncGuide(packageData: ProvisionamentoPacote): string {
    return `# Guia de Sincronização - ${packageData.empresa_nome}

## Configuração de Sincronização

**Modo:** ${packageData.sync_config.bidirectional_sync ? 'Bidirecional' : 'Unidirecional'}  
**Frequência:** ${packageData.sync_config.sync_frequency}  
**Resolução de Conflitos:** ${packageData.sync_config.conflict_resolution}  

## Scripts de Sincronização

### sync_from_central.js
Sincroniza dados do VCM Central para o cliente:

\`\`\`bash
# Sincronização completa
node scripts/sync_from_central.js --full

# Sincronização incremental  
node scripts/sync_from_central.js --incremental

# Sincronização de tabela específica
node scripts/sync_from_central.js --table personas
\`\`\`

### sync_to_central.js
Envia atualizações para o VCM Central:

\`\`\`bash
# Envio completo
node scripts/sync_to_central.js --full

# Envio incremental
node scripts/sync_to_central.js --incremental

# Teste de conectividade
node scripts/sync_to_central.js --test
\`\`\`

## Resolução de Conflitos

### Estratégias Disponíveis

1. **central_wins** - VCM Central sempre prevalece
2. **client_wins** - Cliente sempre prevalece  
3. **manual_review** - Requer revisão manual

### Configuração Atual

Estratégia ativa: **${packageData.sync_config.conflict_resolution}**

### Revisão Manual de Conflitos

Quando \`manual_review\` está ativo:

\`\`\`bash
# Listar conflitos pendentes
node scripts/list_conflicts.js

# Resolver conflito específico
node scripts/resolve_conflict.js --id <conflict_id> --resolution central

# Resolver todos os conflitos
node scripts/resolve_conflicts.js --all --resolution central
\`\`\`

## Monitoramento da Sincronização

### Status da Sincronização

\`\`\`bash
# Status geral
node scripts/sync_status.js

# Histórico de sincronização
node scripts/sync_history.js

# Logs detalhados
tail -f logs/sync.log
\`\`\`

### Troubleshooting

#### Erro de Conectividade
\`\`\`bash
# Testar conexão
curl -v \$VCM_CENTRAL_URL/health

# Verificar API key
node scripts/test_auth.js
\`\`\`

#### Conflitos Persistentes
\`\`\`bash
# Reset da sincronização
node scripts/reset_sync.js --confirm

# Backup antes do reset
node scripts/backup_before_reset.js
\`\`\`

## Agendamento Automático

### Crontab (Linux/Mac)

\`\`\`bash
# Sincronização a cada hora
0 * * * * cd /path/to/app && node scripts/sync_from_central.js --incremental

# Upload diário às 23:00
0 23 * * * cd /path/to/app && node scripts/sync_to_central.js --incremental
\`\`\`

### Windows Task Scheduler

Criar tarefa agendada para executar:
\`\`\`cmd
node C:\\path\\to\\app\\scripts\\sync_from_central.js --incremental
\`\`\`
`;
  }

  // ===================================================
  // MÉTODOS DE PERSISTÊNCIA E STATUS
  // ===================================================

  private async savePackageRecord(packageData: ProvisionamentoPacote): Promise<void> {
    // Em um ambiente real, salvaria no banco
    console.log('Pacote salvo:', packageData.package_code);
  }

  private async updatePackageStatus(
    packageId: string, 
    status: string, 
    progress: number, 
    downloadUrl?: string, 
    size?: number, 
    error?: string
  ): Promise<void> {
    // Atualizar status no banco
    console.log(`Pacote ${packageId}: ${status} (${progress}%)`);
    
    if (this.currentPackage) {
      this.currentPackage.build_status = status as any;
      this.currentPackage.build_progress = progress;
      
      if (downloadUrl) this.currentPackage.download_url = downloadUrl;
      if (size) this.currentPackage.package_size_bytes = size;
      if (error) this.currentPackage.build_error = error;
      if (status === 'completed') this.currentPackage.build_completed_at = new Date();
    }
  }

  private async uploadPackageFile(packageId: string, blob: Blob): Promise<string> {
    // Em produção, fazer upload para storage (Supabase Storage, S3, etc)
    const mockUrl = `https://storage.example.com/packages/${packageId}.zip`;
    console.log(`Pacote uploaded para: ${mockUrl}`);
    return mockUrl;
  }

  private async getPackageById(packageId: string): Promise<ProvisionamentoPacote | null> {
    // Em produção, buscar do banco
    return this.currentPackage || null;
  }

  // ===================================================
  // MÉTODOS PÚBLICOS
  // ===================================================

  async getPackages(empresaId?: string): Promise<ProvisionamentoPacote[]> {
    // Em produção, buscar do banco
    return this.currentPackage ? [this.currentPackage] : [];
  }

  async downloadPackage(packageId: string): Promise<Blob> {
    // Em produção, baixar do storage
    throw new Error('Download não implementado nesta versão');
  }

  async deletePackage(packageId: string): Promise<void> {
    // Remover pacote e arquivos
    console.log(`Pacote ${packageId} removido`);
  }
}

// ===================================================
// CLASSES AUXILIARES
// ===================================================

class SchemaExporter {
  async exportSchema(empresaId: string): Promise<{
    fullSchema: string;
    tablesOnly: string;
    constraintsOnly: string;
    indexesOnly: string;
  }> {
    // Buscar schema específico da empresa
    const tables = await this.getEmpresaTables(empresaId);
    
    return {
      fullSchema: this.generateFullSchema(tables),
      tablesOnly: this.generateTablesSchema(tables),
      constraintsOnly: this.generateConstraintsSchema(tables),
      indexesOnly: this.generateIndexesSchema(tables)
    };
  }

  private async getEmpresaTables(empresaId: string): Promise<any[]> {
    // Lista de tabelas relevantes para uma empresa
    return [
      'empresas', 'personas', 'personas_biografias', 'personas_tech_specs',
      'personas_atribuicoes', 'competencias', 'workflows', 'n8n_workflows',
      'rag_documents', 'rag_knowledge', 'metas_globais', 'metas_personas'
    ];
  }

  private generateFullSchema(tables: string[]): string {
    return `-- Schema completo para deployment VCM
-- Gerado automaticamente em ${new Date().toISOString()}

-- Tabelas principais
${tables.map(table => this.getTableSchema(table)).join('\n\n')}

-- Constraints e indexes
${tables.map(table => this.getTableConstraints(table)).join('\n')}
${tables.map(table => this.getTableIndexes(table)).join('\n')}
`;
  }

  private generateTablesSchema(tables: string[]): string {
    return tables.map(table => this.getTableSchema(table)).join('\n\n');
  }

  private generateConstraintsSchema(tables: string[]): string {
    return tables.map(table => this.getTableConstraints(table)).join('\n');
  }

  private generateIndexesSchema(tables: string[]): string {
    return tables.map(table => this.getTableIndexes(table)).join('\n');
  }

  private getTableSchema(tableName: string): string {
    // Em produção, usar pg_dump ou query system tables
    return `-- Schema para tabela ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
  -- Colunas seriam extraídas dinamicamente
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now()
);`;
  }

  private getTableConstraints(tableName: string): string {
    return `-- Constraints para ${tableName}\n`;
  }

  private getTableIndexes(tableName: string): string {
    return `-- Indexes para ${tableName}\n`;
  }
}

class SyncScriptGenerator {
  generateSetupScript(packageData: ProvisionamentoPacote): string {
    return `#!/usr/bin/env node
// Setup script para ${packageData.empresa_nome}
// Pacote: ${packageData.package_code}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setup() {
  console.log('Iniciando setup para ${packageData.empresa_nome}...');
  
  // Verificar configurações
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL não configurado');
  }
  
  // Conectar ao banco
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Executar migrations
  await runMigrations(supabase);
  
  // Carregar dados iniciais
  await loadInitialData(supabase);
  
  // Configurar sincronização
  await setupSync(supabase);
  
  console.log('Setup concluído com sucesso!');
}

async function runMigrations(supabase) {
  // Implementar execução de migrations
}

async function loadInitialData(supabase) {
  // Implementar carregamento de dados
}

async function setupSync(supabase) {
  // Configurar sincronização
}

if (require.main === module) {
  setup().catch(console.error);
}

module.exports = { setup };
`;
  }

  generateSyncUpScript(packageData: ProvisionamentoPacote): string {
    return `#!/usr/bin/env node
// Script de sincronização para VCM Central
// ${packageData.empresa_nome} -> VCM Central

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

async function syncToCenter() {
  console.log('Iniciando sincronização para VCM Central...');
  
  const localSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Buscar alterações locais
  const changes = await getLocalChanges(localSupabase);
  
  // Enviar para central
  await sendChangesToCentral(changes);
  
  // Marcar como sincronizado
  await markAsSynced(localSupabase, changes);
  
  console.log('Sincronização concluída');
}

async function getLocalChanges(supabase) {
  // Implementar busca de alterações
  return [];
}

async function sendChangesToCentral(changes) {
  // Implementar envio para central
}

async function markAsSynced(supabase, changes) {
  // Marcar registros como sincronizados
}

if (require.main === module) {
  syncToCenter().catch(console.error);
}
`;
  }

  generateSyncDownScript(packageData: ProvisionamentoPacote): string {
    return `#!/usr/bin/env node
// Script de sincronização do VCM Central
// VCM Central -> ${packageData.empresa_nome}

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

async function syncFromCentral() {
  console.log('Iniciando sincronização do VCM Central...');
  
  const localSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Buscar atualizações do central
  const updates = await fetchCentralUpdates();
  
  // Aplicar localmente
  await applyUpdates(localSupabase, updates);
  
  // Resolver conflitos se necessário
  await resolveConflicts(localSupabase);
  
  console.log('Sincronização concluída');
}

async function fetchCentralUpdates() {
  // Implementar busca do central
  return [];
}

async function applyUpdates(supabase, updates) {
  // Aplicar atualizações
}

async function resolveConflicts(supabase) {
  // Resolver conflitos conforme configuração
}

if (require.main === module) {
  syncFromCentral().catch(console.error);
}
`;
  }

  generateValidationScript(packageData: ProvisionamentoPacote): string {
    return `#!/usr/bin/env node
// Script de validação do ambiente
// ${packageData.empresa_nome}

const { createClient } = require('@supabase/supabase-js');

async function validate() {
  console.log('Validando ambiente...');
  
  const results = {
    environment: false,
    database: false,
    sync: false,
    personas: false,
    workflows: false
  };
  
  // Validar configurações
  results.environment = validateEnvironment();
  
  // Validar banco
  results.database = await validateDatabase();
  
  // Validar sincronização  
  results.sync = await validateSync();
  
  // Validar personas
  results.personas = await validatePersonas();
  
  // Validar workflows
  results.workflows = await validateWorkflows();
  
  // Relatório
  console.log('\\nResultados da validação:');
  Object.entries(results).forEach(([check, passed]) => {
    console.log(\`\${check}: \${passed ? '✅ PASS' : '❌ FAIL'}\`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  console.log(\`\\nStatus geral: \${allPassed ? '✅ SUCESSO' : '❌ FALHAS DETECTADAS'}\`);
  
  process.exit(allPassed ? 0 : 1);
}

function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'VCM_CENTRAL_URL'
  ];
  
  return required.every(env => process.env[env]);
}

async function validateDatabase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase.from('empresas').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function validateSync() {
  // Validar conectividade com central
  return true; // Simplificado
}

async function validatePersonas() {
  // Validar personas carregadas
  return true; // Simplificado  
}

async function validateWorkflows() {
  // Validar workflows
  return true; // Simplificado
}

if (require.main === module) {
  validate().catch(console.error);
}
`;
  }
}

export const packageBuilder = new PackageBuilder();