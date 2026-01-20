# BuildCorp v2.6

**Sistema de Gestão de Empresas Virtuais com Multi-Agentes AI**

Sistema de gestão de empresas virtuais com IA multi-agente.

## 🎯 Visão Geral

O VCM é uma plataforma Next.js 14 que cria organizações virtuais autônomas através de assistentes de IA especializados. O sistema utiliza uma abordagem multi-agente para todas as tarefas empresariais.

## 🚀 Tecnologias

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: API Routes do Next.js
- **Database**: Supabase (PostgreSQL)
- **IA**: Google Gemini + OpenAI
- **Deploy**: Docker + Docker Compose

## 📁 Estrutura do Projeto

```
├── src/app/                 # Next.js App Router
│   ├── api/                # API Routes
│   ├── empresas/           # Páginas de empresas
│   ├── personas/           # Gestão de personas
│   └── subsystems/         # 12 dashboards especializados
├── AUTOMACAO/              # Scripts de automação Node.js
│   ├── 00_generate_avatares.js
│   ├── 01_generate_biografias_REAL.js
│   └── 02_PROCESSAMENTO_PERSONAS/
├── public/                 # Assets estáticos
└── Old_Files/              # Arquivos legados (não essenciais)
```

## 🔧 Instalação e Uso

### Desenvolvimento Local
```bash
npm install
npm run dev    # Porta 3001
```

### Produção
```bash
npm run deploy     # Docker + docker-compose
npm run health     # Verificar status
```

## 🎯 Sistema de Automação

Execute os scripts na ordem:
```bash
cd AUTOMACAO
node 00_generate_avatares.js --empresaId=ID
node 01_generate_biografias_REAL.js --empresaId=ID
cd 02_PROCESSAMENTO_PERSONAS
node process_tarefas_robust.js --empresaId=ID
node process_rag_robust.js --empresaId=ID
node process_fluxos_robust.js --empresaId=ID
```

## 🌟 Funcionalidades

- ✅ Criação automática de personas IA
- ✅ Geração de avatares e biografias
- ✅ Sistema de tarefas e competências
- ✅ Knowledge base (RAG)
- ✅ Fluxos SDR automatizados
- ✅ 12 subsistemas especializados
- ✅ Interface responsiva e intuitiva

## 🔗 Links Importantes

- **Desenvolvimento**: http://localhost:3001
- **Produção**: http://localhost:3000
- **Health Check**: /api/health
- **Database**: Supabase Dashboard

## 📝 Versão

**v2.6** - Sistema completo com automação 100% funcional

---

Para mais detalhes sobre implementação e arquitetura, consulte os arquivos em `Old_Files/`.