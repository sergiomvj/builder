// Gerador de Personas Realistas e Diversas
// Sistema que cria descrições físicas autênticas baseadas no ramo de negócio

export interface PhysicalCharacteristics {
  body_type: 'magro' | 'normal' | 'sobrepeso' | 'obeso' | 'atlético' | 'robusto';
  age_range: 'jovem' | 'adulto' | 'maduro' | 'idoso';
  ethnicity: string;
  skin_tone: string;
  height: 'baixo' | 'médio' | 'alto';
  hair: {
    type: string;
    color: string;
    style: string;
  };
  facial_features: {
    face_shape: string;
    distinctive_features: string[];
  };
  clothing_style: string;
  accessories: string[];
}

export interface BusinessSectorProfile {
  sector: string;
  typical_characteristics: {
    body_types: string[];
    age_distribution: Record<string, number>;
    clothing_styles: string[];
    personality_traits: string[];
  };
}

class RealisticPersonaGenerator {
  private businessSectors: BusinessSectorProfile[] = [
    {
      sector: 'tecnologia',
      typical_characteristics: {
        body_types: ['magro', 'normal', 'sobrepeso'],
        age_distribution: { 'jovem': 40, 'adulto': 45, 'maduro': 15 },
        clothing_styles: ['casual', 'casual-moderno', 'geek-chic'],
        personality_traits: ['analítico', 'criativo', 'inovador']
      }
    },
    {
      sector: 'saude',
      typical_characteristics: {
        body_types: ['normal', 'atlético', 'sobrepeso'],
        age_distribution: { 'jovem': 25, 'adulto': 50, 'maduro': 25 },
        clothing_styles: ['profissional', 'scrubs', 'formal'],
        personality_traits: ['empático', 'cuidadoso', 'responsável']
      }
    },
    {
      sector: 'educacao',
      typical_characteristics: {
        body_types: ['magro', 'normal', 'sobrepeso', 'obeso'],
        age_distribution: { 'jovem': 20, 'adulto': 40, 'maduro': 30, 'idoso': 10 },
        clothing_styles: ['casual-profissional', 'acadêmico', 'confortável'],
        personality_traits: ['paciente', 'comunicativo', 'inspirador']
      }
    },
    {
      sector: 'financeiro',
      typical_characteristics: {
        body_types: ['normal', 'sobrepeso', 'robusto'],
        age_distribution: { 'jovem': 15, 'adulto': 45, 'maduro': 35, 'idoso': 5 },
        clothing_styles: ['formal', 'executivo', 'conservador'],
        personality_traits: ['analítico', 'cauteloso', 'ambicioso']
      }
    },
    {
      sector: 'varejo',
      typical_characteristics: {
        body_types: ['magro', 'normal', 'sobrepeso', 'obeso', 'atlético'],
        age_distribution: { 'jovem': 35, 'adulto': 40, 'maduro': 20, 'idoso': 5 },
        clothing_styles: ['casual', 'uniforme', 'apresentável'],
        personality_traits: ['extrovertido', 'prestativo', 'energético']
      }
    },
    {
      sector: 'industria',
      typical_characteristics: {
        body_types: ['normal', 'robusto', 'sobrepeso', 'obeso'],
        age_distribution: { 'jovem': 20, 'adulto': 50, 'maduro': 25, 'idoso': 5 },
        clothing_styles: ['uniforme-trabalho', 'casual-resistente', 'segurança'],
        personality_traits: ['prático', 'resiliente', 'trabalhador']
      }
    },
    {
      sector: 'criativo',
      typical_characteristics: {
        body_types: ['magro', 'normal', 'sobrepeso', 'atlético'],
        age_distribution: { 'jovem': 45, 'adulto': 35, 'maduro': 15, 'idoso': 5 },
        clothing_styles: ['alternativo', 'artístico', 'expressivo'],
        personality_traits: ['criativo', 'expressivo', 'inovador']
      }
    }
  ];

  private ethnicities = [
    { value: 'Brasileiro miscigenado', weight: 35 },
    { value: 'Branco europeu', weight: 20 },
    { value: 'Negro africano', weight: 20 },
    { value: 'Pardo', weight: 15 },
    { value: 'Asiático', weight: 5 },
    { value: 'Indígena', weight: 3 },
    { value: 'Árabe', weight: 2 }
  ];

  private skinTones = [
    'pele muito clara',
    'pele clara',
    'pele morena clara',
    'pele morena',
    'pele morena escura',
    'pele negra',
    'pele negra retinta',
    'pele amarelada',
    'pele olivácea'
  ];

