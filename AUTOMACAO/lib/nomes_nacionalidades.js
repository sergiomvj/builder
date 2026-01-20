// BANCO DE NOMES POR NACIONALIDADE
// Usado para gerar personas com nomes apropriados baseado na distribuição de nacionalidades da empresa

export const nomesPorNacionalidade = {
  americanos: {
    masculinos: [
      'James Anderson', 'Michael Johnson', 'Robert Williams', 'John Davis', 'David Miller',
      'William Wilson', 'Richard Moore', 'Joseph Taylor', 'Thomas Brown', 'Charles Jackson',
      'Christopher White', 'Daniel Harris', 'Matthew Martin', 'Anthony Thompson', 'Mark Garcia',
      'Donald Martinez', 'Steven Robinson', 'Paul Clark', 'Andrew Rodriguez', 'Joshua Lewis',
      'Kenneth Lee', 'Kevin Walker', 'Brian Hall', 'George Allen', 'Edward Young'
    ],
    femininos: [
      'Mary Johnson', 'Jennifer Smith', 'Linda Williams', 'Patricia Brown', 'Barbara Jones',
      'Elizabeth Davis', 'Susan Miller', 'Jessica Wilson', 'Sarah Moore', 'Karen Taylor',
      'Nancy Anderson', 'Lisa Thomas', 'Betty Jackson', 'Margaret White', 'Sandra Harris',
      'Ashley Martin', 'Kimberly Thompson', 'Emily Garcia', 'Donna Martinez', 'Michelle Robinson',
      'Carol Clark', 'Amanda Rodriguez', 'Dorothy Lewis', 'Melissa Lee', 'Deborah Walker'
    ]
  },
  
  brasileiros: {
    masculinos: [
      'João Silva', 'Pedro Santos', 'Lucas Oliveira', 'Gabriel Costa', 'Rafael Souza',
      'Felipe Rodrigues', 'Bruno Almeida', 'Thiago Pereira', 'Gustavo Ferreira', 'Vitor Lima',
      'André Ribeiro', 'Diego Martins', 'Rodrigo Araújo', 'Fernando Carvalho', 'Carlos Gomes',
      'Marcelo Fernandes', 'Paulo Dias', 'Ricardo Barbosa', 'Roberto Rocha', 'Henrique Castro',
      'Leonardo Pinto', 'Marcos Azevedo', 'Mateus Cardoso', 'Daniel Mendes', 'Eduardo Monteiro'
    ],
    femininos: [
      'Maria Silva', 'Ana Santos', 'Julia Oliveira', 'Camila Costa', 'Beatriz Souza',
      'Larissa Rodrigues', 'Fernanda Almeida', 'Carolina Pereira', 'Amanda Ferreira', 'Gabriela Lima',
      'Mariana Ribeiro', 'Juliana Martins', 'Letícia Araújo', 'Isabela Carvalho', 'Bruna Gomes',
      'Aline Fernandes', 'Patrícia Dias', 'Renata Barbosa', 'Daniela Rocha', 'Vanessa Castro',
      'Priscila Pinto', 'Luciana Azevedo', 'Tatiana Cardoso', 'Adriana Mendes', 'Simone Monteiro'
    ]
  },
  
  europeus: {
    masculinos: [
      'Hans Mueller', 'Pierre Dubois', 'Antonio Rossi', 'Marco Ferrari', 'Carlos Garcia',
      'Jean Martin', 'Klaus Schmidt', 'Paolo Bianchi', 'Luis Martinez', 'François Bernard',
      'Wolfgang Wagner', 'Giovanni Romano', 'Miguel Lopez', 'Luca Conti', 'Franz Weber',
      'André Petit', 'Javier Gonzalez', 'Stefan Fischer', 'Matteo Ricci', 'Pablo Fernandez',
      'Laurent Moreau', 'Dieter Hoffmann', 'Alessandro Marino', 'Manuel Sanchez', 'Bruno Costa'
    ],
    femininos: [
      'Sophie Dubois', 'Anna Mueller', 'Maria Garcia', 'Francesca Rossi', 'Elena Martinez',
      'Isabelle Martin', 'Petra Schmidt', 'Giulia Ferrari', 'Carmen Lopez', 'Marie Bernard',
      'Ingrid Wagner', 'Chiara Bianchi', 'Laura Gonzalez', 'Claudia Weber', 'Nathalie Petit',
      'Sabine Fischer', 'Valentina Romano', 'Silvia Fernandez', 'Monique Moreau', 'Helga Hoffmann',
      'Lucia Conti', 'Ana Sanchez', 'Catherine Leroy', 'Martina Ricci', 'Isabel Costa'
    ]
  },
  
  asiaticos: {
    masculinos: [
      'Kenji Tanaka', 'Li Wei', 'Chen Wang', 'Rajesh Kumar', 'Hiroshi Yamamoto',
      'Zhang Liu', 'Amit Patel', 'Takeshi Sato', 'Wang Chen', 'Ravi Sharma',
      'Liu Zhang', 'Yuki Nakamura', 'Vikram Singh', 'Chen Li', 'Akira Suzuki',
      'Pradeep Gupta', 'Zhang Wei', 'Taro Watanabe', 'Kumar Raj', 'Wei Liu',
      'Satoshi Ito', 'Rahul Mehta', 'Li Chen', 'Kazuo Kobayashi', 'Arjun Verma'
    ],
    femininos: [
      'Mei Wang', 'Sakura Tanaka', 'Priya Sharma', 'Li Ying', 'Yuki Yamamoto',
      'Anita Kumar', 'Chen Xiao', 'Ayumi Sato', 'Wang Mei', 'Kavita Patel',
      'Liu Mei', 'Haruka Nakamura', 'Neha Singh', 'Li Mei', 'Rina Suzuki',
      'Pooja Gupta', 'Zhang Ying', 'Aiko Watanabe', 'Riya Raj', 'Wei Ying',
      'Yoko Ito', 'Shreya Mehta', 'Chen Ying', 'Miku Kobayashi', 'Anjali Verma'
    ]
  }
};

