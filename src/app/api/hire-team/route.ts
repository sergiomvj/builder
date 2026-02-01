import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { projectId, systemPrompt, projectContext } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 1. Fetch Project Details
    let project;

    // Check if projectContext was provided by frontend (Mock Mode)
    if (projectContext) {
      console.log('Using provided Project Context (Mock Mode)');
      project = projectContext;
    } else if (projectId.startsWith('mock-project-')) {
      // Fallback if no context provided but is mock ID (should rarely happen with updated frontend)
      console.log('Using Default MOCK Project data (No context provided)');
      project = {
        id: projectId,
        name: 'Mock Project',
        description: 'A mock project for testing purposes',
        mission: 'To test the system',
        vision: 'A working system',
        values: ['Testing', 'Mocking'],
        objectives: ['Verify flow'],
        target_audience: 'Developers',
        revenue_streams: ['None'],
        status: 'planning'
      };
    } else {
      const { data: dbProject, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !dbProject) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      project = dbProject;
    }

    // 2. Check or Create "Empresa" (Company) for this Project
    let empresa;

    if (projectId.startsWith('mock-project-')) {
      empresa = { id: 'mock-empresa-' + projectId };
    } else {
      let { data: dbEmpresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (!dbEmpresa) {
        const { data: newEmpresa, error: createError } = await supabase
          .from('empresas')
          .insert({
            project_id: projectId,
            nome: project.name,
            descricao: project.description,
            setor: 'Technology',
            configuracoes: {
              mission: project.mission,
              vision: project.vision
            }
          })
          .select()
          .single();

        if (createError) throw new Error('Failed to create company record');
        dbEmpresa = newEmpresa;
      }
      empresa = dbEmpresa;
    }

    if (!empresa) {
      throw new Error('Failed to resolve company record');
    }

    // 3. Generate Team Structure via LLM
    console.log('Generating virtual team...');

    // Load custom prompt if not provided in body
    let finalSystemPrompt = systemPrompt;
    if (!finalSystemPrompt) {
      finalSystemPrompt = await llmService.loadPrompt('team-generation', `
            You are an expert HR Manager. Help the user define their team.
        `);
    }

    const teamStructure = await llmService.generateTeamStructure(project, { systemPrompt: finalSystemPrompt });
    console.log(`Generated ${teamStructure.team.length} personas.`);

    // 4. Insert Personas and Skills
    const createdPersonas = [];

    // Mock DB insertion if mock project
    if (projectId.startsWith('mock-project-')) {
      console.log('Skipping DB insertion for mock project');
      for (const member of teamStructure.team) {
        createdPersonas.push({
          id: 'mock-persona-' + Math.random().toString(36).substr(2, 9),
          nome: member.name,
          cargo: member.role,
          descricao_funcao: member.description,
          nivel_senioridade: member.seniority,
          tracos_personalidade: member.personality_traits,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`,
          daily_tasks: member.daily_tasks,
          weekly_task: member.weekly_task
        });
      }

      return NextResponse.json({
        success: true,
        team: createdPersonas
      });
    }

    for (const member of teamStructure.team) {
      // Create Persona
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          empresa_id: empresa.id,
          nome: member.name,
          cargo: member.role,
          descricao_funcao: member.description,
          nivel_senioridade: member.seniority,
          tracos_personalidade: member.personality_traits,
          tipo: 'virtual_assistant',
          status: 'active',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`, // Simple avatar generation
          metadata: {
            daily_tasks: member.daily_tasks || [],
            weekly_task: member.weekly_task || '',
            responsibilities: member.responsibilities || [],
            kpis: member.kpis || [],
            tools: member.tools || [],
            why_this_role: member.why_this_role
          }
        })
        .select()
        .single();

      if (personaError) {
        console.error('Error creating persona:', personaError);
        continue;
      }

      // Create Competencias (Skills)
      const skillsToInsert = member.skills.map((skill: any) => ({
        persona_id: persona.id,
        nome: skill.name,
        tipo: skill.type === 'soft' ? 'soft_skill' : 'tecnica',
        nivel: 'avancado' // Default level if not specified or mapped
      }));

      if (skillsToInsert.length > 0) {
        await supabase.from('competencias').insert(skillsToInsert);
      }

      createdPersonas.push(persona);
    }

    return NextResponse.json({
      success: true,
      team: createdPersonas
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
