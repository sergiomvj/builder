const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAvatares() {
  console.log('Verificando avatares gerados...\n')
  
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome')
    .order('created_at', { ascending: false })
    .limit(2)
  
  console.log('Empresas recentes:')
  empresas.forEach(e => console.log(`- ${e.nome}: ${e.id}`))
  console.log('')
  
  for (const emp of empresas) {
    const { data: avatares, count } = await supabase
      .from('personas_avatares')
      .select('*', { count: 'exact' })
      .eq('empresa_id', emp.id)
    
    console.log(`\n${emp.nome}: ${count || 0}/15 avatares`)
    
    if (avatares && avatares.length > 0) {
      console.log('Últimos 3 criados:')
      avatares.slice(-3).forEach(a => {
        const created = new Date(a.created_at).toLocaleTimeString('pt-BR')
        console.log(`  - ${created}: Persona ${a.persona_id.substring(0, 8)}...`)
      })
    }
  }
}

checkAvatares()
