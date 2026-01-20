// SCRIPT PARA CORRIGIR EMAILS DAS PERSONAS EXISTENTES
// Atualiza emails para usar o domínio correto da empresa (baseado no código)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '../.env' });

// Credenciais REAIS (mesma aplicação web)
const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CORREÇÃO DE EMAILS - DOMÍNIO DA EMPRESA');
console.log('==========================================');

async function fixEmailDomains() {
  try {
    // 1. Buscar todas as empresas ativas com suas personas
    console.log('1️⃣ Buscando empresas e personas...');
    
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select(`
        id,
        nome,
        codigo,
        personas(id, full_name, email, role)
      `)
      .eq('status', 'ativa');

    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return;
    }

    if (!empresas || empresas.length === 0) {
      console.log('⚠️ Nenhuma empresa ativa encontrada');
      return;
    }

    console.log(`📊 ${empresas.length} empresa(s) encontrada(s)`);

    // 2. Processar cada empresa
    for (const empresa of empresas) {
      console.log(`\\n🏢 Processando: ${empresa.nome} (${empresa.codigo})`);
      
      if (!empresa.personas || empresa.personas.length === 0) {
        console.log('   ⚠️ Nenhuma persona encontrada');
        continue;
      }

      const dominioCorreto = `${empresa.codigo.toLowerCase()}.com`;
      console.log(`   📧 Domínio correto: ${dominioCorreto}`);

      let personasCorrigidas = 0;
      
      // 3. Processar cada persona da empresa
      for (const persona of empresa.personas) {
        if (!persona.email) {
          console.log(`   ⚠️ ${persona.full_name}: sem email`);
          continue;
        }

        // Verificar se o email já está correto
        if (persona.email.includes(dominioCorreto)) {
          console.log(`   ✅ ${persona.full_name}: email já correto (${persona.email})`);
          continue;
        }

        // Gerar novo email baseado no nome e domínio correto
        const nomeParaEmail = persona.full_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
          .replace(/[^a-z\\s]/g, '') // Remove caracteres especiais
          .split(' ')
          .filter(part => part.length > 0);

        let novoEmail;
        if (nomeParaEmail.length >= 2) {
          // Formato: primeiro.ultimo@dominio.com
          novoEmail = `${nomeParaEmail[0]}.${nomeParaEmail[nomeParaEmail.length - 1]}@${dominioCorreto}`;
        } else {
          // Fallback: nome completo sem espaços
          novoEmail = `${nomeParaEmail[0]}@${dominioCorreto}`;
        }

        // 4. Atualizar email no banco
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            email: novoEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', persona.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar ${persona.full_name}:`, updateError);
          continue;
        }

        console.log(`   🔄 ${persona.full_name}: ${persona.email} → ${novoEmail}`);
        personasCorrigidas++;
      }

      console.log(`   ✅ ${personasCorrigidas} persona(s) corrigida(s)`);
    }

    console.log('\\n🎉 Correção de emails concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
fixEmailDomains();