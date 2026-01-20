const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function examinarEmails() {
  try {
    console.log('📧 ANÁLISE DE EMAILS DAS PERSONAS');
    console.log('=================================');

    // 1. Buscar algumas personas com seus emails
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, email, empresa_id')
      .limit(10);
    
    if (personasError) {
      console.error('❌ Erro ao buscar personas:', personasError);
      return;
    }
    
    console.log('📊 Exemplos de emails encontrados:');
    personas.forEach(persona => {
      console.log(`   ${persona.full_name}: ${persona.email}`);
    });
    
    // 2. Buscar dados da empresa para comparar
    const empresaIds = [...new Set(personas.map(p => p.empresa_id))];
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, codigo')
      .in('id', empresaIds);
    
    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return;
    }
    
    console.log('\n🏢 Dados das empresas:');
    empresas.forEach(empresa => {
      console.log(`   ${empresa.nome} (código: ${empresa.codigo})`);
      const personasEmpresa = personas.filter(p => p.empresa_id === empresa.id);
      personasEmpresa.forEach(persona => {
        const emailDomain = persona.email.split('@')[1];
        const expectedDomain = `${empresa.codigo.toLowerCase()}.com`;
        const matches = emailDomain === expectedDomain;
        console.log(`     📧 ${persona.email} (${matches ? '✅' : '❌'} domínio)`);
        if (!matches) {
          console.log(`       Esperado: ${expectedDomain}, Encontrado: ${emailDomain}`);
        }
      });
    });
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

examinarEmails();