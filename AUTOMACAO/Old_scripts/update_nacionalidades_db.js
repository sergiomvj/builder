#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { normalizeNationality } = require('./lib/normalizeNationality');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: variáveis de ambiente Supabase não encontradas.');
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SERVICE_ROLE) em .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchEmpresasMap() {
  const { data, error } = await supabase.from('empresas').select('id,pais').limit(1000);
  if (error) throw error;
  const map = {};
  for (const e of data) map[e.id] = e.pais;
  return map;
}

async function fetchPersonas(empresaId) {
  let q = supabase.from('personas').select('id,full_name,empresa_id,nacionalidade').eq('status','active');
  if (empresaId) q = q.eq('empresa_id', empresaId);
  const { data, error } = await q.limit(5000);
  if (error) throw error;
  return data || [];
}

function usage() {
  console.log('Uso: node update_nacionalidades_db.js [--empresaId UUID] [--apply] [--limit N]');
  console.log('--apply    : aplica as mudanças no banco (por padrão é modo preview)');
  console.log('--empresaId: filtra personas por empresa');
  console.log('--limit    : limita o número de updates aplicados (útil para testes)');
}

async function main() {
  const args = process.argv.slice(2);
  let empresaId = null;
  let apply = false;
  let limit = Infinity;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--empresaId') { empresaId = args[i+1]; i++; }
    if (a === '--apply') apply = true;
    if (a === '--limit') { limit = parseInt(args[i+1],10)||Infinity; i++; }
    if (a === '--help' || a === '-h') { usage(); process.exit(0); }
  }

  console.log('🔎 Carregando dados do Supabase...');
  const empresasMap = await fetchEmpresasMap();
  const personas = await fetchPersonas(empresaId);

  console.log(`👥 Personas carregadas: ${personas.length}`);

  const changes = [];
  for (const p of personas) {
    const country = empresasMap[p.empresa_id] || null;
    const original = p.nacionalidade || '';
    const normalized = normalizeNationality(original, country);
    if ((normalized || '') !== (original || '')) {
      changes.push({ id: p.id, full_name: p.full_name, original, normalized });
    }
  }

  if (changes.length === 0) {
    console.log('✅ Nenhuma nacionalidade a ajustar.');
    process.exit(0);
  }

  console.log(`⚠️ Encontradas ${changes.length} personas com nacionalidade a ajustar.`);
  console.log('Amostra (primeiros 20):');
  changes.slice(0,20).forEach(c => console.log(`- ${c.full_name} (${c.id}): "${c.original}" -> "${c.normalized}"`));

  if (!apply) {
    console.log('\nModo PREVIEW — nenhuma alteração será enviada ao banco.');
    console.log('Se desejar aplicar as alterações, rode com a flag --apply');
    process.exit(0);
  }

  console.log('\n🚀 Aplicando alterações no banco...');
  let applied = 0;
  for (const c of changes) {
    if (applied >= limit) break;
    const { data, error } = await supabase.from('personas').update({ nacionalidade: c.normalized, updated_at: new Date().toISOString() }).eq('id', c.id);
    if (error) {
      console.warn(`⚠️ Falha ao atualizar ${c.id} - ${c.full_name}: ${error.message}`);
    } else {
      applied++;
      console.log(`✔️ Atualizado ${c.full_name} (${c.id}): "${c.original}" -> "${c.normalized}"`);
    }
    // small delay to avoid burst
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n🎉 Atualizações aplicadas: ${applied}/${changes.length}`);
}

if (require.main === module) {
  main().catch(err => { console.error('Erro:', err.message || err); process.exit(1); });
}

module.exports = { main };
