import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await req.json();
        const { projectId, newDescription } = body;

        if (!projectId || !newDescription) {
            return NextResponse.json({ error: 'Project ID and Description are required' }, { status: 400 });
        }

        console.log(`[Reevaluate] Project: ${projectId}`);

        // 1. Re-analyze with LLM
        const analysis = await llmService.analyzeIdea(newDescription); // Uses default system prompt which is now updated
        console.log('Re-analysis complete:', analysis.project_name);

        // 2. Update Project Record
        // We update fields and merge metadata
        const { data: currentProject, error: fetchError } = await supabase
            .from('projects')
            .select('metadata')
            .eq('id', projectId)
            .single();

        if (fetchError) throw fetchError;

        const updatedMetadata = {
            ...currentProject.metadata,
            // Overwrite with new analysis data
            swot: analysis.swot,
            
            // Correct mapping for execution_plan
            roadmap: analysis.execution_plan.roadmap,
            backlog_preview: analysis.execution_plan.backlog_preview,
            systems_and_modules: analysis.execution_plan.systems_breakdown,
            
            business_potential_diagnosis: analysis.business_diagnosis, // Keep legacy key if needed
            business_diagnosis: analysis.business_diagnosis,
            marketing_strategy: analysis.marketing_strategy,
            lead_generation_strategy: analysis.lead_generation_strategy,
            executive_summary: analysis.executive_summary,
            key_metrics: analysis.key_metrics,
            risks_and_gaps: analysis.risks_and_gaps, // Legacy
            risks: analysis.risks,
            improvement_suggestions: analysis.potential_improvements,
            
            viability_score: analysis.viability_score,
            why_not_100: analysis.why_not_100,
            why_now: analysis.why_now
        };

        const { error: updateError } = await supabase
            .from('projects')
            .update({
                description: newDescription,
                name: analysis.project_name,
                mission: analysis.mission,
                vision: analysis.vision,
                values: analysis.values,
                target_audience: analysis.target_audience,
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in reevaluate-project:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
