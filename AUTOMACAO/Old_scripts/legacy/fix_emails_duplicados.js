// SCRIPT PARA CORRIGIR EMAILS DUPLICADOS
// Versão melhorada que adiciona números para evitar duplicatas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CORREÇÃO DE EMAILS DUPLICADOS');
console.log('================================');

async function fixDuplicateEmails() {
  try {
    // 1. Buscar personas com emails problemáticos
    const { data: personas, error } = await supabase
      .from('personas')
      .select(`
        id, 
        full_name, 
        email, 
        role,
        empresas!inner(codigo, nome)
      `)
      .like('email', '%@arvatechso.com');

    if (error) {
      console.error('❌ Erro ao buscar personas:', error);
      return;
    }

    if (!personas || personas.length === 0) {
      console.log('✅ Nenhuma persona com email problemático encontrada');
      return;
    }

    console.log(`📊 ${personas.length} persona(s) com emails para corrigir`);

    // 2. Agrupar por empresa
    const empresaMap = new Map();
    personas.forEach(persona => {
      const empresaId = persona.empresas.codigo;
      if (!empresaMap.has(empresaId)) {
        empresaMap.set(empresaId, {
          codigo: persona.empresas.codigo,
          nome: persona.empresas.nome,
          personas: []
        });
      }
      empresaMap.get(empresaId).personas.push(persona);
    });

    // 3. Processar cada empresa
    for (const [_, empresa] of empresaMap) {
      console.log(`\\n🏢 ${empresa.nome} (${empresa.codigo})`);
      const dominioCorreto = `${empresa.codigo.toLowerCase()}.com`;
      
      const emailsUsados = new Set();
      let corrigidas = 0;

      for (const persona of empresa.personas) {
        // Gerar email único
        const nomeBase = persona.full_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
          .replace(/[^a-z\\s]/g, '') // Remove caracteres especiais
          .split(' ')
          .filter(part => part.length > 0);

        let novoEmail;
        let contador = 0;

        do {
          if (nomeBase.length >= 2) {
            const sufixo = contador > 0 ? contador.toString() : '';
            novoEmail = `${nomeBase[0]}.${nomeBase[nomeBase.length - 1]}${sufixo}@${dominioCorreto}`;
          } else {
            const sufixo = contador > 0 ? contador.toString() : '';
            novoEmail = `${nomeBase[0]}${sufixo}@${dominioCorreto}`;
          }
          contador++;
        } while (emailsUsados.has(novoEmail) && contador < 100);

        emailsUsados.add(novoEmail);

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            email: novoEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', persona.id);

        if (updateError) {
          console.error(`   ❌ ${persona.full_name}:`, updateError.message);
        } else {
          console.log(`   ✅ ${persona.full_name}: ${novoEmail}`);
          corrigidas++;
        }
      }

      console.log(`   📊 ${corrigidas}/${empresa.personas.length} corrigida(s)`);
    }

    console.log('\\n🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixDuplicateEmails();