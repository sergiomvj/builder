import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { empresaCodigo, executeAll = true, scriptId = null } = await request.json();

    if (!empresaCodigo) {
      return NextResponse.json(
        { error: 'empresaCodigo é obrigatório' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results: any[] = [];

    // Scripts da cascata em ordem
    const cascadeScripts = [
      {
        id: 'avatares',
        name: 'Script 0 - Avatares',
        path: 'AUTOMACAO/00_generate_avatares.js'
      },
      {
        id: 'competencias',
        name: 'Script 1 - Competências',
        path: 'AUTOMACAO/02_PROCESSAMENTO_PERSONAS/generate_competencias_simple.js'
      },
      {
        id: 'tech-specs',
        name: 'Script 2 - Tech Specs',
        path: 'AUTOMACAO/02_PROCESSAMENTO_PERSONAS/02_generate_tech_specs.js'
      },
      {
        id: 'rag-database',
        name: 'Script 3 - RAG Database',
        path: 'AUTOMACAO/02_PROCESSAMENTO_PERSONAS/03_generate_rag.js'
      },
      {
        id: 'fluxos-analise',
        name: 'Script 4 - Análise Fluxos',
        path: 'AUTOMACAO/02_PROCESSAMENTO_PERSONAS/04_generate_fluxos_analise.js'
      },
      {
        id: 'workflows-n8n',
        name: 'Script 5 - Workflows N8N',
        path: 'AUTOMACAO/02_PROCESSAMENTO_PERSONAS/05_generate_workflows_n8n.js'
      }
    ];

    console.log(`🚀 Iniciando ${executeAll ? 'cascata completa' : 'script específico'} para empresa: ${empresaCodigo}`);
    
    // Filtrar scripts baseado na configuração
    let scriptsToExecute = cascadeScripts;
    
    if (!executeAll && scriptId) {
      // Executar apenas o script específico
      scriptsToExecute = cascadeScripts.filter(script => script.id === scriptId);
      if (scriptsToExecute.length === 0) {
        return NextResponse.json(
          { error: `Script '${scriptId}' não encontrado` },
          { status: 400 }
        );
      }
      console.log(`🎯 Executando apenas o script: ${scriptsToExecute[0].name}`);
    }

    // Executar scripts em sequência
    for (let i = 0; i < scriptsToExecute.length; i++) {
      const script = scriptsToExecute[i];
      const scriptStartTime = Date.now();
      
      console.log(`📋 Executando ${script.name}...`);

      try {
        const fullScriptPath = path.join(process.cwd(), script.path);
        let command;
        
        // Para o script de competências, usar --empresaId em vez de --empresa-codigo
        if (script.id === 'competencias') {
          // Primeiro, encontrar o ID da empresa pelo código
          const { createClient } = require('@supabase/supabase-js');
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: empresas } = await supabase
            .from('empresas')
            .select('id')
            .eq('codigo', empresaCodigo)
            .limit(1);
            
          if (!empresas || empresas.length === 0) {
            throw new Error(`Empresa com código ${empresaCodigo} não encontrada`);
          }
          
          const empresaId = empresas[0].id;
          command = `node "${fullScriptPath}" --empresaId ${empresaId}`;
        } else {
          command = `node "${fullScriptPath}" --empresa-codigo ${empresaCodigo}`;
        }
        
        const { stdout, stderr } = await execAsync(command, {
          timeout: 600000, // 10 minutos por script
          cwd: process.cwd()
        });

        const duration = Date.now() - scriptStartTime;

        results.push({
          scriptId: script.id,
          name: script.name,
          success: true,
          output: stdout,
          error: stderr || null,
          duration,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ ${script.name} concluído em ${duration}ms`);

      } catch (error: any) {
        const duration = Date.now() - scriptStartTime;
        
        console.error(`❌ Erro em ${script.name}:`, error.message);
        
        results.push({
          scriptId: script.id,
          name: script.name,
          success: false,
          output: null,
          error: error.message,
          duration,
          timestamp: new Date().toISOString()
        });

        // Parar execução em caso de erro
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const successfulScripts = results.filter(r => r.success).length;
    const totalScripts = scriptsToExecute.length; // Usar scriptsToExecute em vez de cascadeScripts

    const executionType = executeAll ? 'cascata completa' : `script específico (${scriptId})`;
    console.log(`🎯 ${executionType} finalizada: ${successfulScripts}/${totalScripts} scripts executados com sucesso`);

    return NextResponse.json({
      success: successfulScripts === totalScripts,
      empresaCodigo,
      executionType,
      scriptId: scriptId || 'all',
      results,
      summary: {
        totalScripts,
        successfulScripts,
        failedScripts: totalScripts - successfulScripts,
        totalDuration,
        averageDuration: totalDuration / totalScripts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Erro na execução da cascata:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de execução da cascata Node.js',
    description: 'Executa os 5 scripts de processamento em sequência',
    scripts: [
      'Script 1 - Competências',
      'Script 2 - Tech Specs',
      'Script 3 - RAG Database', 
      'Script 4 - Análise Fluxos',
      'Script 5 - Workflows N8N'
    ]
  });
}