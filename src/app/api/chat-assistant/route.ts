
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

interface ChatLogEntry {
  project_id: string;
  mode: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposal?: any;
  confirmed?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
    });

    const { messages, projectId, mode, currentData, confirm_action } = await req.json();

    // Create a new Supabase client for this request context
    const supabase = getSupabase();
    const isMockProject = projectId.startsWith('mock-');

    // --- EXECUTE CONFIRMED ACTION ---
    if (confirm_action) {
      if (confirm_action.type === 'update_team_structure') {
        const { team } = confirm_action.payload;

        if (isMockProject) {
          await persistLog(supabase, {
            project_id: projectId, mode, role: 'assistant',
            content: 'Simulação: Atualizei a estrutura da equipe (Confirmado).',
            confirmed: true
          });

          return NextResponse.json({
            role: 'assistant',
            content: 'Simulação: Atualizei a estrutura da equipe (Confirmado).',
            action_performed: 'team_updated',
            action_payload: team
          });
        }

        // Get Empresa
        let empresaId = null;
        const { data: empresaData } = await supabase.from('empresas').select('id').eq('project_id', projectId).single();
        if (!empresaData) {
          const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single();
          const { data: newEmpresa, error: createError } = await supabase
            .from('empresas')
            .insert({ project_id: projectId, nome: project?.name || 'New Company' })
            .select()
            .single();
          if (createError) throw createError;
          empresaId = newEmpresa.id;
        } else {
          empresaId = empresaData.id;
        }

        const upsertData = team.map((member: any) => ({
          id: member.id && member.id.length > 10 ? member.id : undefined, // Keep ID if valid UUID (simple check)
          empresa_id: empresaId,
          nome: member.nome || member.name,
          cargo: member.cargo || member.role,
          descricao_funcao: member.descricao_funcao || member.description,
          nivel_senioridade: member.nivel_senioridade || member.seniority || 'Sênior',
          tracos_personalidade: member.tracos_personalidade || member.personality_traits,
          tipo: 'virtual_assistant',
          status: 'active',
          avatar_url: member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.nome || member.name)}`,
          updated_at: new Date().toISOString(),
          // Store new extended fields in metadata
          metadata: {
            daily_tasks: member.daily_tasks || [],
            weekly_task: member.weekly_task || '',
            responsibilities: member.responsibilities || [],
            kpis: member.kpis || [],
            tools: member.tools || []
          }
        }));

        const { error: upsertError } = await supabase.from('personas').upsert(upsertData);
        if (upsertError) throw upsertError;

        const responseContent = 'Atualizei a estrutura da equipe conforme solicitado.';
        await persistLog(supabase, {
          project_id: projectId, mode, role: 'assistant',
          content: responseContent,
          confirmed: true
        });

        return NextResponse.json({
          role: 'assistant',
          content: responseContent,
          action_performed: 'team_updated'
        });
      }

      if (confirm_action.type === 'update_workflows') {
        const { workflows } = confirm_action.payload;

        if (isMockProject) {
          await persistLog(supabase, {
            project_id: projectId, mode, role: 'assistant',
            content: 'Simulação: Atualizei os fluxos de trabalho (Confirmado).',
            confirmed: true
          });
          return NextResponse.json({
            role: 'assistant',
            content: 'Simulação: Atualizei os fluxos de trabalho (Confirmado).',
            action_performed: 'workflows_updated',
            action_payload: workflows
          });
        }

        // Merge logic
        const { data: project } = await supabase.from('projects').select('metadata').eq('id', projectId).single();

        let existingWorkflows = project?.metadata?.workflows || [];
        if (!Array.isArray(existingWorkflows)) existingWorkflows = [];

        const mergedWorkflows = [...existingWorkflows];

        workflows.forEach((newWf: any) => {
          // Simple dedupe by title if no ID
          const index = mergedWorkflows.findIndex((w: any) => (w.id && w.id === newWf.id) || w.task_title === newWf.task_title || w.title === newWf.title);
          if (index >= 0) {
            mergedWorkflows[index] = { ...mergedWorkflows[index], ...newWf };
          } else {
            mergedWorkflows.push({ ...newWf, id: newWf.id || crypto.randomUUID() });
          }
        });

        const updatedMetadata = { ...project?.metadata, workflows: mergedWorkflows };

        const { error: updateError } = await supabase.from('projects').update({ metadata: updatedMetadata }).eq('id', projectId);

        if (updateError) throw updateError;

        const responseContent = 'Atualizei os fluxos de trabalho no plano do projeto.';
        await persistLog(supabase, {
          project_id: projectId, mode, role: 'assistant',
          content: responseContent,
          confirmed: true
        });

        return NextResponse.json({
          role: 'assistant',
          content: responseContent,
          action_performed: 'workflows_updated'
        });
      }
    }


    // --- PERSIST USER MESSAGE ---
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'user') {
        await persistLog(supabase, {
          project_id: projectId, mode, role: 'user', content: lastMsg.content
        });
      }
    }

    // --- FETCH PROJECT CONTEXT ---
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

    // --- PREPARE SYSTEM PROMPT & TOOLS ---

    // Load prompts dynamically via LLMService to respect user configuration
    // We import the instance to use its loading logic
    const { llmService } = await import('@/lib/llm-service');

    let systemPrompt = '';
    let tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];

    const contextSummary = typeof project?.executive_summary === 'string'
      ? project.executive_summary
      : (project?.executive_summary?.content || project?.description || 'No description available');

    if (mode === 'team') {
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('*').eq('empresa_id', empresa.id)).data : []);

      // Load custom prompt
      const basePrompt = await llmService.loadPrompt('team-generation', `
        You are an expert HR Manager. Help the user define their team.
        Project: ${project?.name}
        Mission: ${project?.mission}
      `);

      systemPrompt = `
        ${basePrompt}
        
        ---
        CURRENT CONTEXT:
        Project: ${project?.name}
        Description: ${contextSummary}
        
        Existing Team: ${JSON.stringify(team, null, 2)}
        
        Using the "update_team_structure" tool is the ONLY way to change the team.
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
                    name: { type: 'string' },
                    role: { type: 'string' },
                    seniority: { type: 'string' },
                    description: { type: 'string' },
                    personality_traits: { type: 'array', items: { type: 'string' } },
                    skills: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, level: { type: 'string' } } } },
                    responsibilities: { type: 'array', items: { type: 'string' } },
                    kpis: { type: 'array', items: { type: 'string' } },
                    tools: { type: 'array', items: { type: 'string' } },
                    daily_tasks: { type: 'array', items: { type: 'string' }, description: '2 daily mandatory tasks' },
                    weekly_task: { type: 'string', description: '1 weekly mandatory task' },
                    why_this_role: { type: 'string' }
                  },
                  required: ['name', 'role', 'description', 'daily_tasks', 'weekly_task']
                }
              }
            },
            required: ['team']
          }
        }
      }];

    } else if (mode === 'workflows') {
      const workflows = currentData?.workflows || project?.metadata?.workflows || [];
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('*').eq('empresa_id', empresa.id)).data : []);

      // Load custom prompt
      const basePrompt = await llmService.loadPrompt('workflow-generation', `
        You are an Automation Expert. Create workflows for this project.
      `);

      systemPrompt = `
        ${basePrompt}
        
        ---
        CURRENT CONTEXT:
        Project: ${project?.name}
        Description: ${contextSummary}
        
        Current Workflows: ${JSON.stringify(workflows, null, 2)}
        Available Team & Tasks: ${JSON.stringify(team, null, 2)}
        
        Use "update_workflows" to suggest changes.
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
                    title: { type: 'string' },
                    description: { type: 'string' },
                    trigger_type: { type: 'string' },
                    trigger_details: { type: 'string' },
                    actions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { step: { type: 'number' }, action: { type: 'string' }, tool: { type: 'string' }, details: { type: 'string' } }
                      }
                    },
                    assigned_persona_role: { type: 'string' },
                    complexity: { type: 'string' },
                    estimated_time_saved: { type: 'string' },
                    roi_impact: { type: 'string' },
                    priority: { type: 'string' },
                    dependencies: { type: 'array', items: { type: 'string' } },
                    success_metrics: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['title', 'description', 'trigger_type', 'actions']
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

    // --- HANDLE PROPOSAL ---
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse((toolCall as any).function.arguments);

      if ((toolCall as any).function.name === 'update_team_structure') {
        const content = 'Preparei uma sugestão de atualização da equipe. Por favor, confirme as alterações abaixo.';
        const proposal = {
          type: 'update_team_structure',
          payload: args,
          summary: `Atualização de Equipe: ${args.team.length} membros.`
        };

        await persistLog(supabase, {
          project_id: projectId, mode, role: 'assistant',
          content, proposal
        });

        return NextResponse.json({
          role: 'assistant',
          content,
          proposal
        });
      }

      if ((toolCall as any).function.name === 'update_workflows') {
        const content = 'Sugiro as seguintes alterações nos fluxos de trabalho. Por favor, confirme.';
        const proposal = {
          type: 'update_workflows',
          payload: args,
          summary: `Atualização de Fluxos: ${args.workflows.length} itens.`
        };

        await persistLog(supabase, {
          project_id: projectId, mode, role: 'assistant',
          content, proposal
        });

        return NextResponse.json({
          role: 'assistant',
          content,
          proposal
        });
      }
    }

    // Normal text response
    if (responseMessage.content) {
      await persistLog(supabase, {
        project_id: projectId, mode, role: 'assistant',
        content: responseMessage.content
      });
    }

    return NextResponse.json(responseMessage);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to safely persist logs (ignores errors to not break chat flow)
async function persistLog(supabase: any, entry: ChatLogEntry) {
  if (!entry.project_id || entry.project_id.startsWith('mock-')) return;
  try {
    await supabase.from('chat_logs').insert({
      project_id: entry.project_id,
      mode: entry.mode,
      role: entry.role,
      content: entry.content || '',
      proposal: entry.proposal ? JSON.stringify(entry.proposal) : null,
      confirmed: entry.confirmed || false
    });
  } catch (e) {
    console.warn('Failed to persist chat log:', e);
  }
}
