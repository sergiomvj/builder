# 📑 ÍNDICE DO PROJETO VCM

**Guia de navegação rápida - Onde encontrar cada coisa**

---

## 📚 DOCUMENTAÇÃO

| Arquivo | Descrição | Público |
|---------|-----------|---------|
| `docs/USER_MANUAL.md` | Manual completo do usuário | ⭐ Usuários |
| `docs/SYSTEM_DOCUMENTATION.md` | Documentação técnica completa | 💻 Devs |
| `README.md` | Quick start e overview | 🌐 Todos |
| `.github/copilot-instructions.md` | Guia para AI agents | 🤖 AI |
| `TRABALHO_AUTONOMO_COMPLETO.md` | Resumo do trabalho autônomo | 📝 Info |
| `CLEANUP_REPORT.md` | Relatório de reorganização | 📋 Histórico |

---

## 🤖 SCRIPTS DE AUTOMAÇÃO

### Geração Base (`AUTOMACAO/`)

| Script | Função | Tempo | Custo |
|--------|--------|-------|-------|
| `00_generate_avatares.js` | Aparência física | 2min | $0.50 |
| `01_generate_biografias_REAL.js` | Biografias | 3min | $1.00 |
| `02_generate_competencias_vcm.js` | Competências + Subsistemas + Tarefas ✨NEW | 5min | $1.50 |

### Processamento Avançado (`AUTOMACAO/`)

| Script | Função | Tempo | Custo |
|--------|--------|-------|-------|
| `03_generate_tech_specs.js` | Especificações técnicas | 3min | $1.00 |
| `04_generate_rag_knowledge.js` | Base de conhecimento | 4min | $1.50 |
| `05_generate_fluxos_sdr.js` | Fluxos de trabalho | 3min | $1.00 |
| `06_generate_avatares_multimedia.js` | Fotos profissionais AI (FIXED) | 2min | $0.75 |

### Utilidades (`AUTOMACAO/`)

| Script | Função |
|--------|--------|
| `check_avatares.js` | Verifica avatares no banco |
| `check_env_and_supabase.js` | Testa conexões ✅ |
| `delete_all_avatares.js` | Remove todos os avatares |

**⚠️ Nota:** Scripts `check_empresas.js` e similares foram movidos para `legacy/`

### Templates (`AUTOMACAO/05_TEMPLATES_SISTEMA/`)

| Arquivo | Descrição |
|---------|-----------|
| `SDR_JUNIOR_PROFILE.md` | Perfil completo SDR Junior ✨NEW |
| `personas_config.json` | Configuração de personas |

---

## 📂 OUTPUTS

Todos em `AUTOMACAO/`:

| Pasta | Conteúdo |
|-------|----------|
| `04_BIOS_PERSONAS_REAL/` | Biografias geradas (JSONs) |
| `competencias_output/` | Competências por persona |
| `tech_specs_output/` | Especificações técnicas |
| `06_RAG_KNOWLEDGE_BASE/` | Bases de conhecimento |
| `fluxos_sdr_output/` | Fluxos de trabalho |
| `biografias_output/` | Biografias alternativas |

---

## 🎨 FRONTEND

### Páginas Principais (`src/app/`)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `page.tsx` | Dashboard principal |
| `/empresas` | `empresas/page.tsx` | Lista de empresas |
| `/empresas/[id]` | `empresas/[id]/page.tsx` | Detalhes da empresa |
| `/personas` | `personas/page.tsx` | Lista de personas |
| `/personas/[id]` | `personas/[id]/page.tsx` | Detalhes da persona |
| `/avatares` | `avatares/page.tsx` | Galeria de avatares |
| `/subsystems/*` | `subsystems/*/page.tsx` | 12 subsistemas VCM |

### Componentes Chave (`src/components/`)

| Componente | Função |
|-----------|--------|
| `company-form.tsx` | Criar/editar empresa (FIXED) |
| `PersonaDetail.tsx` | Exibir detalhes da persona |
| `PersonaAvatars.tsx` | Grid de avatares da persona |
| `delete-company-modal.tsx` | Modal de exclusão (FIXED) |
| `sidebar-navigation.tsx` | Menu lateral |
| `equipe-diversa-generator-safe.tsx` | Gerar equipe |

### API Routes (`src/app/api/`)

| Endpoint | Função |
|----------|--------|
| `/api/empresas` | CRUD empresas |
| `/api/personas` | CRUD personas |
| `/api/automation` | Executar scripts |
| `/api/health` | Healthcheck |

---

## 🗄️ BANCO DE DADOS

**Supabase PostgreSQL**

### Tabelas Principais

