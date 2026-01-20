#!/usr/bin/env node
/**
 * Script para excluir uma empresa e todas as suas personas
 * Uso: node delete_empresa.js [--empresaId=ID] [--nome="Nome Parcial"] [--apply]
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse argumentos CLI
const args = process.argv.slice(2)
let empresaId = null
let nomeEmpresa = null
let applyMode = false

args.forEach(arg => {
  if (arg.startsWith('--empresaId=')) {
    empresaId = arg.split('=')[1]
  } else if (arg.startsWith('--nome=')) {
    nomeEmpresa = arg.split('=')[1].replace(/['"]/g, '')
  } else if (arg === '--apply') {
    applyMode = true
  }
})

async function listarEmpresas() {
  console.log('\n📋 Listando empresas disponíveis:\n')
  
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, nome, pais, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Erro ao listar empresas:', error)
    return []
  }
  
  if (!empresas || empresas.length === 0) {
    console.log('⚠️  Nenhuma empresa encontrada.')
    return []
  }
  
  empresas.forEach((e, index) => {
    console.log(`${index + 1}. ${e.nome}`)
    console.log(`   ID: ${e.id}`)
    console.log(`   País: ${e.pais}`)
    console.log(`   Criada em: ${new Date(e.created_at).toLocaleString('pt-BR')}`)
    console.log('')
  })
  
  return empresas
}

async function buscarEmpresa(id, nome) {
  let query = supabase.from('empresas').select('*')
  
  if (id) {
    query = query.eq('id', id)
  } else if (nome) {
    query = query.ilike('nome', `%${nome}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('❌ Erro ao buscar empresa:', error)
    return null
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  Empresa não encontrada.')
    return null
  }
  
  if (data.length > 1) {
    console.log('⚠️  Múltiplas empresas encontradas:')
    data.forEach(e => console.log(`   - ${e.nome} (${e.id})`))
    console.log('\n💡 Use --empresaId=ID para especificar qual excluir.')
    return null
  }
  
  return data[0]
}

async function contarPersonas(empresaId) {
  const { count, error } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
  
  if (error) {
    console.error('❌ Erro ao contar personas:', error)
    return 0
  }
  
  return count || 0
}

async function excluirEmpresa(empresa, apply) {
  console.log('\n🎯 Empresa selecionada:')
  console.log(`   Nome: ${empresa.nome}`)
  console.log(`   ID: ${empresa.id}`)
  console.log(`   País: ${empresa.pais}`)
  console.log('')
  
  const personasCount = await contarPersonas(empresa.id)
  console.log(`   📊 Total de personas: ${personasCount}`)
  console.log('')
  
  if (!apply) {
    console.log('⚠️  MODO PREVIEW - Nenhuma exclusão será realizada.')
    console.log('')
    console.log('📝 O que será excluído:')
    console.log(`   - 1 empresa: ${empresa.nome}`)
    console.log(`   - ${personasCount} personas associadas`)
    console.log(`   - Todos os dados relacionados (avatares, biografias, etc.)`)
    console.log('')
    console.log('💡 Para aplicar a exclusão, execute:')
    console.log(`   node delete_empresa.js --empresaId=${empresa.id} --apply`)
    console.log('')
    return
  }
  
  console.log('⚠️  ATENÇÃO: Esta ação é IRREVERSÍVEL!')
  console.log('🗑️  Excluindo empresa e dados associados...')
  console.log('')
  
  // 1. Buscar IDs das personas
  const { data: personasData } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresa.id)
  
  const personaIds = personasData ? personasData.map(p => p.id) : []
  
  // 2. Excluir avatares_personas
  if (personaIds.length > 0) {
    const { error: avatarError } = await supabase
      .from('avatares_personas')
      .delete()
      .in('persona_id', personaIds)
    
    if (avatarError && avatarError.code !== '42P01') {
      console.log('⚠️  Aviso ao excluir avatares:', avatarError.message)
    } else {
      console.log('✅ Avatares excluídos')
    }
  }
  
  // 3. Excluir audit_logs (se existir)
  const { error: auditError } = await supabase
    .from('audit_logs')
    .delete()
    .eq('empresa_id', empresa.id)
  
  if (auditError && auditError.code !== '42P01') {
    console.log('⚠️  Aviso ao excluir audit_logs:', auditError.message)
  } else {
    console.log('✅ Audit logs excluídos')
  }
  
  // 4. Excluir personas
  const { error: personasError } = await supabase
    .from('personas')
    .delete()
    .eq('empresa_id', empresa.id)
  
  if (personasError) {
    console.error('❌ Erro ao excluir personas:', personasError.message)
    return
  }
  console.log(`✅ ${personasCount} personas excluídas`)
  
  // 5. Excluir empresa
  const { error: empresaError } = await supabase
    .from('empresas')
    .delete()
    .eq('id', empresa.id)
  
  if (empresaError) {
    console.error('❌ Erro ao excluir empresa:', empresaError.message)
    console.error('   Detalhes:', empresaError)
    return
  }
  console.log('✅ Empresa excluída')
  
  console.log('')
  console.log('🎉 Exclusão concluída com sucesso!')
  console.log('')
}

async function main() {
  console.log('🗑️  VCM - Exclusão de Empresa\n')
  
  if (!empresaId && !nomeEmpresa) {
    await listarEmpresas()
    console.log('💡 Uso:')
    console.log('   node delete_empresa.js --empresaId=ID --apply')
    console.log('   node delete_empresa.js --nome="Nome" --apply')
    console.log('')
    return
  }
  
  const empresa = await buscarEmpresa(empresaId, nomeEmpresa)
  
  if (!empresa) {
    return
  }
  
  await excluirEmpresa(empresa, applyMode)
}

main().catch(console.error)
