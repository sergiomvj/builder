#!/usr/bin/env node
/**
 * 🧹 SCRIPT DE HIGIENIZAÇÃO E REORGANIZAÇÃO DO PROJETO VCM
 * =========================================================
 * 
 * Organiza arquivos em estrutura intuitiva
 * Remove arquivos desnecessários
 * Consolida documentação
 * 
 * @date 2025-11-29
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🧹 INICIANDO HIGIENIZAÇÃO DO PROJETO VCM\n');
console.log('='.repeat(60));

// ============================================
// ESTRUTURA ORGANIZADA DESEJADA
// ============================================
const NEW_STRUCTURE = {
  'docs/': {
    description: 'Documentação completa',
    files: [
      'SYSTEM_DOCUMENTATION.md',
      'USER_MANUAL.md',
      'README.md',
      '.github/copilot-instructions.md'
    ]
  },
  'scripts/': {
    description: 'Scripts de automação principais',
    subfolders: {
      '01_generation/': [
        '00_generate_avatares.js',
        '01_generate_biografias_REAL.js',
        '02_generate_competencias_vcm.js'
      ],
      '02_processing/': [
        '03_generate_tech_specs.js',
        '04_generate_rag_knowledge.js',
        '05_generate_fluxos_sdr.js',
        '06_generate_avatares_multimedia.js'
      ],
      '03_utilities/': [
        'check_avatares.js',
        'check_empresas.js',
        'check_env_and_supabase.js',
        'delete_all_avatares.js'
      ],
      'templates/': [
        'SDR_JUNIOR_PROFILE.md',
        'personas_config.json'
      ]
    }
  },
  'outputs/': {
    description: 'Outputs dos scripts',
    subfolders: {
      'biografias/': [],
      'competencias/': [],
      'tech_specs/': [],
      'rag_knowledge/': [],
      'fluxos_sdr/': [],
      'avatares/': [],
      'logs/': []
    }
  },
  'legacy/': {
    description: 'Arquivos antigos e descontinuados',
    note: 'Mover tudo de Old_Files para cá'
  }
};

// ============================================
// ARQUIVOS PARA REMOVER
// ============================================
const FILES_TO_REMOVE = [
  // Duplicados
  '01_generate_biografias_REAL_FIXED.js',
  
  // Temporários
  '**/*~',
  '**/*.tmp',
  '**/*.backup',
  
  // Logs antigos (manter apenas últimos 30 dias)
  'AUTOMACAO/**/log_*.json', // avaliar data
  
  // Node modules duplicados
  'node_modules_old/',
  
  // Cache
  '.next/cache/',
  '**/.DS_Store',
  '**/Thumbs.db'
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function createDirectoryStructure(basePath, structure, parentPath = '') {
  for (const [folder, content] of Object.entries(structure)) {
    const fullPath = path.join(basePath, parentPath, folder);
    
    try {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`📁 Criado: ${fullPath}`);
      
      if (content.subfolders) {
        await createDirectoryStructure(basePath, content.subfolders, path.join(parentPath, folder));
      }
    } catch (error) {
      console.error(`❌ Erro ao criar ${fullPath}:`, error.message);
    }
  }
}

async function moveFile(from, to) {
  try {
    const fromPath = path.join(PROJECT_ROOT, from);
    const toPath = path.join(PROJECT_ROOT, to);
    
    // Verificar se o arquivo origem existe
    try {
      await fs.access(fromPath);
    } catch {
      // console.log(`⚠️  Arquivo não encontrado: ${from}`);
      return false;
    }
    
    // Criar diretório de destino se não existir
    await fs.mkdir(path.dirname(toPath), { recursive: true });
    
    // Mover arquivo
    await fs.rename(fromPath, toPath);
    console.log(`✅ Movido: ${from} → ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao mover ${from}:`, error.message);
    return false;
  }
}

