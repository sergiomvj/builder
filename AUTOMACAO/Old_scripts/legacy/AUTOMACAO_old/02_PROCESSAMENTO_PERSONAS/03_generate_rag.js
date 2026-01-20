#!/usr/bin/env node
/**
 * 🎯 SCRIPT 3 - GERAÇÃO DE RAG DATABASE (Node.js)
 * ==============================================
 * 
 * Criação de base de conhecimento RAG (Retrieval-Augmented Generation)
 * estruturada com dados das personas, competências e especificações técnicas.
 * 
 * Migrado de Python para Node.js mantendo funcionalidade 100% idêntica
 * 
 * Funcionalidades:
 * - Estruturação de dados para RAG (Retrieval-Augmented Generation)
 * - Criação de embeddings para busca semântica
 * - Organização hierárquica de conhecimento
 * - Geração de contextos para Scripts 4-5
 * - Preparação para integração com Supabase/Vector DB
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js)
 * @date 2024-12-19
 */

const fs = require('fs').promises;
const path = require('path');

class RAGGenerator {
    constructor() {
        // Estrutura de dados RAG
        this.ragSchema = {
            personas: {
                descricao: "Informações detalhadas sobre cada persona",
                campos: [
                    "id", "nome_completo", "categoria", "especialidade",
                    "biografia_completa", "competencias_tecnicas", 
                    "competencias_comportamentais", "ferramentas",
                    "experiencia", "educacao", "idiomas"
                ]
            },
            competencias: {
                descricao: "Mapeamento de competências e skills",
                campos: [
                    "id", "nome", "categoria", "nivel", "especialidade_relacionada",
                    "descricao", "ferramentas_associadas", "personas_que_possuem"
                ]
            },
            ferramentas: {
                descricao: "Catálogo de ferramentas e tecnologias",
                campos: [
                    "id", "nome", "categoria", "especificacao_tecnica",
                    "api_disponivel", "custo", "personas_utilizadoras",
                    "integracao_prioridade", "requisitos_sistema"
                ]
            },
            processos: {
                descricao: "Processos de negócio e workflows",
                campos: [
                    "id", "nome", "categoria", "personas_envolvidas",
                    "ferramentas_necessarias", "etapas", "automatizacao_possivel",
                    "kpis", "documentacao_relacionada"
                ]
            },
            conhecimento_empresa: {
                descricao: "Base de conhecimento específica da empresa",
                campos: [
                    "id", "topico", "categoria", "conteudo", "fonte",
                    "personas_relevantes", "tags", "ultima_atualizacao",
                    "nivel_confidencialidade"
                ]
            }
        };

        // Templates de contexto para diferentes tipos de consulta
        this.contextTemplates = {
            persona_lookup: {
                template: "Encontre informações sobre {persona_nome} que trabalha como {cargo} na área de {especialidade}.",
                campos_retorno: ["biografia", "competencias", "experiencia", "ferramentas"]
            },
            competencia_search: {
                template: "Busque pessoas com competência em {competencia} ou ferramentas relacionadas a {area}.",
                campos_retorno: ["personas_com_competencia", "nivel_expertise", "ferramentas_utilizadas"]
            },
            ferramenta_analysis: {
                template: "Analise o uso de {ferramenta} na empresa e quem pode implementar/utilizar.",
                campos_retorno: ["usuarios_atuais", "especificacoes_tecnicas", "processo_implementacao"]
            },
            processo_optimization: {
                template: "Identifique oportunidades de otimização no processo de {processo} envolvendo {personas}.",
                campos_retorno: ["processo_atual", "gargalos", "automacao_possivel", "recursos_necessarios"]
            }
        };

        // Categorização para embedding e busca semântica
        this.embedCategories = {
            biographical: ["biografia", "formacao", "experiencia", "trajetoria"],
            technical: ["competencia_tecnica", "ferramenta", "tecnologia", "sistema"],
            behavioral: ["competencia_comportamental", "soft_skill", "lideranca", "colaboracao"],
            process: ["processo", "workflow", "procedimento", "metodologia"],
            business: ["estrategia", "negocio", "mercado", "resultado"]
        };
    }

