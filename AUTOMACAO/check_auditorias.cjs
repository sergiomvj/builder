const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAuditorias() {
  console.log('📊 Verificando auditorias salvas\n');
  
  const { data, error, count } = await supabase
    .from('personas_auditorias')
    .select('*', { count: 'exact' })
    .order('audit_date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`✅ Total de auditorias: ${count}\n`);
  
  if (data && data.length > 0) {
    console.log('📋 Últimas 5 auditorias:\n');
    data.forEach((audit, i) => {
      console.log(`${i + 1}. Quality Score: ${audit.quality_score}/100`);
      console.log(`   Data: ${new Date(audit.audit_date).toLocaleString('pt-BR')}`);
      console.log(`   Fases completas: ${Object.values(audit.phase_scores).filter(s => s.score >= 80).length}/8`);
      console.log(`   Warnings: ${audit.warnings?.length || 0}`);
      console.log('');
    });
  }
}

checkAuditorias();