  private hairTypes = {
    texturas: ['liso', 'ondulado', 'cacheado', 'crespo', 'afro'],
    cores: [
      'preto', 'castanho escuro', 'castanho', 'castanho claro',
      'loiro escuro', 'loiro', 'loiro platinado', 'ruivo',
      'grisalho', 'branco', 'tingido de azul', 'tingido de roxo'
    ],
    estilos: [
      'curto e bem cortado', 'médio desalinhado', 'longo solto',
      'careca', 'calvície parcial', 'moicano', 'rabo de cavalo',
      'coque', 'tranças', 'dreadlocks', 'raspado nas laterais',
      'franja longa', 'ondas naturais', 'alisado', 'volumoso'
    ]
  };

  private faceShapes = [
    'rosto redondo', 'rosto oval', 'rosto quadrado', 'rosto triangular',
    'rosto alongado', 'rosto em formato de coração', 'rosto angular'
  ];

  private distinctiveFeatures = [
    'sardas espalhadas', 'marca de expressão', 'sorriso largo',
    'olhos expressivos', 'sobrancelhas marcantes', 'dimples',
    'nariz proeminente', 'queixo marcado', 'maçãs do rosto salientes',
    'óculos de grau', 'barba bem cuidada', 'bigode', 'cavanhaque',
    'piercing na orelha', 'tatuagem discreta', 'cicatriz pequena',
    'dentes ligeiramente desalinhados', 'sorriso tímido',
    'olheiras leves', 'rugas de expressão', 'papada discreta'
  ];

  /**
   * Gera características físicas realistas baseadas no setor de negócio
   */
  generateRealisticCharacteristics(
    sector: string, 
    role: string, 
    age_preference?: string,
    diversity_level: 'alta' | 'média' | 'baixa' = 'alta'
  ): PhysicalCharacteristics {
    
    const sectorProfile = this.businessSectors.find(s => s.sector === sector) || 
                         this.businessSectors[0];
    
    // Determinar tipo corporal baseado no setor
    const bodyType = this.selectWeightedRandom([
      { value: 'magro', weight: 15 },
      { value: 'normal', weight: 35 },
      { value: 'sobrepeso', weight: 25 },
      { value: 'obeso', weight: 15 },
      { value: 'atlético', weight: 8 },
      { value: 'robusto', weight: 2 }
    ]);

    // Determinar faixa etária
    const ageRange = this.selectByDistribution(sectorProfile.typical_characteristics.age_distribution);
    
    // Selecionar etnia
    const ethnicity = this.selectWeightedRandom(this.ethnicities) as string;
    
    // Selecionar tom de pele baseado na etnia
    const skinTone = this.selectSkinTone(ethnicity);
    
    // Gerar características do cabelo
    const hair = this.generateHairCharacteristics(ethnicity, ageRange);
    
    // Determinar altura
    const height = this.selectWeightedRandom([
      { value: 'baixo', weight: 20 },
      { value: 'médio', weight: 60 },
      { value: 'alto', weight: 20 }
    ]);

    // Características faciais
    const faceShape = this.getRandomElement(this.faceShapes);
    const distinctiveFeatures = this.selectMultipleFeatures(2, 4);
    
    // Estilo de roupa baseado no setor e função
    const clothingStyle = this.selectClothingStyle(sector, role);
    
    // Acessórios
    const accessories = this.selectAccessories(sector, ageRange, role);

    return {
      body_type: bodyType as any,
      age_range: ageRange as any,
      ethnicity,
      skin_tone: skinTone,
      height: height as any,
      hair,
      facial_features: {
        face_shape: faceShape,
        distinctive_features: distinctiveFeatures
      },
      clothing_style: clothingStyle,
      accessories
    };
  }

  /**
   * Converte características físicas em descrição textual detalhada
   */
  generateDetailedDescription(characteristics: PhysicalCharacteristics): string {
    const ageDescriptions = {
      'jovem': 'jovem',
      'adulto': 'de meia-idade',
      'maduro': 'maduro',
      'idoso': 'idoso'
    };

    const bodyDescriptions = {
      'magro': 'magro',
      'normal': 'de constituição normal',
      'sobrepeso': 'com sobrepeso, aparência simpática e acolhedora',
      'obeso': 'obeso, com aparência calorosa e simpática',
      'atlético': 'atlético e bem definido',
      'robusto': 'robusto e forte'
    };

    const heightDescriptions = {
      'baixo': 'de estatura baixa',
      'médio': 'de estatura média',
      'alto': 'alto'
    };

    let description = `Pessoa ${ageDescriptions[characteristics.age_range]} `;
    description += `${bodyDescriptions[characteristics.body_type]}, `;
    description += `${heightDescriptions[characteristics.height]}, `;
    description += `${characteristics.skin_tone}, `;
    description += `cabelo ${characteristics.hair.type} ${characteristics.hair.color} ${characteristics.hair.style}, `;
    description += `${characteristics.facial_features.face_shape}`;
    
    if (characteristics.facial_features.distinctive_features.length > 0) {
      description += `, com ${characteristics.facial_features.distinctive_features.join(', ')}`;
    }
    
    description += `. Vestindo ${characteristics.clothing_style}`;
    
    if (characteristics.accessories.length > 0) {
      description += `, usando ${characteristics.accessories.join(', ')}`;
    }
    
    description += '. Aparência autêntica e natural, não modelo profissional.';
    
    return description;
  }

