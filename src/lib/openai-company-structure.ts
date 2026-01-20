/**
 * OpenAI Company Structure Generator
 * Gera estrutura organizacional completa baseada no business type e mercado
 */

export interface CargoEspecifico {
  titulo: string;
  departamento: string;
  nivel: 'C-Level' | 'Senior' | 'Pleno' | 'Junior' | 'Estagiario';
  especialidade: string;
  justificativa: string;
  genero_sugerido?: 'masculino' | 'feminino' | 'neutro';
}

export interface EstruturaOrganizacional {
  ceo: CargoEspecifico;
  diretoria: CargoEspecifico[];
  gerencia: CargoEspecifico[];
  especialistas: CargoEspecifico[];
  operacional: CargoEspecifico[];
  total_posicoes: number;
  diversidade_recomendada: {
    executivos_homens: number;
    executivos_mulheres: number;
    gerencia_homens: number;
    gerencia_mulheres: number;
    especialistas_homens: number;
    especialistas_mulheres: number;
    operacional_homens: number;
    operacional_mulheres: number;
  };
}

interface EmpresaContexto {
  nome: string;
  descricao: string;
  industria: string;
  mercado_alvo: string;
  porte?: 'pequeno' | 'medio' | 'grande';
  pais: string;
}

/**
 * Gera estrutura organizacional completa usando templates hardcoded (sem API)
 */
export async function gerarEstruturaOrganizacional(
  empresa: EmpresaContexto
): Promise<EstruturaOrganizacional> {
  try {
    // Tenta gerar via LLM API
    const res = await fetch('/api/automation/generate-structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empresa)
    });
    const data = await res.json();
    if (data.success && data.estrutura) {
      console.log('✅ Estrutura organizacional gerada via LLM');
      return data.estrutura;
    } else {
      console.warn('⚠️ Falha na LLM, usando template hardcoded');
      const estrutura = gerarEstruturaPorIndustria(empresa);
      return estrutura;
    }
  } catch (error) {
    console.error('❌ Erro ao gerar estrutura organizacional:', error);
    // Fallback para template local
    const estrutura = gerarEstruturaPorIndustria(empresa);
    return estrutura;
  }
}

/**
 * Gera estrutura organizacional baseada na indústria usando templates hardcoded
 */
