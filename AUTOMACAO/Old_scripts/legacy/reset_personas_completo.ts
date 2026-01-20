import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VCM_SUPABASE_URL!
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetPersonasCompleto() {
  console.log('🔄 Iniciando reset completo do sistema de personas...')
  
  try {
    // 1. Deletar todas as competências (que dependem de personas)
    console.log('📝 Deletando todas as competências...')
    const { error: deleteCompetenciasError } = await supabase
      .from('competencias')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deleta tudo

    if (deleteCompetenciasError) {
      console.log('❌ Erro ao deletar competências:', deleteCompetenciasError.message)
    } else {
      console.log('✅ Todas as competências deletadas')
    }

    // 2. Deletar todas as metas de personas
    console.log('📝 Deletando todas as metas de personas...')
    const { error: deleteMetasPersonasError } = await supabase
      .from('metas_personas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteMetasPersonasError) {
      console.log('❌ Erro ao deletar metas de personas:', deleteMetasPersonasError.message)
    } else {
      console.log('✅ Todas as metas de personas deletadas')
    }

    // 3. Deletar outros dados relacionados a personas
    console.log('📝 Deletando avatares de personas...')
    const { error: deleteAvatarsError } = await supabase
      .from('avatares_personas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteAvatarsError) {
      console.log('❌ Erro ao deletar avatares:', deleteAvatarsError.message)
    } else {
      console.log('✅ Todos os avatares deletados')
    }

    // 4. Finalmente deletar todas as personas
    console.log('📝 Deletando todas as personas...')
    const { error: deletePersonasError } = await supabase
      .from('personas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deletePersonasError) {
      console.log('❌ Erro ao deletar personas:', deletePersonasError.message)
    } else {
      console.log('✅ Todas as personas deletadas')
    }

    // 5. Verificar limpeza
    console.log('📝 Verificando limpeza...')
    const { data: remainingPersonas, error: checkError } = await supabase
      .from('personas')
      .select('id')

    if (checkError) {
      console.log('❌ Erro ao verificar:', checkError.message)
    } else {
      console.log(`✅ Verificação concluída: ${remainingPersonas?.length || 0} personas restantes`)
    }

    // 6. Resetar status das empresas
    console.log('📝 Resetando status de scripts das empresas...')
    const { error: resetEmpresasError } = await supabase
      .from('empresas')
      .update({
        scripts_status: {
          rag: false,
          fluxos: false, 
          workflows: false,
          biografias: false,
          tech_specs: false,
          competencias: false
        }
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (resetEmpresasError) {
      console.log('❌ Erro ao resetar empresas:', resetEmpresasError.message)
    } else {
      console.log('✅ Status das empresas resetado')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
resetPersonasCompleto().then(() => {
  console.log('🏁 Reset completo concluído! Sistema pronto para começar do zero.')
  process.exit(0)
})