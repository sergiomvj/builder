import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const personaId = searchParams.get('personaId');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se personaId específica, retornar só dela
    if (personaId) {
      const status = await getPersonaElementsStatus(supabase, personaId);
      return NextResponse.json({ [personaId]: status });
    }

    // Se empresaId, buscar todas personas da empresa
    let personasQuery = supabase
      .from('personas')
      .select('id, empresa_id');

    if (empresaId) {
      personasQuery = personasQuery.eq('empresa_id', empresaId);
    }

    const { data: personas, error: personasError } = await personasQuery;

    if (personasError) {
      console.error('Erro ao buscar personas:', personasError);
      return NextResponse.json(
        { error: 'Erro ao buscar personas' },
        { status: 500 }
      );
    }

    if (!personas || personas.length === 0) {
      return NextResponse.json({});
    }

    // Buscar status de todas as personas em paralelo
    const personaIds = personas.map(p => p.id);
    const statusMap: Record<string, any> = {};

    // Buscar dados das tabelas normalizadas em paralelo
    const [
      biografiasResult,
      atribuicoesResult,
      competenciasResult,
      avataresResult,
      automationResult,
      workflowsResult,
      mlModelsResult,
      auditoriaResult
    ] = await Promise.all([
      supabase.from('personas_biografias').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_atribuicoes').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_competencias').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_avatares').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_automation_opportunities').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_workflows').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_machine_learning').select('persona_id').in('persona_id', personaIds),
      supabase.from('personas_auditorias').select('persona_id').in('persona_id', personaIds)
    ]);

    // Criar sets para verificação rápida
    const biografiasSet = new Set(biografiasResult.data?.map(b => b.persona_id) || []);
    const atribuicoesSet = new Set(atribuicoesResult.data?.map(a => a.persona_id) || []);
    const competenciasSet = new Set(competenciasResult.data?.map(c => c.persona_id) || []);
    const avataresSet = new Set(avataresResult.data?.map(a => a.persona_id) || []);
    const automationSet = new Set(automationResult.data?.map(a => a.persona_id) || []);
    const workflowsSet = new Set(workflowsResult.data?.map(w => w.persona_id) || []);
    const mlModelsSet = new Set(mlModelsResult.data?.map(m => m.persona_id) || []);
    const auditoriaSet = new Set(auditoriaResult.data?.map(a => a.persona_id) || []);

    // Buscar personas completas para verificar email e system_prompt
    const { data: personasCompletas } = await supabase
      .from('personas')
      .select('id, email, system_prompt')
      .in('id', personaIds);

    const personasMap = new Map(personasCompletas?.map(p => [p.id, p]) || []);

    // Montar status para cada persona
    for (const persona of personas) {
      const personaData = personasMap.get(persona.id);
      
      statusMap[persona.id] = {
        placeholders: true, // Se está na tabela, foi criada
        biografias: biografiasSet.has(persona.id),
        atribuicoes: atribuicoesSet.has(persona.id),
        competencias: competenciasSet.has(persona.id),
        avatares: avataresSet.has(persona.id),
        automation: automationSet.has(persona.id),
        workflows: workflowsSet.has(persona.id),
        ml_models: mlModelsSet.has(persona.id),
        auditoria: auditoriaSet.has(persona.id),
        contato: Boolean(personaData?.email),
        system_prompt: Boolean(personaData?.system_prompt)
      };
    }

    return NextResponse.json(statusMap);
  } catch (error: any) {
    console.error('Erro ao buscar status dos elementos:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

async function getPersonaElementsStatus(supabase: any, personaId: string) {
  const [
    biografiasResult,
    atribuicoesResult,
    competenciasResult,
    avataresResult,
    automationResult,
    workflowsResult,
    mlModelsResult,
    auditoriaResult,
    personaResult
  ] = await Promise.all([
    supabase.from('personas_biografias').select('persona_id').eq('persona_id', personaId).single(),
    supabase.from('personas_atribuicoes').select('persona_id').eq('persona_id', personaId).limit(1),
    supabase.from('personas_competencias').select('persona_id').eq('persona_id', personaId).single(),
    supabase.from('personas_avatares').select('persona_id').eq('persona_id', personaId).limit(1),
    supabase.from('personas_automation_opportunities').select('persona_id').eq('persona_id', personaId).limit(1),
    supabase.from('personas_workflows').select('persona_id').eq('persona_id', personaId).limit(1),
    supabase.from('personas_machine_learning').select('persona_id').eq('persona_id', personaId).single(),
    supabase.from('personas_auditorias').select('persona_id').eq('persona_id', personaId).limit(1),
    supabase.from('personas').select('id, email, system_prompt').eq('id', personaId).single()
  ]);

  return {
    placeholders: true,
    biografias: Boolean(biografiasResult.data),
    atribuicoes: Boolean(atribuicoesResult.data && atribuicoesResult.data.length > 0),
    competencias: Boolean(competenciasResult.data),
    avatares: Boolean(avataresResult.data && avataresResult.data.length > 0),
    automation: Boolean(automationResult.data && automationResult.data.length > 0),
    workflows: Boolean(workflowsResult.data && workflowsResult.data.length > 0),
    ml_models: Boolean(mlModelsResult.data),
    auditoria: Boolean(auditoriaResult.data && auditoriaResult.data.length > 0),
    contato: Boolean(personaResult.data?.email),
    system_prompt: Boolean(personaResult.data?.system_prompt)
  };
}
