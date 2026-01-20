// Teste simples para verificar se a tabela metas_globais existe
import { supabase } from '@/lib/supabase';

export async function testarTabelaMetasGlobais() {
  try {
    console.log('Testando conexão com tabela metas_globais...');
    
    // Tentar fazer uma query simples
    const { data, error } = await supabase
      .from('metas_globais')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erro ao acessar tabela metas_globais:', error);
      return { success: false, error };
    }
    
    console.log('Tabela metas_globais acessível. Dados:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Erro ao testar tabela:', error);
    return { success: false, error };
  }
}

export async function testarCriacaoMeta() {
  try {
    console.log('Testando criação de meta...');
    
    const testMeta = {
      empresa_id: 'test-empresa-id',
      titulo: 'Meta de Teste',
      descricao: 'Meta criada para teste',
      categoria: 'crescimento',
      prioridade: 'media',
      prazo: '2024-12-31',
      responsavel_principal: 'Teste Responsável',
      budget_estimado: 10000,
      roi_esperado: 200,
      indicadores_sucesso: ['Teste 1', 'Teste 2'],
      status: 'ativa',
      progresso: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('metas_globais')
      .insert([testMeta])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar meta teste:', error);
      return { success: false, error };
    }
    
    console.log('Meta de teste criada:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Erro ao testar criação:', error);
    return { success: false, error };
  }
}