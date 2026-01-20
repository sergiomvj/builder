#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

class CompetenciasGeneratorSimple {
    constructor() {
        // Templates de competências por tipo de persona
        this.competenciasPorRole = {
            'CEO': {
                tecnicas: ['Liderança Estratégica', 'Gestão Empresarial', 'Visão de Negócios', 'Tomada de Decisão'],
                comportamentais: ['Liderança Visionária', 'Comunicação Estratégica', 'Resiliência', 'Inspiração'],
                sdr_competencies: false // CEO não faz prospecção direta
            },
            'CTO': {
                tecnicas: ['Arquitetura de Sistemas', 'Gestão de TI', 'Inovação Tecnológica', 'DevOps', 'Technical Prospecting', 'Solution Selling'],
                comportamentais: ['Pensamento Analítico', 'Orientação à Inovação', 'Liderança Técnica', 'Resolução de Problemas', 'Persuasão Técnica'],
                sdr_competencies: true,
                sales_focus: 'Tech Decision Makers',
                prospecting_skills: ['Cold Calling para CTOs', 'Email Outreach Técnico', 'LinkedIn Prospecting', 'Technical Demo Delivery']
            },
            'CFO': {
                tecnicas: ['Análise Financeira', 'Controladoria', 'Gestão de Riscos', 'Planejamento Financeiro', 'ROI Selling', 'Budget Justification'],
                comportamentais: ['Precisão Analítica', 'Pensamento Estratégico', 'Comunicação Assertiva', 'Orientação a Dados', 'Persuasão Financeira'],
                sdr_competencies: true,
                sales_focus: 'C-Level Executives',
                prospecting_skills: ['Executive Outreach', 'ROI-based Prospecting', 'Financial Objection Handling', 'Budget Cycle Timing']
            },
            'COO': {
                tecnicas: ['Gestão Operacional', 'Otimização de Processos', 'Gestão de Projetos', 'Qualidade Total', 'Process Improvement Selling'],
                comportamentais: ['Eficiência Operacional', 'Liderança Executiva', 'Orientação a Resultados', 'Gestão de Pessoas', 'Consultive Selling'],
                sdr_competencies: true,
                sales_focus: 'Operations Directors',
                prospecting_skills: ['Operations-focused Prospecting', 'Process Optimization Pitches', 'Efficiency ROI Presentations']
            },
            'CMO': {
                tecnicas: ['Marketing Digital', 'Estratégia de Marca', 'Growth Marketing', 'Marketing Analytics', 'Marketing Solution Selling'],
                comportamentais: ['Criatividade Estratégica', 'Orientação ao Cliente', 'Visão de Mercado', 'Inovação', 'Creative Persuasion'],
                sdr_competencies: true,
                sales_focus: 'Marketing Leaders',
                prospecting_skills: ['Creative Outreach', 'Marketing ROI Presentations', 'Digital Strategy Pitches', 'Brand Growth Solutions']
            },
            'Manager': {
                tecnicas: ['Gestão de Equipes', 'Gestão de Projetos', 'KPIs e Métricas', 'Processos Operacionais', 'Technical Demos'],
                comportamentais: ['Liderança de Equipe', 'Comunicação Eficaz', 'Orientação a Resultados', 'Desenvolvimento de Pessoas'],
                sdr_competencies: false,
                sales_support: true,
                support_areas: ['Solution Design', 'Technical Presentations', 'Implementation Planning']
            },
            'Analyst': {
                tecnicas: ['Análise de Dados', 'Modelagem de Processos', 'Documentação Técnica', 'Ferramentas de Análise', 'Technical Research'],
                comportamentais: ['Pensamento Analítico', 'Atenção aos Detalhes', 'Resolução de Problemas', 'Comunicação Técnica'],
                sdr_competencies: false,
                sales_support: true,
                support_areas: ['Technical Demos', 'Data Analysis for Sales', 'Integration Planning']
            },
            'Specialist': {
                tecnicas: ['Especialização Técnica', 'Melhores Práticas', 'Ferramentas Especializadas', 'Metodologias Avançadas', 'Sales Enablement'],
                comportamentais: ['Expertise Técnica', 'Aprendizagem Contínua', 'Precisão', 'Orientação à Qualidade'],
                sdr_competencies: false,
                sales_support: true,
                support_areas: ['Technical Training', 'Solution Architecture', 'Product Demonstrations']
            },
            'Assistant': {
                tecnicas: ['Suporte Administrativo', 'Organização de Processos', 'Ferramentas de Produtividade', 'Gestão de Agenda', 'CRM Management', 'Lead Qualification'],
                comportamentais: ['Organização', 'Proatividade', 'Comunicação Clara', 'Suporte Eficiente', 'Atenção aos Detalhes'],
                sdr_competencies: true, // ← Todas assistentes têm competências SDR
                sales_support_focus: 'Executive Support & Lead Management',
                prospecting_skills: ['Lead Research', 'Appointment Setting', 'CRM Data Management', 'Prospect Communication', 'Pipeline Management']
            }
        };
    }

