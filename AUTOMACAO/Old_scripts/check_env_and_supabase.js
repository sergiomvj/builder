#!/usr/bin/env node
/**
 * Lightweight smoke-test for environment + Supabase connectivity.
 * Usage (PowerShell):
 *   cd AUTOMACAO
 *   node check_env_and_supabase.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Try loading common env files (prefer .env.local)
const tryPaths = [
  path.resolve(process.cwd(), '../.env.local'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env')
];

for (const p of tryPaths) {
  // eslint-disable-next-line no-console
  console.log(`Loading env from: ${p}`);
  dotenv.config({ path: p });
}

function missing(vars) {
  return vars.filter(v => !process.env[v]);
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missingVars = missing(required);

if (missingVars.length) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Create .env.local in the project root with these values. Example in repository `.env.local` file.');
  process.exit(2);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('✅ Found Supabase env vars. Attempting to connect...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.from('empresas').select('id,nome').limit(1);
    if (error) {
      console.error('❌ Supabase query error:', error.message || error);
      process.exit(3);
    }

    if (!data || !data.length) {
      console.warn('⚠️ Connected to Supabase but no companies found (table `empresas` empty).');
    } else {
      console.log('✅ Supabase query succeeded. Sample empresa:', data[0]);
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log('ℹ️ GOOGLE_AI_API_KEY is not set. Automation scripts that call Gemini will fail without it.');
    } else {
      console.log('✅ GOOGLE_AI_API_KEY is set. LLM automation can run.');
    }

    console.log('\nAll checks passed. You can now run `npm install; npm run dev` in project root.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error during Supabase check:', err.message || err);
    process.exit(4);
  }
}

run();
