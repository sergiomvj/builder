const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const { normalizeNationality, fallbackFromCountryCode } = require('../lib/normalizeNationality.cjs');

class PersonasRealInternationalGenerator {
    constructor() {
        this.nomesPorPais = {
            'US': {
                masculinos: [
                    'James Wilson', 'Michael Johnson', 'David Smith', 'Robert Brown', 'William Davis',
                    'Christopher Garcia', 'Matthew Miller', 'Anthony Jones', 'Mark Williams', 'Steven Taylor',
                    'Kevin Anderson', 'Brian Thompson', 'Edward White', 'Jason Clark', 'Daniel Martinez',
                    'Timothy Lewis', 'Thomas Walker', 'Charles Hall', 'Joseph Allen', 'Paul Young'
                ],
                femininos: [
                    'Jennifer Wilson', 'Lisa Johnson', 'Michelle Smith', 'Angela Brown', 'Jessica Davis',
                    'Sarah Garcia', 'Karen Miller', 'Linda Jones', 'Nancy Williams', 'Betty Taylor',
                    'Sandra Anderson', 'Ashley Thompson', 'Donna White', 'Carol Clark', 'Ruth Martinez',
                    'Sharon Lewis', 'Maria Walker', 'Helen Hall', 'Laura Allen', 'Patricia Young'
                ]
            },
            'BR': {
                masculinos: [
                    'João Silva', 'Carlos Santos', 'Roberto Oliveira', 'Fernando Costa', 'Eduardo Lima',
                    'Rafael Souza', 'Marcelo Ferreira', 'André Martins', 'Paulo Rodrigues', 'Bruno Alves'
                ],
                femininos: [
                    'Ana Silva', 'Maria Santos', 'Juliana Oliveira', 'Carla Costa', 'Patricia Lima',
                    'Fernanda Souza', 'Luciana Ferreira', 'Camila Martins', 'Renata Rodrigues', 'Daniela Alves'
                ]
            },
            'ES': {
                masculinos: [
                    'José García', 'Antonio Martínez', 'Manuel Rodríguez', 'Francisco López', 'David Sánchez',
                    'Carlos Pérez', 'Miguel González', 'Luis Fernández', 'Pedro Díaz', 'Rafael Moreno'
                ],
                femininos: [
                    'María García', 'Carmen Martínez', 'Josefa Rodríguez', 'Isabel López', 'Ana Sánchez',
                    'Dolores Pérez', 'Pilar González', 'Teresa Fernández', 'Rosa Díaz', 'Concepción Moreno'
                ]
            },
            'FR': {
                masculinos: [
                    'Jean Dupont', 'Pierre Martin', 'Michel Bernard', 'André Dubois', 'Philippe Moreau',
                    'Alain Laurent', 'Jacques Simon', 'François Lefevre', 'René Morel', 'Louis Garcia'
                ],
                femininos: [
                    'Marie Dupont', 'Françoise Martin', 'Monique Bernard', 'Catherine Dubois', 'Nicole Moreau',
                    'Brigitte Laurent', 'Sylvie Simon', 'Martine Lefevre', 'Chantal Morel', 'Isabelle Garcia'
                ]
            }
        };
        
        this.caracteristicasPorPais = {
            'US': {
                alturas: ['5\'6"', '5\'8"', '5\'10"', '6\'0"', '6\'2"', '5\'4"', '5\'7"', '5\'9"'],
                etnias: ['Caucasian', 'Hispanic', 'African American', 'Asian', 'Mixed'],
                cabelos: ['blonde', 'brown', 'black', 'auburn', 'gray'],
                olhos: ['blue', 'brown', 'green', 'hazel', 'gray']
            },
            'BR': {
                alturas: ['1.65m', '1.70m', '1.75m', '1.80m', '1.85m', '1.60m', '1.68m', '1.72m'],
                etnias: ['branco', 'pardo', 'negro', 'asiático', 'indígena'],
                cabelos: ['castanho', 'loiro', 'preto', 'ruivo', 'grisalho'],
                olhos: ['castanhos', 'azuis', 'verdes', 'mel', 'pretos']
            },
            'ES': {
                alturas: ['1.65m', '1.70m', '1.75m', '1.80m', '1.85m', '1.60m', '1.68m', '1.72m'],
                etnias: ['mediterráneo', 'andaluz', 'castellano', 'catalán', 'vasco'],
                cabelos: ['castaño', 'rubio', 'negro', 'pelirrojo', 'gris'],
                olhos: ['marrones', 'azules', 'verdes', 'avellana', 'grises']
            },
            'FR': {
                alturas: ['1.65m', '1.70m', '1.75m', '1.80m', '1.85m', '1.60m', '1.68m', '1.72m'],
                etnias: ['français', 'maghrébin', 'européen', 'africain', 'asiatique'],
                cabelos: ['châtain', 'blond', 'noir', 'roux', 'gris'],
                olhos: ['marron', 'bleus', 'verts', 'noisette', 'gris']
            }
        };
        
        this.roleMapping = {
            'Chief Executive Officer': { genero_preferido: 'masculino', tipo: 'ceo' },
            'Chief Technology Officer': { genero_preferido: 'masculino', tipo: 'executivo' },
            'Chief Financial Officer': { genero_preferido: 'feminino', tipo: 'executivo' },
            'Chief Operating Officer': { genero_preferido: 'feminino', tipo: 'executivo' }
        };
    }

