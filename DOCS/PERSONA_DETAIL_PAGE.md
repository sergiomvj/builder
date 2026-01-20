# 📋 Nova Página de Detalhes de Persona

## 🎯 Objetivo
Página completa para visualizar, editar e gerenciar TODOS os dados de uma persona em uma interface organizada por abas.

## 📐 Estrutura da Página

### 🔝 Header (Topo Fixo)
- **Avatar grande** (24x24) com borda e sombra
- **Nome completo** em destaque
- **Cargo e Departamento** como subtítulo
- **Badges de contato**: Email, Nacionalidade, Anos de experiência
- **Quality Score** (se auditoria existir): Score principal + badges das fases
- **Botões de ação**: Exportar, Compartilhar

### 📑 Tabs de Conteúdo

#### 1️⃣ **Visão Geral** (overview)
- **Card: Dados Básicos** (editável)
  - Nome completo, Email, WhatsApp
  - Cargo, Departamento, Especialidade
  - Anos de experiência, Gênero, Nacionalidade
  - Botão "Editar" → modo de edição inline
  
- **Card: Configurações de IA**
  - System Prompt (textarea editável)
  - Temperatura (0-2)
  - Max Tokens

#### 2️⃣ **Biografia** (biografia)
- **Fonte de dados**: `personas_biografias.biografia_estruturada` (JSONB)
- **Seções**:
  - História Profissional (biografia_completa)
  - Hard Skills (com níveis 1-10)
  - Soft Skills (com níveis 1-10)
  - Educação (formação superior, pós-graduação)
- **Ações**: 
  - Botão "Regenerar" → Executa Script 02
  - Estado vazio: Botão "Gerar Biografia"

#### 3️⃣ **Atribuições** (atribuicoes)
- **Fonte de dados**: `personas_atribuicoes` (array)
- **Visualização**: Lista numerada de responsabilidades
- **Ações**: 
  - Botão "Regenerar" → Executa Script 03
  - Estado vazio: Botão "Gerar Atribuições"

#### 4️⃣ **Competências** (competencias)
- **Fonte de dados**: `personas_competencias` (JSONB)
- **Cards em grid 2 colunas**:
  - Competências Técnicas
  - Tarefas Diárias
  - KPIs
  - Metas de Curto Prazo
- **Ações**: 
  - Botão "Regenerar" → Executa Script 04
  - Estado vazio: Botão "Gerar Competências"

#### 5️⃣ **Tarefas** (tasks)
- **Fonte de dados**: `personas_tasks` (array)
- **Cards individuais** para cada tarefa:
  - Descrição, Tipo, Frequência
  - Badge de automação (Automatizável / Manual)
  - Métricas: Complexidade, Tempo, Prioridade
- **Ações**: 
  - Botão "Reanalisar" → Executa Script 06
  - Estado vazio: Botão "Analisar Tarefas"

#### 6️⃣ **Workflows** (workflows)
- **Fonte de dados**: `personas_workflows` (array)
- **Cards individuais** com:
  - Nome, Descrição, Categoria
  - Indicador de JSON N8N disponível
- **Ações**: 
  - Botão "Regenerar" → Executa Script 07
  - Estado vazio: Botão "Gerar Workflows"

#### 7️⃣ **ML & RAG** (ml)
- **3 Cards principais**:
  
  **ML Models**
  - Fonte: `personas_ml_models`
  - Lista de modelos com tipo e acurácia
  - Botão "Gerar ML" → Script 08
  
  **RAG Recommendations**
  - Fonte: `rag_knowledge`
  - Recomendações de conhecimento
  - Botão "Gerar RAG" → Script 06.5
  
  **Knowledge Base**
  - Fonte: `knowledge_chunks`
  - Base vetorial para busca semântica
  - Botão "Processar Docs" → Script 10

#### 8️⃣ **Scripts** (scripts)
- **Lista completa** de todos os 11 scripts:
  - 01 - Placeholders
  - 02 - Biografia
  - 03 - Atribuições
  - 04 - Competências
  - 05 - Avatares
  - 06 - Análise de Automação
  - 06.5 - RAG Recommendations
  - 07 - Workflows N8N
  - 08 - ML Models
  - 09 - Auditoria
  - 10 - Knowledge Base

- **Cada script mostra**:
  - Ícone, Número, Nome
  - Descrição breve
  - Status (completed/error/pending)
  - Data da última execução
  - Botão "Executar"

