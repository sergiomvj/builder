#!/usr/bin/env node
/**
 * 🧪 TESTE - Gerar avatares de demonstração
 * 
 * Cria registros de teste na tabela avatares_multimedia
 * usando URLs de placeholder (sem gastar em APIs)
 * 
 * Uso: node test_generate_avatares.js --empresaId=UUID
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function parseArgs() {
  const args = process.argv.slice(2);
  let empresaId = null;
  
  args.forEach(arg => {
    if (arg.startsWith('--empresaId=')) {
      empresaId = arg.split('=')[1];
    }
  });
  
  return empresaId;
}

async function buscarPersonas(empresaId) {
  console.log('👥 Buscando personas...');
  
  const { data, error } = await supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', empresaId)
    .limit(5); // Pegar apenas 5 para teste

  if (error) throw error;
  
  console.log(`✅ ${data.length} personas encontradas\n`);
  return data;
}

async function criarAvatarTeste(empresaId, persona, index) {
  console.log(`📸 Criando avatar ${index + 1}: ${persona.full_name}`);
  
  // Usar serviço de placeholder realista
  const seed = persona.id.substring(0, 8);
  const gender = index % 2 === 0 ? 'men' : 'women';
  const photoId = (index % 50) + 1;
  
  // URLs de fotos profissionais de teste
  const placeholderServices = [
    `https://randomuser.me/api/portraits/${gender}/${photoId}.jpg`,
    `https://i.pravatar.cc/400?img=${photoId}`,
    `https://xsgames.co/randomusers/avatar.php?g=${gender}&random=${seed}`
  ];
  
  const fileUrl = placeholderServices[index % 3];
  
  const personasMetadata = [{
    persona_id: persona.id,
    name: persona.full_name,
    role: persona.role,
    position: 'center'
  }];

  const title = `${persona.full_name} - ${persona.role} Professional Portrait`;
  const description = `Professional corporate headshot for ${persona.full_name}, ${persona.role}. High quality business portrait with neutral background.`;

  const { data, error } = await supabase
    .from('avatares_multimedia')
    .insert({
      empresa_id: empresaId,
      avatar_type: 'photo',
      avatar_category: 'profile',
      personas_ids: [persona.id],
      personas_metadata: personasMetadata,
      file_url: fileUrl,
      title: title,
      description: description,
      prompt_used: `professional corporate headshot, ${persona.role}, business attire, neutral background, studio lighting`,
      generation_metadata: {
        service: 'placeholder',
        note: 'Test avatar for demonstration purposes'
      },
      style: 'professional',
      background_type: 'studio',
      lighting_setup: 'studio',
      use_cases: ['website_hero', 'linkedin_profile', 'email_signature'],
      tags: ['test', 'professional', 'corporate'],
      is_public: false,
      is_approved: false,
      status: 'completed',
      generation_service: 'placeholder',
      generation_completed_at: new Date().toISOString(),
      file_format: 'jpg',
      file_dimensions: { width: 400, height: 400 }
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Erro ao criar avatar: ${error.message}`);
    return null;
  }

  console.log(`✅ Avatar criado: ${data.id}`);
  return data;
}

async function criarAvatarEquipe(empresaId, personas) {
  console.log(`\n👥 Criando foto de equipe com ${personas.length} personas`);
  
  const personasIds = personas.map(p => p.id);
  const personasMetadata = personas.map((p, idx) => ({
    persona_id: p.id,
    name: p.full_name,
    role: p.role,
    position: idx === 0 ? 'center' : (idx % 2 === 0 ? 'left' : 'right')
  }));

  const title = `Executive Team - ${personas.map(p => p.role).slice(0, 3).join(', ')}`;
  const description = `Professional team photo featuring ${personas.length} executives from the leadership team.`;
  
  // Usar placeholder de grupo
  const fileUrl = `https://picsum.photos/seed/${empresaId}/1200/800`;

  const { data, error } = await supabase
    .from('avatares_multimedia')
    .insert({
      empresa_id: empresaId,
      avatar_type: 'photo',
      avatar_category: 'team',
      personas_ids: personasIds,
      personas_metadata: personasMetadata,
      file_url: fileUrl,
      title: title,
      description: description,
      prompt_used: `professional corporate team photo, group of ${personas.length} executives, business attire, modern office background`,
      generation_metadata: {
        service: 'placeholder',
        note: 'Test team photo for demonstration'
      },
      style: 'professional',
      background_type: 'office',
      lighting_setup: 'studio',
      use_cases: ['website_about', 'team_page', 'press_kit'],
      tags: ['test', 'team', 'executive', 'group'],
      is_public: false,
      is_approved: false,
      status: 'completed',
      generation_service: 'placeholder',
      generation_completed_at: new Date().toISOString(),
      file_format: 'jpg',
      file_dimensions: { width: 1200, height: 800 }
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Erro ao criar avatar de equipe: ${error.message}`);
    return null;
  }

  console.log(`✅ Avatar de equipe criado: ${data.id}`);
  return data;
}

async function verificarAvatares(empresaId) {
  console.log('\n📊 Verificando avatares criados...\n');
  
  const { data, error } = await supabase
    .from('avatares_multimedia')
    .select('*')
    .eq('empresa_id', empresaId);

  if (error) throw error;

  console.log('='.repeat(60));
  console.log(`Total de avatares: ${data.length}`);
  console.log('='.repeat(60));
  
  data.forEach((avatar, idx) => {
    console.log(`\n${idx + 1}. ${avatar.title}`);
    console.log(`   Tipo: ${avatar.avatar_type} | Categoria: ${avatar.avatar_category}`);
    console.log(`   Personas: ${avatar.personas_ids.length}`);
    console.log(`   URL: ${avatar.file_url}`);
    console.log(`   Status: ${avatar.status}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🧪 TESTE - GERADOR DE AVATARES MULTIMEDIA');
  console.log('='.repeat(60));
  
  const empresaId = parseArgs();
  
  if (!empresaId) {
    console.error('❌ Use: node test_generate_avatares.js --empresaId=UUID');
    process.exit(1);
  }

  try {
    // Buscar personas
    const personas = await buscarPersonas(empresaId);
    
    if (personas.length === 0) {
      console.log('⚠️ Nenhuma persona encontrada');
      return;
    }

    // Criar 3 avatares individuais
    console.log('\n📸 CRIANDO AVATARES INDIVIDUAIS');
    console.log('='.repeat(60));
    
    const avatarsIndividuais = [];
    for (let i = 0; i < Math.min(3, personas.length); i++) {
      const avatar = await criarAvatarTeste(empresaId, personas[i], i);
      if (avatar) avatarsIndividuais.push(avatar);
      
      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Criar 1 avatar de equipe
    console.log('\n👥 CRIANDO AVATAR DE EQUIPE');
    console.log('='.repeat(60));
    
    const avatarEquipe = await criarAvatarEquipe(empresaId, personas.slice(0, Math.min(3, personas.length)));

    // Verificar resultado
    await verificarAvatares(empresaId);

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('1. Acesse o Supabase para ver os registros');
    console.log('2. Teste as queries SQL do schema');
    console.log('3. Quando pronto, use o script real com Fal.ai/DALL-E');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
