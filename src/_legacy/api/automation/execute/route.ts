import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * API Route para executar scripts COM sincronização automática de status
 */
export async function POST(request: NextRequest) {
  try {
    const { scriptId, empresaId } = await request.json();

    if (!scriptId || !empresaId) {
      return NextResponse.json(
        { success: false, error: 'scriptId e empresaId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`🚀 Executando ${scriptId} para empresa ${empresaId}`);

    // Mapear scriptId para arquivo
    const scriptMappings: Record<string, string> = {
      'create_personas': '01_create_personas_from_structure.js',
      'biografias': '02_generate_biografias_COMPLETO.js',
      'atribuicoes': '03_generate_atribuicoes_contextualizadas.js',
      'competencias': '04_generate_competencias_grok.js',
      'avatares': '05a_generate_avatar_prompts.js',
      'avatar_prompts': '05a_generate_avatar_prompts.js',
      'avatar_images': '05b_generate_images_fal.js',
      'avatar_download': '05c_download_avatares.js',
      'automation_analysis': '06_analyze_tasks_for_automation.js',
      'workflows': '07_generate_n8n_workflows.js',
      'machine_learning': '08_generate_machine_learning.js',
      'auditoria': '09_generate_auditoria.js'
    };

    const scriptFile = scriptMappings[scriptId];
    
    if (!scriptFile) {
      return NextResponse.json(
        { success: false, error: `Script "${scriptId}" não encontrado` },
        { status: 404 }
      );
    }

    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', scriptFile);
    const command = `node "${scriptPath}" --empresaId=${empresaId}`;

    console.log(`📝 Comando: ${command}`);

    // Executar script (timeout 30 minutos para scripts grandes)
    const { stdout, stderr } = await execAsync(command, {
      timeout: 1800000, // 30 min
      cwd: path.join(process.cwd(), 'AUTOMACAO'),
      env: {
        ...process.env,
        FORCE_COLOR: '0'
      },
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer
    });

    console.log(`✅ ${scriptId} concluído`);

    // Sincronizar status automaticamente
    console.log(`🔄 Sincronizando status...`);
    
    const syncPath = path.join(process.cwd(), 'AUTOMACAO', 'sync_script_status.js');
    const syncCommand = `node "${syncPath}" --empresaId=${empresaId}`;
    
    await execAsync(syncCommand, {
      timeout: 30000, // 30s
      cwd: path.join(process.cwd(), 'AUTOMACAO')
    });

    console.log(`✅ Status sincronizado`);

    return NextResponse.json({
      success: true,
      message: `${scriptId} executado com sucesso`,
      output: stdout.substring(0, 1000), // Primeiros 1000 chars
      scriptId,
      empresaId
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro desconhecido',
        details: error.stderr || error.stdout
      },
      { status: 500 }
    );
  }
}
