// MIGRAÇÃO: personas.biografia_completa → personas_biografias
import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase
const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateBiografias() {
  try {
    console.log('🔄 INICIANDO MIGRAÇÃO DE BIOGRAFIAS...');
    console.log('=====================================');
    
    // 1. BUSCAR PERSONAS COM BIOGRAFIAS EXISTENTES
    console.log('1️⃣ Buscando personas com biografias...');
    
    const { data: personasComBiografias, error: selectError } = await supabase
      .from('personas')
      .select('id, biografia_completa, created_at, updated_at, full_name')
      .not('biografia_completa', 'is', null)
      .neq('biografia_completa', '');
      
    if (selectError) {
      console.error('❌ Erro ao buscar personas:', selectError);
      return;
    }
    
    console.log(`📊 Encontradas ${personasComBiografias.length} personas com biografias`);
    
    if (personasComBiografias.length === 0) {
      console.log('✅ Nenhuma biografia para migrar');
      return;
    }
    
    // 2. VERIFICAR SE JÁ EXISTEM REGISTROS EM personas_biografias
    console.log('\n2️⃣ Verificando registros existentes...');
    
    const { data: biografiasExistentes } = await supabase
      .from('personas_biografias')
      .select('persona_id');
      
    const personaIdsExistentes = new Set(biografiasExistentes?.map(b => b.persona_id) || []);
    console.log(`📋 ${personaIdsExistentes.size} biografias já existem na nova tabela`);
    
    // 3. PREPARAR DADOS PARA MIGRAÇÃO
    console.log('\n3️⃣ Preparando dados para migração...');
    
    const dadosParaMigrar = [];
    
    for (const persona of personasComBiografias) {
      // Pular se já existe
      if (personaIdsExistentes.has(persona.id)) {
        console.log(`⏭️  Pulando ${persona.full_name} - já migrada`);
        continue;
      }
      
      // Estrutura padrão para biografias simples existentes
      const biografiaEstruturada = {
        persona_id: persona.id,
        biografia_completa: persona.biografia_completa,
        historia_profissional: 'A ser detalhada com LLM',
        motivacoes: {
          intrinsecas: ['Crescimento profissional'],
          extrinsecas: ['Reconhecimento'],
          valores_pessoais: ['Integridade'],
          paixoes: ['Carreira']
        },
        desafios: {
          profissionais: ['Crescimento'],
          pessoais: ['Work-life balance'],
          tecnologicos: ['Atualização'],
          interpessoais: ['Comunicação']
        },
        objetivos_pessoais: ['Crescer profissionalmente'],
        soft_skills: {
          comunicacao: 7,
          lideranca: 6,
          trabalho_equipe: 7,
          resolucao_problemas: 7,
          criatividade: 6,
          adaptabilidade: 7,
          inteligencia_emocional: 6,
          pensamento_critico: 7
        },
        hard_skills: {
          tecnologicas: {'Competência geral': 7},
          ferramentas: ['A ser definido'],
          metodologias: ['A ser definido'],
          areas_conhecimento: ['Área de atuação']
        },
        educacao: {
          formacao_superior: ['Graduação'],
          pos_graduacao: [],
          cursos_complementares: [],
          instituicoes: ['Universidade']
        },
        certificacoes: [],
        idiomas_fluencia: {
          nativo: ['Português'],
          fluente: ['Inglês'],
          intermediario: [],
          basico: []
        },
        experiencia_internacional: {
          paises_trabalhou: [],
          projetos_globais: [],
          clientes_internacionais: false,
          culturas_conhece: ['Brasil']
        },
        redes_sociais: {
          linkedin: '',
          twitter: '',
          github: '',
          website_pessoal: '',
          outros: {}
        },
        created_at: persona.created_at,
        updated_at: new Date().toISOString()
      };
      
      dadosParaMigrar.push(biografiaEstruturada);
      console.log(`📝 Preparado: ${persona.full_name}`);
    }
    
    console.log(`\n📊 ${dadosParaMigrar.length} biografias prontas para migrar`);
    
    if (dadosParaMigrar.length === 0) {
      console.log('✅ Todas as biografias já foram migradas');
      return;
    }
    
    // 4. EXECUTAR MIGRAÇÃO
    console.log('\n4️⃣ Executando migração...');
    
    const { data: biografiasMigradas, error: insertError } = await supabase
      .from('personas_biografias')
      .insert(dadosParaMigrar)
      .select();
      
    if (insertError) {
      console.error('❌ Erro na migração:', insertError);
      return;
    }
    
    console.log(`✅ ${biografiasMigradas.length} biografias migradas com sucesso!`);
    
    // 5. VERIFICAR RESULTADOS
    console.log('\n5️⃣ Verificando resultados...');
    
    const { count: totalBiografias } = await supabase
      .from('personas_biografias')
      .select('*', { count: 'exact', head: true });
      
    console.log(`📊 Total de biografias na nova tabela: ${totalBiografias}`);
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Dados migrados para personas_biografias');
    console.log('✅ Estrutura de dados padronizada');
    console.log('✅ Sistema pronto para LLM estruturada');
    
  } catch (error) {
    console.error('💥 Erro geral na migração:', error);
  }
}

// Executar migração
migrateBiografias();