// SCRIPT PARA CORRIGIR DOMÍNIO PARA arvabot.com
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CORREÇÃO DOMÍNIO PARA arvabot.com');
console.log('==================================');

async function fixDominioArvabot() {
  try {
    // 1. Buscar todas as personas da ARVA Tech
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, full_name, email, empresas!inner(codigo, nome)')
      .eq('empresas.codigo', 'ARVATE49');

    if (error) {
      console.error('❌ Erro ao buscar personas:', error);
      return;
    }

    if (!personas || personas.length === 0) {
      console.log('⚠️ Nenhuma persona da ARVA Tech encontrada');
      return;
    }

    console.log(`📊 ${personas.length} personas encontradas da ARVA Tech`);

    let corrigidas = 0;
    const emailsUsados = new Set();

    // 2. Corrigir emails para usar arvabot.com
    for (const persona of personas) {
      const nomeParaEmail = persona.full_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
        .replace(/[^a-z\\s]/g, '') // Remove caracteres especiais
        .split(' ')
        .filter(part => part.length > 0);

      let novoEmail;
      let contador = 0;

      // Gerar email único
      do {
        if (nomeParaEmail.length >= 2) {
          const sufixo = contador > 0 ? contador.toString() : '';
          novoEmail = `${nomeParaEmail[0]}.${nomeParaEmail[nomeParaEmail.length - 1]}${sufixo}@arvabot.com`;
        } else {
          const sufixo = contador > 0 ? contador.toString() : '';
          novoEmail = `${nomeParaEmail[0]}${sufixo}@arvabot.com`;
        }
        contador++;
      } while (emailsUsados.has(novoEmail) && contador < 100);

      emailsUsados.add(novoEmail);

      // Atualizar apenas se necessário
      if (persona.email !== novoEmail) {
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            email: novoEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', persona.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${persona.full_name}:`, updateError);
        } else {
          console.log(`✅ ${persona.full_name}: ${persona.email} → ${novoEmail}`);
          corrigidas++;
        }
      } else {
        console.log(`⏭️ ${persona.full_name}: já com domínio correto`);
      }
    }

    console.log(`\\n🎉 ${corrigidas} emails corrigidos para @arvabot.com`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixDominioArvabot();