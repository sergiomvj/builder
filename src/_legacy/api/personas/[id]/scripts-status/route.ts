import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ScriptStatus {
  script: string;
  order: number;
  name: string;
  description: string;
  status: 'completed' | 'pending' | 'error';
  timestamp?: string;
  dataCount?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personaId = params.id;

    if (!personaId) {
      return NextResponse.json(
        { error: 'Persona ID não fornecido' },
        { status: 400 }
      );
    }

    // Buscar persona
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      return NextResponse.json(
        { error: 'Persona não encontrada' },
        { status: 404 }
      );
    }

    const scriptsStatus: ScriptStatus[] = [];

    // Script 01: Placeholders
    const script01Status: ScriptStatus = {
      script: '01',
      order: 1,
      name: 'Placeholders',
      description: 'Criação de placeholders com cargos',
      status: 'pending',
    };

    if (persona.role && persona.department && persona.nacionalidade) {
      script01Status.status = 'completed';
      script01Status.timestamp = persona.created_at;
    }

    scriptsStatus.push(script01Status);

    // Script 02: Biografias + Dados
    const script02Status: ScriptStatus = {
      script: '02',
      order: 2,
      name: 'Biografias + Dados',
      description: 'Nome, email, experiência, biografia',
      status: 'pending',
    };

    const { data: biografia } = await supabase
      .from('personas_biografias')
      .select('created_at')
      .eq('persona_id', personaId)
      .single();

    if (
      persona.full_name &&
      persona.email &&
      persona.genero &&
      persona.experiencia_anos &&
      biografia
    ) {
      script02Status.status = 'completed';
      script02Status.timestamp = biografia.created_at;
    } else if (persona.full_name || persona.email) {
      script02Status.status = 'error';
    }

    scriptsStatus.push(script02Status);

    // Script 03: Atribuições
    const script03Status: ScriptStatus = {
      script: '03',
      order: 3,
      name: 'Atribuições',
      description: 'Responsabilidades contextualizadas',
      status: 'pending',
    };

    const { data: atribuicoes, count: atribuicoesCount } = await supabase
      .from('personas_atribuicoes')
      .select('created_at', { count: 'exact' })
      .eq('persona_id', personaId);

    if (atribuicoes && atribuicoes.length > 0) {
      script03Status.status = 'completed';
      script03Status.timestamp = atribuicoes[0].created_at;
      script03Status.dataCount = atribuicoesCount || 0;
    }

    scriptsStatus.push(script03Status);

    // Script 04: Competências + Metas
    const script04Status: ScriptStatus = {
      script: '04',
      order: 4,
      name: 'Competências + Metas',
      description: 'Habilidades, tarefas, KPIs, objetivos',
      status: 'pending',
    };

    const { data: competencias } = await supabase
      .from('personas_competencias')
      .select('created_at')
      .eq('persona_id', personaId)
      .single();

    if (competencias) {
      script04Status.status = 'completed';
      script04Status.timestamp = competencias.created_at;
    }

    scriptsStatus.push(script04Status);

    // Script 05: Avatares
    const script05Status: ScriptStatus = {
      script: '05',
      order: 5,
      name: 'Avatares',
      description: 'Aparência física e biometria',
      status: 'pending',
    };

    const { data: avatar } = await supabase
      .from('personas_avatares')
      .select('created_at')
      .eq('persona_id', personaId)
      .single();

    if (avatar) {
      script05Status.status = 'completed';
      script05Status.timestamp = avatar.created_at;
    }

    scriptsStatus.push(script05Status);

    // Script 06: Análise de Automação
    const script06Status: ScriptStatus = {
      script: '06',
      order: 6,
      name: 'Análise Automação',
      description: 'Oportunidades de automação',
      status: 'pending',
    };

    const { data: automations, count: automationsCount } = await supabase
      .from('personas_automation_opportunities')
      .select('created_at', { count: 'exact' })
      .eq('persona_id', personaId);

    if (automations && automations.length > 0) {
      script06Status.status = 'completed';
      script06Status.timestamp = automations[0].created_at;
      script06Status.dataCount = automationsCount || 0;
    }

    scriptsStatus.push(script06Status);

    // Script 07: Workflows N8N
    const script07Status: ScriptStatus = {
      script: '07',
      order: 7,
      name: 'Workflows N8N',
      description: 'Workflows executáveis',
      status: 'pending',
    };

    const { data: workflows, count: workflowsCount } = await supabase
      .from('personas_workflows')
      .select('created_at', { count: 'exact' })
      .eq('persona_id', personaId);

    if (workflows && workflows.length > 0) {
      script07Status.status = 'completed';
      script07Status.timestamp = workflows[0].created_at;
      script07Status.dataCount = workflowsCount || 0;
    }

    scriptsStatus.push(script07Status);

    // Script 08: Machine Learning
    const script08Status: ScriptStatus = {
      script: '08',
      order: 8,
      name: 'Machine Learning',
      description: 'Modelo de predição',
      status: 'pending',
    };

    const { data: mlModel } = await supabase
      .from('personas_machine_learning')
      .select('last_trained_at')
      .eq('persona_id', personaId)
      .single();

    if (mlModel) {
      script08Status.status = 'completed';
      script08Status.timestamp = mlModel.last_trained_at;
    }

    scriptsStatus.push(script08Status);

    // Script 09: Auditoria
    const script09Status: ScriptStatus = {
      script: '09',
      order: 9,
      name: 'Auditoria',
      description: 'Validação de qualidade',
      status: 'pending',
    };

    const { data: audit } = await supabase
      .from('personas_auditorias')
      .select('audit_date, quality_score')
      .eq('persona_id', personaId)
      .order('audit_date', { ascending: false })
      .limit(1)
      .single();

    if (audit) {
      script09Status.status = 'completed';
      script09Status.timestamp = audit.audit_date;
      script09Status.dataCount = audit.quality_score; // Quality score como count
    }

    scriptsStatus.push(script09Status);

    return NextResponse.json({
      persona_id: personaId,
      persona_name: persona.full_name || 'Nome não definido',
      scripts: scriptsStatus,
      summary: {
        total: scriptsStatus.length,
        completed: scriptsStatus.filter(s => s.status === 'completed').length,
        pending: scriptsStatus.filter(s => s.status === 'pending').length,
        error: scriptsStatus.filter(s => s.status === 'error').length,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar status dos scripts:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status dos scripts', details: error.message },
      { status: 500 }
    );
  }
}
