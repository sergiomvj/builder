#!/usr/bin/env node
/**
 * 🎯 AUTO BIOGRAFIA GENERATOR (Node.js)
 * =====================================
 * 
 * Gerador automático de biografias de personas com controle de unicidade
 * Migrado de Python para Node.js mantendo funcionalidade 100% idêntica
 * 
 * Funcionalidades:
 * - Gera biografias demográficamente diversificadas
 * - Controle rigoroso de nomes únicos por empresa
 * - 6 regiões demográficas com características específicas
 * - Templates de educação por categoria
 * - Biografias em markdown estruturado
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js)
 * @date 2024-12-19
 */

const fs = require('fs').promises;
const path = require('path');

class AutoBiografiaGenerator {
    constructor() {
        // Controle de nomes únicos (funcionalidade crítica)
        this.nomesUsados = new Set();
        this.combinacoesUsadas = new Set();
        
        // Configurações demográficas (6 regiões)
        this.nacionalidades = {
            europeus: {
                paises: ["França", "Alemanha", "Itália", "Espanha", "Reino Unido", "Holanda", "Suíça"],
                nomesMasculinos: ["Pierre", "Klaus", "Marco", "Carlos", "James", "Willem", "Hans"],
                nomesFemininos: ["Marie", "Ingrid", "Sofia", "Carmen", "Emma", "Anna", "Heidi"],
                sobrenomes: ["Dubois", "Schmidt", "Rossi", "García", "Smith", "Van Berg", "Weber"]
            },
            latinos: {
                paises: ["Brasil", "México", "Argentina", "Colômbia", "Chile", "Peru", "Uruguai"],
                nomesMasculinos: ["Diego", "Carlos", "Fernando", "Miguel", "José", "Luis", "Roberto"],
                nomesFemininos: ["Ana", "Carmen", "Sofia", "Isabella", "Maria", "Lucia", "Gabriela"],
                sobrenomes: ["Silva", "García", "González", "Rodríguez", "López", "Martínez", "Hernández"]
            },
            asiaticos: {
                paises: ["Japão", "Coreia do Sul", "China", "Singapura", "Taiwan", "Hong Kong", "Tailândia"],
                nomesMasculinos: ["Hiroshi", "Min-jun", "Wei", "Kai", "Chen", "Akira", "Yuki"],
                nomesFemininos: ["Yuki", "So-young", "Li", "Mei", "Ling", "Sakura", "Nana"],
                sobrenomes: ["Tanaka", "Kim", "Wang", "Lee", "Chen", "Yamamoto", "Park"]
            },
            oriente_medio: {
                paises: ["Emirados Árabes Unidos", "Israel", "Turquia", "Líbano", "Jordânia", "Qatar", "Kuwait"],
                nomesMasculinos: ["Ahmed", "David", "Mehmet", "Omar", "Khalil", "Nasser", "Faisal"],
                nomesFemininos: ["Fatima", "Sarah", "Ayşe", "Layla", "Nour", "Amina", "Zara"],
                sobrenomes: ["Al-Ahmad", "Cohen", "Özkan", "Khoury", "Al-Zahra", "Al-Mansouri", "Al-Sabah"]
            },
            balcas: {
                paises: ["Sérvia", "Croácia", "Bósnia e Herzegovina", "Montenegro", "Eslovênia", "Macedônia do Norte", "Kosovo"],
                nomesMasculinos: ["Marko", "Ante", "Emir", "Stefan", "Luka", "Aleksandar", "Driton"],
                nomesFemininos: ["Ana", "Petra", "Amela", "Milica", "Nina", "Elena", "Ardita"],
                sobrenomes: ["Petrović", "Kovačić", "Hodžić", "Nikolić", "Novak", "Stojanovski", "Krasniqi"]
            },
            nordicos: {
                paises: ["Suécia", "Noruega", "Dinamarca", "Finlândia", "Islândia", "Estônia", "Letônia"],
                nomesMasculinos: ["Erik", "Lars", "Nils", "Mikael", "Björn", "Andres", "Janis"],
                nomesFemininos: ["Astrid", "Ingrid", "Maja", "Aino", "Sigrid", "Liis", "Liga"],
                sobrenomes: ["Andersson", "Hansen", "Nielsen", "Virtanen", "Einarsson", "Tamm", "Ozols"]
            }
        };

        // Idiomas por região
        this.idiomasRegionais = {
            europeus: ["inglês", "francês", "alemão", "italiano", "espanhol"],
            latinos: ["espanhol", "português", "inglês", "francês"],
            asiaticos: ["inglês", "japonês", "coreano", "chinês", "tailandês"],
            oriente_medio: ["inglês", "árabe", "hebraico", "turco"],
            balcas: ["inglês", "sérvio", "croata", "bósnio", "esloveno"],
            nordicos: ["inglês", "sueco", "norueguês", "dinamarquês", "finlandês"]
        };

        // Templates de especialidades (6 áreas fixas)
        this.especialidades = {
            hr: "Recursos Humanos e Gestão de Talentos",
            youtube: "Criação de Conteúdo e YouTube Marketing",
            midias_sociais: "Marketing Digital e Mídias Sociais", 
            marketing: "Marketing Estratégico e Growth Hacking",
            financeiro: "Análise Financeira e Controladoria",
            tecnologia: "Desenvolvimento de Sistemas e DevOps"
        };

        // Templates de educação
        this.educacaoTemplates = {
            executivo: [
                "MBA em Gestão Empresarial pela FGV",
                "Mestrado em Administração pela USP", 
                "MBA Executivo em Liderança pela INSEAD",
                "Pós-graduação em Gestão Estratégica pela PUC"
            ],
            assistente: [
                "Bacharelado em Administração",
                "Tecnólogo em Gestão Comercial",
                "Bacharelado em Comunicação Social",
                "Superior em Processos Gerenciais"
            ],
            especialista: {
                hr: "Pós-graduação em Gestão de Pessoas e MBA em Recursos Humanos",
                youtube: "Bacharelado em Comunicação Digital e Certificação Google Ads",
                midias_sociais: "Marketing Digital e Social Media, Certificação Facebook Blueprint",
                marketing: "MBA em Marketing Digital e Growth Hacking Certification",
                financeiro: "Bacharelado em Ciências Contábeis e CFA (Chartered Financial Analyst)",
                tecnologia: "Bacharelado em Ciência da Computação e Certificações AWS/Azure"
            }
        };
    }