// Controle de nomes já usados (para evitar repetições)
const nomesUsados = new Set();

// Função para obter nome aleatório baseado na nacionalidade e gênero (SEM REPETIÇÕES)
export function getNomeAleatorio(nacionalidade, genero) {
  const nomes = nomesPorNacionalidade[nacionalidade];
  if (!nomes) {
    console.warn(`Nacionalidade '${nacionalidade}' não encontrada, usando brasileiros`);
    return getNomeAleatorio('brasileiros', genero);
  }
  
  const lista = genero === 'feminino' ? nomes.femininos : nomes.masculinos;
  
  // Filtrar nomes que ainda não foram usados
  const nomesDisponiveis = lista.filter(nome => !nomesUsados.has(nome));
  
  if (nomesDisponiveis.length === 0) {
    console.warn(`⚠️  Todos os nomes ${genero} de ${nacionalidade} foram usados! Gerando nome único...`);
    // Gerar variação do nome adicionando sufixo
    const nomeBase = lista[Math.floor(Math.random() * lista.length)];
    const partes = nomeBase.split(' ');
    const nomeUnico = `${partes[0]} ${partes[1]} Jr.`;
    nomesUsados.add(nomeUnico);
    return nomeUnico;
  }
  
  // Selecionar nome aleatório dos disponíveis
  const nomeEscolhido = nomesDisponiveis[Math.floor(Math.random() * nomesDisponiveis.length)];
  
  // Marcar como usado
  nomesUsados.add(nomeEscolhido);
  
  return nomeEscolhido;
}

// Função para limpar nomes usados (útil para testes)
export function limparNomesUsados() {
  nomesUsados.clear();
}

// Função para distribuir nacionalidades proporcionalmente aos cargos
export function distribuirNacionalidades(cargos, nacionalidades) {
  const distribuidos = [];
  const totalCargos = cargos.length;
  
  // Calcular quantos de cada nacionalidade baseado nos percentuais
  const distribuicao = {};
  let cargosDistribuidos = 0;
  
  nacionalidades.forEach((nac, index) => {
    // Para o último, usar o que sobrar para evitar erros de arredondamento
    if (index === nacionalidades.length - 1) {
      distribuicao[nac.tipo] = totalCargos - cargosDistribuidos;
    } else {
      const quantidade = Math.round(totalCargos * nac.percentual / 100);
      distribuicao[nac.tipo] = quantidade;
      cargosDistribuidos += quantidade;
    }
  });
  
  // Distribuir nacionalidades aos cargos
  let cargoIndex = 0;
  for (const [nacionalidade, quantidade] of Object.entries(distribuicao)) {
    for (let i = 0; i < quantidade && cargoIndex < totalCargos; i++) {
      distribuidos.push({
        cargo: cargos[cargoIndex],
        nacionalidade: nacionalidade
      });
      cargoIndex++;
    }
  }
  
  // Embaralhar para não ter blocos de nacionalidades
  return distribuidos.sort(() => Math.random() - 0.5);
}

// Função para obter sobrenome apropriado para email
export function getSobrenomeParaEmail(nomeCompleto) {
  const partes = nomeCompleto.split(' ');
  return partes[partes.length - 1].toLowerCase();
}

// Função para obter primeiro nome para email
export function getPrimeiroNomeParaEmail(nomeCompleto) {
  const partes = nomeCompleto.split(' ');
  return partes[0].toLowerCase();
}