| Tabela | Descrição | Relacionamento |
|--------|-----------|----------------|
| `empresas` | Empresas virtuais | 1:N com personas |
| `personas` | Agentes AI | N:1 com empresas |
| `personas_avatares` | Aparência + biografia | 1:1 com personas |
| `avatares_multimedia` | Fotos profissionais | N:N com personas |
| `fluxos_sdr` | Fluxos de trabalho | N:1 com empresas |

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI Services
GOOGLE_AI_API_KEY=      # Gemini (obrigatório)
OPENAI_API_KEY=         # OpenAI (opcional)
FAL_KEY=                # Fal.ai (para avatares)
```

### Arquivos de Config

| Arquivo | Função |
|---------|--------|
| `next.config.mjs` | Config Next.js |
| `tailwind.config.ts` | Config Tailwind |
| `tsconfig.json` | Config TypeScript |
| `docker-compose.prod.yml` | Docker produção |
| `Dockerfile.prod` | Docker build |
| `package.json` | Dependencies + scripts |

---

## 🚀 DEPLOY

### Docker

```bash
npm run deploy          # Build + start
npm run deploy:logs     # Ver logs
```

### Portas

- **Dev:** 3001
- **Prod:** 3000

### Healthcheck

```bash
curl http://localhost:3000/api/health
```

---

## 📦 LEGACY

Pasta `legacy/` contém:
- Arquivos antigos do Old_Files (~100 arquivos)
- Scripts Python descontinuados
- Versões antigas de componentes
- Documentação obsoleta
- `check_empresas.js`, `check_persona.js` e outros utilitários antigos

⚠️ **Não usar em produção!**

---

## 🎯 WORKFLOWS COMUNS

### Criar empresa completa:

1. Interface: Criar empresa + gerar equipe
2. Terminal: Executar 7 scripts em sequência
3. Interface: Verificar personas e avatares

### Executar cascade completo:

```bash
cd AUTOMACAO

# 1. Geração básica
node 00_generate_avatares.js --empresaId=UUID
node 01_generate_biografias_REAL.js --empresaId=UUID
node 02_generate_competencias_vcm.js --empresaId=UUID

# 2. Processamento avançado
node 03_generate_tech_specs.js --empresaId=UUID
node 04_generate_rag_knowledge.js --empresaId=UUID
node 05_generate_fluxos_sdr.js --empresaId=UUID
node 06_generate_avatares_multimedia.js --empresaId=UUID --style=casual
```

### Regenerar avatares:

```bash
cd AUTOMACAO
node delete_all_avatares.js
node 06_generate_avatares_multimedia.js --empresaId=UUID --style=casual
```

### Backup completo:

```bash
# 1. Export Supabase (SQL dump)
# 2. Copiar pasta AUTOMACAO/*_output/
# 3. Copiar .env.local
```

---

## 🆘 TROUBLESHOOTING

| Problema | Solução | Arquivo Relacionado |
|----------|---------|-------------------|
| Avatares não aparecem | Verificar empresa_id no banco | `check_avatares.js` |
| Nacionalidades não somam 100% | Corrigido em 29/11 | `company-form.tsx` |
| Script trava | Verificar API keys | `.env.local` |
| Erro Supabase | Testar com `check_env_and_supabase.js` | `AUTOMACAO/` |
| Foto gênero errado | Delete + regenerate com script FIXED | `06_generate_avatares_multimedia.js` |

---

## 🌟 NOVIDADES (29/11/2025)

### Funcionalidades Novas
- ✨ **12 Subsistemas VCM** integrados (PROSPECAO, VENDAS, MARKETING, etc.)
- ✨ **Tarefas estruturadas** (diárias/semanais/mensais) por subsistema
- ✨ **Perfil SDR Junior completo** com agenda horária e KPIs
- ✨ **Documentação técnica** abrangente (1200+ linhas)
- ✨ **Manual do usuário** expandido (1000+ linhas)
- ✨ **Projeto reorganizado** com estrutura intuitiva

### Correções Aplicadas
- ✅ Avatares: Prompts corrigidos (gênero explícito, idade, roupas casuais)
- ✅ Nacionalidades: Soma correta (filtra valores > 0)
- ✅ Cascade deletion: Deleta avatares + fluxos + personas + empresa
- ✅ Legacy: Consolidado ~100 arquivos em pasta única

---

## 📞 SUPORTE

Se tiver dúvidas:

1. **Navegação:** Este arquivo (PROJECT_INDEX.md)
2. **Como usar:** `docs/USER_MANUAL.md`
3. **Técnico:** `docs/SYSTEM_DOCUMENTATION.md`
4. **Mudanças:** `CLEANUP_REPORT.md`
5. **Trabalho autônomo:** `TRABALHO_AUTONOMO_COMPLETO.md`
6. **Arquivos antigos:** Procurar em `legacy/`

---

**🎯 QUICK LINKS**

- 📖 [Manual do Usuário](./docs/USER_MANUAL.md)
- 🏗️ [Documentação Técnica](./docs/SYSTEM_DOCUMENTATION.md)
- 📋 [README](./README.md)
- 🧹 [Relatório de Limpeza](./CLEANUP_REPORT.md)
- ✅ [Trabalho Autônomo Completo](./TRABALHO_AUTONOMO_COMPLETO.md)
- 👨‍💼 [Perfil SDR Junior](./AUTOMACAO/05_TEMPLATES_SISTEMA/SDR_JUNIOR_PROFILE.md)

---

**Última atualização:** 29/11/2025  
**Versão:** 2.0.0  
**Status:** ✅ Sistema funcionando perfeitamente
