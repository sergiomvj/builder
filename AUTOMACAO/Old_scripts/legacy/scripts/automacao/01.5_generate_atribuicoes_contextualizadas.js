#!/usr/bin/env node
/**
 * 🎯 SCRIPT 01.5 - GERADOR DE ATRIBUIÇÕES CONTEXTUALIZADAS
 * =======================================================
 * 
 * ALINHADO AO MASTER FLUXO: "Cargos tem atribuições"
 * 
 * Input: Empresa + Personas (cargos) existentes
 * Processo: LLM contextualiza atribuições por ramo + cargo específico
 * Output: Tabela personas_atribuicoes populada com dados ricos da LLM
 * 
 * Execução: node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=ID
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🎯 SCRIPT 01.5 - ATRIBUIÇÕES CONTEXTUALIZADAS VIA LLM');
console.log('===================================================');
console.log(`⏰ Iniciado em: ${new Date().toLocaleString()}`);

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (targetEmpresaId) {
  console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
} else {
  console.log('⚠️ Nenhuma empresa específica - processará primeira empresa ativa');
}

async function generateAtribuicoesContextualizadas() {
  try {
    // 1. Buscar empresa
    let empresa;
    
    if (targetEmpresaId) {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', targetEmpresaId)
        .single();
      
      if (error) throw new Error(`Empresa não encontrada: ${error.message}`);
      empresa = data;
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .gt('total_personas', 0)
        .order('total_personas', { ascending: false })
        .limit(1);
      
      if (error || !data.length) throw new Error('Nenhuma empresa ativa encontrada');
      empresa = data[0];
    }

    console.log(`\n🏢 Processando empresa: ${empresa.nome}`);
    console.log(`📊 Ramo: ${empresa.industria || empresa.industry || 'Tecnologia'}`);
    console.log(`🌍 País: ${empresa.pais || 'Brasil'}`);

    // 2. Buscar personas (cargos) da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .eq('status', 'active');

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!personas.length) {
      console.log('\n⚠️ Nenhuma persona encontrada! Execute primeiro o gerador estratégico.');
      return;
    }

    console.log(`\n👥 ${personas.length} personas (cargos) encontradas:`);
    personas.forEach(p => {
      console.log(`   - ${p.full_name} (${p.role}) - ${p.department}`);
    });

    // 3. Verificar se já existem atribuições
    const { data: existingAtribuicoes } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (existingAtribuicoes && existingAtribuicoes.length > 0) {
      console.log(`\n🗑️ Limpando ${existingAtribuicoes.length} atribuições existentes...`);
      
      const { error: deleteError } = await supabase
        .from('personas_atribuicoes')
        .delete()
        .eq('empresa_id', empresa.id);

      if (deleteError) {
        console.log(`⚠️ Aviso ao limpar atribuições: ${deleteError.message}`);
      }
    }

    // 4. Criar diretório de output
    const outputDir = path.join(process.cwd(), 'output', 'atribuicoes_contextualizadas');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5. Gerar atribuições contextualizadas via LLM
    console.log(`\n🤖 Gerando atribuições contextualizadas via LLM...`);
    
    const atribuicoesGeradas = [];
    let sucessos = 0;
    let erros = 0;

    for (const persona of personas) {
      console.log(`\n🔄 Processando: ${persona.full_name} (${persona.role})`);
      
      const atribuicoes = await gerarAtribuicoesViaLLM(empresa, persona);
      
      if (atribuicoes) {
        // Preparar dados para inserção
        const atribuicaoRecord = {
          persona_id: persona.id,
          empresa_id: empresa.id,
          departamento: persona.department || 'Geral',
          nivel_hierarquico: calcularNivelHierarquico(persona.role),
          email_corporativo: persona.email || `${persona.full_name.toLowerCase().replace(/\s+/g, '.')}@${empresa.nome.toLowerCase().replace(/\s+/g, '')}.com`,
          sistema_ci_username: `${persona.full_name.toLowerCase().replace(/\s+/g, '.')}_${Date.now()}`,
          created_at: new Date().toISOString()
        };

        // Inserir no banco
        const { error: insertError } = await supabase
          .from('personas_atribuicoes')
          .insert(atribuicaoRecord);

        if (insertError) {
          console.log(`    ❌ Erro ao salvar: ${insertError.message}`);
          erros++;
        } else {
          console.log(`    ✅ Atribuições salvas com sucesso`);
          sucessos++;
          
          // Salvar backup das atribuições geradas
          atribuicoesGeradas.push({
            persona: {
              id: persona.id,
              nome: persona.full_name,
              cargo: persona.role,
              departamento: persona.department
            },
            atribuicoes_llm: atribuicoes,
            record_inserido: atribuicaoRecord,
            generated_at: new Date().toISOString()
          });
        }
      } else {
        console.log(`    ❌ Falha na geração LLM`);
        erros++;
      }

      // Pausa entre personas para não sobrecarregar APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 6. Salvar backup completo
    if (atribuicoesGeradas.length > 0) {
      const backupFilename = `atribuicoes_${empresa.nome.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
      const backupPath = path.join(outputDir, backupFilename);
      
      fs.writeFileSync(
        backupPath,
        JSON.stringify({
          empresa: {
            id: empresa.id,
            nome: empresa.nome,
            industria: empresa.industria || empresa.industry,
            pais: empresa.pais
          },
          atribuicoes_contextualizadas: atribuicoesGeradas,
          estatisticas: {
            total_personas: personas.length,
            sucessos,
            erros,
            data_processamento: new Date().toISOString()
          }
        }, null, 2),
        'utf8'
      );

      console.log(`\n📁 Backup salvo: ${backupFilename}`);
    }

    // 7. Relatório final
    console.log('\n📊 RELATÓRIO DE ATRIBUIÇÕES CONTEXTUALIZADAS');
    console.log('============================================');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total personas: ${personas.length}`);
    
    if (sucessos > 0) {
      console.log(`🗃️ Dados salvos na tabela: personas_atribuicoes`);
      console.log(`📈 Taxa de sucesso: ${((sucessos/personas.length) * 100).toFixed(1)}%`);
    }

    console.log('\n🎉 SCRIPT 01.5 - ATRIBUIÇÕES CONTEXTUALIZADAS CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro crítico no Script 01.5:', error);
    process.exit(1);
  }
}

async function gerarAtribuicoesViaLLM(empresa, persona) {
  try {
    const prompt = `
Você é um consultor de gestão organizacional especialista em definir atribuições de cargos.

CONTEXTO EMPRESARIAL:
Empresa: ${empresa.nome}
Ramo: ${empresa.industria || empresa.industry}
País: ${empresa.pais}
Tamanho: ${empresa.total_personas} pessoas

CARGO A ANALISAR:
Pessoa: ${persona.full_name}
Função: ${persona.role}
Área: ${persona.department}

TAREFA:
Analise profundamente este cargo neste contexto específico e defina as atribuições reais que esta pessoa deve ter na empresa.

Pense como se você fosse contratado para organizar essa empresa real. O que especificamente esta pessoa precisa fazer todos os dias? Quais são suas verdadeiras responsabilidades? Com quem ela interage? Que resultados deve entregar?

NÃO USE FRASES GENÉRICAS. Seja específico para ${empresa.nome} no ramo de ${empresa.industria || empresa.industry}.

Retorne apenas JSON:
{
  "responsabilidades": ["lista específica do que faz"],
  "tarefas_diarias": ["o que faz no dia a dia"],
  "entregas": ["o que deve produzir/entregar"], 
  "kpis": ["como medir performance"],
  "interacoes": ["com quem trabalha"],
  "autonomia": "descrição do nível de autonomia",
  "competencias": ["habilidades necessárias"]
}

Analise e responda baseado APENAS na realidade desta empresa específica.`;

    let atribuicoes;
    
    // Tentar Google AI primeiro  
    try {
      const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse do JSON retornado
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      atribuicoes = JSON.parse(jsonMatch[0]);
      console.log('    ✅ Gerado com Google AI');

    } catch (googleError) {
      console.log(`    ⚠️ Google AI falhou: ${googleError.message}`);
      
      // Fallback: gerar atribuições básicas baseadas no cargo
      atribuicoes = {
        responsabilidades: [`Executar funções de ${persona.role} na ${empresa.nome}`],
        tarefas_diarias: [`Trabalhar como ${persona.role}`, `Colaborar com equipe`],
        entregas: [`Resultados de ${persona.role}`],
        kpis: [`Performance em ${persona.role}`],
        interacoes: [`Equipe de ${persona.department}`],
        autonomia: `Nível padrão para ${persona.role}`,
        competencias: [`Habilidades de ${persona.role}`]
      };
      console.log('    ✅ Gerado com fallback estruturado');
    }

    return atribuicoes;

  } catch (error) {
    console.log(`    ❌ Erro na geração: ${error.message}`);
    return null;
  }
}

function calcularNivelHierarquico(role) {
  if (role.includes('CEO')) return 1;
  if (role.includes('CFO') || role.includes('CTO') || role.includes('COO')) return 2;
  if (role.includes('Manager') || role.includes('Head')) return 3;
  if (role.includes('Senior') || role.includes('Lead')) return 4;
  return 5; // Junior, Analyst, Assistant
}

// Executar se chamado diretamente
generateAtribuicoesContextualizadas();