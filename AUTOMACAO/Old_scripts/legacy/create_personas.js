// SCRIPT PARA CRIAR PERSONAS BÁSICAS PARA UMA EMPRESA
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateEmailFormat } from './email-generator.js';

// Carregar variáveis de ambiente
dotenv.config({ path: '../.env' });

// Credenciais REAIS (mesma aplicação web)
const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 SCRIPT CRIAÇÃO DE PERSONAS BÁSICAS');
console.log('====================================');

// Verificar se empresaId foi passado como argumento
const args = process.argv.slice(2);
let targetEmpresaId = null;

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (!targetEmpresaId) {
  console.error('❌ É necessário fornecer o ID da empresa');
  console.log('Uso: node create_personas.js --empresaId=<ID> ou node create_personas.js <ID>');
  process.exit(1);
}

// Configuração padrão de personas por categoria
const PERSONAS_CONFIG = {
  ceo: { count: 1, is_ceo: true },
  executivos: { count: 4, category: 'executivos' },
  especialistas: { count: 8, category: 'especialistas' },
  assistentes: { count: 7, category: 'assistentes' }
};

async function createBasicPersonas() {
  try {
    console.log(`🎯 Criando personas para empresa: ${targetEmpresaId}`);
    
    // 1. Verificar se a empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();
    
    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada:', empresaError);
      return;
    }
    
    console.log(`📊 Empresa encontrada: ${empresa.nome} (${empresa.total_personas} personas planejadas)`);
    
    // 2. Verificar se já existem personas para esta empresa
    const { data: existingPersonas, error: personasError } = await supabase
      .from('personas')
      .select('id')
      .eq('empresa_id', targetEmpresaId);
    
    if (personasError) {
      console.error('❌ Erro ao verificar personas existentes:', personasError);
      return;
    }
    
    if (existingPersonas && existingPersonas.length > 0) {
      console.log(`⚠️ Já existem ${existingPersonas.length} personas para esta empresa`);
      console.log('🔄 Pulando criação de personas...');
      return;
    }
    
    // 3. Criar personas básicas com estrutura correta
    const usedEmails = new Set();
    const personas = [];
    let personaCounter = 1;
    
    // CEO (sempre 1)
    const ceoName = 'Sarah Johnson';
    const ceoEmail = generateEmailFormat(ceoName, 'arvabot.com', usedEmails);
    
    personas.push({
      empresa_id: targetEmpresaId,
      persona_code: `CEO-${empresa.codigo}`,
      full_name: ceoName,
      role: 'Chief Executive Officer',
      department: 'Executive',
      specialty: 'Strategic Leadership',
      email: ceoEmail,
      whatsapp: `+55119${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      status: 'active'
    });
    
    // Executivos com nomes reais
    const executiveData = [
      { name: 'Michael Rodriguez', role: 'Chief Technology Officer', dept: 'Technology' },
      { name: 'Ashley Garcia', role: 'Chief Financial Officer', dept: 'Finance' },
      { name: 'David Thompson', role: 'Chief Operating Officer', dept: 'Operations' }
    ];
    
    for (let i = 0; i < executiveData.length; i++) {
      const exec = executiveData[i];
      const execEmail = generateEmailFormat(exec.name, 'arvabot.com', usedEmails);
      
      personas.push({
        empresa_id: targetEmpresaId,
        persona_code: `EXEC${i + 1}-${empresa.codigo}`,
        full_name: exec.name,
        role: exec.role,
        department: exec.dept,
        specialty: `${exec.dept} Leadership`,
        email: execEmail,
        whatsapp: `+55119${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        status: 'active'
      });
    }
    
    // Especialistas com nomes reais
    const specialistNames = [
      'Lisa Wilson', 'Robert Davis', 'Jennifer Smith', 'William Miller',
      'Amanda Davis', 'James Wilson', 'Thomas Anderson', 'Maria Silva'
    ];
    
    const especCount = Math.min(8, Math.floor((empresa.total_personas - 4) * 0.5));
    for (let i = 0; i < especCount && i < specialistNames.length; i++) {
      const specName = specialistNames[i];
      const specEmail = generateEmailFormat(specName, 'arvabot.com', usedEmails);
      
      personas.push({
        empresa_id: targetEmpresaId,
        persona_code: `SPEC${i + 1}-${empresa.codigo}`,
        full_name: specName,
        role: `Technical Specialist`,
        department: 'Technical',
        specialty: 'Technical Expertise',
        email: specEmail,
        whatsapp: `+55119${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        status: 'active'
      });
    }
    
    // Assistentes com nomes reais (resto) - Todas femininas conforme business model
    const assistantNames = [
      'Emily Johnson', 'Jessica Brown', 'Rachel Taylor', 'Lauren White',
      'Samantha Green', 'Nicole Martin', 'Stephanie Clark', 'Brittany Lewis'
    ];
    
    const assistCount = empresa.total_personas - personas.length;
    for (let i = 0; i < assistCount && i < assistantNames.length; i++) {
      const assistName = assistantNames[i];
      const assistEmail = generateEmailFormat(assistName, 'arvabot.com', usedEmails);
      
      personas.push({
        empresa_id: targetEmpresaId,
        persona_code: `ASST${i + 1}-${empresa.codigo}`,
        full_name: assistName,
        role: `Executive Assistant`,
        department: 'Administrative',
        specialty: 'Executive Support & SDR',
        email: assistEmail,
        whatsapp: `+55119${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        status: 'active'
      });
    }
    
    console.log(`📝 Criando ${personas.length} personas...`);
    
    // 4. Inserir personas no banco
    const { data: insertedPersonas, error: insertError } = await supabase
      .from('personas')
      .insert(personas)
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir personas:', insertError);
      return;
    }
    
    console.log(`✅ Criadas ${insertedPersonas.length} personas com sucesso!`);
    
    // 5. Relatório final
    const counts = personas.reduce((acc, p) => {
      acc[p.categoria] = (acc[p.categoria] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Resumo das personas criadas:');
    Object.entries(counts).forEach(([categoria, count]) => {
      console.log(`   ${categoria}: ${count}`);
    });
    
    return insertedPersonas;
    
  } catch (error) {
    console.error('❌ Erro na criação de personas:', error);
  }
}

// Executar se chamado diretamente
createBasicPersonas().then(() => {
  console.log('🎉 Processo de criação de personas concluído!');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});