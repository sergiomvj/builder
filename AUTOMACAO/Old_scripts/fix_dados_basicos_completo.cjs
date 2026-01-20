// ================================================================================================
// FIX DADOS BÁSICOS COMPLETO - CORREÇÃO URGENTE DE DADOS INCOMPLETOS
// ================================================================================================
// Este script corrige 3 problemas críticos nas personas:
// 1. idiomas: Garantir 5 idiomas (Português, Inglês, Espanhol, Francês, Alemão)
// 2. experiencia_anos: Preencher valores NULL com números realistas (2-15 anos)
// 3. email: Corrigir @example.com para domínio da empresa (@arvabot.com)
// ================================================================================================

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ================================================================================================
// CONFIGURAÇÃO
// ================================================================================================
const IDIOMAS_PADRAO = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão'];

// Mapeamento de cargos para anos de experiência (realista)
const EXPERIENCIA_POR_CARGO = {
  'CEO': { min: 10, max: 15 },
  'CTO': { min: 8, max: 15 },
  'CFO': { min: 8, max: 15 },
  'CMO': { min: 7, max: 12 },
  'COO': { min: 8, max: 14 },
  'Head': { min: 6, max: 10 },
  'Senior': { min: 5, max: 10 },
  'Pleno': { min: 3, max: 7 },
  'Júnior': { min: 1, max: 3 },
  'Especialista': { min: 5, max: 12 },
  'Coordenador': { min: 4, max: 8 },
  'Gerente': { min: 5, max: 10 },
  'Diretor': { min: 8, max: 15 },
  'Analista': { min: 2, max: 6 },
  'Assistente': { min: 1, max: 4 },
  'Estagiário': { min: 0, max: 2 }
};

// ================================================================================================
// FUNÇÕES AUXILIARES
// ================================================================================================

/**
 * Determina anos de experiência baseado no cargo
 */
function determinarExperiencia(cargo) {
  if (!cargo) return getRandomInRange(3, 8); // Padrão: 3-8 anos
  
  const cargoUpper = cargo.toUpperCase();
  
  // Buscar match no mapeamento
  for (const [key, range] of Object.entries(EXPERIENCIA_POR_CARGO)) {
    if (cargoUpper.includes(key.toUpperCase())) {
      return getRandomInRange(range.min, range.max);
    }
  }
  
  // Fallback: 3-8 anos (nível pleno)
  return getRandomInRange(3, 8);
}

/**
 * Gera número aleatório no intervalo
 */
function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Corrige email @example.com para domínio da empresa
 */
function corrigirEmail(emailAtual, dominioEmpresa) {
  if (!emailAtual || !emailAtual.includes('@example.com')) {
    return emailAtual; // Já está correto
  }
  
  const [username] = emailAtual.split('@');
  return `${username}@${dominioEmpresa}`;
}

/**
 * Obtém domínio da empresa (formato: codigo + .com)
 */
async function obterDominioEmpresa(empresaId) {
  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('codigo, dominio')
    .eq('id', empresaId)
    .single();
  
  if (error) {
    console.error('❌ Erro ao buscar empresa:', error.message);
    return 'example.com';
  }
  
  // Usar domínio customizado se existir, senão usar código + .com
  return empresa.dominio || `${empresa.codigo.toLowerCase()}.com`;
}

// ================================================================================================
// FUNÇÃO PRINCIPAL
// ================================================================================================

