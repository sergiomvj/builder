#!/usr/bin/env node
/**
 * 🔄 SCRIPT 06 - GERAÇÃO DE FLUXOS SDR (Robusto)
 * ==============================================
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔄 SCRIPT 06 - GERAÇÃO DE FLUXOS SDR (Robusto)');
console.log('===============================================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Templates de fluxos por role
const fluxosTemplates = {
    'SDR': {
        categoria: "Vendas e Prospecção",
        fluxos: [
            {
                nome: "Cold Outreach Sequence",
                descricao: "Sequência de 7 touchpoints para prospects frios",
                tipo: "prospeccao",
                etapas: [
                    { ordem: 1, acao: "LinkedIn connection request", tempo: "Day 1", personalizacao: "Alta" },
                    { ordem: 2, acao: "Follow-up message", tempo: "Day 3", personalizacao: "Media" },
                    { ordem: 3, acao: "Email outreach", tempo: "Day 7", personalizacao: "Alta" },
                    { ordem: 4, acao: "Phone call", tempo: "Day 10", personalizacao: "Alta" },
                    { ordem: 5, acao: "Email follow-up", tempo: "Day 14", personalizacao: "Media" },
                    { ordem: 6, acao: "Video message", tempo: "Day 21", personalizacao: "Alta" },
                    { ordem: 7, acao: "Final touch", tempo: "Day 30", personalizacao: "Media" }
                ],
                kpis: ["Response rate", "Connection rate", "Meeting booked"],
                ferramentas: ["LinkedIn Sales Navigator", "Outreach", "CRM"]
            },
            {
                nome: "Qualification Framework",
                descricao: "Framework BANT para qualificação de leads",
                tipo: "qualificacao",
                etapas: [
                    { ordem: 1, acao: "Budget qualification", criterio: "Budget authority", questoes: ["What's your budget range?", "Who controls the budget?"] },
                    { ordem: 2, acao: "Authority identification", criterio: "Decision maker", questoes: ["Who else is involved?", "What's the decision process?"] },
                    { ordem: 3, acao: "Need assessment", criterio: "Pain points", questoes: ["What challenges are you facing?", "What's the impact?"] },
                    { ordem: 4, acao: "Timeline definition", criterio: "Urgency", questoes: ["When do you need this?", "What happens if you wait?"] }
                ],
                resultado: ["Qualified lead", "Not qualified", "Needs nurturing"],
                proximos_passos: ["Schedule demo", "Send proposal", "Add to nurture campaign"]
            }
        ]
    },
    'Manager': {
        categoria: "Gestão de Vendas",
        fluxos: [
            {
                nome: "Pipeline Review Process",
                descricao: "Processo semanal de revisão de pipeline",
                tipo: "gestao",
                etapas: [
                    { ordem: 1, acao: "Individual 1:1s", tempo: "Segunda", foco: "Deal review e coaching" },
                    { ordem: 2, acao: "Team pipeline call", tempo: "Terça", foco: "Forecast e priorities" },
                    { ordem: 3, acao: "Deal strategy sessions", tempo: "Quarta", foco: "Complex deals" },
                    { ordem: 4, acao: "Performance analysis", tempo: "Quinta", foco: "Metrics e trends" },
                    { ordem: 5, acao: "Week planning", tempo: "Sexta", foco: "Next week priorities" }
                ],
                metricas: ["Pipeline value", "Win rate", "Sales velocity", "Activity metrics"],
                decisoes: ["Forecast adjustments", "Resource allocation", "Coaching priorities"]
            }
        ]
    },
    'Default': {
        categoria: "Processos Gerais",
        fluxos: [
            {
                nome: "Customer Success Follow-up",
                descricao: "Processo de acompanhamento pós-venda",
                tipo: "pos_venda",
                etapas: [
                    { ordem: 1, acao: "Onboarding call", tempo: "Week 1", objetivo: "Setup success" },
                    { ordem: 2, acao: "Check-in call", tempo: "Week 4", objetivo: "Address issues" },
                    { ordem: 3, acao: "Value review", tempo: "Week 12", objetivo: "Measure ROI" },
                    { ordem: 4, acao: "Renewal planning", tempo: "Month 10", objetivo: "Expansion opportunity" }
                ],
                entregaveis: ["Success metrics", "Satisfaction score", "Renewal likelihood"],
                escalacao: ["Technical issues", "Commercial discussions", "Strategic planning"]
            }
        ]
    }
};

function mapearRoleParaFluxo(role) {
    const roleUpper = role.toUpperCase();
    
    if (roleUpper.includes('SDR') || roleUpper.includes('SALES') || roleUpper.includes('BDR')) return 'SDR';
    if (roleUpper.includes('MANAGER') || roleUpper.includes('DIRECTOR')) return 'Manager';
    
    return 'Default';
}

async function processarFluxosRobusto() {
    try {
        // Buscar personas
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
            .eq('status', 'active');

        if (error) {
            throw new Error(`Erro: ${error.message}`);
        }

        console.log(`👥 Total de personas: ${personas.length}`);
        
        // Filtrar personas sem fluxos
        const personasSemFluxos = personas.filter(p => !p.ia_config?.fluxos_sdr);
        console.log(`🔄 Personas sem fluxos: ${personasSemFluxos.length}`);
        
        let processadas = 0;
        let errors = 0;

        for (const persona of personasSemFluxos) {
            try {
                console.log(`\n🔄 Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = mapearRoleParaFluxo(persona.role);
                const template = fluxosTemplates[templateKey];
                
                const fluxosData = {
                    categoria: template.categoria,
                    persona_role: persona.role,
                    fluxos: template.fluxos.map(f => ({
                        ...f,
                        id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        status: 'active',
                        created_at: new Date().toISOString()
                    })),
                    contexto: {
                        department: persona.department,
                        specialty: persona.specialty,
                        experience_years: persona.experiencia_anos
                    },
                    template_usado: templateKey,
                    generated_at: new Date().toISOString()
                };

                const currentIaConfig = persona.ia_config || {};
                const { error: updateError } = await supabase
                    .from('personas')
                    .update({
                        ia_config: {
                            ...currentIaConfig,
                            fluxos_sdr: fluxosData
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', persona.id);

                if (updateError) {
                    console.error(`❌ Erro: ${updateError.message}`);
                    errors++;
                } else {
                    console.log(`✅ Sucesso: ${template.fluxos.length} fluxos adicionados`);
                    processadas++;
                }

                // Pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (personaError) {
                console.error(`❌ Erro processando ${persona.full_name}: ${personaError.message}`);
                errors++;
            }
        }

        console.log(`\n📊 RESULTADO FINAL FLUXOS:`);
        console.log(`=========================`);
        console.log(`✅ Processadas: ${processadas}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📈 Total com fluxos agora: ${personas.length - personasSemFluxos.length + processadas}`);
        
    } catch (error) {
        console.error(`❌ Erro fatal: ${error.message}`);
    }
}

await processarFluxosRobusto();