    selecionarNome(genero, pais) {
        const nomes = this.nomesPorPais[pais] || this.nomesPorPais['US']; // default para US
        const lista = genero === 'masculino' ? nomes.masculinos : nomes.femininos;
        const nome = lista[Math.floor(Math.random() * lista.length)];
        return { nome, genero };
    }

    gerarCaracteristicasFisicas(pais) {
        const caracteristicas = this.caracteristicasPorPais[pais] || this.caracteristicasPorPais['US'];
        
        return {
            idade: Math.floor(Math.random() * (55 - 25 + 1)) + 25,
            altura: caracteristicas.alturas[Math.floor(Math.random() * caracteristicas.alturas.length)],
            cabelo: caracteristicas.cabelos[Math.floor(Math.random() * caracteristicas.cabelos.length)],
            olhos: caracteristicas.olhos[Math.floor(Math.random() * caracteristicas.olhos.length)],
            etnia: caracteristicas.etnias[Math.floor(Math.random() * caracteristicas.etnias.length)]
        };
    }

    gerarBiografiaCompleta(persona, empresa, caracteristicas) {
        const experienciaAnos = Math.floor(Math.random() * 15) + 10;
        const educacao = this.gerarEducacao(persona.role, empresa.pais);
        const experiencia = this.gerarExperienciaProfissional(persona.role, experienciaAnos);
        const habilidades = this.gerarHabilidadesComportamentais(persona.role);
        const motivacoes = this.gerarMotivacoes(persona.role);
        
        return `${persona.full_name} é ${persona.role} da ${empresa.nome}. 

📋 PERFIL PESSOAL:
• Idade: ${caracteristicas.idade} anos
• Físico: ${caracteristicas.altura}, cabelo ${caracteristicas.cabelo}, olhos ${caracteristicas.olhos}
• Etnia: ${caracteristicas.etnia}

🎓 EDUCAÇÃO:
${educacao}

💼 EXPERIÊNCIA PROFISSIONAL:
• ${experienciaAnos} anos de experiência na área
${experiencia}

🧠 CARACTERÍSTICAS COMPORTAMENTAIS:
${habilidades.map(h => `• ${h}`).join('\n')}

🎯 MOTIVAÇÕES:
${motivacoes.map(m => `• ${m}`).join('\n')}

💡 FILOSOFIA DE TRABALHO:
• Foco em resultados mensuráveis e crescimento sustentável
• Valoriza colaboração entre equipes e inovação contínua
• Compromisso com excelência operacional e satisfação do cliente

🌟 BACKGROUND PESSOAL:
• Nascido(a) nos Estados Unidos, criado(a) em ambiente multicultural
• Fluente em inglês e espanhol, com conhecimentos básicos de mandarim
• Apaixonado(a) por tecnologia emergente e sustentabilidade empresarial
• Pratica yoga e corrida para manter equilíbrio vida-trabalho
• Voluntário(a) em organizações comunitárias focadas em educação tecnológica`;
    }

