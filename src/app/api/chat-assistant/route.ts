
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
          ...member,
          empresa_id: empresaId,
          updated_at: new Date().toISOString()
        }));

        await supabase.from('personas').upsert(upsertData);

        // Handle deletions
        if (team.length > 0) {
          const newIds = team.filter((m: any) => m.id).map((m: any) => m.id);
          // If we have IDs to keep, delete others. This is risky if user didn't see everyone.
          // For safety, let's only upsert for now to avoid accidental deletions unless explicit.
          // Or, better: if this is a full structure update, we should trust it.
          // Let's assume it's additive/corrective for now.
        }

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

        console.log('[API] Confirming workflows update for project:', projectId);
        const { data: project } = await supabase.from('projects').select('metadata').eq('id', projectId).single();

        // Ensure we don't lose existing workflows if the LLM only suggests *new* ones, 
        // BUT usually "update" assumes full state in this simple architecture or the LLM was given context of all.
        // In the system prompt, we provide "Current workflows", so the LLM likely returns the Full Modified List or at least we hope so.
        // If the LLM returns only new ones, we might need to merge. 
        // For safe measure, let's assume the LLM returns the *delta* or *full*. 
        // Actually, the system prompt says "If user asks to change, use update...". logic dictates it might just send new ones.
        // Let's try to merge if IDs exist, or append if not.

        let existingWorkflows = project?.metadata?.workflows || [];
        if (!Array.isArray(existingWorkflows)) existingWorkflows = [];

        // Simple merge strategy: If ID matches, update; else add.
        // Note: LLM might not generate IDs for new items.

        const mergedWorkflows = [...existingWorkflows];

        workflows.forEach((newWf: any) => {
          const index = mergedWorkflows.findIndex((w: any) => w.id === newWf.id || w.task_title === newWf.task_title);
          if (index >= 0) {
            mergedWorkflows[index] = { ...mergedWorkflows[index], ...newWf };
          } else {
            mergedWorkflows.push({ ...newWf, id: newWf.id || crypto.randomUUID() });
          }
        });

        const updatedMetadata = { ...project?.metadata, workflows: mergedWorkflows };

        const { error: updateError } = await supabase.from('projects').update({ metadata: updatedMetadata }).eq('id', projectId);

        if (updateError) {
          console.error('[API] Error updating workflows in DB:', updateError);
          throw updateError;
        }

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
    // The last message in 'messages' array is the new user message
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
    let systemPrompt = '';
    let tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];

    if (mode === 'team') {
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('*').eq('empresa_id', empresa.id)).data : []);
      const contextSummary = typeof project?.executive_summary === 'string'
        ? project.executive_summary
        : (project?.executive_summary?.content || project?.description || 'No description available');

      systemPrompt = `
        You are an expert HR Manager & Organizational Strategist for the project "${project?.name || 'Project'}".
        
        Project Context/Summary:
        ${contextSummary}

        Current Team Context: ${JSON.stringify(team, null, 2)}
        
        Your goal is to help the user define, hire, or reorganize the team to achieve the project goals.
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
      // ... (Workflows setup remains same)
      const workflows = currentData?.workflows || project?.metadata?.workflows || [];
      const team = currentData?.team || (empresa ? (await supabase.from('personas').select('id, nome, cargo').eq('empresa_id', empresa.id)).data : []);

      const contextSummary = typeof project?.executive_summary === 'string'
        ? project.executive_summary
        : (project?.executive_summary?.content || project?.description || 'No description available');

      systemPrompt = `
        You are an expert Operations & Automation Manager for "${project?.name || 'Project'}".
        
        Project Context:
        ${contextSummary}

        Current Workflows: ${JSON.stringify(workflows, null, 2)}
        Available Team Members: ${JSON.stringify(team, null, 2)}
        
        Your goal is to create or optimize workflows to execute the project vision.
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
