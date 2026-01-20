#!/usr/bin/env node
/**
 * 🎯 SCRIPT 1 - GERAÇÃO DE COMPETÊNCIAS (Node.js)
 * ==============================================
 * 
 * Análise automática de competências técnicas e comportamentais das personas
 * baseada em suas biografias, gerando arquivo JSON estruturado para processamento posterior.
 * 
 * Migrado de Python para Node.js mantendo funcionalidade 100% idêntica
 * 
 * Funcionalidades:
 * - Análise de biografias markdown das personas
 * - Extração de competências técnicas e comportamentais  
 * - Mapeamento de ferramentas e tecnologias por especialidade
 * - Geração de arquivo competencias_core.json
 * - Estrutura compatível com Scripts 2-5
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js)
 * @date 2024-12-19
 */

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked'); // Para parsing de markdown

class CompetenciasGenerator {
    constructor() {
        // Templates de competências por especialidade
        this.competenciasPorEspecialidade = {
            hr: {
                tecnicas: [
                    "Gestão de Talentos",
                    "Recrutamento e Seleção", 
                    "Desenvolvimento Organizacional",
                    "Gestão de Performance",
                    "Políticas de RH",
                    "Employee Experience",
                    "People Analytics"
                ],
                comportamentais: [
                    "Liderança Empática",
                    "Comunicação Assertiva", 
                    "Mediação de Conflitos",
                    "Pensamento Estratégico",
                    "Orientação a Pessoas",
                    "Adaptabilidade Cultural"
                ],
                ferramentas: [
                    "HRIS Systems",
                    "ATS (Applicant Tracking Systems)",
                    "Microsoft Office 365",
                    "Google Workspace", 
                    "Slack",
                    "Zoom",
                    "LinkedIn Recruiter"
                ]
            },
            youtube: {
                tecnicas: [
                    "Produção de Vídeo",
                    "Edição de Vídeo",
                    "YouTube Analytics",
                    "SEO para YouTube",
                    "Marketing de Conteúdo",
                    "Storytelling Digital", 
                    "Live Streaming"
                ],
                comportamentais: [
                    "Criatividade",
                    "Comunicação Visual",
                    "Persistência",
                    "Orientação a Resultados",
                    "Adaptabilidade",
                    "Inovação"
                ],
                ferramentas: [
                    "Adobe Premiere Pro",
                    "Final Cut Pro",
                    "Adobe After Effects",
                    "Photoshop",
                    "YouTube Studio",
                    "TubeBuddy",
                    "VidIQ"
                ]
            },
            midias_sociais: {
                tecnicas: [
                    "Social Media Marketing",
                    "Community Management",
                    "Gestão de Campanhas",
                    "Analytics e Métricas",
                    "Influencer Marketing",
                    "Paid Social Advertising"
                ],
                comportamentais: [
                    "Comunicação Digital", 
                    "Criatividade",
                    "Agilidade",
                    "Orientação a Tendências",
                    "Trabalho em Equipe",
                    "Resolução de Problemas"
                ],
                ferramentas: [
                    "Facebook Business Manager",
                    "Instagram Creator Studio",
                    "Hootsuite",
                    "Buffer",
                    "Canva",
                    "Adobe Creative Suite",
                    "Google Analytics"
                ]
            },
            marketing: {
                tecnicas: [
                    "Marketing Digital",
                    "Growth Hacking",
                    "Marketing Analytics",
                    "Automação de Marketing",
                    "Inbound Marketing",
                    "Performance Marketing"
                ],
                comportamentais: [
                    "Pensamento Analítico",
                    "Orientação a Dados", 
                    "Inovação",
                    "Visão Estratégica",
                    "Adaptabilidade",
                    "Orientação a Resultados"
                ],
                ferramentas: [
                    "Google Ads",
                    "Facebook Ads",
                    "HubSpot",
                    "Mailchimp", 
                    "Google Analytics",
                    "SEMrush",
                    "Hotjar"
                ]
            },
            financeiro: {
                tecnicas: [
                    "Análise Financeira",
                    "Controladoria",
                    "Planejamento Financeiro",
                    "Gestão de Riscos",
                    "Auditoria",
                    "Compliance Financeiro"
                ],
                comportamentais: [
                    "Precisão",
                    "Pensamento Analítico",
                    "Orientação a Detalhes",
                    "Ética Profissional",
                    "Comunicação Técnica",
                    "Gestão de Pressão"
                ],
                ferramentas: [
                    "Excel Avançado",
                    "SAP",
                    "Power BI",
                    "QuickBooks",
                    "Tableau",
                    "SQL",
                    "Python/R para Finanças"
                ]
            },
            tecnologia: {
                tecnicas: [
                    "Desenvolvimento de Software",
                    "DevOps",
                    "Cloud Computing",
                    "Arquitetura de Sistemas",
                    "Segurança da Informação",
                    "Integração de APIs"
                ],
                comportamentais: [
                    "Pensamento Lógico",
                    "Resolução de Problemas",
                    "Aprendizagem Contínua",
                    "Colaboração",
                    "Atenção aos Detalhes",
                    "Inovação Tecnológica"
                ],
                ferramentas: [
                    "Git/GitHub",
                    "Docker",
                    "Kubernetes", 
                    "AWS/Azure/GCP",
                    "Jenkins",
                    "MongoDB/PostgreSQL",
                    "React/Node.js"
                ]
            }
        };

        // Competências base para executivos e assistentes
        this.competenciasBase = {
            executivos: {
                tecnicas: [
                    "Gestão Estratégica",
                    "Liderança de Equipes",
                    "Planejamento Empresarial",
                    "Análise de Mercado",
                    "Gestão de Mudanças",
                    "Business Intelligence"
                ],
                comportamentais: [
                    "Liderança Visionária",
                    "Pensamento Estratégico", 
                    "Tomada de Decisão",
                    "Comunicação Executiva",
                    "Negociação",
                    "Influência"
                ]
            },
            assistentes: {
                tecnicas: [
                    "Gestão Administrativa",
                    "Organização de Agendas",
                    "Comunicação Empresarial",
                    "Suporte Executivo",
                    "Gestão Documental",
                    "Coordenação de Reuniões"
                ],
                comportamentais: [
                    "Organização",
                    "Proatividade",
                    "Discrição",
                    "Multitasking",
                    "Comunicação Eficaz",
                    "Orientação ao Cliente Interno"
                ]
            }
        };
    }