    gerarEducacao(role, pais) {
        const educacoesPorPais = {
            'US': ['MBA from Harvard Business School', 'Master in Computer Science from MIT', 'Bachelor in Business Administration from Stanford'],
            'BR': ['MBA pela FGV', 'Mestrado em Administração pela USP', 'Bacharelado em Engenharia pela UNICAMP'],
            'ES': ['MBA por IE Business School', 'Máster en Administración por ESADE', 'Licenciatura en Economía por Universidad Complutense'],
            'FR': ['MBA de HEC Paris', 'Master en Management de ESSEC', 'Diplôme en Commerce de Sciences Po']
        };
        
        const opcoes = educacoesPorPais[pais] || educacoesPorPais['US'];
        return opcoes[Math.floor(Math.random() * opcoes.length)];
    }

    gerarExperienciaProfissional(role, anos) {
        const experiencias = [
            `Liderou transformação digital em empresa de ${Math.floor(anos/2)} anos`,
            `Implementou processos de melhoria contínua que resultaram em 30% de eficiência`,
            `Gerenciou equipes de até ${Math.floor(anos * 2)} pessoas em projetos estratégicos`,
            `Desenvolveu e executou planos estratégicos com ROI superior a 150%`
        ];
        
        return experiencias[Math.floor(Math.random() * experiencias.length)];
    }

    gerarHabilidadesComportamentais(role) {
        const habilidadesPorRole = {
            'Chief Executive Officer': [
                'Liderança visionária e inspiradora',
                'Pensamento estratégico de longo prazo',
                'Excelente comunicação executiva',
                'Tomada de decisão sob pressão'
            ],
            'Chief Technology Officer': [
                'Liderança técnica e inovação',
                'Visão tecnológica estratégica',
                'Gestão de equipes de desenvolvimento',
                'Arquitetura de sistemas complexos'
            ],
            'Chief Financial Officer': [
                'Análise financeira avançada',
                'Gestão de riscos corporativos',
                'Planejamento estratégico financeiro',
                'Compliance e governança'
            ]
        };
        
        return habilidadesPorRole[role] || [
            'Liderança colaborativa',
            'Comunicação efetiva',
            'Pensamento analítico',
            'Orientação para resultados'
        ];
    }

    gerarMotivacoes(role) {
        return [
            'Impacto positivo na organização',
            'Desenvolvimento de talentos',
            'Inovação e crescimento sustentável',
            'Excelência em entrega de resultados'
        ];
    }

    gerarEmail(nome, empresa, index) {
        const nomeClean = nome.toLowerCase()
            .replace(/[áàâãç]/g, 'a')
            .replace(/[éèê]/g, 'e')
            .replace(/[íì]/g, 'i')
            .replace(/[óòôõ]/g, 'o')
            .replace(/[úù]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z\s]/g, '')
            .replace(/\s+/g, '.');
        
