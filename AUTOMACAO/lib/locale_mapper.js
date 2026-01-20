/**
 * LOCALE MAPPER - Mapeia países para locales do Faker.js
 * Usado para gerar nomes, sobrenomes e dados contextualizados por nacionalidade
 */

const COUNTRY_TO_LOCALE = {
  // América do Norte
  'Estados Unidos': 'en_US',
  'USA': 'en_US',
  'United States': 'en_US',
  'Canadá': 'en_CA',
  'Canada': 'en_CA',
  'México': 'es_MX',
  'Mexico': 'es_MX',
  
  // América do Sul
  'Brasil': 'pt_BR',
  'Brazil': 'pt_BR',
  'Argentina': 'es',
  'Chile': 'es',
  'Colômbia': 'es',
  'Peru': 'es',
  'Venezuela': 'es',
  
  // Europa
  'Reino Unido': 'en_GB',
  'United Kingdom': 'en_GB',
  'Inglaterra': 'en_GB',
  'Portugal': 'pt_PT',
  'Espanha': 'es',
  'Spain': 'es',
  'França': 'fr',
  'France': 'fr',
  'Alemanha': 'de',
  'Germany': 'de',
  'Itália': 'it',
  'Italy': 'it',
  'Holanda': 'nl',
  'Netherlands': 'nl',
  'Bélgica': 'fr_BE',
  'Suíça': 'de_CH',
  'Áustria': 'de_AT',
  'Polônia': 'pl',
  'República Tcheca': 'cz',
  'Rússia': 'ru',
  'Russia': 'ru',
  'Ucrânia': 'uk',
  'Turquia': 'tr',
  'Turkey': 'tr',
  
  // Ásia
  'Índia': 'en_IN',
  'India': 'en_IN',
  'China': 'zh_CN',
  'Japão': 'ja',
  'Japan': 'ja',
  'Coreia do Sul': 'ko',
  'South Korea': 'ko',
  'Tailândia': 'th',
  'Vietnã': 'vi',
  'Vietnam': 'vi',
  'Filipinas': 'en',
  'Indonésia': 'id_ID',
  'Malásia': 'en',
  'Singapura': 'en_SG',
  'Singapore': 'en_SG',
  
  // Oriente Médio
  'Emirados Árabes': 'ar',
  'UAE': 'ar',
  'Israel': 'he',
  'Arábia Saudita': 'ar',
  
  // África
  'África do Sul': 'en_ZA',
  'South Africa': 'en_ZA',
  'Nigéria': 'en',
  'Egito': 'ar',
  
  // Oceania
  'Austrália': 'en_AU',
  'Australia': 'en_AU',
  'Nova Zelândia': 'en_NZ',
  'New Zealand': 'en_NZ'
};

/**
 * Mapeia idiomas para instruções LLM contextualizadas
 */
const LANGUAGE_TO_CULTURE = {
  'Português': {
    locale: 'pt_BR',
    nomePattern: 'nome_brasileiro',
    culturalContext: 'brasileiro',
    educationInstitutions: 'universidades brasileiras',
    prompt: 'Gere conteúdo em português do Brasil'
  },
  'Inglês': {
    locale: 'en_US',
    nomePattern: 'nome_americano',
    culturalContext: 'americano',
    educationInstitutions: 'universidades americanas',
    prompt: 'Generate content in American English'
  },
  'Espanhol': {
    locale: 'es',
    nomePattern: 'nombre_español',
    culturalContext: 'español',
    educationInstitutions: 'universidades españolas',
    prompt: 'Genera contenido en español'
  },
  'Francês': {
    locale: 'fr',
    nomePattern: 'nom_français',
    culturalContext: 'français',
    educationInstitutions: 'universités françaises',
    prompt: 'Générez du contenu en français'
  },
  'Alemão': {
    locale: 'de',
    nomePattern: 'deutscher_name',
    culturalContext: 'alemão',
    educationInstitutions: 'universidades alemãs',
    prompt: 'Generiere Inhalte auf Deutsch'
  },
  'Italiano': {
    locale: 'it',
    nomePattern: 'nome_italiano',
    culturalContext: 'italiano',
    educationInstitutions: 'università italiane',
    prompt: 'Genera contenuto in italiano'
  },
  'Chinês': {
    locale: 'zh_CN',
    nomePattern: '中文姓名',
    culturalContext: 'chinês',
    educationInstitutions: 'universidades chinesas',
    prompt: '用中文生成内容'
  },
  'Japonês': {
    locale: 'ja',
    nomePattern: '日本の名前',
    culturalContext: 'japonês',
    educationInstitutions: 'universidades japonesas',
    prompt: '日本語でコンテンツを生成'
  },
  'Coreano': {
    locale: 'ko',
    nomePattern: '한국_이름',
    culturalContext: 'coreano',
    educationInstitutions: 'universidades coreanas',
    prompt: '한국어로 콘텐츠 생성'
  },
  'Russo': {
    locale: 'ru',
    nomePattern: 'русское_имя',
    culturalContext: 'russo',
    educationInstitutions: 'universidades russas',
    prompt: 'Создайте контент на русском языке'
  }
};

