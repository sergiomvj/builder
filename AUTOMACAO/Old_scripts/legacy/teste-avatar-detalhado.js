/**
 * TESTE: Demonstração dos dados detalhados gerados pelo Script 0 - Avatares
 * 
 * Este script mostra todos os campos que serão populados na tabela avatares_personas
 * com dados ricos e detalhados baseados nas características da persona.
 */

const exemploPersona = {
  id: 'uuid-123',
  full_name: 'Sarah Johnson',
  role: 'Chief Technology Officer (CTO)',
  department: 'Technology',
  personalidade: { idade: '42' },
  ceo_gender: 'feminino',
  empresas: {
    nome: 'TechCorp Solutions',
    industry: 'tecnologia'
  }
};

// Simular as funções do script principal
function determineGender(persona) {
  return 'feminino';
}

function determineSeniority(role) {
  return 'executivo';
}

function extractPersonalityTraits(persona) {
  return ['analytical', 'innovative', 'technical', 'leadership'];
}

function generatePhysicalDescription(persona, age, gender) {
  return 'Professional woman approximately 42 years old, mature features, experienced look, authoritative presence, well-groomed, smart-casual appearance, modern look';
}

function extractCharacteristics(persona) {
  const age = '42';
  const gender = determineGender(persona);
  const role = persona.role.toLowerCase();
  const department = persona.department || 'general';
  
  let style = 'formal';
  let backgroundType = 'office';
  
  return {
    age_range: age,
    gender: gender,
    style: style,
    role: persona.role,
    department: department,
    backgroundType: backgroundType,
    company_industry: persona.empresas?.industry || 'tecnologia',
    seniority: determineSeniority(role),
    personality_traits: extractPersonalityTraits(persona),
    physical_description: generatePhysicalDescription(persona, age, gender)
  };
}

function generateAvatarPrompt(persona, characteristics, empresaInfo) {
  const prompt = `Gere um avatar corporativo profissional ultra-realista para uma persona de IA com as seguintes especificações DETALHADAS:

**CARACTERÍSTICAS FÍSICAS:**
- ${characteristics.physical_description}
- Idade: ${characteristics.age_range} anos
- Gênero: ${characteristics.gender}
- Expressão: profissional, confiante e acessível
- Qualidade: ultra-realista, alta definição, photoreal quality

**DADOS PROFISSIONAIS:**
- Cargo: ${characteristics.role}
- Departamento: ${characteristics.department}
- Nível de senioridade: ${characteristics.seniority}
- Setor: ${characteristics.company_industry}
- Empresa: ${empresaInfo.nome || 'empresa de tecnologia'}

**PERSONALIDADE E ESTILO:**
- Traços de personalidade: ${characteristics.personality_traits.join(', ')}
- Estilo visual: ${characteristics.style}
- Tom profissional: ${characteristics.seniority === 'executivo' ? 'autoritário e confiante' : 'colaborativo e competente'}

**ESPECIFICAÇÕES TÉCNICAS DO AVATAR:**
- Background: ${characteristics.backgroundType} environment
- Iluminação: professional studio lighting, soft shadows
- Enquadramento: portrait shot, shoulders and head visible
- Vestimenta: appropriate business attire for ${characteristics.style} style
- Resolução: high-definition, suitable for web and print
- Formato: professional headshot style

**CONTEXTO EMPRESARIAL:**
- Cultura empresarial: ${characteristics.company_industry} industry standards
- Público-alvo: clientes corporativos e parceiros de negócios
- Propósito: representação visual da persona para interações AI-driven

**REQUISITOS ESPECÍFICOS:**
- Deve transmitir competência e confiabilidade
- Adequado para uso em apresentações corporativas
- Compatível com identidade visual da empresa
- Deve parecer uma pessoa real e profissional
- Expressão facial neutra mas acessível
- Postura corporal confiante

Estilo de renderização: hyper-realistic corporate photography, professional studio quality, business portrait style, clean and modern aesthetic.`;

  return prompt;
}

