import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { projectId, systemPrompt, projectContext, teamContext } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 1. Fetch Project & Empresa
    let project;
    let empresa;
    let team;

    if (projectContext && teamContext) {
      console.log('Using provided Project/Team Context (Mock Mode)');
      project = projectContext;
      team = teamContext;
      empresa = { id: 'mock-empresa-' + projectId };
    } else if (projectId.startsWith('mock-project-')) {
      console.log('Using Default MOCK Project data (No context provided)');
      project = { id: projectId, name: 'Mock Project' };
      empresa = { id: 'mock-empresa-' + projectId };
      team = [
        { id: 'mock-p1', nome: 'Alice', cargo: 'CEO', avatar_url: '' },
        { id: 'mock-p2', nome: 'Bob', cargo: 'CTO', avatar_url: '' }
      ];
    } else {
      const { data: dbProject } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (!dbProject) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      project = dbProject;

      const { data: dbEmpresa } = await supabase.from('empresas').select('id').eq('project_id', projectId).single();
      if (!dbEmpresa) return NextResponse.json({ error: 'Company not found (hire team first)' }, { status: 404 });
      empresa = dbEmpresa;

      // 2. Fetch Team
      const { data: dbTeam } = await supabase.from('personas').select('*').eq('empresa_id', empresa.id);
      if (!dbTeam || dbTeam.length === 0) {
        return NextResponse.json({ error: 'Team not found. Please hire the team first.' }, { status: 400 });
      }
      team = dbTeam;
    }

    // 3. Generate Workflows via LLM
    console.log('Generating workflows...');
    const workflowData = await llmService.generateWorkflowSuggestions(project, team, { systemPrompt });
    console.log(`Generated ${workflowData.workflows.length} workflows.`);

    // 4. Insert into automation_opportunities
    const createdWorkflows = [];

    // Mock DB insertion
    if (projectId.startsWith('mock-project-')) {
      for (const wf of workflowData.workflows) {
        createdWorkflows.push({
          id: 'mock-workflow-' + Math.random(),
          task_title: wf.title,
          task_description: wf.description,
          status: 'identified',
          assignee_name: 'Alice'
        });
      }
      return NextResponse.json({
        success: true,
        workflows: createdWorkflows
      });
    }

    for (const wf of workflowData.workflows) {
      // Find assigned persona
      const assignee = team.find((p: any) => p.cargo.includes(wf.assigned_persona_role) || p.cargo === wf.assigned_persona_role) || team[0];

      const { data: opportunity, error: oppError } = await supabase
        .from('automation_opportunities')
        .insert({
          empresa_id: empresa.id,
          persona_id: assignee.id,
          task_title: wf.title,
          task_description: wf.description,
          automation_score: 90, // High confidence
          workflow_type: wf.trigger_type,
          status: 'identified',
          n8n_workflow_id: `mock-n8n-${Date.now()}` // Mock ID for now
        })
        .select()
        .single();

      if (oppError) {
        console.error('Error creating workflow opp:', oppError);
      } else {
        createdWorkflows.push({
          ...opportunity,
          assignee_name: assignee.nome,
          assignee_avatar: assignee.avatar_url
        });
      }
    }

    return NextResponse.json({
      success: true,
      workflows: createdWorkflows
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
