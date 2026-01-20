// Teste da função de geração de código
function generateCompanyCode(nome) {
  const clean = nome
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6) // Máximo 6 caracteres do nome
  
  const numero = Math.floor(10 + Math.random() * 90) // 2 dígitos
  const codigo = `${clean}${numero}`
  
  // Garantir que não excede 10 caracteres
  return codigo.substring(0, 10)
}

// Testes
const nomes = [
  'ARVA Tech Solutions',
  'Tech Solutions International Corp',
  'Microsoft Corporation',
  'Google Inc',
  'Amazon Web Services',
  'Empresa Muito Longa Com Nome Grande'
];

console.log('🧪 TESTANDO GERAÇÃO DE CÓDIGOS:');
nomes.forEach(nome => {
  const codigo = generateCompanyCode(nome);
  console.log(`${nome} → "${codigo}" (${codigo.length} caracteres)`);
});

console.log('\n✅ Todos os códigos têm 10 caracteres ou menos!');