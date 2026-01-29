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
            core_functions: analysis.core_functions, // Legacy support if needed
            suggested_departments: analysis.suggested_departments, // Legacy support if needed

            // V3 Data
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
        };

        const { error: updateError } = await supabase
            .from('projects')
            .update({
                description: newDescription, // Update the genesis
                name: analysis.project_name, // Update name if it changed (optional, maybe keep original?) -> user asked to reevaluate, usually implies new direction. Let's update.
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