    /**
     * Reset do controle de nomes únicos para nova empresa
     */
    resetNomesUsados() {
        this.nomesUsados.clear();
        this.combinacoesUsadas.clear();
        console.log("🔄 Reset do controle de nomes únicos");
    }

    /**
     * Gera nome único para persona
     * @param {string} genero - "masculino" ou "feminino"
     * @param {string} nacionalidade - chave da nacionalidade
     * @param {number} maxAttempts - máximo de tentativas (default: 50)
     * @returns {object} {primeiroNome, sobrenome, nomeCompleto}
     */
    generateUniqueName(genero, nacionalidade, maxAttempts = 50) {
        const nacData = this.nacionalidades[nacionalidade];
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Seleção por gênero
            const primeiroNome = genero === "masculino" 
                ? nacData.nomesMasculinos[Math.floor(Math.random() * nacData.nomesMasculinos.length)]
                : nacData.nomesFemininos[Math.floor(Math.random() * nacData.nomesFemininos.length)];
            
            const sobrenome = nacData.sobrenomes[Math.floor(Math.random() * nacData.sobrenomes.length)];
            const nomeCompleto = `${primeiroNome} ${sobrenome}`;
            const combinacao = `${primeiroNome}|${sobrenome}|${nacionalidade}`;
            
            // Verificação de unicidade
            if (!this.nomesUsados.has(nomeCompleto) && !this.combinacoesUsadas.has(combinacao)) {
                this.nomesUsados.add(nomeCompleto);
                this.combinacoesUsadas.add(combinacao);
                return { primeiroNome, sobrenome, nomeCompleto };
            }
        }

