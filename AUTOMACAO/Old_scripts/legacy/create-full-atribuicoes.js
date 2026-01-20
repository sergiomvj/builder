#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function criarAtribuicoesFinal() {
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
  
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  console.log('🎯 POPULANDO PERSONAS_ATRIBUICOES - TODOS OS CAMPOS');
  console.log(`📋 ${personas.length} personas encontradas\n`);

  const records = personas.map((p, index) => {
    const username = p.full_name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    
    return {
      persona_id: p.id,
      empresa_id: empresaId,
      departamento: p.department || 'Geral',
      nivel_hierarquico: p.role.includes('CEO') ? 1 : 
                         p.role.includes('CFO') || p.role.includes('CTO') ? 2 : 
                         p.role.includes('Manager') ? 3 : 
                         p.role.includes('Senior') ? 4 : 5,
      email_corporativo: p.email || `${username}@arvabot.com`,
      sistema_ci_username: username,
      responsabilidades_principais: JSON.stringify([
        `Executar atividades de ${p.role}`,
        `Colaborar com equipe de ${p.department || 'Geral'}`,
        `Participar de projetos da empresa`,
        `Reportar progresso regularmente`,
        `Manter qualidade e prazos`
      ]),
      tarefas_diarias: JSON.stringify([
        'Verificar emails e mensagens',
        'Participar de reuniões',
        'Executar projetos em andamento',
        'Documentar progresso',
        'Colaborar com colegas'
      ]),
      objetivos_kpis: JSON.stringify({
        kpi_1: 'Qualidade das entregas',
        kpi_2: 'Cumprimento de prazos',
        kpi_3: 'Satisfação da equipe',
        meta_trimestral: 'Completar projetos no prazo',
        meta_anual: 'Desenvolver especialização'
      }),
      autoridade_decisao: JSON.stringify({
        nivel_autonomia: p.role.includes('CEO') ? 'Alto' : p.role.includes('Manager') ? 'Médio' : 'Baixo',
        limite_aprovacao: p.role.includes('CEO') ? 'Ilimitado' : 
                         p.role.includes('CFO') ? 'R$ 100.000' : 
                         p.role.includes('Manager') ? 'R$ 10.000' : 'R$ 1.000',
        pode_contratar: p.role.includes('CEO') || p.role.includes('HR Manager'),
        pode_demitir: p.role.includes('CEO'),
        aprovacoes_necessarias: p.role.includes('CEO') ? [] : ['Gastos acima do limite', 'Mudanças de processo']
      }),
      stakeholders: JSON.stringify({
        internos: [p.department || 'Geral', 'RH', 'TI'],
        externos: ['Clientes', 'Fornecedores'],
        reporta_para: p.role.includes('CEO') ? 'Conselho' : 
                     p.role.includes('Manager') ? 'CEO' : 
                     'Manager',
        coordena: p.role.includes('Manager') ? ['Equipe'] : []
      }),
      ferramentas_sistemas: JSON.stringify(['Email', 'Teams', 'Office', 'Sistema ERP']),
      nivel_senioridade: p.role.includes('CEO') || p.role.includes('CFO') || p.role.includes('CTO') ? 'Executivo' : 
                        p.role.includes('Manager') ? 'Gerencial' : 
                        p.role.includes('Senior') ? 'Senior' : 'Pleno',
      budget_responsavel: p.role.includes('CEO') ? 'R$ 1.000.000' : 
                         p.role.includes('CFO') ? 'R$ 500.000' : 
                         p.role.includes('Manager') ? 'R$ 50.000' : 'R$ 5.000',
      equipe_subordinados: p.role.includes('Manager') ? 3 : 0,
      reporta_para: p.role.includes('CEO') ? 'conselho' : 
                   p.role.includes('Manager') ? 'ceo' : 
                   'manager_' + (p.department || 'geral').toLowerCase()
    };
  });

  const { data, error } = await supabase
    .from('personas_atribuicoes')
    .insert(records)
    .select();

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log(`✅ ${data.length} atribuições criadas!`);
    console.log('\n📋 Exemplo de registro:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

criarAtribuicoesFinal().catch(console.error);