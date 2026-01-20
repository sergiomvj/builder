┌─────────────────────────────────────────────────────┐
│ SCRIPT 0: Criação de Empresa (Frontend)            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 1. Usuário preenche formulário (company-form.tsx)  │
│    - nome, codigo, industria, pais                  │
│    - executives_male/female, specialists, etc.      │
│    - idiomas[], nationalities[]                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. [OPCIONAL] Clica "Gerar Estrutura com IA"       │
│    → gerarEstruturaOrganizacional()                 │
│    → POST /api/automation/generate-structure        │
│    → LLM OpenRouter (z-ai/glm-4.6)                  │
│    → Retorna: {cargos_necessarios: string[]}        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. Monta objeto companyData                         │
│    - Todos os campos do form                        │
│    - cargos_necessarios (LLM ou fallback genérico)  │
│    - scripts_status inicial                         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. createMutation.mutateAsync(companyData)          │
│    → useCreateEmpresa() hook                        │
│    → Supabase INSERT INTO empresas                  │
│    → ⚠️ cargos_necessarios PODE SER IGNORADO        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 5. Empresa criada no banco (tabela empresas)       │
│    - ✅ SALVOS: nome, codigo, industria, etc.       │
│    - ❌ PERDIDO?: cargos_necessarios                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ SCRIPT 01: Criar Personas                          │
│    → LÊ empresas.cargos_necessarios                 │
│    → ⚠️ PODE ESTAR VAZIO SE COLUNA NÃO EXISTE!      │
│    → Cria placeholders em personas                  │
└─────────────────────────────────────────────────────┘