    mapearRoleParaTemplate(role) {
        // Mapear role completo para template key
        if (role === 'Chief Executive Officer') return 'CEO';
        if (role === 'Chief Technology Officer') return 'CTO';
        if (role === 'Chief Financial Officer') return 'CFO';
        if (role === 'Chief Operating Officer') return 'COO';
        if (role === 'Chief Marketing Officer') return 'CMO';
        if (role.includes('Assistant')) return 'Assistant';
        if (role.includes('Specialist')) return 'Specialist';
        
        return 'Assistant'; // fallback
    }

    determinarNivelPersona(role) {
        if (role.includes('Chief') || role === 'CEO') return 'Executive';
        if (role.includes('Manager')) return 'Manager';
        if (role.includes('Specialist')) return 'Specialist';
        if (role.includes('Assistant')) return 'Assistant';
        return 'Assistant'; // fallback
    }

    async gerarCompetenciasParaEmpresa(empresaId) {
        try {
            console.log(`🎯 Gerando competências para empresa: ${empresaId}`);

            // Buscar empresa
            const { data: empresas, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId);

            if (empresaError) {
                throw new Error(`Erro ao buscar empresa: ${empresaError.message}`);
            }

            if (!empresas || empresas.length === 0) {
                throw new Error('Empresa não encontrada');
            }

            const empresa = empresas[0];

            console.log(`📊 Empresa: ${empresa.nome} (${empresa.codigo})`);

            // Buscar personas da empresa
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('status', 'active');

            if (personasError) {
                throw new Error(`Erro ao buscar personas: ${personasError.message}`);
            }

            if (!personas || personas.length === 0) {
                throw new Error('Nenhuma persona ativa encontrada para esta empresa');
            }

            console.log(`👥 Encontradas ${personas.length} personas ativas`);
            
            // Limpar competências existentes da empresa
            console.log(`🗑️ Limpando competências existentes...`);
            const { error: deleteError } = await supabase
                .from('competencias')
                .delete()
                .in('persona_id', personas.map(p => p.id));

            if (deleteError && deleteError.code !== 'PGRST106') { // Ignora erro de nenhum registro encontrado
                console.warn(`⚠️ Aviso ao limpar competências: ${deleteError.message}`);
            }

            let totalCompetenciasInseridas = 0;

            // Gerar e inserir competências para cada persona
            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = this.mapearRoleParaTemplate(persona.role);
                const nivelPersona = this.determinarNivelPersona(persona.role);
                const competenciasTemplate = this.competenciasPorRole[templateKey] || this.competenciasPorRole['Assistant'];
                
                // Base competências do template
                let competenciasTecnicas = [...competenciasTemplate.tecnicas];
                let competenciasComportamentais = [...competenciasTemplate.comportamentais];
                let areasFoco = this.determinarAreasFoco(persona.department, persona.specialty);
                let observacoes = [];

                // Competências específicas de SDR para executivos
                if (nivelPersona === 'Executive' && competenciasTemplate.sdr_competencies) {
                    competenciasTecnicas.push(...competenciasTemplate.prospecting_skills);
                    areasFoco.push(competenciasTemplate.sales_focus);
                    observacoes.push(`SDR Executive - ${competenciasTemplate.sales_focus} expertise with sales development focus`);
                }

                // Competências específicas de SDR para assistentes
                if (nivelPersona === 'Assistant' && competenciasTemplate.sdr_competencies) {
                    competenciasTecnicas.push(...competenciasTemplate.prospecting_skills);
                    areasFoco.push(competenciasTemplate.sales_support_focus);
                    observacoes.push('SDR Support Role - focuses on executive assistance with sales enablement');
                }

                // Competências de sales support para especialistas
                if (nivelPersona === 'Specialist' && competenciasTemplate.sales_support) {
                    areasFoco.push(...competenciasTemplate.support_areas);
                    observacoes.push('Technical specialist providing sales support and solution expertise');
                }

                // Preparar competências para inserção no banco
                const competenciasParaInserir = [];

                // Inserir competências técnicas
                for (const competencia of competenciasTecnicas) {
                    competenciasParaInserir.push({
                        persona_id: persona.id,
                        tipo: 'tecnica',
                        nome: competencia,
                        descricao: `Competência técnica: ${competencia}`,
                        nivel: this.determinarNivelExperiencia(persona.role)
                    });
                }

                // Inserir competências comportamentais
                for (const competencia of competenciasComportamentais) {
                    competenciasParaInserir.push({
                        persona_id: persona.id,
                        tipo: 'soft_skill',
                        nome: competencia,
                        descricao: `Competência comportamental: ${competencia}`,
                        nivel: this.determinarNivelExperiencia(persona.role)
                    });
                }

                // Inserir áreas de foco como competências principais
                for (const area of areasFoco) {
                    competenciasParaInserir.push({
                        persona_id: persona.id,
                        tipo: 'principal',
                        nome: area,
                        descricao: `Área de especialização: ${area}`,
                        nivel: this.determinarNivelExperiencia(persona.role)
                    });
                }

                // Inserir no banco de dados
                if (competenciasParaInserir.length > 0) {
                    const { data: insertedCompetencias, error: insertError } = await supabase
                        .from('competencias')
                        .insert(competenciasParaInserir)
                        .select();

                    if (insertError) {
                        console.error(`❌ Erro ao inserir competências para ${persona.full_name}:`, insertError.message);
                    } else {
                        totalCompetenciasInseridas += competenciasParaInserir.length;
                        console.log(`   ✅ ${competenciasParaInserir.length} competências inseridas`);
                    }
                }
            }

            console.log(`✅ Competências inseridas no banco com sucesso!`);
            console.log(`� Total: ${totalCompetenciasInseridas} competências para ${personas.length} personas`);

            return {
                success: true,
                personas_processadas: personas.length,
                competencias_inseridas: totalCompetenciasInseridas
            };

        } catch (error) {
            console.error(`❌ Erro ao gerar competências: ${error.message}`);
            throw error;
        }
    }

    determinarNivelExperiencia(role) {
        if (role.includes('Chief') || role === 'CEO') return 'expert';
        if (role.includes('Manager') || role.includes('Specialist')) return 'avancado';
        if (role.includes('Assistant')) return 'intermediario';
        return 'avancado'; // default
    }

    determinarAreasFoco(department, specialty) {
        const areas = [department];
        if (specialty && specialty !== department) {
            areas.push(specialty);
        }
        return areas;
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    let empresaId = null;

    // Processar argumentos
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--empresaId') {
            empresaId = args[i + 1];
            i++; // Skip next argument
        }
    }

    if (!empresaId) {
        console.error('❌ Erro: --empresaId é obrigatório');
        console.log('Uso: node generate_competencias_simple.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de competências...');
        
        const generator = new CompetenciasGeneratorSimple();
        const result = await generator.gerarCompetenciasParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} personas processadas`);
        
        process.exit(0);
    } catch (error) {
        console.error(`💥 Erro na execução: ${error.message}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { CompetenciasGeneratorSimple };