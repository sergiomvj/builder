#!/bin/bash

# Script para executar o pipeline completo do sistema VCM
# Executa todos os scripts em sequência para uma empresa específica

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se empresa ID foi fornecido
if [ $# -eq 0 ]; then
    error "Erro: ID da empresa é obrigatório"
    echo "Uso: $0 EMPRESA_ID"
    echo "Exemplo: $0 0e1b6a82-ac72-43f2-974a-f3806e1ec4ce"
    exit 1
fi

EMPRESA_ID="$1"

log "🚀 Iniciando Pipeline Completo VCM para empresa: ${EMPRESA_ID}"

# Diretório dos scripts
SCRIPT_DIR="./AUTOMACAO/02_PROCESSAMENTO_PERSONAS"

if [ ! -d "$SCRIPT_DIR" ]; then
    error "Diretório de scripts não encontrado: $SCRIPT_DIR"
    exit 1
fi

cd "$SCRIPT_DIR" || exit 1

# Lista de scripts na ordem correta de execução
SCRIPTS=(
    "generate_rag_database.js"
    "generate_workflows_database.js"
    "generate_objectives_database.js"
    "generate_auditing_system_database.js"
)

# Contador de sucessos e falhas
SUCCESS_COUNT=0
TOTAL_SCRIPTS=${#SCRIPTS[@]}

echo -e "\n${PURPLE}=== PIPELINE VCM COMPLETO ===${NC}"
echo -e "📋 Empresa ID: ${EMPRESA_ID}"
echo -e "📊 Total de scripts: ${TOTAL_SCRIPTS}"
echo -e "📁 Diretório: $(pwd)"
echo -e "\n${CYAN}Iniciando execução sequencial...${NC}\n"

# Executar cada script
for i in "${!SCRIPTS[@]}"; do
    script="${SCRIPTS[$i]}"
    step=$((i + 1))
    
    echo -e "\n${PURPLE}=== PASSO ${step}/${TOTAL_SCRIPTS}: ${script} ===${NC}"
    log "Executando: node ${script} --empresaId ${EMPRESA_ID}"
    
    # Executar o script
    if node "$script" --empresaId "$EMPRESA_ID"; then
        success "✅ ${script} concluído com sucesso!"
        ((SUCCESS_COUNT++))
    else
        error "❌ Falha na execução de ${script}"
        warning "Pipeline interrompido no passo ${step}/${TOTAL_SCRIPTS}"
        break
    fi
    
    # Pequena pausa entre scripts
    sleep 2
done

echo -e "\n${PURPLE}=== RESULTADO FINAL ===${NC}"

if [ $SUCCESS_COUNT -eq $TOTAL_SCRIPTS ]; then
    success "🎉 PIPELINE COMPLETO EXECUTADO COM SUCESSO!"
    echo -e "✅ Todos os ${TOTAL_SCRIPTS} scripts foram executados"
    echo -e "📋 RAG Knowledge Base: ✅ Criado"
    echo -e "⚙️ N8N Workflows: ✅ Criados"
    echo -e "🎯 Objectives: ✅ Criados"
    echo -e "🔍 Auditing System: ✅ Criado"
    
    echo -e "\n${GREEN}Sistema VCM completamente configurado para empresa ${EMPRESA_ID}${NC}"
    exit 0
else
    error "❌ PIPELINE INCOMPLETO"
    echo -e "⚠️ ${SUCCESS_COUNT}/${TOTAL_SCRIPTS} scripts executados com sucesso"
    echo -e "💡 Execute os scripts restantes manualmente ou corrija os erros"
    exit 1
fi