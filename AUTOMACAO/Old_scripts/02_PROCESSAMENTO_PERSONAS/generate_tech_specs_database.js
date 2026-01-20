#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

class TechSpecsDatabaseGenerator {
    constructor() {
        this.techStackByRole = {
            'Chief Executive Officer': {
                tools: ['Executive Dashboard', 'Salesforce Analytics', 'HubSpot Revenue Analytics', 'Pipeline Analytics', 'Strategic CRM'],
                technologies: ['Business Intelligence', 'Revenue Operations', 'Sales Analytics', 'Executive Reporting'],
                methodologies: ['Strategic Planning', 'Revenue Strategy', 'Sales Leadership', 'Performance Analytics'],
                sales_enablement: ['Revenue Dashboards', 'Sales Performance KPIs', 'Pipeline Visibility', 'Strategic Forecasting']
            },
            'Chief Technology Officer': {
                tools: ['Salesforce Technical Setup', 'API Integration Tools', 'Demo Environments', 'Technical CRM', 'Docker', 'AWS/Azure'],
                technologies: ['CRM Integration', 'Sales Tech Stack', 'Demo Infrastructure', 'Cloud Computing', 'Technical Sales Support'],
                methodologies: ['Technical Sales Methodology', 'Solution Selling', 'Demo Best Practices', 'Technical Leadership'],
                sales_enablement: ['Technical Demos', 'Solution Architecture', 'Technical Objection Handling', 'Product Integration Demos']
            },
            'Chief Financial Officer': {
                tools: ['Salesforce Financial Reports', 'ROI Calculator Tools', 'Budget Planning CRM', 'Financial Analytics Platform'],
                technologies: ['Financial CRM Integration', 'ROI Analytics', 'Budget Management', 'Financial Forecasting'],
                methodologies: ['ROI-Based Selling', 'Financial Justification', 'Budget Cycle Management', 'C-Level Selling'],
                sales_enablement: ['ROI Calculators', 'Financial Presentations', 'Budget Justification Tools', 'Executive Proposals']
            },
            'Chief Operating Officer': {
                tools: ['Process Optimization CRM', 'Operations Analytics', 'Efficiency Tracking Tools', 'Project Management CRM'],
                technologies: ['Operations CRM', 'Process Analytics', 'Efficiency Metrics', 'Operations Intelligence'],
                methodologies: ['Process Improvement Selling', 'Efficiency Consulting', 'Operations Excellence', 'Consultative Selling'],
                sales_enablement: ['Process Improvement ROI', 'Efficiency Case Studies', 'Operations Optimization Demos']
            }
        };
        
        this.defaultTechStack = {
            tools: ['CRM Platform', 'Email Marketing', 'Social Media Tools', 'Analytics Dashboard', 'Communication Tools'],
            technologies: ['Customer Relationship Management', 'Digital Marketing', 'Data Analytics', 'Communication Platforms'],
            methodologies: ['Customer-Centric Approach', 'Data-Driven Decision Making', 'Collaborative Workflows'],
            sales_enablement: ['Customer Insights', 'Performance Tracking', 'Communication Excellence']
        };
    }

    async gerarTechSpecsParaEmpresa(empresaId) {
        try {
            console.log('🔧 Gerando tech specs para empresa:', empresaId);

            // Buscar empresa
            const { data: empresa, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId)
                .single();

            if (empresaError || !empresa) {
                throw new Error('Empresa não encontrada');
            }

            console.log(`📊 Empresa: ${empresa.nome} (${empresa.codigo})`);

            // Buscar personas
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('status', 'active');

            if (personasError) {
                throw new Error(`Erro ao buscar personas: ${personasError.message}`);
            }

            console.log(`👥 Encontradas ${personas.length} personas ativas`);

            // Limpar tech specs existentes
            await this.limparTechSpecsExistentes(empresaId);

            const techSpecsParaInserir = [];

            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const techStack = this.techStackByRole[persona.role] || this.defaultTechStack;
                
                // Criar um tech spec para cada persona
                const techSpec = {
                    empresa_id: empresaId,
                    persona_id: persona.id,
                    role: persona.role,
                    tools: techStack.tools,
                    technologies: techStack.technologies,
                    methodologies: techStack.methodologies,
                    sales_enablement: techStack.sales_enablement,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                techSpecsParaInserir.push(techSpec);
            }

            // Inserir no banco
            const { data: insertedSpecs, error: insertError } = await supabase
                .from('tech_specifications')
                .insert(techSpecsParaInserir)
                .select();

            if (insertError) {
                throw new Error(`Erro ao inserir tech specs: ${insertError.message}`);
            }

            console.log(`✅ Tech specs inseridas no banco com sucesso!`);
            console.log(`📊 Total: ${insertedSpecs.length} tech specs para ${personas.length} personas`);

            return {
                personas_processadas: personas.length,
                tech_specs_criadas: insertedSpecs.length,
                empresa_codigo: empresa.codigo
            };

        } catch (error) {
            console.error('❌ Erro ao gerar tech specs:', error.message);
            throw error;
        }
    }

    async limparTechSpecsExistentes(empresaId) {
        console.log('🗑️ Limpando tech specs existentes...');
        
        const { error: deleteError } = await supabase
            .from('tech_specifications')
            .delete()
            .eq('empresa_id', empresaId);

        if (deleteError && !deleteError.message.includes('relation "tech_specifications" does not exist')) {
            console.warn('⚠️ Aviso ao limpar tech specs:', deleteError.message);
        }
    }
}

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
        console.log('Uso: node generate_tech_specs_database.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de tech specs no banco...');
        
        const generator = new TechSpecsDatabaseGenerator();
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

module.exports = { TechSpecsDatabaseGenerator };