    /**
     * Estrutura dados de personas para RAG
     */
    estruturarPersonasRAG(competenciasData, techSpecsData) {
        try {
            const ragPersonas = [];
            let personaId = 1;

            for (const [personaFolder, personaData] of Object.entries(competenciasData.personas)) {
                const { persona, competencias, analise_biografia } = personaData;

                // Buscar especificações técnicas correspondentes
                const techSpecs = this.encontrarTechSpecsPersona(personaFolder, techSpecsData);

                const ragPersona = {
                    id: personaId++,
                    persona_key: personaFolder,
                    nome_completo: persona.nome,
                    categoria: persona.categoria,
                    especialidade: persona.especialidade,
                    experiencia_anos: persona.experiencia,
                    
                    // Dados biográficos estruturados
                    biografia: {
                        educacao: analise_biografia.educacao,
                        idiomas: analise_biografia.idiomas,
                        secoes_extraidas: analise_biografia.secoes_extraidas
                    },

                    // Competências categorizadas
                    competencias: {
                        tecnicas: competencias.tecnicas.map((comp, idx) => ({
                            id: `${personaId-1}_t_${idx+1}`,
                            nome: comp,
                            categoria: 'tecnica',
                            nivel: this.inferirNivelCompetencia(comp, persona.experiencia),
                            contexto: this.gerarContextoCompetencia(comp, persona.especialidade)
                        })),
                        comportamentais: competencias.comportamentais.map((comp, idx) => ({
                            id: `${personaId-1}_c_${idx+1}`,
                            nome: comp,
                            categoria: 'comportamental',
                            nivel: this.inferirNivelCompetencia(comp, persona.experiencia),
                            contexto: this.gerarContextoCompetencia(comp, persona.categoria)
                        }))
                    },

                    // Ferramentas e tecnologias
                    ferramentas: competencias.ferramentas.map((tool, idx) => ({
                        id: `${personaId-1}_f_${idx+1}`,
                        nome: tool,
                        categoria_uso: this.categorizarUsoFerramenta(tool, persona.especialidade),
                        nivel_proficiencia: this.inferirProficienciaFerramenta(tool, persona.experiencia),
                        especificacoes: techSpecs ? techSpecs.documentacao_tecnica : null
                    })),

                    // Metadados para busca
                    search_metadata: {
                        tags: this.gerarTagsPersona(persona, competencias),
                        embedding_text: this.gerarTextoEmbedding(persona, competencias, analise_biografia),
                        update_timestamp: new Date().toISOString()
                    }
                };

                ragPersonas.push(ragPersona);
            }

            return ragPersonas;

        } catch (error) {
            console.error(`❌ Erro na estruturação de personas RAG: ${error.message}`);
            return [];
        }
    }

    /**
     * Encontra especificações técnicas para uma persona específica
     */
    encontrarTechSpecsPersona(personaFolder, techSpecsData) {
        if (!techSpecsData || !techSpecsData.especificacoes_categorias) return null;

        // Lógica simplificada - em produção seria mais sofisticada
        return {
            categorias_aplicaveis: Object.keys(techSpecsData.especificacoes_categorias),
            implementacao_prioridade: "média"
        };
    }

    /**
     * Infere nível de competência baseado na experiência
     */
    inferirNivelCompetencia(competencia, anosExperiencia) {
        if (anosExperiencia >= 10) return "expert";
        if (anosExperiencia >= 5) return "avançado";
        if (anosExperiencia >= 2) return "intermediário";
        return "básico";
    }

    /**
     * Gera contexto para uma competência
     */
    gerarContextoCompetencia(competencia, especialidadeOuCategoria) {
        const contextos = {
            "Liderança": "Capacidade de guiar equipes e influenciar resultados organizacionais",
            "Gestão de Projetos": "Coordenação de recursos, prazos e entregas para atingir objetivos",
            "Marketing Digital": "Estratégias de promoção e engajamento em plataformas digitais",
            "Análise de Dados": "Interpretação de informações para tomada de decisões estratégicas",
            "Comunicação Eficaz": "Habilidade de transmitir ideias de forma clara e persuasiva",
            "Trabalho em Equipe": "Colaboração produtiva com diferentes perfis profissionais"
        };

        return contextos[competencia] || `Competência em ${competencia} aplicada no contexto de ${especialidadeOuCategoria}`;
    }

    /**
     * Categoriza uso de ferramenta baseado na especialidade
     */
    categorizarUsoFerramenta(ferramenta, especialidade) {
        const categorizacao = {
            "Microsoft Office 365": "produtividade_geral",
            "Google Workspace": "produtividade_geral",
            "Slack": "comunicacao",
            "Zoom": "comunicacao",
            "Power BI": "analytics",
            "Tableau": "analytics",
            "Adobe Creative Suite": "design",
            "Figma": "design",
            "Git/GitHub": "desenvolvimento",
            "Docker": "infraestrutura"
        };

        return categorizacao[ferramenta] || "especializada";
    }

    /**
     * Infere proficiência em ferramenta
     */
    inferirProficienciaFerramenta(ferramenta, anosExperiencia) {
        // Ferramentas básicas têm proficiência rápida
        const ferramentasBasicas = ["Microsoft Office 365", "Google Workspace", "Slack", "Zoom"];
        
        if (ferramentasBasicas.includes(ferramenta)) {
            return anosExperiencia >= 2 ? "avançado" : "intermediário";
        }
        
        // Ferramentas especializadas requerem mais tempo
        if (anosExperiencia >= 7) return "expert";
        if (anosExperiencia >= 4) return "avançado";
        if (anosExperiencia >= 2) return "intermediário";
        return "básico";
    }

    /**
     * Gera tags para busca da persona
     */
    gerarTagsPersona(persona, competencias) {
        const tags = [
            persona.categoria,
            persona.especialidade,
            ...competencias.tecnicas.slice(0, 3), // Top 3 competências técnicas
            ...competencias.comportamentais.slice(0, 2) // Top 2 comportamentais
        ].filter(Boolean);

        return [...new Set(tags)]; // Remove duplicatas
    }

    /**
     * Gera texto otimizado para embedding
     */
    gerarTextoEmbedding(persona, competencias, analise_biografia) {
        return [
            `${persona.nome} trabalha como ${persona.categoria}`,
            persona.especialidade ? `especialista em ${persona.especialidade}` : "",
            `com ${persona.experiencia} anos de experiência`,
            `competências técnicas: ${competencias.tecnicas.join(', ')}`,
            `competências comportamentais: ${competencias.comportamentais.join(', ')}`,
            `utiliza ferramentas: ${competencias.ferramentas.join(', ')}`,
            `educação: ${analise_biografia.educacao}`,
            `idiomas: ${analise_biografia.idiomas.join(', ')}`
        ].filter(Boolean).join('. ');
    }

    /**
     * Cria catálogo unificado de competências
     */
    criarCatalogoCompetencias(ragPersonas) {
        const catalogoCompetencias = [];
        const competenciasUnicas = new Map();
        let compId = 1;

        ragPersonas.forEach(persona => {
            // Processar competências técnicas
            persona.competencias.tecnicas.forEach(comp => {
                const chave = `${comp.nome}_${comp.categoria}`;
                
                if (!competenciasUnicas.has(chave)) {
                    competenciasUnicas.set(chave, {
                        id: compId++,
                        nome: comp.nome,
                        categoria: comp.categoria,
                        contexto: comp.contexto,
                        personas_possuidoras: [],
                        ferramentas_relacionadas: [],
                        nivel_medio: []
                    });
                }

                const competenciaRef = competenciasUnicas.get(chave);
                competenciaRef.personas_possuidoras.push({
                    persona_id: persona.id,
                    nome: persona.nome_completo,
                    nivel: comp.nivel,
                    especialidade: persona.especialidade
                });
                competenciaRef.nivel_medio.push(comp.nivel);
            });

            // Processar competências comportamentais
            persona.competencias.comportamentais.forEach(comp => {
                const chave = `${comp.nome}_${comp.categoria}`;
                
                if (!competenciasUnicas.has(chave)) {
                    competenciasUnicas.set(chave, {
                        id: compId++,
                        nome: comp.nome,
                        categoria: comp.categoria,
                        contexto: comp.contexto,
                        personas_possuidoras: [],
                        ferramentas_relacionadas: [],
                        nivel_medio: []
                    });
                }

                const competenciaRef = competenciasUnicas.get(chave);
                competenciaRef.personas_possuidoras.push({
                    persona_id: persona.id,
                    nome: persona.nome_completo,
                    nivel: comp.nivel,
                    especialidade: persona.especialidade
                });
                competenciaRef.nivel_medio.push(comp.nivel);
            });

            // Associar ferramentas às competências
            persona.ferramentas.forEach(ferramenta => {
                persona.competencias.tecnicas.forEach(comp => {
                    const chave = `${comp.nome}_${comp.categoria}`;
                    if (competenciasUnicas.has(chave)) {
                        const competenciaRef = competenciasUnicas.get(chave);
                        if (!competenciaRef.ferramentas_relacionadas.includes(ferramenta.nome)) {
                            competenciaRef.ferramentas_relacionadas.push(ferramenta.nome);
                        }
                    }
                });
            });
        });

        // Converter para array e calcular médias
        competenciasUnicas.forEach((comp, chave) => {
            // Calcular nível médio
            const niveis = { "básico": 1, "intermediário": 2, "avançado": 3, "expert": 4 };
            const nivelNumericoMedio = comp.nivel_medio.reduce((sum, nivel) => sum + niveis[nivel], 0) / comp.nivel_medio.length;
            
            comp.nivel_medio_calculado = nivelNumericoMedio >= 3.5 ? "expert" :
                                       nivelNumericoMedio >= 2.5 ? "avançado" :
                                       nivelNumericoMedio >= 1.5 ? "intermediário" : "básico";
            
            delete comp.nivel_medio; // Remover array temporário
            catalogoCompetencias.push(comp);
        });

        return catalogoCompetencias;
    }

