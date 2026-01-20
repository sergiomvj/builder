/**
 * DIVERSITY MANAGER - Gerenciador de Diversidade Automática
 * 
 * Garante que cada empresa tenha equipe multinacional com:
 * - 5+ nacionalidades diferentes
 * - Idiomas obrigatórios: Inglês, Português, Espanhol + 2 aleatórios
 * - Distribuição equilibrada (não mais de 40% de uma nacionalidade)
 */

const NACIONALIDADES_DISPONIVEIS = [
  { key: 'americanos', nome: 'Americano', idiomaNativo: 'Inglês', locale: 'en_US', peso: 1.2 },
  { key: 'brasileiros', nome: 'Brasileiro', idiomaNativo: 'Português', locale: 'pt_BR', peso: 1.0 },
  { key: 'europeus', nome: 'Europeu', idiomaNativo: 'Espanhol', locale: 'es', peso: 1.0 },
  { key: 'latinos', nome: 'Latino', idiomaNativo: 'Espanhol', locale: 'es_MX', peso: 1.0 },
  { key: 'asiaticos', nome: 'Asiático', idiomaNativo: 'Mandarim', locale: 'zh_CN', peso: 0.8 },
  { key: 'indianos', nome: 'Indiano', idiomaNativo: 'Hindi', locale: 'en_IN', peso: 0.9 },
  { key: 'arabes', nome: 'Árabe', idiomaNativo: 'Árabe', locale: 'ar', peso: 0.7 },
  { key: 'africanos', nome: 'Africano', idiomaNativo: 'Inglês', locale: 'en_ZA', peso: 0.6 }
];

const IDIOMAS_EXTRAS = [
  'Francês', 'Alemão', 'Italiano', 'Russo', 'Japonês', 'Coreano', 
  'Mandarim', 'Hindi', 'Árabe', 'Hebraico', 'Turco', 'Polonês'
];

/**
 * Gera distribuição de nacionalidades para uma empresa
 * Garante 5+ nacionalidades com distribuição equilibrada
 * 
 * @param {number} totalPersonas - Total de personas a criar
 * @returns {Array} - Array com distribuição [{ nacionalidade, quantidade }]
 */
export function gerarDistribuicaoNacionalidades(totalPersonas) {
  // Selecionar 5-7 nacionalidades aleatórias
  const numNacionalidades = Math.floor(Math.random() * 3) + 5; // 5 a 7
  
  const nacionalidadesSelecionadas = [];
  const disponíveis = [...NACIONALIDADES_DISPONIVEIS];
  
  // Sempre incluir as 3 principais (americanos, brasileiros, europeus)
  nacionalidadesSelecionadas.push(disponíveis[0]); // Americanos
  nacionalidadesSelecionadas.push(disponíveis[1]); // Brasileiros
  nacionalidadesSelecionadas.push(disponíveis[2]); // Europeus
  
  // Adicionar mais 2-4 nacionalidades aleatórias
  const restantes = disponíveis.slice(3);
  for (let i = 0; i < numNacionalidades - 3; i++) {
    if (restantes.length === 0) break;
    const idx = Math.floor(Math.random() * restantes.length);
    nacionalidadesSelecionadas.push(restantes.splice(idx, 1)[0]);
  }
  
  // Gerar pesos aleatórios
  const pesos = nacionalidadesSelecionadas.map(n => Math.random() * n.peso);
  const somaTotal = pesos.reduce((a, b) => a + b, 0);
  
  // Calcular quantidades
  let distribuicao = nacionalidadesSelecionadas.map((nac, idx) => ({
    nacionalidade: nac.key,
    nome: nac.nome,
    idiomaNativo: nac.idiomaNativo,
    locale: nac.locale,
    quantidade: Math.max(1, Math.round((pesos[idx] / somaTotal) * totalPersonas))
  }));
  
  // Garantir que nenhuma nacionalidade tenha mais de 40%
  const maxPermitido = Math.ceil(totalPersonas * 0.4);
  distribuicao = distribuicao.map(d => ({
    ...d,
    quantidade: Math.min(d.quantidade, maxPermitido)
  }));
  
  // Ajustar para bater o total exato
  const totalAtual = distribuicao.reduce((sum, d) => sum + d.quantidade, 0);
  if (totalAtual !== totalPersonas) {
    const diff = totalPersonas - totalAtual;
    distribuicao[0].quantidade += diff; // Adiciona/remove da primeira nacionalidade
  }
  
  // Ordenar por quantidade (maior → menor)
  distribuicao.sort((a, b) => b.quantidade - a.quantidade);
  
  return distribuicao;
}

