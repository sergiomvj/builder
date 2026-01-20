#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { normalizeNationality, fallbackFromCountryCode } = require('../lib/normalizeNationality.cjs');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configuração da OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
    console.error('OPENAI_API_KEY:', !!openaiApiKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

class BiografiasGenerator {
    constructor() {
        // Templates de personalidade por role
        this.personalidadeTemplates = {
            'CEO': {
                tracos: ['Visionário', 'Determinado', 'Carismático', 'Estratégico'],
                motivacoes: ['Crescimento da empresa', 'Inovação', 'Liderança de mercado'],
                desafios: ['Competição', 'Expansão global', 'Transformação digital'],
                estilo_comunicacao: 'Inspirador e direto',
                idade_range: [35, 55],
                experiencia_range: [10, 25]
            },
            'CTO': {
                tracos: ['Inovador', 'Analítico', 'Técnico', 'Visionário tecnológico'],
                motivacoes: ['Inovação tecnológica', 'Eficiência', 'Escalabilidade'],
                desafios: ['Modernização de sistemas', 'Segurança', 'Performance'],
                estilo_comunicacao: 'Técnico e preciso',
                idade_range: [32, 50],
                experiencia_range: [8, 20]
            },
            'CFO': {
                tracos: ['Analítico', 'Detalhista', 'Conservador', 'Estratégico'],
                motivacoes: ['Estabilidade financeira', 'Crescimento sustentável', 'Eficiência'],
                desafios: ['Controle de custos', 'Investimentos', 'Compliance'],
                estilo_comunicacao: 'Preciso e baseado em dados',
                idade_range: [35, 55],
                experiencia_range: [10, 22]
            },
            'COO': {
                tracos: ['Organizador', 'Eficiente', 'Prático', 'Orientado a resultados'],
                motivacoes: ['Eficiência operacional', 'Qualidade', 'Otimização'],
                desafios: ['Processos complexos', 'Coordenação', 'Qualidade'],
                estilo_comunicacao: 'Claro e objetivo',
                idade_range: [33, 52],
                experiencia_range: [9, 20]
            },
            'CMO': {
                tracos: ['Criativo', 'Comunicativo', 'Estratégico', 'Orientado ao cliente'],
                motivacoes: ['Brand awareness', 'Crescimento de vendas', 'Inovação'],
                desafios: ['Digital transformation', 'ROI de marketing', 'Customer experience'],
                estilo_comunicacao: 'Persuasivo e criativo',
                idade_range: [30, 48],
                experiencia_range: [7, 18]
            },
            'Manager': {
                tracos: ['Líder', 'Comunicativo', 'Organizador', 'Motivador'],
                motivacoes: ['Desenvolvimento de equipe', 'Resultados', 'Eficiência'],
                desafios: ['Gestão de pessoas', 'Metas', 'Recursos limitados'],
                estilo_comunicacao: 'Colaborativo e claro',
                idade_range: [28, 45],
                experiencia_range: [5, 15]
            },
            'Analyst': {
                tracos: ['Analítico', 'Detalhista', 'Curioso', 'Metódico'],
                motivacoes: ['Insights precisos', 'Melhoria contínua', 'Dados confiáveis'],
                desafios: ['Complexidade de dados', 'Prazos', 'Precisão'],
                estilo_comunicacao: 'Técnico e estruturado',
                idade_range: [24, 35],
                experiencia_range: [2, 8]
            },
            'Specialist': {
                tracos: ['Especialista', 'Focado', 'Técnico', 'Atualizado'],
                motivacoes: ['Excelência técnica', 'Inovação', 'Especialização'],
                desafios: ['Atualização constante', 'Complexidade técnica', 'Resultados'],
                estilo_comunicacao: 'Técnico e especializado',
                idade_range: [25, 40],
                experiencia_range: [3, 12]
            },
            'Assistant': {
                tracos: ['Organizado', 'Proativo', 'Detalhista', 'Comunicativo'],
                motivacoes: ['Suporte eficiente', 'Organização', 'Crescimento profissional'],
                desafios: ['Multitarefas', 'Priorização', 'Suporte a múltiplas pessoas'],
                estilo_comunicacao: 'Claro e prestativo',
                idade_range: [22, 35],
                experiencia_range: [1, 8]
            }
        };

        // Nacionalidades por país
        this.nacionalidadesPorPais = {
            'US': ['Americana', 'Mexicana-Americana', 'Canadense-Americana', 'Brasileira-Americana'],
            'BR': ['Brasileira', 'Portuguesa', 'Italiana', 'Alemã'],
            'CA': ['Canadense', 'Francesa-Canadense', 'Inglesa-Canadense'],
            'GB': ['Inglesa', 'Escocesa', 'Galesa', 'Irlandesa'],
            'DE': ['Alemã', 'Turca-Alemã', 'Italiana-Alemã'],
            'FR': ['Francesa', 'Magrebina-Francesa', 'Africana-Francesa'],
            'IT': ['Italiana', 'Romena-Italiana', 'Albanesa-Italiana'],
            'ES': ['Espanhola', 'Catalã', 'Latino-Americana'],
            'MX': ['Mexicana', 'Americana-Mexicana', 'Espanhola-Mexicana']
        };
    }

    gerarParametrosPessoa(persona, empresa) {
        const template = this.personalidadeTemplates[persona.role] || this.personalidadeTemplates['Assistant'];
        const nacionalidades = this.nacionalidadesPorPais[empresa.pais] || [fallbackFromCountryCode(empresa.pais)];
        
        const idade = this.randomBetween(template.idade_range[0], template.idade_range[1]);
        const experiencia = this.randomBetween(template.experiencia_range[0], template.experiencia_range[1]);
        
        return {
            idade,
            experiencia_anos: experiencia,
            nacionalidade: this.randomChoice(nacionalidades),
            personalidade: template.tracos.join(', '),
            motivacoes: template.motivacoes,
            desafios: template.desafios,
            estilo_comunicacao: template.estilo_comunicacao,
            formacao: this.gerarFormacao(persona.role, persona.specialty),
            idiomas: this.gerarIdiomas(empresa.pais),
            hobbies: this.gerarHobbies(template.tracos),
            valores: this.gerarValores(persona.role)
        };
    }

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    gerarFormacao(role, specialty) {
        const formacoesPorRole = {
            'CEO': ['MBA em Administração', 'Engenharia + MBA', 'Economia + MBA'],
            'CTO': ['Ciência da Computação', 'Engenharia de Software', 'Sistemas de Informação'],
            'CFO': ['Administração', 'Contabilidade + MBA', 'Economia + CPA'],
            'COO': ['Engenharia Industrial', 'Administração', 'Gestão de Operações'],
            'CMO': ['Marketing', 'Comunicação Social', 'Publicidade e Propaganda'],
            'Manager': ['Administração', 'Gestão', specialty],
            'Analyst': ['Análise de Dados', specialty, 'Estatística'],
            'Specialist': [specialty, 'Especialização técnica', 'Certificações'],
            'Assistant': ['Administração', 'Secretariado', 'Comunicação']
        };
        
        const opcoes = formacoesPorRole[role] || ['Graduação relacionada'];
        return this.randomChoice(opcoes);
    }

    gerarIdiomas(pais) {
        const idiomasPorPais = {
            'US': ['Inglês (nativo)', 'Espanhol (intermediário)'],
            'BR': ['Português (nativo)', 'Inglês (avançado)', 'Espanhol (básico)'],
            'CA': ['Inglês (nativo)', 'Francês (avançado)'],
            'GB': ['Inglês (nativo)', 'Francês (intermediário)'],
            'DE': ['Alemão (nativo)', 'Inglês (avançado)'],
            'FR': ['Francês (nativo)', 'Inglês (avançado)'],
            'IT': ['Italiano (nativo)', 'Inglês (avançado)'],
            'ES': ['Espanhol (nativo)', 'Inglês (avançado)'],
            'MX': ['Espanhol (nativo)', 'Inglês (avançado)']
        };
        
        return idiomasPorPais[pais] || ['Inglês (avançado)'];
    }

    gerarHobbies(tracos) {
        const hobbiesPorTipo = {
            'Visionário': ['Leitura de livros de negócios', 'Networking', 'Viagens'],
            'Analítico': ['Xadrez', 'Sudoku', 'Programação pessoal'],
            'Criativo': ['Fotografia', 'Design', 'Arte'],
            'Organizador': ['Jardinagem', 'Organização de eventos', 'Planejamento'],
            'Técnico': ['Tecnologia', 'Gaming', 'Eletrônicos']
        };
        
        return ['Fitness', 'Leitura', 'Família']; // Base comum + específicos
    }

    gerarValores(role) {
        const valoresPorRole = {
            'CEO': ['Liderança', 'Integridade', 'Inovação', 'Resultados'],
            'CTO': ['Inovação', 'Qualidade', 'Eficiência', 'Tecnologia'],
            'CFO': ['Precisão', 'Transparência', 'Responsabilidade', 'Estabilidade'],
            'Manager': ['Colaboração', 'Desenvolvimento', 'Resultados', 'Comunicação'],
            'Assistant': ['Suporte', 'Organização', 'Confiabilidade', 'Crescimento']
        };
        
        return valoresPorRole[role] || ['Profissionalismo', 'Ética', 'Qualidade'];
    }

    async gerarBiografiaComIA(persona, empresa, parametros) {
        const prompt = `
Gere uma biografia profissional realista e detalhada para esta persona:

**DADOS BÁSICOS:**
- Nome: ${persona.full_name}
- Cargo: ${persona.role} (${persona.specialty})
- Empresa: ${empresa.nome} (${empresa.industria})
- Departamento: ${persona.department}
- País: ${empresa.pais}

**PARÂMETROS PESSOAIS:**
- Idade: ${parametros.idade} anos
- Nacionalidade: ${parametros.nacionalidade}
- Experiência: ${parametros.experiencia_anos} anos
- Formação: ${parametros.formacao}
- Personalidade: ${parametros.personalidade}
- Idiomas: ${parametros.idiomas.join(', ')}

**CONTEXTO PROFISSIONAL:**
- Motivações: ${parametros.motivacoes.join(', ')}
- Principais desafios: ${parametros.desafios.join(', ')}
- Estilo de comunicação: ${parametros.estilo_comunicacao}
- Valores: ${parametros.valores.join(', ')}

**INSTRUÇÕES:**
1. Crie uma biografia de 800-1200 palavras
2. Inclua background educacional e experiências anteriores
3. Descreva a trajetória profissional até o cargo atual
4. Mencione conquistas e desafios superados
5. Inclua aspectos pessoais (família, hobbies) de forma natural
6. Use tom profissional mas humano
7. Faça conexões com a indústria ${empresa.industria}
8. Considere o contexto cultural do país ${empresa.pais}

**FORMATO:** Texto corrido em português brasileiro, dividido em parágrafos naturais.
`;

        try {
            console.log(`🤖 Gerando biografia AI para ${persona.full_name}...`);
            
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Você é um especialista em criar biografias profissionais realistas e envolventes para personas corporativas. Sua especialidade é criar histórias críveis que combinam dados profissionais com aspectos humanos autênticos."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error(`❌ Erro ao gerar biografia AI: ${error.message}`);
            // Fallback para biografia básica se a IA falhar
            return this.gerarBiografiaBasica(persona, empresa, parametros);
        }
    }

    gerarBiografiaBasica(persona, empresa, parametros) {
        return `
**${persona.full_name}** é ${persona.role} da ${empresa.nome}, trazendo ${parametros.experiencia_anos} anos de experiência em ${persona.specialty}. 

Com formação em ${parametros.formacao}, ${persona.full_name.split(' ')[0]} desenvolveu uma carreira sólida focada em ${parametros.motivacoes.join(' e ')}.

Sua abordagem ${parametros.estilo_comunicacao.toLowerCase()} tem sido fundamental para enfrentar desafios como ${parametros.desafios.join(', ')}.

${persona.full_name.split(' ')[0]} é conhecido(a) por sua personalidade ${parametros.personalidade.toLowerCase()} e pelos valores de ${parametros.valores.join(', ').toLowerCase()}.

Fluente em ${parametros.idiomas.join(' e ')}, combina experiência técnica com visão estratégica para impulsionar resultados na ${empresa.industria}.
        `.trim();
    }

    async gerarBiografiasParaEmpresa(empresaId) {
        try {
            console.log(`📝 Gerando biografias para empresa: ${empresaId}`);

            // Buscar empresa
            const { data: empresas, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId);

            if (empresaError || !empresas || empresas.length === 0) {
                throw new Error(`Empresa não encontrada: ${empresaError?.message || 'ID inválido'}`);
            }

            const empresa = empresas[0];
            console.log(`🏢 Empresa: ${empresa.nome} (${empresa.codigo})`);

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

            const biografiasResult = {
                empresa: {
                    id: empresa.id,
                    codigo: empresa.codigo,
                    nome: empresa.nome,
                    industria: empresa.industria,
                    pais: empresa.pais
                },
                data_processamento: new Date().toISOString(),
                total_personas: personas.length,
                personas: {}
            };

            // Gerar biografias para cada persona
            let processadas = 0;
            for (const persona of personas) {
                console.log(`\n📝 ${processadas + 1}/${personas.length} - Processando: ${persona.full_name} (${persona.role})`);
                
                // Gerar parâmetros personalizados
                    const parametros = this.gerarParametrosPessoa(persona, empresa);
                    // Normalize nationality to a canonical single-value before using in prompts / saving
                    try {
                        parametros.nacionalidade = normalizeNationality(parametros.nacionalidade, empresa.pais);
                    } catch (e) {
                        console.warn('⚠️ Aviso: falha ao normalizar nacionalidade, mantendo original:', parametros.nacionalidade);
                    }
                
                // Gerar biografia com IA
                const biografia = await this.gerarBiografiaComIA(persona, empresa, parametros);
                
                // Salvar no resultado
                biografiasResult.personas[persona.persona_code] = {
                    info: {
                        nome: persona.full_name,
                        role: persona.role,
                        department: persona.department,
                        specialty: persona.specialty,
                        email: persona.email,
                        whatsapp: persona.whatsapp
                    },
                    parametros_pessoais: parametros,
                    biografia_completa: biografia,
                    data_geracao: new Date().toISOString()
                };

                // Atualizar persona no banco com a biografia
                const { error: updateError } = await supabase
                    .from('personas')
                    .update({
                        biografia_completa: biografia,
                        personalidade: parametros.personalidade,
                        experiencia_anos: parametros.experiencia_anos,
                        nacionalidade: parametros.nacionalidade,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', persona.id);

                if (updateError) {
                    console.warn(`⚠️ Erro ao salvar biografia no banco: ${updateError.message}`);
                } else {
                    console.log(`✅ Biografia salva no banco para ${persona.full_name}`);
                }

                processadas++;
                
                // Pequeno delay para evitar rate limit da API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Salvar arquivo de biografias
            const outputDir = path.join(__dirname, '..', 'biografias_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `biografias_${empresa.codigo}.json`);
            await fs.writeFile(outputFile, JSON.stringify(biografiasResult, null, 2), 'utf8');

            console.log(`\n🎉 Biografias geradas com sucesso!`);
            console.log(`📁 Arquivo salvo: ${outputFile}`);
            console.log(`👥 ${processadas} personas processadas`);

            return {
                success: true,
                file: outputFile,
                personas_processadas: processadas
            };

        } catch (error) {
            console.error(`❌ Erro ao gerar biografias: ${error.message}`);
            throw error;
        }
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
        console.log('Uso: node generate_biografias.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de biografias...');
        console.log('🔑 APIs configuradas:');
        console.log('- Supabase: ✅');
        console.log('- OpenAI: ✅');
        
        const generator = new BiografiasGenerator();
        const result = await generator.gerarBiografiasParaEmpresa(empresaId);
        
        console.log(`\n🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} biografias geradas`);
        
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

module.exports = { BiografiasGenerator };