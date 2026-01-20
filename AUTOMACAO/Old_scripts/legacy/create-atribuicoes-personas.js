#!/usr/bin/env node
/**
 * 🎯 POPULAR TABELA PERSONAS_ATRIBUICOES CORRETAMENTE
 * ==================================================
 * 
 * Cria atribuições detalhadas para as 15 personas da ARVA
 * baseado nos cargos e departamentos reais
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 CRIANDO ATRIBUIÇÕES PARA PERSONAS ARVA');
console.log('=========================================');

// Mapeamento de atribuições por cargo
const atribuicoesPorCargo = {
  'CEO': {
    responsabilidades_principais: [
      'Definir visão e estratégia da empresa',
      'Liderar equipe executiva',
      'Tomar decisões estratégicas',
      'Representar a empresa externamente',
      'Definir cultura organizacional'
    ],
    tarefas_diarias: [
      'Revisar métricas de performance',
      'Reuniões com diretores',
      'Análise de mercado',
      'Planejamento estratégico',
      'Comunicação com stakeholders'
    ],
    nivel_autoridade: 'Máximo',
    pode_aprovar: 'Todos os gastos',
    reporta_para: 'Conselho/Acionistas',
    equipe_coordena: 'Toda a empresa'
  },

  'CFO': {
    responsabilidades_principais: [
      'Gestão financeira e contábil',
      'Controle de orçamento e cash flow',
      'Relatórios financeiros',
      'Compliance fiscal',
      'Análise de investimentos'
    ],
    tarefas_diarias: [
      'Análise de fluxo de caixa',
      'Revisão de relatórios financeiros',
      'Controle de despesas',
      'Planejamento orçamentário',
      'Reuniões com bancos/investidores'
    ],
    nivel_autoridade: 'Alto',
    pode_aprovar: 'Gastos até R$ 100.000',
    reporta_para: 'CEO',
    equipe_coordena: 'Equipe Financeira'
  },

  'CTO': {
    responsabilidades_principais: [
      'Estratégia de tecnologia',
      'Liderança técnica',
      'Arquitetura de sistemas',
      'Segurança da informação',
      'Inovação tecnológica'
    ],
    tarefas_diarias: [
      'Revisão de código e arquitetura',
      'Planejamento técnico',
      'Reuniões de tecnologia',
      'Análise de performance',
      'Mentoria técnica da equipe'
    ],
    nivel_autoridade: 'Alto',
    pode_aprovar: 'Gastos de TI até R$ 50.000',
    reporta_para: 'CEO',
    equipe_coordena: 'Equipe Técnica'
  },

  'HR Manager': {
    responsabilidades_principais: [
      'Gestão de pessoas e talentos',
      'Processos de RH',
      'Cultura organizacional',
      'Recrutamento e seleção',
      'Desenvolvimento humano'
    ],
    tarefas_diarias: [
      'Processos de recrutamento',
      'Gestão de performance',
      'Resolução de conflitos',
      'Planejamento de treinamentos',
      'Compliance trabalhista'
    ],
    nivel_autoridade: 'Médio-Alto',
    pode_aprovar: 'Gastos de RH até R$ 20.000',
    reporta_para: 'CEO',
    equipe_coordena: 'Equipe de RH'
  },

  'Mkt Mgr': {
    responsabilidades_principais: [
      'Estratégia de marketing',
      'Gestão de campanhas',
      'Branding e comunicação',
      'Análise de mercado',
      'Lead generation'
    ],
    tarefas_diarias: [
      'Planejamento de campanhas',
      'Análise de métricas',
      'Criação de conteúdo',
      'Gestão de redes sociais',
      'Coordenação com vendas'
    ],
    nivel_autoridade: 'Médio',
    pode_aprovar: 'Gastos de marketing até R$ 15.000',
    reporta_para: 'CEO',
    equipe_coordena: 'Equipe de Marketing'
  },

  'SDR Mgr': {
    responsabilidades_principais: [
      'Gestão da equipe SDR',
      'Processos de prospecção',
      'Treinamento de vendas',
      'Pipeline management',
      'Métricas de performance'
    ],
    tarefas_diarias: [
      'Acompanhamento de metas',
      'Coaching da equipe',
      'Análise de pipeline',
      'Reuniões de vendas',
      'Otimização de processos'
    ],
    nivel_autoridade: 'Médio',
    pode_aprovar: 'Gastos de vendas até R$ 10.000',
    reporta_para: 'CEO',
    equipe_coordena: 'Equipe SDR'
  },

  'SDR Senior': {
    responsabilidades_principais: [
      'Prospecção qualificada',
      'Lead qualification',
      'Agendamento de reuniões',
      'CRM management',
      'Mentoria de SDRs juniores'
    ],
    tarefas_diarias: [
      'Prospecção ativa',
      'Follow-up de leads',
      'Qualificação de oportunidades',
      'Atualização de CRM',
      'Reuniões de pipeline'
    ],
    nivel_autoridade: 'Baixo-Médio',
    pode_aprovar: 'Gastos até R$ 1.000',
    reporta_para: 'SDR Manager',
    equipe_coordena: 'SDRs Juniores'
  },

  'SDR Junior': {
    responsabilidades_principais: [
      'Prospecção básica',
      'Qualificação inicial',
      'Suporte à equipe',
      'Aprendizado contínuo',
      'Execução de campanhas'
    ],
    tarefas_diarias: [
      'Prospecção em listas',
      'Envio de e-mails',
      'Cold calling',
      'Atualização de dados',
      'Participação em treinamentos'
    ],
    nivel_autoridade: 'Baixo',
    pode_aprovar: 'Gastos até R$ 500',
    reporta_para: 'SDR Senior/Manager',
    equipe_coordena: 'Nenhuma'
  },

  'SDR Analst': {
    responsabilidades_principais: [
      'Análise de dados de vendas',
      'Relatórios de performance',
      'Otimização de processos',
      'Suporte analítico',
      'KPI tracking'
    ],
    tarefas_diarias: [
      'Análise de métricas',
      'Criação de dashboards',
      'Relatórios gerenciais',
      'Identificação de tendências',
      'Suporte à tomada de decisão'
    ],
    nivel_autoridade: 'Baixo-Médio',
    pode_aprovar: 'Gastos até R$ 2.000',
    reporta_para: 'SDR Manager',
    equipe_coordena: 'Nenhuma'
  },

  'Social Mkt': {
    responsabilidades_principais: [
      'Gestão de redes sociais',
      'Criação de conteúdo',
      'Engajamento digital',
      'Influencer marketing',
      'Social listening'
    ],
    tarefas_diarias: [
      'Publicação de conteúdo',
      'Monitoramento de redes',
      'Resposta a comentários',
      'Análise de métricas sociais',
      'Criação de campanhas'
    ],
    nivel_autoridade: 'Baixo-Médio',
    pode_aprovar: 'Gastos até R$ 3.000',
    reporta_para: 'Marketing Manager',
    equipe_coordena: 'Nenhuma'
  },

  'YT Manager': {
    responsabilidades_principais: [
      'Estratégia de YouTube',
      'Produção de vídeos',
      'Otimização de canal',
      'Analytics do YouTube',
      'Criação de conteúdo audiovisual'
    ],
    tarefas_diarias: [
      'Planejamento de vídeos',
      'Gravação e edição',
      'Upload e otimização',
      'Análise de performance',
      'Interação com audiência'
    ],
    nivel_autoridade: 'Baixo-Médio',
    pode_aprovar: 'Gastos até R$ 5.000',
    reporta_para: 'Marketing Manager',
    equipe_coordena: 'Freelancers de vídeo'
  },

  'Asst Fin': {
    responsabilidades_principais: [
      'Suporte ao CFO',
      'Controle financeiro',
      'Contas a pagar/receber',
      'Conciliação bancária',
      'Relatórios básicos'
    ],
    tarefas_diarias: [
      'Lançamentos contábeis',
      'Controle de fluxo',
      'Organização de documentos',
      'Suporte em relatórios',
      'Conferência de dados'
    ],
    nivel_autoridade: 'Baixo',
    pode_aprovar: 'Gastos até R$ 2.000',
    reporta_para: 'CFO',
    equipe_coordena: 'Nenhuma'
  },

  'Asst Admin': {
    responsabilidades_principais: [
      'Suporte administrativo',
      'Organização geral',
      'Gestão de agenda',
      'Comunicação interna',
      'Suporte operacional'
    ],
    tarefas_diarias: [
      'Gestão de agenda',
      'Organização de reuniões',
      'Comunicação com fornecedores',
      'Controle de materiais',
      'Suporte geral'
    ],
    nivel_autoridade: 'Baixo',
    pode_aprovar: 'Gastos até R$ 1.000',
    reporta_para: 'CEO/Managers',
    equipe_coordena: 'Nenhuma'
  },

  'Asst RH': {
    responsabilidades_principais: [
      'Suporte ao RH',
      'Processos administrativos',
      'Documentação trabalhista',
      'Atendimento a funcionários',
      'Organização de dados'
    ],
    tarefas_diarias: [
      'Controle de ponto',
      'Documentos trabalhistas',
      'Atendimento interno',
      'Organização de arquivos',
      'Suporte em recrutamento'
    ],
    nivel_autoridade: 'Baixo',
    pode_aprovar: 'Gastos até R$ 1.500',
    reporta_para: 'HR Manager',
    equipe_coordena: 'Nenhuma'
  },

  'Asst Mkt': {
    responsabilidades_principais: [
      'Suporte ao marketing',
      'Execução de campanhas',
      'Criação de materiais',
      'Pesquisa de mercado',
      'Organização de eventos'
    ],
    tarefas_diarias: [
      'Criação de materiais',
      'Pesquisa de concorrentes',
      'Organização de dados',
      'Suporte em campanhas',
      'Coordenação de eventos'
    ],
    nivel_autoridade: 'Baixo',
    pode_aprovar: 'Gastos até R$ 2.000',
    reporta_para: 'Marketing Manager',
    equipe_coordena: 'Nenhuma'
  }
};

async function criarAtribuicoesPersonas() {
  try {
    console.log('\n1. Buscando personas da ARVA...');
    
    const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'active');

    if (personasError) {
      throw new Error(`Erro ao buscar personas: ${personasError.message}`);
    }

    console.log(`✅ ${personas.length} personas encontradas`);

    // 2. Verificar se já existem atribuições
    const { data: existing } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .eq('empresa_id', empresaId);

    if (existing && existing.length > 0) {
      console.log(`⚠️ Já existem ${existing.length} atribuições. Limpando...`);
      
      const { error: deleteError } = await supabase
        .from('personas_atribuicoes')
        .delete()
        .eq('empresa_id', empresaId);

      if (deleteError) {
        console.log('❌ Erro ao limpar:', deleteError.message);
      }
    }

    console.log('\n2. Criando atribuições para cada persona...');

    let sucessos = 0;
    let erros = 0;

    for (const persona of personas) {
      console.log(`\n🔄 ${persona.full_name} (${persona.role})`);
      
      const atribuicoes = atribuicoesPorCargo[persona.role] || atribuicoesPorCargo['Asst Admin'];
      
      // Primeiro, vamos descobrir quais campos a tabela aceita
      const { error: insertError } = await supabase
        .from('personas_atribuicoes')
        .insert({
          persona_id: persona.id,
          empresa_id: empresaId,
          responsabilidades_principais: atribuicoes.responsabilidades_principais,
          tarefas_diarias: atribuicoes.tarefas_diarias,
          nivel_autoridade: atribuicoes.nivel_autoridade,
          pode_aprovar: atribuicoes.pode_aprovar,
          reporta_para: atribuicoes.reporta_para,
          equipe_coordena: atribuicoes.equipe_coordena,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.log(`    ❌ Erro: ${insertError.message}`);
        erros++;
        
        // Se der erro, vamos tentar só com campos básicos
        const { error: insertError2 } = await supabase
          .from('personas_atribuicoes')
          .insert({
            persona_id: persona.id,
            empresa_id: empresaId
          });

        if (insertError2) {
          console.log(`    ❌ Erro básico também: ${insertError2.message}`);
        } else {
          console.log(`    ✅ Registro básico criado`);
          sucessos++;
        }
      } else {
        console.log(`    ✅ Atribuições completas criadas`);
        sucessos++;
      }
    }

    console.log('\n🎉 RESULTADO:');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📊 Total personas: ${personas.length}`);

    // 3. Verificar resultado final
    const { data: final, error: finalError } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .eq('empresa_id', empresaId);

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`\n📋 Registros finais na tabela: ${final.length}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

criarAtribuicoesPersonas();