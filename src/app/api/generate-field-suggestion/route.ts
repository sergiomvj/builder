import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { projectId, fieldKey, fieldLabel, currentAnswers } = await req.json();

    if (!projectId || !fieldKey || !fieldLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const systemPrompt = `Você é um especialista em Marketing e Negócios.
Sua tarefa é sugerir o preenchimento ideal para um campo específico de um formulário de estratégia de marketing.
Mantenha a resposta concisa, direta e alinhada com as informações já fornecidas. Responda APENAS com o texto sugerido, sem introduções. Formate em texto simples.`;

    const userMessage = `
Projeto: ${project.name}
Descrição: ${project.description || ''}

Informações já preenchidas no formulário:
${JSON.stringify(currentAnswers, null, 2)}

Por favor, sugira o preenchimento para o campo: "${fieldLabel}" (${fieldKey}).
Retorne apenas o valor sugerido.
`;

    const suggestion = await llmService.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.7,
      maxTokens: 500
    });

    return NextResponse.json({ suggestion: suggestion?.trim() || '' });

  } catch (error: any) {
    console.error('Error generating field suggestion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
