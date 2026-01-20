#!/usr/bin/env node
/**
 * Script para FORÇAR exclusão de empresas DELETED usando Service Role Key
 * Uso: node force_delete_empresas.cjs --apply
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

// Cliente com Service Role Key (bypassa RLS e triggers)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const applyMode = process.argv.includes('--apply')

async function main() {
  console.log('🗑️  VCM - Limpeza Forçada de Empresas DELETED\n')
  console.log('⚠️  Usando SERVICE ROLE KEY (bypassa RLS)\n')
  
  // Buscar empresas DELETED
  const { data: empresas, error: fetchError } = await supabase
    .from('empresas')
    .select('id, nome, created_at')
    .or('nome.like.[DELETED-%],nome.like.[EXCLUÍDA]%]')
    .order('created_at', { ascending: false })
  
  if (fetchError) {
    console.error('❌ Erro ao buscar empresas:', fetchError)
    return
  }
  
  if (!empresas || empresas.length === 0) {
    console.log('✅ Nenhuma empresa DELETED encontrada. Banco limpo!')
    return
  }
  
  console.log(`📋 Encontradas ${empresas.length} empresas para excluir:\n`)
  empresas.forEach((e, i) => {
    console.log(`${i + 1}. ${e.nome}`)
    console.log(`   ID: ${e.id}`)
    console.log(`   Criada: ${new Date(e.created_at).toLocaleString('pt-BR')}\n`)
  })
  
  if (!applyMode) {
    console.log('⚠️  MODO PREVIEW - Nenhuma exclusão será realizada.')
    console.log('💡 Para aplicar, execute: node force_delete_empresas.cjs --apply\n')
    return
  }
  
  console.log('⚠️  APLICANDO EXCLUSÕES...\n')
  
  let sucessos = 0
  let erros = 0
  
  for (const empresa of empresas) {
    console.log(`🗑️  Excluindo: ${empresa.nome}`)
    
    try {
      // 1. Buscar personas
      const { data: personas } = await supabase
        .from('personas')
        .select('id')
        .eq('empresa_id', empresa.id)
      
      const personaIds = personas ? personas.map(p => p.id) : []
      
      // 2. Excluir avatares
      if (personaIds.length > 0) {
        await supabase.from('avatares_personas').delete().in('persona_id', personaIds)
      }
      
      // 3. Excluir audit_logs da empresa
      await supabase.from('audit_logs').delete().eq('empresa_id', empresa.id)
      
      // 4. Excluir personas
      await supabase.from('personas').delete().eq('empresa_id', empresa.id)
      
      // 5. Excluir empresa
      const { error: delError } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresa.id)
      
      if (delError) {
        console.log(`   ❌ Erro: ${delError.message}`)
        erros++
      } else {
        console.log(`   ✅ Excluída com sucesso`)
        sucessos++
      }
      
    } catch (err) {
      console.log(`   ❌ Exceção: ${err.message}`)
      erros++
    }
    
    console.log('')
  }
  
  console.log('═'.repeat(50))
  console.log(`✅ Sucessos: ${sucessos}`)
  console.log(`❌ Erros: ${erros}`)
  console.log(`📊 Total: ${empresas.length}`)
  console.log('═'.repeat(50))
}

main().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
