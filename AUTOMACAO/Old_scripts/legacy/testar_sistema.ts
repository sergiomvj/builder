import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VCM_SUPABASE_URL!
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testarSistema() {
  console.log('🧪 Testando sistema de personas virtuais...\n')
  
  try {
    // 1. Verificar personas criadas
    console.log('1️⃣ Verificando personas criadas:')
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, role, department, email')
      .order('role')

    if (personasError) {
      console.error('❌ Erro ao buscar personas:', personasError)
      return
    }

    console.log(`   📊 Total de personas: ${personas?.length || 0}`)
    personas?.forEach(persona => {
      console.log(`   👤 ${persona.full_name} - ${persona.role} (${persona.department})`)
    })

    // 2. Verificar competências
    console.log('\n2️⃣ Verificando competências:')
    const { data: competencias, error: competenciasError } = await supabase
      .from('competencias')
      .select('id, nome, tipo, persona_id')

    if (competenciasError) {
      console.error('❌ Erro ao buscar competências:', competenciasError)
      return
    }

    console.log(`   📋 Total de competências: ${competencias?.length || 0}`)
    
    // Agrupar por persona
    const competenciasPorPersona = competencias?.reduce((acc: any, comp) => {
      const persona = personas?.find(p => p.id === comp.persona_id)
      const personaName = persona?.full_name || 'Persona não encontrada'
      if (!acc[personaName]) acc[personaName] = []
      acc[personaName].push(comp)
      return acc
    }, {})

    Object.entries(competenciasPorPersona || {}).forEach(([personaName, comps]: [string, any]) => {
      console.log(`   🎯 ${personaName}: ${comps.length} competências`)
    })

    // 3. Testar estrutura para novas colunas
    console.log('\n3️⃣ Testando estrutura de competências:')
    try {
      const { data: testComp, error: testError } = await supabase
        .from('competencias')
        .select('atribuicoes_detalhadas, escopo_sdr_hibrido')
        .limit(1)

      if (testError) {
        console.log('   ⚠️ Novas colunas ainda não existem:', testError.message)
        console.log(`
   🔧 EXECUTE NO SQL EDITOR DO SUPABASE:
   
   ALTER TABLE public.competencias 
   ADD COLUMN atribuicoes_detalhadas TEXT 
   CHECK (char_length(atribuicoes_detalhadas) <= 1000);
   
   ALTER TABLE public.competencias 
   ADD COLUMN escopo_sdr_hibrido BOOLEAN DEFAULT FALSE;
        `)
      } else {
        console.log('   ✅ Novas colunas existem no banco!')
      }
    } catch (err) {
      console.log('   ⚠️ Erro ao testar novas colunas:', err)
    }

    // 4. Verificar empresas
    console.log('\n4️⃣ Verificando empresas:')
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, codigo, status')

    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError)
      return
    }

    empresas?.forEach(empresa => {
      const personasEmpresa = personas?.filter(p => p.id.includes('empresa') || true).length || 0
      console.log(`   🏢 ${empresa.nome} (${empresa.codigo}) - Status: ${empresa.status}`)
    })

    // 5. Resumo do teste
    console.log('\n📋 RESUMO DO TESTE:')
    console.log(`   ✅ ${personas?.length || 0} personas criadas`)
    console.log(`   ✅ ${competencias?.length || 0} competências criadas`)
    console.log(`   ✅ ${empresas?.length || 0} empresas ativas`)
    
    if (personas?.some(p => p.role.includes('CEO'))) {
      console.log('   ✅ CEO encontrado')
    }
    
    if (personas?.some(p => p.role.includes('Head'))) {
      console.log('   ✅ Head de Vendas encontrado')
    }
    
    if (personas?.some(p => p.role.includes('Assistente'))) {
      console.log('   ✅ Assistentes encontrados')
    }

    console.log('\n🎉 Sistema funcionando! Pronto para testes no dashboard.')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

testarSistema().then(() => {
  console.log('\n🏁 Teste concluído')
  process.exit(0)
})