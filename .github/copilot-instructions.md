# VCM — Copilot / AI Agent Instructions (concise)

This file gives focused, actionable knowledge for AI coding agents working in this repository.

- Big picture: Next.js 14 full‑stack app (App Router) + Node.js automation scripts in `AUTOMACAO/`.
- Core integrations: Supabase (primary DB), Google Gemini (primary LLM via `@google/generative-ai`), OpenAI (secondary), and Docker for production.

Key places to inspect (examples):
- Frontend / server components: `src/app/` (App Router), API routes in `src/app/api/*`.
- Supabase client / patterns: `src/lib/supabase.ts` (singleton usage). Check `NEXT_PUBLIC_SUPABASE_*` env vars.
- Automation pipeline: 9 sequential scripts from `01_create_personas_from_structure.js` through `09_generate_auditoria.js`. They use the pattern: `node SCRIPT_NAME.js --empresaId=ID`.
- Avatar generation: 3-script pipeline `05a_generate_avatar_prompts.js` → `05b_generate_images_fal.js` → `05c_download_avatares.js` (LLM prompts → Fal.ai images → local storage)
- Outputs and backups: generated JSON and assets are saved under `AUTOMACAO/04_BIOS_PERSONAS_REAL/`, `competencias_output/`, `ml_models_output/`, `auditoria_output/`, etc.

Critical developer workflows (exact commands / examples):
- Local dev server (port 3001):
  - Windows PowerShell: `npm install; npm run dev` (dev server is `next dev -p 3001`).
- Run automation cascade (9 scripts in sequence):
  - `cd AUTOMACAO; node 01_create_personas_from_structure.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17`
  - Then run scripts 02 through 09 in order
  - Scripts expect `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_AI_API_KEY` (Gemini), and `OPENROUTER_API_KEY` in environment.
- Run avatar pipeline (3 scripts after Script 04):
  - `node 05a_generate_avatar_prompts.js --empresaId=ID` (generates physical descriptions via LLM)
  - `node 05b_generate_images_fal.js --empresaId=ID` (generates images via Fal.ai, requires FAL_KEY env var)
  - `node 05c_download_avatares.js --empresaId=ID` (downloads images locally + thumbnails)
- Production build & deploy (Docker):
  - `npm run deploy` (runs build and `docker-compose -f docker-compose.prod.yml up --build -d`).

Project-specific conventions and patterns
- Migration note: Project moved from Vite → Next.js. Expect Next.js idioms (App Router, server components by default).
- UI pattern: `shadcn/ui` + Tailwind CSS; components that are interactive use `'use client'` at the top.
- Data flow: automation scripts write directly to Supabase tables (`personas`, `avatares_personas`, `empresas`) and also write local JSON backups.
- Automation CLI pattern: scripts accept `--empresaId=ID` or fallback to the active company; they update `empresas.scripts_status` to report run state.
- Rate limiting: automation scripts intentionally pause (≈2000ms) between LLM calls — keep this when editing or adding similar scripts.

