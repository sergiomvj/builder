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

    const systemPrompt = `Você é um Estrategista Chefe (CMO/CGO) auxiliando no preenchimento de um plano de marketing.
Sua tarefa é gerar conteúdos precisos e concisos para múltiplos campos do formulário, com base no documento estratégico do projeto e nas respostas já preenchidas pelo usuário.

REGRA ABSOLUTA DE SAÍDA: 
Você deve retornar APENAS um objeto JSON válido (sem \`\`\`json ou qualquer texto antes/depois). 
As chaves do JSON devem ser exatamente as IDs dos campos listados na solicitação.
Os valores devem ser os textos sugeridos.`;

    const userMessage = `
Contexto do Projeto:
Nome: ${project.name}
Descrição: ${project.description || ''}

Documento Estratégico Global (Strategie Doc):
${strategicDoc?.document_data ? JSON.stringify(strategicDoc.document_data, null, 2) : 'Ainda não gerado / Não disponível.'}

Respostas do formulário já preenchidas até agora:
${JSON.stringify(currentAnswers, null, 2)}

Por favor, gere uma sugestão para cada um dos seguintes campos:
${selectedFields.map((fieldId: string) => {
    const label = fieldsMetadata[fieldId] || fieldId;
    return `- ${fieldId} (${label})`;
}).join('\n')}

Retorne SOMENTE um JSON no formato:
{
  "${selectedFields[0]}": "Sua sugestão de texto para este campo...",
  // demais campos...
}
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
