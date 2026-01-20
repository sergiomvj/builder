import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

console.log('🔍 TESTANDO DOWNLOAD DE AVATAR DICEBEAR');
console.log('=======================================');

async function testDownloadAvatar() {
  try {
    // URL atualizada com versão que funciona
    const url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=TestUser&backgroundColor=e3f2fd';
    console.log(`📥 Fazendo download de: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const svgContent = await response.text();
    console.log(`✅ Download realizado - Tamanho: ${svgContent.length} bytes`);
    
    // Criar diretório de teste
    const testDir = path.join(process.cwd(), 'output', 'test_avatars');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Salvar arquivo
    const filename = 'test_avatar.svg';
    const filepath = path.join(testDir, filename);
    fs.writeFileSync(filepath, svgContent, 'utf8');
    
    console.log(`💾 Arquivo salvo em: ${filepath}`);
    console.log(`📄 Primeiros 100 caracteres: ${svgContent.substring(0, 100)}...`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro no download:`, error.message);
    return false;
  }
}

testDownloadAvatar();