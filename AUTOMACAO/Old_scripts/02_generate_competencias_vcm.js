#!/usr/bin/env node
/**
 * 🎯 GERAÇÃO DE COMPETÊNCIAS VCM COM SUBSISTEMAS
 * ===============================================
 * 
 * Gera competências alinhadas com os 12 subsistemas VCM
 * Desdobra em tarefas diárias, semanais e mensais
 * Define competências obrigatórias por cargo
 * 
 * @version 2.0.0 - VCM Integration
 * @date 2025-11-29
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// ============================================
// 12 SUBSISTEMAS VCM
// ============================================
const SUBSISTEMAS_VCM = {
  PERSONAS: {
    nome: "Gestão de Personas",
    descricao: "Criação, perfil e gestão de personas virtuais",
    competencias_exigidas: ["Análise de Perfis", "Gestão de Identidades Digitais", "People Analytics"],
    tarefas_diarias: ["Revisar perfis de personas", "Atualizar dados biográficos"],
    tarefas_semanais: ["Analisar performance das personas", "Ajustar competências"],
    tarefas_mensais: ["Relatório de evolução", "Planejamento de desenvolvimento"]
  },
  TAREFAS_E_METAS: {
    nome: "Tarefas e Metas",
    descricao: "Gerenciamento de objetivos e KPIs",
    competencias_exigidas: ["Gestão de Projetos", "Definição de KPIs", "Planejamento Estratégico"],
    tarefas_diarias: ["Atualizar status de tarefas", "Priorizar demandas"],
    tarefas_semanais: ["Review de metas semanais", "Ajuste de prioridades"],
    tarefas_mensais: ["Análise de atingimento de metas", "Planejamento mensal"]
  },
  PROSPECAO: {
    nome: "Prospecção de Leads",
    descricao: "Geração e qualificação de leads",
    competencias_exigidas: ["Técnicas de Prospecção", "Qualificação BANT", "LinkedIn Sales Navigator", "CRM Management"],
    tarefas_diarias: [
      "Pesquisar 50 leads qualificados",
      "Enviar 30 mensagens de prospecção",
      "Atualizar CRM com interações",
      "Follow-up de leads aquecidos"
    ],
    tarefas_semanais: [
      "Análise de taxa de conversão",
      "Otimização de cadências",
      "Revisão de ICP (Ideal Customer Profile)",
      "Meeting com SDR Manager"
    ],
    tarefas_mensais: [
      "Relatório de prospecção mensal",
      "Ajuste de estratégias de outreach",
      "Treinamento em novas técnicas",
      "Análise de pipeline gerado"
    ]
  },
  COMUNICACAO: {
    nome: "Comunicação e Colaboração",
    descricao: "Comunicação interna e externa",
    competencias_exigidas: ["Comunicação Corporativa", "Redação Empresarial", "Apresentações", "Slack/Teams"],
    tarefas_diarias: ["Responder emails prioritários", "Participar de reuniões diárias"],
    tarefas_semanais: ["Reuniões de alinhamento", "Apresentações de status"],
    tarefas_mensais: ["Townhall meeting", "Relatórios mensais"]
  },
  FINANCEIRO: {
    nome: "Gestão Financeira",
    descricao: "Controle financeiro e orçamentário",
    competencias_exigidas: ["Análise Financeira", "Controladoria", "Excel Avançado", "Power BI"],
    tarefas_diarias: ["Lançamentos contábeis", "Conciliação bancária"],
    tarefas_semanais: ["Análise de fluxo de caixa", "Previsões financeiras"],
    tarefas_mensais: ["Fechamento mensal", "Relatórios gerenciais", "Budget review"]
  },
  RECURSOS_HUMANOS: {
    nome: "Recursos Humanos",
    descricao: "Gestão de pessoas e talentos",
    competencias_exigidas: ["Recrutamento e Seleção", "Gestão de Performance", "Employee Experience", "ATS"],
    tarefas_diarias: ["Triagem de currículos", "Agendamento de entrevistas"],
    tarefas_semanais: ["Entrevistas", "Onboarding de novos colaboradores"],
    tarefas_mensais: ["Avaliações de desempenho", "Pesquisa de clima", "People Analytics"]
  },
  MARKETING: {
    nome: "Marketing e Growth",
    descricao: "Marketing digital e crescimento",
    competencias_exigidas: ["Marketing Digital", "Growth Hacking", "Google Ads", "Facebook Ads", "Analytics"],
    tarefas_diarias: ["Monitorar campanhas", "Criar conteúdo", "Análise de métricas"],
    tarefas_semanais: ["Otimização de campanhas", "A/B testing", "Relatório de performance"],
    tarefas_mensais: ["Planejamento de campanhas", "Budget allocation", "ROI analysis"]
  },
  VENDAS: {
    nome: "Gestão de Vendas",
    descricao: "Pipeline e fechamento de negócios",
    competencias_exigidas: ["Técnicas de Vendas", "Negociação", "CRM Salesforce", "Sales Engagement"],
    tarefas_diarias: ["Calls de vendas", "Follow-up de propostas", "Atualizar pipeline"],
    tarefas_semanais: ["Pipeline review", "Forecast semanal", "Treinamento de vendas"],
    tarefas_mensais: ["Análise de conversão", "Comissionamento", "Planejamento de território"]
  },
  SUPORTE: {
    nome: "Suporte ao Cliente",
    descricao: "Atendimento e satisfação do cliente",
    competencias_exigidas: ["Customer Success", "Zendesk", "Atendimento ao Cliente", "Troubleshooting"],
    tarefas_diarias: ["Responder tickets", "Monitorar SLA", "Atendimento proativo"],
    tarefas_semanais: ["Análise de CSAT/NPS", "Casos escalados", "Knowledge base update"],
    tarefas_mensais: ["Relatório de satisfação", "Treinamento da equipe", "Processos de melhoria"]
  },
  TECNOLOGIA: {
    nome: "Tecnologia e Infraestrutura",
    descricao: "Desenvolvimento e infraestrutura tech",
    competencias_exigidas: ["Desenvolvimento Full-Stack", "DevOps", "AWS/Azure", "CI/CD", "Docker/Kubernetes"],
    tarefas_diarias: ["Code review", "Deploy de features", "Monitoring de produção"],
    tarefas_semanais: ["Sprint planning", "Refactoring", "Security updates"],
    tarefas_mensais: ["Architecture review", "Tech debt management", "Capacity planning"]
  },
  ANALYTICS: {
    nome: "Analytics e BI",
    descricao: "Análise de dados e inteligência de negócios",
    competencias_exigidas: ["SQL Avançado", "Python para Análise", "Tableau/Power BI", "Data Modeling"],
    tarefas_diarias: ["Monitorar dashboards", "Atualizar métricas", "Ad-hoc analysis"],
    tarefas_semanais: ["Análises semanais", "Data quality checks", "Stakeholder reports"],
    tarefas_mensais: ["Business reviews", "Forecast modeling", "Dashboard optimization"]
  },
  DOCUMENTACAO: {
    nome: "Documentação e Conhecimento",
    descricao: "Gestão de conhecimento e processos",
    competencias_exigidas: ["Documentação Técnica", "Gestão de Processos", "Notion/Confluence", "SOPs"],
    tarefas_diarias: ["Atualizar documentação", "Revisar processos"],
    tarefas_semanais: ["Publicar SOPs", "Training materials"],
    tarefas_mensais: ["Auditoria de docs", "Knowledge base review", "Process optimization"]
  }
};

// ============================================
// MAPEAMENTO CARGOS → SUBSISTEMAS
// ============================================
const CARGO_SUBSISTEMAS_MAP = {
  // LIDERANÇA
  'CEO': ['TAREFAS_E_METAS', 'FINANCEIRO', 'RECURSOS_HUMANOS', 'MARKETING', 'VENDAS', 'TECNOLOGIA'],
  'CTO': ['TECNOLOGIA', 'ANALYTICS', 'DOCUMENTACAO', 'TAREFAS_E_METAS'],
  'CFO': ['FINANCEIRO', 'ANALYTICS', 'TAREFAS_E_METAS', 'DOCUMENTACAO'],
  
  // RECURSOS HUMANOS
  'HR Manager': ['RECURSOS_HUMANOS', 'COMUNICACAO', 'DOCUMENTACAO', 'PERSONAS'],
  'Asst RH': ['RECURSOS_HUMANOS', 'COMUNICACAO', 'DOCUMENTACAO'],
  
  // FINANCEIRO
  'Asst Fin': ['FINANCEIRO', 'ANALYTICS', 'DOCUMENTACAO'],
  'Financial Analyst': ['FINANCEIRO', 'ANALYTICS'],
  
  // MARKETING
  'Mkt Mgr': ['MARKETING', 'ANALYTICS', 'COMUNICACAO', 'TAREFAS_E_METAS'],
  'Social Mkt': ['MARKETING', 'COMUNICACAO', 'ANALYTICS'],
  'YT Manager': ['MARKETING', 'COMUNICACAO'],
  'Asst Mkt': ['MARKETING', 'COMUNICACAO'],
  
  // VENDAS E SDR (FOCO EM PROSPECÇÃO)
  'SDR Mgr': ['PROSPECAO', 'VENDAS', 'COMUNICACAO', 'ANALYTICS', 'TAREFAS_E_METAS'],
  'SDR Senior': ['PROSPECAO', 'VENDAS', 'COMUNICACAO', 'ANALYTICS'],
  'SDR Junior': ['PROSPECAO', 'COMUNICACAO', 'DOCUMENTACAO'], // FOCO TOTAL EM PROSPECÇÃO
  'SDR Analst': ['PROSPECAO', 'ANALYTICS', 'DOCUMENTACAO'],
  'Sales Rep': ['VENDAS', 'PROSPECAO', 'COMUNICACAO'],
  
  // ADMINISTRATIVO
  'Asst Admin': ['COMUNICACAO', 'DOCUMENTACAO', 'TAREFAS_E_METAS'],
  
  // TECNOLOGIA
  'Tech Lead': ['TECNOLOGIA', 'DOCUMENTACAO', 'TAREFAS_E_METAS'],
  'Developer': ['TECNOLOGIA', 'DOCUMENTACAO'],
  'DevOps': ['TECNOLOGIA', 'ANALYTICS', 'DOCUMENTACAO']
};

// ============================================
// GERAÇÃO DE COMPETÊNCIAS COM SUBSISTEMAS
// ============================================
async function gerarCompetenciasComSubsistemas(persona, subsistemas) {
  const prompt = `
Você é um especialista em desenvolvimento de competências profissionais e gestão de tarefas.

**PERSONA:**
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Biografia: ${persona.biografia || 'Não disponível'}

**SUBSISTEMAS VCM OBRIGATÓRIOS:**
${subsistemas.map(s => `
- ${s.nome}: ${s.descricao}
  Competências Exigidas: ${s.competencias_exigidas.join(', ')}
`).join('\n')}

**TAREFA:**
Gere uma estrutura JSON completa de competências para esta persona, incluindo:

1. **competencias_subsistemas**: Array com um objeto para cada subsistema, contendo:
   - subsistema: nome do subsistema
   - nivel_dominio: "Iniciante", "Intermediário", "Avançado" ou "Expert"
   - competencias_tecnicas: array de competências técnicas obrigatórias daquele subsistema
   - competencias_comportamentais: array de soft skills relevantes
   - ferramentas: array de ferramentas/softwares necessários
   - tarefas_diarias: array de 3-5 tarefas diárias específicas
   - tarefas_semanais: array de 3-5 tarefas semanais específicas
   - tarefas_mensais: array de 2-4 tarefas mensais específicas

2. **competencias_gerais**: Competências transversais que se aplicam a todos os subsistemas

3. **objetivos_desenvolvimento**: 3-5 objetivos de desenvolvimento profissional

**IMPORTANTE:**
- Para SDR Junior, foque FORTEMENTE em PROSPECÇÃO DE LEADS
- Tarefas devem ser ESPECÍFICAS e MENSURÁVEIS
- Níveis de domínio devem refletir a senioridade do cargo
- Inclua métricas e KPIs nas tarefas quando aplicável

Retorne APENAS o JSON, sem explicações adicionais.
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Limpar markdown
  const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonText);
}

// ============================================
// PROCESSAR EMPRESA
// ============================================
async function processarEmpresa(empresaId) {
  console.log('\n🎯 GERAÇÃO DE COMPETÊNCIAS VCM\n');
  console.log('='.repeat(60));
  
  // 1. Buscar empresa
  const { data: empresa, error: empError } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  if (empError || !empresa) {
    throw new Error(`Empresa não encontrada: ${empresaId}`);
  }
  
  console.log(`\n🏢 Empresa: ${empresa.nome}`);
  
  // 2. Buscar personas com biografias
  const { data: personas, error: persError } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);
  
  if (persError) {
    throw new Error(`Erro ao buscar personas: ${persError.message}`);
  }
  
  console.log(`👥 ${personas.length} personas encontradas\n`);
  
  // 3. Processar cada persona
  const outputDir = path.join(process.cwd(), 'competencias_output');
  await fs.mkdir(outputDir, { recursive: true });
  
  const resultados = [];
  
  for (const persona of personas) {
    console.log(`\n📋 Processando: ${persona.full_name} (${persona.role})`);
    
    // Identificar subsistemas para este cargo
    const subsistemaKeys = CARGO_SUBSISTEMAS_MAP[persona.role] || ['COMUNICACAO', 'TAREFAS_E_METAS'];
    const subsistemas = subsistemaKeys.map(key => SUBSISTEMAS_VCM[key]);
    
    console.log(`   Subsistemas: ${subsistemaKeys.join(', ')}`);
    
    try {
      // Preparar biografia
      const biografia = persona.biografia_completa ||
                       persona.biografia_resumida ||
                       `${persona.full_name} atua como ${persona.role}`;
      
      // Gerar competências com LLM
      const competencias = await gerarCompetenciasComSubsistemas(
        { ...persona, biografia },
        subsistemas
      );
      
      // Adicionar metadados
      const resultado = {
        persona_id: persona.id,
        full_name: persona.full_name,
        role: persona.role,
        empresa_id: empresaId,
        subsistemas_vcm: subsistemaKeys,
        ...competencias,
        generated_at: new Date().toISOString()
      };
      
      resultados.push(resultado);
      
      // Salvar arquivo individual
      const filename = `${persona.full_name.replace(/\s+/g, '_')}_competencias.json`;
      await fs.writeFile(
        path.join(outputDir, filename),
        JSON.stringify(resultado, null, 2)
      );
      
      // 🔥 SALVAR NO BANCO DE DADOS
      try {
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            ia_config: {
              ...persona.ia_config,
              tarefas_metas: competencias,
              subsistemas_vcm: subsistemaKeys,
              competencias_updated_at: new Date().toISOString()
            }
          })
          .eq('id', persona.id);
        
        if (updateError) {
          console.error(`   ⚠️ Erro ao salvar no banco: ${updateError.message}`);
        } else {
          console.log(`   💾 Salvo no banco de dados`);
        }
      } catch (dbError) {
        console.error(`   ⚠️ Erro ao atualizar banco: ${dbError.message}`);
      }
      
      console.log(`   ✅ Competências geradas e salvas`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
    }
  }
  
  // 4. Salvar consolidado
  const consolidado = {
    empresa_id: empresaId,
    empresa_nome: empresa.nome,
    total_personas: personas.length,
    personas_processadas: resultados.length,
    subsistemas_vcm: Object.keys(SUBSISTEMAS_VCM),
    personas: resultados,
    generated_at: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(outputDir, `${empresa.nome.replace(/\s+/g, '_')}_competencias_completo.json`),
    JSON.stringify(consolidado, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PROCESSO CONCLUÍDO!');
  console.log(`   Personas processadas: ${resultados.length}/${personas.length}`);
  console.log(`   Arquivos salvos em: ${outputDir}`);
  console.log('');
}

// ============================================
// EXECUÇÃO
// ============================================
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));

if (!empresaIdArg) {
  console.error('❌ Uso: node 02_generate_competencias_vcm.js --empresaId=UUID');
  process.exit(1);
}

const empresaId = empresaIdArg.split('=')[1];

processarEmpresa(empresaId).catch(error => {
  console.error('\n❌ ERRO FATAL:', error.message);
  process.exit(1);
});