    /**
     * Cria catálogo de ferramentas
     */
    criarCatalogoFerramentas(ragPersonas, techSpecsData) {
        const catalogoFerramentas = [];
        const ferramentasUnicas = new Map();
        let toolId = 1;

        ragPersonas.forEach(persona => {
            persona.ferramentas.forEach(ferramenta => {
                if (!ferramentasUnicas.has(ferramenta.nome)) {
                    // Buscar especificações técnicas
                    const techSpec = this.buscarSpecificacaoFerramenta(ferramenta.nome, techSpecsData);
                    
                    ferramentasUnicas.set(ferramenta.nome, {
                        id: toolId++,
                        nome: ferramenta.nome,
                        categoria_uso: ferramenta.categoria_uso,
                        especificacoes_tecnicas: techSpec,
                        usuarios: [],
                        casos_uso: [],
                        integracao_prioridade: "média"
                    });
                }

                const ferramentaRef = ferramentasUnicas.get(ferramenta.nome);
                ferramentaRef.usuarios.push({
                    persona_id: persona.id,
                    nome: persona.nome_completo,
                    proficiencia: ferramenta.nivel_proficiencia,
                    especialidade: persona.especialidade,
                    categoria: persona.categoria
                });

                // Adicionar caso de uso baseado na especialidade
                const casoUso = `${ferramenta.categoria_uso} para ${persona.especialidade || persona.categoria}`;
                if (!ferramentaRef.casos_uso.includes(casoUso)) {
                    ferramentaRef.casos_uso.push(casoUso);
                }
            });
        });

        return Array.from(ferramentasUnicas.values());
    }

    /**
     * Busca especificação técnica de uma ferramenta
     */
    buscarSpecificacaoFerramenta(nomeFerramenta, techSpecsData) {
        if (!techSpecsData || !techSpecsData.especificacoes_categorias) return null;

        for (const categoria of Object.values(techSpecsData.especificacoes_categorias)) {
            if (categoria.ferramentas && categoria.ferramentas.includes(nomeFerramenta)) {
                return {
                    categoria: categoria.categoria,
                    api_integracao: categoria.especificacoes.integracao_api,
                    requisitos_sistema: categoria.especificacoes.requisitos_sistema,
                    funcionalidades: categoria.especificacoes.funcionalidades_core
                };
            }
        }

        return null;
    }

