#!/bin/bash

# VCM Dashboard - Script de Deploy Automatizado
# Para uso em VPS com Docker e Easypanel

set -e

echo "🚀 Iniciando deploy do VCM Dashboard..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
CONTAINER_NAME="vcm-dashboard"
IMAGE_NAME="vcm-dashboard"
PORT="3000"

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

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado. Instale o Docker primeiro."
        exit 1
    fi
    log_info "Docker encontrado: $(docker --version)"
}

# Verificar se arquivo .env existe
check_env() {
    if [ ! -f ".env" ]; then
        log_warn "Arquivo .env não encontrado. Criando template..."
        cat > .env << EOF
# VCM Dashboard Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
NEXT_PUBLIC_API_URL=https://seu-dominio.com/api
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
        log_warn "Configure o arquivo .env antes de continuar!"
        exit 1
    fi
    log_info "Arquivo .env encontrado"
}

# Parar container existente
stop_existing() {
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        log_info "Parando container existente..."
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
    fi
}

# Build da imagem
build_image() {
    log_info "Building imagem Docker..."
    docker build -t $IMAGE_NAME .
    log_info "Build concluído com sucesso!"
}

# Executar container
run_container() {
    log_info "Iniciando novo container..."
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:3000 \
        --env-file .env \
        $IMAGE_NAME
    
    log_info "Container iniciado com sucesso!"
}

# Verificar saúde do container
check_health() {
    log_info "Verificando saúde do container..."
    
    # Esperar container inicializar
    sleep 10
    
    # Verificar se container está rodando
    if ! docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        log_error "Container não está rodando!"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    # Verificar se aplicação responde
    for i in {1..30}; do
        if curl -f http://localhost:$PORT >/dev/null 2>&1; then
            log_info "Aplicação está respondendo! ✅"
            log_info "Acesse: http://localhost:$PORT"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "Aplicação não está respondendo após 60 segundos"
    docker logs $CONTAINER_NAME
    exit 1
}

# Cleanup em caso de erro
cleanup() {
    log_error "Deploy falhou. Executando cleanup..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Trap para cleanup
trap cleanup ERR

# Execução principal
main() {
    echo "========================================"
    echo "     VCM Dashboard Deploy Script"
    echo "========================================"
    
    check_docker
    check_env
    stop_existing
    build_image
    run_container
    check_health
    
    echo ""
    log_info "🎉 Deploy concluído com sucesso!"
    log_info "📱 Aplicação disponível em: http://localhost:$PORT"
    log_info "📊 Logs do container: docker logs -f $CONTAINER_NAME"
    log_info "🛑 Para parar: docker stop $CONTAINER_NAME"
}

# Verificar argumentos
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "VCM Dashboard Deploy Script"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help, -h     Mostra esta ajuda"
    echo "  --logs, -l     Mostra logs do container"
    echo "  --stop, -s     Para o container"
    echo "  --restart, -r  Reinicia o container"
    echo ""
    exit 0
fi

if [[ "$1" == "--logs" || "$1" == "-l" ]]; then
    docker logs -f $CONTAINER_NAME
    exit 0
fi

if [[ "$1" == "--stop" || "$1" == "-s" ]]; then
    log_info "Parando container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    log_info "Container parado!"
    exit 0
fi

if [[ "$1" == "--restart" || "$1" == "-r" ]]; then
    log_info "Reiniciando container..."
    docker restart $CONTAINER_NAME
    check_health
    exit 0
fi

# Executar deploy
main