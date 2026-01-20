// SCRIPT 6 - GERAÇÃO DE CENAS DE TRABALHO MULTI-PERSONA
// Gera imagens realistas de situações profissionais usando System Prompts salvos

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GOOGLE_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

console.log('🎬 SCRIPT 6 - GERAÇÃO DE CENAS DE TRABALHO');
console.log('==========================================');
console.log('Cria imagens realistas de situações profissionais');
console.log('usando descrições físicas consistentes das personas\n');

// Cenários típicos de trabalho
const WORKPLACE_SCENARIOS = [
  {
    id: 'reuniao_estrategica',
    nome: 'Reunião Estratégica',
    descricao: 'Reunião de diretoria discutindo estratégia empresarial',
    personas_necessarias: ['CEO', 'CFO', 'CTO'],
    ambiente: 'Sala de reuniões executiva, mesa de vidro, telas digitais ao fundo',
    composicao: 'Visão de conjunto mostrando 3 pessoas em volta de mesa',
    iluminacao: 'Iluminação profissional de escritório, luz natural vinda de janelas',
    angulo: 'Ângulo de 3/4, capturando interação entre pessoas'
  },
  {
    id: 'apresentacao_projeto',
    nome: 'Apresentação de Projeto',
    descricao: 'Apresentação técnica para equipe',
    personas_necessarias: ['CTO', 'Engenheiro de Software', 'Designer UX/UI'],
    ambiente: 'Sala de apresentação com projetor, whiteboard, ambiente tech',
    composicao: 'Apresentador em pé próximo a tela, audiência sentada',
    iluminacao: 'Iluminação mista: tela projetor + luz ambiente',
    angulo: 'Vista lateral mostrando apresentador e audiência'
  },
  {
    id: 'brainstorm_criativo',
    nome: 'Brainstorm Criativo',
    descricao: 'Sessão criativa de ideação em equipe',
    personas_necessarias: ['Designer UX/UI', 'Marketing Manager', 'Product Manager'],
    ambiente: 'Espaço colaborativo moderno, post-its, quadro branco',
    composicao: 'Grupo em volta de mesa, alguns em pé, energia criativa',
    iluminacao: 'Luz natural abundante, ambiente luminoso e energético',
    angulo: 'Vista superior-lateral capturando dinâmica do grupo'
  },
  {
    id: 'call_cliente',
    nome: 'Videochamada com Cliente',
    descricao: 'Reunião virtual com cliente importante',
    personas_necessarias: ['CEO', 'Sales Manager'],
    ambiente: 'Home office executivo ou escritório, laptop/monitor grande',
    composicao: 'Foco na pessoa em chamada, tela visível ao fundo',
    iluminacao: 'Ring light ou iluminação de videoconferência profissional',
    angulo: 'Ângulo frontal/levemente lateral, como em chamada real'
  },
  {
    id: 'coworking_colaborativo',
    nome: 'Trabalho Colaborativo',
    descricao: 'Equipe trabalhando juntos em projeto',
    personas_necessarias: ['Engenheiro de Software', 'Designer UX/UI', 'QA Engineer'],
    ambiente: 'Espaço de coworking moderno, laptops, monitores duplos',
    composicao: 'Pessoas lado a lado trabalhando, compartilhando telas',
    iluminacao: 'Iluminação ambiente moderna, luz natural',
    angulo: 'Vista de 3/4 mostrando colaboração'
  },
  {
    id: 'treinamento_equipe',
    nome: 'Treinamento de Equipe',
    descricao: 'Sessão de capacitação interna',
    personas_necessarias: ['HR Manager', 'Assistente Administrativo', 'Assistente de Marketing'],
    ambiente: 'Sala de treinamento, flipchart, materiais didáticos',
    composicao: 'Instrutor em pé, participantes sentados atentos',
    iluminacao: 'Iluminação clara de sala de aula corporativa',
    angulo: 'Vista geral da sala capturando instrutor e alunos'
  }
];

