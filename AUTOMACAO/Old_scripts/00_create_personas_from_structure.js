// SCRIPT 00 - CRIAÇÃO DE PLACEHOLDERS DE PERSONAS (APENAS CARGOS)
// Cria estrutura básica de personas SEM nomes, biografias ou dados pessoais
// Os dados completos serão gerados DEPOIS pelos scripts 01.5, 02 e 00_generate_avatares.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { distribuirNacionalidades } from './lib/nomes_nacionalidades.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter diretório atual para resolver paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração - carregar .env do diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validar variáveis de ambiente
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Encontrada' : '❌ Não encontrada');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Encontrada' : '❌ Não encontrada');
  console.error('');
  console.error('💡 Certifique-se de que o arquivo .env.local existe no diretório raiz do projeto');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎭 SCRIPT 00 - CRIAÇÃO DE PLACEHOLDERS DE PERSONAS');
console.log('==================================================');
console.log('⚠️  IMPORTANTE: Este script cria apenas a ESTRUTURA básica');
console.log('   - Cargos necessários');
console.log('   - Nacionalidades distribuídas');
console.log('   - SEM nomes, SEM biografias, SEM dados pessoais');
console.log('');
console.log('📋 Fluxo correto:');
console.log('   1. Este script → cria placeholders');
console.log('   2. Script 01.5 → atribuições contextualizadas');
console.log('   3. Script 02 → competências técnicas/comportamentais');
console.log('   4. Script 00_generate_avatares.js → gera perfis COMPLETOS via LLM');
console.log('==================================================\n');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (!targetEmpresaId) {
  console.error('❌ Erro: empresaId é obrigatório!');
  console.log('📝 Uso: node 00_create_personas_from_structure.js --empresaId=UUID');
  process.exit(1);
}

console.log(`🎯 Empresa alvo: ${targetEmpresaId}\n`);

// Mapear cargos genéricos para roles específicos (será refinado pelo script de avatares)
const CARGO_MAPPING = {
  'CEO': { role: 'CEO', department: 'Executive', specialty: 'Leadership' },
  'Executive': { role: 'VP', department: 'Management', specialty: 'Strategy' },
  'Assistant': { role: 'Assistant', department: 'Operations', specialty: 'Support' },
  'Specialist': { role: 'Specialist', department: 'Operations', specialty: 'Technical' },
  'SDR Manager': { role: 'SDR Manager', department: 'Sales', specialty: 'Team Leadership' },
  'SDR Junior': { role: 'SDR Junior', department: 'Sales', specialty: 'Prospecting' }
};

