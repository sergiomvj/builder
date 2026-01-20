#!/usr/bin/env node
/**
 * 🎯 SCRIPT 2 - GERAÇÃO DE PERSONAS REAIS 
 * =======================================
 * 
 * Gera personas com NOMES REAIS, características físicas e comportamentais completas
 * Lê dados da empresa e funções do banco para criar pessoas adequadas aos cargos
 * 
 * FLUXO: empresas + funcoes (banco) + configs personas → personas (banco)
 * 
 * @author Sergio Castro
 * @version 2.0.0 (Fluxo Sistêmico)
 * @date 2024-11-15
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const { normalizeNationality, fallbackFromCountryCode } = require('../lib/normalizeNationality.cjs');

class PersonasRealGenerator {
    constructor() {
        // Configurações fixas para geração de personas reais
        this.personasConfig = {
            nomes_masculinos: [
                'João Silva', 'Carlos Santos', 'Roberto Oliveira', 'Fernando Costa', 'Eduardo Lima',
                'Rafael Souza', 'Marcelo Ferreira', 'André Martins', 'Paulo Rodrigues', 'Bruno Alves',
                'Lucas Pereira', 'Diego Araújo', 'Thiago Barbosa', 'Gustavo Ramos', 'Leonardo Campos'
            ],
            nomes_femininos: [
                'Ana Silva', 'Maria Santos', 'Juliana Oliveira', 'Carla Costa', 'Patricia Lima',
                'Fernanda Souza', 'Luciana Ferreira', 'Camila Martins', 'Renata Rodrigues', 'Daniela Alves',
                'Priscila Pereira', 'Vanessa Araújo', 'Tatiana Barbosa', 'Gabriela Ramos', 'Alessandra Campos',
                'Carolina Silva', 'Beatriz Santos', 'Larissa Oliveira', 'Mariana Costa', 'Amanda Lima'
            ],
            caracteristicas_fisicas: {
                altura: ['1.65m', '1.70m', '1.75m', '1.80m', '1.85m', '1.60m', '1.68m', '1.72m'],
                cabelo: ['castanho', 'loiro', 'preto', 'ruivo', 'grisalho'],
                olhos: ['castanhos', 'azuis', 'verdes', 'mel', 'pretos'],
                etnia: ['branco', 'pardo', 'negro', 'asiático', 'indígena'],
                idade: { min: 25, max: 55 }
            },
            caracteristicas_comportamentais: {
                executivo: [
                    'Visionário e estratégico',
                    'Comunicador persuasivo',
                    'Tomador de decisões ágil',
                    'Líder inspirador',
                    'Orientado a resultados',
                    'Resiliente sob pressão'
                ],
                especialista: [
                    'Detalhista e preciso',
                    'Analítico e metódico',
                    'Focado em qualidade',
                    'Aprendizagem contínua',
                    'Colaborativo',
                    'Orientado a soluções'
                ],
                assistente: [
                    'Organizadora e proativa',
                    'Comunicação clara',
                    'Multitarefa eficiente',
                    'Atenção aos detalhes',
                    'Suporte dedicado',
                    'Flexível e adaptável'
                ]
            },
            personalidades_sdr: {
                ceo: {
                    estilo_lideranca: 'Visionário estratégico que inspira através de resultados',
                    abordagem_vendas: 'Foca em relacionamentos C-level e decisões estratégicas',
                    comunicacao: 'Direta, inspiradora e orientada a resultados'
                },
                cto: {
                    estilo_lideranca: 'Líder técnico que traduz complexidade em soluções',
                    abordagem_vendas: 'Demonstrations técnicas e proof-of-concepts convincentes',
                    comunicacao: 'Técnica, detalhada e orientada a soluções'
                },
                cfo: {
                    estilo_lideranca: 'Analítico e focado em ROI e sustentabilidade financeira',
                    abordagem_vendas: 'ROI-driven, budget-conscious, data-backed presentations',
                    comunicacao: 'Quantitativa, objetiva e baseada em dados'
                },
                coo: {
                    estilo_lideranca: 'Operacional e orientado a eficiência e processos',
                    abordagem_vendas: 'Process improvement e operational efficiency focus',
                    comunicacao: 'Prática, orientada a resultados e focada em eficiência'
                },
                specialist: {
                    estilo_lideranca: 'Especialista que apoia com conhecimento técnico profundo',
                    abordagem_vendas: 'Technical support durante vendas, product demonstrations',
                    comunicacao: 'Técnica, educativa e orientada a detalhes'
                },
                assistant: {
                    estilo_lideranca: 'Suporte operacional que mantém processos funcionando',
                    abordagem_vendas: 'Lead research, qualification, appointment setting, pipeline management',
                    comunicacao: 'Clara, eficiente e orientada a suporte'
                }
            }
        };

        // Mapping de roles para tipos
        this.roleMapping = {
            'Chief Executive Officer': { tipo: 'ceo', nivel: 'Executive', genero_preferido: 'masculino' },
            'Chief Technology Officer': { tipo: 'cto', nivel: 'Executive', genero_preferido: 'masculino' },
            'Chief Financial Officer': { tipo: 'cfo', nivel: 'Executive', genero_preferido: 'feminino' },
            'Chief Operating Officer': { tipo: 'coo', nivel: 'Executive', genero_preferido: 'masculino' },
            'Chief Marketing Officer': { tipo: 'cmo', nivel: 'Executive', genero_preferido: 'feminino' },
            'Specialist': { tipo: 'specialist', nivel: 'Specialist', genero_preferido: 'masculino' },
            'Assistant': { tipo: 'assistant', nivel: 'Assistant', genero_preferido: 'feminino' }
        };
    }

    gerarCaracteristicasFisicas() {
        const config = this.personasConfig.caracteristicas_fisicas;
        return {
            altura: config.altura[Math.floor(Math.random() * config.altura.length)],
            cabelo: config.cabelo[Math.floor(Math.random() * config.cabelo.length)],
            olhos: config.olhos[Math.floor(Math.random() * config.olhos.length)],
            etnia: config.etnia[Math.floor(Math.random() * config.etnia.length)],
            idade: Math.floor(Math.random() * (config.idade.max - config.idade.min + 1)) + config.idade.min
        };
    }

    gerarCaracteristicasComportamentais(tipoRole) {
        const comportamentais = this.personasConfig.caracteristicas_comportamentais;
        let traits = [];
        
        if (tipoRole === 'ceo' || tipoRole === 'cto' || tipoRole === 'cfo' || tipoRole === 'coo' || tipoRole === 'cmo') {
            traits = comportamentais.executivo;
        } else if (tipoRole === 'specialist') {
            traits = comportamentais.especialista;
        } else {
            traits = comportamentais.assistente;
        }
        
        // Selecionar 3-4 características aleatórias
        const numTraits = Math.floor(Math.random() * 2) + 3;
        const selectedTraits = [];
        const shuffled = [...traits].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numTraits);
    }

    gerarPersonalidadeSDR(tipoRole) {
        return this.personasConfig.personalidades_sdr[tipoRole] || this.personasConfig.personalidades_sdr.assistant;
    }

    selecionarNome(generoPreferido) {
        // 70% chance de usar o gênero preferido, 30% chance de variar
        const usePreferred = Math.random() < 0.7;
        const genero = usePreferred ? generoPreferido : (generoPreferido === 'masculino' ? 'feminino' : 'masculino');
        
        const nomes = genero === 'masculino' ? 
            this.personasConfig.nomes_masculinos : 
            this.personasConfig.nomes_femininos;
        
        return {
            nome: nomes[Math.floor(Math.random() * nomes.length)],
            genero: genero
        };
    }

    gerarEmail(nome, empresa, index) {
        const nomeClean = nome.toLowerCase()
            .replace(/[áàâã]/g, 'a')
            .replace(/[éèê]/g, 'e')
            .replace(/[íì]/g, 'i')
            .replace(/[óòôõ]/g, 'o')
            .replace(/[úù]/g, 'u')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, '.');
        
        const empresaClean = empresa.codigo.toLowerCase();
        return `${nomeClean}.${index}@${empresaClean}.com`;
    }

    gerarWhatsApp() {
        return `+55 11 9${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
    }

    async gerarPersonasParaEmpresa(empresaId) {
        try {
            console.log(`🎯 Gerando personas REAIS para empresa: ${empresaId}`);

            // 1. Buscar empresa
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

            // 2. Verificar personas existentes
            const { data: existingPersonas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId);

            if (personasError) {
                console.error('❌ Erro ao verificar personas existentes:', personasError);
                return;
            }

            if (existingPersonas && existingPersonas.length > 0) {
                console.log(`⚠️ Já existem ${existingPersonas.length} personas para esta empresa`);
                console.log('🔄 Removendo personas existentes...');
                
                await supabase
                    .from('personas')
                    .delete()
                    .eq('empresa_id', empresaId);
            }

            // 3. Definir estrutura de personas baseada no total da empresa
            const totalPersonas = empresa.total_personas || 16;
            const estruturaPersonas = this.definirEstrutura(totalPersonas);

            console.log(`📝 Criando ${totalPersonas} personas reais...`);
            console.log(`📋 Estrutura: CEO(1), Executivos(3), Especialistas(${estruturaPersonas.especialistas}), Assistentes(${estruturaPersonas.assistentes})`);

            const personas = [];
            let personaCounter = 1;

            // 4. CEO (sempre 1)
            const ceoData = this.selecionarNome('masculino');
            const ceoFisicas = this.gerarCaracteristicasFisicas();
            const ceoComportamentais = this.gerarCaracteristicasComportamentais('ceo');
            const ceoPersonalidade = this.gerarPersonalidadeSDR('ceo');

            personas.push({
                empresa_id: empresaId,
                persona_code: `CEO-${empresa.codigo}`,
                full_name: ceoData.nome,
                role: 'Chief Executive Officer',
                department: 'Executive',
                specialty: 'Strategic Leadership & Revenue',
                email: this.gerarEmail(ceoData.nome, empresa, 0),
                whatsapp: this.gerarWhatsApp(),
                status: 'active',
                biografia_completa: `${ceoData.nome} é o CEO visionário da ${empresa.nome}. ${ceoFisicas.idade} anos, ${ceoFisicas.altura}, cabelo ${ceoFisicas.cabelo}, olhos ${ceoFisicas.olhos}. ${ceoComportamentais.join(', ')}. ${ceoPersonalidade.estilo_lideranca}`,
                personalidade: {
                    caracteristicas_fisicas: ceoFisicas,
                    caracteristicas_comportamentais: ceoComportamentais,
                    personalidade_sdr: ceoPersonalidade,
                    genero: ceoData.genero
                }
            });

            // 5. Executivos (3: CTO, CFO, COO)
            const executiveRoles = [
                { role: 'Chief Technology Officer', dept: 'Technology', spec: 'Technical Leadership & Sales' },
                { role: 'Chief Financial Officer', dept: 'Finance', spec: 'Financial Strategy & ROI Sales' },
                { role: 'Chief Operating Officer', dept: 'Operations', spec: 'Operations Excellence & Process Sales' }
            ];

            for (let i = 0; i < executiveRoles.length; i++) {
                const execRole = executiveRoles[i];
                const roleInfo = this.roleMapping[execRole.role];
                const execData = this.selecionarNome(roleInfo.genero_preferido);
                const execFisicas = this.gerarCaracteristicasFisicas();
                const execComportamentais = this.gerarCaracteristicasComportamentais(roleInfo.tipo);
                const execPersonalidade = this.gerarPersonalidadeSDR(roleInfo.tipo);

                personas.push({
                    empresa_id: empresaId,
                    persona_code: `EXEC${i + 1}-${empresa.codigo}`,
                    full_name: execData.nome,
                    role: execRole.role,
                    department: execRole.dept,
                    specialty: execRole.spec,
                    email: this.gerarEmail(execData.nome, empresa, i + 1),
                    whatsapp: this.gerarWhatsApp(),
                    status: 'active',
                    biografia_completa: `${execData.nome} é ${execRole.role} da ${empresa.nome}. ${execFisicas.idade} anos, ${execFisicas.altura}, cabelo ${execFisicas.cabelo}, olhos ${execFisicas.olhos}. ${execComportamentais.join(', ')}. ${execPersonalidade.estilo_lideranca}`,
                    personalidade: {
                        caracteristicas_fisicas: execFisicas,
                        caracteristicas_comportamentais: execComportamentais,
                        personalidade_sdr: execPersonalidade,
                        genero: execData.genero
                    }
                });
            }

            // 6. Especialistas
            for (let i = 0; i < estruturaPersonas.especialistas; i++) {
                const specData = this.selecionarNome('masculino');
                const specFisicas = this.gerarCaracteristicasFisicas();
                const specComportamentais = this.gerarCaracteristicasComportamentais('specialist');
                const specPersonalidade = this.gerarPersonalidadeSDR('specialist');

                personas.push({
                    empresa_id: empresaId,
                    persona_code: `SPEC${i + 1}-${empresa.codigo}`,
                    full_name: specData.nome,
                    role: `Technical Specialist ${i + 1}`,
                    department: 'Technical',
                    specialty: 'Technical Sales Support',
                    email: this.gerarEmail(specData.nome, empresa, 10 + i),
                    whatsapp: this.gerarWhatsApp(),
                    status: 'active',
                    biografia_completa: `${specData.nome} é Especialista Técnico da ${empresa.nome}. ${specFisicas.idade} anos, ${specFisicas.altura}, cabelo ${specFisicas.cabelo}, olhos ${specFisicas.olhos}. ${specComportamentais.join(', ')}. ${specPersonalidade.estilo_lideranca}`,
                    personalidade: {
                        caracteristicas_fisicas: specFisicas,
                        caracteristicas_comportamentais: specComportamentais,
                        personalidade_sdr: specPersonalidade,
                        genero: specData.genero
                    }
                });
            }

            // 7. Assistentes (TODAS femininas conforme modelo SDR)
            for (let i = 0; i < estruturaPersonas.assistentes; i++) {
                const assistData = this.selecionarNome('feminino'); // Força feminino para assistentes
                const assistFisicas = this.gerarCaracteristicasFisicas();
                const assistComportamentais = this.gerarCaracteristicasComportamentais('assistant');
                const assistPersonalidade = this.gerarPersonalidadeSDR('assistant');

                personas.push({
                    empresa_id: empresaId,
                    persona_code: `ASST${i + 1}-${empresa.codigo}`,
                    full_name: assistData.nome,
                    role: `Executive Assistant ${i + 1}`,
                    department: 'Administrative',
                    specialty: 'Executive Support & SDR Operations',
                    email: this.gerarEmail(assistData.nome, empresa, 100 + i),
                    whatsapp: this.gerarWhatsApp(),
                    status: 'active',
                    biografia_completa: `${assistData.nome} é Assistente Executiva da ${empresa.nome}. ${assistFisicas.idade} anos, ${assistFisicas.altura}, cabelo ${assistFisicas.cabelo}, olhos ${assistFisicas.olhos}. ${assistComportamentais.join(', ')}. ${assistPersonalidade.estilo_lideranca}`,
                    personalidade: {
                        caracteristicas_fisicas: assistFisicas,
                        caracteristicas_comportamentais: assistComportamentais,
                        personalidade_sdr: assistPersonalidade,
                        genero: assistData.genero
                    }
                });
            }

            // 8. Inserir todas as personas no banco
            // Ensure each persona has a normalized nationality (fallback to company country)
            for (const p of personas) {
                try {
                    p.nacionalidade = normalizeNationality(p.nacionalidade, empresa.pais);
                } catch (e) {
                    p.nacionalidade = p.nacionalidade || fallbackFromCountryCode(empresa.pais);
                }
            }
            console.log(`💾 Inserindo ${personas.length} personas no banco...`);
            
            const { data: insertedPersonas, error: insertError } = await supabase
                .from('personas')
                .insert(personas)
                .select();

            if (insertError) {
                console.error('❌ Erro ao inserir personas:', insertError);
                return;
            }

            console.log(`✅ ${insertedPersonas.length} personas reais criadas com sucesso!`);
            console.log(`📊 Resumo por gênero:`);
            
            const generoCount = insertedPersonas.reduce((acc, p) => {
                const genero = p.personalidade?.genero || 'indefinido';
                acc[genero] = (acc[genero] || 0) + 1;
                return acc;
            }, {});
            
            Object.entries(generoCount).forEach(([genero, count]) => {
                console.log(`   ${genero}: ${count}`);
            });

            return {
                success: true,
                personas_criadas: insertedPersonas.length,
                empresa_codigo: empresa.codigo,
                personas: insertedPersonas
            };

        } catch (error) {
            console.error(`❌ Erro ao gerar personas: ${error.message}`);
            throw error;
        }
    }

    definirEstrutura(totalPersonas) {
        // CEO (1) + Executivos (3) = 4
        const fixos = 4;
        const restante = totalPersonas - fixos;
        
        // 50% especialistas, 50% assistentes
        const especialistas = Math.floor(restante * 0.4); // Menos especialistas
        const assistentes = restante - especialistas; // Mais assistentes (SDR)
        
        return { especialistas, assistentes };
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
        console.log('Uso: node generate_personas_reais.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de personas REAIS...');
        
        const generator = new PersonasRealGenerator();
        const result = await generator.gerarPersonasParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_criadas} personas reais criadas para ${result.empresa_codigo}`);
        
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

module.exports = { PersonasRealGenerator };