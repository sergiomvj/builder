#!/bin/bash

# Script para implementar os sub-sistemas no Supabase
# Execute este script para criar todas as tabelas dos sub-sistemas

echo "🚀 Implementando Sub-sistemas VCM no Supabase..."

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erro: Configure as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Executar o SQL dos sub-sistemas
echo "📊 Executando schema dos sub-sistemas..."
psql "$SUPABASE_URL" -f database-schema-subsistemas.sql

if [ $? -eq 0 ]; then
    echo "✅ Sub-sistemas implementados com sucesso!"
    echo ""
    echo "📋 Sub-sistemas disponíveis:"
    echo "  1. 📧 Email Management"
    echo "  2. 🎯 CRM & Sales"
    echo "  3. 📱 Social Media"
    echo "  4. 🚀 Marketing & Traffic"
    echo "  5. 💰 Financial Management"
    echo "  6. 🎬 Content Creation"
    echo "  7. 📞 Customer Support"
    echo "  8. 📊 Analytics & Reporting"
    echo "  9. 👥 HR Management"
    echo " 10. 🛒 E-commerce"
    echo " 11. 🤖 AI Assistant"
    echo " 12. 📈 Business Intelligence"
    echo ""
    echo "🌐 Acesse o dashboard: http://localhost:3000/subsystems"
else
    echo "❌ Erro ao implementar sub-sistemas"
    exit 1
fi