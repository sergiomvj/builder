import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 🎯 API SIMPLIFICADA para executar script de biografias
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎯 Executando script de biografias para:', body);
    
    const { empresa_id, script_name, force_mode = false } = body;

    if (!empresa_id || !script_name) {
      return NextResponse.json(
        { success: false, message: 'ID da empresa e nome do script são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Buscar dados da empresa
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

    console.log(`📊 Executando ${script_name} para empresa: ${empresa.nome}`);

    // 2. Mapear script para arquivo correspondente
    const scriptMap: Record<string, string> = {
      'generate_biografias': '01_generate_biografias_REAL.js',
      'generate_competencias': '02_generate_competencias_grok.cjs', 
      'generate_avatares': '00_generate_avatares_grok.cjs',
      'generate_tech_specs': '04_generate_tech_specs.js',
      'populate_rag': '05_generate_rag_knowledge.js',
      'generate_fluxos': '06_generate_fluxos_sdr.js',
      'personas_names': '00.5_generate_personas_names_grok.cjs',
      'avatar_images': '01.3_generate_avatar_images.cjs',
      'atribuicoes': '01.5_generate_atribuicoes_contextualizadas.cjs',
      'tasks_automation': '02.5_analyze_tasks_for_automation.js',
      'workflows_n8n': '03_generate_n8n_from_tasks.js'
    };

    const scriptFile = scriptMap[script_name];
    if (!scriptFile) {
      return NextResponse.json(
        { success: false, message: `Script ${script_name} não encontrado` },
        { status: 404 }
      );
    }

    // 3. Executar script
    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', scriptFile);
    const forceFlag = force_mode ? ' --force' : '';
    const command = `node "${scriptPath}" --empresaId=${empresa_id}${forceFlag}`;
    
    console.log(`🚀 Executando: ${command}`);
    console.log(`   Modo: ${force_mode ? '🧹 FORÇA TOTAL' : '⏭️ INCREMENTAL'}`);
    
    // Marcar script como em execução
    const statusField = getStatusField(script_name);
    if (statusField) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            [statusField]: { running: true, last_run: new Date().toISOString() }
          }
        })
        .eq('id', empresa_id);
    }

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('❌ Erro no script:', stderr);
      
      // Marcar erro no status
      if (statusField) {
        await supabase
          .from('empresas')
          .update({
            scripts_status: {
              ...empresa.scripts_status,
              [statusField]: {
                running: false,
                last_result: 'error',
                last_run: new Date().toISOString(),
                error_message: stderr
              }
            }
          })
          .eq('id', empresa_id);
      }
      
      return NextResponse.json(
        { success: false, message: 'Erro na execução do script', error: stderr },
        { status: 500 }
      );
    }

    // Marcar sucesso no status
    if (statusField) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            [statusField]: {
              running: false,
              last_result: 'success',
              last_run: new Date().toISOString()
            }
          }
        })
        .eq('id', empresa_id);
    }

    console.log('✅ Script executado com sucesso:', stdout);

    return NextResponse.json({
      success: true,
      message: `Script ${script_name} executado com sucesso para "${empresa.nome}"!`,
      output: stdout,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        codigo: empresa.codigo
      }
    });

  } catch (error) {
    console.error('❌ Erro na execução do script:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Mapear nome do script para campo do scripts_status
 */
function getStatusField(scriptName: string): string | null {
  const fieldMap: Record<string, string | null> = {
    'generate_biografias': 'biografias',
    'generate_competencias': 'competencias',
    'generate_avatares': 'avatares',
    'generate_tech_specs': 'tech_specs',
    'populate_rag': 'rag',
    'generate_fluxos': 'fluxos',
    'personas_names': 'personas_names',
    'avatar_images': 'avatar_images',
    'atribuicoes': 'atribuicoes',
    'tasks_automation': 'tasks_automation',
    'workflows_n8n': 'workflows_n8n'
  };
  
  return fieldMap[scriptName] || null;
}

export async function GET() {
  return NextResponse.json({
    message: "Script Execution API",
    description: "Executa scripts de automação para empresas",
    available_scripts: [
      "personas_names",
      "generate_avatares",
      "avatar_images",
      "generate_biografias",
      "atribuicoes",
      "generate_competencias",
      "tasks_automation",
      "workflows_n8n",
      "generate_tech_specs",
      "populate_rag",
      "generate_fluxos"
    ]
  });
}