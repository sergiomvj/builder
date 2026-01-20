import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎭 Geração avançada de avatar recebida:', body);
    
    const { 
      empresa_id, 
      tipo, 
      personas_ids, 
      situacao, 
      background, 
      estilo, 
      descricao_personalizada 
    } = body;

    if (!empresa_id || !personas_ids?.length) {
      return NextResponse.json({
        success: false,
        message: 'Empresa e personas são obrigatórias'
      }, { status: 400 });
    }

    console.log(`🍌 Iniciando geração ${tipo} para ${personas_ids.length} personas`);

    // Buscar informações das personas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const googleAIKey = process.env.GOOGLE_AI_API_KEY_2;

    if (!googleAIKey) {
      return NextResponse.json({
        success: false,
        message: 'Google AI API Key 2 não configurada'
      }, { status: 500 });
    }

    // Simular busca de personas (em uma implementação real, buscar do Supabase)
    const personasInfo = personas_ids.map(id => ({
      id,
      nome: `Persona ${id.substring(0, 8)}`,
      cargo: 'Professional'
    }));

    // Gerar prompt baseado no tipo e configurações
    let prompt = '';
    
    if (tipo === 'individual') {
      prompt = `Professional headshot of a ${estilo} business person in ${situacao} setting, ${background} background, high quality corporate photography`;
    } else if (tipo === 'grupo') {
      prompt = `Professional group photo of ${personas_ids.length} business professionals in ${situacao}, ${background} background, ${estilo} style, team collaboration, corporate photography`;
    } else if (tipo === 'cenario') {
      prompt = `Corporate scene of business professionals in ${situacao}, ${background} environment, ${estilo} aesthetic, professional setting`;
    }

    // Adicionar descrição personalizada se fornecida
    if (descricao_personalizada) {
      prompt += `, ${descricao_personalizada}`;
    }

    console.log(`📝 Prompt gerado: ${prompt.substring(0, 100)}...`);

    // Chamar Google AI Imagen API (Nano Banana)
    try {
      const imageResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          safetyFilterLevel: 'BLOCK_ONLY_HIGH',
          aspectRatio: tipo === 'grupo' ? 'ASPECT_RATIO_16_9' : 'ASPECT_RATIO_1_1',
          outputOptions: {
            outputFormat: 'JPEG'
          }
        })
      });

      if (!imageResponse.ok) {
        throw new Error(`Google AI API error: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageData = await imageResponse.json();
      
      if (!imageData.candidates || !imageData.candidates[0] || !imageData.candidates[0].imageUri) {
        throw new Error('Nenhuma imagem gerada pela API');
      }

      const imageUrl = imageData.candidates[0].imageUri;
      console.log(`✅ Imagem gerada: ${imageUrl.substring(0, 50)}...`);

      // Salvar registro da imagem gerada (implementar conforme necessário)
      // Aqui você salvaria no Supabase na tabela personas_avatares

      return NextResponse.json({
        success: true,
        message: 'Imagem avançada gerada com sucesso',
        data: {
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          prompt_usado: prompt,
          tipo,
          personas_count: personas_ids.length,
          estilo,
          background,
          situacao
        }
      });

    } catch (imageError) {
      console.error('❌ Erro na geração da imagem:', imageError);
      
      // Fallback para imagem simulada
      const fallbackUrl = `https://api.dicebear.com/7.x/professional/svg?seed=${tipo}_${Date.now()}&backgroundColor=e3f2fd`;
      
      return NextResponse.json({
        success: true,
        message: 'Imagem gerada com fallback (Google AI indisponível)',
        data: {
          image_url: fallbackUrl,
          thumbnail_url: fallbackUrl,
          prompt_usado: prompt,
          tipo,
          personas_count: personas_ids.length,
          estilo,
          background,
          situacao,
          fallback: true
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro na API de avatares avançados:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}