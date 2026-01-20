# 📚 **DOCUMENTAÇÃO COMPLETA - SISTEMA VCM (Virtual Company Manager)**
*Versão 2.0 - Atualizada em 16 de Novembro de 2025*

## 🎯 **VISÃO GERAL**

O **Virtual Company Manager (VCM)** é um sistema automatizado para criação e gestão de empresas virtuais com personas especializadas em operações SDR híbridas e vendas B2B. O sistema gera automaticamente empresas completas com 15 personas funcionais, cada uma com biografias detalhadas, competências específicas e workflows automatizados.

### **Objetivos Principais**
- Criação automatizada de empresas virtuais
- Geração de personas com competências SDR híbridas
- Automação de workflows de vendas e marketing
- Sincronização com sistemas CRM e databases RAG
- Operação escalável para múltiplas empresas

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### **Stack Tecnológico**
- **Frontend**: Next.js 14.2.33 + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + API Routes + Supabase
- **Database**: Supabase (PostgreSQL) com estratégia dual
- **Automação**: Scripts Node.js + Python (legacy)
- **AI Integration**: OpenAI + Anthropic + Google AI
- **Deployment**: Vercel + Docker support

### **Dual Database Strategy**
```
📊 VCM Central Database (fzyokrvdyeczhfqlwxzb.supabase.co)
├── 🏢 Gestão de múltiplas empresas virtuais
├── 👥 Cadastro de personas e competências
├── 📊 Dashboards e analytics centralizados
└── 🔄 Sincronização entre databases

📊 Individual RAG Databases (por empresa)
├── 🧠 Knowledge base específica da empresa
├── 🤖 Contextos RAG personalizados
├── 🔍 Embeddings e busca semântica
└── 🔗 Integração com workflows N8N
```

---

## 📂 **ESTRUTURA DO PROJETO**

```
vcm_vite_react/
├── 📁 AUTOMACAO/
│   ├── 📁 01_SETUP_E_CRIACAO/
│   │   └── generate_biografias_simples.js     # Geração de biografias
│   ├── 📁 02_PROCESSAMENTO_PERSONAS/
│   │   ├── generate_competencias_simple.js    # Script 1: Competências
│   │   ├── generate_tech_specs_simple.js      # Script 2: Tech Specs
│   │   ├── 03_generate_rag.js                 # Script 3: RAG Database
│   │   ├── 04_generate_fluxos_analise.js      # Script 4: Análise Fluxos
│   │   └── 05_generate_workflows_n8n.js       # Script 5: N8N Workflows
│   └── 📁 Old_Files/                          # Arquivos legados
├── 📁 src/
│   ├── 📁 app/
│   │   └── 📁 api/                            # API Routes
│   ├── 📁 components/                         # Componentes React
│   └── 📁 lib/                               # Utilities
├── 📁 Docs/                                  # Documentação
├── .env                                      # Configurações de ambiente
└── README.md
```

---

## 🤖 **SISTEMA DE PERSONAS**

### **Hierarquia Organizacional**
```
🏢 EMPRESA VIRTUAL (15 Personas)
├── 👔 EXECUTIVOS (5)
│   ├── CEO - Chief Executive Officer
│   ├── CTO - Chief Technology Officer  
│   ├── CFO - Chief Financial Officer
│   ├── CMO - Chief Marketing Officer
│   └── COO - Chief Operations Officer
├── 🎯 ESPECIALISTAS (5)
│   ├── Manager - Gerente de Área
│   ├── Specialist - Especialista Técnico
│   ├── Analyst - Analista de Dados
│   ├── Coordinator - Coordenador de Projetos
│   └── Supervisor - Supervisor de Equipe
└── 🛠️ ASSISTENTES (5)
    ├── Assistant - Assistente Executivo
    ├── Support - Suporte Técnico
    ├── Junior - Analista Junior
    ├── Intern - Estagiário
    └── Admin - Assistente Administrativo
```

### **Competências SDR Híbridas**
Cada persona possui competências específicas para vendas B2B:
- **Prospecção de leads frios**
- **Aquecimento de leads mornos** 
- **Fechamento de vendas**
- **Suporte pós-venda especializado**
- **Cold calling e outreach**

---

## ⚙️ **AUTOMATION CASCADE (Scripts 0-5)**