async function consolidateOldFiles() {
  console.log('\n📦 Consolidando Old_Files...\n');
  
  const oldFilesPath = path.join(PROJECT_ROOT, 'Old_Files');
  const legacyPath = path.join(PROJECT_ROOT, 'legacy');
  
  try {
    // Criar pasta legacy
    await fs.mkdir(legacyPath, { recursive: true });
    
    // Mover Old_Files inteiro
    const files = await fs.readdir(oldFilesPath);
    let moved = 0;
    
    for (const file of files) {
      const from = path.join(oldFilesPath, file);
      const to = path.join(legacyPath, file);
      
      try {
        await fs.rename(from, to);
        moved++;
      } catch (error) {
        console.error(`❌ Erro ao mover ${file}:`, error.message);
      }
    }
    
    console.log(`✅ ${moved} arquivos movidos para legacy/`);
    
    // Remover Old_Files vazio
    try {
      await fs.rmdir(oldFilesPath);
      console.log(`✅ Removido: Old_Files/`);
    } catch (error) {
      console.log(`⚠️  Old_Files não está vazio, mantendo...`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao consolidar Old_Files:`, error.message);
  }
}

async function organizeAutomacaoFolder() {
  console.log('\n🔧 Organizando pasta AUTOMACAO...\n');
  
  const automacaoPath = path.join(PROJECT_ROOT, 'AUTOMACAO');
  const scriptsPath = path.join(PROJECT_ROOT, 'scripts');
  
  // Criar estrutura de scripts
  await fs.mkdir(path.join(scriptsPath, '01_generation'), { recursive: true });
  await fs.mkdir(path.join(scriptsPath, '02_processing'), { recursive: true });
  await fs.mkdir(path.join(scriptsPath, '03_utilities'), { recursive: true });
  await fs.mkdir(path.join(scriptsPath, 'templates'), { recursive: true });
  
  // Mapear movimentações
  const moves = [
    // Geração
    ['AUTOMACAO/00_generate_avatares.js', 'scripts/01_generation/00_generate_avatares.js'],
    ['AUTOMACAO/01_generate_biografias_REAL.js', 'scripts/01_generation/01_generate_biografias.js'],
    ['AUTOMACAO/02_generate_competencias_vcm.js', 'scripts/01_generation/02_generate_competencias_vcm.js'],
    
    // Processamento
    ['AUTOMACAO/03_generate_tech_specs.js', 'scripts/02_processing/03_generate_tech_specs.js'],
    ['AUTOMACAO/04_generate_rag_knowledge.js', 'scripts/02_processing/04_generate_rag_knowledge.js'],
    ['AUTOMACAO/05_generate_fluxos_sdr.js', 'scripts/02_processing/05_generate_fluxos_sdr.js'],
    ['AUTOMACAO/06_generate_avatares_multimedia.js', 'scripts/02_processing/06_generate_avatares_multimedia.js'],
    
    // Utilidades
    ['AUTOMACAO/check_avatares.js', 'scripts/03_utilities/check_avatares.js'],
    ['AUTOMACAO/check_empresas.js', 'scripts/03_utilities/check_empresas.js'],
    ['AUTOMACAO/check_env_and_supabase.js', 'scripts/03_utilities/check_env_and_supabase.js'],
    ['AUTOMACAO/delete_all_avatares.js', 'scripts/03_utilities/delete_all_avatares.js'],
    
    // Templates
    ['AUTOMACAO/05_TEMPLATES_SISTEMA/SDR_JUNIOR_PROFILE.md', 'scripts/templates/SDR_JUNIOR_PROFILE.md'],
    ['AUTOMACAO/personas_config.json', 'scripts/templates/personas_config.json']
  ];
  
  for (const [from, to] of moves) {
    await moveFile(from, to);
  }
}

async function organizeOutputs() {
  console.log('\n📂 Organizando outputs...\n');
  
  const outputsPath = path.join(PROJECT_ROOT, 'outputs');
  
  // Criar estrutura
  await fs.mkdir(path.join(outputsPath, 'biografias'), { recursive: true });
  await fs.mkdir(path.join(outputsPath, 'competencias'), { recursive: true });
  await fs.mkdir(path.join(outputsPath, 'tech_specs'), { recursive: true });
  await fs.mkdir(path.join(outputsPath, 'rag_knowledge'), { recursive: true });
  await fs.mkdir(path.join(outputsPath, 'fluxos_sdr'), { recursive: true });
  await fs.mkdir(path.join(outputsPath, 'avatares'), { recursive: true });
  await fs.mkdir(path.join(outputsPath, 'logs'), { recursive: true });
  
  // Mapear movimentações
  const moves = [
    ['AUTOMACAO/04_BIOS_PERSONAS_REAL', 'outputs/biografias'],
    ['AUTOMACAO/competencias_output', 'outputs/competencias'],
    ['AUTOMACAO/tech_specs_output', 'outputs/tech_specs'],
    ['AUTOMACAO/06_RAG_KNOWLEDGE_BASE', 'outputs/rag_knowledge'],
    ['AUTOMACAO/fluxos_sdr_output', 'outputs/fluxos_sdr'],
    ['AUTOMACAO/avatares_multimedia_output', 'outputs/avatares']
  ];
  
  for (const [from, to] of moves) {
    const fromPath = path.join(PROJECT_ROOT, from);
    const toPath = path.join(PROJECT_ROOT, to);
    
    try {
      await fs.access(fromPath);
      
      // Mover conteúdo
      const files = await fs.readdir(fromPath);
      
      for (const file of files) {
        const source = path.join(fromPath, file);
        const dest = path.join(toPath, file);
        
        try {
          await fs.rename(source, dest);
        } catch (error) {
          // Se já existe, pular
          if (error.code !== 'EEXIST') {
            console.error(`❌ Erro ao mover ${file}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Conteúdo movido: ${from} → ${to}`);
      
    } catch (error) {
      // Pasta não existe, pular
    }
  }
}

async function organizeDocs() {
  console.log('\n📚 Organizando documentação...\n');
  
  const docsPath = path.join(PROJECT_ROOT, 'docs');
  await fs.mkdir(docsPath, { recursive: true });
  
  const moves = [
    ['SYSTEM_DOCUMENTATION.md', 'docs/SYSTEM_DOCUMENTATION.md'],
    ['USER_MANUAL.md', 'docs/USER_MANUAL.md'],
    ['README.md', 'docs/README_BACKUP.md'], // Backup, manter original na raiz
  ];
  
  for (const [from, to] of moves) {
    const fromPath = path.join(PROJECT_ROOT, from);
    
    try {
      await fs.access(fromPath);
      await fs.copyFile(fromPath, path.join(PROJECT_ROOT, to));
      console.log(`✅ Copiado: ${from} → ${to}`);
    } catch (error) {
      // Arquivo não existe
    }
  }
}

async function createREADME() {
  console.log('\n📝 Atualizando README.md...\n');
  
  const readme = `# 🏢 VCM - Virtual Company Manager

**Sistema de Gestão de Empresas Virtuais com Multi-Agentes AI**

---

## 📚 DOCUMENTAÇÃO

- **[📖 Manual do Usuário](./docs/USER_MANUAL.md)** - Guia completo para usuários
- **[🏗️ Documentação Técnica](./docs/SYSTEM_DOCUMENTATION.md)** - Arquitetura e desenvolvimento
- **[📋 Copilot Instructions](./.github/copilot-instructions.md)** - Guia para AI coding agents

---

## 🚀 INÍCIO RÁPIDO

### 1. Instalação

\`\`\`bash
npm install
\`\`\`

### 2. Configuração

Copie \`.env.example\` para \`.env.local\` e preencha:

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key

# AI Services
GOOGLE_AI_API_KEY=sua-gemini-key
OPENAI_API_KEY=sua-openai-key (opcional)
FAL_KEY=sua-fal-key
\`\`\`

### 3. Desenvolvimento

\`\`\`bash
npm run dev
# Acesse: http://localhost:3001
\`\`\`

### 4. Produção

\`\`\`bash
npm run deploy
# Inicia em Docker na porta 3000
\`\`\`

---

## 🤖 SCRIPTS DE AUTOMAÇÃO

**Localização:** \`scripts/\`

**Sequência obrigatória:**

\`\`\`bash
cd scripts

# 1. Geração básica
node 01_generation/00_generate_avatares.js --empresaId=UUID
node 01_generation/01_generate_biografias.js --empresaId=UUID
node 01_generation/02_generate_competencias_vcm.js --empresaId=UUID

# 2. Processamento avançado
node 02_processing/03_generate_tech_specs.js --empresaId=UUID
node 02_processing/04_generate_rag_knowledge.js --empresaId=UUID
node 02_processing/05_generate_fluxos_sdr.js --empresaId=UUID
node 02_processing/06_generate_avatares_multimedia.js --empresaId=UUID --style=casual

# 3. Utilitários
node 03_utilities/check_avatares.js
node 03_utilities/check_empresas.js
\`\`\`

---

## 📁 ESTRUTURA DO PROJETO

\`\`\`
vcm_vite_react/
├── docs/                    # Documentação completa
├── scripts/                 # Scripts de automação
│   ├── 01_generation/      # Geração de conteúdo base
│   ├── 02_processing/      # Processamento avançado
│   ├── 03_utilities/       # Ferramentas auxiliares
│   └── templates/          # Templates e configurações
├── outputs/                # Outputs dos scripts
│   ├── biografias/
│   ├── competencias/
│   ├── tech_specs/
│   ├── rag_knowledge/
│   ├── fluxos_sdr/
│   ├── avatares/
│   └── logs/
├── src/                    # Código fonte Next.js
│   ├── app/               # App Router (páginas + API)
│   ├── components/        # Componentes React
│   └── lib/              # Utilidades e hooks
├── legacy/               # Arquivos antigos (Old_Files)
└── public/              # Assets estáticos
\`\`\`

---

## 🔧 COMANDOS ÚTEIS

\`\`\`bash
# Desenvolvimento
npm run dev              # Dev server (porta 3001)
npm run build           # Build de produção
npm run start           # Start produção

# Docker
npm run deploy          # Build + deploy Docker
npm run deploy:logs     # Ver logs do container

# Health
npm run health          # Verificar saúde do sistema
\`\`\`

---

## 🎯 CASOS DE USO

1. **Simulação de empresas** para treinamento
2. **Automação de processos** com agentes especializados
3. **Prototipagem organizacional** antes de contratações
4. **Demonstrações B2B** de produtos
5. **Research** de estruturas organizacionais

---

## 📊 TECNOLOGIAS

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase PostgreSQL
- **AI:** Google Gemini, OpenAI GPT-4, Fal.ai Flux-Pro
- **Deploy:** Docker, Nginx, VPS Linux

---

## 📝 LICENÇA

Proprietary - Todos os direitos reservados

---

## 👨‍💻 MAINTAINER

**Sergio Castro**  
Data: 29/11/2025  
Versão: 2.0.0
`;

  await fs.writeFile(path.join(PROJECT_ROOT, 'README.md'), readme);
  console.log('✅ README.md atualizado');
}

async function createProjectIndex() {
  console.log('\n📋 Criando índice do projeto...\n');
  
  const indexPath = path.join(PROJECT_ROOT, 'PROJECT_INDEX.md');
  
  const index = `# 📑 ÍNDICE DO PROJETO VCM

**Guia de navegação rápida - Onde encontrar cada coisa**

---

## 📚 DOCUMENTAÇÃO

| Arquivo | Descrição | Público |
|---------|-----------|---------|
| \`docs/USER_MANUAL.md\` | Manual completo do usuário | ⭐ Usuários |
| \`docs/SYSTEM_DOCUMENTATION.md\` | Documentação técnica completa | 💻 Devs |
| \`README.md\` | Quick start e overview | 🌐 Todos |
| \`.github/copilot-instructions.md\` | Guia para AI agents | 🤖 AI |

---

## 🤖 SCRIPTS DE AUTOMAÇÃO

### Geração Base (\`scripts/01_generation/\`)

| Script | Função | Tempo | Custo |
|--------|--------|-------|-------|
| \`00_generate_avatares.js\` | Aparência física | 2min | $0.50 |
| \`01_generate_biografias.js\` | Biografias | 3min | $1.00 |
| \`02_generate_competencias_vcm.js\` | Competências + Subsistemas + Tarefas | 5min | $1.50 |

### Processamento Avançado (\`scripts/02_processing/\`)

| Script | Função | Tempo | Custo |
|--------|--------|-------|-------|
| \`03_generate_tech_specs.js\` | Especificações técnicas | 3min | $1.00 |
| \`04_generate_rag_knowledge.js\` | Base de conhecimento | 4min | $1.50 |
| \`05_generate_fluxos_sdr.js\` | Fluxos de trabalho | 3min | $1.00 |
| \`06_generate_avatares_multimedia.js\` | Fotos profissionais AI | 2min | $0.75 |

### Utilidades (\`scripts/03_utilities/\`)

| Script | Função |
|--------|--------|
| \`check_avatares.js\` | Verifica avatares no banco |
| \`check_empresas.js\` | Lista empresas e status |
| \`check_env_and_supabase.js\` | Testa conexões |
| \`delete_all_avatares.js\` | Remove todos os avatares |

### Templates (\`scripts/templates/\`)

| Arquivo | Descrição |
|---------|-----------|
| \`SDR_JUNIOR_PROFILE.md\` | Perfil completo SDR Junior |
| \`personas_config.json\` | Configuração de personas |

---

## 📂 OUTPUTS

Todos em \`outputs/\`:

| Pasta | Conteúdo |
|-------|----------|
| \`biografias/\` | Biografias geradas (JSONs) |
| \`competencias/\` | Competências por persona |
| \`tech_specs/\` | Especificações técnicas |
| \`rag_knowledge/\` | Bases de conhecimento |
| \`fluxos_sdr/\` | Fluxos de trabalho |
| \`avatares/\` | Logs de geração de avatares |
| \`logs/\` | Logs gerais de execução |

---

## 🎨 FRONTEND

### Páginas Principais (\`src/app/\`)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| \`/\` | \`page.tsx\` | Dashboard principal |
| \`/empresas\` | \`empresas/page.tsx\` | Lista de empresas |
| \`/empresas/[id]\` | \`empresas/[id]/page.tsx\` | Detalhes da empresa |
| \`/personas\` | \`personas/page.tsx\` | Lista de personas |
| \`/personas/[id]\` | \`personas/[id]/page.tsx\` | Detalhes da persona |
| \`/avatares\` | \`avatares/page.tsx\` | Galeria de avatares |
| \`/subsystems/*\` | \`subsystems/*/page.tsx\` | 12 subsistemas VCM |

### Componentes Chave (\`src/components/\`)

| Componente | Função |
|-----------|--------|
| \`company-form.tsx\` | Criar/editar empresa |
| \`PersonaDetail.tsx\` | Exibir detalhes da persona |
| \`PersonaAvatars.tsx\` | Grid de avatares da persona |
| \`delete-company-modal.tsx\` | Modal de exclusão |
| \`sidebar-navigation.tsx\` | Menu lateral |
| \`equipe-diversa-generator-safe.tsx\` | Gerar equipe |

### API Routes (\`src/app/api/\`)

| Endpoint | Função |
|----------|--------|
| \`/api/empresas\` | CRUD empresas |
| \`/api/personas\` | CRUD personas |
| \`/api/automation\` | Executar scripts |
| \`/api/health\` | Healthcheck |

---

## 🗄️ BANCO DE DADOS

**Supabase PostgreSQL**

### Tabelas Principais

| Tabela | Descrição | Relacionamento |
|--------|-----------|----------------|
| \`empresas\` | Empresas virtuais | 1:N com personas |
| \`personas\` | Agentes AI | N:1 com empresas |
| \`personas_avatares\` | Aparência + biografia | 1:1 com personas |
| \`avatares_multimedia\` | Fotos profissionais | N:N com personas |
| \`fluxos_sdr\` | Fluxos de trabalho | N:1 com empresas |

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente (\`.env.local\`)

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI Services
GOOGLE_AI_API_KEY=      # Gemini (obrigatório)
OPENAI_API_KEY=         # OpenAI (opcional)
FAL_KEY=                # Fal.ai (para avatares)
\`\`\`

### Arquivos de Config

| Arquivo | Função |
|---------|--------|
| \`next.config.mjs\` | Config Next.js |
| \`tailwind.config.ts\` | Config Tailwind |
| \`tsconfig.json\` | Config TypeScript |
| \`docker-compose.prod.yml\` | Docker produção |
| \`Dockerfile.prod\` | Docker build |
| \`package.json\` | Dependencies + scripts |

---

## 🚀 DEPLOY

### Docker

\`\`\`bash
npm run deploy          # Build + start
npm run deploy:logs     # Ver logs
\`\`\`

### Portas

- **Dev:** 3001
- **Prod:** 3000

### Healthcheck

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

---

## 📦 LEGACY

Pasta \`legacy/\` contém:
- Arquivos antigos do Old_Files
- Scripts Python descontinuados
- Versões antigas de componentes
- Documentação obsoleta

⚠️ **Não usar em produção!**

---

## 🎯 WORKFLOWS COMUNS

### Criar empresa completa:

1. Interface: Criar empresa + gerar equipe
2. Terminal: Executar 7 scripts em sequência
3. Interface: Verificar personas e avatares

### Regenerar avatares:

\`\`\`bash
cd scripts/03_utilities
node delete_all_avatares.js

cd ../02_processing
node 06_generate_avatares_multimedia.js --empresaId=UUID --style=casual
\`\`\`

### Backup completo:

\`\`\`bash
# 1. Export Supabase (SQL dump)
# 2. Copiar pasta outputs/
# 3. Copiar .env.local
\`\`\`

---

## 🆘 TROUBLESHOOTING

| Problema | Solução | Arquivo Relacionado |
|----------|---------|-------------------|
| Avatares não aparecem | \`check_avatares.js\` | \`scripts/03_utilities/\` |
| Nacionalidades não somam 100% | Corrigido 29/11 | \`company-form.tsx\` |
| Script trava | Verificar API keys | \`.env.local\` |
| Erro Supabase | \`check_env_and_supabase.js\` | \`scripts/03_utilities/\` |

---

## 📞 SUPORTE

1. ✅ Consultar \`docs/USER_MANUAL.md\`
2. ✅ Verificar \`docs/SYSTEM_DOCUMENTATION.md\`
3. ✅ Checar logs em \`outputs/logs/\`
4. ✅ Contatar administrador

---

**Última atualização:** 29/11/2025  
**Versão:** 2.0.0
`;

  await fs.writeFile(indexPath, index);
  console.log('✅ PROJECT_INDEX.md criado');
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  try {
    console.log('\n1️⃣ Consolidando Old_Files...');
    await consolidateOldFiles();
    
    console.log('\n2️⃣ Organizando documentação...');
    await organizeDocs();
    
    console.log('\n3️⃣ Criando índice do projeto...');
    await createProjectIndex();
    
    console.log('\n4️⃣ Atualizando README...');
    await createREADME();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ HIGIENIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📊 Resumo:');
    console.log('   - ✅ Old_Files consolidado em legacy/');
    console.log('   - ✅ Documentação organizada em docs/');
    console.log('   - ✅ Índice do projeto criado');
    console.log('   - ✅ README atualizado');
    console.log('\n📚 Próximos passos (manual):');
    console.log('   1. Revisar scripts/ e outputs/ (estrutura proposta)');
    console.log('   2. Testar se tudo ainda funciona');
    console.log('   3. Commit das mudanças');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