/**
 * Retorna o locale do Faker baseado no país da empresa
 * @param {string} pais - Nome do país (ex: 'Brasil', 'Estados Unidos')
 * @returns {string} - Locale do Faker (ex: 'pt_BR', 'en_US')
 */
function getLocaleFromCountry(pais) {
  if (!pais) return 'pt_BR'; // Fallback para Brasil
  
  const locale = COUNTRY_TO_LOCALE[pais];
  
  if (!locale) {
    console.warn(`⚠️  País "${pais}" não mapeado. Usando fallback: pt_BR`);
    return 'pt_BR';
  }
  
  return locale;
}

/**
 * Retorna contexto cultural baseado no idioma principal da empresa
 * @param {string[]} idiomas - Array de idiomas (ex: ['Português', 'Inglês'])
 * @returns {object} - Objeto com locale, padrões de nome, contexto cultural
 */
function getCultureFromLanguages(idiomas) {
  if (!idiomas || idiomas.length === 0) {
    return LANGUAGE_TO_CULTURE['Português']; // Fallback
  }
  
  const primeiroIdioma = idiomas[0];
  const cultura = LANGUAGE_TO_CULTURE[primeiroIdioma];
  
  if (!cultura) {
    console.warn(`⚠️  Idioma "${primeiroIdioma}" não mapeado. Usando fallback: Português`);
    return LANGUAGE_TO_CULTURE['Português'];
  }
  
  return cultura;
}

/**
 * Gera configuração completa de localização baseada em empresa
 * @param {object} empresa - Objeto empresa do banco (com pais, idiomas)
 * @returns {object} - Configuração completa: locale, cultura, prompts
 */
function getLocalizationConfig(empresa) {
  const locale = getLocaleFromCountry(empresa.pais);
  const cultura = getCultureFromLanguages(empresa.idiomas);
  
  return {
    locale, // Para Faker.js
    pais: empresa.pais,
    idiomaPrincipal: empresa.idiomas ? empresa.idiomas[0] : 'Português',
    idiomasSecundarios: empresa.idiomas ? empresa.idiomas.slice(1) : [],
    culturalContext: cultura.culturalContext,
    educationInstitutions: cultura.educationInstitutions,
    llmPromptPrefix: cultura.prompt,
    nomePattern: cultura.nomePattern
  };
}

/**
 * Gera prompt LLM contextualizado com nacionalidade
 * @param {string} basePrompt - Prompt base
 * @param {object} localizationConfig - Config de localização
 * @returns {string} - Prompt enriquecido com contexto cultural
 */
function enrichPromptWithLocalization(basePrompt, localizationConfig) {
  const prefix = `
${localizationConfig.llmPromptPrefix}

CONTEXTO CULTURAL:
- País: ${localizationConfig.pais}
- Idioma principal: ${localizationConfig.idiomaPrincipal}
- Contexto: ${localizationConfig.culturalContext}
- Instituições de ensino: ${localizationConfig.educationInstitutions}

IMPORTANTE: 
- Use nomes típicos de ${localizationConfig.pais}
- Considere o contexto cultural ${localizationConfig.culturalContext}
- Idiomas: Nativo em ${localizationConfig.idiomaPrincipal}${localizationConfig.idiomasSecundarios.length > 0 ? `, fluente em ${localizationConfig.idiomasSecundarios.join(', ')}` : ''}

${basePrompt}
  `;
  
  return prefix;
}

module.exports = {
  getLocaleFromCountry,
  getCultureFromLanguages,
  getLocalizationConfig,
  enrichPromptWithLocalization,
  COUNTRY_TO_LOCALE,
  LANGUAGE_TO_CULTURE
};
