import { NextRequest, NextResponse } from 'next/server';
import { createN8NClient } from '@/lib/n8n-client';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/n8n/sync
 * Sincroniza workflows do N8N com o banco de dados (personas_workflows)
 * 
 * Query params:
 *   - empresaId: string (opcional, filtrar por empresa)
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresaId');

    const client = await createN8NClient();

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'N8N não configurado'
        },
        { status: 503 }
      );
    }

    // Buscar workflows do N8N
    const n8nWorkflows = await client.getWorkflows();

    // Buscar workflows do banco
    let query = supabase
      .from('personas_workflows')
      .select('*');

    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data: dbWorkflows, error: dbError } = await query;

    if (dbError) {
      throw new Error(`Erro ao buscar workflows do banco: ${dbError.message}`);
    }

    let updated = 0;
    let created = 0;
    const errors: string[] = [];

    // Sincronizar workflows
    for (const n8nWorkflow of n8nWorkflows) {
      try {
        // Procurar workflow no banco pelo nome ou n8n_workflow_id
        const dbWorkflow = dbWorkflows?.find(
          (w: any) =>
            w.n8n_workflow_id === n8nWorkflow.id ||
            w.workflow_name === n8nWorkflow.name
        );

        if (dbWorkflow) {
          // Atualizar workflow existente
          const { error: updateError } = await supabase
            .from('personas_workflows')
            .update({
              n8n_workflow_id: n8nWorkflow.id,
              workflow_name: n8nWorkflow.name,
              status: n8nWorkflow.active ? 'active' : 'inactive',
              workflow_json: n8nWorkflow,
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbWorkflow.id);

          if (updateError) {
            errors.push(`Erro ao atualizar ${n8nWorkflow.name}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Criar novo registro (se tiver informação suficiente)
          // Note: Aqui não criamos automaticamente pois não temos empresa_id/persona_id
          // Apenas log para referência
          console.log(`Workflow "${n8nWorkflow.name}" não encontrado no banco (não será criado automaticamente)`);
        }
      } catch (err: any) {
        errors.push(`Erro ao processar ${n8nWorkflow.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: n8nWorkflows.length,
        updated,
        created,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Sincronização concluída: ${updated} atualizados, ${created} criados`,
    });

  } catch (error: any) {
    console.error('Erro ao sincronizar workflows:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao sincronizar workflows'
      },
      { status: 500 }
    );
  }
}
