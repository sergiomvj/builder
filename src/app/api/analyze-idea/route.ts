import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

// DEBUG LOGGING
const logPath = path.join(process.cwd(), 'api_debug.log');
const debugLog = (msg: string, data?: any) => {
  const timestamp = new Date().toISOString();
  let dataStr = '';
  if (data instanceof Error) {
    dataStr = `ERROR: ${data.message}\nSTACK: ${data.stack}`;
  } else if (data) {
    dataStr = JSON.stringify(data, null, 2);
  }
  const logMsg = `${timestamp}: ${msg} ${dataStr}\n`;
  try {
    fs.appendFileSync(logPath, logMsg);
  } catch (e) {
    console.error('Failed to write to log file', e);
  }
};

export async function POST(req: NextRequest) {
  debugLog('--- REQUEST RECEIVED ---');
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { idea, systemPrompt } = body;
    debugLog('Body parsed', { ideaLength: idea?.length, hasPrompt: !!systemPrompt });

    if (!idea || typeof idea !== 'string') {
      debugLog('Invalid input');
      return NextResponse.json({ error: 'Idea description is required' }, { status: 400 });
    }

    // 1. Analyze
    debugLog('Calling LLM Service...');
    const analysis = await llmService.analyzeIdea(idea, { systemPrompt });
    debugLog('LLM Analysis Complete', { projectName: analysis.project_name });

    // 2. Create Idea
    let ideaId = null;
    let projectId = null;
    let dbError = null;

    // Mapping setup
    const meta = analysis.project_metadata || {};
    const strategy = analysis.strategic_foundation || {};
    const product = analysis.product_strategy || {};
    const safeTitle = meta.project_name || analysis.project_name || 'Novo Projeto';

    debugLog('Ready to insert Idea', { safeTitle });

    // Ensure consistency
    if (!analysis.project_metadata) analysis.project_metadata = {};
    analysis.project_metadata.project_name = safeTitle;

    // Idea Insert
    const { data: ideaRecord, error: ideaError } = await supabase
      .from('ideas')
      .insert({
        title: safeTitle,
        description: idea,
        status: 'approved',
        analysis_result: analysis
      })
      .select()
      .single();

    if (ideaError) {
      debugLog('Idea Insert Failed', ideaError);
      throw new Error(`Idea Insert Failed: ${ideaError.message}`);
    }

    debugLog('Idea Created', { id: ideaRecord.id });
    ideaId = ideaRecord.id;

    // 3. Create Project
    try {
      const payload = {
        idea_id: ideaRecord.id,
        name: safeTitle,
        description: meta.tagline || ideaRecord.description,
        mission: strategy.mission || '',
        vision: strategy.vision || '',
        values: strategy.core_values?.map((v: any) => v.value || v) || [],
        objectives: [],
        target_audience: 'TBD',
        revenue_streams: [],
        status: 'planning',
        metadata: analysis,
        executive_summary: analysis.executive_summary
      };

      debugLog('Inserting Project', payload);

      const { data: projectRecord, error: projectError } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();

      if (projectError) {
        debugLog('Project Insert Failed', projectError);
        dbError = projectError.message;
      } else {
        debugLog('Project Created', { id: projectRecord.id });
        projectId = projectRecord.id;
      }

    } catch (mapErr: any) {
      debugLog('Mapping/Project Error', mapErr);
      throw mapErr;
    }

    return NextResponse.json({
      success: true,
      projectId,
      ideaId,
      analysis,
      warning: dbError
    });

  } catch (err: any) {
    debugLog('CRITICAL ROUTE ERROR', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
