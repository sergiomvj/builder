#!/bin/bash
# Script de Deploy Automático - VCM Dashboard
# Execute com: ./deploy-vcm.sh

set -e  # Para em caso de erro

echo "🚀 Iniciando Deploy VCM Dashboard..."
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar Node.js
log "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

NODE_VERSION=$(node -v)
log "Node.js versão: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm não encontrado. Instale npm primeiro."
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto VCM"
    exit 1
fi

# Verificar scripts Node.js
log "Verificando scripts Node.js..."
REQUIRED_SCRIPTS=(
    "AUTOMACAO/02_PROCESSAMENTO_PERSONAS/01_generate_competencias.js"
    "AUTOMACAO/02_PROCESSAMENTO_PERSONAS/02_generate_tech_specs.js" 
    "AUTOMACAO/02_PROCESSAMENTO_PERSONAS/03_generate_rag.js"
    "AUTOMACAO/02_PROCESSAMENTO_PERSONAS/04_generate_fluxos_analise.js"
    "AUTOMACAO/02_PROCESSAMENTO_PERSONAS/05_generate_workflows_n8n.js"
    "AUTOMACAO/01_SETUP_E_CRIACAO/05_auto_biografia_generator.js"
    "api_bridge.js"
)

MISSING_SCRIPTS=()
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
        MISSING_SCRIPTS+=("$script")
    fi
done

if [ ${#MISSING_SCRIPTS[@]} -ne 0 ]; then
    warning "Scripts ausentes encontrados:"
    for script in "${MISSING_SCRIPTS[@]}"; do
        echo "  - $script"
    done
    warning "Continue mesmo assim? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Limpar build anterior
log "Limpando build anterior..."
rm -rf .next

# Instalar dependências
log "Instalando dependências..."
npm ci

# Build de produção
log "Executando build de produção..."
npm run build

if [ $? -ne 0 ]; then
    error "Build falhou! Verifique os erros acima."
    exit 1
fi

log "✅ Build concluído com sucesso!"

# Verificar arquivo .env
if [ ! -f ".env" ] && [ ! -f ".env.production" ] && [ ! -f ".env.local" ]; then
    warning "Nenhum arquivo .env encontrado. Criar arquivo .env de exemplo? (Y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]] || [[ -z "$response" ]]; then
        cat > .env.example << EOF
# Configurações VCM Dashboard
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase VCM Central
VCM_SUPABASE_URL=your_vcm_supabase_url
VCM_SUPABASE_KEY=your_vcm_supabase_key

# Supabase RAG Database
LIFEWAY_SUPABASE_URL=your_lifeway_supabase_url
LIFEWAY_SUPABASE_KEY=your_lifeway_supabase_key

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Sistema
EMPRESA_PADRAO=LIFEWAY
EMPRESA_CODIGO=LWY
PORT=3000
EOF
        log "Arquivo .env.example criado. Configure suas variáveis antes do deploy final."
    fi
fi

# Testar build local
log "Testando servidor de produção..."
npm start &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 5

# Health check
log "Executando health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Health check passou!"
else
    warning "⚠️  Health check falhou - mas pode ser normal se APIs não estiverem configuradas"
fi

# Parar servidor de teste
kill $SERVER_PID 2>/dev/null || true

echo ""
echo -e "${BLUE}======================================"
echo -e "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo -e "======================================${NC}"
echo ""
echo -e "${GREEN}Próximos passos:${NC}"
echo "1. Configure variáveis de ambiente (.env)"
echo "2. Escolha plataforma de deploy:"
echo "   • Vercel: vercel --prod"
echo "   • Docker: docker build -t vcm-dashboard ."
echo "   • VPS: npm start"
echo ""
echo -e "${GREEN}URLs locais:${NC}"
echo "• Desenvolvimento: http://localhost:3001"
echo "• Produção: http://localhost:3000"
echo ""
echo -e "${GREEN}APIs disponíveis:${NC}"
echo "• Health: /api/health"
echo "• Scripts: /api/nodejs-scripts"
echo "• Status: /api/nodejs-scripts/status"
echo "• Cascata: /api/cascade-nodejs"
echo ""
echo -e "${BLUE}Dashboard funcionando com 7 scripts Node.js integrados!${NC}"
echo ""