async function loadPersonaSystemPrompts(empresaId, rolesNeeded) {
  console.log(`\n📥 Carregando System Prompts de ${rolesNeeded.length} personas...`);
  
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, role, system_prompt')
    .eq('empresa_id', empresaId)
    .not('system_prompt', 'is', null);

  if (error) {
    console.error('❌ Erro ao carregar personas:', error.message);
    return null;
  }

  // Mapear personas por cargo
  const personasMap = {};
  for (const role of rolesNeeded) {
    const persona = personas.find(p => p.role.includes(role) || role.includes(p.role));
    if (persona) {
      try {
        personasMap[role] = {
          ...persona,
          system_prompt_parsed: JSON.parse(persona.system_prompt)
        };
        console.log(`  ✅ ${role}: ${persona.full_name}`);
      } catch (e) {
        console.log(`  ⚠️  ${role}: System prompt inválido para ${persona.full_name}`);
      }
    } else {
      console.log(`  ⚠️  ${role}: Não encontrado`);
    }
  }

  return personasMap;
}

function buildMultiPersonaPrompt(scenario, personasData) {
  console.log(`\n🎨 Gerando prompt para: ${scenario.nome}`);
  
  const personasDescriptions = Object.entries(personasData).map(([role, persona]) => {
    const sp = persona.system_prompt_parsed;
    const desc = sp.descricao_fisica_completa || {};
    
    // Defaults seguros para evitar undefined
    const olhos = desc.olhos || {};
    const cabelo = desc.cabelo || {};
    
    return `
PERSONA ${persona.full_name} (${role}):
- Tom de pele: ${desc.tom_pele || 'pele média'}
- Rosto: ${desc.formato_rosto || 'oval'}
- Olhos: ${olhos.cor || 'castanhos'}, ${olhos.formato || 'médios'}
- Nariz: ${desc.nariz || 'proporcional'}
- Boca: ${desc.boca_labios || 'média'}
- Expressão típica: ${desc.expressao_tipica || 'neutra profissional'}
- Cabelo: ${cabelo.cor || 'castanho'}, ${cabelo.comprimento || 'médio'}, ${cabelo.textura || 'liso'}
- Tipo físico: ${desc.tipo_fisico || 'médio'}
- Altura: ${desc.altura_aproximada || '1.70m'}
- Postura: ${desc.postura_tipica || 'ereta'}
- Estilo vestuário: ${desc.estilo_roupa_padrao || 'executivo casual'}
- Acessórios: ${desc.acessorios_permanentes || 'nenhum acessório distintivo'}
${desc.marcas_unicas ? `- Marcas distintivas: ${desc.marcas_unicas}` : ''}
`;
  }).join('\n');

  const fullPrompt = `
Crie uma imagem ULTRA-REALISTA (foto qualidade 4K) de uma cena profissional corporativa.

CENÁRIO: ${scenario.nome}
DESCRIÇÃO: ${scenario.descricao}

AMBIENTE:
${scenario.ambiente}

COMPOSIÇÃO:
${scenario.composicao}

ILUMINAÇÃO:
${scenario.iluminacao}

ÂNGULO DA CÂMERA:
${scenario.angulo}

PESSOAS NA CENA (manter EXATAMENTE estas características):
${personasDescriptions}

PARÂMETROS TÉCNICOS:
- Estilo: Fotografia corporativa profissional, realista
- Qualidade: 4K, ultra-high resolution
- Câmera: DSLR full-frame, 35mm ou 50mm lens
- Profundidade de campo: f/2.8 para desfoque suave de fundo
- Pós-processamento: Cor natural, contraste moderado, sharpness profissional
- Formato: 16:9 landscape para uso em apresentações

REGRAS CRÍTICAS:
1. MANTER EXATAMENTE as características físicas descritas de cada pessoa
2. Posicionamento espacial coerente com a situação
3. Linguagem corporal natural e profissional
4. Interação visual plausível entre as pessoas
5. Detalhes ambientais realistas (logos, materiais de escritório)
6. Iluminação consistente em todas as pessoas
7. Profundidade e perspectiva corretas
8. Sem distorções ou elementos artificiais

PROMPT NEGATIVO (evitar):
cartoon, anime, illustration, painting, sketch, low quality, blurry, distorted faces, 
extra limbs, deformed, unrealistic proportions, bad anatomy, watermark, signature
`;

  return fullPrompt;
}

