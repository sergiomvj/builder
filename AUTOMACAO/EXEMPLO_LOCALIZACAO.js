/**
 * EXEMPLO: Como modificar scripts existentes para usar localização
 * 
 * Este arquivo mostra as mudanças necessárias em qualquer script
 * que gera dados baseados em nacionalidade/idioma
 */

// =============================================
// 1. IMPORT DA BIBLIOTECA
// =============================================

const { getLocalizationConfig, enrichPromptWithLocalization } = require('./lib/locale_mapper.js');

// =============================================
// 2. CONFIGURAR FAKER COM LOCALE DINÂMICO
// =============================================

// ❌ ANTES (hardcoded):
// const { faker } = require('@faker-js/faker');
// const { fakerPT_BR } = require('@faker-js/faker');

// ✅ DEPOIS (dinâmico):
const { faker } = require('@faker-js/faker');

async function generateBiografia(persona, empresa) {
  // Obter configuração de localização
  const localeConfig = getLocalizationConfig(empresa);
  
  // Configurar Faker com locale correto
  faker.locale = localeConfig.locale;
  
  // Agora faker.person.firstName() retorna nomes corretos para o país
  const firstName = faker.person.firstName(persona.genero === 'masculino' ? 'male' : 'female');
  const lastName = faker.person.lastName();
  
  console.log(`🌍 Gerando nome ${localeConfig.culturalContext}: ${firstName} ${lastName}`);
}

// =============================================
// 3. ENRIQUECER PROMPTS LLM
// =============================================

// ❌ ANTES (sem contexto cultural):
const promptAntigo = `
Gere uma biografia para:
Cargo: ${persona.role}
Departamento: ${persona.department}
`;

// ✅ DEPOIS (com contexto cultural):
async function gerarPromptContextualizado(persona, empresa) {
  const localeConfig = getLocalizationConfig(empresa);
  
  const basePrompt = `
Gere uma biografia completa em JSON para:
Cargo: ${persona.role}
Departamento: ${persona.department}
Experiência: ${persona.experiencia_anos} anos

INSTRUÇÕES:
- Nome completo típico de ${localeConfig.pais}
- Formação acadêmica em ${localeConfig.educationInstitutions}
- Idioma nativo: ${localeConfig.idiomaPrincipal}
- Idiomas secundários: ${localeConfig.idiomasSecundarios.join(', ') || 'nenhum'}
- Contexto cultural: ${localeConfig.culturalContext}
`;

  // Enriquecer com prefixo de idioma
  const promptFinal = enrichPromptWithLocalization(basePrompt, localeConfig);
  
  return promptFinal;
}

// =============================================
// 4. EXEMPLO COMPLETO DE FLUXO
// =============================================

async function processarPersonasComLocalizacao(empresaId) {
  // 1. Buscar empresa do banco
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  console.log(`🏢 Empresa: ${empresa.nome}`);
  console.log(`🌍 País: ${empresa.pais}`);
  console.log(`🗣️  Idiomas: ${empresa.idiomas.join(', ')}`);
  
  // 2. Obter configuração de localização
  const localeConfig = getLocalizationConfig(empresa);
  
  console.log('\n📋 Configuração de Localização:');
  console.log(`   Locale Faker: ${localeConfig.locale}`);
  console.log(`   Contexto cultural: ${localeConfig.culturalContext}`);
  console.log(`   Instituições: ${localeConfig.educationInstitutions}`);
  
  // 3. Configurar Faker
  faker.locale = localeConfig.locale;
  
  // 4. Buscar personas
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);
  
  // 5. Processar cada persona
  for (const persona of personas) {
    console.log(`\n🔄 Processando: ${persona.role}`);
    
    // Gerar nome apropriado para o país
    const genero = persona.genero === 'masculino' ? 'male' : 'female';
    const firstName = faker.person.firstName(genero);
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    
    console.log(`   👤 Nome gerado: ${fullName} (${localeConfig.pais})`);
    
    // Gerar prompt contextualizado
    const basePrompt = `
Gere biografia para ${persona.role}:
- Experiência: ${persona.experiencia_anos} anos
- Departamento: ${persona.department}
`;
    
    const promptContextualizado = enrichPromptWithLocalization(basePrompt, localeConfig);
    
    // Chamar LLM com prompt enriquecido
    const biografia = await generateJSONWithFallback(promptContextualizado);
    
    // Salvar no banco
    await supabase
      .from('personas_biografias')
      .upsert({
        persona_id: persona.id,
        biografia_estruturada: biografia
      });
    
    console.log(`   ✅ Biografia salva com contexto ${localeConfig.culturalContext}`);
  }
}

// =============================================
// 5. EXEMPLOS DE OUTPUT POR PAÍS
// =============================================

/*
BRASIL (pt_BR):
- Nome: Gabriel Santos Silva
- Universidades: USP, UNICAMP, FGV
- Idioma nativo: Português
- Contexto: brasileiro

USA (en_US):
- Nome: Michael Johnson Smith
- Universidades: Harvard, MIT, Stanford
- Idioma nativo: Inglês
- Contexto: americano

FRANÇA (fr):
- Nome: Pierre Dubois Martin
- Universidades: Sorbonne, HEC Paris, Sciences Po
- Idioma nativo: Francês
- Contexto: français

CHINA (zh_CN):
- Nome: 王伟 (Wang Wei)
- Universidades: Tsinghua, Peking University, Fudan
- Idioma nativo: Chinês
- Contexto: chinês

JAPÃO (ja):
- Nome: 田中太郎 (Tanaka Taro)
- Universidades: Tokyo University, Waseda, Keio
- Idioma nativo: Japonês
- Contexto: japonês
*/

module.exports = {
  generateBiografia,
  gerarPromptContextualizado,
  processarPersonasComLocalizacao
};
