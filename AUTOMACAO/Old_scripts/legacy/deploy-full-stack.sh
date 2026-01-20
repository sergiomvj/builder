#!/bin/bash

# VCM Full Stack Deploy Script
# Deploy completo: Frontend + Backend + Database + Cache

set -e

echo "🚀 Iniciando deploy COMPLETO do VCM Dashboard..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
STACK_NAME="vcm-stack"
COMPOSE_FILE="docker-compose.yml"

# Funções
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar pré-requisitos
check_prerequisites() {
    log_step "Verificando pré-requisitos..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado. Instale o Docker primeiro."
        exit 1
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose não encontrado."
        exit 1
    fi
    
    # Arquivos necessários
    local required_files=("Dockerfile" "Dockerfile.python" "docker-compose.yml" ".env.production")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Arquivo necessário não encontrado: $file"
            exit 1
        fi
    done
    
    log_info "✅ Pré-requisitos verificados"
}

# Verificar e criar arquivo .env
setup_environment() {
    log_step "Configurando ambiente..."
    
    if [ ! -f ".env" ]; then
        log_warn "Arquivo .env não encontrado. Copiando template..."
        cp .env.production .env
        log_warn "⚠️  Configure as chaves de API no arquivo .env!"
        log_warn "⚠️  Especialmente: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY"
        
        # Verificar se chaves estão configuradas
        if grep -q "your_.*_api_key_here" .env; then
            log_error "Configure as chaves de API no arquivo .env antes de continuar!"
            exit 1
        fi
    fi
    
    log_info "✅ Ambiente configurado"
}

# Parar e remover containers existentes
cleanup_existing() {
    log_step "Limpando containers existentes..."
    
    # Parar todos os serviços
    docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    
    # Remover volumes órfãos (cuidado em produção!)
    if [ "$1" == "--clean-volumes" ]; then
        log_warn "Removendo volumes de dados..."
        docker volume prune -f
    fi
    
    log_info "✅ Cleanup concluído"
}

# Build de todas as imagens
build_images() {
    log_step "Building imagens Docker..."
    
    # Build das imagens custom
    log_info "📦 Building Frontend (Next.js)..."
    docker build -t vcm-dashboard:latest -f Dockerfile .
    
    log_info "📦 Building Backend (Python)..."
    docker build -t vcm-backend:latest -f Dockerfile.python .
    
    log_info "✅ Imagens buildadas com sucesso"
}

# Inicializar stack completo
start_stack() {
    log_step "Iniciando stack completo..."
    
    # Iniciar serviços em ordem
    log_info "🗄️  Iniciando PostgreSQL e Redis..."
    docker-compose -f $COMPOSE_FILE up -d postgres redis
    
    # Aguardar database ficar pronto
    log_info "⏳ Aguardando database ficar pronto..."
    sleep 15
    
    # Verificar se database está saudável
    for i in {1..30}; do
        if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U vcm -d vcm_db >/dev/null 2>&1; then
            log_info "✅ Database pronto"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    log_info "🐍 Iniciando Backend Python..."
    docker-compose -f $COMPOSE_FILE up -d vcm-backend
    
    # Aguardar backend ficar pronto
    log_info "⏳ Aguardando backend ficar pronto..."
    sleep 20
    
    log_info "🌐 Iniciando Frontend Next.js..."
    docker-compose -f $COMPOSE_FILE up -d vcm-dashboard
    
    log_info "✅ Stack iniciado com sucesso"
}

# Verificar saúde de todos os serviços
health_check() {
    log_step "Verificando saúde dos serviços..."
    
    local services=("postgres" "redis" "vcm-backend" "vcm-dashboard")
    
    for service in "${services[@]}"; do
        log_info "🔍 Verificando $service..."
        
        # Verificar se container está rodando
        if ! docker-compose -f $COMPOSE_FILE ps $service | grep "Up" >/dev/null; then
            log_error "Serviço $service não está rodando!"
            docker-compose -f $COMPOSE_FILE logs $service
            return 1
        fi
    done
    
    # Verificar endpoints específicos
    log_info "🔍 Testando endpoints..."
    
    # Backend health check
    for i in {1..30}; do
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            log_info "✅ Backend respondendo"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Frontend health check
    for i in {1..30}; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            log_info "✅ Frontend respondendo"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    log_info "✅ Todos os serviços estão saudáveis"
}

# Mostrar informações do sistema
show_system_info() {
    log_step "Informações do sistema..."
    
    echo ""
    echo "🎉 VCM Dashboard Stack deployado com sucesso!"
    echo ""
    echo "📊 Serviços disponíveis:"
    echo "   🌐 Frontend:  http://localhost:3000"
    echo "   🐍 Backend:   http://localhost:8000"
    echo "   📊 API Docs:  http://localhost:8000/docs"
    echo "   🗄️  Database:  localhost:5432 (vcm_db)"
    echo "   🔴 Redis:     localhost:6379"
    echo ""
    echo "📋 Comandos úteis:"
    echo "   Logs:         docker-compose -f $COMPOSE_FILE logs -f"
    echo "   Status:       docker-compose -f $COMPOSE_FILE ps"
    echo "   Parar:        docker-compose -f $COMPOSE_FILE down"
    echo "   Restart:      docker-compose -f $COMPOSE_FILE restart"
    echo ""
    echo "🔧 Arquivos importantes:"
    echo "   Config:       .env"
    echo "   Logs:         docker-compose -f $COMPOSE_FILE logs <service>"
    echo "   Volumes:      docker volume ls | grep vcm"
    echo ""
}

# Cleanup em caso de erro
cleanup_on_error() {
    log_error "Deploy falhou. Executando cleanup..."
    docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
}

# Trap para cleanup
trap cleanup_on_error ERR

# Menu de opções
show_help() {
    echo "VCM Full Stack Deploy Script"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help, -h           Mostra esta ajuda"
    echo "  --clean-volumes      Remove volumes de dados (CUIDADO!)"
    echo "  --logs, -l [service] Mostra logs do serviço"
    echo "  --status, -s         Mostra status dos containers"
    echo "  --stop               Para todos os serviços"
    echo "  --restart [service]  Reinicia serviço específico"
    echo ""
    echo "Serviços disponíveis:"
    echo "  vcm-dashboard, vcm-backend, postgres, redis"
    echo ""
}

# Processar argumentos
case "${1:-}" in
    "--help"|"-h")
        show_help
        exit 0
        ;;
    "--logs"|"-l")
        service="${2:-}"
        if [ -n "$service" ]; then
            docker-compose -f $COMPOSE_FILE logs -f "$service"
        else
            docker-compose -f $COMPOSE_FILE logs -f
        fi
        exit 0
        ;;
    "--status"|"-s")
        docker-compose -f $COMPOSE_FILE ps
        exit 0
        ;;
    "--stop")
        log_info "Parando todos os serviços..."
        docker-compose -f $COMPOSE_FILE down
        exit 0
        ;;
    "--restart")
        service="${2:-}"
        if [ -n "$service" ]; then
            log_info "Reiniciando $service..."
            docker-compose -f $COMPOSE_FILE restart "$service"
        else
            log_info "Reiniciando todos os serviços..."
            docker-compose -f $COMPOSE_FILE restart
        fi
        exit 0
        ;;
    "--clean-volumes")
        CLEAN_VOLUMES="--clean-volumes"
        ;;
esac

# Execução principal
main() {
    echo "=========================================="
    echo "     VCM Full Stack Deploy Script"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    setup_environment
    cleanup_existing $CLEAN_VOLUMES
    build_images
    start_stack
    health_check
    show_system_info
}

# Executar deploy
main