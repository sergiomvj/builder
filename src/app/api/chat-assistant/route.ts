
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
    });

    const { messages, projectId, mode, currentData, confirm_action } = await req.json();


    // Create a new Supabase client for this request context
    const supabase = getSupabase();
    const isMockProject = projectId.startsWith('mock-');

    let project: any = null;
    let empresa: any = null;

    if (!isMockProject) {
      const { data: projectData } = await supabase.from('projects').select('*').eq('id', projectId).single();
      project = projectData;
      const { data: empresaData } = await supabase.from('empresas').select('id').eq('project_id', projectId).single();
      empresa = empresaData;
    } else {
      project = {
        name: 'Mock Project',
        mission: 'Simulated Mission',
        metadata: { workflows: currentData?.workflows || [] }
      };
    }

    // --- EXECUTE CONFIRMED ACTION ---
    if (confirm_action) {
      if (confirm_action.type === 'update_team_structure') {
        const { team } = confirm_action.payload;

        if (isMockProject) {
          return NextResponse.json({
            role: 'assistant',
            content: 'Simulação: Atualizei a estrutura da equipe (Confirmado).',
            action_performed: 'team_updated',
            action_payload: team
          });
        }

        if (!empresa) {
          const { data: newEmpresa, error: createError } = await supabase
            .from('empresas')
            .insert({ project_id: projectId, nome: project.name })
            .select()
            .single();
          if (createError) throw createError;
          empresa = newEmpresa;
        }

        const upsertData = team.map((member: any) => ({
          ...member,
          empresa_id: empresa.id,
          updated_at: new Date().toISOString()
        }));

        await supabase.from('personas').upsert(upsertData);

        // Handle deletions
        if (team.length > 0) {
          const newIds = team.filter((m: any) => m.id).map((m: any) => m.id);
          if (newIds.length > 0) {
            await supabase.from('personas').delete().eq('empresa_id', empresa.id).not('id', 'in', `(${newIds.join(',')})`);
          }
        }

        return NextResponse.json({
          role: 'assistant',
          content: 'Atualizei a estrutura da equipe conforme solicitado.',
          action_performed: 'team_updated'
        });
      }

      if (confirm_action.type === 'update_workflows') {
        const { workflows } = confirm_action.payload;

        if (isMockProject) {
          return NextResponse.json({
            role: 'assistant',
            content: 'Simulação: Atualizei os fluxos de trabalho (Confirmado).',
            action_performed: 'workflows_updated',
            action_payload: workflows
          });
        }

        const updatedMetadata = { ...project.metadata, workflows: workflows };
        await supabase.from('projects').update({ metadata: updatedMetadata }).eq('id', projectId);

        return NextResponse.json({
          role: 'assistant',
          content: 'Atualizei os fluxos de trabalho no plano do projeto.',
          action_performed: 'workflows_updated'
        });
      }
    }

    // --- PREPARE SYSTEM PROMPT & TOOLS ---
    let systemPrompt = '';
    let tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];

    if (mode === 'team') {
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('*').eq('empresa_id', empresa.id)).data : []);
      systemPrompt = `
        You are an expert HR Manager & Organizational Strategist for the project "${project?.name || 'Project'}".
        Current Team Context: ${JSON.stringify(team, null, 2)}
        Project Mission: ${project?.mission || 'Not specified'}
        Your goal is to help the user refine the team structure.
        If the user asks to change the team, you MUST use the "update_team_structure" tool.
        Always reply in Portuguese (Brazil).
      `;
      tools = [{
        type: 'function',
        function: {
          name: 'update_team_structure',
          description: 'Propose updates to the team structure.',
          parameters: {
            type: 'object',
            properties: {
              team: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nome: { type: 'string' },
                    cargo: { type: 'string' },
                    nacionalidade: { type: 'string' },
                    idade: { type: 'number' },
                    perfil_profissional: { type: 'string' },
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
      }];
    } else if (mode === 'workflows') {
      const workflows = currentData?.workflows || project?.metadata?.workflows || [];
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('id, nome, cargo').eq('empresa_id', empresa.id)).data : []);
      systemPrompt = `
        You are an expert Operations & Automation Manager for "${project?.name || 'Project'}".
        Current Workflows: ${JSON.stringify(workflows, null, 2)}
        Available Team Members: ${JSON.stringify(team, null, 2)}
        If the user asks to change workflows, use the "update_workflows" tool.
        Always reply in Portuguese (Brazil).
      `;
      tools = [{
        type: 'function',
        function: {
          name: 'update_workflows',
          description: 'Propose updates to automation workflows.',
          parameters: {
            type: 'object',
            properties: {
              workflows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    task_title: { type: 'string' },
                    task_description: { type: 'string' },
                    status: { type: 'string', enum: ['identified', 'implemented', 'backlog'] },
                    workflow_type: { type: 'string' },
                    estimated_roi: { type: 'string' },
                    assigned_persona_role: { type: 'string' },
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
      }];
    }

    // --- CALL OPENAI ---
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;

    // --- HANDLE PROPOSAL (Do not execute, just return proposal) ---
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      if (toolCall.function.name === 'update_team_structure') {
        return NextResponse.json({
          role: 'assistant',
          content: 'Preparei uma sugestão de atualização da equipe. Por favor, confirme as alterações abaixo.',
          proposal: {
            type: 'update_team_structure',
            payload: args,
            summary: `Atualização de Equipe: ${args.team.length} membros.`
          }
        });
      }

      if (toolCall.function.name === 'update_workflows') {
        return NextResponse.json({
          role: 'assistant',
          content: 'Sugiro as seguintes alterações nos fluxos de trabalho. Por favor, confirme.',
          proposal: {
            type: 'update_workflows',
            payload: args,
            summary: `Atualização de Fluxos: ${args.workflows.length} itens.`
          }
        });
      }
    }

    return NextResponse.json(responseMessage);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
