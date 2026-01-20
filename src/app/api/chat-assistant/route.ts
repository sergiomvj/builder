
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, mode, currentData } = await req.json();
    
    // Create a new Supabase client for this request context to ensure fresh auth/connection
    const supabase = getSupabase();

    const isMockProject = projectId.startsWith('mock-');
    
    let project: any = null;
    let empresa: any = null;

    if (!isMockProject) {
        // 1. Fetch Context from DB if real project
        const { data: projectData } = await supabase.from('projects').select('*').eq('id', projectId).single();
        project = projectData;
        
        // Get Company ID (Empresa)
        const { data: empresaData } = await supabase.from('empresas').select('id').eq('project_id', projectId).single();
        empresa = empresaData;
    } else {
        // Mock Project Context
        project = {
            name: 'Mock Project',
            mission: 'Simulated Mission',
            metadata: { workflows: currentData?.workflows || [] }
        };
    }

    // Prepare System Prompt Context
    let systemPrompt = '';
    let tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];

    if (mode === 'team') {
      // Use provided currentData (preferred for latest state) or fetch from DB
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('*').eq('empresa_id', empresa.id)).data : []);
      
      systemPrompt = `
        You are an expert HR Manager & Organizational Strategist for the project "${project?.name || 'Project'}".
        
        Current Team Context:
        ${JSON.stringify(team, null, 2)}
        
        Project Mission: ${project?.mission || 'Not specified'}
        
        Your goal is to help the user refine the team structure. You can add, remove, or update team members based on the conversation.
        
        If the user asks to change the team (e.g., "Hire a CTO", "Change Alice's role", "Remove Bob"), you MUST use the "update_team_structure" tool.
        
        Always reply in Portuguese (Brazil).
        Be professional, strategic, and helpful.
      `;

      tools = [
        {
          type: 'function',
          function: {
            name: 'update_team_structure',
            description: 'Updates the entire team structure. Use this to add, remove, or modify members.',
            parameters: {
              type: 'object',
              properties: {
                team: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'Keep existing ID if updating, or omit for new member' },
                      nome: { type: 'string' },
                      cargo: { type: 'string' },
                      descricao_funcao: { type: 'string' },
                      nivel_senioridade: { type: 'string' },
                      responsibilities: { type: 'array', items: { type: 'string' } },
                      kpis: { type: 'array', items: { type: 'string' } },
                      tracos_personalidade: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['nome', 'cargo', 'descricao_funcao']
                  }
                }
              },
              required: ['team']
            }
          }
        }
      ];

    } else if (mode === 'workflows') {
      const workflows = currentData?.workflows || project?.metadata?.workflows || [];
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('id, nome, cargo').eq('empresa_id', empresa.id)).data : []);
      
      systemPrompt = `
        You are an expert Operations & Automation Manager for "${project?.name || 'Project'}".
        
        Current Workflows:
        ${JSON.stringify(workflows, null, 2)}
        
        Available Team Members:
        ${JSON.stringify(team, null, 2)}
        
        Your goal is to optimize workflows. You can create, edit, or delete automation opportunities.
        
        If the user asks to change workflows, use the "update_workflows" tool.
        
        Always reply in Portuguese (Brazil).
      `;

      tools = [
        {
          type: 'function',
          function: {
            name: 'update_workflows',
            description: 'Updates the list of automation workflows.',
            parameters: {
              type: 'object',
              properties: {
                workflows: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'Keep existing ID if updating' },
                      task_title: { type: 'string' },
                      task_description: { type: 'string' },
                      status: { type: 'string', enum: ['identified', 'implemented', 'backlog'] },
                      workflow_type: { type: 'string' },
                      estimated_roi: { type: 'string' },
                      assigned_persona_role: { type: 'string', description: 'Name or Role of the team member assigned to this workflow' },
                      tools_involved: { type: 'array', items: { type: 'string' } },
                      steps: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['task_title', 'task_description']
                  }
                }
              },
              required: ['workflows']
            }
          }
        }
      ];
    }

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;

    // Handle Tool Calls
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      
      if (toolCall.function.name === 'update_team_structure') {
        const { team } = JSON.parse(toolCall.function.arguments);
        
        if (isMockProject) {
            return NextResponse.json({ 
                role: 'assistant', 
                content: 'Simulação: Atualizei a estrutura da equipe.',
                action_performed: 'team_updated',
                action_payload: team 
            });
        }

        // Real Project DB Updates
        if (!empresa) {
            // Create Empresa if missing
            const { data: newEmpresa, error: createError } = await supabase
                .from('empresas')
                .insert({ project_id: projectId, nome: project.name })
                .select()
                .single();
            
            if (createError) throw createError;
            empresa = newEmpresa;
        }

        // Upsert provided members
        const upsertData = team.map((member: any) => ({
           ...member,
           empresa_id: empresa.id,
           updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase.from('personas').upsert(upsertData).select();
        
        if (error) console.error('Error updating team:', error);

        // Delete removed members
        if (team.length > 0) {
            const newIds = team.filter((m: any) => m.id).map((m: any) => m.id);
            if (newIds.length > 0) {
                await supabase.from('personas').delete().eq('empresa_id', empresa.id).not('id', 'in', `(${newIds.join(',')})`);
            }
        }

        return NextResponse.json({ 
          role: 'assistant', 
          content: 'Atualizei a estrutura da equipe conforme solicitado. Verifique as alterações no painel.',
          action_performed: 'team_updated'
        });
      }

      if (toolCall.function.name === 'update_workflows') {
        const { workflows } = JSON.parse(toolCall.function.arguments);
        
        if (isMockProject) {
            return NextResponse.json({ 
                role: 'assistant', 
                content: 'Simulação: Atualizei os fluxos de trabalho.',
                action_performed: 'workflows_updated',
                action_payload: workflows
            });
        }

        // Save to Project Metadata
        const updatedMetadata = {
            ...project.metadata,
            workflows: workflows
        };
        
        const { error } = await supabase
            .from('projects')
            .update({ metadata: updatedMetadata })
            .eq('id', projectId);

        if (error) {
            console.error('Error updating workflows:', error);
            throw error;
        }

        return NextResponse.json({
          role: 'assistant',
          content: 'Atualizei os fluxos de trabalho no plano do projeto.',
          action_performed: 'workflows_updated'
        });
      }
    }

    return NextResponse.json(responseMessage);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
