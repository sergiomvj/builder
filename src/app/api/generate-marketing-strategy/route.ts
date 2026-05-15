import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { projectId, wizardAnswers } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // 1. Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Check for existing strategy and update status
    const { data: existingStrategy } = await supabase
      .from('marketing_strategies')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existingStrategy) {
      await supabase
        .from('marketing_strategies')
        .update({ status: 'generating', wizard_answers: wizardAnswers || {} })
        .eq('id', existingStrategy.id);
    } else {
      await supabase
        .from('marketing_strategies')
        .insert({
          project_id: projectId,
          wizard_answers: wizardAnswers || {},
          status: 'generating',
        });
    }

    // 3. Generate strategy via LLM
    let strategy;
    try {
      strategy = await llmService.generateMarketingStrategy(project, wizardAnswers);
    } catch (llmError: any) {
      // Update status to draft on failure
      await supabase
        .from('marketing_strategies')
        .update({ status: 'draft' })
        .eq('project_id', projectId);

      return NextResponse.json(
        { error: 'LLM generation failed', details: llmError.message },
        { status: 500 }
      );
    }

    // 4. Save the generated strategy
    const { data: savedStrategy, error: saveError } = await supabase
      .from('marketing_strategies')
      .upsert(
        {
          project_id: projectId,
          wizard_answers: wizardAnswers || {},
          strategy_data: strategy,
          versao: strategy?.estrategia_central_marketing?.versao || '1.0',
          status: 'generated',
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id' }
      )
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save marketing strategy:', saveError);
      return NextResponse.json(
        { error: 'Failed to save strategy', details: saveError.message, strategy },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      strategyId: savedStrategy.id,
      strategy: strategy,
    });

  } catch (err: any) {
    console.error('Marketing strategy generation error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('marketing_strategies')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ strategy: data || null });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