function gerarEstruturaPorIndustria(empresa: EmpresaContexto): EstruturaOrganizacional {
  const { industria, porte = 'medio', pais = 'BR' } = empresa;

  // Templates por indústria
  const templates: Record<string, any> = {
    tecnologia: {
      ceo: { titulo: 'CEO / CTO', departamento: 'Executivo', especialidade: 'Tecnologia', justificativa: 'Liderança técnica e estratégica' },
      diretoria: [
        { titulo: 'Diretor de Produto', departamento: 'Produto', especialidade: 'Product Management', justificativa: 'Gestão do roadmap e features' },
        { titulo: 'Diretor de Engenharia', departamento: 'Engenharia', especialidade: 'Software Development', justificativa: 'Liderança técnica da equipe' },
        { titulo: 'Diretor Comercial', departamento: 'Vendas', especialidade: 'Business Development', justificativa: 'Expansão e vendas' }
      ],
      gerencia: [
        { titulo: 'Gerente de Produto', departamento: 'Produto', especialidade: 'Product Management', justificativa: 'Coordenação de desenvolvimento' },
        { titulo: 'Gerente de Desenvolvimento', departamento: 'Engenharia', especialidade: 'Software Engineering', justificativa: 'Supervisão técnica' },
        { titulo: 'Gerente de Marketing', departamento: 'Marketing', especialidade: 'Digital Marketing', justificativa: 'Estratégia de marketing' },
        { titulo: 'Gerente de Vendas', departamento: 'Vendas', especialidade: 'Sales Management', justificativa: 'Coordenação da equipe comercial' }
      ],
      especialistas: [
        { titulo: 'Product Manager', departamento: 'Produto', especialidade: 'Product Strategy', justificativa: 'Definição de requisitos' },
        { titulo: 'Desenvolvedor Senior Full-Stack', departamento: 'Engenharia', especialidade: 'Full-Stack Development', justificativa: 'Desenvolvimento de aplicações' },
        { titulo: 'UX/UI Designer', departamento: 'Design', especialidade: 'User Experience', justificativa: 'Design de interfaces' },
        { titulo: 'Analista de Marketing Digital', departamento: 'Marketing', especialidade: 'Digital Analytics', justificativa: 'Análise de performance' },
        { titulo: 'Especialista em Vendas', departamento: 'Vendas', especialidade: 'Sales Engineering', justificativa: 'Suporte técnico às vendas' }
      ],
      operacional: [
        { titulo: 'Desenvolvedor Pleno', departamento: 'Engenharia', especialidade: 'Software Development', justificativa: 'Desenvolvimento de features' },
        { titulo: 'Analista de QA', departamento: 'Qualidade', especialidade: 'Quality Assurance', justificativa: 'Testes e qualidade' },
        { titulo: 'Assistente de Marketing', departamento: 'Marketing', especialidade: 'Content Creation', justificativa: 'Suporte às campanhas' }
      ]
    },
    saude: {
      ceo: { titulo: 'Diretor Executivo', departamento: 'Executivo', especialidade: 'Saúde', justificativa: 'Liderança institucional' },
      diretoria: [
        { titulo: 'Diretor Médico', departamento: 'Médico', especialidade: 'Medicina', justificativa: 'Supervisão médica' },
        { titulo: 'Diretor Administrativo', departamento: 'Administrativo', especialidade: 'Gestão Hospitalar', justificativa: 'Gestão operacional' },
        { titulo: 'Diretor de Enfermagem', departamento: 'Enfermagem', especialidade: 'Enfermagem', justificativa: 'Coordenação de enfermagem' }
      ],
      gerencia: [
        { titulo: 'Gerente de Clínica', departamento: 'Clínica', especialidade: 'Gestão Clínica', justificativa: 'Coordenação de serviços' },
        { titulo: 'Gerente de Recursos Humanos', departamento: 'RH', especialidade: 'Gestão de Pessoas', justificativa: 'Recursos humanos' },
        { titulo: 'Gerente Financeiro', departamento: 'Financeiro', especialidade: 'Contabilidade', justificativa: 'Gestão financeira' }
      ],
      especialistas: [
        { titulo: 'Médico Clínico Geral', departamento: 'Clínica', especialidade: 'Clínica Médica', justificativa: 'Atendimento médico' },
        { titulo: 'Enfermeiro Chefe', departamento: 'Enfermagem', especialidade: 'Enfermagem', justificativa: 'Coordenação de cuidados' },
        { titulo: 'Farmacêutico', departamento: 'Farmácia', especialidade: 'Farmácia', justificativa: 'Gestão de medicamentos' },
        { titulo: 'Fisioterapeuta', departamento: 'Reabilitação', especialidade: 'Fisioterapia', justificativa: 'Reabilitação física' }
      ],
      operacional: [
        { titulo: 'Técnico de Enfermagem', departamento: 'Enfermagem', especialidade: 'Cuidados Básicos', justificativa: 'Assistência direta' },
        { titulo: 'Recepcionista', departamento: 'Administrativo', especialidade: 'Atendimento', justificativa: 'Recepção de pacientes' },
        { titulo: 'Auxiliar Administrativo', departamento: 'Administrativo', especialidade: 'Administrativo', justificativa: 'Suporte administrativo' }
      ]
    },
    educacao: {
      ceo: { titulo: 'Diretor Geral', departamento: 'Executivo', especialidade: 'Educação', justificativa: 'Liderança educacional' },
      diretoria: [
        { titulo: 'Diretor Pedagógico', departamento: 'Pedagógico', especialidade: 'Pedagogia', justificativa: 'Coordenação acadêmica' },
        { titulo: 'Diretor Administrativo', departamento: 'Administrativo', especialidade: 'Gestão Educacional', justificativa: 'Gestão institucional' }
      ],
      gerencia: [
        { titulo: 'Coordenador de Ensino', departamento: 'Pedagógico', especialidade: 'Coordenação', justificativa: 'Supervisão pedagógica' },
        { titulo: 'Gerente de Recursos Humanos', departamento: 'RH', especialidade: 'Gestão de Pessoas', justificativa: 'Recursos humanos' }
      ],
      especialistas: [
        { titulo: 'Professor de Matemática', departamento: 'Ensino', especialidade: 'Matemática', justificativa: 'Ensino especializado' },
        { titulo: 'Professor de Língua Portuguesa', departamento: 'Ensino', especialidade: 'Linguística', justificativa: 'Ensino de português' },
        { titulo: 'Professor de Ciências', departamento: 'Ensino', especialidade: 'Ciências', justificativa: 'Ensino científico' },
        { titulo: 'Psicólogo Educacional', departamento: 'Orientação', especialidade: 'Psicologia', justificativa: 'Apoio psicopedagógico' }
      ],
      operacional: [
        { titulo: 'Professor Assistente', departamento: 'Ensino', especialidade: 'Educação', justificativa: 'Suporte ao ensino' },
        { titulo: 'Secretário Escolar', departamento: 'Administrativo', especialidade: 'Administração', justificativa: 'Secretaria escolar' },
        { titulo: 'Auxiliar de Limpeza', departamento: 'Manutenção', especialidade: 'Serviços Gerais', justificativa: 'Manutenção da escola' }
      ]
    }
  };

  // Template padrão se indústria não encontrada
  const templatePadrao = templates.tecnologia;

  // Selecionar template baseado na indústria
  const template = templates[industria.toLowerCase()] || templatePadrao;

  // Ajustar tamanho baseado no porte
  const multiplicadores = { pequeno: 0.6, medio: 1.0, grande: 1.5 };
  const multiplicador = multiplicadores[porte.toLowerCase()] || 1.0;

  // Calcular distribuição de gênero (equilibrada)
  const totalPosicoes = Math.round((1 + template.diretoria.length + template.gerencia.length + template.especialistas.length + template.operacional.length) * multiplicador);

  // Adicionar gênero sugerido aleatoriamente mas equilibrado
  const adicionarGenero = (itens: any[]) => {
    return itens.map(item => ({
      ...item,
      genero_sugerido: Math.random() > 0.5 ? 'feminino' : 'masculino'
    }));
  };

  return {
    ceo: { ...template.ceo, genero_sugerido: Math.random() > 0.5 ? 'feminino' : 'masculino' },
    diretoria: adicionarGenero(template.diretoria.slice(0, Math.round(template.diretoria.length * multiplicador))),
    gerencia: adicionarGenero(template.gerencia.slice(0, Math.round(template.gerencia.length * multiplicador))),
    especialistas: adicionarGenero(template.especialistas.slice(0, Math.round(template.especialistas.length * multiplicador))),
    operacional: adicionarGenero(template.operacional.slice(0, Math.round(template.operacional.length * multiplicador))),
    total_posicoes: totalPosicoes,
    diversidade_recomendada: {
      executivos_homens: Math.round(totalPosicoes * 0.4),
      executivos_mulheres: Math.round(totalPosicoes * 0.4),
      gerencia_homens: Math.round(totalPosicoes * 0.3),
      gerencia_mulheres: Math.round(totalPosicoes * 0.3),
      especialistas_homens: Math.round(totalPosicoes * 0.25),
      especialistas_mulheres: Math.round(totalPosicoes * 0.25),
      operacional_homens: Math.round(totalPosicoes * 0.2),
      operacional_mulheres: Math.round(totalPosicoes * 0.2)
    }
  };
}

