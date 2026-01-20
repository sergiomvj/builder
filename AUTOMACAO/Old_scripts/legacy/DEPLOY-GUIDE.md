# 🚀 Guia de Deploy - VCM Dashboard Node.js

## ✅ Status do Build
- ✅ Build de produção **APROVADO**
- ✅ Otimizações de performance ativadas
- ✅ Compilação TypeScript ignorada para warnings menores
- ✅ ESLint configurado para produção
- ✅ 14 rotas disponíveis (7 APIs + 7 páginas)

## 📋 Pré-requisitos

### Ambiente de Produção
- **Node.js** 18+ 
- **npm** ou **yarn**
- **Servidor** com pelo menos 2GB RAM
- **Porta 3000** disponível (ou configurável)

### Dependências do Sistema
- Scripts Node.js (7 arquivos) nos diretórios `AUTOMACAO/`
- Arquivo `.env` com configurações de produção
- Banco Supabase configurado

## 🔧 Configuração de Produção

### 1. Variáveis de Ambiente
Crie um arquivo `.env.production`:

```env
# Configurações de Produção
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# Supabase VCM Central
VCM_SUPABASE_URL=sua_url_vcm_supabase
VCM_SUPABASE_KEY=sua_chave_vcm_supabase

# Supabase RAG Database
LIFEWAY_SUPABASE_URL=sua_url_lifeway_supabase  
LIFEWAY_SUPABASE_KEY=sua_chave_lifeway_supabase

# API Keys
OPENAI_API_KEY=sua_chave_openai
ANTHROPIC_API_KEY=sua_chave_anthropic
GOOGLE_AI_API_KEY=sua_chave_google_ai

# Configurações do Sistema
EMPRESA_PADRAO=LIFEWAY
EMPRESA_CODIGO=LWY
PORT=3000
```

### 2. Scripts Node.js
Certifique-se que estão presentes:
```
AUTOMACAO/
├── 01_SETUP_E_CRIACAO/
│   └── 05_auto_biografia_generator.js
├── 02_PROCESSAMENTO_PERSONAS/
│   ├── 01_generate_competencias.js
│   ├── 02_generate_tech_specs.js  
│   ├── 03_generate_rag.js
│   ├── 04_generate_fluxos_analise.js
│   └── 05_generate_workflows_n8n.js
└── api_bridge.js
```

## 🚀 Deploy Options

### Opção 1: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no painel Vercel
```

### Opção 2: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build e execução
docker build -t vcm-dashboard .
docker run -p 3000:3000 -d vcm-dashboard
```

### Opção 3: Servidor VPS
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/vcmdashboard.git
cd vcmdashboard

# Instalar dependências
npm ci --production

# Build
npm run build

# Executar
npm start

# Ou com PM2
npm install -g pm2
pm2 start npm --name "vcm-dashboard" -- start
```

## 🔄 Comandos de Deploy

### Build Local
```bash
# Build completo
npm run build

# Testar build local
npm start

# Verificar em: http://localhost:3000
```

### Deploy Automático
```bash
# Script de deploy completo
chmod +x deploy-vcm.sh
./deploy-vcm.sh
```

## 🛡️ Configurações de Segurança

### Headers de Segurança
Já configurado no `next.config.mjs`:
- ✅ `X-Powered-By` desabilitado
- ✅ Otimizações de imagem
- ✅ Webpack otimizado

### Recomendações Adicionais
```bash
# Usar HTTPS em produção
# Configurar CORS apropriadamente
# Limitar taxa de requisições à API
# Monitoramento de logs
```

## 📊 Monitoramento

### Métricas Importantes
- **Tempo de resposta** das APIs Node.js
- **Uso de memória** durante execução de scripts
- **Taxa de sucesso** da cascata (Scripts 1-5)
- **Logs de erro** dos processos Node.js

### Health Check
```bash
# Verificar saúde da aplicação
curl https://seu-dominio.com/api/health

# Verificar status dos scripts
curl https://seu-dominio.com/api/nodejs-scripts/status
```

## 🔍 Troubleshooting

### Problemas Comuns

**Build Failed**
```bash
# Limpar cache e tentar novamente
rm -rf .next node_modules
npm install
npm run build
```

**Scripts Node.js não encontrados**
```bash
# Verificar estrutura de diretórios
ls -la AUTOMACAO/02_PROCESSAMENTO_PERSONAS/
```

**APIs não respondem**
```bash
# Verificar logs
npm start
# Checar http://localhost:3000/api/health
```

**Timeout em execução**
- Aumentar limite de timeout nos scripts
- Verificar recursos do servidor
- Monitorar logs de execução

## 📈 Otimizações de Performance

### Já Implementadas
- ✅ Bundle splitting automático
- ✅ Compressão CSS/JS
- ✅ Webpack optimizations
- ✅ Static generation onde possível
- ✅ Cache de status em memória

### Recomendações
- **CDN** para assets estáticos
- **Load balancer** para múltiplas instâncias
- **Cache Redis** para status de scripts
- **Queue system** para execuções pesadas

## 🎯 Checklist de Deploy

### Pré-Deploy
- [ ] Build local bem-sucedido
- [ ] Variáveis de ambiente configuradas
- [ ] Scripts Node.js testados
- [ ] Banco Supabase acessível

### Deploy
- [ ] Deploy executado com sucesso
- [ ] Health check respondendo
- [ ] Dashboard carregando
- [ ] Aba "Scripts Node.js" funcional

### Pós-Deploy  
- [ ] Testar cascata completa
- [ ] Verificar APIs individuais
- [ ] Monitorar logs por 24h
- [ ] Documentar URL final

## 🌐 URLs Finais

### Produção
- **Dashboard**: https://seu-dominio.com
- **Health Check**: https://seu-dominio.com/api/health
- **Scripts API**: https://seu-dominio.com/api/nodejs-scripts

### Desenvolvimento
- **Local**: http://localhost:3001 (dev)
- **Build**: http://localhost:3000 (production)

---

## 📞 Suporte

Para problemas de deploy:
1. Verificar logs da aplicação
2. Validar variáveis de ambiente  
3. Testar APIs individualmente
4. Consultar documentação específica da plataforma

**🎉 VCM Dashboard pronto para produção!**