        const empresaClean = empresa.codigo.toLowerCase();
        return `${nomeClean}.${index}@${empresaClean}.com`;
    }

    gerarWhatsApp() {
        return `+1-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    async gerarPersonas(empresaId) {
        try {
            console.log('🚀 Iniciando geração de personas REAIS INTERNACIONAIS...');
            console.log(`🎯 Gerando personas REAIS para empresa: ${empresaId}`);

            // Buscar dados da empresa
            const { data: empresa, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId)
                .single();

            if (empresaError || !empresa) {
                throw new Error('Empresa não encontrada');
            }

            console.log(`📊 Empresa: ${empresa.nome} (${empresa.codigo}) - País: ${empresa.pais}`);
            console.log(`🌍 Gerando nomes apropriados para: ${empresa.pais}`);

            const totalPersonas = empresa.total_personas || 16;
            console.log(`📝 Criando ${totalPersonas} personas reais...`);

            // Limpar personas existentes
            await this.limparDadosExistentes(empresa);

            const personas = [];
            let personaCounter = 1;

            // 1. CEO (sempre 1)
            const ceoData = this.selecionarNome('masculino', empresa.pais);
            const ceoFisicas = this.gerarCaracteristicasFisicas(empresa.pais);
            
            const ceoPersona = {
                empresa_id: empresaId,
                persona_code: `CEO-${empresa.codigo}`,
                full_name: ceoData.nome,
                role: 'Chief Executive Officer',
                department: 'Executive',
                specialty: 'Strategic Leadership & Revenue',
                email: this.gerarEmail(ceoData.nome, empresa, 0),
                whatsapp: this.gerarWhatsApp(),
                status: 'active'
            };
            
            ceoPersona.biografia_completa = this.gerarBiografiaCompleta(ceoPersona, empresa, ceoFisicas);
            ceoPersona.personalidade = {
                caracteristicas_fisicas: ceoFisicas,
                genero: ceoData.genero
            };
            
            personas.push(ceoPersona);

            // 2. Executivos (CTO, CFO, COO)
            const executiveRoles = [
                { role: 'Chief Technology Officer', dept: 'Technology', spec: 'Technical Leadership & Sales', genero: 'masculino' },
                { role: 'Chief Financial Officer', dept: 'Finance', spec: 'Financial Strategy & ROI Sales', genero: 'feminino' },
                { role: 'Chief Operating Officer', dept: 'Operations', spec: 'Operations Excellence & Process Sales', genero: 'feminino' }
            ];

            executiveRoles.forEach((execRole, i) => {
                const execData = this.selecionarNome(execRole.genero, empresa.pais);
                const execFisicas = this.gerarCaracteristicasFisicas(empresa.pais);
                
                const execPersona = {
                    empresa_id: empresaId,
                    persona_code: `EXEC${i + 1}-${empresa.codigo}`,
                    full_name: execData.nome,
                    role: execRole.role,
                    department: execRole.dept,
                    specialty: execRole.spec,
                    email: this.gerarEmail(execData.nome, empresa, i + 1),
                    whatsapp: this.gerarWhatsApp(),
                    status: 'active'
                };
                
                execPersona.biografia_completa = this.gerarBiografiaCompleta(execPersona, empresa, execFisicas);
                execPersona.personalidade = {
                    caracteristicas_fisicas: execFisicas,
                    genero: execData.genero
                };
                
                personas.push(execPersona);
            });

            // 3. Especialistas (4 pessoas - mix de gêneros)
            for (let i = 0; i < 4; i++) {
                const genero = i % 2 === 0 ? 'masculino' : 'feminino';
                const specData = this.selecionarNome(genero, empresa.pais);
                const specFisicas = this.gerarCaracteristicasFisicas(empresa.pais);
                
                const specPersona = {
                    empresa_id: empresaId,
                    persona_code: `SPEC${i + 1}-${empresa.codigo}`,
                    full_name: specData.nome,
                    role: `Technical Specialist ${i + 1}`,
                    department: 'Technical',
                    specialty: 'Technical Sales Support',
                    email: this.gerarEmail(specData.nome, empresa, 10 + i),
                    whatsapp: this.gerarWhatsApp(),
                    status: 'active'
                };
                
                specPersona.biografia_completa = this.gerarBiografiaCompleta(specPersona, empresa, specFisicas);
                specPersona.personalidade = {
                    caracteristicas_fisicas: specFisicas,
                    genero: specData.genero
                };
                
                personas.push(specPersona);
            }

            // 4. Assistentes (8 pessoas - mix real de gêneros: 4 mulheres, 4 homens)
            for (let i = 0; i < 8; i++) {
                const genero = i < 4 ? 'feminino' : 'masculino'; // 4 feminino, 4 masculino
                const assistData = this.selecionarNome(genero, empresa.pais);
                const assistFisicas = this.gerarCaracteristicasFisicas(empresa.pais);
                
                const assistPersona = {
                    empresa_id: empresaId,
                    persona_code: `ASST${i + 1}-${empresa.codigo}`,
                    full_name: assistData.nome,
                    role: `Executive Assistant ${i + 1}`,
                    department: 'Administrative',
                    specialty: 'Administrative Support',
                    email: this.gerarEmail(assistData.nome, empresa, 100 + i),
                    whatsapp: this.gerarWhatsApp(),
                    status: 'active'
                };
                
                assistPersona.biografia_completa = this.gerarBiografiaCompleta(assistPersona, empresa, assistFisicas);
                assistPersona.personalidade = {
                    caracteristicas_fisicas: assistFisicas,
                    genero: assistData.genero
                };
                
                personas.push(assistPersona);
            }

            console.log(`📋 Estrutura: CEO(1), Executivos(3), Especialistas(4), Assistentes(8)`);
            console.log(`💾 Inserindo ${personas.length} personas no banco...`);

            // Normalize nationality for each persona (fallback to empresa.pais)
            for (const p of personas) {
                try {
                    p.nacionalidade = normalizeNationality(p.nacionalidade, empresa.pais);
                } catch (e) {
                    p.nacionalidade = p.nacionalidade || fallbackFromCountryCode(empresa.pais);
                }
            }

            // Inserir personas no banco
            const { data: insertedPersonas, error: insertError } = await supabase
                .from('personas')
                .insert(personas)
                .select();

            if (insertError) {
                console.error('❌ Erro ao inserir personas:', insertError);
                return;
            }

            console.log(`✅ ${insertedPersonas.length} personas reais criadas com sucesso!`);
            console.log(`🌍 Nomes apropriados para país: ${empresa.pais}`);
            console.log(`📊 Resumo por gênero:`);
            
            const generoCount = insertedPersonas.reduce((acc, p) => {
                const genero = p.personalidade?.genero || 'indefinido';
                acc[genero] = (acc[genero] || 0) + 1;
                return acc;
            }, {});
            
            Object.entries(generoCount).forEach(([genero, count]) => {
                console.log(`   ${genero}: ${count}`);
            });

            console.log(`🎉 Processo concluído com sucesso!`);
            console.log(`📊 ${insertedPersonas.length} personas reais criadas para ${empresa.codigo}`);

            return {
                success: true,
                personas_criadas: insertedPersonas.length,
                empresa_codigo: empresa.codigo,
                pais: empresa.pais
            };

        } catch (error) {
            console.error('❌ Erro ao gerar personas:', error.message);
            console.error('💥 Erro na execução:', error.message);
            process.exit(1);
        }
    }

    async limparDadosExistentes(empresa) {
        console.log('🗑️ Limpando personas existentes...');
        
        const { error: deleteError } = await supabase
            .from('personas')
            .delete()
            .eq('empresa_id', empresa.id);

        if (deleteError) {
            console.warn('⚠️ Aviso ao limpar personas:', deleteError.message);
        }
    }
}

// Executar
async function main() {
    const empresaId = process.argv.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
    
    if (!empresaId) {
        console.error('❌ Erro: --empresaId é obrigatório');
        console.log('Uso: node generate_personas_reais_internacional.js --empresaId=UUID_DA_EMPRESA');
        process.exit(1);
    }

    const generator = new PersonasRealInternationalGenerator();
    await generator.gerarPersonas(empresaId);
}

main();