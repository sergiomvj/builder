// SCRIPT 00 - GERAÇÃO RÁPIDA DE AVATARES COM OPENROUTER/GROK
// Versão otimizada: sem delay de 120s, usa Grok ao invés de Google Gemini
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuração
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!openrouterKey) {
  console.error('❌ OPENROUTER_API_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

console.log('🎭 SCRIPT 00 - GERAÇÃO DE AVATARES COM GROK (RÁPIDO)');
console.log('=================================================');
console.log('🚀 Modelo: Grok via OpenRouter (sem delays!)');
console.log('=================================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '00_generate_avatares_grok',
    status,
    current,
    total,
    currentPersona,
    errors,
    startedAt: status === 'running' && current === 0 ? new Date().toISOString() : null,
    completedAt: status === 'completed' ? new Date().toISOString() : null
  };
  
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.error('⚠️  Erro ao atualizar progresso:', err.message);
  }
}

async function generateAvatarWithGrok(persona, empresaInfo) {
  try {
    console.log(`  🤖 Gerando avatar via Grok para ${persona.full_name}...`);

    const personaData = {
      nome: persona.full_name,
      nacionalidade: persona.nacionalidade || 'brasileiro',
      genero: persona.genero || 'neutro',
      cargo: persona.role,
      departamento: persona.department,
      especialidade: persona.specialty,
      empresa: empresaInfo.nome,
      industria: empresaInfo.industria || empresaInfo.industry
    };

    const prompt = `Você é um especialista em criação de personas profissionais realistas.

Analise os dados e gere um perfil visual DETALHADO:

DADOS DA PERSONA:
${JSON.stringify(personaData, null, 2)}

RESPONDA SOMENTE COM JSON VÁLIDO (sem markdown, sem \`\`\`):

{
  "avatar_url": "https://ui-avatars.com/api/?name=${encodeURIComponent(persona.full_name)}&size=256&background=random",
  "avatar_thumbnail_url": "https://ui-avatars.com/api/?name=${encodeURIComponent(persona.full_name)}&size=128&background=random",
  "prompt_usado": "[prompt detalhado para geração de avatar AI]",
  "estilo": "[formal/casual/business/criativo]",
  "background_tipo": "[office/studio/outdoor/neutral]",
  "servico_usado": "grok_openrouter",
  "versao": 1,
  "ativo": true,
  "biometrics": {
    "idade_aparente": "30-40 anos",
    "genero": "${persona.genero || 'neutro'}",
    "etnia": "latino",
    "tipo_fisico": "atlético",
    "altura_estimada": "1.70-1.80m",
    "cabelo_cor": "castanho escuro",
    "cabelo_comprimento": "curto",
    "cabelo_estilo": "profissional",
    "cabelo_volume": "médio",
    "olhos_cor": "castanhos",
    "olhos_formato": "amendoados",
    "rosto_formato": "oval",
    "pele_tom": "morena clara",
    "pele_textura": "lisa",
    "sobrancelhas": "naturais",
    "nariz": "proporcional",
    "boca_labios": "médios",
    "expressao_facial_padrao": "confiante e profissional",
    "marcas_unicas": "nenhuma visível",
    "acessorios_permanentes": "óculos discretos (opcional)",
    "postura": "ereta e confiante",
    "caracteristicas_distintivas": "aparência profissional e acessível",
    "estilo_vestimenta_padrao": "formal business",
    "paleta_cores_vestuario": "tons neutros e azuis"
  },
  "physical_description_detailed": {
    "rosto": {
      "formato": "oval harmonioso",
      "tom_pele": "morena clara",
      "textura_pele": "lisa e bem cuidada",
      "olhos": {
        "cor": "castanhos expressivos",
        "formato": "amendoados"
      },
      "sobrancelhas": "bem definidas",
      "nariz": "proporcional ao rosto",
      "boca": "sorriso natural e acolhedor",
      "expressao_tipica": "confiante e profissional"
    },
    "cabelo": {
      "cor_exata": "castanho escuro",
      "comprimento": "curto profissional",
      "estilo": "bem cuidado e moderno",
      "volume": "médio"
    },
    "corpo": {
      "altura_aproximada": "1.75m",
      "tipo_fisico": "atlético",
      "proporcao": "equilibrada",
      "postura_tipica": "ereta e confiante"
    }
  },
  "consistency_parameters": {
    "rendering_style": "realista profissional",
    "lens_focus": "retrato corporativo",
    "lighting": "iluminação suave de estúdio",
    "aspect_ratio": "1:1"
  },
  "history": {
    "background_educacional": "Formação superior na área de atuação",
    "experiencia_internacional": "Exposição a práticas globais",
    "contexto_cultural": "Profissional moderno e conectado",
    "estilo_vida": "Equilibrado entre trabalho e vida pessoal",
    "marcos_carreira": "Crescimento consistente na área",
    "valores_pessoais": "Profissionalismo e inovação",
    "ambiente_trabalho": "Corporativo moderno",
    "redes_sociais": "Presença profissional ativa"
  },
  "metadados": {
    "resolucao": "1024x1024",
    "formato": "jpeg",
    "qualidade": "high",
    "parametros_geracao": {
      "prompt_negativo": "blurry, low quality, distorted",
      "steps": 20,
      "cfg_scale": 7.5
    },
    "contexto_profissional": {
      "cargo": "${persona.role}",
      "industria": "${empresaInfo.industria || empresaInfo.industry}",
      "senioridade": "profissional experiente"
    }
  }
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://buildcorp.ai',
        'X-Title': 'BuildCorp - Avatar Generation'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let avatarDataText = data.choices[0].message.content;

    // Limpar markdown se houver
    avatarDataText = avatarDataText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let avatarData;
    try {
      avatarData = JSON.parse(avatarDataText);
    } catch (parseError) {
      console.error('    ❌ Erro ao parsear JSON:', parseError.message);
      console.error('    📝 Resposta:', avatarDataText.substring(0, 200));
      return false;
    }

    // Salvar na tabela personas_avatares
    const avatarRecord = {
      persona_id: persona.id,
      avatar_url: avatarData.avatar_url,
      avatar_thumbnail_url: avatarData.avatar_thumbnail_url,
      prompt_usado: avatarData.prompt_usado,
      estilo: avatarData.estilo,
      background_tipo: avatarData.background_tipo,
      servico_usado: avatarData.servico_usado,
      versao: avatarData.versao,
      ativo: avatarData.ativo,
      biometrics: avatarData.biometrics,
      history: avatarData.history,
      metadados: avatarData.metadados,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('personas_avatares')
      .insert(avatarRecord);

    if (insertError) {
      console.error('    ❌ Erro ao salvar avatar:', insertError.message);
      return false;
    }

    // Salvar system_prompt na tabela personas
    const systemPrompt = {
      descricao_fisica_completa: avatarData.biometrics,
      parametros_detalhados: avatarData.physical_description_detailed,
      parametros_consistencia: avatarData.consistency_parameters,
      prompt_completo_geracao: avatarData.prompt_usado,
      metadata_geracao: {
        generated_at: new Date().toISOString(),
        service: 'grok_openrouter',
        version: avatarData.versao
      }
    };

    await supabase
      .from('personas')
      .update({ system_prompt: JSON.stringify(systemPrompt, null, 2) })
      .eq('id', persona.id);

    console.log(`    ✅ Avatar gerado: ${avatarData.estilo}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro:`, error.message);
    return false;
  }
}

async function generateAvatares() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      }
    }
    
    if (!empresaId) {
      console.error('❌ --empresaId não fornecido');
      process.exit(1);
    }

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada`);

    console.log(`🏢 Empresa: ${empresa.nome}\n`);

    // Buscar personas sem avatar
    const { data: personasComAvatar } = await supabase
      .from('personas_avatares')
      .select('persona_id')
      .eq('ativo', true);

    const personasComAvatarIds = personasComAvatar?.map(a => a.persona_id) || [];

    const { data: todasPersonas } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    const personasSemAvatar = todasPersonas.filter(p => 
      !personasComAvatarIds.includes(p.id)
    );

    if (!personasSemAvatar.length) {
      console.log('✅ Todas as personas já têm avatares!');
      return;
    }

    console.log(`🎨 Gerando avatares para ${personasSemAvatar.length} personas...\n`);

    updateProgress('running', 0, personasSemAvatar.length);

    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < personasSemAvatar.length; i++) {
      const persona = personasSemAvatar[i];
      
      console.log(`\n[${i + 1}/${personasSemAvatar.length}] ${persona.full_name}`);
      updateProgress('running', i, personasSemAvatar.length, persona.full_name);
      
      const sucesso = await generateAvatarWithGrok(persona, empresa);
      if (sucesso) sucessos++; else erros++;
      
      // Delay mínimo (1s) apenas para não sobrecarregar
      if (i < personasSemAvatar.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    updateProgress('completed', personasSemAvatar.length, personasSemAvatar.length);

    console.log('\n📊 RELATÓRIO');
    console.log('=============');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log('🎉 CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

generateAvatares();
