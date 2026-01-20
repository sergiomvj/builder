// FUNÇÃO PARA GERAR EMAILS NO FORMATO CORRETO
// firstname.lastname@companydomain

/**
 * Gera email no formato firstname.lastname@companydomain
 * @param {string} fullName - Nome completo da persona
 * @param {string} companyDomain - Domínio da empresa (ex: arvabot.com)
 * @param {Set} usedEmails - Set com emails já utilizados para evitar duplicatas
 * @returns {string} Email único no formato correto
 */
function generateEmailFormat(fullName, companyDomain = 'arvabot.com', usedEmails = new Set()) {
  // Limpar e normalizar o nome
  const cleanName = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
    .replace(/[^a-z\\s]/g, '') // Remove caracteres especiais
    .trim();

  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    throw new Error('Nome inválido para geração de email');
  }

  let firstName = nameParts[0];
  let lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  
  // Formato base: firstname.lastname@domain
  let baseEmail;
  if (lastName) {
    baseEmail = `${firstName}.${lastName}@${companyDomain}`;
  } else {
    baseEmail = `${firstName}@${companyDomain}`;
  }

  // Verificar se o email já existe e adicionar número se necessário
  let finalEmail = baseEmail;
  let counter = 1;

  while (usedEmails.has(finalEmail)) {
    if (lastName) {
      finalEmail = `${firstName}.${lastName}${counter}@${companyDomain}`;
    } else {
      finalEmail = `${firstName}${counter}@${companyDomain}`;
    }
    counter++;
    
    // Evitar loop infinito
    if (counter > 100) {
      throw new Error('Não foi possível gerar email único');
    }
  }

  usedEmails.add(finalEmail);
  return finalEmail;
}

module.exports = { generateEmailFormat };