import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

interface ScriptStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: string;
  duration?: number;
  output?: string;
  error?: string;
}

// Cache de status dos scripts em memória
const scriptsStatus: ScriptStatus[] = [
  { id: 'competencias', name: '01_generate_competencias.js', status: 'idle' },
  { id: 'techspecs', name: '02_generate_tech_specs.js', status: 'idle' },
  { id: 'rag', name: '03_generate_rag.js', status: 'idle' },
  { id: 'fluxos', name: '04_generate_fluxos_analise.js', status: 'idle' },
  { id: 'workflows', name: '05_generate_workflows_n8n.js', status: 'idle' },
  { id: 'biografia', name: '05_auto_biografia_generator.js', status: 'idle' },
  { id: 'api', name: 'api_bridge.js', status: 'idle' }
];

export async function GET(request: NextRequest) {
  try {
    // Verifica se os arquivos existem e atualiza status
    const baseDir = path.join(process.cwd(), 'AUTOMACAO');
    
    for (const script of scriptsStatus) {
      let scriptPath = '';
      
      // Define o caminho baseado no tipo de script
      if (script.id === 'competencias') {
        scriptPath = path.join(baseDir, '02_PROCESSAMENTO_PERSONAS', script.name);
      } else if (['techspecs', 'rag', 'fluxos', 'workflows'].includes(script.id)) {
        scriptPath = path.join(baseDir, '02_PROCESSAMENTO_PERSONAS', script.name);
      } else if (script.id === 'biografia') {
        scriptPath = path.join(baseDir, '01_SETUP_E_CRIACAO', script.name);
      } else if (script.id === 'api') {
        scriptPath = path.join(process.cwd(), script.name);
      }
      
      try {
        await fs.access(scriptPath);
        // Arquivo existe, mantém status atual ou marca como idle se não estava executando
        if (script.status !== 'running') {
          script.status = 'idle';
        }
      } catch {
        // Arquivo não existe
        script.status = 'error';
        script.error = 'Arquivo não encontrado';
      }
    }

    return NextResponse.json({ 
      success: true, 
      scripts: scriptsStatus 
    });
    
  } catch (error) {
    console.error('Erro ao verificar status dos scripts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, scriptId } = body;

    if (action === 'updateStatus') {
      const script = scriptsStatus.find(s => s.id === scriptId);
      if (script) {
        script.status = body.status;
        script.lastRun = body.lastRun;
        script.duration = body.duration;
        script.output = body.output;
        script.error = body.error;
      }
    }

    return NextResponse.json({ 
      success: true, 
      scripts: scriptsStatus 
    });
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Função helper para atualizar status de um script
export function updateScriptStatus(scriptId: string, status: ScriptStatus['status'], data?: Partial<ScriptStatus>) {
  const script = scriptsStatus.find(s => s.id === scriptId);
  if (script) {
    script.status = status;
    if (data) {
      Object.assign(script, data);
    }
  }
}