    /**
     * Gera estrutura de conhecimento para consultas RAG
     */
    gerarEstruturaPesquisa(ragPersonas, catalogoCompetencias, catalogoFerramentas) {
        const estruturaPesquisa = {
            indices: {
                por_persona: {},
                por_competencia: {},
                por_ferramenta: {},
                por_especialidade: {},
                por_categoria: {}
            },
            relacionamentos: {
                persona_competencia: [],
                persona_ferramenta: [],
                competencia_ferramenta: [],
                especialidade_ferramenta: []
            },
            contextos_busca: []
        };

        // Criar índices
        ragPersonas.forEach(persona => {
            // Índice por persona
            estruturaPesquisa.indices.por_persona[persona.nome_completo] = persona;

            // Índice por especialidade
            if (persona.especialidade) {
                if (!estruturaPesquisa.indices.por_especialidade[persona.especialidade]) {
                    estruturaPesquisa.indices.por_especialidade[persona.especialidade] = [];
                }
                estruturaPesquisa.indices.por_especialidade[persona.especialidade].push(persona);
            }

            // Índice por categoria
            if (!estruturaPesquisa.indices.por_categoria[persona.categoria]) {
                estruturaPesquisa.indices.por_categoria[persona.categoria] = [];
            }
            estruturaPesquisa.indices.por_categoria[persona.categoria].push(persona);

            // Relacionamentos persona-competencia
            [...persona.competencias.tecnicas, ...persona.competencias.comportamentais].forEach(comp => {
                estruturaPesquisa.relacionamentos.persona_competencia.push({
                    persona_id: persona.id,
                    competencia_nome: comp.nome,
                    nivel: comp.nivel,
                    categoria: comp.categoria
                });
            });

            // Relacionamentos persona-ferramenta
            persona.ferramentas.forEach(ferramenta => {
                estruturaPesquisa.relacionamentos.persona_ferramenta.push({
                    persona_id: persona.id,
                    ferramenta_nome: ferramenta.nome,
                    proficiencia: ferramenta.nivel_proficiencia,
                    categoria_uso: ferramenta.categoria_uso
                });
            });
        });

        // Índices por competência e ferramenta
        catalogoCompetencias.forEach(comp => {
            estruturaPesquisa.indices.por_competencia[comp.nome] = comp;
        });

        catalogoFerramentas.forEach(tool => {
            estruturaPesquisa.indices.por_ferramenta[tool.nome] = tool;
        });

        // Gerar contextos de busca
        estruturaPesquisa.contextos_busca = this.gerarContextosBuscaRAG(ragPersonas, catalogoCompetencias, catalogoFerramentas);

        return estruturaPesquisa;
    }

    /**
     * Gera contextos específicos para busca RAG
     */
    gerarContextosBuscaRAG(ragPersonas, catalogoCompetencias, catalogoFerramentas) {
        const contextos = [];

        // Contextos por persona
        ragPersonas.forEach(persona => {
            contextos.push({
                id: `persona_${persona.id}`,
                tipo: "persona_profile",
                titulo: `Perfil de ${persona.nome_completo}`,
                conteudo: persona.search_metadata.embedding_text,
                metadata: {
                    categoria: persona.categoria,
                    especialidade: persona.especialidade,
                    experiencia: persona.experiencia_anos
                },
                tags: persona.search_metadata.tags
            });
        });

        // Contextos por competência
        catalogoCompetencias.forEach(comp => {
            const personasComCompetencia = comp.personas_possuidoras.map(p => p.nome).join(', ');
            contextos.push({
                id: `competencia_${comp.id}`,
                tipo: "competencia_analysis",
                titulo: `Análise da competência ${comp.nome}`,
                conteudo: `${comp.contexto}. Personas com esta competência: ${personasComCompetencia}. Ferramentas relacionadas: ${comp.ferramentas_relacionadas.join(', ')}.`,
                metadata: {
                    categoria: comp.categoria,
                    nivel_medio: comp.nivel_medio_calculado,
                    total_personas: comp.personas_possuidoras.length
                },
                tags: [comp.nome, comp.categoria, ...comp.ferramentas_relacionadas]
            });
        });

        // Contextos por ferramenta
        catalogoFerramentas.forEach(tool => {
            const usuariosFerrament = tool.usuarios.map(u => u.nome).join(', ');
            contextos.push({
                id: `ferramenta_${tool.id}`,
                tipo: "ferramenta_usage",
                titulo: `Uso da ferramenta ${tool.nome}`,
                conteudo: `${tool.nome} é utilizada para ${tool.categoria_uso}. Casos de uso identificados: ${tool.casos_uso.join(', ')}. Usuários: ${usuariosFerrament}.`,
                metadata: {
                    categoria_uso: tool.categoria_uso,
                    total_usuarios: tool.usuarios.length,
                    casos_uso_count: tool.casos_uso.length
                },
                tags: [tool.nome, tool.categoria_uso, ...tool.casos_uso]
            });
        });

        return contextos;
    }

