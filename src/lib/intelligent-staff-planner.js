/**
 * 🎯 ALGORITMO INTELIGENTE DE STAFF PLANNING
 * 
 * Recebe dados da empresa e monta equipe estratégica baseada em:
 * - Objetivos de negócio
 * - Cultura nacional/regional
 * - Indústria específica
 * - Idiomas e mercados-alvo
 * - Mix demográfico
 */

class IntelligentStaffPlanner {
    constructor() {
        // Matriz de cargos por indústria e estágio
        this.industryRoles = {
            'tecnologia': {
                'startup': [
                    { role: 'CEO', priority: 1, essential: true },
                    { role: 'CTO', priority: 2, essential: true },
                    { role: 'Lead Developer', priority: 3, essential: true },
                    { role: 'Product Manager', priority: 4, essential: false },
                    { role: 'UX/UI Designer', priority: 5, essential: false }
                ],
                'scaleup': [
                    // + CFO, DevOps, Sales Manager, etc.
                ],
                'enterprise': [
                    // Full C-suite, department heads, etc.
                ]
            },
            'financeira': {
                'startup': [
                    { role: 'CEO', priority: 1, essential: true },
                    { role: 'CFO', priority: 2, essential: true },
                    { role: 'Risk Analyst', priority: 3, essential: true },
                    { role: 'Compliance Officer', priority: 4, essential: true }
                ]
            },
            'saude': {
                // Médicos, enfermeiros, administradores...
            },
            'educacao': {
                // Professores, coordenadores, diretores...
            }
        };

        // Perfis por nacionalidade/cultura
        this.culturalProfiles = {
            'US': {
                leadership_style: 'direct_results_driven',
                communication: 'assertive_transparent',
                hierarchy: 'flat_meritocratic',
                preferred_roles: ['VP Sales', 'Growth Hacker', 'Customer Success']
            },
            'BR': {
                leadership_style: 'relationship_focused',
                communication: 'diplomatic_warm',
                hierarchy: 'moderate_respectful',
                preferred_roles: ['Gerente Comercial', 'Coordenador', 'Analista']
            },
            'DE': {
                leadership_style: 'process_systematic',
                communication: 'precise_structured',
                hierarchy: 'clear_defined',
                preferred_roles: ['Technical Lead', 'Quality Manager', 'Process Engineer']
            },
            'JP': {
                leadership_style: 'consensus_long_term',
                communication: 'indirect_respectful',
                hierarchy: 'traditional_seniority',
                preferred_roles: ['Senior Advisor', 'Quality Control', 'R&D Manager']
            }
        };

        // Competências por idioma/mercado
        this.languageSkills = {
            'inglês': ['Global Markets', 'International Sales', 'Tech Documentation'],
            'espanhol': ['LATAM Expansion', 'Hispanic Markets', 'Regional Operations'],
            'mandarim': ['Asian Markets', 'Manufacturing', 'Supply Chain'],
            'alemão': ['Engineering Excellence', 'Process Optimization', 'European Operations']
        };
    }

    /**
     * 🎯 FUNÇÃO PRINCIPAL: Montar staff ideal
     */
    generateOptimalStaff(empresaData) {
        const {
            objetivos,           // ["crescer 300%", "expandir LATAM", "IPO em 3 anos"]
            industria,           // "tecnologia"
            pais,               // "BR"
            idiomas,            // ["português", "inglês", "espanhol"]
            estagio,            // "startup", "scaleup", "enterprise"
            orcamento_staff,    // "tight", "moderate", "generous"
            mix_demografico,    // { masculino: 60, feminino: 40 }
            mercados_alvo,      // ["Brasil", "LATAM", "US"]
            cultura_empresarial // "informal", "tradicional", "hibrida"
        } = empresaData;

        // 1. Determinar cargos prioritários por indústria + estágio
        const cargosBase = this.getCoreRolesByIndustry(industria, estagio);

        // 2. Adicionar cargos específicos baseados em objetivos
        const cargosEstrategicos = this.addStrategicRoles(objetivos, mercados_alvo);

        // 3. Ajustar perfis por cultura nacional
        const perfisAjustados = this.adjustProfilesByCulture(cargosBase + cargosEstrategicos, pais);

        // 4. Distribuir competências linguísticas
        const staffComIdiomas = this.distributeLanguageSkills(perfisAjustados, idiomas);

        // 5. Aplicar mix demográfico
        const staffBalanceado = this.applyDemographicMix(staffComIdiomas, mix_demografico);

        // 6. Gerar personas completas
        const personasFinais = this.generateDetailedPersonas(staffBalanceado, empresaData);

        return {
            total_staff: personasFinais.length,
            distribuicao_por_nivel: this.getHierarchyDistribution(personasFinais),
            competencias_chave: this.extractKeyCompetencies(personasFinais),
            coverage_objetivos: this.validateObjectiveCoverage(objetivos, personasFinais),
            personas: personasFinais
        };
    }

    /**
     * 📊 Exemplo de lógica de decisão
     */
    getCoreRolesByIndustry(industria, estagio) {
        const roles = this.industryRoles[industria]?.[estagio] || [];
        
        // Filtrar por essencialidade baseado no orçamento
        return roles.filter(role => {
            if (estagio === 'startup') return role.essential;
            return true; // Para scaleup/enterprise, incluir todos
        });
    }