async function corrigirDadosBasicos() {
  console.log('');
  console.log('='.repeat(80));
  console.log('🔧 FIX DADOS BÁSICOS COMPLETO');
  console.log('='.repeat(80));
  console.log('');
  
  // ========================================
  // BUSCAR EMPRESA E DOMÍNIO
  // ========================================
  
  const empresaId = process.argv.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
  
  if (!empresaId) {
    console.error('❌ ERRO: --empresaId é obrigatório');
    console.log('');
    console.log('Uso: node fix_dados_basicos_completo.cjs --empresaId=UUID');
    console.log('');
    process.exit(1);
  }
  
  console.log(`🏢 Empresa ID: ${empresaId}`);
  
  const dominioEmpresa = await obterDominioEmpresa(empresaId);
  console.log(`📧 Domínio de email: ${dominioEmpresa}`);
  console.log('');
  
  // ========================================
  // BUSCAR PERSONAS
  // ========================================
  
  const { data: personas, error: fetchError } = await supabase
    .from('personas')
    .select('id, full_name, cargo, idiomas, experiencia_anos, email')
    .eq('empresa_id', empresaId)
    .order('full_name');
  
  if (fetchError) {
    console.error('❌ Erro ao buscar personas:', fetchError.message);
    return;
  }
  
  if (!personas || personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada para esta empresa');
    return;
  }
  
  console.log(`📋 ${personas.length} personas encontradas`);
  console.log('');
  console.log('='.repeat(80));
  console.log('INICIANDO CORREÇÕES');
  console.log('='.repeat(80));
  console.log('');
  
  // ========================================
  // PROCESSAR CADA PERSONA
  // ========================================
  
  let stats = {
    idiomasCorrigidos: 0,
    experienciaCorrigida: 0,
    emailCorrigido: 0,
    semAlteracoes: 0,
    erros: 0
  };
  
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    console.log(`[${i + 1}/${personas.length}] ${persona.full_name}`);
    console.log(`   Cargo: ${persona.cargo || 'N/A'}`);
    
    let updates = {};
    let alteracoes = [];
    
    // ---- IDIOMAS ----
    const idiomasAtuais = persona.idiomas || [];
    if (idiomasAtuais.length !== 5 || JSON.stringify(idiomasAtuais) !== JSON.stringify(IDIOMAS_PADRAO)) {
      updates.idiomas = IDIOMAS_PADRAO;
      alteracoes.push(`Idiomas: ${idiomasAtuais.length} → 5`);
      stats.idiomasCorrigidos++;
    }
    
    // ---- EXPERIÊNCIA ----
    if (persona.experiencia_anos === null || persona.experiencia_anos === undefined) {
      const experiencia = determinarExperiencia(persona.cargo);
      updates.experiencia_anos = experiencia;
      alteracoes.push(`Experiência: NULL → ${experiencia} anos`);
      stats.experienciaCorrigida++;
    }
    
    // ---- EMAIL ----
    if (persona.email && persona.email.includes('@example.com')) {
      const emailCorrigido = corrigirEmail(persona.email, dominioEmpresa);
      updates.email = emailCorrigido;
      alteracoes.push(`Email: ${persona.email} → ${emailCorrigido}`);
      stats.emailCorrigido++;
    }
    
    // ---- APLICAR UPDATES ----
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('personas')
        .update(updates)
        .eq('id', persona.id);
      
      if (updateError) {
        console.log(`   ❌ Erro: ${updateError.message}`);
        stats.erros++;
      } else {
        console.log(`   ✅ ${alteracoes.join(' | ')}`);
      }
    } else {
      console.log(`   ✓ Sem alterações necessárias`);
      stats.semAlteracoes++;
    }
    
    console.log('');
  }
  
  // ========================================
  // RESUMO FINAL
  // ========================================
  
  console.log('='.repeat(80));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(80));
  console.log(`✅ Idiomas corrigidos: ${stats.idiomasCorrigidos}`);
  console.log(`✅ Experiências preenchidas: ${stats.experienciaCorrigida}`);
  console.log(`✅ Emails corrigidos: ${stats.emailCorrigido}`);
  console.log(`✓  Sem alterações: ${stats.semAlteracoes}`);
  console.log(`❌ Erros: ${stats.erros}`);
  console.log('='.repeat(80));
  console.log('');
  
  if (stats.erros === 0) {
    console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
  } else {
    console.log('⚠️  CORREÇÃO CONCLUÍDA COM ALGUNS ERROS');
  }
  console.log('');
}

// ================================================================================================
// EXECUÇÃO
// ================================================================================================

corrigirDadosBasicos()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ ERRO FATAL:', err);
    process.exit(1);
  });