    /**
     * Analisa biografia em markdown e extrai informações relevantes
     */
    analizarBiografia(biografiaMarkdown, persona) {
        try {
            // Converter markdown para texto
            const biografiaTexto = this.markdownToText(biografiaMarkdown);
            
            // Extrair seções específicas
            const secoes = this.extrairSecoesBiografia(biografiaMarkdown);
            
            return {
                nome: persona.nomeCompleto,
                categoria: persona.categoria,
                especialidade: persona.especialidade || null,
                experiencia: persona.anosExperiencia,
                educacao: persona.educacao,
                idiomas: persona.idiomas,
                texto_completo: biografiaTexto,
                secoes: secoes
            };
        } catch (error) {
            console.error(`❌ Erro ao analisar biografia de ${persona.nomeCompleto}: ${error.message}`);
            return null;
        }
    }

    /**
     * Converte markdown para texto plano
     */
    markdownToText(markdown) {
        return markdown
            .replace(/#{1,6}\s+/g, '') // Remover headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remover bold
            .replace(/\*(.*?)\*/g, '$1') // Remover italic
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remover links
            .replace(/`(.*?)`/g, '$1') // Remover code
            .replace(/\n{2,}/g, '\n') // Múltiplas quebras de linha
            .trim();
    }

    /**
     * Extrai seções específicas da biografia
     */
    extrairSecoesBiografia(biografiaMarkdown) {
        const secoes = {};
        
        // Regex para extrair seções
        const patterns = {
            formacao: /## FORMAÇÃO ACADÊMICA\s*(.*?)(?=##|$)/s,
            experiencia: /## EXPERIÊNCIA PROFISSIONAL\s*(.*?)(?=##|$)/s,
            competencias_tecnicas: /## COMPETÊNCIAS TÉCNICAS\s*(.*?)(?=##|$)/s,
            competencias_comportamentais: /## COMPETÊNCIAS COMPORTAMENTAIS\s*(.*?)(?=##|$)/s,
            responsabilidades: /## RESPONSABILIDADES NA\s+.*?\s*(.*?)(?=##|$)/s
        };

        for (const [secao, pattern] of Object.entries(patterns)) {
            const match = biografiaMarkdown.match(pattern);
            secoes[secao] = match ? match[1].trim() : '';
        }

        return secoes;
    }

    /**
     * Gera competências específicas para uma persona
     */
    gerarCompetenciasPersona(personaAnalise) {
        const { categoria, especialidade } = personaAnalise;
        let competencias = {
            tecnicas: [],
            comportamentais: [],
            ferramentas: []
        };

        // Competências baseadas na categoria
        if (categoria === 'executivos' || personaAnalise.nome.includes('CEO')) {
            competencias.tecnicas = [...this.competenciasBase.executivos.tecnicas];
            competencias.comportamentais = [...this.competenciasBase.executivos.comportamentais];
            competencias.ferramentas = [
                "Microsoft Office 365",
                "Google Workspace", 
                "Slack",
                "Zoom",
                "Power BI",
                "Tableau"
            ];
        } else if (categoria === 'assistentes') {
            competencias.tecnicas = [...this.competenciasBase.assistentes.tecnicas];
            competencias.comportamentais = [...this.competenciasBase.assistentes.comportamentais];
            competencias.ferramentas = [
                "Microsoft Office 365",
                "Google Workspace",
                "Slack", 
                "Zoom",
                "Trello",
                "Notion"
            ];
        } else if (categoria === 'especialistas' && especialidade) {
            // Competências específicas da especialidade
            const especComp = this.competenciasPorEspecialidade[especialidade];
            if (especComp) {
                competencias.tecnicas = [...especComp.tecnicas];
                competencias.comportamentais = [...especComp.comportamentais];
                competencias.ferramentas = [...especComp.ferramentas];
            }
        }

        // Adicionar competências universais
        competencias.comportamentais.push(
            "Trabalho em Equipe",
            "Comunicação Eficaz",
            "Orientação a Resultados"
        );

        // Remover duplicatas e limitar quantidade
        competencias.tecnicas = [...new Set(competencias.tecnicas)].slice(0, 7);
        competencias.comportamentais = [...new Set(competencias.comportamentais)].slice(0, 6); 
        competencias.ferramentas = [...new Set(competencias.ferramentas)].slice(0, 7);

        return competencias;
    }

    /**
     * Processa todas as personas e gera arquivo de competências
     */
    async processarPersonas(empresaCodigo, outputPath = null) {
        try {
            const baseDir = outputPath || path.join(__dirname, '..', '..', 'output', `EMPRESA_${empresaCodigo.toUpperCase()}`);
            const personasDir = path.join(baseDir, '04_PERSONAS_SCRIPTS_1_2_3');
            
            console.log(`🔍 Processando personas em: ${personasDir}`);

            // Verificar se diretório existe
            try {
                await fs.access(personasDir);
            } catch (error) {
                throw new Error(`Diretório de personas não encontrado: ${personasDir}`);
            }

            // Carregar configuração de personas
            const configPath = path.join(baseDir, 'personas_config.json');
            let personasConfig = {};
            
            try {
                const configData = await fs.readFile(configPath, 'utf8');
                personasConfig = JSON.parse(configData);
            } catch (error) {
                console.warn(`⚠️ Arquivo personas_config.json não encontrado, processando biografias diretamente`);
            }

            const resultadoAnalise = {
                empresa_codigo: empresaCodigo,
                data_processamento: new Date().toISOString(),
                total_personas: 0,
                personas: {},
                estatisticas: {
                    por_categoria: {},
                    por_especialidade: {},
                    competencias_unicas: {
                        tecnicas: new Set(),
                        comportamentais: new Set(), 
                        ferramentas: new Set()
                    }
                }
            };

            // Processar cada categoria
            const categorias = await fs.readdir(personasDir);
            
            for (const categoria of categorias) {
                const categoriaPath = path.join(personasDir, categoria);
                const stat = await fs.stat(categoriaPath);
                
                if (!stat.isDirectory()) continue;

                console.log(`📋 Processando categoria: ${categoria}`);
                
                const personas = await fs.readdir(categoriaPath);
                resultadoAnalise.estatisticas.por_categoria[categoria] = 0;

                for (const personaFolder of personas) {
                    const personaPath = path.join(categoriaPath, personaFolder);
                    const personaStat = await fs.stat(personaPath);
                    
                    if (!personaStat.isDirectory()) continue;

                    // Procurar arquivo de biografia
                    const files = await fs.readdir(personaPath);
                    const bioFile = files.find(f => f.endsWith('_bio.md'));
                    
                    if (!bioFile) {
                        console.warn(`⚠️ Biografia não encontrada para: ${personaFolder}`);
                        continue;
                    }

                    const bioPath = path.join(personaPath, bioFile);
                    const biografiaContent = await fs.readFile(bioPath, 'utf8');

                    // Encontrar dados da persona na config
                    let personaData = null;
                    if (personasConfig.ceo && personasConfig.ceo.nomeCompleto.replace(/\s+/g, '_') === personaFolder) {
                        personaData = personasConfig.ceo;
                    } else {
                        // Procurar nas outras categorias
                        for (const [cat, personas] of Object.entries(personasConfig)) {
                            if (cat === 'ceo') continue;
                            for (const persona of Object.values(personas)) {
                                if (persona.nomeCompleto.replace(/\s+/g, '_') === personaFolder) {
                                    personaData = persona;
                                    break;
                                }
                            }
                            if (personaData) break;
                        }
                    }

                    if (!personaData) {
                        // Criar dados básicos se não encontrados
                        personaData = {
                            nomeCompleto: personaFolder.replace(/_/g, ' '),
                            categoria: categoria,
                            especialidade: null,
                            anosExperiencia: 5,
                            educacao: 'Ensino Superior',
                            idiomas: ['português', 'inglês']
                        };
                    }

                    // Analisar biografia
                    const analise = this.analizarBiografia(biografiaContent, personaData);
                    if (!analise) continue;

                    // Gerar competências
                    const competencias = this.gerarCompetenciasPersona(analise);

                    // Criar pasta script1_competencias se não existir
                    const script1Dir = path.join(personaPath, 'script1_competencias');
                    await fs.mkdir(script1Dir, { recursive: true });

                    // Salvar competências individuais
                    const competenciasPersona = {
                        persona: {
                            nome: analise.nome,
                            categoria: analise.categoria,
                            especialidade: analise.especialidade,
                            experiencia: analise.experiencia
                        },
                        competencias: competencias,
                        analise_biografia: {
                            educacao: analise.educacao,
                            idiomas: analise.idiomas,
                            secoes_extraidas: Object.keys(analise.secoes)
                        },
                        data_processamento: new Date().toISOString()
                    };

                    const competenciasPath = path.join(script1Dir, 'competencias_core.json');
                    await fs.writeFile(competenciasPath, JSON.stringify(competenciasPersona, null, 2), 'utf8');

                    // Adicionar ao resultado geral
                    resultadoAnalise.personas[personaFolder] = competenciasPersona;
                    resultadoAnalise.total_personas++;
                    resultadoAnalise.estatisticas.por_categoria[categoria]++;

                    // Estatísticas por especialidade
                    if (analise.especialidade) {
                        if (!resultadoAnalise.estatisticas.por_especialidade[analise.especialidade]) {
                            resultadoAnalise.estatisticas.por_especialidade[analise.especialidade] = 0;
                        }
                        resultadoAnalise.estatisticas.por_especialidade[analise.especialidade]++;
                    }

                    // Coletar competências únicas
                    competencias.tecnicas.forEach(c => resultadoAnalise.estatisticas.competencias_unicas.tecnicas.add(c));
                    competencias.comportamentais.forEach(c => resultadoAnalise.estatisticas.competencias_unicas.comportamentais.add(c));
                    competencias.ferramentas.forEach(c => resultadoAnalise.estatisticas.competencias_unicas.ferramentas.add(c));

                    console.log(`✅ Processado: ${analise.nome} (${categoria})`);
                }
            }

            // Converter Sets para Arrays
            resultadoAnalise.estatisticas.competencias_unicas.tecnicas = 
                Array.from(resultadoAnalise.estatisticas.competencias_unicas.tecnicas);
            resultadoAnalise.estatisticas.competencias_unicas.comportamentais = 
                Array.from(resultadoAnalise.estatisticas.competencias_unicas.comportamentais);
            resultadoAnalise.estatisticas.competencias_unicas.ferramentas = 
                Array.from(resultadoAnalise.estatisticas.competencias_unicas.ferramentas);

            // Salvar resultado consolidado
            const resultadoPath = path.join(baseDir, 'competencias_analysis.json');
            await fs.writeFile(resultadoPath, JSON.stringify(resultadoAnalise, null, 2), 'utf8');

            console.log(`\n✅ SCRIPT 1 - COMPETÊNCIAS FINALIZADO`);
            console.log(`📊 Total de personas processadas: ${resultadoAnalise.total_personas}`);
            console.log(`📁 Arquivo de análise salvo: ${resultadoPath}`);
            console.log(`🎯 Competências únicas identificadas:`);
            console.log(`   - Técnicas: ${resultadoAnalise.estatisticas.competencias_unicas.tecnicas.length}`);
            console.log(`   - Comportamentais: ${resultadoAnalise.estatisticas.competencias_unicas.comportamentais.length}`);
            console.log(`   - Ferramentas: ${resultadoAnalise.estatisticas.competencias_unicas.ferramentas.length}`);

            return {
                success: true,
                total_personas: resultadoAnalise.total_personas,
                output_path: resultadoPath,
                data: resultadoAnalise
            };

        } catch (error) {
            console.error(`❌ Erro no Script 1 - Competências: ${error.message}`);
            throw error;
        }
    }
}

// Função principal para execução via CLI
async function main() {
    const args = process.argv.slice(2);
    let empresaCodigo = null;
    let outputPath = null;

    // Processar argumentos da linha de comando
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--empresa-codigo') {
            empresaCodigo = args[i + 1];
        }
        if (args[i] === '--output-path') {
            outputPath = args[i + 1];
        }
    }

    if (!empresaCodigo) {
        console.error('❌ Erro: --empresa-codigo é obrigatório');
        console.log('Uso: node 01_generate_competencias.js --empresa-codigo CODIGO_EMPRESA');
        process.exit(1);
    }

    try {
        const generator = new CompetenciasGenerator();
        const result = await generator.processarPersonas(empresaCodigo, outputPath);
        
        console.log('\n🎉 Script 1 executado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Erro na execução: ${error.message}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

// Exportar classe para uso como módulo
module.exports = { CompetenciasGenerator };