    /**
     * 🎯 Adicionar cargos baseados em objetivos específicos
     */
    addStrategicRoles(objetivos, mercados_alvo) {
        const strategicRoles = [];

        // Se objetivo inclui "crescimento", adicionar sales/marketing
        if (objetivos.some(obj => obj.includes('crescer') || obj.includes('expansão'))) {
            strategicRoles.push({ role: 'Sales Manager', reason: 'growth_objective' });
            strategicRoles.push({ role: 'Digital Marketing', reason: 'growth_objective' });
        }

        // Se objetivo inclui "internacional", adicionar roles internacionais
        if (mercados_alvo.length > 1) {
            strategicRoles.push({ role: 'International Business', reason: 'global_expansion' });
        }

        // Se objetivo inclui "IPO", adicionar compliance/finance
        if (objetivos.some(obj => obj.includes('IPO') || obj.includes('investimento'))) {
            strategicRoles.push({ role: 'CFO', reason: 'financial_readiness' });
            strategicRoles.push({ role: 'Legal Counsel', reason: 'regulatory_compliance' });
        }

        return strategicRoles;
    }

    /**
     * 🌍 Ajustar perfis por cultura nacional
     */
    adjustProfilesByCulture(roles, pais) {
        const culturalStyle = this.culturalProfiles[pais];
        
        return roles.map(role => ({
            ...role,
            leadership_approach: culturalStyle.leadership_style,
            communication_style: culturalStyle.communication,
            cultural_fit: culturalStyle.preferred_roles.includes(role.role) ? 'high' : 'medium'
        }));
    }

    /**
     * 💬 Distribuir competências de idiomas estrategicamente
     */
    distributeLanguageSkills(roles, idiomas) {
        // CEO e roles seniores devem falar idiomas principais
        // Roles customer-facing devem ter idiomas dos mercados-alvo
        // Tech roles podem ser mais flexíveis com idiomas
        
        return roles.map((role, index) => {
            let assignedLanguages = ['nativo']; // Idioma do país
            
            if (['CEO', 'CFO', 'Sales Manager'].includes(role.role)) {
                assignedLanguages = assignedLanguages.concat(idiomas.slice(0, 2));
            } else if (role.role.includes('Manager') || role.role.includes('Lead')) {
                assignedLanguages.push(idiomas[0]);
            }
            
            return {
                ...role,
                languages: assignedLanguages,
                language_proficiency: this.generateLanguageLevels(assignedLanguages)
            };
        });
    }

    /**
     * 👥 Aplicar mix demográfico inteligentemente
     */
    applyDemographicMix(roles, mix_demografico) {
        const targetMale = Math.round(roles.length * (mix_demografico.masculino / 100));
        const targetFemale = roles.length - targetMale;

        // Distribuir considerando bias inconsciente e diversidade estratégica
        // Tech roles historicamente masculinos
        // HR/Marketing historicamente femininos
        // C-suite balanceado
        
        return roles.map((role, index) => ({
            ...role,
            suggested_gender: this.suggestGenderForRole(role, index, targetMale, targetFemale),
            diversity_reasoning: this.explainGenderChoice(role)
        }));
    }

    /**
     * 👤 Gerar personas detalhadas finais
     */
    generateDetailedPersonas(staffPlan, empresaData) {
        return staffPlan.map((roleData, index) => {
            const persona = {
                id: `persona_${index + 1}`,
                full_name: this.generateRealisticName(roleData.suggested_gender, empresaData.pais),
                role: roleData.role,
                department: this.determineDepartment(roleData.role),
                seniority: this.determineSeniority(roleData.role),
                
                // Competências técnicas específicas
                technical_skills: this.generateTechnicalSkills(roleData.role, empresaData.industria),
                soft_skills: this.generateSoftSkills(roleData.role, empresaData.cultura_empresarial),
                
                // Background cultural
                nationality: this.chooseNationality(empresaData.pais, roleData.languages),
                cultural_background: this.generateCulturalBackground(roleData),
                
                // Experiência profissional
                experience_years: this.calculateExperience(roleData.seniority),
                previous_companies: this.generatePreviousExperience(roleData.role, empresaData.industria),
                
                // Educação
                education: this.generateEducation(roleData.role, empresaData.pais),
                certifications: this.generateCertifications(roleData.role),
                
                // Idiomas
                languages: roleData.languages,
                language_levels: roleData.language_proficiency,
                
                // Personalidade baseada em role + cultura
                personality_traits: this.generatePersonalityTraits(roleData.role, empresaData.cultura_empresarial),
                work_style: this.generateWorkStyle(roleData.role, empresaData.pais),
                
                // Motivações alinhadas com objetivos da empresa
                career_motivations: this.alignMotivationsWithGoals(roleData.role, empresaData.objetivos),
                
                // Dados demográficos
                gender: roleData.suggested_gender,
                age_range: this.calculateAgeRange(roleData.seniority),
                
                // Meta informações
                reasoning: {
                    why_this_role: roleData.reason || 'core_business_function',
                    cultural_fit: roleData.cultural_fit,
                    strategic_importance: this.calculateStrategicImportance(roleData.role, empresaData.objetivos)
                }
            };
            
            return persona;
        });
    }
}

/**
 * 🚀 EXEMPLO DE USO:
 */
const staffPlanner = new IntelligentStaffPlanner();

const empresaExample = {
    objetivos: ["crescer 300% em 2 anos", "expandir para LATAM", "IPO até 2027"],
    industria: "tecnologia",
    pais: "BR",
    idiomas: ["português", "inglês", "espanhol"],
    estagio: "scaleup",
    orcamento_staff: "moderate",
    mix_demografico: { masculino: 55, feminino: 45 },
    mercados_alvo: ["Brasil", "Argentina", "México", "Colômbia"],
    cultura_empresarial: "hibrida"
};

// const staffIdeal = staffPlanner.generateOptimalStaff(empresaExample);
// console.log('Staff recomendado:', staffIdeal);

export default IntelligentStaffPlanner;