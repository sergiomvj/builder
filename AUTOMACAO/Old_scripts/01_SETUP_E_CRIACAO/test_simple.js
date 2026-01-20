#!/usr/bin/env node
/**
 * 🧪 TESTE SIMPLES DO SCRIPT 0 - ESTRUTURA DE PASTAS
 * ==================================================
 * 
 * Script para testar apenas a criação da estrutura de pastas
 */

const path = require('path');
const fs = require('fs').promises;

async function testarEstruturaPastas() {
    console.log('🧪 TESTE SIMPLES - ESTRUTURA DE PASTAS');
    console.log('=====================================\n');
    
    try {
        // Definir caminhos
        const baseDir = path.join(__dirname, '..', '..');
        const outputDir = path.join(baseDir, '04_BIOS_PERSONAS');
        
        console.log('📁 Diretório base:', baseDir);
        console.log('📁 Diretório de saída:', outputDir);
        
        // Criar estrutura de teste
        await fs.mkdir(outputDir, { recursive: true });
        
        const categorias = ['executivos', 'especialistas', 'assistentes'];
        
        for (const categoria of categorias) {
            const categoriaDir = path.join(outputDir, categoria);
            await fs.mkdir(categoriaDir, { recursive: true });
            console.log(`✅ Criada pasta: ${categoria}`);
            
            // Criar um arquivo de teste
            const testFile = path.join(categoriaDir, 'test_persona.md');
            await fs.writeFile(testFile, `# Teste ${categoria}\n\nArquivo de teste criado em ${new Date().toISOString()}`, 'utf8');
            console.log(`   📄 Arquivo teste: test_persona.md`);
        }
        
        // Criar personas_config.json de teste
        const configTest = {
            empresa: "ArvaTest",
            created: new Date().toISOString(),
            categorias: categorias
        };
        
        const configPath = path.join(baseDir, 'personas_config.json');
        await fs.writeFile(configPath, JSON.stringify(configTest, null, 2), 'utf8');
        
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log(`✅ Estrutura criada em: ${outputDir}`);
        console.log(`✅ Config JSON: ${configPath}`);
        
        // Verificar se existe
        const stats = await fs.stat(outputDir);
        console.log(`📊 Pasta criada: ${stats.isDirectory() ? 'SIM' : 'NÃO'}`);
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        process.exit(1);
    }
}

// Executar teste
testarEstruturaPastas();