### **🔄 Fluxo de Processamento**
```
📝 Script 0: Biografias
    ↓
🧠 Script 1: Competências → Database: competencias
    ↓
⚙️ Script 2: Tech Specs → Output: tech_specs_output/
    ↓  
🔍 Script 3: RAG Database → Output: rag_knowledge_base.json
    ↓
📊 Script 4: Análise Fluxos → Output: fluxos_analise.json
    ↓
🔗 Script 5: N8N Workflows → Output: n8n_workflows.json
```

### **Script Descriptions**

#### **Script 0 - Biografias** ✅
- **Arquivo**: `generate_biografias_simples.js`
- **Função**: Gera biografias detalhadas com trajetória profissional
- **Output**: Database `personas` table
- **Features**: Multi-idioma, SDR expertise, experiência específica

#### **Script 1 - Competências** ✅
- **Arquivo**: `generate_competencias_simple.js` 
- **Função**: Mapeia competências técnicas e comportamentais
- **Output**: Database `competencias` table
- **Features**: Templates por role, escopo SDR híbrido

#### **Script 2 - Tech Specs** ✅
- **Arquivo**: `generate_tech_specs_simple.js`
- **Função**: Define especificações técnicas por persona
- **Output**: `tech_specs_output/` directory
- **Features**: Tools por role, sales enablement, prospecting tools

#### **Script 3 - RAG Database** ✅
- **Arquivo**: `03_generate_rag.js`
- **Função**: Cria knowledge base para queries RAG
- **Output**: `rag_knowledge_base.json`
- **Features**: 66 contextos, embeddings ready, search metadata

#### **Script 4 - Análise Fluxos** ⚠️
- **Arquivo**: `04_generate_fluxos_analise.js`
- **Função**: Analisa workflows e cria task todos
- **Output**: `fluxos_analise.json`
- **Status**: Implementado, necessita teste com dados reais

#### **Script 5 - N8N Workflows** ⚠️
- **Arquivo**: `05_generate_workflows_n8n.js`
- **Função**: Gera workflows N8N executáveis
- **Output**: `n8n_workflows.json`
- **Status**: Implementado, necessita teste com dados reais

---

## 🗄️ **DATABASE SCHEMA**

### **Tabelas Principais**
```sql
-- Empresas virtuais
CREATE TABLE empresas (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(200),
    descricao TEXT,
    configuracoes JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP
);

-- Personas das empresas
CREATE TABLE personas (
    id UUID PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id),
    persona_code VARCHAR(10),
    full_name VARCHAR(200),
    role VARCHAR(100),
    specialty VARCHAR(200),
    department VARCHAR(100),
    email VARCHAR(200),
    whatsapp VARCHAR(50),
    biografia_completa TEXT,
    personalidade JSONB,
    experiencia_anos INTEGER,
    ia_config JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP
);

-- Competências das personas  
CREATE TABLE competencias (
    id UUID PRIMARY KEY,
    persona_id UUID REFERENCES personas(id),
    tipo VARCHAR(50), -- 'tecnica' ou 'comportamental'
    nome VARCHAR(200),
    descricao TEXT,
    nivel VARCHAR(50),
    categoria VARCHAR(100),
    escopo_sdr_hibrido BOOLEAN,
    created_at TIMESTAMP
);
```

---

## 🔧 **APIs E ENDPOINTS**

### **Endpoints Principais**
```typescript
// Gestão de Empresas
GET    /api/empresas              # Lista empresas
POST   /api/empresas              # Cria empresa
GET    /api/empresas/[id]         # Detalhes empresa
PUT    /api/empresas/[id]         # Atualiza empresa
DELETE /api/empresas/[id]         # Remove empresa

// Gestão de Personas
GET    /api/personas              # Lista personas
POST   /api/personas              # Cria persona
GET    /api/personas/[id]         # Detalhes persona
PUT    /api/personas/[id]         # Atualiza persona

// Automação
POST   /api/automation/biografia  # Executa geração biografias
POST   /api/automation/cascade    # Executa cascata completa
POST   /api/automation/script/[n] # Executa script específico
GET    /api/automation/status     # Status da automação

// Dados
GET    /api/competencias          # Lista competências
GET    /api/tech-specs            # Lista tech specs
GET    /api/rag-data              # Dados RAG
```

---

## 🔄 **SINCRONIZAÇÃO E RAG**