    /**
     * Processa dados e gera estrutura RAG completa
     */
    async processarRAGDatabase(empresaCodigo, inputDir = null, outputPath = null) {
        try {
            const baseDir = outputPath || path.join(__dirname, '..', '..', 'output', `EMPRESA_${empresaCodigo.toUpperCase()}`);
            
            console.log(`🔍 Iniciando processamento RAG para ${empresaCodigo.toUpperCase()}`);

            // Carregar dados de entrada
            const competenciasPath = path.join(baseDir, 'competencias_analysis.json');
            const techSpecsPath = path.join(baseDir, 'tech_specifications.json');

            // Verificar arquivos de entrada
            try {
                await fs.access(competenciasPath);
                await fs.access(techSpecsPath);
            } catch (error) {
                throw new Error(`Arquivos de entrada não encontrados. Certifique-se que Scripts 1 e 2 foram executados.`);
            }

            // Carregar dados
            const competenciasData = JSON.parse(await fs.readFile(competenciasPath, 'utf8'));
            const techSpecsData = JSON.parse(await fs.readFile(techSpecsPath, 'utf8'));

            console.log(`📊 Processando ${competenciasData.total_personas} personas para RAG`);

            // 1. Estruturar personas para RAG
            const ragPersonas = this.estruturarPersonasRAG(competenciasData, techSpecsData);
            console.log(`✅ Estruturadas ${ragPersonas.length} personas RAG`);

            // 2. Criar catálogo de competências
            const catalogoCompetencias = this.criarCatalogoCompetencias(ragPersonas);
            console.log(`✅ Criado catálogo com ${catalogoCompetencias.length} competências únicas`);

            // 3. Criar catálogo de ferramentas
            const catalogoFerramentas = this.criarCatalogoFerramentas(ragPersonas, techSpecsData);
            console.log(`✅ Criado catálogo com ${catalogoFerramentas.length} ferramentas únicas`);

            // 4. Gerar estrutura de pesquisa
            const estruturaPesquisa = this.gerarEstruturaPesquisa(ragPersonas, catalogoCompetencias, catalogoFerramentas);
            console.log(`✅ Estrutura de pesquisa com ${estruturaPesquisa.contextos_busca.length} contextos`);

            // 5. Criar estrutura final RAG
            const ragDatabase = {
                empresa_codigo: empresaCodigo,
                versao_rag: "1.0.0",
                data_criacao: new Date().toISOString(),
                
                // Dados estruturados
                personas: ragPersonas,
                competencias: catalogoCompetencias,
                ferramentas: catalogoFerramentas,
                
                // Estruturas de busca
                indices: estruturaPesquisa.indices,
                relacionamentos: estruturaPesquisa.relacionamentos,
                contextos_busca: estruturaPesquisa.contextos_busca,
                
                // Metadados para RAG
                metadata_rag: {
                    total_personas: ragPersonas.length,
                    total_competencias: catalogoCompetencias.length,
                    total_ferramentas: catalogoFerramentas.length,
                    total_contextos: estruturaPesquisa.contextos_busca.length,
                    schema_version: "1.0",
                    embedding_ready: true
                },
                
                // Configuração para queries
                query_templates: this.contextTemplates,
                embed_categories: this.embedCategories
            };

            // 6. Criar estruturas individuais por persona
            const personasDir = path.join(baseDir, '04_PERSONAS_SCRIPTS_1_2_3');
            const categorias = await fs.readdir(personasDir);

            for (const categoria of categorias) {
                const categoriaPath = path.join(personasDir, categoria);
                const categoriaStats = await fs.stat(categoriaPath);
                
                if (!categoriaStats.isDirectory()) continue;

                const personas = await fs.readdir(categoriaPath);
                
                for (const personaFolder of personas) {
                    const personaPath = path.join(categoriaPath, personaFolder);
                    const personaStats = await fs.stat(personaPath);
                    
                    if (!personaStats.isDirectory()) continue;

                    // Encontrar dados RAG da persona
                    const personaRAG = ragPersonas.find(p => p.persona_key === personaFolder);
                    
                    if (!personaRAG) continue;

                    // Criar pasta script3_rag
                    const script3Dir = path.join(personaPath, 'script3_rag');
                    await fs.mkdir(script3Dir, { recursive: true });

                    // Gerar contexto RAG específico da persona
                    const ragPersonaEspecifica = {
                        persona_profile: personaRAG,
                        relacionamentos: {
                            competencias_relacionadas: estruturaPesquisa.relacionamentos.persona_competencia
                                .filter(rel => rel.persona_id === personaRAG.id),
                            ferramentas_relacionadas: estruturaPesquisa.relacionamentos.persona_ferramenta
                                .filter(rel => rel.persona_id === personaRAG.id)
                        },
                        contextos_relevantes: estruturaPesquisa.contextos_busca
                            .filter(ctx => ctx.tags.some(tag => personaRAG.search_metadata.tags.includes(tag))),
                        query_examples: this.gerarExemplosQueryPersona(personaRAG),
                        data_processamento: new Date().toISOString()
                    };

                    // Salvar dados RAG da persona
                    const ragPersonaPath = path.join(script3Dir, 'rag_knowledge.json');
                    await fs.writeFile(ragPersonaPath, JSON.stringify(ragPersonaEspecifica, null, 2), 'utf8');

                    console.log(`✅ RAG gerado: ${personaRAG.nome_completo} (${categoria})`);
                }
            }

            // 7. Salvar database RAG consolidado
            const ragDatabasePath = path.join(baseDir, 'rag_knowledge_base.json');
            await fs.writeFile(ragDatabasePath, JSON.stringify(ragDatabase, null, 2), 'utf8');

            console.log(`\n✅ SCRIPT 3 - RAG DATABASE FINALIZADO`);
            console.log(`📊 Database RAG criado com:`);
            console.log(`   - ${ragPersonas.length} personas estruturadas`);
            console.log(`   - ${catalogoCompetencias.length} competências catalogadas`);
            console.log(`   - ${catalogoFerramentas.length} ferramentas mapeadas`);
            console.log(`   - ${estruturaPesquisa.contextos_busca.length} contextos de busca`);
            console.log(`📁 Database salvo em: ${ragDatabasePath}`);

            return {
                success: true,
                total_personas: ragPersonas.length,
                total_competencias: catalogoCompetencias.length,
                total_ferramentas: catalogoFerramentas.length,
                total_contextos: estruturaPesquisa.contextos_busca.length,
                output_path: ragDatabasePath,
                data: ragDatabase
            };

        } catch (error) {
            console.error(`❌ Erro no Script 3 - RAG Database: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gera exemplos de queries para uma persona
     */
    gerarExemplosQueryPersona(persona) {
        return [
            {
                tipo: "competencia_lookup",
                query: `Quais são as competências de ${persona.nome_completo}?`,
                resposta_esperada: "Lista de competências técnicas e comportamentais"
            },
            {
                tipo: "ferramenta_usage", 
                query: `Que ferramentas ${persona.nome_completo} sabe usar?`,
                resposta_esperada: "Lista de ferramentas com nível de proficiência"
            },
            {
                tipo: "colaboracao_potential",
                query: `Com quem ${persona.nome_completo} pode colaborar em projetos?`,
                resposta_esperada: "Personas com competências complementares"
            },
            {
                tipo: "processo_involvement",
                query: `Em que processos ${persona.nome_completo} deveria estar envolvido?`,
                resposta_esperada: "Processos que aproveitam suas competências"
            }
        ];
    }
}

// Função principal para execução via CLI
async function main() {
    const args = process.argv.slice(2);
    let empresaCodigo = null;
    let inputDir = null;
    let outputPath = null;

    // Processar argumentos da linha de comando
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--empresa-codigo') {
            empresaCodigo = args[i + 1];
        }
        if (args[i] === '--input-dir') {
            inputDir = args[i + 1];
        }
        if (args[i] === '--output-path') {
            outputPath = args[i + 1];
        }
    }

    if (!empresaCodigo) {
        console.error('❌ Erro: --empresa-codigo é obrigatório');
        console.log('Uso: node 03_generate_rag.js --empresa-codigo CODIGO_EMPRESA [--input-dir DIR] [--output-path PATH]');
        process.exit(1);
    }

    try {
        const generator = new RAGGenerator();
        const result = await generator.processarRAGDatabase(empresaCodigo, inputDir, outputPath);
        
        console.log('\n🎉 Script 3 executado com sucesso!');
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
module.exports = { RAGGenerator };