Integration / security notes
- LLM usage: primary package is `@google/generative-ai` (Gemini). OpenAI is present for specialized tasks (`openai` dependency). Prefer existing script patterns for prompt/response handling.
- Env vars to check: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`.
- Test company: `7761ddfd-0ecc-4a11-95fd-5ee913a6dd17` (ARVA Tech Solutions) is used in automation examples and tests.

Files that frequently contain useful hints and checks
- `Old_Files/check_empresas.js` and `Old_Files/check_persona.js` — quick database inspectors.
- `AUTOMACAO/*` — canonical automation scripts. Use them as references for prompt design, rate limits and DB writes.
- `package.json` scripts: `dev`, `build`, `start`, `deploy`, `health` — use them exactly as defined for consistency.

Best ways an AI agent can help right away
- Small, low-risk fixes: update prompts, add logging, make environment checks explicit, add a tiny unit script to validate env connectivity (Supabase + Gemini key) and run it.
- When adding automation, copy the `--empresaId` CLI parse pattern used in existing scripts (01-09).

When in doubt
- Read `AUTOMACAO/README_ORDEM_CORRETA_SCRIPTS.md` for the complete cascade flow.
- Check `AUTOMACAO/02_generate_biografias_COMPLETO.js` for LLM prompt/DB conventions.
- Prefer non-destructive edits and add tests or a short smoke script that validates dev `npm run dev` and basic Supabase queries.

If anything is unclear or you want more detail in a particular area (database schema, API route examples, or automation templates), tell me which area and I will expand this section with short, exact code pointers and examples.

---
Small change log: replaced older long guidance with this focused, actionable summary to help AI agents get productive faster. Ask for sections to expand.
# Virtual Company Manager (VCM) - AI Coding Agent Instructions

## 🎯 Project Overview & Current State
This is a **Virtual Company Manager** system built on **Next.js 14** that creates autonomous virtual organizations through multi-agent AI assistants. 

**🚨 CRITICAL**: This project has **migrated from Vite/React to Next.js** and is now **100% Node.js-based**.

### 🧠 CORE PHILOSOPHY  
**VCM is fundamentally a system of AI assistant relationships based on multi-agent approach for all business tasks.**

#### Essential Principles:
1. **AUTOMATED + AUTONOMOUS**: VCM provides both workflow automation AND intelligent decision-making
2. **MULTI-AGENT SPECIALIZATION**: Each persona is a specialized agent trained for specific tasks
3. **NEXT.JS FULL-STACK**: Complete solution with API routes, TypeScript, and modern React patterns
4. **SIMPLIFIED ARCHITECTURE**: Single centralized database, streamlined workflows

## 🏗️ Current Architecture (Next.js 14)

### Frontend Stack
- **Next.js 14** with App Router (`src/app/`)
- **TypeScript** + **Tailwind CSS** + **shadcn/ui** components  
- **TanStack Query** for server state management
- **Supabase SSR** for real-time database integration
- **Development**: Port 3001 | **Production**: Port 3000

### Backend (API Routes)
```
src/app/api/
├── empresas/          # Company CRUD operations
├── personas/          # Persona management 
├── automation/        # Script execution endpoints
├── cascade-nodejs/    # Node.js cascade processing
├── health/           # Health check for monitoring
└── outputs/          # Generated content APIs
```

### Database Strategy (SIMPLIFIED)
- **Single Supabase Database**: `fzyokrvdyeczhfqlwxzb.supabase.co` 
- **Core Tables**: `empresas` (companies), `personas` (AI agents), `avatares_personas` (LLM-generated profiles)
- **Active Test Data**: ARVA Tech Solutions (ID: `7761ddfd-0ecc-4a11-95fd-5ee913a6dd17`) with 15 personas
- **Real-time sync** through Supabase subscriptions
- **Environment**: Uses `NEXT_PUBLIC_SUPABASE_*` variables

### Automation System (Node.js + LLM Pipeline)
- **9-Script Cascade**: Sequential persona data generation via AI
- **Script Order**: 01 Placeholders → 02 Biografias → 03 Atribuições → 04 Competências → 05a/b/c Avatares → 06 Automação → 07 Workflows → 08 ML → 09 Auditoria
- **Avatar Pipeline**: 05a (LLM prompts) → 05b (Fal.ai images) → 05c (download + thumbnails)
- **AI Integration**: Google Gemini (primary), OpenRouter/Grok, OpenAI for specialized tasks
- **Execution Pattern**: `node SCRIPT_NAME.js --empresaId=COMPANY_ID`
- **Output**: Direct Supabase insertion + local JSON backup files in output folders

## 📁 Current Directory Structure

```
src/app/                          # Next.js App Router
├── api/                         # Backend API routes
│   ├── empresas/               # Company management
│   ├── personas/               # Persona operations  
│   ├── automation/             # Script execution
│   └── health/                 # System monitoring
├── empresas/                   # Company pages
├── personas/                   # Persona management UI
├── subsystems/                 # 12 specialized dashboards
└── layout.tsx                  # App shell + providers

AUTOMACAO/                        # Node.js automation scripts
├── 01_create_personas_from_structure.js  # ✅ Placeholders
├── 02_generate_biografias_COMPLETO.js    # ✅ Biografias + dados básicos
├── 03_generate_atribuicoes_contextualizadas.cjs  # ✅ Atribuições
├── 04_generate_competencias_grok.cjs     # ✅ Competências + metas
├── 05a_generate_avatar_prompts.js        # ✅ Avatares: Prompts LLM
├── 05b_generate_images_fal.js            # ✅ Avatares: Imagens Fal.ai
├── 05c_download_avatares.js              # ✅ Avatares: Download local
├── 06_analyze_tasks_for_automation.js    # ✅ Análise de automação
├── 07_generate_n8n_workflows.js          # ✅ Workflows N8N
├── 08_generate_machine_learning.js       # ✅ ML models
├── 09_generate_auditoria.js              # ✅ Auditoria completa
├── README_AVATARES_05ABC.md              # 📖 Docs pipeline avatares
├── 04_BIOS_PERSONAS_REAL/           # Biografias output
├── competencias_output/             # Competências output
├── ml_models_output/                # ML models output
└── auditoria_output/                # Auditoria reports

src/components/                   # Reusable UI components (shadcn/ui)
src/lib/                         # Utilities + Supabase client
```

## 🔧 Development Workflows

### Local Development
```bash
npm run dev              # Start dev server (port 3001)
npm run build           # Build for production
npm run start           # Start production server (port 3000)
```

### Automation Scripts (Node.js)
```bash
cd AUTOMACAO
# Execute the 9-script cascade in order:
node 01_create_personas_from_structure.js --empresaId=COMPANY_ID      # Placeholders
node 02_generate_biografias_COMPLETO.js --empresaId=COMPANY_ID        # Biografias + dados
node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=COMPANY_ID  # Atribuições
node 04_generate_competencias_grok.cjs --empresaId=COMPANY_ID         # Competências + metas
node 05a_generate_avatar_prompts.js --empresaId=COMPANY_ID            # Avatares: Prompts
node 05b_generate_images_fal.js --empresaId=COMPANY_ID                # Avatares: Imagens
node 05c_download_avatares.js --empresaId=COMPANY_ID                  # Avatares: Download
node 05_generate_avatares.js --empresaId=COMPANY_ID                   # Avatares
node 06_analyze_tasks_for_automation.js --empresaId=COMPANY_ID        # Análise automação
node 07_generate_n8n_workflows.js --empresaId=COMPANY_ID              # Workflows N8N
node 08_generate_machine_learning.js --empresaId=COMPANY_ID           # ML models
node 09_generate_auditoria.js --empresaId=COMPANY_ID                  # Auditoria

# Current test company ID: 7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 (ARVA Tech Solutions)
```

### Docker Production Deployment
```bash
npm run deploy          # Build + deploy with docker-compose
npm run deploy:logs     # View container logs
npm run health          # Check system health
```

### Environment Configuration
```env
# Required variables (.env.local for development)
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Service Keys  
GOOGLE_AI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

## ⚡ Next.js Specific Patterns

### Component Architecture
- **App Router Structure**: Pages in `src/app/[route]/page.tsx`
- **API Routes**: Server functions in `src/app/api/[endpoint]/route.ts`
- **Client Components**: Use `'use client'` for interactive components
- **Server Components**: Default, can directly access databases

### State Management Pattern
```typescript
// Standard pattern using TanStack Query
const { data: empresas } = useQuery({
  queryKey: ['empresas'],
  queryFn: () => supabase.from('empresas').select('*')
});
```

### Supabase Integration
```typescript
// Singleton pattern in src/lib/supabase.ts
const supabase = SupabaseSingleton.getInstance();
// Always check environment variables before operations
// Use absolute paths for file operations
```

### Error Handling & Logging
- **File-based logging** to avoid Windows encoding issues
- **Comprehensive try/catch** with detailed error messages  
- **Health endpoint** at `/api/health` for monitoring
- **TypeScript strict mode** with proper error boundaries

## 🚨 Critical Development Guidelines

### Current Project State (Nov 21, 2025)
- **Active Test Company**: ARVA Tech Solutions (ID: `7761ddfd-0ecc-4a11-95fd-5ee913a6dd17`)
- **Personas Status**: 15 personas created with standardized emails (firstname.lastname@arvabot.com)
- **Avatar System**: Recently fixed and ready for LLM execution
- **Interface Status**: PersonaDetail component updated with better contrast and automation data sections
- **Next Priority**: Execute the 6-script automation cascade starting with avatars

### Immediate Development Workflow
```bash
# 1. Execute placeholder creation (PRIORITY 1)
cd AUTOMACAO
node 01_create_personas_from_structure.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 2. Execute biografias (generates names, emails, experience)
node 02_generate_biografias_COMPLETO.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 3. Start development server to test interface
npm run dev  # Port 3001

# 4. Execute remaining cascade scripts in order (03-09)
```

### Next.js Migration Context
- **MIGRATED FROM VITE**: This was originally a Vite/React project
- **No Python Dependencies**: All automation is now Node.js-based
- **Single Database**: Simplified from dual-database to single Supabase instance
- **Docker Production**: Uses multi-stage builds for VPS deployment

### Node.js Automation Scripts  
- **Script sequence**: 01 (placeholders) → 02 (biografias) → 03 (atribuições) → 04 (competências) → 05 (avatares) → 06 (automação) → 07 (workflows) → 08 (ML) → 09 (auditoria)
- **CLI execution**: `node script.js --empresaId=ID` pattern
- **Direct DB insert**: Scripts write to normalized tables (`personas_biografias`, `personas_competencias`, `personas_ml_models`, etc.)
- **JSON backup**: Local files stored in output folders (`04_BIOS_PERSONAS_REAL/`, `competencias_output/`, `ml_models_output/`, `auditoria_output/`)
- **Rate limiting**: 2-5 second pauses between personas to respect API limits

### Database Operations
- **Environment check**: Always verify `NEXT_PUBLIC_SUPABASE_*` variables
- **Singleton pattern**: Use `SupabaseSingleton.getInstance()` in client code
- **Cascade operations**: `empresas` → `personas` (foreign key relationship)
- **Real-time features**: Built-in Supabase subscriptions

### Windows PowerShell Compatibility
- **Use semicolons** (`;`) for command chaining, never `&&`
- **Forward slashes** in Node.js paths, backslashes in Windows commands  
- **UTF-8 encoding**: Explicitly specify for all file operations
- **Path objects**: Use Node.js `path` module, not string concatenation

## 📋 Key Integration Points

### Frontend (React Dashboard with Multi-Agent Philosophy)
- **Next.js 14** with App Router and TypeScript
- **shadcn/ui + Tailwind CSS** for consistent design system
- **TanStack Query** for server state and caching
- **Real-time sync** with Supabase subscriptions
- **12 Subsystem dashboards** representing agent workspaces

### Production Deployment
- **Docker multi-stage builds** (`Dockerfile.prod`)
- **docker-compose.prod.yml** for VPS deployment
- **Health monitoring** via `/api/health` endpoint
- **Nginx reverse proxy** configuration included

### External Systems Integration
- **Google Gemini AI**: Primary content generation
- **OpenAI**: Secondary AI provider for specific tasks
- **Supabase**: Database + real-time + authentication
- **N8N Workflows**: Future automation integration (referenced in legacy docs)

## 🎯 When Working on This Project

1. **Start with environment**: Verify `.env.local` and Supabase connectivity
2. **Use current test data**: Always use ARVA Tech Solutions (ID: `7761ddfd-0ecc-4a11-95fd-5ee913a6dd17`)
3. **Follow script cascade**: Execute automation scripts in order: 01→02→03→04→05→06→07→08→09
4. **Monitor LLM usage**: Scripts have 2-5 second pauses and rate limiting for Gemini/Grok/OpenAI APIs
5. **Test interface**: Dev port 3001, check PersonaDetail for automation data visualization  
6. **Check database tables**: `personas` (basic data), `avatares_personas` (LLM profiles), `empresas` (companies)
7. **Use Node.js patterns**: All automation is JavaScript/TypeScript, no Python
8. **Follow Next.js conventions**: App Router, API routes, proper client/server patterns
9. **Use Docker for production**: Never deploy without containerization
10. **Think multi-agent**: Every feature should support autonomous agent collaboration

This system is designed for **autonomous virtual companies** that operate with minimal human intervention while maintaining sophisticated AI-driven business logic through specialized personas.
## 🔄 MIGRAÇÃO COMPLETA (Dez 2025)

### Tabelas Normalizadas:
- `personas_biografias` (biografia_estruturada JSONB)
- `personas_atribuicoes` (atribuicao TEXT, ordem INT)
- `personas_competencias` (8 campos JSONB: competencias_tecnicas, tarefas_diarias, kpis, etc)

### Scripts Atualizados (Ordem Correta):
- `01_create_personas_from_structure.js` → cria placeholders
- `02_generate_biografias_COMPLETO.js` → gera nome, email, experiência, biografia (salva em personas + personas_biografias)
- `03_generate_atribuicoes_contextualizadas.cjs` → salva atribuições em personas_atribuicoes
- `04_generate_competencias_grok.cjs` → salva competências + metas em personas_competencias
- `05_generate_avatares.js` → salva avatares em personas_avatares
- `06_analyze_tasks_for_automation.js` → salva análises em automation_opportunities
- `07_generate_n8n_workflows.js` → salva workflows em personas_workflows
- `08_generate_machine_learning.js` → salva modelos ML em personas_ml_models
- `09_generate_auditoria.js` → salva auditorias em personas_audit_logs

### Pendências:
- Corrigir idiomas (rodar fix_idiomas_urgente.cjs)
- Preencher experiencia_anos (NULL em algumas personas)
- Emails usando @example.com (deveria ser @dominio_empresa)