### **Processo de Sincronização**
1. **Dados Locais** → Scripts geram outputs
2. **VCM Central** → Armazena metadados e controle
3. **RAG Database** → Recebe knowledge base específica
4. **N8N Workflows** → Implementa automações

### **RAG Integration**
- **Knowledge Base**: `rag_knowledge_base.json`
- **Contextos**: 66 contextos de busca por empresa
- **Embeddings**: Preparado para embedding generation
- **Search Metadata**: Tags e indexação otimizada

---

## 🛠️ **CONFIGURAÇÃO E SETUP**

### **Environment Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Database específica da empresa (exemplo)
LIFEWAY_SUPABASE_URL=https://neaoblaycbdunfxgunjo.supabase.co
LIFEWAY_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
```

### **Installation & Setup**
```bash
# Clone repository
git clone https://github.com/sergiomvj/vcmdashboard.git
cd vcmdashboard

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configurations

# Run development server
npm run dev

# Run automation scripts
cd AUTOMACAO/02_PROCESSAMENTO_PERSONAS
node generate_biografias_simples.js EMPRESA_CODE
node generate_competencias_simple.js
node generate_tech_specs_simple.js
node 03_generate_rag.js --empresa-codigo EMPRESA_CODE
```

---

## 🧪 **TESTING**

### **Empresa de Teste**
- **Código**: ARVA63
- **Nome**: ARVA Tech Solutions
- **Status**: Totalmente funcional
- **Personas**: 15 personas ativas
- **Database**: Dados reais validados

### **Test Commands**
```bash
# Teste completo cascata
cd AUTOMACAO/02_PROCESSAMENTO_PERSONAS
node generate_biografias_simples.js ARVA63
node generate_competencias_simple.js 
node generate_tech_specs_simple.js
node 03_generate_rag.js --empresa-codigo ARVA63
```

---

## 🚀 **DEPLOYMENT**

### **Vercel Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Environment variables setup in Vercel dashboard
# Database migrations run automatically
```

### **Docker Support**
```bash
# Build Docker image
docker build -t vcm-dashboard .

# Run container
docker run -p 3000:3000 --env-file .env vcm-dashboard
```

---

## 📊 **MONITORING E LOGS**

### **Health Checks**
- **Database**: Connection status via API
- **Scripts**: Execution status tracking
- **AI APIs**: Rate limits e availability
- **Automation**: Cascade execution monitoring

### **Error Handling**
- **Graceful degradation** em falhas de API
- **Retry logic** para operações críticas
- **Detailed logging** para debugging
- **Status tracking** em tempo real

---

## 🔮 **ROADMAP FUTURO**

### **Próximas Features**
- [ ] **Multi-company UI** para gestão centralizada
- [ ] **Real-time status updates** no dashboard
- [ ] **Advanced analytics** e relatórios
- [ ] **API rate limiting** e caching
- [ ] **Webhook integration** para N8N
- [ ] **Backup e restore** automático
- [ ] **Performance optimization** e scaling
- [ ] **Multi-language support** completo

---

## 🆘 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **Erro de Conexão Database**
```bash
# Verificar environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Testar conexão
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

#### **Scripts Não Executam**
```bash
# Verificar Node.js version
node --version  # Deve ser >= 18.0.0

# Verificar permissions
chmod +x AUTOMACAO/02_PROCESSAMENTO_PERSONAS/*.js

# Verificar dependencies
npm install
```

#### **Personas Não Aparecem**
```bash
# Verificar empresa existe
node AUTOMACAO/02_PROCESSAMENTO_PERSONAS/buscar_empresa_id.js CODIGO_EMPRESA

# Verificar personas
node AUTOMACAO/02_PROCESSAMENTO_PERSONAS/check_personas.js
```

---

## 📞 **SUPPORT & CONTRIBUIÇÃO**

### **Repositório**
- **GitHub**: https://github.com/sergiomvj/vcmdashboard
- **Branch**: master
- **Issues**: GitHub Issues para bugs e features

### **Desenvolvimento**
- **Code Style**: ESLint + Prettier
- **Commits**: Conventional commits
- **Testing**: Jest + React Testing Library
- **Documentation**: Markdown + JSDoc

---

*Documentação mantida pelo time VCM - Virtual Company Manager*
*Última atualização: 16 de Novembro de 2025*