async function generateWorkplaceScene(empresaId, scenario) {
  try {
    console.log(`\n\n🎬 ===== ${scenario.nome.toUpperCase()} =====`);
    
    // 1. Carregar system prompts das personas necessárias
    const personasData = await loadPersonaSystemPrompts(empresaId, scenario.personas_necessarias);
    
    if (!personasData || Object.keys(personasData).length < scenario.personas_necessarias.length) {
      console.log('⚠️  Personas insuficientes ou sem System Prompt. Pulando cenário.');
      return null;
    }

    // 2. Construir prompt multi-persona
    const imagePrompt = buildMultiPersonaPrompt(scenario, personasData);

    // 3. Gerar imagem via Google AI (simulação - na prática usar Midjourney, DALL-E 3, etc)
    console.log('\n🤖 Enviando para geração de imagem...');
    console.log('⚠️  NOTA: Este script prepara o prompt. Para gerar imagem real,');
    console.log('    integre com Midjourney API, DALL-E 3, ou Stable Diffusion.');
    
    // Salvar prompt para uso manual
    const outputDir = path.join(process.cwd(), 'AUTOMACAO', 'workplace_scenes_prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenario.id}_${timestamp}.txt`;
    
    fs.writeFileSync(
      path.join(outputDir, filename),
      imagePrompt,
      'utf8'
    );

    console.log(`✅ Prompt salvo: ${filename}`);
    console.log(`📋 Para gerar imagem: copie o prompt e use em Midjourney/DALL-E 3`);

    // Salvar metadata da cena
    const metadata = {
      scenario: scenario,
      personas_used: Object.keys(personasData).map(role => ({
        role,
        name: personasData[role].full_name,
        id: personasData[role].id
      })),
      prompt: imagePrompt,
      generated_at: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(outputDir, `${scenario.id}_${timestamp}.json`),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    return metadata;

  } catch (error) {
    console.error(`❌ Erro ao gerar cena ${scenario.nome}:`, error.message);
    return null;
  }
}

async function main() {
  try {
    // Obter empresa alvo
    let targetEmpresaId = null;
    const args = process.argv.slice(2);
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        targetEmpresaId = arg.split('=')[1];
        break;
      }
    }

    if (!targetEmpresaId && args.length > 0) {
      targetEmpresaId = args[0];
    }

    if (!targetEmpresaId) {
      console.log('⚠️  Uso: node 06_generate_workplace_scenes.js --empresaId=<ID>');
      console.log('⚠️  Ou: node 06_generate_workplace_scenes.js <ID>');
      
      // Buscar primeira empresa ativa
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('status', 'ativa')
        .limit(1);
      
      if (empresas && empresas.length > 0) {
        targetEmpresaId = empresas[0].id;
        console.log(`\n✅ Usando primeira empresa ativa: ${empresas[0].nome}`);
      } else {
        console.error('❌ Nenhuma empresa ativa encontrada');
        process.exit(1);
      }
    }

    // Verificar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada:', targetEmpresaId);
      process.exit(1);
    }

    console.log(`\n🏢 Empresa: ${empresa.nome}`);
    console.log(`📊 Total de cenários disponíveis: ${WORKPLACE_SCENARIOS.length}`);

    // Gerar cenas para todos os cenários
    const results = [];
    for (const scenario of WORKPLACE_SCENARIOS) {
      const result = await generateWorkplaceScene(targetEmpresaId, scenario);
      if (result) {
        results.push(result);
      }
      
      // Delay entre cenários
      if (WORKPLACE_SCENARIOS.indexOf(scenario) < WORKPLACE_SCENARIOS.length - 1) {
        console.log('\n⏳ Aguardando 2s antes do próximo cenário...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Resumo final
    console.log('\n\n📊 ===== RESUMO FINAL =====');
    console.log(`✅ Prompts gerados: ${results.length}/${WORKPLACE_SCENARIOS.length}`);
    console.log(`📁 Diretório: AUTOMACAO/workplace_scenes_prompts/`);
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Abra os arquivos .txt gerados');
    console.log('2. Copie os prompts para Midjourney (/imagine) ou DALL-E 3');
    console.log('3. Ajuste parâmetros se necessário (aspect ratio, quality, etc)');
    console.log('4. Salve as imagens geradas em assets da empresa');
    console.log('5. Use em apresentações, site, materiais de marketing\n');

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
