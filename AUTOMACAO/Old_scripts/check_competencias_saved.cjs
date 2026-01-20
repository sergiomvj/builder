// Verificar competências salvas no banco
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCompetencias() {
  console.log('🔍 Verificando competências salvas...\n');
  
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, ia_config')
    .eq('empresa_id', '58234085-d661-4171-8664-4149b5559a3c')
    .order('full_name');
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  let comCompetencias = 0;
  let semCompetencias = 0;
  
  console.log('📊 Status das competências:\n');
  personas.forEach(p => {
    const temCompetencias = p.ia_config?.tarefas_metas;
    if (temCompetencias) {
      comCompetencias++;
      const comp = p.ia_config.tarefas_metas;
      console.log(`✅ ${p.full_name}`);
      console.log(`   Técnicas: ${comp.competencias_tecnicas?.length || 0}`);
      console.log(`   Comportamentais: ${comp.competencias_comportamentais?.length || 0}`);
      console.log(`   KPIs: ${comp.kpis?.length || 0}`);
      console.log(`   Atualizado: ${p.ia_config.competencias_updated_at || 'N/A'}\n`);
    } else {
      semCompetencias++;
      console.log(`❌ ${p.full_name} - SEM COMPETÊNCIAS\n`);
    }
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${personas.length} personas`);
  console.log(`Com competências: ${comCompetencias} (${Math.round(comCompetencias/personas.length*100)}%)`);
  console.log(`Sem competências: ${semCompetencias}`);
}

checkCompetencias().then(() => process.exit(0));
