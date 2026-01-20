#!/bin/bash
# Script de Backup Automático - VCM Dashboard
# Executado automaticamente via cron no container de backup

set -e

# Configurações
BACKUP_DIR="/backup/output"
LOG_DIR="/backup/logs"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Cores para logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Criar diretórios se não existirem
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

log "🔄 Iniciando backup automático - VCM Dashboard"

# 1. Backup dos logs da aplicação
log "📝 Fazendo backup dos logs..."
if [ -d "$LOG_DIR" ]; then
    tar -czf "$BACKUP_DIR/logs-$DATE.tar.gz" -C "$LOG_DIR" . || warn "Falha no backup dos logs"
    log "✅ Logs salvos em logs-$DATE.tar.gz"
else
    warn "Diretório de logs não encontrado"
fi

# 2. Backup da configuração Docker
log "🐳 Fazendo backup das configurações Docker..."
if docker ps -q -f name=vcm-dashboard > /dev/null; then
    # Backup do container
    docker export vcm-dashboard | gzip > "$BACKUP_DIR/container-$DATE.tar.gz" || error "Falha no backup do container"
    log "✅ Container salvo em container-$DATE.tar.gz"
    
    # Backup dos volumes
    docker run --rm -v vcm-vite-react_app-logs:/data -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/volumes-$DATE.tar.gz" -C /data . || warn "Falha no backup dos volumes"
    log "✅ Volumes salvos em volumes-$DATE.tar.gz"
else
    warn "Container vcm-dashboard não está rodando"
fi

# 3. Backup das variáveis de ambiente (sem valores sensíveis)
log "⚙️ Fazendo backup das configurações..."
if [ -f "/app/.env.production" ]; then
    # Remove valores sensíveis e salva estrutura
    grep -E "^[A-Z_]+=.*$" /app/.env.production | sed 's/=.*$/=***HIDDEN***/' > "$BACKUP_DIR/env-structure-$DATE.txt" || warn "Falha no backup do .env"
    log "✅ Estrutura do .env salva (valores ocultos por segurança)"
fi

# 4. Verificação dos bancos de dados (health check)
log "🗄️ Verificando conectividade dos bancos..."
HEALTH_STATUS="unknown"
if curl -f http://vcm-dashboard:3000/api/health > /dev/null 2>&1; then
    HEALTH_STATUS="healthy"
    log "✅ Bancos de dados acessíveis"
else
    HEALTH_STATUS="unhealthy"
    warn "⚠️ Problemas de conectividade detectados"
fi

# 5. Criar relatório do backup
log "📊 Gerando relatório do backup..."
cat > "$BACKUP_DIR/backup-report-$DATE.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "backup_id": "$DATE",
  "files": {
    "logs": "logs-$DATE.tar.gz",
    "container": "container-$DATE.tar.gz",
    "volumes": "volumes-$DATE.tar.gz",
    "env_structure": "env-structure-$DATE.txt"
  },
  "health_status": "$HEALTH_STATUS",
  "retention_days": $RETENTION_DAYS,
  "backup_size_mb": $(du -sm "$BACKUP_DIR" | cut -f1)
}
EOF

log "✅ Relatório salvo em backup-report-$DATE.json"

# 6. Limpeza de backups antigos
log "🧹 Limpando backups antigos (mais de $RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || warn "Falha na limpeza de arquivos antigos"
find "$BACKUP_DIR" -name "*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null || warn "Falha na limpeza de arquivos antigos"
find "$BACKUP_DIR" -name "*.json" -mtime +$RETENTION_DAYS -delete 2>/dev/null || warn "Falha na limpeza de arquivos antigos"

# 7. Relatório final
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*-$DATE.* 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "🎉 Backup concluído!"
log "📁 Arquivos criados: $BACKUP_COUNT"
log "💾 Tamanho total dos backups: $TOTAL_SIZE"
log "🗑️ Retenção: $RETENTION_DAYS dias"

# 8. Notificação por webhook (se configurado)
if [ ! -z "$BACKUP_WEBHOOK_URL" ]; then
    curl -X POST "$BACKUP_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"message\":\"Backup VCM concluído\",\"backup_id\":\"$DATE\",\"status\":\"success\",\"size\":\"$TOTAL_SIZE\"}" \
         > /dev/null 2>&1 || warn "Falha ao enviar notificação webhook"
    log "📡 Notificação enviada"
fi

log "✨ Backup automático finalizado com sucesso!"