import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

console.log('Analyze Idea Route Module Loaded');

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { idea, systemPrompt } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Idea description is required' },
        { status: 400 }
      );
    }

    // 1. Analyze the idea using LLM (prioritizing OpenRouter)
    console.log('Analyzing idea via LLM...');
    const analysis = await llmService.analyzeIdea(idea, { systemPrompt });
    console.log('Analysis complete:', analysis.project_name);

    // 2. Create the Idea record
    let ideaId = null;
    let projectId = null;
    let dbError = null;

    // Debugging Supabase Key usage (safe log, don't log full key)
    const isServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ');
    console.log('Using Service Role Key:', isServiceKey);

    const { data: ideaRecord, error: ideaError } = await supabase
      .from('ideas')
      .insert({
        title: analysis.project_name,
        description: idea,
        status: 'approved', // Auto-approve for MVP
        analysis_result: analysis
      })
      .select()
      .single();

    if (ideaError) {
      console.error('Error saving idea (DB):', ideaError);

      const isRlsError = ideaError.code === '42501'; // permission denied for table
      const isAuthError = ideaError.message?.includes('Invalid API key');

      let errorMessage = `Failed to save idea to database: ${ideaError.message}`;
      if (isAuthError) {
        errorMessage = 'Erro de Autenticação Supabase: A chave fornecida no .env não corresponde ao URL do projeto ou é inválida.';
      } else if (isRlsError && !isServiceKey) {
        errorMessage = 'Database permission denied (RLS). SUPABASE_SERVICE_ROLE_KEY válida é necessária ou desabilite o RLS nas tabelas ideas/projects.';
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: ideaError.message,
          code: ideaError.code,
          hint: 'Verifique se a Service Role Key no seu .env corresponde ao projeto atual no dashboard do Supabase.',
          usingServiceKey: isServiceKey
        },
        { status: 500 }
      );
    } else {
      ideaId = ideaRecord.id;

      // 3. Create the Project record (only if idea saved)
      const { data: projectRecord, error: projectError } = await supabase
        .from('projects')
        .insert({
          idea_id: ideaRecord.id,
          name: analysis.project_name,
          description: ideaRecord.description,
          mission: analysis.mission,
          vision: analysis.vision,
          values: analysis.values,
          objectives: analysis.objectives,
          target_audience: analysis.target_audience,
          revenue_streams: analysis.revenue_streams,
          status: 'planning',
          metadata: {
            core_functions: analysis.core_functions,
            suggested_departments: analysis.suggested_departments,
            // V3 Expanded Data
            swot: analysis.swot,
            roadmap: analysis.roadmap,
            backlog_preview: analysis.backlog_preview,
            business_potential_diagnosis: analysis.business_potential_diagnosis,
            marketing_strategy: analysis.marketing_strategy,
            lead_generation_strategy: analysis.lead_generation_strategy,
            systems_and_modules: analysis.systems_and_modules,
            executive_summary: analysis.executive_summary,
            key_metrics: analysis.key_metrics,
            risks_and_gaps: analysis.risks_and_gaps,
            improvement_suggestions: analysis.improvement_suggestions
          }
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        dbError = projectError.message;

        return NextResponse.json(
          { error: 'Failed to save project to database', details: dbError },
          { status: 500 }
        );
      } else {
        projectId = projectRecord.id;
      }
    }

    return NextResponse.json({
      success: true,
      projectId: projectId,
      ideaId: ideaId,
      analysis: analysis,
      warning: dbError ? `Database save failed: ${dbError}` : null
    });

  } catch (error: any) {
    console.error('Error in analyze-idea:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
