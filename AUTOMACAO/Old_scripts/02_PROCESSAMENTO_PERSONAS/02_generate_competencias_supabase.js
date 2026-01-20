#!/usr/bin/env node
/**
 * 🎯 SCRIPT 2 - COMPETÊNCIAS MELHORADO (Supabase)
 * ===============================================
 * 
 * Versão atualizada que:
 * 1. Salva diretamente na tabela personas_competencias
 * 2. Segue padrão de nomenclatura correto
 * 3. Limpa dados lixo automaticamente
 * 4. Integração completa com Supabase
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração do Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

class CompetenciasSupabaseGenerator {
    constructor() {
        this.competenciasPorEspecialidade = {
            vendas: {
                tecnicas: ["CRM Management", "Lead Generation", "Sales Analytics", "Negociação Avançada"],
                comportamentais: ["Persuasão", "Empatia", "Persistência", "Orientação a Resultados"],
                ferramentas: ["Salesforce", "HubSpot", "Pipedrive", "LinkedIn Sales Navigator"]
            },
            tecnologia: {
                tecnicas: ["Desenvolvimento", "DevOps", "Cloud Computing", "APIs"],
                comportamentais: ["Pensamento Lógico", "Resolução de Problemas", "Aprendizagem Contínua"],
                ferramentas: ["Git", "Docker", "AWS", "React", "Node.js"]
            },
            marketing: {
                tecnicas: ["Marketing Digital", "Growth Hacking", "Analytics", "Performance Marketing"],
                comportamentais: ["Criatividade", "Orientação a Dados", "Inovação", "Visão Estratégica"],
                ferramentas: ["Google Ads", "Facebook Ads", "HubSpot", "Google Analytics"]
            },
            financeiro: {
                tecnicas: ["Análise Financeira", "Controladoria", "Planejamento", "Auditoria"],
                comportamentais: ["Precisão", "Pensamento Analítico", "Ética", "Gestão de Pressão"],
                ferramentas: ["Excel", "SAP", "Power BI", "QuickBooks"]
            },
            rh: {
                tecnicas: ["Recrutamento", "Gestão de Pessoas", "Desenvolvimento", "Compliance"],
                comportamentais: ["Empatia", "Comunicação", "Liderança", "Orientação a Pessoas"],
                ferramentas: ["HRIS", "ATS", "LinkedIn Recruiter", "Microsoft Office"]
            }
        }

        this.competenciasBase = {
            executivos: {
                tecnicas: ["Gestão Estratégica", "Liderança", "Planejamento", "Análise de Mercado"],
                comportamentais: ["Visão Estratégica", "Tomada de Decisão", "Comunicação", "Influência"]
            },
            assistentes: {
                tecnicas: ["Gestão Administrativa", "Organização", "Comunicação Empresarial"],
                comportamentais: ["Organização", "Proatividade", "Multitasking", "Discrição"]
            }
        }
    }

    async processarCompetencias(empresaId) {
        try {
            console.log(`🎯 Processando competências para empresa: ${empresaId}`)

            // 1. Buscar personas da empresa
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId)

            if (personasError) throw personasError

            console.log(`👥 Encontradas ${personas.length} personas para processar`)

            const resultados = []
            let processadas = 0

            for (const persona of personas) {
                try {
                    console.log(`🔄 Processando: ${persona.nome}`)
                    
                    // 2. Gerar competências baseadas no cargo/especialidade
                    const competencias = this.gerarCompetenciasPersona(persona)
                    
                    // 3. Verificar se já existem competências para esta persona
                    const { data: existingComp } = await supabase
                        .from('personas_competencias')
                        .select('id')
                        .eq('persona_id', persona.id)
                        .single()

                    let resultado
                    if (existingComp) {
                        // Atualizar competências existentes
                        const { data, error } = await supabase
                            .from('personas_competencias')
                            .update({
                                competencias_tecnicas: competencias.tecnicas,
                                competencias_comportamentais: competencias.comportamentais,
                                ferramentas: competencias.ferramentas,
                                nivel_experiencia: this.calcularNivelExperiencia(persona),
                                areas_especializacao: this.extrairAreasEspecializacao(persona),
                                updated_at: new Date().toISOString()
                            })
                            .eq('persona_id', persona.id)
                            .select()

                        resultado = data
                        if (error) throw error
                        console.log(`✅ Atualizada: ${persona.nome}`)
                    } else {
                        // Inserir novas competências
                        const { data, error } = await supabase
                            .from('personas_competencias')
                            .insert({
                                persona_id: persona.id,
                                competencias_tecnicas: competencias.tecnicas,
                                competencias_comportamentais: competencias.comportamentais,
                                ferramentas: competencias.ferramentas,
                                nivel_experiencia: this.calcularNivelExperiencia(persona),
                                areas_especializacao: this.extrairAreasEspecializacao(persona)
                            })
                            .select()

                        resultado = data
                        if (error) throw error
                        console.log(`➕ Inserida: ${persona.nome}`)
                    }

                    resultados.push({
                        persona: persona.nome,
                        competencias_geradas: competencias,
                        status: 'sucesso'
                    })

                    processadas++
                    console.log(`📊 Progresso: ${processadas}/${personas.length}`)

                    // Pausa para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000))

                } catch (error) {
                    console.error(`❌ Erro ao processar ${persona.nome}:`, error.message)
                    resultados.push({
                        persona: persona.nome,
                        status: 'erro',
                        erro: error.message
                    })
                }
            }

            // 4. Salvar relatório local
            const relatorio = {
                empresa_id: empresaId,
                data_processamento: new Date().toISOString(),
                total_personas: personas.length,
                processadas: processadas,
                resultados: resultados
            }

            const outputDir = path.join(process.cwd(), 'AUTOMACAO', 'competencias_output')
            await fs.mkdir(outputDir, { recursive: true })
            
            const outputFile = path.join(outputDir, `competencias_${empresaId}_${new Date().toISOString().split('T')[0]}.json`)
            await fs.writeFile(outputFile, JSON.stringify(relatorio, null, 2))

            console.log(`\n🎉 Processamento concluído:`)
            console.log(`📊 Total: ${personas.length} personas`)
            console.log(`✅ Processadas: ${processadas}`)
            console.log(`💾 Relatório salvo: ${outputFile}`)
            console.log(`🗄️  Dados salvos na tabela: personas_competencias`)

            return relatorio

        } catch (error) {
            console.error('❌ Erro no processamento:', error)
            throw error
        }
    }

    gerarCompetenciasPersona(persona) {
        const cargo = persona.cargo?.toLowerCase() || ''
        const categoria = persona.categoria || 'especialistas'
        
        let competencias = {
            tecnicas: [],
            comportamentais: [],
            ferramentas: []
        }

        // Baseado na categoria
        if (categoria === 'executivos' || cargo.includes('ceo') || cargo.includes('diretor')) {
            competencias.tecnicas = [...this.competenciasBase.executivos.tecnicas]
            competencias.comportamentais = [...this.competenciasBase.executivos.comportamentais]
            competencias.ferramentas = ["Microsoft Office", "Google Workspace", "Power BI", "Slack"]
        } else if (cargo.includes('assistente')) {
            competencias.tecnicas = [...this.competenciasBase.assistentes.tecnicas]
            competencias.comportamentais = [...this.competenciasBase.assistentes.comportamentais]
            competencias.ferramentas = ["Microsoft Office", "Google Workspace", "Slack", "Trello"]
        }

        // Baseado na especialidade/cargo
        for (const [area, specs] of Object.entries(this.competenciasPorEspecialidade)) {
            if (cargo.includes(area) || persona.especialidade?.includes(area)) {
                competencias.tecnicas.push(...specs.tecnicas)
                competencias.comportamentais.push(...specs.comportamentais)
                competencias.ferramentas.push(...specs.ferramentas)
                break
            }
        }

        // Competências universais
        competencias.comportamentais.push("Trabalho em Equipe", "Comunicação", "Orientação a Resultados")

        // Remover duplicatas e limitar
        competencias.tecnicas = [...new Set(competencias.tecnicas)].slice(0, 6)
        competencias.comportamentais = [...new Set(competencias.comportamentais)].slice(0, 6)
        competencias.ferramentas = [...new Set(competencias.ferramentas)].slice(0, 6)

        return competencias
    }

    calcularNivelExperiencia(persona) {
        const experiencia = persona.experiencia || 0
        if (experiencia <= 2) return 'Junior'
        if (experiencia <= 5) return 'Pleno'
        if (experiencia <= 10) return 'Senior'
        return 'Especialista'
    }

    extrairAreasEspecializacao(persona) {
        const areas = []
        if (persona.cargo) areas.push(persona.cargo)
        if (persona.especialidade) areas.push(persona.especialidade)
        if (persona.departamento) areas.push(persona.departamento)
        return [...new Set(areas)]
    }
}

async function main() {
    try {
        const args = process.argv.slice(2)
        let empresaId = null

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--empresaId') {
                empresaId = args[i + 1]
                break
            }
        }

        if (!empresaId) {
            console.error('❌ Erro: --empresaId é obrigatório')
            console.log('Uso: node 02_generate_competencias_supabase.js --empresaId=EMPRESA_ID')
            process.exit(1)
        }

        const generator = new CompetenciasSupabaseGenerator()
        await generator.processarCompetencias(empresaId)

        console.log('\n🎉 Script concluído com sucesso!')

    } catch (error) {
        console.error('❌ Erro na execução:', error)
        process.exit(1)
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export { CompetenciasSupabaseGenerator }