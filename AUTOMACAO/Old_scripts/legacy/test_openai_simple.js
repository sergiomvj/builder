#!/usr/bin/env node

/**
 * TESTE RÁPIDO DA LLM OPENAI
 * Verifica se a integração com OpenAI está funcionando
 */

const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
    console.log('🧠 Testando OpenAI LLM...');
    
    try {
        const openai = new OpenAI({
            apiKey: process.env.VCM_OPENAI_API_KEY || process.env.OPENAI_API_KEY
        });
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente especializado em gestão empresarial. Responda sempre em português brasileiro."
                },
                {
                    role: "user",
                    content: "Analise uma empresa de tecnologia de 50 funcionários no Brasil e sugira 3 prioridades estratégicas para esta semana. Responda apenas com JSON válido com a estrutura: {\"priorities\": [\"p1\", \"p2\", \"p3\"], \"reasoning\": \"explicação\"}"
                }
            ],
            temperature: 0.3
        });
        
        let responseText = completion.choices[0].message.content.trim();
        
        // Limpar resposta se não for JSON puro
        if (!responseText.startsWith('{')) {
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                responseText = responseText.substring(jsonStart, jsonEnd + 1);
            }
        }
        
        const analysis = JSON.parse(responseText);
        
        console.log('✅ OpenAI funcionando perfeitamente!');
        console.log('📊 Resposta da LLM:');
        console.log(JSON.stringify(analysis, null, 2));
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste OpenAI:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('💡 Verifique as variáveis de ambiente:');
            console.log('   VCM_OPENAI_API_KEY ou OPENAI_API_KEY');
        }
        
        return false;
    }
}

// Executar teste
if (require.main === module) {
    testOpenAI().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = testOpenAI;