#!/usr/bin/env node
/**
 * Script para criar tabela avatares_multimedia no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTable() {
  console.log('📊 Criando tabela avatares_multimedia...');
  
  const sql = await fs.readFile('../.github/database/workplace_scenes_schema.sql', 'utf-8');
  
  // Executar via SQL direto seria necessário usar service_role key
  // Por enquanto, vamos instruir o usuário
  
  console.log('\n✅ Para criar as tabelas, execute o SQL no Supabase:');
  console.log('1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor');
  console.log('2. Vá em "SQL Editor"');
  console.log('3. Cole o conteúdo de: .github/database/workplace_scenes_schema.sql');
  console.log('4. Clique em "Run"');
  console.log('\nOu execute este comando SQL direto:\n');
  
  // Extrair apenas a parte de avatares_multimedia
  const avatarTableSQL = sql.split('-- =====================================================')[1];
  console.log(avatarTableSQL.substring(0, 500) + '...\n');
}

createTable();
