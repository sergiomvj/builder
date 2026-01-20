import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VCM_SUPABASE_URL!
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function aplicarAlteracoesBanco() {
  console.log('🔧 Aplicando alterações no banco de dados...')
  
  try {
    // Tentar inserir uma linha de teste para ver as colunas existentes
    console.log('📝 Verificando estrutura atual...')
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('competencias')
      .select('*')
      .limit(1)

    if (sampleData && sampleData.length > 0) {
      console.log('Colunas existentes:', Object.keys(sampleData[0]))
    }

    // Criar uma competência de teste SEM os novos campos
    console.log('📝 Tentando criar competência sem novos campos...')
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id')
      .limit(1)

    if (personasError || !personas?.length) {
      console.log('❌ Nenhuma persona encontrada')
      return
    }

    const personaId = personas[0].id

    // Inserir competência básica
    const { data: competenciaBasica, error: competenciaError } = await supabase
      .from('competencias')
      .insert({
        persona_id: personaId,
        tipo: 'tecnica',
        nome: 'teste_campo',
        descricao: 'Teste para verificar campos disponíveis',
        nivel: 'basico',
        categoria: 'teste'
      })
      .select()
      .single()

    if (competenciaError) {
      console.log('❌ Erro ao criar competência básica:', competenciaError)
    } else {
      console.log('✅ Competência básica criada com sucesso')
      
      // Limpar teste
      await supabase
        .from('competencias')
        .delete()
        .eq('nome', 'teste_campo')
    }

    // Mostrar informações para execução manual
    console.log(`
🔧 AÇÃO NECESSÁRIA:
    
1. Acesse o painel do Supabase: ${supabaseUrl}
2. Vá para SQL Editor
3. Execute o seguinte comando:

ALTER TABLE public.competencias 
ADD COLUMN atribuicoes_detalhadas TEXT 
CHECK (char_length(atribuicoes_detalhadas) <= 1000);

ALTER TABLE public.competencias 
ADD COLUMN escopo_sdr_hibrido BOOLEAN DEFAULT FALSE;

4. Após executar, rode novamente: npx tsx atualizar_competencias_personas.ts
`)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

aplicarAlteracoesBanco().then(() => {
  console.log('🏁 Verificação concluída')
  process.exit(0)
})