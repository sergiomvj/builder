// SCRIPT 0 - GERAÇÃO DE AVATARES PARA PERSONAS
// Gera avatares únicos para cada persona na empresa

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎭 SCRIPT 0 - GERAÇÃO DE AVATARES');
console.log('================================');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (targetEmpresaId) {
  console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
} else {
  console.log('⚠️ Nenhuma empresa específica - processará primeira empresa ativa');
}

// Configuração de avatares
const AVATAR_SERVICES = {
  unsplash: {
    base_url: 'https://images.unsplash.com',
    params: 'w=400&h=400&fit=crop&crop=face'
  }
};

async function generateAvatarForPersona(persona, empresaInfo) {
  try {
    console.log(`  🎨 Gerando avatar para ${persona.full_name}...`);

    // Gerar avatar baseado nas características
    const avatarInfo = await generateAvatarData(persona);
    
    // Atualizar descrição física com informação do avatar
    const novaDescricao = persona.descricao_fisica 
      ? `${persona.descricao_fisica}\n\n--- AVATAR ---\n${avatarInfo.description}\nAvatar URL: ${avatarInfo.url}`
      : `Descrição física completa:\n\n${avatarInfo.description}\n\n--- AVATAR ---\nAvatar URL: ${avatarInfo.url}`;
    
    // Atualizar persona com o avatar
    const { error: updateError } = await supabase
      .from('personas')
      .update({ 
        descricao_fisica: novaDescricao,
        updated_at: new Date().toISOString()
      })
      .eq('id', persona.id);

    if (updateError) {
      console.error(`    ❌ Erro ao salvar avatar: ${updateError.message}`);
      return false;
    }

    console.log(`    ✅ Avatar gerado: ${avatarInfo.url.substring(0, 50)}...`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao gerar avatar para ${persona.full_name}:`, error.message);
    return false;
  }
}

async function generateAvatarData(persona) {
  // Determinar características
  const gender = determineGender(persona);
  const seniority = determineSeniority(persona.role);
  
  // Gerar URL do avatar
  const avatarUrl = generateAvatarUrl(persona, gender, seniority);
  
  // Gerar descrição física detalhada
  const physicalDescription = generatePhysicalDescription(persona, gender, seniority);
  
  return {
    url: avatarUrl,
    description: physicalDescription
  };
}

function generateAvatarUrl(persona, gender, seniority) {
  // URLs diversificadas por gênero e nível
  const avatarUrls = {
    'feminino': {
      'executivo': [
        'https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face'
      ],
      'gerencial': [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face'
      ],
      'default': [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face'
      ]
    },
    'masculino': {
      'executivo': [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1556157382-4e063bb26661?w=400&h=400&fit=crop&crop=face'
      ],
      'gerencial': [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face'
      ],
      'default': [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face'
      ]
    }
  };

  // Selecionar URL baseado nas características
  const genderUrls = avatarUrls[gender] || avatarUrls['masculino'];
  const levelUrls = genderUrls[seniority] || genderUrls['default'];
  
  // Usar hash do ID para escolha determinística
  const hash = hashCode(persona.id);
  const index = Math.abs(hash) % levelUrls.length;
  
  return levelUrls[index];
}

function generatePhysicalDescription(persona, gender, seniority) {
  const age = 25 + Math.abs(hashCode(persona.id + 'age')) % 20; // 25-45 anos
  
  const descriptions = {
    'feminino': {
      'executivo': [
        `Mulher ${age} anos, postura executiva confiante, cabelos ${getHairStyle('feminino', 'executivo')}, olhos ${getEyeColor()}, vestimenta corporativa elegante, semblante profissional e determinado.`,
        `Executiva ${age} anos, aparência sofisticada, ${getHeight('feminino')}, cabelos ${getHairStyle('feminino', 'executivo')}, maquiagem profissional discreta, roupas de alta qualidade, postura de liderança.`,
        `Profissional feminina ${age} anos, estilo executivo moderno, cabelos ${getHairStyle('feminino', 'executivo')}, olhos expressivos ${getEyeColor()}, terno elegante, presença marcante e autoritativa.`
      ],
      'gerencial': [
        `Mulher ${age} anos, estilo profissional acessível, cabelos ${getHairStyle('feminino', 'gerencial')}, ${getHeight('feminino')}, roupas corporativas modernas, expressão amigável mas focada.`,
        `Gerente feminina ${age} anos, aparência equilibrada entre profissional e acessível, cabelos ${getHairStyle('feminino', 'gerencial')}, olhos ${getEyeColor()}, vestimenta business casual.`
      ],
      'default': [
        `Mulher ${age} anos, aparência profissional, cabelos ${getHairStyle('feminino', 'default')}, ${getHeight('feminino')}, roupas corporativas padrão, expressão concentrada e dedicada.`,
        `Profissional feminina ${age} anos, estilo simples e elegante, cabelos ${getHairStyle('feminino', 'default')}, olhos ${getEyeColor()}, vestimenta corporate casual.`
      ]
    },
    'masculino': {
      'executivo': [
        `Homem ${age} anos, postura executiva imponente, cabelos ${getHairStyle('masculino', 'executivo')}, ${getHeight('masculino')}, terno de alta qualidade, presença de liderança marcante.`,
        `Executivo ${age} anos, aparência distinguida, cabelos ${getHairStyle('masculino', 'executivo')}, olhos ${getEyeColor()}, vestimenta impecável, barba bem cuidada, postura autoritativa.`,
        `Líder masculino ${age} anos, estilo corporativo refinado, cabelos ${getHairStyle('masculino', 'executivo')}, porte atlético, roupas sob medida, expressão confiante e visionária.`
      ],
      'gerencial': [
        `Homem ${age} anos, aparência profissional acessível, cabelos ${getHairStyle('masculino', 'gerencial')}, ${getHeight('masculino')}, roupas corporativas modernas, expressão focada e colaborativa.`,
        `Gerente masculino ${age} anos, estilo equilibrado, cabelos ${getHairStyle('masculino', 'gerencial')}, olhos ${getEyeColor()}, vestimenta business professional, presença respeitosa.`
      ],
      'default': [
        `Homem ${age} anos, aparência profissional padrão, cabelos ${getHairStyle('masculino', 'default')}, ${getHeight('masculino')}, roupas corporativas, expressão concentrada e dedicada.`,
        `Profissional masculino ${age} anos, estilo simples e eficiente, cabelos ${getHairStyle('masculino', 'default')}, olhos ${getEyeColor()}, vestimenta corporate casual.`
      ]
    }
  };

  const genderDescriptions = descriptions[gender] || descriptions['masculino'];
  const levelDescriptions = genderDescriptions[seniority] || genderDescriptions['default'];
  
  const hash = hashCode(persona.id + 'desc');
  const index = Math.abs(hash) % levelDescriptions.length;
  
  return levelDescriptions[index];
}

function getHairStyle(gender, seniority) {
  const styles = {
    'feminino': {
      'executivo': ['loiros bem cortados em long bob', 'castanhos escuros em chignon elegante', 'ruivos em ondas controladas'],
      'gerencial': ['castanhos em corte médio moderno', 'loiros em ondas naturais', 'morenos em estilo profissional'],
      'default': ['castanhos em corte prático', 'loiros em estilo simples', 'morenos bem cuidados']
    },
    'masculino': {
      'executivo': ['grisalhos bem aparados', 'castanhos escuros penteados para trás', 'pretos com corte executivo'],
      'gerencial': ['castanhos com corte moderno', 'loiros escuros bem cuidados', 'morenos com estilo profissional'],
      'default': ['castanhos curtos', 'morenos simples e práticos', 'escuros bem aparados']
    }
  };

  const genderStyles = styles[gender] || styles['masculino'];
  const levelStyles = genderStyles[seniority] || genderStyles['default'];
  
  return levelStyles[Math.abs(hashCode(gender + seniority)) % levelStyles.length];
}

function getEyeColor() {
  const colors = ['castanhos expressivos', 'azuis penetrantes', 'verdes intensos', 'avelã marcantes', 'escuros profundos'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getHeight(gender) {
  const heights = {
    'feminino': ['estatura média (1,65m)', 'altura mediana (1,68m)', 'porte elegante (1,62m)'],
    'masculino': ['estatura alta (1,80m)', 'altura média-alta (1,77m)', 'porte imponente (1,83m)']
  };
  
  const genderHeights = heights[gender] || heights['masculino'];
  return genderHeights[Math.floor(Math.random() * genderHeights.length)];
}

function determineGender(persona) {
  const feminineNames = ['ana', 'maria', 'julia', 'camila', 'beatriz', 'carolina', 'fernanda', 'gabriela', 'isabella', 'larissa'];
  const firstName = persona.full_name.split(' ')[0].toLowerCase();
  
  return feminineNames.some(name => firstName.includes(name)) ? 'feminino' : 'masculino';
}

function determineSeniority(role) {
  const executiveKeywords = ['diretor', 'ceo', 'cto', 'cfo', 'presidente', 'vice', 'head', 'chief'];
  const managerialKeywords = ['gerente', 'coordenador', 'lider', 'supervisor', 'manager'];
  
  const roleStr = role.toLowerCase();
  
  if (executiveKeywords.some(keyword => roleStr.includes(keyword))) {
    return 'executivo';
  } else if (managerialKeywords.some(keyword => roleStr.includes(keyword))) {
    return 'gerencial';
  }
  
  return 'default';
}

function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

async function generateAvatares() {
  try {
    // 1. Buscar empresa
    let empresa;
    
    if (targetEmpresaId) {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', targetEmpresaId)
        .single();
      
      if (error) throw new Error(`Empresa não encontrada: ${error.message}`);
      empresa = data;
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data.length) throw new Error('Nenhuma empresa ativa encontrada');
      empresa = data[0];
    }

    console.log(`\n🏢 Processando empresa: ${empresa.nome}`);
    
    // 2. Marcar script como em execução
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          avatares: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Buscar todas as personas da empresa
    const { data: todasPersonas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!todasPersonas.length) {
      console.log('\n⚠️ Nenhuma persona encontrada para esta empresa!');
      return;
    }

    // Filtrar personas que ainda não têm descricao_fisica detalhada
    const personasSemAvatar = todasPersonas.filter(p => 
      !p.descricao_fisica || 
      p.descricao_fisica.length < 100 ||
      !p.descricao_fisica.includes('Avatar:')
    );

    if (!personasSemAvatar.length) {
      console.log('\n✅ Todas as personas já possuem avatares!');
      return;
    }

    console.log(`\n🎭 Gerando avatares para ${personasSemAvatar.length} personas...`);

    // 4. Gerar avatares
    let sucessos = 0;
    let erros = 0;

    for (const persona of personasSemAvatar) {
      const sucesso = await generateAvatarForPersona(persona, empresa);
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
      }
      
      // Pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Atualizar status da empresa
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          avatares: {
            running: false,
            last_result: erros > 0 ? 'partial_success' : 'success',
            last_run: new Date().toISOString()
          }
        }
      })
      .eq('id', empresa.id);

    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE AVATARES');
    console.log('========================');
    console.log(`✅ Avatares gerados com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na geração: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasSemAvatar.length) * 100).toFixed(1)}%`);

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 0 - AVATARES CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 0:', error);
    process.exit(1);
  }
}

generateAvatares();