async function createPersonasFromStructure() {
  try {
    // 1. Buscar empresa
    console.log('📂 Buscando dados da empresa...');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada: ${empresaError.message}`);
    
    console.log(`✅ Empresa encontrada: ${empresa.nome}`);
    
    // 2. Verificar se empresa já tem equipe gerada
    if (empresa.equipe_gerada) {
      console.log('\n⚠️  Esta empresa já possui equipe gerada!');
      console.log('   Para regenerar, primeiro delete as personas existentes no banco.');
      return;
    }

    // 3. Validar dados necessários
    if (!empresa.cargos_necessarios || empresa.cargos_necessarios.length === 0) {
      throw new Error('Empresa não possui cargos_necessarios definidos');
    }

    if (!empresa.nationalities || empresa.nationalities.length === 0) {
      throw new Error('Empresa não possui nacionalidades definidas');
    }

    const cargos = empresa.cargos_necessarios;
    const nacionalidades = empresa.nationalities;

    console.log(`\n📋 Estrutura definida:`);
    console.log(`   Cargos: ${cargos.length} posições`);
    console.log(`   Nacionalidades:`);
    nacionalidades.forEach(n => {
      console.log(`     - ${n.tipo}: ${n.percentual}%`);
    });

    // 4. Distribuir nacionalidades pelos cargos
    console.log('\n🌍 Distribuindo nacionalidades...');
    const distribuicao = distribuirNacionalidades(cargos, nacionalidades);
    
    console.log(`✅ Distribuição criada:`);
    const contagem = {};
    distribuicao.forEach(d => {
      contagem[d.nacionalidade] = (contagem[d.nacionalidade] || 0) + 1;
    });
    Object.entries(contagem).forEach(([nac, count]) => {
      console.log(`   ${nac}: ${count} personas (${Math.round(count/cargos.length*100)}%)`);
    });

    // 5. Criar placeholders de personas (SEM nomes, biografias ou dados pessoais)
    console.log('\n👥 Criando placeholders de personas...');
    console.log('   ⚠️  Apenas estrutura básica (cargo + nacionalidade)');
    console.log('   ⚠️  Nomes e biografias serão gerados DEPOIS pelo script de avatares\n');
    
    const personas = [];

    for (let i = 0; i < distribuicao.length; i++) {
      const { cargo, nacionalidade } = distribuicao[i];
      
      // Mapear cargo para role/department/specialty
      const cargoInfo = CARGO_MAPPING[cargo] || { 
        role: cargo, 
        department: 'Operations', 
        specialty: 'General' 
      };
      
      console.log(`  [${i+1}/${distribuicao.length}] Placeholder: ${cargo} (${nacionalidade})`);
      
      // Criar PLACEHOLDER de persona (apenas estrutura básica)
      const persona = {
        persona_code: `${empresa.codigo}-P${String(i+1).padStart(3, '0')}`,
        empresa_id: empresa.id,
        full_name: `[Placeholder ${i+1}] ${cargo}`,  // Será substituído pelo script de avatares
        email: null,  // Será gerado pelo script de avatares
        role: cargoInfo.role,
        department: cargoInfo.department,
        specialty: cargoInfo.specialty,
        nacionalidade: nacionalidade
      };
      
      personas.push(persona);
    }

    // 6. Inserir personas no banco
    console.log('\n💾 Salvando placeholders no banco de dados...');
    const { data: personasInseridas, error: insertError } = await supabase
      .from('personas')
      .insert(personas)
      .select();

    if (insertError) {
      throw new Error(`Erro ao inserir personas: ${insertError.message}`);
    }

    console.log(`✅ ${personasInseridas.length} placeholders criados com sucesso!`);

    // 7. Atualizar status do script na empresa
    const { error: updateError } = await supabase
      .from('empresas')
      .update({ 
        scripts_status: {
          ...empresa.scripts_status,
          create_personas: true
        }
      })
      .eq('id', empresa.id);

    if (updateError) {
      console.warn(`⚠️  Aviso: não foi possível atualizar scripts_status: ${updateError.message}`);
    }

    // 8. Salvar JSON de backup
    const outputDir = path.join(process.cwd(), '04_BIOS_PERSONAS_REAL');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `placeholders_${empresa.codigo}_${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        codigo: empresa.codigo
      },
      placeholders: personasInseridas,
      distribuicao_nacionalidades: contagem,
      timestamp: new Date().toISOString(),
      nota: 'Estes são apenas PLACEHOLDERS. Nomes, emails e biografias serão gerados pelo script 00_generate_avatares.js'
    }, null, 2));

    console.log(`📁 Backup salvo: ${path.basename(outputFile)}`);

    // 9. Relatório final
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`✅ Placeholders criados: ${personasInseridas.length}`);
    console.log(`✅ Distribuição de nacionalidades:`);
    Object.entries(contagem).forEach(([nac, count]) => {
      console.log(`   ${nac}: ${count} placeholders`);
    });
    console.log('\n🎉 PLACEHOLDERS CRIADOS COM SUCESSO!');
    console.log('\n⚠️  IMPORTANTE: Os placeholders contêm apenas:');
    console.log('   - Cargo (role)');
    console.log('   - Departamento');
    console.log('   - Nacionalidade');
    console.log('   - full_name: NULL');
    console.log('   - email: NULL');
    console.log('   - genero: NULL');
    console.log('   - biografia_completa: NULL');
    console.log('\n📝 PRÓXIMOS PASSOS (NA ORDEM):');
    console.log('   1. node 01.5_atribuicoes.js --empresaId=' + empresa.id);
    console.log('   2. node 02_competencias.js --empresaId=' + empresa.id);
    console.log('   3. node 00_generate_avatares.js --empresaId=' + empresa.id);
    console.log('      ↑ ESTE script gerará nomes, emails, gênero e perfis completos');
    console.log('   4. node 01_generate_biografias_REAL.js --empresaId=' + empresa.id);
    console.log('   5. Continue com scripts 03-06');

  } catch (error) {
    console.error('\n❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

createPersonasFromStructure();