        // Fallback com sufixo
        const primeiroNome = genero === "masculino" 
            ? nacData.nomesMasculinos[0]
            : nacData.nomesFemininos[0];
        const sobrenome = nacData.sobrenomes[0];
        
        for (let i = 1; i <= 100; i++) {
            const suffix = String.fromCharCode(64 + i); // A, B, C...
            const nomeComSufixo = `${primeiroNome} ${sobrenome} ${suffix}`;
            
            if (!this.nomesUsados.has(nomeComSufixo)) {
                this.nomesUsados.add(nomeComSufixo);
                this.combinacoesUsadas.add(`${primeiroNome}|${sobrenome}|${nacionalidade}|${suffix}`);
                return { 
                    primeiroNome: `${primeiroNome} ${suffix}`, 
                    sobrenome, 
                    nomeCompleto: nomeComSufixo 
                };
            }
        }

        // Fallback final com timestamp
        const timestamp = Date.now().toString().slice(-3);
        const nomeFinal = `${primeiroNome} ${sobrenome}${timestamp}`;
        this.nomesUsados.add(nomeFinal);
        
        return { 
            primeiroNome: `${primeiroNome}${timestamp}`, 
            sobrenome, 
            nomeCompleto: nomeFinal 
        };
    }

    /**
     * Gera biografia em markdown para persona
     */
    generateBiografiaMarkdown(nome, idade, pais, role, especializacao, educacao, experiencia, idiomas, companyConfig) {
        const empresaNome = companyConfig.name;
        const industria = companyConfig.industry;
        
        // Determinar pronome baseado em nomes masculinos conhecidos
        const nomesMasculinos = Object.values(this.nacionalidades)
            .flatMap(n => n.nomesMasculinos);
        const primeiroNome = nome.split(' ')[0];
        const generoPronome = nomesMasculinos.includes(primeiroNome) ? "ele" : "ela";
        
        const timestamp = new Date().toLocaleString('pt-BR');
        
        return `# ${nome}

## INFORMAÇÕES BÁSICAS
- **Nome Completo:** ${nome}
- **Idade:** ${idade} anos  
- **Nacionalidade:** ${pais}
- **Cargo:** ${role}
- **Especialização:** ${especializacao}

## FORMAÇÃO ACADÊMICA
${educacao}

## EXPERIÊNCIA PROFISSIONAL
Com ${experiencia} anos de experiência no mercado, ${generoPronome} desenvolveu competências sólidas em:
- Liderança de equipes multiculturais
- Gestão de projetos complexos
- Implementação de estratégias inovadoras
- Otimização de processos organizacionais
- Análise de dados e tomada de decisões

## COMPETÊNCIAS LINGUÍSTICAS
- **Idiomas:** ${idiomas.join(', ')}

## RESPONSABILIDADES NA ${empresaNome.toUpperCase()}
- Implementar estratégias da ${especializacao} alinhadas aos objetivos da empresa
- Liderar iniciativas de crescimento no setor de ${industria}
- Colaborar com equipes multifuncionais para maximizar resultados
- Desenvolver e manter relacionamentos estratégicos com stakeholders
- Garantir excelência operacional em todas as atividades

## COMPETÊNCIAS TÉCNICAS
- Domínio de ferramentas de gestão e análise
- Conhecimento avançado em metodologias ágeis
- Experiência com plataformas de automação
- Habilidades analíticas e de business intelligence
- Competência em negociação e gestão de conflitos

## COMPETÊNCIAS COMPORTAMENTAIS
- **Liderança:** Capacidade de inspirar e motivar equipes
- **Comunicação:** Excelente habilidade de comunicação verbal e escrita
- **Adaptabilidade:** Flexibilidade para se adaptar a mudanças
- **Pensamento Estratégico:** Visão de longo prazo e planejamento
- **Orientação a Resultados:** Foco em alcançar metas e objetivos
- **Trabalho em Equipe:** Colaboração efetiva e sinergia

## OBJETIVOS E METAS
${generoPronome === "ele" ? "Seu" : "Sua"} principal objetivo é contribuir para o crescimento sustentável da ${empresaNome}, aplicando ${generoPronome === "ele" ? "sua" : "sua"} expertise em ${especializacao} para impulsionar a inovação no setor de ${industria} e estabelecer a empresa como referência no mercado.

---
*Biografia gerada automaticamente*  
*Data: ${timestamp}*`;
    }

    /**
     * Gera biografia completa para uma persona
     */
    generatePersonaBio(role, categoria, genero, nacionalidade, idiomas, companyConfig, isCeo = false, especialidade = null) {
        // Gerar nome único
        const { primeiroNome, sobrenome, nomeCompleto } = this.generateUniqueName(genero, nacionalidade);
        
        const nacData = this.nacionalidades[nacionalidade];
        
        // Idade por categoria
        let idade;
        if (isCeo) {
            idade = Math.floor(Math.random() * (50 - 35 + 1)) + 35; // 35-50 anos
        } else if (categoria === "executivos") {
            idade = Math.floor(Math.random() * (45 - 30 + 1)) + 30; // 30-45 anos
        } else if (categoria === "assistentes") {
            idade = Math.floor(Math.random() * (35 - 25 + 1)) + 25; // 25-35 anos
        } else if (categoria === "especialistas") {
            idade = Math.floor(Math.random() * (40 - 28 + 1)) + 28; // 28-40 anos
        }
        
        const paisOrigemIndex = Math.floor(Math.random() * nacData.paises.length);
        const paisOrigem = nacData.paises[paisOrigemIndex];
        
        // Educação por categoria
        let educacao;
        if (categoria === "executivos") {
            const eduIndex = Math.floor(Math.random() * this.educacaoTemplates.executivo.length);
            educacao = this.educacaoTemplates.executivo[eduIndex];
        } else if (categoria === "assistentes") {
            const eduIndex = Math.floor(Math.random() * this.educacaoTemplates.assistente.length);
            educacao = this.educacaoTemplates.assistente[eduIndex];
        } else if (categoria === "especialistas" && especialidade) {
            educacao = this.educacaoTemplates.especialista[especialidade];
        }
        
        // Experiência e idiomas
        const anosExperiencia = Math.max(idade - 22, 3); // Mínimo 3 anos
        const numIdiomas = Math.floor(Math.random() * (6 - 3 + 1)) + 3; // 3-6 idiomas
        const idiomasArray = Array.from(idiomas);
        const idiomasPersona = idiomasArray.sort(() => 0.5 - Math.random()).slice(0, Math.min(numIdiomas, idiomasArray.length));
        
        // Especialização por categoria
        let especializacao;
        if (isCeo) {
            especializacao = "Liderança Executiva e Gestão Estratégica";
        } else if (categoria === "executivos") {
            const especializacoes = [
                "Gestão Estratégica e Desenvolvimento de Negócios",
                "Operações e Eficiência Organizacional", 
                "Inovação e Transformação Digital",
                "Relações Corporativas e Parcerias Estratégicas"
            ];
            especializacao = especializacoes[Math.floor(Math.random() * especializacoes.length)];
        } else if (categoria === "assistentes") {
            especializacao = "Suporte Executivo e Gestão Administrativa";
        } else if (categoria === "especialistas" && especialidade) {
            especializacao = this.especialidades[especialidade];
        }
        
        // Gerar biografia markdown
        const biografiaMd = this.generateBiografiaMarkdown(
            nomeCompleto, idade, paisOrigem, role, especializacao,
            educacao, anosExperiencia, idiomasPersona, companyConfig
        );
        
        return {
            nomeCompleto,
            primeiroNome,
            sobrenome, 
            idade,
            genero,
            paisOrigem,
            nacionalidade,
            role,
            categoria,
            especializacao,
            educacao,
            anosExperiencia,
            idiomas: idiomasPersona,
            biografiaMd,
            especialidade,
            isCeo
        };
    }

    /**
     * Gera configuração completa de personas para empresa
     */
    generatePersonasConfig(companyConfig) {
        // Reset nomes únicos para nova empresa
        this.resetNomesUsados();
        
        // Extrair configurações da empresa
        const {
            nacionalidade,
            ceo_genero: ceoGenero,
            executivos_homens: execHomens,
            executivos_mulheres: execMulheres,
            assistentes_homens: assistHomens,
            assistentes_mulheres: assistMulheres,
            especialistas_homens: especHomens,
            especialistas_mulheres: especMulheres,
            idiomas_extras: idiomasExtras = []
        } = companyConfig;
        
        // Configuração de idiomas
        const idiomasBase = ["inglês", "espanhol", "português", "francês"];
        const idiomasRegionais = this.idiomasRegionais[nacionalidade] || [];
        const todosIdiomas = new Set([...idiomasBase, ...idiomasRegionais, ...idiomasExtras]);
        
        const personas = {};
        
        // 1. Gerar CEO
        const ceo = this.generatePersonaBio(
            "CEO", "executivos", ceoGenero, nacionalidade,
            todosIdiomas, companyConfig, true
        );
        personas.ceo = ceo;
        
        // 2. Gerar Executivos
        personas.executivos = {};
        
        // Executivos homens
        for (let i = 0; i < execHomens; i++) {
            const executivo = this.generatePersonaBio(
                `Diretor ${i + 1}`, "executivos", "masculino", nacionalidade,
                todosIdiomas, companyConfig
            );
            personas.executivos[`exec_m_${i + 1}`] = executivo;
        }
        
        // Executivos mulheres
        for (let i = 0; i < execMulheres; i++) {
            const executiva = this.generatePersonaBio(
                `Diretora ${i + 1}`, "executivos", "feminino", nacionalidade,
                todosIdiomas, companyConfig
            );
            personas.executivos[`exec_f_${i + 1}`] = executiva;
        }
        
        // 3. Gerar Assistentes
        personas.assistentes = {};
        
        // Assistentes homens
        for (let i = 0; i < assistHomens; i++) {
            const assistente = this.generatePersonaBio(
                `Assistente Executivo ${i + 1}`, "assistentes", "masculino", nacionalidade,
                todosIdiomas, companyConfig
            );
            personas.assistentes[`assist_m_${i + 1}`] = assistente;
        }
        
        // Assistentes mulheres  
        for (let i = 0; i < assistMulheres; i++) {
            const assistente = this.generatePersonaBio(
                `Assistente Executiva ${i + 1}`, "assistentes", "feminino", nacionalidade,
                todosIdiomas, companyConfig
            );
            personas.assistentes[`assist_f_${i + 1}`] = assistente;
        }
        
        // 4. Gerar Especialistas (6 áreas fixas)
        personas.especialistas = {};
        
        const especialidadesKeys = Object.keys(this.especialidades);
        let especIndex = 0;
        
        // Especialistas homens
        for (let i = 0; i < especHomens && especIndex < especialidadesKeys.length; i++) {
            const especialidade = especialidadesKeys[especIndex];
            const especialista = this.generatePersonaBio(
                `Especialista ${especialidade.toUpperCase()}`, "especialistas", "masculino", 
                nacionalidade, todosIdiomas, companyConfig, false, especialidade
            );
            personas.especialistas[`espec_${especialidade}_m`] = especialista;
            especIndex++;
        }
        
        // Especialistas mulheres
        for (let i = 0; i < especMulheres && especIndex < especialidadesKeys.length; i++) {
            const especialidade = especialidadesKeys[especIndex];
            const especialista = this.generatePersonaBio(
                `Especialista ${especialidade.toUpperCase()}`, "especialistas", "feminino",
                nacionalidade, todosIdiomas, companyConfig, false, especialidade
            );
            personas.especialistas[`espec_${especialidade}_f`] = especialista;
            especIndex++;
        }
        
        // Log de estatísticas
        console.log(`✅ Total de nomes únicos criados: ${this.nomesUsados.size}`);
        console.log(`✅ Total de combinações únicas: ${this.combinacoesUsadas.size}`);
        
        return personas;
    }

    /**
     * Salva personas e biografias na estrutura de pastas
     */
    async savePersonasBiografias(personasConfig, outputPath) {
        const outputDir = path.resolve(outputPath);
        const personasScriptsDir = path.join(outputDir, "04_PERSONAS_SCRIPTS_1_2_3");
        
        try {
            // Criar estrutura de pastas se não existir
            await fs.mkdir(personasScriptsDir, { recursive: true });
            
            let totalArquivosSalvos = 0;
            
            // Salvar CEO na pasta executivos
            if (personasConfig.ceo) {
                const ceoDir = path.join(personasScriptsDir, "executivos");
                await fs.mkdir(ceoDir, { recursive: true });
                
                const ceoPastaIndividual = path.join(ceoDir, personasConfig.ceo.nomeCompleto.replace(/\s+/g, '_'));
                await fs.mkdir(ceoPastaIndividual, { recursive: true });
                
                const ceoFilePath = path.join(ceoPastaIndividual, `${personasConfig.ceo.nomeCompleto.replace(/\s+/g, '_')}_bio.md`);
                await fs.writeFile(ceoFilePath, personasConfig.ceo.biografiaMd, 'utf8');
                totalArquivosSalvos++;
            }
            
            // Salvar outras categorias
            for (const [categoria, personas] of Object.entries(personasConfig)) {
                if (categoria === 'ceo') continue; // Já processado acima
                
                const categoriaDir = path.join(personasScriptsDir, categoria);
                await fs.mkdir(categoriaDir, { recursive: true });
                
                for (const [personaId, persona] of Object.entries(personas)) {
                    const personaPastaIndividual = path.join(categoriaDir, persona.nomeCompleto.replace(/\s+/g, '_'));
                    await fs.mkdir(personaPastaIndividual, { recursive: true });
                    
                    const personaFilePath = path.join(personaPastaIndividual, `${persona.nomeCompleto.replace(/\s+/g, '_')}_bio.md`);
                    await fs.writeFile(personaFilePath, persona.biografiaMd, 'utf8');
                    totalArquivosSalvos++;
                }
            }
            
            // Salvar configuração JSON
            const configFilePath = path.join(outputDir, "personas_config.json");
            await fs.writeFile(configFilePath, JSON.stringify(personasConfig, null, 2), 'utf8');
            
            console.log(`✅ Total de arquivos de biografia salvos: ${totalArquivosSalvos}`);
            console.log(`✅ Configuração salva em: ${configFilePath}`);
            
            return {
                success: true,
                totalArquivos: totalArquivosSalvos,
                configPath: configFilePath
            };
            
        } catch (error) {
            console.error(`❌ Erro ao salvar biografias: ${error.message}`);
            throw error;
        }
    }
}

// Exportar para uso como módulo
module.exports = { AutoBiografiaGenerator };

// Executar se chamado diretamente
if (require.main === module) {
    console.log("🎭 Auto Biografia Generator (Node.js) v1.0.0");
    console.log("Para usar, importe como módulo: const { AutoBiografiaGenerator } = require('./05_auto_biografia_generator.js')");
}