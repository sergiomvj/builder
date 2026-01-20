# 🚀 VCM Dashboard - Setup e Execução

## 📋 Visão Geral

O VCM Dashboard é uma interface React moderna que integra com os scripts Python existentes para gerenciar empresas virtuais e suas equipes de personas.

## 🏗️ Arquitetura

```
VCM Dashboard (React) ←→ API Bridge (Python/FastAPI) ←→ Scripts Python Existentes
```

### Componentes:
- **Frontend**: React + TypeScript + Tailwind + Supabase
- **API Bridge**: FastAPI que conecta com scripts Python
- **Scripts**: Sistema existente de automação Python

## ⚡ Execução Rápida

### 1. Instalar Dependências Python
```bash
pip install -r requirements-api.txt
```

### 2. Iniciar API Bridge
```bash
python api_bridge.py
```
A API estará disponível em: http://localhost:8000

### 3. Iniciar Dashboard React
```bash
cd vcm-dashboard
npm install  # só na primeira vez
npm run dev
```
O dashboard estará em: http://localhost:3000

## 🔧 Configuração Detalhada

### API Python (Backend)
A API Bridge conecta o dashboard React com os scripts Python existentes:

**Endpoints principais:**
- `POST /generate-biografias` - Executa geração de biografias
- `POST /cascade-script/{number}` - Executa script específico (1-5)
- `POST /full-cascade` - Executa toda a cascata
- `GET /script-status/{empresa}` - Verifica status dos scripts
- `GET /script-outputs/{empresa}` - Lista arquivos gerados

**Documentação interativa:** http://localhost:8000/docs

### Dashboard React (Frontend)
Interface moderna para gerenciar o sistema VCM:

**Funcionalidades implementadas:**
- ✅ Layout responsivo com sidebar e header
- ✅ Página de Dashboard com métricas
- ✅ Página de Empresas (em desenvolvimento)
- ✅ Integração com API Python via bridge
- ✅ Configuração Supabase para VCM Central

**Tecnologias:**
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Query + Zustand
- React Router

## 📁 Estrutura do Projeto

```
vcm_vite_react/
├── api_bridge.py              # API FastAPI
├── requirements-api.txt       # Deps Python
├── vcm-dashboard/            # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── lib/             # APIs e utilitários
│   │   └── types/           # Tipos TypeScript
│   ├── package.json
│   └── vite.config.ts
├── AUTOMACAO/               # Scripts Python existentes
│   ├── 01_SETUP_E_CRIACAO/
│   └── 02_PROCESSAMENTO_PERSONAS/
└── Docs/                   # Documentação técnica
```

## 🔄 Fluxo de Uso

### 1. Criar Empresa Virtual
- Acesse "Empresas" no dashboard
- Clique "Nova Empresa"
- Preencha dados (nome, código, país, etc.)
- O sistema criará registro no VCM Central

### 2. Gerar Personas
- Selecione a empresa criada
- Clique "Gerar Biografias"
- API executará `05_auto_biografia_generator.py`
- 20 personas serão criadas automaticamente

### 3. Processar Cascata
- Execute scripts 1-5 em sequência:
  1. Competências
  2. Especificações técnicas
  3. Base RAG
  4. Fluxos de análise
  5. Workflows N8N

### 4. Sincronizar
- Dados são sincronizados com Supabase
- Status em tempo real no dashboard

## 🛠️ Scripts Python Integrados

### Scripts de Setup
- `01_virtual_company_generator.py` - Gerador master
- `05_auto_biografia_generator.py` - **Geração de biografias**

### Scripts de Processamento (Cascata)
1. `01_generate_competencias.py` - **Competências técnicas/comportamentais**
2. `02_generate_tech_specs.py` - **Especificações técnicas**
3. `03_generate_rag.py` - **Base de conhecimento RAG**
4. `04_generate_fluxos_analise.py` - **Análise de fluxos**
5. `05_generate_workflows_n8n.py` - **Workflows N8N**

## 🔧 Configurações

### Variáveis de Ambiente (.env)
```bash
# VCM Central Supabase
VITE_VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
VITE_VCM_SUPABASE_ANON_KEY=your_anon_key

# Python API
VITE_PYTHON_API_URL=http://localhost:8000

# Development
VITE_DEV_MODE=true
```

### Configuração Supabase
O sistema usa o banco VCM Central existente:
- URL: `https://fzyokrvdyeczhfqlwxzb.supabase.co`
- Utiliza as tabelas já configuradas
- RLS (Row Level Security) ativo

## 📊 Status Atual

### ✅ Implementado
- [x] Setup base do projeto React
- [x] API Bridge Python/FastAPI
- [x] Layout responsivo
- [x] Integração com scripts Python
- [x] Configuração Supabase
- [x] Páginas base (Dashboard, Empresas)

### 🔄 Em Desenvolvimento
- [ ] CRUD completo de empresas
- [ ] Execução de scripts via interface
- [ ] Gestão de personas
- [ ] Sistema de sincronização
- [ ] Monitoramento em tempo real

### 📋 Próximos Passos
1. Implementar formulário de criação de empresas
2. Conectar botões com API Bridge
3. Adicionar gestão de personas
4. Implementar sistema de sync
5. Dashboard com métricas reais

## 🚨 Solução de Problemas

### API não conecta
```bash
# Verificar se API está rodando
curl http://localhost:8000

# Verificar logs da API
python api_bridge.py
```

### React não carrega
```bash
# Limpar cache e reinstalar
cd vcm-dashboard
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Scripts Python falham
- Verificar se diretório AUTOMACAO existe
- Conferir dependências dos scripts originais
- Verificar logs da API Bridge

## 📞 Suporte

- **Documentação completa**: `Docs/` folder
- **API docs**: http://localhost:8000/docs
- **Arquitetura**: Ver `Docs/arquitetura-tecnica.md`
- **Implementação**: Ver `Docs/guia-implementacao.md`

---

**Versão**: 1.0.0  
**Status**: Em desenvolvimento ativo  
**Última atualização**: November 2025