/**
 * Converte estrutura gerada pela IA para formato do banco (cargos_necessarios)
 */
export function converterParaCargosNecessarios(estrutura: EstruturaOrganizacional): string[] {
  const cargos: string[] = [];
  
  // CEO
  cargos.push(estrutura.ceo.titulo);
  
  // Diretoria
  estrutura.diretoria.forEach(cargo => cargos.push(cargo.titulo));
  
  // Gerência
  estrutura.gerencia.forEach(cargo => cargos.push(cargo.titulo));
  
  // Especialistas
  estrutura.especialistas.forEach(cargo => cargos.push(cargo.titulo));
  
  // Operacional
  estrutura.operacional.forEach(cargo => cargos.push(cargo.titulo));
  
  return cargos;
}

/**
 * Gera resumo executivo da estrutura para exibir ao usuário
 */
export function gerarResumoEstrutura(estrutura: EstruturaOrganizacional): string {
  return `
📊 **Estrutura Organizacional Gerada**

👔 **C-Level & Diretoria**: ${1 + estrutura.diretoria.length} posições
   - ${estrutura.ceo.titulo}
   ${estrutura.diretoria.map(c => `- ${c.titulo}`).join('\n   ')}

👨‍💼 **Gerência**: ${estrutura.gerencia.length} posições
   ${estrutura.gerencia.map(c => `- ${c.titulo}`).join('\n   ')}

🎯 **Especialistas**: ${estrutura.especialistas.length} posições
   ${estrutura.especialistas.map(c => `- ${c.titulo}`).join('\n   ')}

⚙️ **Operacional**: ${estrutura.operacional.length} posições
   ${estrutura.operacional.map(c => `- ${c.titulo}`).join('\n   ')}

**Total**: ${estrutura.total_posicoes} colaboradores

**Diversidade de Gênero**:
- Executivos: ${estrutura.diversidade_recomendada.executivos_homens}H / ${estrutura.diversidade_recomendada.executivos_mulheres}M
- Gerência: ${estrutura.diversidade_recomendada.gerencia_homens}H / ${estrutura.diversidade_recomendada.gerencia_mulheres}M
- Especialistas: ${estrutura.diversidade_recomendada.especialistas_homens}H / ${estrutura.diversidade_recomendada.especialistas_mulheres}M
- Operacional: ${estrutura.diversidade_recomendada.operacional_homens}H / ${estrutura.diversidade_recomendada.operacional_mulheres}M
  `.trim();
}
