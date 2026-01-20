import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

// Armazenamento em memória do status de execução
const executionStatus = new Map();

/**
 * 🎯 API ENDPOINT - GERAR ATRIBUIÇÕES COM CONTROLE DE EXECUÇÃO
 * ==========================================================
 * 
 * Sistema completo de monitoramento de execução em tempo real
 * Alinhado com Master Fluxo: "Cargos tem atribuições"
 */

export async function POST(req: NextRequest) {
  try {
    const { empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já está executando
    if (executionStatus.get(empresaId)?.status === 'running') {
      return NextResponse.json({
        success: false,
        error: 'Script já está executando para esta empresa',
        currentStatus: executionStatus.get(empresaId)
      });
    }

    // Inicializar status
    const statusId = `exec_${empresaId}_${Date.now()}`;
    executionStatus.set(empresaId, {
      id: statusId,
      status: 'running',
      startTime: new Date(),
      currentPhase: 'Iniciando...',
      progress: { current: 0, total: 15 },
      logs: [],
      empresaId
    });

    console.log('🎯 Iniciando geração de atribuições com controle de execução');

    // Executar script de forma assíncrona
    executeScriptWithMonitoring(empresaId, statusId);

    // Retornar imediatamente com status inicial
    return NextResponse.json({
      success: true,
      message: 'Execução iniciada com sucesso',
      statusId,
      status: executionStatus.get(empresaId)
    });

  } catch (error: any) {
    console.error('❌ Erro na API de atribuições:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const empresaId = url.searchParams.get('empresaId');
  const action = url.searchParams.get('action');

  // Status de execução específica
  if (empresaId && action === 'status') {
    const status = executionStatus.get(empresaId);
    return NextResponse.json({
      found: !!status,
      status: status || null
    });
  }

  // Informações gerais do endpoint
  return NextResponse.json({
    endpoint: 'generate-atribuicoes',
    description: 'Gera atribuições contextualizadas via LLM com controle de execução',
    usage: {
      post: 'POST com { empresaId: "uuid" } - Inicia execução',
      get: 'GET com ?empresaId=uuid&action=status - Consulta status'
    },
    script: '01.5_generate_atribuicoes_contextualizadas.js',
    masterFluxo: 'Cargos tem atribuições',
    features: ['Real-time status', 'Progress tracking', 'Log streaming', 'Duplicate protection']
  });
}

// Função para executar script com monitoramento
async function executeScriptWithMonitoring(empresaId: string, statusId: string) {
  try {
    const status = executionStatus.get(empresaId);
    if (!status) return;

    // Atualizar status
    status.currentPhase = 'Carregando empresa e personas...';
    status.logs.push(`[${new Date().toLocaleTimeString()}] 🏢 Iniciando processamento`);
    
    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', '01.5_generate_atribuicoes_contextualizadas.js');
    const command = `node "${scriptPath}" --empresaId=${empresaId}`;
    
    status.logs.push(`[${new Date().toLocaleTimeString()}] 📋 Executando: ${path.basename(scriptPath)}`);
    status.currentPhase = 'Executando script LLM...';

    // Executar com captura de saída em tempo real
    const child = exec(command, {
      timeout: 10 * 60 * 1000, // 10 minutos
      cwd: process.cwd()
    });

    let outputBuffer = '';

    child.stdout?.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      
      // Parsear progresso do output
      parseProgressFromOutput(output, empresaId);
    });

    child.stderr?.on('data', (data) => {
      const error = data.toString();
      status.logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ ${error.trim()}`);
    });

    child.on('close', (code) => {
      const finalStatus = executionStatus.get(empresaId);
      if (!finalStatus) return;

      if (code === 0) {
        finalStatus.status = 'completed';
        finalStatus.currentPhase = 'Concluído com sucesso!';
        finalStatus.progress.current = finalStatus.progress.total;
        finalStatus.endTime = new Date();
        finalStatus.logs.push(`[${new Date().toLocaleTimeString()}] ✅ Execução concluída com sucesso`);
      } else {
        finalStatus.status = 'error';
        finalStatus.currentPhase = `Erro na execução (código ${code})`;
        finalStatus.endTime = new Date();
        finalStatus.logs.push(`[${new Date().toLocaleTimeString()}] ❌ Execução falhou com código ${code}`);
      }
    });

    child.on('error', (error) => {
      const finalStatus = executionStatus.get(empresaId);
      if (finalStatus) {
        finalStatus.status = 'error';
        finalStatus.currentPhase = `Erro: ${error.message}`;
        finalStatus.endTime = new Date();
        finalStatus.logs.push(`[${new Date().toLocaleTimeString()}] ❌ Erro de execução: ${error.message}`);
      }
    });

  } catch (error: any) {
    const finalStatus = executionStatus.get(empresaId);
    if (finalStatus) {
      finalStatus.status = 'error';
      finalStatus.currentPhase = `Erro interno: ${error.message}`;
      finalStatus.endTime = new Date();
      finalStatus.logs.push(`[${new Date().toLocaleTimeString()}] ❌ Erro interno: ${error.message}`);
    }
  }
}

// Função para parsear progresso do output do script
function parseProgressFromOutput(output: string, empresaId: string) {
  const status = executionStatus.get(empresaId);
  if (!status) return;

  const lines = output.split('\n');
  
  for (const line of lines) {
    // Detectar início de processamento de persona
    const personaMatch = line.match(/🔄 Processando: (.+?) \((.+?)\)/);
    if (personaMatch) {
      const [, nome, cargo] = personaMatch;
      status.currentPhase = `Processando: ${nome} (${cargo})`;
      status.logs.push(`[${new Date().toLocaleTimeString()}] 🔄 ${nome} - ${cargo}`);
    }

    // Detectar sucesso de persona
    const sucessoMatch = line.match(/✅ Atribuições salvas com sucesso/);
    if (sucessoMatch) {
      status.progress.current = Math.min(status.progress.current + 1, status.progress.total);
      status.logs.push(`[${new Date().toLocaleTimeString()}] ✅ Persona processada (${status.progress.current}/${status.progress.total})`);
    }

    // Detectar erros
    const erroMatch = line.match(/❌ (.+)/);
    if (erroMatch) {
      status.logs.push(`[${new Date().toLocaleTimeString()}] ❌ ${erroMatch[1]}`);
    }

    // Detectar fases específicas
    if (line.includes('Limpando') && line.includes('atribuições existentes')) {
      status.currentPhase = 'Limpando atribuições anteriores...';
      status.logs.push(`[${new Date().toLocaleTimeString()}] 🗑️ Limpando dados anteriores`);
    }

    if (line.includes('Gerando atribuições contextualizadas via LLM')) {
      status.currentPhase = 'Iniciando geração LLM...';
      status.logs.push(`[${new Date().toLocaleTimeString()}] 🤖 Iniciando processamento LLM`);
    }
  }
}