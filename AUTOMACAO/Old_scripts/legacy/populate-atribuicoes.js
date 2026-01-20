#!/usr/bin/env node
/**
 * 🎯 SCRIPT PARA POPULAR TABELA PERSONAS_ATRIBUICOES
 * ==================================================
 * 
 * Esta tabela deveria conter as responsabilidades e atribuições específicas
 * de cada persona, mas está vazia. Vamos populá-la com base nas personas existentes.
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

console.log('🎯 POPULANDO TABELA PERSONAS_ATRIBUICOES');
console.log('========================================');

async function generateAtribuicoes() {
  try {
    // 1. Buscar empresa ARVA
    const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
    
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      throw new Error('Empresa ARVA não encontrada');
    }

    console.log(`🏢 Empresa: ${empresa.nome}`);

    // 2. Buscar personas da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'active');

    if (personasError) {
      throw new Error(`Erro ao buscar personas: ${personasError.message}`);
    }

    console.log(`👤 Encontradas ${personas.length} personas`);

    // 3. Verificar se já existem atribuições
    const { data: existingAtribuicoes } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .eq('empresa_id', empresaId);

    if (existingAtribuicoes && existingAtribuicoes.length > 0) {
      console.log(`✅ Já existem ${existingAtribuicoes.length} atribuições. Pulando...`);
      return;
    }

    // 4. Gerar atribuições para cada persona
    let totalGeradas = 0;

    for (const persona of personas) {
      console.log(`\n🔄 Gerando atribuições para: ${persona.full_name} (${persona.role})`);
      
      const atribuicoes = await generateAtribuicoesForPersona(persona, empresa);
      
      if (atribuicoes) {
        // Salvar no banco
        const { error: insertError } = await supabase
          .from('personas_atribuicoes')
          .insert({
            persona_id: persona.id,
            empresa_id: empresa.id,
            responsabilidades_principais: atribuicoes.responsabilidades_principais,
            tarefas_diarias: atribuicoes.tarefas_diarias,
            objetivos_kpis: atribuicoes.objetivos_kpis,
            autoridade_decisao: atribuicoes.autoridade_decisao,
            stakeholders: atribuicoes.stakeholders,
            ferramentas_sistemas: atribuicoes.ferramentas_sistemas,
            nivel_senioridade: atribuicoes.nivel_senioridade,
            budget_responsavel: atribuicoes.budget_responsavel,
            equipe_subordinados: atribuicoes.equipe_subordinados,
            reporta_para: atribuicoes.reporta_para,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`    ❌ Erro ao salvar: ${insertError.message}`);
        } else {
          console.log(`    ✅ Atribuições salvas com sucesso`);
          totalGeradas++;
        }
      }

      // Pausa entre personas para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n🎉 CONCLUÍDO! ${totalGeradas} atribuições geradas`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

async function generateAtribuicoesForPersona(persona, empresa) {
  try {
    const prompt = `
Você é um especialista em organização empresarial. Crie atribuições detalhadas para esta persona:

PERSONA:
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Departamento: ${persona.department}
- Especialidade: ${persona.specialty}
- Anos de Experiência: ${persona.experiencia_anos}

EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.industria}
- País: ${empresa.pais}

RETORNE APENAS JSON VÁLIDO com esta estrutura:

{
  "responsabilidades_principais": ["lista de 5-7 responsabilidades principais do cargo"],
  "tarefas_diarias": ["lista de 8-10 tarefas que executa diariamente"],
  "objetivos_kpis": {
    "kpi_1": "Métrica específica 1",
    "kpi_2": "Métrica específica 2", 
    "kpi_3": "Métrica específica 3",
    "meta_trimestral": "Meta principal do trimestre",
    "meta_anual": "Meta principal do ano"
  },
  "autoridade_decisao": {
    "nivel_autonomia": "Alto/Médio/Baixo",
    "limite_aprovacao": "R$ valor ou N/A",
    "pode_contratar": true/false,
    "pode_demitir": true/false,
    "aprovacoes_necessarias": ["lista de decisões que precisa de aprovação"]
  },
  "stakeholders": {
    "internos": ["lista de pessoas/departamentos internos"],
    "externos": ["lista de clientes/fornecedores externos"],
    "reporta_para": "Cargo do superior direto",
    "coordena": ["lista de pessoas/cargos que coordena"]
  },
  "ferramentas_sistemas": ["lista de 6-8 ferramentas/sistemas que usa"],
  "nivel_senioridade": "Junior/Pleno/Senior/Especialista/Gerencial/Executivo",
  "budget_responsavel": "R$ valor estimado ou N/A",
  "equipe_subordinados": 0,
  "reporta_para": "cargo_do_superior"
}

IMPORTANTE: Seja específico e realista para o cargo de ${persona.role} em ${empresa.industria}.`;

    const model = googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      console.log('    ⚠️ Resposta não contém JSON válido, usando dados padrão');
      return generateDefaultAtribuicoes(persona);
    }

  } catch (error) {
    console.error(`    ❌ Erro na geração: ${error.message}`);
    return generateDefaultAtribuicoes(persona);
  }
}

function generateDefaultAtribuicoes(persona) {
  return {
    responsabilidades_principais: [
      `Executar atividades de ${persona.specialty}`,
      `Colaborar com equipe de ${persona.department}`,
      "Participar de reuniões de equipe",
      "Reportar progresso regularmente",
      "Manter qualidade e prazos"
    ],
    tarefas_diarias: [
      "Verificar emails e mensagens",
      "Participar de daily meetings", 
      "Executar projetos em andamento",
      "Documentar progresso",
      "Colaborar com colegas"
    ],
    objetivos_kpis: {
      kpi_1: "Qualidade das entregas",
      kpi_2: "Cumprimento de prazos",
      kpi_3: "Satisfação da equipe",
      meta_trimestral: "Completar projetos no prazo",
      meta_anual: "Desenvolver especialização"
    },
    autoridade_decisao: {
      nivel_autonomia: "Médio",
      limite_aprovacao: "R$ 1.000",
      pode_contratar: false,
      pode_demitir: false,
      aprovacoes_necessarias: ["Gastos acima de R$ 1.000", "Mudanças de processo"]
    },
    stakeholders: {
      internos: [persona.department, "RH", "TI"],
      externos: ["Clientes", "Fornecedores"],
      reporta_para: "Gerente",
      coordena: []
    },
    ferramentas_sistemas: ["Email", "Teams", "Office", "Sistema ERP"],
    nivel_senioridade: "Pleno",
    budget_responsavel: "R$ 5.000",
    equipe_subordinados: 0,
    reporta_para: "gerente_" + persona.department.toLowerCase()
  };
}

generateAtribuicoes();