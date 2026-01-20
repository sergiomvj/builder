import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VCM_SUPABASE_URL!
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function addAtribuicoesColumn() {
  console.log('🔄 Iniciando atualização da tabela competencias...')
  
  try {
    // Verificar se as colunas já existem
    const { data: existingData, error: checkError } = await supabase
      .from('competencias')
      .select('atribuicoes_detalhadas, escopo_sdr_hibrido')
      .limit(1)

    if (checkError && checkError.code !== '42703') { // 42703 = column does not exist
      console.log('❌ Erro ao verificar colunas:', checkError.message)
      return
    }

    if (checkError && checkError.code === '42703') {
      console.log('📝 Colunas ainda não existem, vou usar SQL direto via supabase-js...')
      
      // Como não temos exec_sql, vamos aplicar via interface web ou usar outro método
      console.log(`
      ⚠️  AÇÃO MANUAL NECESSÁRIA:
      
      Execute o seguinte SQL no painel do Supabase:
      
      ALTER TABLE public.competencias 
      ADD COLUMN IF NOT EXISTS atribuicoes_detalhadas TEXT 
      CHECK (char_length(atribuicoes_detalhadas) <= 1000);
      
      ALTER TABLE public.competencias 
      ADD COLUMN IF NOT EXISTS escopo_sdr_hibrido BOOLEAN DEFAULT FALSE;
      `)
    } else {
      console.log('✅ Colunas já existem na tabela!')
    }

    // Verificar estrutura da tabela
    const { data: tableInfo, error: infoError } = await supabase
      .from('competencias')
      .select('*')
      .limit(1)

    if (infoError) {
      console.log('❌ Erro ao verificar estrutura:', infoError.message)
    } else {
      console.log('✅ Estrutura da tabela competencias verificada')
      if (tableInfo[0]) {
        console.log('Colunas disponíveis:', Object.keys(tableInfo[0]))
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
addAtribuicoesColumn().then(() => {
  console.log('🏁 Processo concluído')
  process.exit(0)
})