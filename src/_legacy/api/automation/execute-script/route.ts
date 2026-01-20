import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * API Route para executar scripts de automação do VCM
 * Suporta execução por empresa (cascata) ou por persona individual
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      empresaId, 
      personaId, 
      scriptName, 
      scriptNumber, 
      scriptCommand, 
      force_mode = false,
      additionalParams = {}  // Novos parâmetros adicionais para scripts específicos
    } = await request.json();

    console.log('🚀 Executando script:', {
      empresaId,
      personaId,
      scriptName,
      scriptNumber,
      scriptCommand,
      force_mode,
      additionalParams
    });

    // Validação: precisa de empresaId OU personaId
    if (!empresaId && !personaId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'É necessário fornecer empresaId ou personaId' 
        },
        { status: 400 }
      );
    }

    // Validação: precisa de scriptName OU scriptNumber
    if (!scriptName && !scriptNumber) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'É necessário fornecer scriptName ou scriptNumber' 
        },
        { status: 400 }
      );
    }

    // Mapear nomes de scripts para arquivos reais (ORDEM CORRETA: 00-11)
    const scriptMappings: Record<string, string> = {
      '00': '00_generate_company_foundation.js',
      '01': '01_create_personas_from_structure.js',
      '02': '02_generate_biografias_COMPLETO.js',
      '03': '03_generate_atribuicoes_contextualizadas.js',
      '04': '04_generate_competencias_grok.js',
      '05a': '05a_generate_avatar_prompts.js',
      '05b': '05b_generate_images_pollinations.js',
      '05c': '05c_download_avatares.js',
      '06': '06_analyze_tasks_for_automation.js',
      '06.5': '06.5_generate_rag_recommendations.js',
      '06.75': '06.75_export_topics_for_generation.js',
      '06.76': '06.76_add_custom_topics.js',
      '06.8': '06.8_generate_documents_from_rag.js',
      '07': '07_generate_n8n_workflows.js',
      '07.5': '07.5_generate_supervision_chains.js',
      '08': '08_generate_machine_learning.js',
      '09': '09_generate_auditoria.js',
      '10': '10_generate_knowledge_base.js',
      '11': '11_test_rag_system.js',
      // Legacy names (manter compatibilidade)
      'company_foundation': '00_generate_company_foundation.js',
      'create_personas': '01_create_personas_from_structure.js',
      'biografias': '02_generate_biografias_COMPLETO.js',
      'atribuicoes': '03_generate_atribuicoes_contextualizadas.js',
      'competencias': '04_generate_competencias_grok.js',
      'avatares': '05a_generate_avatar_prompts.js',
      'avatar_prompts': '05a_generate_avatar_prompts.js',
      'avatar_images': '05b_generate_images_pollinations.js',
      'avatar_download': '05c_download_avatares.js',
      'download_images': '05c_download_avatares.js',
      'automation_analysis': '06_analyze_tasks_for_automation.js',
      'tasks_automation': '06_analyze_tasks_for_automation.js',
      'rag_recommendations': '06.5_generate_rag_recommendations.js',
      'export_topics': '06.75_export_topics_for_generation.js',
      'add_custom_topics': '06.76_add_custom_topics.js',
      'generate_documents_rag': '06.8_generate_documents_from_rag.js',
      'workflows_n8n': '07_generate_n8n_workflows.js',
      'supervision_chains': '07.5_generate_supervision_chains.js',
      'machine_learning': '08_generate_machine_learning.js',
      'auditoria': '09_generate_auditoria.js',
      'knowledge_base': '10_generate_knowledge_base.js',
      'test_rag_system': '11_test_rag_system.js'
    };

    const scriptFile = scriptMappings[scriptNumber || scriptName];
    
    if (!scriptFile) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Script "${scriptNumber || scriptName}" não encontrado no mapeamento` 
        },
        { status: 404 }
      );
    }

    // Construir caminho completo do script
    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', scriptFile);
    const forceFlag = force_mode ? ' --force' : '';
    
    // Usar personaId se fornecido, senão empresaId
    const targetParam = personaId 
      ? `--personaId=${personaId}` 
      : `--empresaId=${empresaId}`;
    
    // Adicionar parâmetros específicos do script (ex: --source para script 10)
    let additionalArgs = '';
    if (additionalParams && Object.keys(additionalParams).length > 0) {
      additionalArgs = Object.entries(additionalParams)
        .map(([key, value]) => ` --${key}="${value}"`)
        .join('');
    }
    
    const command = `node "${scriptPath}" ${targetParam}${forceFlag}${additionalArgs}`;

    console.log('📝 Executando comando:', command);
    console.log('   Modo:', personaId ? '👤 PERSONA INDIVIDUAL' : '🏢 EMPRESA COMPLETA');
    console.log('   Force:', force_mode ? '🧹 FORÇA TOTAL' : '⏭️ INCREMENTAL');
    console.log('   Params adicionais:', additionalParams);
    console.log('🔑 Env vars check:', {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      GOOGLE_AI: !!process.env.GOOGLE_AI_API_KEY,
      OPENAI: !!process.env.OPENAI_API_KEY
    });

    // Executar script com timeout de 10 minutos (scripts LLM podem demorar)
    const { stdout, stderr } = await execAsync(command, {
      timeout: 600000, // 10 minutos
      cwd: path.join(process.cwd(), 'AUTOMACAO'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        FORCE_COLOR: '0' // Desabilitar cores ANSI
      },
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    console.log('✅ Script executado com sucesso');
    console.log('stdout:', stdout);
    
    if (stderr) {
      console.warn('stderr:', stderr);
    }

    // Analisar saída para verificar sucesso
    // Apenas considerar erro se houver mensagens de erro FATAL ou se falhou no final
    const hasFatalError = stdout.toLowerCase().includes('erro fatal') || 
                         stdout.toLowerCase().includes('fatal error') ||
                         stdout.toLowerCase().includes('❌ processo') ||
                         (stderr && stderr.toLowerCase().includes('error') && !stderr.toLowerCase().includes('warning'));

    // Verificar se o script concluiu com sucesso
    const hasSuccess = stdout.toLowerCase().includes('processo concluído com sucesso') ||
                      stdout.toLowerCase().includes('✅');

    if (hasFatalError && !hasSuccess) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Script executado mas reportou erros',
          output: stdout,
          errors: stderr
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Script "${scriptName}" executado com sucesso!`,
      output: stdout,
      details: {
        scriptName,
        empresaId,
        timestamp: new Date().toISOString(),
        scriptFile
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao executar script:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao executar script: ${error.message || 'Erro desconhecido'}`,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'BuildCorp Script Execution API',
    available_scripts: [
      '01 - create_personas',
      '02 - biografias',
      '03 - atribuicoes',
      '04 - competencias',
      '05a - avatar_prompts (LLM)',
      '05b - avatar_images (Fal.ai)',
      '05c - download_images (Local)',
      '06 - tasks_automation',
      '06.5 - rag_recommendations',
      '07 - workflows_n8n',
      '08 - machine_learning',
      '09 - auditoria',
      '10 - knowledge_base',
      '11 - test_rag_system'
    ],
    usage: 'POST com { empresaId, scriptName ou scriptNumber, force_mode? }'
  });
}
