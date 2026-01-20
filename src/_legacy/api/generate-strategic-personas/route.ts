import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 🎯 API para GERAR PERSONAS ESTRATÉGICAS
 * Recebe empresa JÁ CRIADA e gera staff inteligente baseado nos dados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎯 Gerando personas estratégicas para:', body);
    
    const { empresa_id } = body;

    if (!empresa_id) {
      return NextResponse.json(
        { success: false, message: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar dados da empresa JÁ CRIADA
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresa_id)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { success: false, message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    console.log(`📊 Analisando empresa: ${empresa.nome} (${empresa.industria})`);

    // 2. ANÁLISE ESTRATÉGICA baseada nos dados existentes
    const analiseEstrategica = await analisarEmpresaExistente(empresa);
    
    // 3. GERAR STAFF INTELIGENTE baseado na análise
    const staffEstrategico = await gerarStaffInteligente(empresa, analiseEstrategica);
    
    // 4. EXECUTAR SCRIPTS de geração com dados estratégicos
    const resultados = await executarGeracaoEstrategica(empresa, staffEstrategico);

    // 5. ATUALIZAR STATUS da empresa
    await supabase
      .from('empresas')
      .update({ 
        scripts_status: {
          ...empresa.scripts_status,
          personas: true,
          biografias: true,
          analise_estrategica: true
        },
        total_personas: staffEstrategico.personas.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', empresa.id);

    return NextResponse.json({
      success: true,
      message: `Staff estratégico gerado para "${empresa.nome}"!`,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        codigo: empresa.codigo
      },
      analise_estrategica: analiseEstrategica,
      staff_gerado: {
        total_personas: staffEstrategico.personas.length,
        distribuicao: staffEstrategico.distribuicao_por_nivel,
        competencias_chave: staffEstrategico.competencias_chave,
        cobertura_objetivos: staffEstrategico.coverage_objetivos
      },
      resultados_scripts: resultados
    });

  } catch (error) {
    console.error('❌ Erro na geração estratégica:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 📊 ANÁLISE ESTRATÉGICA da empresa existente
 */
async function analisarEmpresaExistente(empresa: any) {
  console.log('🔍 Analisando estratégia da empresa...');
  
  // EXTRAIR OBJETIVOS da descrição usando IA (ou regex patterns)
  const objetivosExtracted = extrairObjetivos(empresa.descricao);
  
  // ANALISAR MERCADOS-ALVO baseado em idiomas + país
  const mercadosAlvo = analisarMercados(empresa.pais, empresa.idiomas);
  
  // DETERMINAR ESTÁGIO da empresa baseado em indústria + descrição
  const estagioEmpresa = determinarEstagio(empresa.descricao, empresa.industria);
  
  // ANALISAR MIX DEMOGRÁFICO atual
  const mixAtual = {
    executivos: { h: empresa.executives_male, m: empresa.executives_female },
    especialistas: { h: empresa.specialists_male, m: empresa.specialists_female },
    assistentes: { h: empresa.assistants_male, m: empresa.assistants_female }
  };

  return {
    objetivos: objetivosExtracted,
    mercados_alvo: mercadosAlvo,
    estagio: estagioEmpresa,
    mix_demografico: mixAtual,
    cultura_inferida: empresa.pais, // Simplificado
    competencias_necessarias: [] // Simplificado por enquanto
  };
}

/**
 * 🎯 EXTRAIR OBJETIVOS da descrição usando patterns
 */
function extrairObjetivos(descricao) {
  const patterns = {
    crescimento: /crescer|expan|aument|escal|cresc/gi,
    internacional: /internacional|global|mundo|export|exterior/gi,
    tecnologia: /inovação|tecnolog|digital|AI|IA|automaç/gi,
    ipo: /IPO|invest|capital|funding|aporte/gi,
    mercado: /mercado|cliente|venda|comercial/gi
  };

  const objetivos = [];
  
  if (patterns.crescimento.test(descricao)) {
    objetivos.push({ tipo: 'crescimento', relevancia: 'alta' });
  }
  if (patterns.internacional.test(descricao)) {
    objetivos.push({ tipo: 'expansao_internacional', relevancia: 'alta' });
  }
  if (patterns.tecnologia.test(descricao)) {
    objetivos.push({ tipo: 'inovacao_tecnologica', relevancia: 'alta' });
  }
  if (patterns.ipo.test(descricao)) {
    objetivos.push({ tipo: 'preparacao_investimento', relevancia: 'alta' });
  }
  
  return objetivos;
}

/**
 * 🌍 ANALISAR MERCADOS baseado em país + idiomas
 */
function analisarMercados(pais, idiomas) {
  const mercados = [pais]; // Mercado doméstico
  
  const mercadosPorIdioma = {
    'inglês': ['US', 'UK', 'AU', 'CA'],
    'espanhol': ['ES', 'MX', 'AR', 'CO', 'CL'],
    'francês': ['FR', 'BE', 'CA'],
    'alemão': ['DE', 'AT', 'CH'],
    'italiano': ['IT'],
    'chinês': ['CN', 'TW', 'HK'],
    'japonês': ['JP']
  };
  
  idiomas?.forEach(idioma => {
    if (mercadosPorIdioma[idioma]) {
      mercados.push(...mercadosPorIdioma[idioma]);
    }
  });
  
  return [...new Set(mercados)]; // Remove duplicatas
}

/**
 * 🏢 DETERMINAR ESTÁGIO da empresa
 */
function determinarEstagio(descricao, industria) {
  if (descricao.includes('startup') || descricao.includes('começando')) {
    return 'startup';
  }
  if (descricao.includes('escalar') || descricao.includes('crescimento')) {
    return 'scaleup';
  }
  if (descricao.includes('consolidada') || descricao.includes('líder')) {
    return 'enterprise';
  }
  
  // Default baseado na indústria
  return 'startup'; // Assumir startup como padrão
}

/**
 * 👥 GERAR STAFF baseado na análise
 */
async function gerarStaffInteligente(empresa, analise) {
  console.log('👥 Montando staff estratégico...');
  
  // Import dinâmico para módulo ES
  const { default: IntelligentStaffPlanner } = await import('@/lib/intelligent-staff-planner');
  const staffPlanner = new IntelligentStaffPlanner();
  
  const empresaData = {
    objetivos: analise.objetivos,
    industria: empresa.industria,
    pais: empresa.pais,
    idiomas: empresa.idiomas || [],
    estagio: analise.estagio,
    orcamento_staff: 'moderate',
    mix_demografico: analise.mix_demografico,
    mercados_alvo: analise.mercados_alvo,
    cultura_empresarial: analise.cultura_inferida
  };
  
  return staffPlanner.generateOptimalStaff(empresaData);
}

/**
 * ⚙️ EXECUTAR SCRIPTS de geração
 */
async function executarGeracaoEstrategica(empresa, staffData) {
  console.log('⚙️ Executando scripts de geração...');
  
  try {
    // 1. Criar personas estratégicas
    const createPersonasPath = path.join(process.cwd(), 'create_personas_strategic.js');
    const { stdout: personasOutput } = await execAsync(
      `node "${createPersonasPath}" ${empresa.id} '${JSON.stringify(staffData)}'`
    );
    
    // 2. Gerar biografias baseadas no contexto estratégico
    const biografiasPath = path.join(process.cwd(), 'AUTOMACAO', '02_PROCESSAMENTO_PERSONAS', 'generate_biografias_strategic.js');
    const { stdout: biografiasOutput } = await execAsync(
      `node "${biografiasPath}" ${empresa.id}`
    );
    
    return {
      personas: { success: true, output: personasOutput },
      biografias: { success: true, output: biografiasOutput }
    };
    
  } catch (error) {
    console.error('❌ Erro na execução dos scripts:', error);
    return {
      personas: { success: false, error: error.message },
      biografias: { success: false, error: error.message }
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Strategic Persona Generation API',
    description: 'Gera personas inteligentes baseadas em análise estratégica da empresa',
    required_fields: ['empresa_id']
  });
}