#!/usr/bin/env node
/**
 * 🧪 TESTE DO SCRIPT 0 - GERAÇÃO DE BIOGRAFIAS
 * ===========================================
 * 
 * Script para testar a geração de biografias em 04_BIOS_PERSONAS
 * 
 * @author Sergio Castro
 * @version 1.0.0
 * @date 2024-11-12
 */

const path = require('path');
const { AutoBiografiaGenerator } = require('./05_auto_biografia_generator.js');

async function testarScript0() {
    console.log('🧪 INICIANDO TESTE DO SCRIPT 0');
    console.log('================================\n');
    
    try {
        const generator = new AutoBiografiaGenerator();
        
        // Configuração de teste para uma empresa pequena
        const testConfig = {
            name: "Arva Solutions Test",
            empresaCodigo: "ARVATEST",
            industry: "tecnologia",
            nacionalidade: "latinos", // Usar chave de nacionalidade, não país
            totalPersonas: 8, // Empresa pequena para teste
            ceo_genero: "feminino",
            executivos_homens: 1,
            executivos_mulheres: 1,
            assistentes_homens: 1,
            assistentes_mulheres: 1,
            especialistas_homens: 2,
            especialistas_mulheres: 2
        };
        
        console.log('📊 Configuração do teste:');
        console.log(JSON.stringify(testConfig, null, 2));
        console.log('\n🚀 Gerando personas...\n');
        
        // Gerar personas usando o método correto
        const personas = generator.generatePersonasConfig(testConfig);
        
        console.log('✅ Personas geradas com sucesso!');
        console.log(`📊 Total de personas: ${Object.keys(personas).length}`);
        
        // Listar personas geradas
        if (personas.ceo) {
            console.log(`👑 CEO: ${personas.ceo.nome} ${personas.ceo.sobrenome}`);
        }
        
        for (const [categoria, personasLista] of Object.entries(personas)) {
            if (categoria === 'ceo') continue;
            console.log(`📋 ${categoria}: ${Object.keys(personasLista).length} personas`);
            for (const [id, persona] of Object.entries(personasLista)) {
                console.log(`   - ${persona.nome} ${persona.sobrenome}`);
            }
        }
        
        // Definir caminho de saída (agora é automático para AUTOMACAO/)
        console.log(`\n💾 Salvando biografias em: AUTOMACAO/04_BIOS_PERSONAS`);
        
        // Salvar biografias (sem outputPath, usa padrão AUTOMACAO/)
        const resultado = await generator.savePersonasBiografias(personas);
        
        if (resultado.success) {
            console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
            console.log(`✅ ${resultado.totalArquivos} biografias criadas`);
            console.log(`📁 Localização: ${resultado.diretorio}`);
            console.log(`⚙️ Config JSON: ${resultado.configPath}`);
            
            console.log('\n📝 Próximo passo:');
            console.log('Execute o Script 1 para gerar competências a partir dessas biografias');
        }
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testarScript0();
}

module.exports = { testarScript0 };