  /**
   * Gera múltiplas personas diversas para uma empresa
   */
  generateDiverseTeam(
    sector: string, 
    teamSize: number,
    roles: string[]
  ): PhysicalCharacteristics[] {
    const team: PhysicalCharacteristics[] = [];
    
    // Garantir diversidade mínima
    const diversityTargets = {
      body_types: ['normal', 'sobrepeso', 'magro', 'obeso'],
      age_ranges: ['jovem', 'adulto', 'maduro'],
      ethnicities: this.ethnicities.slice(0, 4) // Top 4 etnias
    };

    for (let i = 0; i < teamSize; i++) {
      const role = roles[i] || 'funcionário';
      
      // Forçar diversidade nos primeiros membros
      let characteristics;
      if (i < diversityTargets.body_types.length) {
        characteristics = this.generateRealisticCharacteristics(sector, role);
        characteristics.body_type = diversityTargets.body_types[i] as any;
      } else {
        characteristics = this.generateRealisticCharacteristics(sector, role);
      }
      
      team.push(characteristics);
    }
    
    return team;
  }

  // Métodos auxiliares privados
  private selectWeightedRandom<T>(options: { value: T; weight: number }[]): T {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.value;
      }
    }
    
    return options[0].value;
  }

  private selectByDistribution(distribution: Record<string, number>): string {
    const options = Object.entries(distribution).map(([key, weight]) => ({
      value: key,
      weight
    }));
    return this.selectWeightedRandom(options);
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private selectSkinTone(ethnicity: string): string {
    // Mapear etnias para tons de pele prováveis
    if (ethnicity.includes('Negro') || ethnicity.includes('africano')) {
      return this.getRandomElement(['pele negra', 'pele negra retinta', 'pele morena escura']);
    }
    if (ethnicity.includes('Branco')) {
      return this.getRandomElement(['pele muito clara', 'pele clara', 'pele morena clara']);
    }
    if (ethnicity.includes('Asiático')) {
      return this.getRandomElement(['pele amarelada', 'pele clara', 'pele morena clara']);
    }
    if (ethnicity.includes('Pardo') || ethnicity.includes('miscigenado')) {
      return this.getRandomElement(['pele morena clara', 'pele morena', 'pele morena escura']);
    }
    
    return this.getRandomElement(this.skinTones);
  }

  private generateHairCharacteristics(ethnicity: string, ageRange: string) {
    let availableTextures = this.hairTypes.texturas;
    
    // Ajustar texturas baseado na etnia
    if (ethnicity.includes('Negro') || ethnicity.includes('africano')) {
      availableTextures = ['cacheado', 'crespo', 'afro'];
    }
    
    let availableCores = this.hairTypes.cores;
    
    // Ajustar cores baseado na idade
    if (ageRange === 'maduro' || ageRange === 'idoso') {
      availableCores = ['grisalho', 'branco', 'castanho escuro', 'preto'];
    }
    
    return {
      type: this.getRandomElement(availableTextures),
      color: this.getRandomElement(availableCores),
      style: this.getRandomElement(this.hairTypes.estilos)
    };
  }

  private selectMultipleFeatures(min: number, max: number): string[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...this.distinctiveFeatures].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private selectClothingStyle(sector: string, role: string): string {
    const sectorProfile = this.businessSectors.find(s => s.sector === sector);
    
    if (sectorProfile) {
      const styles = sectorProfile.typical_characteristics.clothing_styles;
      return this.getRandomElement(styles);
    }
    
    // Fallback baseado na função
    if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('diretor')) {
      return 'terno executivo impecável';
    }
    if (role.toLowerCase().includes('técnico') || role.toLowerCase().includes('analista')) {
      return 'casual profissional';
    }
    
    return 'roupa profissional adequada';
  }

  private selectAccessories(sector: string, ageRange: string, role: string): string[] {
    const accessories = [];
    
    // Baseado na idade
    if (ageRange === 'maduro' || ageRange === 'idoso') {
      accessories.push('óculos de leitura');
    }
    
    // Baseado no setor
    if (sector === 'tecnologia') {
      accessories.push('smartwatch', 'óculos modernos');
    } else if (sector === 'saude') {
      accessories.push('estetoscópio', 'crachá profissional');
    } else if (sector === 'financeiro') {
      accessories.push('relógio clássico', 'gravata conservadora');
    }
    
    // Randomizar
    return accessories.slice(0, Math.floor(Math.random() * 3));
  }
}

export const realisticPersonaGenerator = new RealisticPersonaGenerator();