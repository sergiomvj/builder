import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface ScriptExecutionRequest {
  empresaId: string;
  scriptType: 'create-personas' | 'biografias' | 'competencias' | 'tech-specs' | 'rag' | 'workflows';
  empresaData?: {
    codigo: string;
    nome: string;
    industria: string;
    pais: string;
    total_personas: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando execução de script...');
    
    const requestBody = await request.json();
    console.log('📋 Request body recebido:', requestBody);
    
    const { empresaId, scriptType, empresaData }: ScriptExecutionRequest = requestBody;

    if (!empresaId || !scriptType) {
      console.error('❌ Parâmetros inválidos:', { empresaId, scriptType });
      return NextResponse.json(
        { error: 'empresaId e scriptType são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`🎯 Executando script ${scriptType} para empresa ${empresaId}`);

    let scriptCommand = '';
    const automacaoPath = path.join(process.cwd(), 'AUTOMACAO');
    console.log('📁 Caminho da automação:', automacaoPath);

    switch (scriptType) {
      case 'create-personas':
        // Criar personas básicas primeiro
        scriptCommand = `node "${path.join(process.cwd(), 'create_personas.js')}" "${empresaId}"`;
        break;
        
      case 'biografias':
        // Executar script de biografias simplificado - DEVE vir antes das competências
        scriptCommand = `cd "${path.join(automacaoPath, '02_PROCESSAMENTO_PERSONAS')}" && node generate_biografias_simples.js ${empresaId}`;
        break;

      case 'competencias':
        scriptCommand = `cd "${automacaoPath}/02_PROCESSAMENTO_PERSONAS" && node generate_competencias_simple.js --empresaId ${empresaId}`;
        break;

      case 'tech-specs':
        scriptCommand = `cd "${automacaoPath}/02_PROCESSAMENTO_PERSONAS" && node generate_tech_specs_simple.js --empresaId ${empresaId}`;
        break;

      case 'rag':
        // Primeiro precisamos obter o código da empresa
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('codigo')
          .eq('id', empresaId)
          .single();
        
        if (!empresaData) {
          console.error('❌ Empresa não encontrada:', empresaId);
          return NextResponse.json(
            { error: 'Empresa não encontrada' },
            { status: 404 }
          );
        }

        scriptCommand = `cd "${automacaoPath}/02_PROCESSAMENTO_PERSONAS" && node 03_generate_rag.js --empresa-codigo ${empresaData.codigo}`;
        break;

      case 'workflows':
        // Primeiro precisamos obter o código da empresa para workflows também
        const { data: empresaWorkflowData } = await supabase
          .from('empresas')
          .select('codigo')
          .eq('id', empresaId)
          .single();
        
        if (!empresaWorkflowData) {
          console.error('❌ Empresa não encontrada para workflows:', empresaId);
          return NextResponse.json(
            { error: 'Empresa não encontrada' },
            { status: 404 }
          );
        }

        scriptCommand = `cd "${automacaoPath}/02_PROCESSAMENTO_PERSONAS" && node 05_generate_workflows_n8n.js --empresa-codigo ${empresaWorkflowData.codigo}`;
        break;

      default:
        console.error('❌ Tipo de script inválido:', scriptType);
        return NextResponse.json(
          { error: 'Tipo de script inválido' },
          { status: 400 }
        );
    }

    console.log(`📋 Comando a ser executado: ${scriptCommand}`);

    // MODO SEGURO: Verificar se estamos em desenvolvimento
    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableRealExecution = process.env.ENABLE_SCRIPT_EXECUTION === 'true' || isDevelopment;
    
    if (!enableRealExecution) {
      console.log('⚠️ MODO SIMULAÇÃO - Scripts desabilitados por segurança');
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOutput = `Script ${scriptType} executado com sucesso (simulado)`;
      
      console.log(`✅ Script ${scriptType} simulado com sucesso`);

      // Resposta de sucesso simulada
      return NextResponse.json({
        success: true,
        scriptType,
        empresaId,
        output: mockOutput,
        warnings: null,
        executedAt: new Date().toISOString(),
        mode: 'simulation'
      });
    }

    // EXECUÇÃO REAL DOS SCRIPTS
    console.log('🚀 MODO REAL - Executando script de verdade...');
    
    try {
      const { stdout, stderr } = await execAsync(scriptCommand, {
        timeout: 300000, // 5 minutos timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      console.log(`✅ Script ${scriptType} executado com sucesso`);
      console.log('📤 STDOUT:', stdout);
      
      if (stderr) {
        console.warn('⚠️ STDERR:', stderr);
      }

      // Resposta de sucesso
      return NextResponse.json({
        success: true,
        scriptType,
        empresaId,
        output: stdout,
        warnings: stderr || null,
        executedAt: new Date().toISOString(),
        mode: 'real'
      });
      
    } catch (execError: any) {
      console.error(`❌ Erro na execução do script:`, execError);
      
      // Em caso de erro, retornar detalhes
      return NextResponse.json({
        error: 'Erro na execução do script',
        details: execError.message,
        scriptType,
        empresaId,
        executedAt: new Date().toISOString(),
        mode: 'real-error'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`❌ Erro ao executar script:`, error);
    
    return NextResponse.json({
      error: 'Erro na execução do script',
      details: error.message,
      stack: error.stack,
      executedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET para listar scripts disponíveis
export async function GET() {
  return NextResponse.json({
    availableScripts: [
      {
        type: 'biografias',
        description: 'Gerar biografias completas das personas',
        estimatedTime: '2-3 minutos'
      },
      {
        type: 'competencias',
        description: 'Mapear competências técnicas e comportamentais',
        estimatedTime: '1-2 minutos'
      },
      {
        type: 'tech-specs',
        description: 'Criar especificações técnicas por função',
        estimatedTime: '1-2 minutos'
      },
      {
        type: 'rag',
        description: 'Popular base de conhecimento RAG',
        estimatedTime: '3-5 minutos'
      },
      {
        type: 'workflows',
        description: 'Gerar workflows N8N automatizados',
        estimatedTime: '2-3 minutos'
      }
    ],
    totalEstimatedTime: '10-15 minutos',
    systemStatus: 'ready'
  });
}