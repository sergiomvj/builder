# Dashboard VCM - Visão Geral Completa

## 🎯 Objetivo Principal

Criar um Dashboard web completo em Vite + React + TypeScript + Tailwind + Supabase para gerenciar múltiplas empresas virtuais, suas equipes de personas e toda a infraestrutura do sistema VCM.

## 🏗️ Arquitetura do Sistema

### Dual Database Strategy
```
VCM Central Database (Master)
├── empresas_virtuais           # Registro de todas as empresas
├── templates_personas          # Templates de personas padrão
├── sync_empresas              # Logs de sincronização
├── configuracoes_globais      # Configurações do sistema
└── usuarios_vcm               # Usuários do dashboard

Individual Company Databases (RAG)
├── personas                   # Equipe da empresa (20 personas)
├── competencias              # Skills de cada persona
├── rag_knowledge             # Base de conhecimento
├── workflows                 # Fluxos N8N
└── sync_logs                 # Logs locais de sync
```

### Fluxo de Dados
```
Dashboard VCM → VCM Central → Empresa Virtual → Python Scripts → N8N Workflows
     ↑                                                              ↓
     ← ← ← ← ← ← Sincronização Bidirecional ← ← ← ← ← ← ← ← ← ← ← ←
```

## 📊 Estrutura do Dashboard

### Menu Principal
1. **📊 Dashboard** - Overview e métricas de todas as empresas
2. **🏢 Empresas Virtuais** - CRUD e gestão de empresas
3. **👥 Gestão de Equipes** - Personas por empresa
4. **🎯 Competências** - Skills e níveis por persona
5. **🔄 Workflows** - Fluxos N8N e automações
6. **⚡ Sincronização** - Status e logs de sync
7. **⚙️ Configurações** - Templates e configurações globais

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header (Logo VCM, User Menu, Notifications)    │
├─────────────┬───────────────────────────────────┤
│ Sidebar     │ Main Content Area                 │
│ - Dashboard │ ┌─────────────────────────────────┐ │
│ - Empresas  │ │ Page Header + Actions           │ │
│ - Equipes   │ ├─────────────────────────────────┤ │
│ - Skills    │ │ Content Cards/Tables/Forms      │ │
│ - Workflows │ │                                 │ │
│ - Sync      │ │                                 │ │
│ - Config    │ └─────────────────────────────────┘ │
└─────────────┴───────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend
- **Vite**: Build tool e dev server
- **React 18**: Framework principal
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **Lucide Icons**: Ícones
- **React Query**: Data fetching e cache
- **Zustand**: State management
- **React Hook Form**: Formulários
- **Zod**: Validação de schemas

### Backend/Database
- **Supabase**: Database + Auth + API
- **PostgreSQL**: Database engine
- **Row Level Security**: Segurança de dados
- **Realtime**: Updates em tempo real

### Integração
- **Python Scripts**: Automação existente
- **N8N**: Workflows automatizados
- **OpenAI/Anthropic**: APIs de IA

## 🎨 Design System

### Cores Principais
- **Primary**: Blue-600 (VCM Brand)
- **Secondary**: Gray-500
- **Success**: Green-500 (Sync OK)
- **Warning**: Yellow-500 (Sync Pending)
- **Danger**: Red-500 (Sync Error)

### Componentes Base
- **DataTable**: Tabelas com filtros e paginação
- **StatusBadge**: Status de empresas/personas/sync
- **MetricCard**: Cards de métricas no dashboard
- **SyncIndicator**: Indicador de status de sincronização
- **PersonaCard**: Cards para mostrar personas
- **CompanySelector**: Seletor de empresa ativa

## 📈 Métricas do Dashboard

### Overview Geral
- Total de empresas virtuais ativas
- Total de personas sincronizadas
- Status de sincronização global
- Últimas atividades do sistema

### Por Empresa
- Número de personas ativas
- Status de sincronização
- Última sincronização
- Workflows ativos
- Base de conhecimento (documentos RAG)

## 🔄 Sistema de Sincronização

### Tipos de Sync
1. **Manual**: Triggered pelo usuário
2. **Automático**: Scheduled (configurável)
3. **Real-time**: Updates instantâneos (quando possível)

### Direções de Sync
- **VCM → Empresa**: Deploy de configurações
- **Empresa → VCM**: Backup e consolidação
- **Bidirectional**: Merge inteligente de dados

### Status de Sync
- **✅ Sincronizado**: Dados atualizados
- **🔄 Sincronizando**: Processo em andamento
- **⚠️ Pendente**: Aguardando sincronização
- **❌ Erro**: Falha na sincronização
- **🔒 Bloqueado**: Conflito de dados

## 🚀 Fases de Implementação

### Fase 1: Base Structure
- Setup do projeto Vite + React + TypeScript
- Configuração do Tailwind + shadcn/ui
- Layout básico e navegação
- Conexão com Supabase VCM Central

### Fase 2: Gestão de Empresas
- CRUD de empresas virtuais
- Conexão com bancos individuais
- Validação de credenciais Supabase
- Dashboard overview básico

### Fase 3: Gestão de Personas
- Visualização de equipes por empresa
- CRUD de personas
- Gestão de competências
- Templates de personas

### Fase 4: Sincronização
- Sistema de sync bidirecional
- Logs e monitoring
- Resolução de conflitos
- Sync automático agendado

### Fase 5: Workflows e Avançado
- Visualização de workflows N8N
- Gestão de base RAG
- Configurações avançadas
- Relatórios e analytics

## 📋 Requisitos Funcionais

### Empresas Virtuais
- [ ] Criar nova empresa virtual
- [ ] Conectar empresa existente
- [ ] Editar configurações da empresa
- [ ] Ativar/desativar empresa
- [ ] Excluir empresa (com confirmação)

### Personas
- [ ] Visualizar equipe completa (20 personas)
- [ ] Editar biografia de persona
- [ ] Gerenciar competências
- [ ] Configurar prompts de IA
- [ ] Status individual de sync

### Sincronização
- [ ] Sync manual individual
- [ ] Sync em lote
- [ ] Logs detalhados
- [ ] Retry automático
- [ ] Notificações de status

### Configurações
- [ ] Templates de personas
- [ ] Configurações de IA
- [ ] Parâmetros de sync
- [ ] Configurações globais

## 🔐 Segurança

### Autenticação
- Login via Supabase Auth
- Gestão de usuários VCM
- Roles e permissões

### Autorização
- Row Level Security no Supabase
- Acesso por empresa
- Auditoria de ações

### Dados Sensíveis
- Encryption de chaves Supabase
- Não exposição de service keys no frontend
- Logs de acesso e modificações