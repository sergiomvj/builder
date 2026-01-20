#!/bin/bash

# =====================================================
# 🚀 VCM - VIRTUAL COMPANY MANAGER - INICIALIZADOR
# =====================================================
# Script bash para sistemas Unix/Linux/macOS
# Versão: 1.0.0
# Data: November 2025
# =====================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================"
echo -e "🚀 VCM - VIRTUAL COMPANY MANAGER"
echo -e "========================================${NC}"
echo ""
echo -e "${WHITE}Inicializando todos os serviços...${NC}"
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "vcm-dashboard-real" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta raiz do projeto!${NC}"
    echo -e "${YELLOW}📁 Esperado: vcm-dashboard-real deve existir aqui${NC}"
    exit 1
fi

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}💡 Copie o .env.example para .env e configure suas chaves${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Verificações iniciais OK${NC}"
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo -e "${RED}❌ Python não encontrado!${NC}"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    exit 1
fi

# 1. Instalar dependências Python
echo -e "${CYAN}📦 Verificando dependências Python...${NC}"
$PYTHON_CMD -m pip install fastapi uvicorn python-multipart supabase python-dotenv requests --quiet
echo -e "${GREEN}✅ Dependências Python OK${NC}"
echo ""

# 2. Instalar dependências Node.js
echo -e "${CYAN}📦 Verificando dependências Node.js...${NC}"
cd vcm-dashboard-real
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependências do frontend...${NC}"
    npm install
fi
cd ..
echo -e "${GREEN}✅ Dependências Node.js OK${NC}"
echo ""

# 3. Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 4. Verificar portas
if check_port 8000; then
    echo -e "${YELLOW}⚠️ Porta 8000 já está em uso!${NC}"
else
    echo -e "${GREEN}✅ Porta 8000 disponível${NC}"
fi

if check_port 3001; then
    echo -e "${YELLOW}⚠️ Porta 3001 já está em uso!${NC}"
else
    echo -e "${GREEN}✅ Porta 3001 disponível${NC}"
fi
echo ""

# 5. Criar script temporário para API
cat > /tmp/start_api.sh << EOF
#!/bin/bash
cd "$(pwd)"
echo "🚀 Iniciando API Backend..."
$PYTHON_CMD api_bridge_real.py
EOF
chmod +x /tmp/start_api.sh

# 6. Criar script temporário para Frontend
cat > /tmp/start_frontend.sh << EOF
#!/bin/bash
cd "$(pwd)/vcm-dashboard-real"
echo "🌐 Iniciando Dashboard Frontend..."
npm run dev
EOF
chmod +x /tmp/start_frontend.sh

# 7. Iniciar serviços
echo -e "${CYAN}🚀 Iniciando API Backend (porta 8000)...${NC}"
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "/tmp/start_api.sh; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "bash /tmp/start_api.sh; exec bash" &
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"/tmp/start_api.sh\""
else
    echo -e "${YELLOW}⚠️ Terminal não detectado, iniciando em background...${NC}"
    nohup /tmp/start_api.sh > api.log 2>&1 &
    API_PID=$!
    echo -e "${GREEN}✅ API iniciada (PID: $API_PID)${NC}"
fi

sleep 3

echo -e "${CYAN}🌐 Iniciando Dashboard Frontend (porta 3001)...${NC}"
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "/tmp/start_frontend.sh; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "bash /tmp/start_frontend.sh; exec bash" &
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"/tmp/start_frontend.sh\""
else
    echo -e "${YELLOW}⚠️ Terminal não detectado, iniciando em background...${NC}"
    nohup /tmp/start_frontend.sh > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
fi

echo ""
echo -e "${CYAN}========================================"
echo -e "${GREEN}🎉 VCM INICIADO COM SUCESSO!"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${WHITE}🌐 Dashboard: http://localhost:3001${NC}"
echo -e "${WHITE}🚀 API Docs:  http://localhost:8000/docs${NC}"
echo -e "${WHITE}🏥 Health:    http://localhost:8000/health${NC}"
echo ""
echo -e "${YELLOW}💡 Aguarde alguns segundos para os serviços${NC}"
echo -e "${YELLOW}   carregarem completamente...${NC}"
echo ""

# 8. Aguardar e verificar serviços
echo -e "${CYAN}🕐 Verificando serviços...${NC}"
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""

# Verificar se os serviços estão respondendo
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API respondendo${NC}"
else
    echo -e "${YELLOW}⚠️ API ainda carregando...${NC}"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dashboard respondendo${NC}"
else
    echo -e "${YELLOW}⚠️ Dashboard ainda carregando...${NC}"
fi

echo ""
echo -e "${CYAN}🌐 Abrindo dashboard no navegador...${NC}"
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3001
elif command -v open &> /dev/null; then
    open http://localhost:3001
else
    echo -e "${YELLOW}⚠️ Abra manualmente: http://localhost:3001${NC}"
fi

echo ""
echo -e "${GREEN}✅ Sistema completamente inicializado!${NC}"
echo ""
echo -e "${CYAN}📝 COMANDOS ÚTEIS:${NC}"
echo -e "${WHITE}   - Para parar: Feche os terminais ou use Ctrl+C${NC}"
echo -e "${WHITE}   - Para reiniciar: Execute este script novamente${NC}"
if [ ! -z "$API_PID" ]; then
    echo -e "${WHITE}   - Para parar API: kill $API_PID${NC}"
fi
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${WHITE}   - Para parar Frontend: kill $FRONTEND_PID${NC}"
fi
echo ""