- **Execução**:
  - Passa `personaId` específico
  - Força execução mesmo se já rodou
  - Mostra loading durante execução
  - Atualiza dados após conclusão

## 🔄 Funcionalidades

### ✏️ Edição Inline
- Click em "Editar" → Campos viram inputs
- Botões "Salvar" / "Cancelar"
- API PATCH `/api/personas/[id]`
- Atualiza apenas campos modificados
- Toast de sucesso/erro

### ⚡ Execução de Scripts
- **Endpoint**: `/api/automation/execute-script`
- **Payload**:
  ```json
  {
    "empresaId": "uuid",
    "personaId": "uuid",
    "scriptNumber": "02",
    "force_mode": true
  }
  ```
- **Loading state**: Botão desabilitado com spinner
- **Refetch automático** após conclusão

### 🔄 Auto-refresh
- Scripts status: refetch a cada 5 segundos
- Invalida queries após execução
- TanStack Query para cache inteligente

## 🎨 Design

### Cores e Temas
- Gradiente no header: `from-blue-50 to-indigo-50` (light) / `from-gray-900 to-gray-800` (dark)
- Cards com sombra suave
- Badges contextuais (verde=completed, vermelho=error, cinza=pending)
- Ícones Lucide para cada seção

### Responsividade
- Grid de 2 colunas em desktop
- Coluna única em mobile
- ScrollArea para tabs e conteúdo
- Header fixo com botão de voltar

### Estados Vazios
- Ícone grande em cinza
- Texto explicativo
- Botão de ação primary
- Centralizado verticalmente

## 📡 APIs Necessárias

### ✅ Já Existem
1. `GET /api/personas/[id]/full` - Dados completos (criada)
2. `PATCH /api/personas/[id]` - Atualizar campos (já existe)
3. `POST /api/automation/execute-script` - Executar scripts (já existe)
4. `GET /api/personas/[id]/scripts-status` - Status dos scripts (já existe)

### 📊 Estrutura de Resposta Esperada

**GET `/api/personas/[id]/full`**:
```json
{
  "id": "uuid",
  "full_name": "string",
  "email": "string",
  "role": "string",
  ...todos campos da tabela personas,
  "personas_biografias": [{
    "biografia_estruturada": {
      "biografia_completa": "string",
      "hard_skills": {},
      "soft_skills": {},
      "educacao": {}
    }
  }],
  "personas_atribuicoes": [],
  "personas_competencias": [{...}],
  "personas_tasks": [],
  "personas_workflows": [],
  "personas_ml_models": [],
  "personas_avatares": [{...}],
  "personas_auditorias": [{...}]
}
```

## 🚀 Como Usar

### Integração no Componente Pai
```tsx
import { PersonaDetailPage } from '@/components/PersonaDetailPage';

// Em PersonasFixed.tsx ou similar:
{selectedPersona && (
  <PersonaDetailPage
    persona={selectedPersona}
    onBack={() => setSelectedPersona(null)}
  />
)}
```

### Dependências
- `@tanstack/react-query` para data fetching
- `sonner` para toasts
- `lucide-react` para ícones
- Componentes shadcn/ui: Card, Button, Badge, Avatar, Tabs, Input, Label, Textarea, Switch, Separator, ScrollArea

## 📝 Próximos Passos

1. ✅ Criar `PersonaDetailPage.tsx` (completo)
2. ✅ Criar API `/api/personas/[id]/full` (completo)
3. ⏳ Integrar no componente pai (PersonasFixed.tsx)
4. ⏳ Testar execução de scripts
5. ⏳ Validar edição inline
6. ⏳ Adicionar upload de avatar
7. ⏳ Implementar exportação (PDF/JSON)

## 🎯 Benefícios

✅ **Visualização completa**: Todos os dados em um só lugar
✅ **Edição fácil**: Inline editing com validação
✅ **Execução individual**: Scripts por persona
✅ **Organização clara**: Tabs temáticas
✅ **Real-time**: Auto-refresh de status
✅ **Profissional**: Design moderno e responsivo
✅ **Extensível**: Fácil adicionar novas seções

---

**Arquivo criado**: `src/components/PersonaDetailPage.tsx`
**Linha de código**: ~1200 linhas
**Componentes**: 1 principal + 8 seções + 1 API route
