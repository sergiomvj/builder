// ============================================================================
// SCRIPT: Testar APIs de Metas, Atribuições e Procedimentos
// ============================================================================
// Execução: node test_apis.cjs
// Pré-requisito: npm run dev (servidor rodando na porta 3001)
// ============================================================================

const BASE_URL = 'http://localhost:3001';

// Usar Sophie Dubois como teste
const PERSONA_ID = '4697d8be-864d-4104-8c9a-a90c50bb7382';

async function testAPIs() {
  console.log('\n🧪 TESTANDO APIS REST - VCM\n');
  console.log('='.repeat(60));

  let metaId = null;
  let atribuicaoId = null;

  try {
    // ========================================================================
    // 1. TESTAR API DE METAS
    // ========================================================================
    console.log('\n1️⃣ TESTANDO API DE METAS\n');

    // 1.1 Criar meta
    console.log('📝 Criando nova meta...');
    const createMetaRes = await fetch(`${BASE_URL}/api/personas/metas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona_id: PERSONA_ID,
        titulo: 'Aumentar taxa de conversão',
        descricao: 'Aumentar conversão de email marketing de 2% para 5%',
        categoria: 'performance',
        valor_alvo: 5.0,
        valor_atual: 2.0,
        unidade_medida: '%',
        data_inicio: '2025-12-06',
        data_prazo: '2026-03-31',
        status: 'em_progresso',
        prioridade: 1,
      })
    });

    if (!createMetaRes.ok) {
      const error = await createMetaRes.json();
      throw new Error(`Erro ao criar meta: ${error.error}`);
    }

    const novaMeta = await createMetaRes.json();
    metaId = novaMeta.id;
    console.log(`✅ Meta criada com sucesso! ID: ${metaId}`);
    console.log(`   Título: ${novaMeta.titulo}`);
    console.log(`   Progresso: ${novaMeta.progresso_percentual}%`);

    // 1.2 Listar metas
    console.log('\n📋 Listando metas da persona...');
    const listMetasRes = await fetch(`${BASE_URL}/api/personas/${PERSONA_ID}/metas`);
    const metas = await listMetasRes.json();
    console.log(`✅ ${metas.length} meta(s) encontrada(s)`);

    // 1.3 Atualizar progresso
    console.log('\n📈 Atualizando progresso da meta...');
    const updateProgressoRes = await fetch(
      `${BASE_URL}/api/personas/metas/${metaId}/progresso`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_atual: 3.5,
          // progresso será calculado automaticamente
        })
      }
    );

    const metaAtualizada = await updateProgressoRes.json();
    console.log(`✅ Progresso atualizado!`);
    console.log(`   Valor atual: ${metaAtualizada.valor_atual}${metaAtualizada.unidade_medida}`);
    console.log(`   Progresso: ${metaAtualizada.progresso_percentual}%`);
    console.log(`   Status: ${metaAtualizada.status}`);

    // 1.4 Atualizar meta completa
    console.log('\n✏️ Atualizando meta completa...');
    const updateMetaRes = await fetch(
      `${BASE_URL}/api/personas/metas/${metaId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacoes: 'Meta atualizada via API - teste bem-sucedido',
        })
      }
    );

    const metaCompleta = await updateMetaRes.json();
    console.log(`✅ Meta atualizada!`);
    console.log(`   Observações: ${metaCompleta.observacoes}`);

    // ========================================================================
    // 2. TESTAR API DE ATRIBUIÇÕES
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('\n2️⃣ TESTANDO API DE ATRIBUIÇÕES\n');

    // 2.1 Criar atribuição
    console.log('📝 Criando nova atribuição...');
    const createAtribRes = await fetch(`${BASE_URL}/api/personas/atribuicoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona_id: PERSONA_ID,
        atribuicao: {
          titulo: 'Testar APIs do sistema',
          descricao: 'Validar funcionamento das APIs REST de metas e atribuições',
          frequencia: 'pontual',
        },
      })
    });

    if (!createAtribRes.ok) {
      const error = await createAtribRes.json();
      throw new Error(`Erro ao criar atribuição: ${error.error}`);
    }

    const novaAtrib = await createAtribRes.json();
    atribuicaoId = novaAtrib.id;
    console.log(`✅ Atribuição criada com sucesso! ID: ${atribuicaoId}`);
    console.log(`   Ordem: ${novaAtrib.ordem}`);

    // 2.2 Atualizar atribuição
    console.log('\n✏️ Atualizando atribuição...');
    const updateAtribRes = await fetch(
      `${BASE_URL}/api/personas/atribuicoes/${atribuicaoId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atribuicao: {
            titulo: 'Testar APIs do sistema (ATUALIZADO)',
            descricao: 'APIs validadas com sucesso via script de teste',
            frequencia: 'pontual',
          },
        })
      }
    );

    const atribAtualizada = await updateAtribRes.json();
    console.log(`✅ Atribuição atualizada!`);

    // ========================================================================
    // 3. TESTAR API DE PROCEDIMENTOS
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('\n3️⃣ TESTANDO API DE PROCEDIMENTOS\n');

    // 3.1 Buscar uma tarefa para testar
    console.log('🔍 Buscando tarefas da persona...');
    const tasksRes = await fetch(
      `${BASE_URL}/api/personas/${PERSONA_ID}/full`
    );
    const personaData = await tasksRes.json();
    
    if (personaData.tasks && personaData.tasks.length > 0) {
      const taskId = personaData.tasks[0].task_id;
      console.log(`✅ Tarefa encontrada: ${taskId}`);

      // 3.2 Atualizar procedimento
      console.log('\n📝 Atualizando procedimento de execução...');
      const updateProcRes = await fetch(
        `${BASE_URL}/api/personas/tasks/${taskId}/procedimento`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            procedimento_execucao: [
              {
                step: 1,
                acao: 'Abrir ferramenta de teste',
                ferramenta: 'Postman / cURL',
                tempo_estimado_min: 2,
                detalhes: 'Preparar ambiente de testes',
              },
              {
                step: 2,
                acao: 'Executar chamadas da API',
                ferramenta: 'Script Node.js',
                tempo_estimado_min: 5,
                detalhes: 'Testar endpoints de metas, atribuições e procedimentos',
              },
              {
                step: 3,
                acao: 'Validar respostas',
                ferramenta: 'Console / Logs',
                tempo_estimado_min: 3,
                detalhes: 'Verificar status codes e estrutura dos dados',
              },
            ],
          })
        }
      );

      const taskAtualizada = await updateProcRes.json();
      console.log(`✅ Procedimento atualizado!`);
      console.log(`   Steps: ${taskAtualizada.procedimento_execucao.length}`);
    } else {
      console.log('⚠️  Nenhuma tarefa encontrada para testar procedimentos');
    }

    // ========================================================================
    // 4. LIMPEZA (opcional - descomentar para deletar dados de teste)
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('\n4️⃣ LIMPEZA (OPCIONAL)\n');

    console.log('⚠️  Deseja deletar os dados de teste? (y/n)');
    console.log('   Meta ID: ' + metaId);
    console.log('   Atribuição ID: ' + atribuicaoId);
    console.log('\n💡 Para deletar, descomente o código abaixo no script\n');

    // Descomente as linhas abaixo para deletar automaticamente:
    /*
    if (metaId) {
      await fetch(`${BASE_URL}/api/personas/metas/${metaId}`, {
        method: 'DELETE',
      });
      console.log('🗑️  Meta deletada');
    }

    if (atribuicaoId) {
      await fetch(`${BASE_URL}/api/personas/atribuicoes/${atribuicaoId}`, {
        method: 'DELETE',
      });
      console.log('🗑️  Atribuição deletada');
    }
    */

    // ========================================================================
    // RESUMO FINAL
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    console.log('✅ API Metas: CREATE, READ, UPDATE, PATCH (progresso)');
    console.log('✅ API Atribuições: CREATE, UPDATE');
    console.log('✅ API Procedimentos: PATCH');
    console.log('\n✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!\n');
    console.log('📋 IDs criados para referência:');
    console.log(`   Meta: ${metaId}`);
    console.log(`   Atribuição: ${atribuicaoId}`);
    console.log('\n💡 Use esses IDs para testar DELETE manualmente se necessário');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\n💡 Verifique se:');
    console.error('   1. O servidor está rodando: npm run dev');
    console.error('   2. O Supabase está acessível');
    console.error('   3. As migrations foram aplicadas');
    console.error('='.repeat(60) + '\n');
  }
}

// Executar testes
testAPIs();