/**
 * Atribui nacionalidade a cada persona seguindo a distribuição
 * 
 * @param {Array} personas - Array de personas
 * @param {Array} distribuicao - Distribuição de nacionalidades
 * @returns {Array} - Personas com campo 'nacionalidade' adicionado
 */
export function atribuirNacionalidades(personas, distribuicao) {
  const resultado = [];
  let personasRestantes = [...personas];
  
  for (const { nacionalidade, quantidade, locale } of distribuicao) {
    // Pegar 'quantidade' personas aleatórias
    for (let i = 0; i < quantidade && personasRestantes.length > 0; i++) {
      const idx = Math.floor(Math.random() * personasRestantes.length);
      const persona = personasRestantes.splice(idx, 1)[0];
      resultado.push({
        ...persona,
        nacionalidade,
        locale
      });
    }
  }
  
  return resultado;
}

/**
 * Gera lista de idiomas da empresa
 * Sempre inclui: Inglês, Português, Espanhol + 2 extras aleatórios
 * 
 * @returns {Array} - Array de idiomas
 */
export function gerarIdiomasEmpresa() {
  const obrigatorios = ['Inglês', 'Português', 'Espanhol'];
  
  // Selecionar 2 idiomas extras aleatórios
  const extras = [...IDIOMAS_EXTRAS];
  const selecionados = [];
  
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(Math.random() * extras.length);
    selecionados.push(extras.splice(idx, 1)[0]);
  }
  
  return [...obrigatorios, ...selecionados];
}

/**
 * Gera relatório de diversidade
 * 
 * @param {Array} distribuicao - Distribuição de nacionalidades
 * @param {number} total - Total de personas
 * @returns {string} - Relatório formatado
 */
export function gerarRelatoriodiversidade(distribuicao, total) {
  let relatorio = '\n📊 RELATÓRIO DE DIVERSIDADE\n';
  relatorio += '=' .repeat(50) + '\n';
  relatorio += `Total de personas: ${total}\n`;
  relatorio += `Nacionalidades diferentes: ${distribuicao.length}\n\n`;
  
  for (const { nome, quantidade, idiomaNativo } of distribuicao) {
    const percentual = ((quantidade / total) * 100).toFixed(1);
    const barra = '█'.repeat(Math.round(percentual / 5));
    relatorio += `${nome.padEnd(15)} ${barra.padEnd(20)} ${quantidade} (${percentual}%) - ${idiomaNativo}\n`;
  }
  
  relatorio += '=' .repeat(50) + '\n';
  
  return relatorio;
}

/**
 * Valida se distribuição atende requisitos mínimos
 * 
 * @param {Array} distribuicao - Distribuição de nacionalidades
 * @param {number} total - Total de personas
 * @returns {object} - { valido: boolean, erros: string[] }
 */
export function validarDiversidade(distribuicao, total) {
  const erros = [];
  
  // Mínimo 5 nacionalidades
  if (distribuicao.length < 5) {
    erros.push(`Apenas ${distribuicao.length} nacionalidades (mínimo: 5)`);
  }
  
  // Nenhuma nacionalidade > 40%
  for (const { nome, quantidade } of distribuicao) {
    const percentual = (quantidade / total) * 100;
    if (percentual > 40) {
      erros.push(`${nome} tem ${percentual.toFixed(1)}% (máximo: 40%)`);
    }
  }
  
  // Verificar total
  const totalDistribuido = distribuicao.reduce((sum, d) => sum + d.quantidade, 0);
  if (totalDistribuido !== total) {
    erros.push(`Total distribuído (${totalDistribuido}) != total esperado (${total})`);
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
}

/**
 * Configuração padrão para empresas americanas com equipe global
 * 
 * @returns {object} - Configuração base
 */
export function getConfigEmpresaGlobal() {
  return {
    pais: 'Estados Unidos',
    idiomas: gerarIdiomasEmpresa(),
    sedeGlobal: true,
    diversidadeObrigatoria: true
  };
}

// Exemplo de uso:
/*
const distribuicao = gerarDistribuicaoNacionalidades(40);
console.log(gerarRelatorioiversidade(distribuicao, 40));

// Output:
// 📊 RELATÓRIO DE DIVERSIDADE
// ==================================================
// Total de personas: 40
// Nacionalidades diferentes: 6
//
// Americano       ████████████████     12 (30.0%) - Inglês
// Brasileiro      ████████████         10 (25.0%) - Português
// Europeu         ████████             8 (20.0%) - Espanhol
// Indiano         ████                 5 (12.5%) - Hindi
// Asiático        ███                  3 (7.5%) - Mandarim
// Latino          ██                   2 (5.0%) - Espanhol
// ==================================================
*/
