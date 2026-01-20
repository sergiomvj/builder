import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

/**
 * POST /api/automation/generate-workflows
 * 
 * Executa o pipeline de geração de workflows para personas selecionadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, personaIds } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, message: 'empresaId é obrigatório' },
        { status: 400 }
      );
    }

    if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'personaIds deve ser um array com ao menos 1 ID' },
        { status: 400 }
      );
    }

    console.log(`🚀 Iniciando pipeline para ${personaIds.length} persona(s)`);

    // Caminho para o diretório AUTOMACAO
    const automacaoDir = path.join(process.cwd(), 'AUTOMACAO');

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Processar cada persona sequencialmente
    for (let i = 0; i < personaIds.length; i++) {
      const personaId = personaIds[i];
      
      try {
        console.log(`[${i + 1}/${personaIds.length}] Processando persona ${personaId}`);

        // Executar análise de tarefas
        const analyzeCmd = `node "02.5_analyze_tasks_for_automation.js" --empresaId=${empresaId} --personaId=${personaId}`;
        
        const { stdout, stderr } = await execPromise(analyzeCmd, {
          cwd: automacaoDir,
          timeout: 300000, // 5 minutos
          env: {
            ...process.env,
            FORCE_COLOR: '0', // Desabilitar cores ANSI
          }
        });

        // Extrair estatísticas do output
        const tasksMatch = stdout.match(/(\d+) tarefas analisadas/);
        const opportunitiesMatch = stdout.match(/(\d+) oportunidade\(s\) identificada\(s\)/);

        results.push({
          personaId,
          success: true,
          tasksAnalyzed: tasksMatch ? parseInt(tasksMatch[1]) : 0,
          opportunitiesFound: opportunitiesMatch ? parseInt(opportunitiesMatch[1]) : 0
        });

        successCount++;

        // Rate limiting: 2s entre chamadas (exceto na última)
        if (i < personaIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error: any) {
        console.error(`❌ Erro ao processar persona ${personaId}:`, error.message);
        
        results.push({
          personaId,
          success: false,
          error: error.message
        });

        errorCount++;
      }
    }

    // Gerar workflows N8N para todas as oportunidades criadas
    if (successCount > 0) {
      try {
        console.log('🔄 Gerando workflows N8N...');
        
        const workflowCmd = `node "03_generate_n8n_from_tasks.js" --empresaId=${empresaId}`;
        
        await execPromise(workflowCmd, {
          cwd: automacaoDir,
          timeout: 300000, // 5 minutos
          env: {
            ...process.env,
            FORCE_COLOR: '0',
          }
        });

        console.log('✅ Workflows N8N gerados');

      } catch (wfError: any) {
        console.error('❌ Erro ao gerar workflows N8N:', wfError.message);
      }
    }

    console.log(`✅ Pipeline concluído: ${successCount} sucesso, ${errorCount} erros`);

    return NextResponse.json({
      success: true,
      message: `Pipeline concluído: ${successCount}/${personaIds.length} personas processadas`,
      results,
      stats: {
        total: personaIds.length,
        success: successCount,
        errors: errorCount
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no pipeline:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao executar pipeline',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
