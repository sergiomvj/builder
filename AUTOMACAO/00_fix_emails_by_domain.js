// ============================================================================
// SCRIPT 00 - CORREÇÃO DE EMAILS POR DOMÍNIO DA EMPRESA
// ============================================================================
// USO: Executar quando o usuário alterar o domínio da empresa
// 
// Este script:
// 1. Busca empresa pelo ID
// 2. Obtém o domínio real configurado
// 3. Atualiza TODOS os emails das personas para usar o domínio correto
// 4. Mantém a estrutura: primeironome.ultimonome@dominio.com
// 5. Garante emails únicos (adiciona números se necessário)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { setupConsoleEncoding } from './lib/console_fix.js';

dotenv.config({ path: '../.env.local' });

// Corrigir encoding UTF-8 no Windows PowerShell
setupConsoleEncoding();

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse argumentos da linha de comando
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
const targetEmpresaId = empresaIdArg ? empresaIdArg.split('=')[1] : null;

if (!targetEmpresaId) {
  console.error('❌ Uso: node 00_fix_emails_by_domain.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Normaliza string removendo acentos e caracteres especiais
 */
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extrai primeiro e último nome do full_name
 */
function extractEmailParts(fullName) {
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return {
      firstName: slugify(nameParts[0]),
      lastName: slugify(nameParts[0])
    };
  }
  
  const firstName = slugify(nameParts[0]);
  const lastName = slugify(nameParts[nameParts.length - 1]);
  
  return { firstName, lastName };
}

/**
 * Gera email único baseado no nome e domínio
 */
async function generateUniqueEmail(fullName, dominio, empresaId, excludeId = null) {
  const { firstName, lastName } = extractEmailParts(fullName);
  let email = `${firstName}.${lastName}@${dominio}`;
  let counter = 1;
  
  // Verificar se email já existe (para outra persona da mesma empresa)
  while (true) {
    const query = supabase
      .from('personas')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('email', email);
    
    // Excluir a própria persona se for atualização
    if (excludeId) {
      query.neq('id', excludeId);
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code === 'PGRST116') {
      // Email não existe, pode usar
      break;
    }
    
    if (!error && data) {
      // Email já existe, tentar próximo
      email = `${firstName}.${lastName}${counter}@${dominio}`;
      counter++;
      
      if (counter > 100) {
        // Fallback: usar timestamp
        email = `${firstName}.${lastName}.${Date.now()}@${dominio}`;
        break;
      }
    } else {
      break;
    }
  }
  
  return email;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function fixEmailsByDomain() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📧 CORREÇÃO DE EMAILS POR DOMÍNIO');
    console.log('='.repeat(60));
    console.log('⚠️  Este script atualiza emails de TODAS as personas');
    console.log('   para usar o domínio configurado na empresa.');
    console.log('='.repeat(60) + '\n');

    // 1. Buscar empresa
    console.log('1️⃣ Buscando empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();
    
    if (empresaError) {
      console.error('❌ Empresa não encontrada:', empresaError.message);
      process.exit(1);
    }
    
    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`   Código: ${empresa.codigo}`);
    
    // 2. Obter domínio correto
    let dominio = empresa.dominio;
    
    if (!dominio || dominio.trim() === '') {
      // Se não tiver domínio configurado, usar código da empresa
      dominio = `${slugify(empresa.codigo)}.com`;
      console.log(`⚠️  Domínio não configurado. Usando: ${dominio}`);
      
      // Atualizar empresa com domínio gerado
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ dominio: dominio })
        .eq('id', empresa.id);
      
      if (updateError) {
        console.error('⚠️  Erro ao salvar domínio na empresa:', updateError.message);
      }
    } else {
      // Limpar domínio (remover https://, http://, trailing slashes)
      dominio = dominio
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .trim();
      
      console.log(`✅ Domínio configurado: ${dominio}`);
    }
    
    console.log('');

    // 3. Buscar todas as personas da empresa
    console.log('2️⃣ Buscando personas...\n');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('role', { ascending: true });
    
    if (personasError) {
      console.error('❌ Erro ao buscar personas:', personasError.message);
      process.exit(1);
    }
    
    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada para esta empresa.');
      process.exit(0);
    }
    
    console.log(`📊 ${personas.length} personas encontradas\n`);

    // 4. Atualizar emails
    console.log('3️⃣ Atualizando emails...\n');
    
    let sucessos = 0;
    let erros = 0;
    let semNome = 0;
    const emailsAtualizados = [];
    
    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      
      console.log(`[${i + 1}/${personas.length}] ${persona.role || 'Sem cargo'}...`);
      
      // Verificar se persona tem nome
      if (!persona.full_name || persona.full_name.trim() === '') {
        console.log(`   ⚠️  Persona sem nome. Email não pode ser gerado.`);
        console.log(`   📧 Email atual: ${persona.email || 'N/A'}`);
        semNome++;
        continue;
      }
      
      try {
        // Gerar novo email
        const oldEmail = persona.email;
        const newEmail = await generateUniqueEmail(
          persona.full_name,
          dominio,
          empresa.id,
          persona.id
        );
        
        // Verificar se email mudou
        if (oldEmail === newEmail) {
          console.log(`   ✅ Email já correto: ${newEmail}`);
          sucessos++;
          continue;
        }
        
        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('personas')
          .update({ email: newEmail })
          .eq('id', persona.id);
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
          erros++;
          continue;
        }
        
        console.log(`   📧 Antigo: ${oldEmail || 'N/A'}`);
        console.log(`   📧 Novo:   ${newEmail}`);
        console.log(`   ✅ Atualizado!`);
        
        emailsAtualizados.push({
          role: persona.role,
          name: persona.full_name,
          oldEmail,
          newEmail
        });
        
        sucessos++;
        
      } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        erros++;
      }
    }
    
    // 5. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Emails atualizados: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`⚠️  Sem nome (não processados): ${semNome}`);
    console.log('='.repeat(60));
    
    if (emailsAtualizados.length > 0) {
      console.log('\n📋 ALTERAÇÕES REALIZADAS:\n');
      emailsAtualizados.forEach(({ role, name, oldEmail, newEmail }) => {
        console.log(`   ${role}`);
        console.log(`   Nome: ${name}`);
        console.log(`   ${oldEmail || 'sem email'} → ${newEmail}`);
        console.log('');
      });
    }
    
    if (sucessos > 0) {
      console.log('🎉 CORREÇÃO DE EMAILS CONCLUÍDA COM SUCESSO!\n');
      console.log('📝 IMPORTANTE:');
      console.log(`   Todas as personas agora usam: @${dominio}`);
      console.log('   Execute os scripts 03-09 novamente se necessário.\n');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

fixEmailsByDomain();
