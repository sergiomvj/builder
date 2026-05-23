import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { projectId, selectedFields, fieldsMetadata, currentAnswers } = await req.json();

    if (!projectId || !selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or no fields selected' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    // Fetch project context
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch strategic document
    const { data: strategicDoc } = await supabase
      .from('strategic_documents')
      .select('document_data')
      .eq('project_id', projectId)
      .maybeSingle();

    const hasStrategicDoc = !!strategicDoc?.document_data && Object.keys(strategicDoc.document_data).length > 0;

    const systemPrompt = `Você é um Estrategista Chefe (CMO/CGO) auxiliando no preenchimento de um plano de marketing.
Sua tarefa é gerar conteúdos precisos, específicos e acionáveis para múltiplos campos de um formulário de estratégia de marketing.

${hasStrategicDoc
  ? 'VOCÊ TEM ACESSO AO DOCUMENTO ESTRATÉGICO DO PROJETO — use-o como fonte primária de informações. Extraia dados concretos dele ao invés de gerar respostas genéricas.'
  : 'Use o nome, descrição e as respostas já preenchidas como contexto para gerar sugestões relevantes.'}

REGRAS DE SAÍDA:
1. Retorne APENAS um objeto JSON válido (sem \`\`\`json ou qualquer texto antes/depois)
2. As chaves do JSON devem ser EXATAMENTE as IDs dos campos listados
3. Os valores devem ser textos prontos para uso no formulário — não use placeholders como "[NOME DA EMPRESA]"
4. Seja específico ao negócio analisado, não genérico`;

    const userMessage = `
PROJETO:
- Nome: ${project.name}
- Descrição: ${project.description || 'Não informada'}

${hasStrategicDoc ? `DOCUMENTO ESTRATÉGICO CONSOLIDADO (use como fonte primária):
${JSON.stringify(strategicDoc.document_data, null, 2)}` : '(Documento estratégico ainda não disponível — use o contexto do projeto)'}

RESPOSTAS JÁ PREENCHIDAS NO FORMULÁRIO (não repita o que já foi preenchido):
${JSON.stringify(currentAnswers, null, 2)}

CAMPOS PARA GERAR (gere uma sugestão específica e acionável para cada um):
${selectedFields.map((fieldId: string) => {
    const label = fieldsMetadata?.[fieldId] || fieldId;
    return `- "${fieldId}": ${label}`;
  }).join('\n')}

Retorne SOMENTE o JSON com as chaves solicitadas acima e seus valores sugeridos.
`;

    const resultText = await llmService.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.7,
      maxTokens: 2500
    });

    let suggestions = {};
    if (resultText) {
      try {
        // Limpar possíveis formatações de markdown caso o LLM não respeite a regra
        const cleanJson = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        suggestions = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('Failed to parse batch JSON response:', resultText);
        return NextResponse.json({ error: 'LLM returned invalid JSON structure' }, { status: 500 });
      }
    }

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Error in generate-batch-fields:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
