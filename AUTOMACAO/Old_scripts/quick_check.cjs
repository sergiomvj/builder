// Quick check para verificar dados no Supabase
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('\n🔍 Verificando dados...\n');

  // 1. Contar automation_opportunities
  const { data: opportunities, error: oppError, count: oppCount } = await supabase
    .from('automation_opportunities')
    .select('*', { count: 'exact' })
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17');

  console.log('📊 Automation Opportunities:');
  console.log(`   Total: ${oppCount || 0}`);
  if (opportunities && opportunities.length > 0) {
    const byPersona = opportunities.reduce((acc, opp) => {
      acc[opp.persona_id] = (acc[opp.persona_id] || 0) + 1;
      return acc;
    }, {});
    console.log('   Por persona:', byPersona);
  }

  // 2. Contar personas_workflows
  const { data: workflows, error: wfError, count: wfCount } = await supabase
    .from('personas_workflows')
    .select('*', { count: 'exact' })
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17');

  console.log('\n🔄 Personas Workflows:');
  console.log(`   Total: ${wfCount || 0}`);
  if (workflows && workflows.length > 0) {
    const byPersona = workflows.reduce((acc, wf) => {
      acc[wf.persona_id] = (acc[wf.persona_id] || 0) + 1;
      return acc;
    }, {});
    console.log('   Por persona:', byPersona);
  }

  // 3. Listar personas da ARVA
  const { data: personas, error: persError } = await supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
    .order('full_name');

  console.log('\n👥 Personas ARVA:');
  console.log(`   Total: ${personas?.length || 0}`);
  if (personas) {
    personas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.full_name} (${p.role})`);
    });
  }

  // 4. Detalhes dos workflows
  if (workflows && workflows.length > 0) {
    console.log('\n🔍 Detalhes dos Workflows:');
    for (const wf of workflows.slice(0, 5)) {
      const persona = personas?.find(p => p.id === wf.persona_id);
      console.log(`\n   - ${wf.workflow_name}`);
      console.log(`     Persona: ${persona?.full_name || 'N/A'}`);
      console.log(`     Status: ${wf.status}`);
      console.log(`     Tipo: ${wf.workflow_type}`);
      console.log(`     Criado: ${new Date(wf.created_at).toLocaleString()}`);
    }
  }
}

checkData().catch(console.error);
