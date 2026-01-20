#!/bin/bash

# Script de validação para deployment
# Testa se o build Docker funciona corretamente

echo "🔍 Validando setup de Docker para VCM Dashboard..."

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "========================================"
echo "     Validação do Setup Docker"
echo "========================================"

# 1. Verificar se Dockerfile existe
if [ -f "Dockerfile" ]; then
    test_passed "Dockerfile encontrado"
else
    test_failed "Dockerfile não encontrado"
fi

# 2. Verificar se .dockerignore existe
if [ -f ".dockerignore" ]; then
    test_passed ".dockerignore encontrado"
else
    test_warning ".dockerignore não encontrado (recomendado)"
fi

# 3. Verificar se package.json existe
if [ -f "package.json" ]; then
    test_passed "package.json encontrado"
else
    test_failed "package.json não encontrado"
fi

# 4. Verificar next.config.mjs
if [ -f "next.config.mjs" ]; then
    if grep -q "output.*standalone" next.config.mjs; then
        test_passed "next.config.mjs configurado para standalone"
    else
        test_failed "next.config.mjs não configurado para standalone"
    fi
else
    test_failed "next.config.mjs não encontrado"
fi

# 5. Verificar Docker
if command -v docker &> /dev/null; then
    test_passed "Docker instalado: $(docker --version | cut -d' ' -f3)"
else
    test_failed "Docker não instalado"
fi

# 6. Testar build Docker (se Docker estiver disponível)
if command -v docker &> /dev/null; then
    echo ""
    echo "🔨 Testando build Docker..."
    
    # Build com timeout
    timeout 300 docker build -t vcm-dashboard-test . &> build.log
    BUILD_EXIT_CODE=$?
    
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        test_passed "Build Docker executado com sucesso"
        
        # Verificar tamanho da imagem
        IMAGE_SIZE=$(docker images vcm-dashboard-test --format "table {{.Size}}" | tail -n +2)
        echo "📏 Tamanho da imagem: $IMAGE_SIZE"
        
        # Cleanup
        docker rmi vcm-dashboard-test &> /dev/null
        
    elif [ $BUILD_EXIT_CODE -eq 124 ]; then
        test_failed "Build Docker timeout (>5 minutos)"
    else
        test_failed "Build Docker falhou"
        echo "📋 Últimas linhas do log:"
        tail -10 build.log
    fi
    
    rm -f build.log
else
    test_warning "Não foi possível testar build (Docker não disponível)"
fi

# 7. Verificar scripts de deploy
if [ -f "deploy.sh" ]; then
    test_passed "Script deploy.sh encontrado"
else
    test_warning "Script deploy.sh não encontrado"
fi

# 8. Verificar docker-compose
if [ -f "docker-compose.yml" ]; then
    test_passed "docker-compose.yml encontrado"
else
    test_warning "docker-compose.yml não encontrado"
fi

# 9. Verificar configuração Easypanel
if [ -f "docker-compose.easypanel.yml" ]; then
    test_passed "Configuração Easypanel encontrada"
else
    test_warning "Configuração específica do Easypanel não encontrada"
fi

# 10. Verificar arquivo de ambiente
if [ -f ".env.production" ]; then
    test_passed "Template .env.production encontrado"
else
    test_warning "Template .env.production não encontrado"
fi

echo ""
echo "========================================"
echo "         Resumo da Validação"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram! ($TESTS_PASSED/$(($TESTS_PASSED + $TESTS_FAILED)))${NC}"
    echo -e "${GREEN}✅ Setup pronto para deploy no Easypanel!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure as variáveis de ambiente"
    echo "2. Upload o código para a VPS"
    echo "3. Execute o deploy via Easypanel"
    echo "4. Configure domínio/SSL (opcional)"
else
    echo -e "${RED}❌ $TESTS_FAILED teste(s) falharam de $((TESTS_PASSED + TESTS_FAILED))${NC}"
    echo "Corrija os problemas antes de fazer deploy."
fi

echo ""
echo "📖 Documentação completa: DEPLOY-EASYPANEL.md"

exit $TESTS_FAILED