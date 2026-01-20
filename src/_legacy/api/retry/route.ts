import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface RetryRequest {
  empresaId: string;
  script: string;
  reportOnly?: boolean;
  maxRetries?: number;
  delay?: number;
  backoff?: number;
}

interface RetryResult {
  success: boolean;
  data?: {
    totalFailed: number;
    retriable: number;
    processed: number;
    successes: number;
    failures: number;
    skipped: number;
    duration: number;
    details: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RetryResult>> {
  try {
    const body: RetryRequest = await request.json();
    const { empresaId, script, reportOnly = false, maxRetries = 3, delay = 2000, backoff = 2 } = body;

    // Validação
    if (!empresaId || !script) {
      return NextResponse.json(
        { success: false, error: 'empresaId e script são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar scripts válidos
    const validScripts = [
      '01_create_personas',
      '02_generate_biografias',
      '03_generate_atribuicoes',
      '04_generate_competencias',
      '05_generate_avatares',
      '06_analyze_automation',
      '06.5_generate_communications',
      '07_generate_workflows',
      '07.5_generate_supervision',
      '08_generate_ml',
      '09_generate_auditoria',
      'ALL'
    ];

    if (!validScripts.includes(script)) {
      return NextResponse.json(
        { success: false, error: `Script inválido. Valores aceitos: ${validScripts.join(', ')}` },
        { status: 400 }
      );
    }

    // Caminho para o script retry_failed.js
    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', 'retry_failed.js');
    
    // Construir argumentos
    const args = [
      scriptPath,
      `--script=${script}`,
      `--empresaId=${empresaId}`,
      `--maxRetries=${maxRetries}`,
      `--delay=${delay}`,
      `--backoff=${backoff}`
    ];

    if (reportOnly) {
      args.push('--report');
    }

    console.log(`🔄 Executando retry: node ${args.join(' ')}`);

    // Executar script
    const result = await executeRetryScript(args);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Erro na API de retry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao executar retry'
      },
      { status: 500 }
    );
  }
}

function executeRetryScript(args: string[]): Promise<RetryResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', args, {
      cwd: process.cwd(),
      env: { ...process.env },
      shell: true
    });

    let stdout = '';
    let stderr = '';
    const startTime = Date.now();

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      console.log(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      console.error(text);
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;

      if (code !== 0) {
        resolve({
          success: false,
          error: `Script falhou com código ${code}. Erro: ${stderr || 'Sem detalhes'}`
        });
        return;
      }

      // Parse do output para extrair estatísticas
      const parsed = parseRetryOutput(stdout);

      resolve({
        success: true,
        data: {
          ...parsed,
          duration,
          details: stdout
        }
      });
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        error: `Erro ao executar script: ${error.message}`
      });
    });
  });
}

function parseRetryOutput(output: string): {
  totalFailed: number;
  retriable: number;
  processed: number;
  successes: number;
  failures: number;
  skipped: number;
} {
  // Regex patterns para extrair valores
  const totalFailedMatch = output.match(/Total de falhas:\s*(\d+)/);
  const retriableMatch = output.match(/Falhas retentáveis:\s*(\d+)/);
  const successesMatch = output.match(/✅ Sucessos:\s*(\d+)/);
  const failuresMatch = output.match(/❌ Falhas:\s*(\d+)/);
  const skippedMatch = output.match(/⏭️\s+Pulados:\s*(\d+)/);

  return {
    totalFailed: totalFailedMatch ? parseInt(totalFailedMatch[1], 10) : 0,
    retriable: retriableMatch ? parseInt(retriableMatch[1], 10) : 0,
    processed: (successesMatch ? parseInt(successesMatch[1], 10) : 0) +
               (failuresMatch ? parseInt(failuresMatch[1], 10) : 0),
    successes: successesMatch ? parseInt(successesMatch[1], 10) : 0,
    failures: failuresMatch ? parseInt(failuresMatch[1], 10) : 0,
    skipped: skippedMatch ? parseInt(skippedMatch[1], 10) : 0
  };
}
