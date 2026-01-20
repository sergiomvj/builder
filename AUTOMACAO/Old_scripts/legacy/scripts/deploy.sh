#!/bin/bash
# Script de Deploy Automático para VPS - VCM Dashboard
# Execute: ./scripts/deploy.sh

set -e  # Exit on any error

echo "🚀 Iniciando deploy do VCM Dashboard..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script do diretório raiz do projeto!"
    exit 1
fi

# 1. Verificar dependências
log "Verificando dependências..."
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado!"
    exit 1
fi

# 2. Verificar arquivo de ambiente
log "Verificando configuração de ambiente..."
if [ ! -f ".env.production" ]; then
    if [ -f ".env.vps" ]; then
        log "Copiando .env.vps para .env.production..."
        cp .env.vps .env.production
    else
        error "Arquivo .env.production não encontrado!"
        error "Crie o arquivo baseado em .env.vps"
        exit 1
    fi
fi

# 3. Backup da versão atual (se existir)
log "Criando backup da versão atual..."
mkdir -p backups
if docker ps -q -f name=vcm-dashboard > /dev/null; then
    docker export vcm-dashboard > backups/vcm-backup-$(date +%Y%m%d-%H%M%S).tar
    log "Backup criado em backups/"
fi

# 4. Parar containers existentes
log "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || warn "Nenhum container para parar"

# 5. Limpar imagens antigas
log "Limpando imagens antigas..."
docker image prune -f || warn "Nenhuma imagem para limpar"

# 6. Build da nova versão
log "Construindo nova imagem..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 7. Iniciar serviços
log "Iniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# 8. Aguardar inicialização
log "Aguardando inicialização dos serviços..."
sleep 30

# 9. Verificar saúde dos containers
log "Verificando status dos containers..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log "✅ Containers iniciados com sucesso!"
else
    error "❌ Falha na inicialização dos containers"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# 10. Health check da aplicação
log "Verificando saúde da aplicação..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Aplicação respondendo corretamente!"
        break
    else
        warn "Tentativa $attempt/$max_attempts - Aguardando aplicação..."
        sleep 10
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    error "❌ Aplicação não respondeu após $max_attempts tentativas"
    docker-compose -f docker-compose.prod.yml logs vcm-dashboard --tail=50
    exit 1
fi

# 11. Mostrar informações finais
log "🎉 Deploy concluído com sucesso!"
echo ""
echo -e "${BLUE}=== INFORMAÇÕES DE ACESSO ===${NC}"
echo "🌐 URL Local: http://localhost"
echo "📊 Health Check: http://localhost/api/health"
echo "📖 Manual: http://localhost/manual-instrucoes.html"
echo ""
echo -e "${BLUE}=== COMANDOS ÚTEIS ===${NC}"
echo "📋 Status: docker-compose -f docker-compose.prod.yml ps"
echo "📜 Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🔄 Restart: docker-compose -f docker-compose.prod.yml restart"
echo "🛑 Stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo -e "${GREEN}Deploy finalizado! 🚀${NC}"