#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

class BiografiasSimplificado {
    constructor() {
        // Templates básicos por role - sem IA
        this.biografiaTemplates = {
            'CEO': (nome, empresa, params) => `
**${nome}** é CEO da ${empresa.nome}, liderando a empresa há ${params.experiencia} anos no setor de ${empresa.industria}. 

Com ${params.idade} anos e formação em ${params.formacao}, possui experiência sólida em gestão estratégica e desenvolvimento de negócios. ${nome.split(' ')[0]} é conhecido por sua visão inovadora e capacidade de impulsionar o crescimento organizacional.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista de negócios em uma consultoria multinacional, onde desenvolveu expertise em análise estratégica. Rapidamente ascendeu a posições de gerência, liderando projetos de transformação empresarial. Antes de fundar/assumir a ${empresa.nome}, atuou como diretor comercial em duas startups do setor de tecnologia, onde adquiriu experiência crucial em vendas B2B e desenvolvimento de mercado.

Sua experiência inclui a implementação de sistemas CRM avançados, criação de metodologias de prospecção ativa, e desenvolvimento de equipes de SDR de alta performance. Conseguiu aumentar as vendas em 300% na empresa anterior através de estratégias inovadoras de lead generation e account-based marketing.

**EXPERTISE EM SDR:**
Como líder, desenvolveu uma abordagem única para Sales Development, focando em:
• Prospecção inteligente usando ferramentas de automation
• Criação de playbooks de cold outreach personalizados
• Implementação de métricas avançadas de conversão
• Treinamento de equipes SDR para closing de oportunidades complexas

Nascido(a) nos ${this.paisPorNome(empresa.pais)}, fala fluentemente ${params.idiomas.join(' e ')}, o que facilita a expansão internacional da empresa. Seus principais valores incluem ${params.valores.join(', ')}.

Como líder, enfrenta constantemente desafios relacionados à ${params.desafios.join(', ')}, sempre mantendo foco em ${params.motivacoes.join(' e ')}. Seu estilo de liderança é ${params.estilo_comunicacao.toLowerCase()}, inspirando equipes a alcançar resultados excepcionais.

Além do trabalho, dedica tempo a ${params.hobbies.join(', ')}, mantendo equilíbrio entre vida pessoal e profissional.
            `.trim(),

            'CTO': (nome, empresa, params) => `
**${nome}** atua como CTO da ${empresa.nome}, comandando a estratégia tecnológica da empresa há ${params.experiencia} anos. 

Com ${params.idade} anos e especialização em ${params.formacao}, lidera iniciativas de transformação digital e inovação tecnológica no setor de ${empresa.industria}. ${nome.split(' ')[0]} é reconhecido por sua expertise técnica e visão estratégica.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou como desenvolvedor full-stack em uma startup de fintech, onde rapidamente se destacou pela capacidade de criar soluções escaláveis. Promovido a tech lead aos 26 anos, liderou a migração de sistemas legados para arquitetura cloud-native. Posteriormente, atuou como CTO em duas scale-ups, onde implementou stack tecnológico completo e metodologias ágeis.

Sua experiência técnica abrange desenvolvimento em Python, Node.js, React, infraestrutura AWS/Azure, e implementação de sistemas de CRM e automation. Especialista em integração de APIs e desenvolvimento de dashboards analíticos para equipes comerciais.

**EXPERTISE EM TECH SALES:**
Como CTO com perfil comercial, desenvolveu competências únicas em:
• Prospecção de CTOs e decisores técnicos
• Apresentação de soluções técnicas complexas de forma clara
• Criação de POCs (Proof of Concept) para prospects
• Argumentação técnica para justificar investimentos em tecnologia
• Desenvolvimento de demos técnicos personalizados

Liderou a implementação de um sistema de lead scoring baseado em ML que aumentou a conversão de prospects em 250%. Criou metodologias de technical selling que são referência no mercado.

Natural dos ${this.paisPorNome(empresa.pais)}, domina ${params.idiomas.join(' e ')}, facilitando colaborações internacionais. Seus valores centrais são ${params.valores.join(', ')}.

Enfrenta diariamente desafios como ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua comunicação ${params.estilo_comunicacao.toLowerCase()} garante alinhamento entre equipes técnicas e de negócio.

Nas horas livres, aprecia ${params.hobbies.join(', ')}, mantendo-se atualizado com as últimas tendências tecnológicas.
            `.trim(),

            'CFO': (nome, empresa, params) => `
**${nome}** é CFO da ${empresa.nome}, gerenciando as finanças estratégicas da empresa há ${params.experiencia} anos.

Com ${params.idade} anos e formação em ${params.formacao}, possui sólida experiência em planejamento financeiro e análise de investimentos no setor de ${empresa.industria}. ${nome.split(' ')[0]} é valorizado por sua precisão analítica e visão conservadora.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista financeiro em uma Big Four (PwC), onde desenvolveu expertise em auditoria e controle interno. Posteriormente, atuou como controller em uma multinacional do setor de tecnologia, onde implementou sistemas de BI financeiro e reporting automatizado. Antes da ${empresa.nome}, foi CFO em duas startups de crescimento acelerado, gerenciando rodadas de investimento e IPO preparation.

Sua experiência inclui modelagem financeira avançada, estruturação de funding, análise de valuation, e implementação de sistemas ERP integrados. Especialista em métricas financeiras para SaaS e modelos de subscription.

**EXPERTISE EM FINANCIAL SELLING:**
Como CFO com perfil comercial, especializou-se em:
• Prospecção de CFOs e diretores financeiros
• Apresentação de business cases com ROI detalhado
• Análise de payback e justificativa de investimentos
• Negociação de contratos enterprise com estruturação financeira complexa
• Desenvolvimento de modelos de pricing baseados em value-based selling

Criou metodologias de financial selling que resultaram em contratos 400% maiores através de demonstração quantitativa de valor. Desenvolveu calculadoras de ROI personalizadas que se tornaram ferramentas-chave no processo de vendas.

Originário dos ${this.paisPorNome(empresa.pais)}, é fluente em ${params.idiomas.join(' e ')}, essencial para operações financeiras globais. Pauta sua atuação pelos valores de ${params.valores.join(', ')}.

Seus principais desafios envolvem ${params.desafios.join(', ')}, sempre priorizando ${params.motivacoes.join(' e ')}. Seu estilo ${params.estilo_comunicacao.toLowerCase()} garante clareza nas decisões financeiras.

Fora do trabalho, dedica-se a ${params.hobbies.join(', ')}, mantendo equilíbrio e perspectiva estratégica.
            `.trim(),

            'CMO': (nome, empresa, params) => `
**${nome}** atua como CMO da ${empresa.nome}, liderando estratégias de marketing há ${params.experiencia} anos no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, possui experiência sólida em marketing digital e growth hacking. ${nome.split(' ')[0]} é reconhecido por sua criatividade e capacidade de gerar leads qualificados.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista de marketing em uma agência digital, onde desenvolveu expertise em marketing de performance. Rapidamente evoluiu para posições estratégicas, especializando-se em lead generation e marketing automation. Antes da ${empresa.nome}, atuou como Growth Marketing Manager em duas startups, onde implementou funnels de conversão e estratégias de ABM (Account-Based Marketing).

Sua experiência inclui criação de campanhas multi-canal, implementação de marketing automation, análise de métricas de conversão, e desenvolvimento de estratégias de content marketing. Especialista em ferramentas como HubSpot, Marketo, Google Analytics, e plataformas de social selling.

**EXPERTISE EM MARKETING SALES:**
Como CMO com foco em vendas, desenvolveu competências em:
• Lead generation e nurturing strategies
• Account-based marketing para prospects enterprise
• Content marketing focado em conversão
• Marketing qualified leads (MQL) optimization
• Sales enablement e marketing-sales alignment

Implementou estratégias de inbound marketing que aumentaram a geração de leads em 500% e melhorou a qualidade de MQLs em 300%. Criou campanhas de ABM que resultaram em contratos enterprise 40% maiores.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando campanhas de marketing internacional. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} contribui para alinhamento entre marketing e vendas.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo-se atualizado com trends de marketing.
            `.trim(),

            'COO': (nome, empresa, params) => `
**${nome}** atua como COO da ${empresa.nome}, otimizando operações há ${params.experiencia} anos no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, possui experiência sólida em gestão operacional e otimização de processos. ${nome.split(' ')[0]} é reconhecido por sua eficiência e capacidade de escalar operações.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista de processos em uma consultoria de gestão, onde desenvolveu metodologias de otimização operacional. Evoluiu para gerência de operações, liderando projetos de automação e melhoria contínua. Antes da ${empresa.nome}, atuou como Operations Director em empresas de tecnologia, onde implementou processos de sales operations e customer success.

Sua experiência inclui implementação de CRM avançados, criação de playbooks operacionais, automação de workflows, e otimização de customer journey. Especialista em Salesforce, HubSpot, Pipedrive, e ferramentas de process automation.

**EXPERTISE EM SALES OPERATIONS:**
Como COO com foco em vendas, especializou-se em:
• Sales process optimization e pipeline management
• Implementation de sales automation tools
• KPI tracking e performance analytics
• Customer success operations
• Sales team productivity enhancement

Implementou sistemas de sales operations que reduziram o ciclo de vendas em 35% e aumentaram a produtividade da equipe comercial em 200%. Desenvolveu dashboards de acompanhamento que melhoraram a precisão do forecast em 80%.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando operações em ambiente global. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} garante eficiência operacional.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo foco em melhoria contínua.
            `.trim(),

            'Specialist': (nome, empresa, params) => `
**${nome}** atua como Specialist na ${empresa.nome}, fornecendo expertise técnica há ${params.experiencia} anos no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, possui conhecimento profundo em sua área de especialização. ${nome.split(' ')[0]} é reconhecido por sua expertise técnica e suporte a operações críticas.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista especializado, desenvolvendo profundo conhecimento técnico em sua área. Evoluiu através de certificações e projetos complexos, tornando-se referência técnica. Sua experiência abrange suporte a vendas técnicas, desenvolvimento de soluções customizadas, e resolução de problemas complexos.

Possui expertise em ferramentas especializadas de sua área, metodologias avançadas de análise, e capacidade de traduzir necessidades técnicas em soluções práticas. Contribui significativamente para o sucesso de projetos críticos e suporte a vendas consultivas.

**EXPERTISE EM TECHNICAL SUPPORT:**
Como especialista com foco em suporte comercial, desenvolveu competências em:
• Technical pre-sales support e solution design
• Custom solution development para prospects
• Technical documentation e knowledge base creation
• Complex problem solving e troubleshooting
• Technical training e knowledge transfer

Desenvolveu soluções técnicas que facilitaram o fechamento de 85% dos deals complexos. Criou documentação técnica que reduziu o tempo de onboarding de clientes em 60%.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando suporte técnico internacional. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} garante qualidade técnica.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo-se atualizado com inovações técnicas.
            `.trim(),

            'Analyst': (nome, empresa, params) => `
**${nome}** atua como Analyst na ${empresa.nome}, fornecendo insights analíticos há ${params.experiencia} anos no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, possui expertise em análise de dados e business intelligence. ${nome.split(' ')[0]} é reconhecido por sua capacidade analítica e insights estratégicos.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista júnior, desenvolvendo habilidades em análise quantitativa e modelagem de dados. Evoluiu para posições de maior responsabilidade, especializando-se em sales analytics e performance measurement. Sua experiência inclui análise de pipeline, forecasting, e otimização de métricas comerciais.

Possui expertise em ferramentas de BI como Tableau, Power BI, Google Analytics, e análise estatística avançada. Desenvolveu modelos preditivos e dashboards que apoiam decisões estratégicas de vendas e marketing.

**EXPERTISE EM SALES ANALYTICS:**
Como analista especializado em vendas, desenvolveu competências em:
• Pipeline analysis e conversion rate optimization
• Predictive modeling para lead scoring
• Sales performance tracking e KPI development
• Market analysis e competitive intelligence
• Data-driven decision support

Criou modelos analíticos que aumentaram a precisão do forecast de vendas em 90% e identificou oportunidades que resultaram em 40% mais conversões.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando análises em contexto global. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} garante insights precisos.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo-se atualizado com novas metodologias analíticas.
            `.trim(),

            'Manager': (nome, empresa, params) => `
**${nome}** atua como Manager na ${empresa.nome}, liderando operações estratégicas há ${params.experiencia} anos no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, possui experiência sólida em gestão de equipes e otimização de processos. ${nome.split(' ')[0]} é reconhecido por sua capacidade de implementar melhorias operacionais e desenvolver talentos.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como analista júnior em uma empresa de consultoria, onde desenvolveu habilidades analíticas e de resolução de problemas. Rapidamente promovido a supervisor, liderou projetos de melhoria de processos e implementação de sistemas. Antes da ${empresa.nome}, atuou como gerente de operações em duas empresas de tecnologia, onde especializou-se em sales operations e suporte técnico comercial.

Sua experiência inclui gerenciamento de CRM, análise de métricas de vendas, criação de processos de qualification, e treinamento de equipes SDR. Implementou sistemas de lead scoring que aumentaram a eficiência de conversão em 180%.

**EXPERTISE EM SALES SUPPORT:**
Como Manager com foco em suporte a vendas, desenvolveu competências em:
• Análise de pipeline e forecast accuracy
• Criação de materiais de apoio comercial
• Desenvolvimento de processos de qualification
• Suporte técnico em demos e apresentações
• Implementação de ferramentas de sales enablement

Criou metodologias de sales support que reduziram o ciclo de vendas em 40% através de melhor qualificação e nurturing de prospects.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando comunicação em ambiente multicultural. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} contribui para resultados positivos da equipe.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo equilíbrio vida-trabalho.
            `.trim(),

            'Assistant': (nome, empresa, params) => `
**${nome}** atua como Assistant na ${empresa.nome}, fornecendo suporte estratégico há ${params.experiencia} anos no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, possui experiência sólida em gestão de relacionamentos e qualificação de leads. ${nome.split(' ')[0]} é reconhecido por sua organização excepcional e habilidades de communication.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira como assistente administrativo em uma empresa de serviços, onde desenvolveu expertise em gestão de agenda e atendimento ao cliente. Rapidamente evoluiu para funções mais estratégicas, especializando-se em sales support e lead qualification. Antes da ${empresa.nome}, atuou como Sales Development Assistant em duas startups, onde implementou processos de prospecção e nurturing.

Sua experiência inclui gestão de CRM, qualification de prospects, appointment setting, research de leads, e suporte a processos comerciais. Desenvolveu sistemas de follow-up que aumentaram a taxa de conversão de leads em 200%.

**EXPERTISE EM SDR SUPPORT:**
Como Assistant especializado em Sales Development, possui competências em:
• Lead qualification e scoring avançado
• Research detalhado de prospects e empresas
• Appointment setting e calendar management
• First-touch outreach e nurturing sequences
• CRM management e data hygiene
• Social selling e LinkedIn outreach

Criou playbooks de qualification que se tornaram padrão na empresa, garantindo que apenas leads qualificados chegassem aos closers. Desenvolveu templates de outreach com taxa de resposta 300% superior à média do mercado.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando comunicação com prospects internacionais. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} contribui para resultados excepcionais.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo equilíbrio vida-trabalho.
            `.trim(),

            'default': (nome, empresa, params) => `
**${nome}** trabalha como ${params.cargo || 'profissional'} na ${empresa.nome}, contribuindo há ${params.experiencia} anos para o sucesso da empresa no setor de ${empresa.industria}.

Com ${params.idade} anos e formação em ${params.formacao}, traz experiência valiosa em sua área de atuação. ${nome.split(' ')[0]} é reconhecido por sua dedicação e competência profissional.

**TRAJETÓRIA PROFISSIONAL:**
Iniciou sua carreira em posições de entrada, onde desenvolveu fundamentos sólidos em sua área de especialização. Através de dedicação e resultados consistentes, ascendeu a posições de maior responsabilidade. Sua experiência abrange múltiplos aspectos de operações comerciais e suporte a vendas.

Possui expertise em processos operacionais, atendimento ao cliente, e suporte a atividades comerciais. Contribui significativamente para o crescimento sustentável da empresa através de sua atuação profissional dedicada.

Natural dos ${this.paisPorNome(empresa.pais)}, fala ${params.idiomas.join(' e ')}, facilitando comunicação em ambiente multicultural. Seus valores incluem ${params.valores.join(', ')}.

Enfrenta desafios relacionados a ${params.desafios.join(', ')}, sempre focado em ${params.motivacoes.join(' e ')}. Sua abordagem ${params.estilo_comunicacao.toLowerCase()} contribui para resultados positivos.

Nos momentos livres, aprecia ${params.hobbies.join(', ')}, mantendo equilíbrio vida-trabalho.
            `.trim()
        };

        this.parametrosPorRole = {
            'CEO': {
                formacao: 'MBA em Administração',
                valores: ['Liderança', 'Integridade', 'Inovação', 'Visão Estratégica'],
                motivacoes: ['crescimento sustentável', 'liderança de mercado', 'construção de equipes'],
                desafios: ['coordenação geral', 'tomada de decisão estratégica'],
                estilo_comunicacao: 'Inspirador e visionário',
                hobbies: ['leitura de negócios', 'networking', 'viagens'],
                idade_min: 35, idade_max: 55,
                exp_min: 10, exp_max: 25
            },
            'CTO': {
                formacao: 'Ciência da Computação + MBA',
                valores: ['Inovação', 'Qualidade', 'Eficiência', 'Prospecção Ativa'],
                motivacoes: ['inovação tecnológica', 'prospecção de clientes tech', 'escalabilidade'],
                desafios: ['modernização de sistemas', 'vendas para CTOs', 'argumentação técnica'],
                estilo_comunicacao: 'Técnico, preciso e persuasivo',
                hobbies: ['programação', 'networking tech', 'conferências'],
                idade_min: 32, idade_max: 50,
                exp_min: 8, exp_max: 20,
                sdr_focus: 'Tech Decision Makers',
                sales_skills: ['Technical Prospecting', 'Solution Selling', 'Demo Delivery']
            },
            'CFO': {
                formacao: 'Administração + MBA + CPA',
                valores: ['Precisão', 'Transparência', 'ROI Focus', 'Argumentação Financeira'],
                motivacoes: ['estabilidade financeira', 'prospecção C-level', 'ROI demonstration'],
                desafios: ['controle de custos', 'vendas para CFOs', 'justificativa de investimento'],
                estilo_comunicacao: 'Analítico, baseado em dados e persuasivo',
                hobbies: ['análise de mercado', 'networking executivo', 'golf'],
                idade_min: 30, idade_max: 50,
                exp_min: 7, exp_max: 20,
                sdr_focus: 'C-Level Executives',
                sales_skills: ['ROI Calculation', 'Budget Approval Process', 'Financial Objection Handling']
            },
            'CMO': {
                formacao: 'Marketing + MBA',
                valores: ['Criatividade', 'Dados', 'Crescimento', 'Prospecção de Marketing'],
                motivacoes: ['crescimento de marca', 'vendas para CMOs', 'estratégia digital'],
                desafios: ['ROI de marketing', 'vendas consultivas', 'demonstração de valor'],
                estilo_comunicacao: 'Criativo, baseado em dados e persuasivo',
                hobbies: ['tendências de marketing', 'networking criativo', 'conferências'],
                idade_min: 28, idade_max: 45,
                exp_min: 6, exp_max: 18,
                sdr_focus: 'Marketing Leaders',
                sales_skills: ['Marketing ROI', 'Digital Strategy Selling', 'Brand Growth Solutions']
            },
            'COO': {
                formacao: 'Engenharia Industrial + MBA',
                valores: ['Eficiência', 'Processos', 'Resultados', 'Prospecção Operacional'],
                motivacoes: ['otimização de processos', 'vendas para COOs', 'implementação de soluções'],
                desafios: ['gestão operacional', 'vendas consultivas', 'demonstração de eficiência'],
                estilo_comunicacao: 'Estruturado, focado em resultados e persuasivo',
                hobbies: ['otimização', 'networking industrial', 'leitura técnica'],
                idade_min: 30, idade_max: 50,
                exp_min: 7, exp_max: 20,
                sdr_focus: 'Operations Directors',
                sales_skills: ['Process Optimization Selling', 'Efficiency ROI', 'Implementation Planning']
            },
            'Specialist': {
                formacao: 'Graduação + Certificações Técnicas',
                valores: ['Excelência Técnica', 'Conhecimento', 'Suporte', 'Solução de Problemas'],
                motivacoes: ['expertise técnica', 'suporte a vendas complexas', 'resolução de desafios'],
                desafios: ['problemas técnicos complexos', 'suporte pré-vendas', 'technical demos'],
                estilo_comunicacao: 'Técnico, detalhado e educativo',
                hobbies: ['pesquisa técnica', 'certificações', 'inovação'],
                idade_min: 25, idade_max: 45,
                exp_min: 3, exp_max: 15,
                sales_support: true,
                support_areas: ['Technical Demos', 'Solution Design', 'Problem Solving']
            },
            'Analyst': {
                formacao: 'Estatística/Economia + Analytics',
                valores: ['Precisão', 'Dados', 'Insights', 'Análise Estratégica'],
                motivacoes: ['insights acionáveis', 'suporte a decisões', 'otimização de performance'],
                desafios: ['análise complexa', 'forecasting accuracy', 'data-driven insights'],
                estilo_comunicacao: 'Analítico, baseado em dados e objetivo',
                hobbies: ['análise de dados', 'estatística', 'machine learning'],
                idade_min: 24, idade_max: 40,
                exp_min: 2, exp_max: 12,
                analytics_focus: true,
                analysis_areas: ['Sales Analytics', 'Performance Tracking', 'Predictive Modeling']
            },
            'Chief Financial Officer': {
                formacao: 'Administração + MBA + CPA',
                valores: ['Precisão', 'Transparência', 'ROI Focus', 'Argumentação Financeira'],
                motivacoes: ['estabilidade financeira', 'prospecção C-level', 'ROI demonstration'],
                desafios: ['controle de custos', 'vendas para CFOs', 'justificativa de investimento'],
                estilo_comunicacao: 'Analítico, baseado em dados e persuasivo',
                hobbies: ['análise de mercado', 'networking executivo', 'golf'],
                idade_min: 30, idade_max: 50,
                exp_min: 7, exp_max: 20,
                sdr_focus: 'C-Level Executives',
                sales_skills: ['ROI Calculation', 'Budget Approval Process', 'Financial Objection Handling']
            },
            'COO': {
                formacao: 'Engenharia Industrial + MBA',
                valores: ['Eficiência', 'Processos', 'Resultados', 'Prospecção Operacional'],
                motivacoes: ['otimização de processos', 'vendas para COOs', 'implementação de soluções'],
                desafios: ['gestão operacional', 'vendas consultivas', 'demonstração de eficiência'],
                estilo_comunicacao: 'Estruturado, focado em resultados e persuasivo',
                hobbies: ['otimização', 'networking industrial', 'leitura técnica'],
                idade_min: 30, idade_max: 50,
                exp_min: 7, exp_max: 20,
                sdr_focus: 'Operations Directors',
                sales_skills: ['Process Optimization Selling', 'Efficiency ROI', 'Implementation Planning']
            },
            'CMO': {
                formacao: 'Marketing + MBA',
                valores: ['Criatividade', 'Dados', 'Crescimento', 'Prospecção de Marketing'],
                motivacoes: ['crescimento de marca', 'vendas para CMOs', 'estratégia digital'],
                desafios: ['ROI de marketing', 'vendas consultivas', 'demonstração de valor'],
                estilo_comunicacao: 'Criativo, baseado em dados e persuasivo',
                hobbies: ['tendências de marketing', 'networking criativo', 'conferências'],
                idade_min: 28, idade_max: 45,
                exp_min: 6, exp_max: 18,
                sdr_focus: 'Marketing Leaders',
                sales_skills: ['Marketing ROI', 'Digital Strategy Selling', 'Brand Growth Solutions']
            },
            'Manager': {
                formacao: 'Graduação + Especialização',
                valores: ['Colaboração', 'Desenvolvimento', 'Resultados', 'Suporte a Vendas'],
                motivacoes: ['crescimento profissional', 'suporte ao time comercial', 'expertise técnica'],
                desafios: ['desenvolvimento de habilidades', 'apoio a vendas', 'demonstrações técnicas'],
                estilo_comunicacao: 'Colaborativo, técnico e de suporte',
                hobbies: ['aprendizado contínuo', 'networking técnico', 'mentoria'],
                idade_min: 25, idade_max: 40,
                exp_min: 3, exp_max: 12,
                sales_support: true,
                support_areas: ['Technical Demos', 'Solution Design', 'Implementation Planning']
            },
            'Assistant': {
                formacao: 'Graduação + Curso de CRM',
                valores: ['Organização', 'Suporte', 'Eficiência', 'Qualificação de Leads'],
                motivacoes: ['suporte executivo', 'gestão de CRM', 'qualificação de prospects'],
                desafios: ['gestão de agenda', 'lead qualification', 'appointment setting'],
                estilo_comunicacao: 'Organizado, atencioso e focado em resultados',
                hobbies: ['organização', 'networking de suporte', 'cursos online'],
                idade_min: 23, idade_max: 35,
                exp_min: 2, exp_max: 8,
                sdr_support: true,
                sales_skills: ['Lead Qualification', 'CRM Management', 'Appointment Setting', 'Sales Research']
            },
            'default': {
                formacao: 'Graduação relacionada',
                valores: ['Profissionalismo', 'Ética', 'Qualidade'],
                motivacoes: ['crescimento profissional', 'contribuição'],
                desafios: ['desenvolvimento de habilidades', 'eficiência'],
                estilo_comunicacao: 'Colaborativo e eficaz',
                hobbies: ['leitura', 'esportes', 'família'],
                idade_min: 25, idade_max: 45,
                exp_min: 2, exp_max: 15
            }
        };

        this.idiomasPorPais = {
            'US': ['Inglês (nativo)', 'Espanhol (intermediário)'],
            'BR': ['Português (nativo)', 'Inglês (avançado)'],
            'CA': ['Inglês (nativo)', 'Francês (avançado)'],
            'DE': ['Alemão (nativo)', 'Inglês (avançado)'],
            'FR': ['Francês (nativo)', 'Inglês (avançado)'],
            'ES': ['Espanhol (nativo)', 'Inglês (avançado)'],
            'IT': ['Italiano (nativo)', 'Inglês (avançado)']
        };
    }

