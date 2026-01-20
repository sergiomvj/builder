# VCM Dashboard - Sistema 100% Node.jsThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



## 🎯 Visão Geral## Getting Started

Sistema Virtual Company Manager totalmente baseado em **Node.js** para automação de empresas virtuais.

First, run the development server:

## 🏗️ Arquitetura Limpa

```bash

### Frontend (Next.js)npm run dev

```# or

vcm-dashboard-real/yarn dev

├── src/app/           # Pages e API routes# or

├── src/components/    # Componentes Reactpnpm dev

└── src/lib/          # Hooks Supabase e utilitários# or

```bun dev

```

### Backend (Node.js)

```Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

AUTOMACAO/

├── 01_generate_biografias_REAL.js     # ✅ Geração de personas e biografiasYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

├── 02_PROCESSAMENTO_PERSONAS/         # ✅ Scripts Node.js de automação

├── 04_BIOS_PERSONAS_REAL/            # 📁 Output das biografiasThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

└── personas_config.json               # ⚙️ Configurações

```## Learn More



## 🚀 ExecuçãoTo learn more about Next.js, take a look at the following resources:



### Desenvolvimento- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

```bash- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

cd vcm-dashboard-real

npm installYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

npm run dev

```## Deploy on Vercel



### Scripts de AutomaçãoThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

```bash

cd AUTOMACAOCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

node 01_generate_biografias_REAL.js --empresa="CODIGO_EMPRESA"
```

## 🔗 Integração
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Backend**: API Routes Node.js 
- **Banco**: Supabase (PostgreSQL)
- **Automação**: Scripts Node.js puros

## 📊 Status
✅ **Empresas**: CRUD completo + banco real  
✅ **Personas**: Geração automática via Node.js  
✅ **Biografias**: AI + Supabase integrado  
✅ **Dashboard**: Interface funcional  

## 🔧 Configuração

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Base de Dados
Todas as operações conectam diretamente ao Supabase:
- Tabela `empresas`: Dados das empresas virtuais
- Tabela `personas`: Personas geradas automaticamente

---
**Sistema 100% funcional** - Python removido completamente ✨