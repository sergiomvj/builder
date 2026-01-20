# Guia de Implementação - Dashboard VCM

## 🚀 Fases de Desenvolvimento

### Fase 1: Setup e Infraestrutura (Sprint 1)
**Duração**: 3-5 dias  
**Objetivo**: Preparar a base técnica do projeto

#### Tarefas:
- [ ] **Setup do Projeto Vite + React + TypeScript**
  ```bash
  npm create vite@latest vcm-dashboard -- --template react-ts
  cd vcm-dashboard
  npm install
  ```

- [ ] **Configuração do Tailwind CSS + shadcn/ui**
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  npx shadcn-ui@latest init
  ```

- [ ] **Dependências Principais**
  ```bash
  # Core dependencies
  npm install @supabase/supabase-js
  npm install @tanstack/react-query
  npm install zustand
  npm install react-hook-form @hookform/resolvers
  npm install zod
  npm install react-router-dom
  npm install lucide-react
  npm install sonner # Para toast notifications
  
  # shadcn/ui components
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add table
  npx shadcn-ui@latest add form
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add dropdown-menu
  npx shadcn-ui@latest add avatar
  npx shadcn-ui@latest add badge
  npx shadcn-ui@latest add sheet
  ```

- [ ] **Configuração do Supabase**
  ```typescript
  // .env.local
  VITE_VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
  VITE_VCM_SUPABASE_ANON_KEY=your_anon_key_here
  ```

- [ ] **Estrutura de Pastas**
  ```
  src/
  ├── components/ui/       # shadcn/ui components
  ├── components/layout/   # Layout components
  ├── components/common/   # Shared components
  ├── pages/              # Route pages
  ├── hooks/              # Custom hooks
  ├── lib/                # Utilities & APIs
  ├── types/              # TypeScript types
  ├── stores/             # Zustand stores
  └── styles/             # CSS files
  ```

#### Entregáveis:
- ✅ Projeto configurado e rodando
- ✅ Routing básico implementado
- ✅ Conexão com Supabase funcionando
- ✅ Layout base (Header + Sidebar)

---

### Fase 2: Schema e Autenticação (Sprint 2)
**Duração**: 3-4 dias  
**Objetivo**: Implementar banco VCM Central e sistema de auth

#### Tarefas:
- [ ] **Criar Schema VCM Central no Supabase**
  - Executar script de criação das tabelas
  - Configurar Row Level Security (RLS)
  - Inserir dados de seed (templates, configurações)

- [ ] **Implementar Autenticação**
  ```typescript
  // lib/auth.ts
  export const auth = {
    signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    getCurrentUser: () => supabase.auth.getUser()
  }
  ```

- [ ] **Context/Store de Autenticação**
  ```typescript
  // stores/authStore.ts
  interface AuthState {
    user: User | null
    isLoading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
  }
  ```

- [ ] **Rotas Protegidas**
  ```typescript
  // components/ProtectedRoute.tsx
  export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    
    if (isLoading) return <LoadingSpinner />
    if (!user) return <Navigate to="/login" />
    
    return <>{children}</>
  }
  ```

#### Entregáveis:
- ✅ Schema VCM Central deployado
- ✅ Sistema de login/logout funcionando
- ✅ Proteção de rotas implementada
- ✅ Estado de autenticação global

---

### Fase 3: Gestão de Empresas (Sprint 3)
**Duração**: 5-7 dias  
**Objetivo**: CRUD completo de empresas virtuais

#### Tarefas:
- [ ] **API Layer para Empresas**
  ```typescript
  // lib/api/empresas.ts
  export const empresasAPI = {
    getAll: () => supabase.from('empresas_virtuais').select('*'),
    getById: (id: string) => supabase.from('empresas_virtuais').select('*').eq('id', id).single(),
    create: (data: CreateEmpresa) => supabase.from('empresas_virtuais').insert(data),
    update: (id: string, data: UpdateEmpresa) => supabase.from('empresas_virtuais').update(data).eq('id', id),
    delete: (id: string) => supabase.from('empresas_virtuais').delete().eq('id', id)
  }
  ```

- [ ] **Componentes de Empresa**
  - `EmpresaCard.tsx` - Card para listar empresas
  - `EmpresaForm.tsx` - Formulário para criar/editar
  - `EmpresaList.tsx` - Lista completa com filtros
  - `TestConnection.tsx` - Testar conexão Supabase

- [ ] **Página de Empresas**
  ```typescript
  // pages/Empresas.tsx
  export function Empresas() {
    const { data: empresas, isLoading } = useEmpresas()
    const createEmpresa = useCreateEmpresa()
    
    return (
      <div className="space-y-6">
        <PageHeader title="Empresas Virtuais" />
        <EmpresaList empresas={empresas} />
        <EmpresaForm onSubmit={createEmpresa.mutate} />
      </div>
    )
  }
  ```

- [ ] **Hooks Customizados**
  - `useEmpresas()` - Buscar todas as empresas
  - `useEmpresa(id)` - Buscar empresa específica
  - `useCreateEmpresa()` - Criar nova empresa
  - `useUpdateEmpresa()` - Atualizar empresa

#### Entregáveis:
- ✅ CRUD de empresas funcionando
- ✅ Validação de formulários
- ✅ Teste de conexão Supabase
- ✅ Lista e cards de empresas

---

### Fase 4: Dashboard Principal (Sprint 4)
**Duração**: 4-5 dias  
**Objetivo**: Página principal com métricas e overview

#### Tarefas:
- [ ] **Componentes de Métricas**
  ```typescript
  // components/MetricCard.tsx
  interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    color: 'blue' | 'green' | 'yellow' | 'red'
    trend?: { value: number; label: string }
  }
  ```

- [ ] **Dashboard Overview**
  - Total de empresas virtuais
  - Total de personas (soma de todas as empresas)
  - Status de sincronização global
  - Atividade recente

- [ ] **Gráficos e Visualizações**
  ```bash
  npm install recharts # Para gráficos
  ```

- [ ] **Componente de Atividade Recente**
  - Log das últimas sincronizações
  - Empresas criadas recentemente
  - Ações dos usuários

#### Entregáveis:
- ✅ Dashboard principal funcional
- ✅ Métricas em tempo real
- ✅ Gráficos básicos
- ✅ Feed de atividades

---

### Fase 5: Sistema de Sincronização (Sprint 5)
**Duração**: 6-8 dias  
**Objetivo**: Implementar sincronização bidirecional

#### Tarefas:
- [ ] **Multi-Database Client**
  ```typescript
  // lib/api/multi-db.ts
  export class MultiDBClient {
    private clients = new Map<string, SupabaseClient>()
    
    getClient(empresa: Empresa): SupabaseClient {
      if (!this.clients.has(empresa.id)) {
        this.clients.set(empresa.id, createClient(
          empresa.supabase_url,
          empresa.supabase_anon_key
        ))
      }
      return this.clients.get(empresa.id)!
    }
  }
  ```

- [ ] **Sync Engine**
  ```typescript
  // lib/sync/engine.ts
  export class SyncEngine {
    async syncVCMToCompany(empresaId: string): Promise<SyncResult>
    async syncCompanyToVCM(empresaId: string): Promise<SyncResult>
    async bidirectionalSync(empresaId: string): Promise<SyncResult>
    async resolveConflicts(conflicts: SyncConflict[]): Promise<void>
  }
  ```

- [ ] **Componentes de Sync**
  - `SyncStatusIndicator.tsx` - Indicador visual de status
  - `SyncButton.tsx` - Botão para trigger manual
  - `SyncLogs.tsx` - Lista de logs de sincronização
  - `ConflictResolver.tsx` - Interface para resolver conflitos

- [ ] **Real-time Updates**
  ```typescript
  // hooks/useRealtimeSync.ts
  export function useRealtimeSync() {
    useEffect(() => {
      const channel = supabase
        .channel('sync_status')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sync_empresas'
        }, handleSyncUpdate)
        .subscribe()
      
      return () => supabase.removeChannel(channel)
    }, [])
  }
  ```

#### Entregáveis:
- ✅ Sincronização manual funcionando
- ✅ Logs de sincronização visíveis
- ✅ Status em tempo real
- ✅ Resolução básica de conflitos

---

### Fase 6: Gestão de Personas (Sprint 6)
**Duração**: 5-6 dias  
**Objetivo**: Visualizar e gerenciar equipes de personas

#### Tarefas:
- [ ] **API para Personas**
  ```typescript
  // lib/api/personas.ts
  export const personasAPI = {
    getByEmpresa: async (empresaId: string) => {
      const empresa = await empresasAPI.getById(empresaId)
      const client = multiDB.getClient(empresa)
      return client.from('personas').select('*')
    }
  }
  ```

- [ ] **Componentes de Personas**
  - `PersonaCard.tsx` - Card individual de persona
  - `PersonaGrid.tsx` - Grid organizado por categoria
  - `PersonaDetails.tsx` - Modal com detalhes completos
  - `PersonaForm.tsx` - Formulário de edição

- [ ] **Página de Personas**
  ```typescript
  // pages/Personas.tsx
  export function Personas() {
    const { selectedEmpresa } = useEmpresaStore()
    const { data: personas } = usePersonas(selectedEmpresa?.id)
    
    return (
      <div className="space-y-6">
        <PageHeader title="Gestão de Equipes" />
        <EmpresaSelector />
        <PersonaGrid personas={personas} />
      </div>
    )
  }
  ```

- [ ] **Filtros e Busca**
  - Filtro por categoria (executivos, especialistas, assistentes)
  - Busca por nome, role, department
  - Filtro por status de sincronização

#### Entregáveis:
- ✅ Visualização de personas por empresa
- ✅ Organização por categorias
- ✅ Detalhes completos de persona
- ✅ Filtros e busca funcionando

---

### Fase 7: Competências e Workflows (Sprint 7)
**Duração**: 4-5 dias  
**Objetivo**: Gestão de skills e visualização de workflows

#### Tarefas:
- [ ] **Gestão de Competências**
  - Lista de competências por persona
  - Edição de skills e níveis
  - Visualização de competências por categoria

- [ ] **Visualização de Workflows**
  - Lista de workflows N8N por persona
  - Status de execução
  - Métricas básicas

- [ ] **Componentes**
  - `CompetenciaList.tsx`
  - `SkillBadge.tsx`
  - `WorkflowCard.tsx`
  - `WorkflowStatus.tsx`

#### Entregáveis:
- ✅ Gestão de competências
- ✅ Visualização de workflows
- ✅ Métricas básicas

---

### Fase 8: Configurações e Refinamentos (Sprint 8)
**Duração**: 3-4 dias  
**Objetivo**: Configurações globais e melhorias finais

#### Tarefas:
- [ ] **Página de Configurações**
  - Templates de personas
  - Configurações de IA
  - Parâmetros de sincronização
  - Configurações de usuário

- [ ] **Melhorias de UX**
  - Loading states consistentes
  - Error boundaries
  - Toast notifications
  - Confirmações de ações destrutivas

- [ ] **Performance**
  - Code splitting
  - Lazy loading
  - Otimização de queries
  - Caching strategies

- [ ] **Testes**
  ```bash
  npm install -D @testing-library/react @testing-library/jest-dom vitest
  ```

#### Entregáveis:
- ✅ Configurações globais funcionando
- ✅ UX polido e consistente
- ✅ Performance otimizada
- ✅ Testes básicos implementados

---

## 📋 Checklist de Produção

### Pré-Deploy
- [ ] **Variáveis de Ambiente**
  ```bash
  # .env.production
  VITE_VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
  VITE_VCM_SUPABASE_ANON_KEY=production_anon_key
  ```

- [ ] **Build de Produção**
  ```bash
  npm run build
  npm run preview # Testar build localmente
  ```

- [ ] **Otimizações**
  - Bundle size analysis
  - Lighthouse audit
  - Accessibility check
  - SEO básico

### Deploy
- [ ] **Opções de Deploy**
  - Vercel (recomendado para React)
  - Netlify
  - AWS S3 + CloudFront
  - Docker + servidor próprio

- [ ] **Configuração de Domínio**
  - DNS setup
  - SSL certificate
  - Redirects

### Pós-Deploy
- [ ] **Monitoramento**
  - Error tracking (Sentry)
  - Analytics (Google Analytics)
  - Performance monitoring
  - Uptime monitoring

- [ ] **Backup e Segurança**
  - Backup automático do Supabase
  - Rate limiting
  - CORS configuration
  - Security headers

---

## 🛠️ Scripts Úteis

### package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit",
    "analyze": "npm run build && npx vite-bundle-analyzer dist/stats.html"
  }
}
```

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint:fix

# Build para produção
npm run build
```

---

## 📊 Estimativas de Tempo

| Fase | Sprint | Duração | Complexidade |
|------|--------|---------|--------------|
| 1. Setup | Sprint 1 | 3-5 dias | Baixa |
| 2. Auth + Schema | Sprint 2 | 3-4 dias | Média |
| 3. Gestão Empresas | Sprint 3 | 5-7 dias | Média |
| 4. Dashboard | Sprint 4 | 4-5 dias | Média |
| 5. Sincronização | Sprint 5 | 6-8 dias | Alta |
| 6. Gestão Personas | Sprint 6 | 5-6 dias | Média |
| 7. Skills + Workflows | Sprint 7 | 4-5 dias | Média |
| 8. Config + Refinamentos | Sprint 8 | 3-4 dias | Baixa |

**Total Estimado**: 33-44 dias (~6-9 semanas)

---

## 🎯 Próximos Passos

1. **Aprovar a documentação completa**
2. **Configurar ambiente de desenvolvimento**
3. **Iniciar Sprint 1 (Setup e Infraestrutura)**
4. **Revisar progresso semanalmente**
5. **Ajustar cronograma conforme necessário**

Está pronto para começar a implementação? Qual fase gostaria de iniciar primeiro?