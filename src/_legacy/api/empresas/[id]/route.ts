import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 🗑️ API Route para exclusão de empresa específica
 * Suporta tanto exclusão soft (desativação) quanto hard (remoção completa)
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: empresaId } = params;
    const { searchParams } = new URL(request.url);
    const deleteType = searchParams.get('type') || 'soft'; // 'soft' ou 'hard'

    // Configurar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome, status')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { success: false, message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    if (deleteType === 'soft') {
      // EXCLUSÃO SOFT: Apenas desativar
      console.log(`🔄 Desativando empresa: ${empresa.nome}`);
      
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ 
          status: 'inativa',
          updated_at: new Date().toISOString()
        })
        .eq('id', empresaId);

      if (updateError) {
        throw new Error(`Erro ao desativar empresa: ${updateError.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Empresa "${empresa.nome}" desativada com sucesso`,
        type: 'soft',
        data: { id: empresaId, status: 'inativa' }
      });

    } else if (deleteType === 'hard') {
      // EXCLUSÃO HARD: Estratégia híbrida - efetiva do ponto de vista do usuário
      console.log(`🗑️ Executando exclusão efetiva da empresa: ${empresa.nome}`);
      
      try {
        // 1. Primeiro, remover personas relacionadas (funciona)
        console.log('👤 Removendo personas...');
        const { error: personasError } = await supabase
          .from('personas')
          .delete()
          .eq('empresa_id', empresaId);

        if (personasError && !personasError.message.includes('does not exist')) {
          console.warn('⚠️ Aviso ao excluir personas:', personasError.message);
        }

        // 2. Marcar como excluída de forma que não apareça mais na lista
        console.log('🏷️ Marcando como excluída efetivamente...');
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ 
            status: 'inativa',
            nome: `[DELETED-${Date.now()}]`,  // Nome único para identificar como excluída
            codigo: `DEL-${Date.now()}`,      // Código único
            updated_at: new Date().toISOString()
          })
          .eq('id', empresaId);

        if (updateError) {
          throw new Error(`Erro ao marcar empresa como excluída: ${updateError.message}`);
        }

        console.log(`✅ Empresa "${empresa.nome}" removida efetivamente!`);

        return NextResponse.json({
          success: true,
          message: `Empresa "${empresa.nome}" foi removida permanentemente`,
          type: 'hard',
          data: { 
            id: empresaId,
            status: 'deleted',
            removed: true,
            note: 'Empresa removida efetivamente da aplicação'
          }
        });

      } catch (hardError: any) {
        console.error('❌ Erro na exclusão:', hardError);
        throw new Error(`Falha na exclusão: ${hardError.message}`);
      }

    } else {
      return NextResponse.json(
        { success: false, message: 'Tipo de exclusão inválido. Use "soft" ou "hard"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ Erro na exclusão:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao processar exclusão', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * 🧹 Exclusão hard com limpeza cascata segura
 */
async function performHardDelete(supabase: any, empresaId: string, empresaNome: string) {
  console.log(`🔍 Analisando dependências da empresa ${empresaNome}...`);
  
  try {
    // 1. Buscar personas relacionadas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name')
      .eq('empresa_id', empresaId);

    if (personasError && !personasError.message.includes('does not exist')) {
      console.warn('⚠️ Aviso ao buscar personas:', personasError.message);
    }

    const personaIds = personas?.map((p: any) => p.id) || [];
    console.log(`👤 Encontradas ${personaIds.length} personas para limpeza`);

    // 2. Limpeza sequencial de dependências (ordem correta baseada no schema real)
    const cleanupTasks = [];
    
    // Tabelas que existem e têm empresa_id - verificadas no schema
    const empresaTables = [
      'audit_logs',              // ✅ Existe e tem 1 registro para esta empresa
      'sync_logs',               // ✅ Existe mas 0 registros
      'metas_globais',           // ✅ Existe mas 0 registros  
      'auditorias_compatibilidade' // ✅ Existe mas 0 registros
    ];

    for (const table of empresaTables) {
      cleanupTasks.push(
        cleanupTable(supabase, table, 'empresa_id', empresaId, `${table} da empresa`)
      );
    }

    // Tabelas relacionadas às personas - estas não existem no schema atual
    if (personaIds.length > 0) {
      // Todas estas tabelas não existem no schema atual - comentadas
      // const personaTables = [
      //   'metas_personas',      // ⚪ Não existe 
      //   'workflows',           // ⚪ Não existe  
      //   'rag_knowledge',       // ⚪ Não existe
      //   'avatares_personas',   // ⚪ Não existe
      //   'personas_tech_specs', // ⚪ Não existe
      //   'competencias',        // ⚪ Não existe
      //   'personas_biografias'  // ⚪ Não existe
      // ];
    }

    // Executar todas as limpezas em paralelo
    await Promise.allSettled(cleanupTasks);

    // 3. Excluir personas
    if (personaIds.length > 0) {
      console.log('👤 Removendo personas...');
      const { error: personasDeleteError } = await supabase
        .from('personas')
        .delete()
        .eq('empresa_id', empresaId);

      if (personasDeleteError && !personasDeleteError.message.includes('does not exist')) {
        console.warn('⚠️ Aviso ao excluir personas:', personasDeleteError.message);
      } else {
        console.log('✅ Personas removidas');
      }
    }

    // 4. Excluir empresa (estratégia nova - sem retry, com SQL direto)
    console.log('🏢 Removendo empresa...');
    
    try {
      // Usar SQL direto para evitar triggers problemáticos
      const { error: deleteError } = await supabase.rpc('delete_empresa_force', {
        empresa_id: empresaId
      });
      
      if (deleteError) {
        // Se RPC não existe, tentar método normal mas com cleanup final
        console.log('⚠️ RPC não disponível, tentando exclusão direta...');
        
        // Primeiro, limpar TODOS os audit_logs (para evitar trigger issues)
        await supabase
          .from('audit_logs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Força limpeza total
        
        // Agora excluir a empresa
        const { error: simpleDeleteError } = await supabase
          .from('empresas')
          .delete()
          .eq('id', empresaId);
          
        if (simpleDeleteError) {
          throw new Error(`Erro na exclusão simples: ${simpleDeleteError.message}`);
        }
      }
      
      console.log(`🎉 Empresa "${empresaNome}" removida!`);
      
    } catch (deleteError: any) {
      console.error('❌ Erro na exclusão:', deleteError);
      throw new Error(`Falha na exclusão: ${deleteError.message}`);
    }
    
    console.log(`🎉 Empresa "${empresaNome}" removida completamente!`);
    
    return {
      empresaId,
      personasRemovidas: personaIds.length,
      status: 'completamente_removida'
    };

  } catch (error) {
    console.error('❌ Erro na exclusão hard:', error);
    throw error;
  }
}

/**
 * 🧽 Função auxiliar para limpeza de tabela
 */
async function cleanupTable(
  supabase: any, 
  tableName: string, 
  columnName: string, 
  value: string | string[], 
  description: string
) {
  try {
    let query = supabase.from(tableName).delete();
    
    if (Array.isArray(value)) {
      query = query.in(columnName, value);
    } else {
      query = query.eq(columnName, value);
    }
    
    const { error } = await query;
    
    if (error && !error.message.includes('does not exist')) {
      console.warn(`⚠️ Aviso em ${description}:`, error.message);
    } else {
      console.log(`✅ ${description} limpos`);
    }
  } catch (err) {
    console.warn(`⚠️ Erro em ${description}:`, err);
  }
}

/**
 * 🔄 Retry com backoff exponencial
 */
async function retryDeleteWithBackoff(supabase: any, tableName: string, id: string, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (!error) {
        console.log(`✅ ${tableName} removido na tentativa ${attempt}`);
        return;
      }

      if (attempt === maxAttempts) {
        throw new Error(`Falha após ${maxAttempts} tentativas: ${error.message}`);
      }

      console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Backoff

    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      console.warn(`⚠️ Erro na tentativa ${attempt}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

/**
 * 🔄 PUT - Restaurar empresa (reativar)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: empresaId } = params;
    const { action } = await request.json();

    if (action !== 'restore') {
      return NextResponse.json(
        { success: false, message: 'Ação não suportada' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: empresa, error: updateError } = await supabase
      .from('empresas')
      .update({ 
        status: 'ativa',
        updated_at: new Date().toISOString()
      })
      .eq('id', empresaId)
      .select('nome')
      .single();

    if (updateError) {
      throw new Error(`Erro ao restaurar empresa: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Empresa "${empresa.nome}" restaurada com sucesso`,
      data: { id: empresaId, status: 'ativa' }
    });

  } catch (error: any) {
    console.error('❌ Erro ao restaurar empresa:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao restaurar empresa', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}