// Executar demonstração
console.log('🎯 DEMONSTRAÇÃO: Dados Detalhados para Avatar\n');
console.log('='.repeat(60));

const characteristics = extractCharacteristics(exemploPersona);
const prompt = generateAvatarPrompt(exemploPersona, characteristics, exemploPersona.empresas);

console.log('\n📊 CARACTERÍSTICAS EXTRAÍDAS:');
console.log(JSON.stringify(characteristics, null, 2));

console.log('\n🎨 PROMPT PARA GERAÇÃO DE AVATAR:');
console.log(prompt);

console.log('\n📋 DADOS QUE SERÃO SALVOS NA TABELA avatares_personas:');

const avatarData = {
  id: 'auto-generated-uuid',
  persona_id: exemploPersona.id,
  avatar_url: 'https://generated-avatar-url.com/sarah-johnson-cto.webp',
  avatar_thumbnail_url: 'https://generated-avatar-url.com/sarah-johnson-cto-thumb.webp',
  prompt_usado: prompt,
  estilo: characteristics.style, // 'formal'
  background_tipo: characteristics.backgroundType, // 'office' 
  servico_usado: 'nano_banana', // ou 'dall_e', 'midjourney', 'custom'
  versao: 1,
  ativo: true,
  
  // 🆕 NOVO CAMPO 1: BIOMETRICS - Descrição física minuciosa
  biometrics: JSON.stringify({
    facial_structure: {
      face_shape: 'oval mature, defined cheekbones',
      eyes: {
        color: 'blue',
        shape: 'almond-shaped, expressive',
        expression: 'confident, piercing gaze'
      },
      nose: 'refined, proportionate',
      mouth: 'professional smile, well-defined lips',
      skin_tone: 'fair to medium complexion, healthy appearance'
    },
    physical_build: {
      height: '5\'6" - 5\'8" (168-173cm)',
      build: 'confident posture, authoritative presence',
      hair: 'shoulder-length, professionally styled, possible subtle highlights',
      distinctive_features: 'mature, experienced expression, authoritative presence, confident bearing, professional makeup, polished appearance'
    },
    style_presentation: {
      clothing_preference: 'tailored business suits, crisp shirts',
      accessories: 'quality watch, minimal jewelry',
      grooming: 'impeccably groomed, professional appearance',
      color_palette: 'neutral business tones with confident accent colors'
    },
    ai_generation_tags: [
      '42-year-old feminino professional',
      'executivo level executive', 
      'formal business attire',
      'office environment',
      'high-resolution portrait',
      'consistent facial features',
      'professional lighting'
    ]
  }, null, 2),
  
  // 🆕 NOVO CAMPO 2: HISTORY - Trajetória PROFISSIONAL E PESSOAL que contextualiza competências
  history: JSON.stringify({
    educational_background: 'Master in Computer Science, Bachelor in Software Engineering, Executive Leadership Program',
    career_progression: '20 years of progressive leadership experience, started as software developer, promoted through senior developer, team lead, engineering manager, VP Engineering, and now CTO roles',
    
    // 🔥 ASPECTOS PESSOAIS DETALHADOS
    personal_life_context: {
      family_background: 'Casada há 14 anos, desenvolveu habilidades de negociação e empatia',
      relationships_and_languages: 'Cônjuge brasileiro explica fluência em português e conhecimento cultural profundo',
      hobbies_and_skills: 'Programação hobby desde adolescência explica paixão e expertise técnica natural',
      life_experiences: 'Mudou de país 3 vezes, expert em adaptação e gestão de mudanças',
      cultural_geographical_background: 'Grande centro urbano desde nascença, adaptado a ritmo acelerado e multitasking',
      personal_values_work_style: 'Paixão por inovação e tecnologia que vem desde a infância com primeiros computadores',
      challenges_overcome: 'Quebrou teto de vidro em indústria dominada por homens, pioneira em diversidade',
      social_network_mentors: 'Rede de ex-colegas agora em posições-chave facilita partnerships estratégicos'
    },
    
    international_experience: 'Led European expansion project, developed advanced English and basic German skills; Worked 3 years in Brazil office, fluent Portuguese from immersive business environment',
    skill_development_context: 'Extensive hands-on coding experience justifies technical leadership abilities, continuous learning in emerging technologies explains cutting-edge knowledge',
    career_milestones: 'Led successful company digital transformation; Industry recognition as expert in tecnologia; Mentored dozens of junior professionals',
    
    // 🏠 CONTEXTO PESSOAL EXPANDIDO
    personal_context_detailed: {
      family_career_influence: 'Família de imigrantes empreendedores explicam resiliência e adaptação',
      passions_became_skills: 'Paixão por sci-fi desde criança desenvolveu visão futurista e inovação',
      life_changing_events: 'Nascimento do primeiro filho transformou habilidades de gestão de tempo e prioridades',
      lifestyle_reflection: 'Rotina de exercícios às 5h reflete disciplina e gestão de energia'
    }
  }, null, 2),
  
  metadados: {
    // Dados técnicos da geração
    resolucao: '1024x1024',
    formato: 'webp',
    tamanho_arquivo: 175000, // ~175KB
    qualidade: 'ultra_high',
    
    // Seed e parâmetros de geração
    seed_usado: 'A7B2F9X',
    parametros_geracao: {
      prompt_original: prompt,
      prompt_negativo: 'blurry, low quality, distorted, cartoonish, anime, drawing',
      steps: 30,
      cfg_scale: 8.5,
      sampler: 'DPM++ 2M Karras',
      scheduler: 'Karras',
      modelo_base: 'realistic-portrait-v4.1'
    },
    
    // Características detectadas/aplicadas
    caracteristicas_aplicadas: {
      idade_aparente: characteristics.age_range,
      genero: characteristics.gender,
      etnia: 'caucasiano',
      estilo_vestimenta: characteristics.style,
      background_ambiente: characteristics.backgroundType,
      expressao_facial: 'profissional_confiante',
      postura_corporal: 'ereta_confiante',
      iluminacao: 'studio_professional'
    },
    
    // Dados profissionais refletidos no avatar
    contexto_profissional: {
      cargo: characteristics.role,
      nivel_senioridade: characteristics.seniority,
      departamento: characteristics.department,
      industria: characteristics.company_industry,
      traits_personalidade: characteristics.personality_traits
    },
    
    // Metadados de processamento
    processamento: {
      data_geracao: new Date().toISOString(),
      tempo_processamento: 28, // segundos
      versao_algoritmo: '2.1.0',
      servico_usado: 'nano_banana_v2',
      status_qualidade: 'aprovado_automatico'
    },
    
    // Hash para versionamento
    hash_avatar: 'a7b2f9x8k1m3',
    compatibilidade: {
      web: true,
      mobile: true,
      print: true,
      social_media: true
    }
  },
  created_at: new Date().toISOString()
};

console.log(JSON.stringify(avatarData, null, 2));

console.log('\n✅ RESULTADO: Avatar com dados ULTRA-DETALHADOS!');
console.log('🔹 Todas as 14 colunas da tabela avatares_personas serão populadas (incluindo 2 novos campos)');
console.log('🔹 BIOMETRICS: Descrição física minuciosa para consistência de geração AI');
console.log('🔹 HISTORY: Trajetória profissional que justifica cada competência');
console.log('🔹 Metadados JSONB com mais de 20 campos de informação técnica');
console.log('🔹 Prompt LLM super detalhado com especificações técnicas completas');
console.log('🔹 Características profissionais e físicas mapeadas em profundidade');
console.log('🔹 Contexto educacional, internacional e pessoal que explica habilidades');
console.log('🔹 Pronto para geração consistente de avatares e contextualização de personas');