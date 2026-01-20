#!/usr/bin/env node
/**
 * Wrapper para carregar .env.local antes de executar scripts
 * Uso: node load-env.js script.js --args
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  const lines = envFile.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
  
  console.log('✅ Variáveis de ambiente carregadas de .env.local');
} catch (error) {
  console.error('⚠️ Erro ao carregar .env.local:', error.message);
}

// Executar script fornecido
const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error('❌ Uso: node load-env.js script.js --args');
  process.exit(1);
}

const [scriptPath, ...args] = scriptArgs;

const child = spawn('node', [scriptPath, ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