    paisPorNome(codigo) {
        const paises = {
            'US': 'Estados Unidos', 'BR': 'Brasil', 'CA': 'Canadá',
            'DE': 'Alemanha', 'FR': 'França', 'ES': 'Espanha', 'IT': 'Itália'
        };
        return paises[codigo] || 'Internacional';
    }

    gerarParametros(role, empresa) {
        const template = this.parametrosPorRole[role] || this.parametrosPorRole['default'];
        const idiomas = this.idiomasPorPais[empresa.pais] || ['Inglês (avançado)'];
        
        const idade = Math.floor(Math.random() * (template.idade_max - template.idade_min + 1)) + template.idade_min;
        const experiencia = Math.floor(Math.random() * (template.exp_max - template.exp_min + 1)) + template.exp_min;
        
        return {
            ...template,
            idade,
            experiencia,
            idiomas,
            cargo: role
        };
    }

    gerarBiografia(persona, empresa) {
        const parametros = this.gerarParametros(persona.role, empresa);
        const template = this.biografiaTemplates[persona.role] || this.biografiaTemplates['default'];
        
        return template(persona.full_name, empresa, parametros);
    }

    async processarEmpresa(empresaId) {
        try {
            console.log('🚀 Iniciando geração de biografias simplificada...');
            
            // Buscar empresa
            const { data: empresas, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId);

            if (empresaError || !empresas?.length) {
                throw new Error(`Empresa não encontrada: ${empresaError?.message || 'ID inválido'}`);
            }

            const empresa = empresas[0];
            console.log(`🏢 Empresa: ${empresa.nome} (${empresa.codigo})`);

            // Buscar personas
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId);

            if (personasError) {
                throw new Error(`Erro ao buscar personas: ${personasError.message}`);
            }

            console.log(`👥 Encontradas ${personas.length} personas ativas`);

            const biografias = [];
            let processadas = 0;

            for (const persona of personas) {
                try {
                    console.log(`📝 ${processadas + 1}/${personas.length} - Processando: ${persona.full_name || persona.role}`);
                    
                    // Gerar biografia
                    const biografia = this.gerarBiografia(persona, empresa);
                    
                    // Salvar no banco
                    const { error: updateError } = await supabase
                        .from('personas')
                        .update({ biografia_completa: biografia })
                        .eq('id', persona.id);

                    if (updateError) {
                        console.error(`❌ Erro ao salvar biografia para ${persona.full_name}:`, updateError.message);
                        continue;
                    }

                    biografias.push({
                        id: persona.id,
                        nome: persona.full_name,
                        role: persona.role,
                        biografia
                    });

                    console.log(`✅ Biografia salva no banco para ${persona.full_name || persona.role}`);
                    processadas++;
                    
                } catch (error) {
                    console.error(`❌ Erro ao processar ${persona.full_name}:`, error.message);
                    continue;
                }
            }

            // Salvar arquivo JSON
            const outputDir = path.join(__dirname, '..', 'biografias_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `biografias_${empresa.codigo}.json`);
            await fs.writeFile(outputFile, JSON.stringify(biografias, null, 2), 'utf-8');
            
            console.log(`🎉 Biografias geradas com sucesso!`);
            console.log(`📁 Arquivo salvo: ${outputFile}`);
            console.log(`👥 ${processadas} personas processadas`);

            return { success: true, processadas, arquivo: outputFile };

        } catch (error) {
            console.error('💥 Erro durante geração de biografias:', error.message);
            throw error;
        }
    }
}

// Execução principal
async function main() {
    const empresaId = process.argv[2];
    
    if (!empresaId) {
        console.error('❌ Erro: ID da empresa não fornecido');
        console.log('💡 Uso: node generate_biografias_simples.js <empresa-id>');
        process.exit(1);
    }

    try {
        const generator = new BiografiasSimplificado();
        await generator.processarEmpresa(empresaId);
        
        console.log('\n🎉 Processo concluído com sucesso!');
    } catch (error) {
        console.error('\n💥 Erro fatal:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = BiografiasSimplificado;