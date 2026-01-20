#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

class TechSpecsGenerator {
    constructor() {
        // Tech stack com foco em sales enablement e modelo SDR híbrido
        this.techStackByRole = {
            'CEO': {
                tools: ['Executive Dashboard', 'Salesforce Analytics', 'HubSpot Revenue Analytics', 'Pipeline Analytics', 'Strategic CRM'],
                technologies: ['Business Intelligence', 'Revenue Operations', 'Sales Analytics', 'Executive Reporting'],
                methodologies: ['Strategic Planning', 'Revenue Strategy', 'Sales Leadership', 'Performance Analytics'],
                sales_enablement: ['Revenue Dashboards', 'Sales Performance KPIs', 'Pipeline Visibility', 'Strategic Forecasting']
            },
            'CTO': {
                tools: ['Salesforce Technical Setup', 'API Integration Tools', 'Demo Environments', 'Technical CRM', 'Solution Architecture Tools', 'Docker', 'AWS/Azure'],
                technologies: ['CRM Integration', 'Sales Tech Stack', 'Demo Infrastructure', 'Cloud Computing', 'Technical Sales Support'],
                methodologies: ['Technical Sales Methodology', 'Solution Selling', 'Demo Best Practices', 'Technical Leadership'],
                sales_enablement: ['Technical Demos', 'Solution Architecture', 'Technical Objection Handling', 'Product Integration Demos'],
                prospecting_tools: ['LinkedIn Sales Navigator', 'Technical Contact Databases', 'Engineer-focused Outreach Tools']
            },
            'CFO': {
                tools: ['Salesforce Financial Reports', 'ROI Calculator Tools', 'Budget Planning CRM', 'Financial Analytics Platform', 'Excel Advanced', 'Financial Modeling Tools'],
                technologies: ['Financial CRM Integration', 'ROI Analytics', 'Budget Management', 'Financial Forecasting'],
                methodologies: ['ROI-Based Selling', 'Financial Justification', 'Budget Cycle Management', 'C-Level Selling'],
                sales_enablement: ['ROI Calculators', 'Financial Presentations', 'Budget Justification Tools', 'Executive Proposals'],
                prospecting_tools: ['Executive Contact Tools', 'CFO Network Platforms', 'Financial Industry Databases']
            },
            'COO': {
                tools: ['Process Optimization CRM', 'Operations Analytics', 'Efficiency Tracking Tools', 'Project Management CRM', 'Process Mapping Tools'],
                technologies: ['Operations CRM', 'Process Analytics', 'Efficiency Metrics', 'Operations Intelligence'],
                methodologies: ['Process Improvement Selling', 'Efficiency Consulting', 'Operations Excellence', 'Consultative Selling'],
                sales_enablement: ['Process Improvement ROI', 'Efficiency Case Studies', 'Operations Optimization Demos'],
                prospecting_tools: ['Operations Director Contacts', 'Industry-specific Process Tools']
            },
            'CMO': {
                tools: ['HubSpot Marketing', 'Salesforce Marketing Cloud', 'Google Analytics', 'Marketing Automation', 'Social Selling Tools'],
                technologies: ['Marketing CRM', 'Lead Generation', 'Marketing Analytics', 'Social Selling'],
                methodologies: ['Inbound Selling', 'Social Selling', 'Content-Based Selling', 'Marketing-Sales Alignment'],
                sales_enablement: ['Marketing Qualified Leads', 'Content for Sales', 'Social Proof Tools'],
                prospecting_tools: ['Social Media Prospecting', 'Content-based Outreach', 'Marketing Network Tools']
            },
            'Specialist': {
                tools: ['Specialized CRM Modules', 'Technical Support Tools', 'Knowledge Base Systems', 'Demo Support Platforms'],
                technologies: ['Technical CRM', 'Support Integration', 'Knowledge Management', 'Technical Documentation'],
                methodologies: ['Technical Support Selling', 'Solution Support', 'Technical Consulting', 'Product Expertise'],
                sales_enablement: ['Technical Documentation', 'Solution Support', 'Product Training Materials', 'Technical FAQs'],
                support_areas: ['Technical Training', 'Solution Architecture', 'Product Demonstrations', 'Technical Objection Handling']
            },
            'Assistant': {
                tools: ['Salesforce Assistant Tools', 'Calendar Scheduling', 'CRM Data Entry', 'Lead Research Tools', 'Appointment Setting Software', 'Communication Platforms'],
                technologies: ['CRM Administration', 'Sales Support Systems', 'Communication Tools', 'Data Management'],
                methodologies: ['SDR Best Practices', 'Lead Qualification', 'Appointment Setting', 'Pipeline Management', 'Executive Support'],
                sales_enablement: ['Lead Research Tools', 'Appointment Scheduling', 'CRM Management', 'Pipeline Tracking'],
                prospecting_tools: ['LinkedIn Sales Navigator', 'Lead Research Platforms', 'Email Sequencing Tools', 'Appointment Setting Systems', 'CRM Data Tools'],
                sdr_focus: 'Executive Support & Lead Management'
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

    async gerarTechSpecsParaEmpresa(empresaId) {
        try {
            console.log(`🔧 Gerando tech specs para empresa: ${empresaId}`);

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

            // Gerar tech specs para cada persona
            const techSpecsResult = {
                empresa: {
                    id: empresa.id,
                    codigo: empresa.codigo,
                    nome: empresa.nome
                },
                data_processamento: new Date().toISOString(),
                total_personas: personas.length,
                personas: {}
            };

            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = this.mapearRoleParaTemplate(persona.role);
                const nivelPersona = this.determinarNivelPersona(persona.role);
                const techStack = this.techStackByRole[templateKey] || this.techStackByRole['Assistant'];
                
                // Base tech specs do template
                let tools = [...techStack.tools];
                let technologies = [...techStack.technologies];
                let methodologies = [...techStack.methodologies];
                let salesEnablement = [...(techStack.sales_enablement || [])];
                let prospectingTools = [...(techStack.prospecting_tools || [])];
                let supportAreas = [...(techStack.support_areas || [])];

                techSpecsResult.personas[persona.persona_code] = {
                    info: {
                        nome: persona.full_name,
                        role: persona.role,
                        department: persona.department,
                        specialty: persona.specialty,
                        nivel: nivelPersona,
                        template_usado: templateKey
                    },
                    tech_specs: {
                        tools: tools,
                        technologies: technologies,
                        methodologies: methodologies,
                        sales_enablement: salesEnablement,
                        prospecting_tools: prospectingTools,
                        support_areas: supportAreas
                    },
                    sdr_tech_info: {
                        has_sdr_tools: prospectingTools.length > 0,
                        has_sales_enablement: salesEnablement.length > 0,
                        sales_focus: techStack.sdr_focus || null,
                        tech_specialization: templateKey
                    },
                    infrastructure: this.gerarInfraestrutura(templateKey),
                    integration_points: this.gerarPontosIntegracao(templateKey)
                };
            }

            // Salvar arquivo de tech specs
            const outputDir = path.join(__dirname, '..', 'tech_specs_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `tech_specs_${empresa.codigo}.json`);
            await fs.writeFile(outputFile, JSON.stringify(techSpecsResult, null, 2), 'utf8');

            console.log(`✅ Tech specs geradas com sucesso!`);
            console.log(`📁 Arquivo salvo: ${outputFile}`);

            return {
                success: true,
                file: outputFile,
                personas_processadas: personas.length
            };

        } catch (error) {
            console.error(`❌ Erro ao gerar tech specs: ${error.message}`);
            throw error;
        }
    }

    gerarInfraestrutura(role) {
        const infraByRole = {
            'CEO': ['Executive Dashboard', 'Revenue Analytics Server', 'Secure Communication', 'Strategic Reporting Platform'],
            'CTO': ['Cloud Infrastructure', 'Demo Environment', 'Technical Integration Platform', 'Solution Architecture Tools'],
            'CFO': ['Financial CRM Integration', 'ROI Calculation Platform', 'Secure Financial Database', 'Budget Analytics'],
            'COO': ['Operations CRM', 'Process Optimization Platform', 'Efficiency Analytics', 'Quality Management'],
            'CMO': ['Marketing CRM Platform', 'Lead Generation Infrastructure', 'Social Selling Platform', 'Content Management'],
            'Specialist': ['Technical Support Platform', 'Knowledge Base System', 'Demo Support Infrastructure'],
            'Assistant': ['CRM Administrative Platform', 'Lead Management System', 'Appointment Scheduling Infrastructure', 'Communication Hub']
        };
        return infraByRole[role] || ['Standard CRM Workstation', 'Sales Communication Tools', 'Lead Management Setup'];
    }

    gerarPontosIntegracao(role) {
        const integrationByRole = {
            'CEO': ['CRM Integration', 'BI Tools', 'Financial Systems', 'Revenue Analytics', 'Strategic Dashboards'],
            'CTO': ['CRM-Tech Integration', 'Demo Environment Sync', 'Technical Documentation Platform', 'Solution Database'],
            'CFO': ['CRM-Financial Integration', 'ROI Calculator API', 'Budget Planning Sync', 'Financial Reporting'],
            'COO': ['CRM-Operations Integration', 'Process Tracking Sync', 'Efficiency Metrics API', 'Quality Systems'],
            'CMO': ['Marketing-CRM Integration', 'Lead Scoring Sync', 'Social Media Integration', 'Content-Sales Sync'],
            'Specialist': ['Technical CRM Integration', 'Support Ticket Sync', 'Knowledge Base API', 'Product Data Sync'],
            'Assistant': ['Full CRM Integration', 'Calendar Sync', 'Email Integration', 'Lead Research API', 'Communication Platform Sync']
        };
        return integrationByRole[role] || ['Basic CRM Integration', 'Email Sync', 'Calendar Integration'];
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
        console.log('Uso: node generate_tech_specs_simple.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de tech specs...');
        
        const generator = new TechSpecsGenerator();
        const result = await generator.gerarTechSpecsParaEmpresa(empresaId);
        
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

module.exports = { TechSpecsGenerator };