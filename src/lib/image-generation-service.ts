// Image Generation Service - Integração com Nano Banana API para cenas e imagens
import { supabase } from './supabase';

export interface ImageConfig {
  template: {
    id: string;
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
    dimensions: string;
    name: string;
  };
  personas: {
    id: string;
    descricao_fisica: string;
    position: 'center' | 'left' | 'right' | 'background';
  }[];
  scene: string;
  style: 'professional' | 'casual' | 'artistic' | 'corporate' | 'social-media';
  mood: 'bright' | 'dramatic' | 'natural' | 'cinematic';
  quality: 'standard' | 'high' | 'ultra';
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail: string;
  prompt: string;
  config: ImageConfig;
  metadata: {
    generation_time: number;
    seed: number;
    model_version: string;
  };
  created_at: string;
}

class ImageGenerationService {
  private readonly baseUrl = 'https://api.nanobana.com';
  private readonly apiKey = process.env.NEXT_PUBLIC_NANOBANA_API_KEY;

  constructor() {
    if (!this.apiKey && process.env.NODE_ENV !== 'development') {
      console.warn('Nano Banana API key não configurada - usando modo simulado');
    }
  }

  /**
   * Gera imagem com múltiplas personas em uma cena
   */
  async generateSceneImage(config: ImageConfig): Promise<GeneratedImage> {
    try {
      if (!this.apiKey) {
        return this.simulateImageGeneration(config);
      }

      const prompt = this.buildScenePrompt(config);
      
      const response = await fetch(`${this.baseUrl}/v1/generate-scene`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          width: parseInt(config.template.dimensions.split('x')[0]),
          height: parseInt(config.template.dimensions.split('x')[1]),
          style: config.style,
          mood: config.mood,
          quality: config.quality,
          personas: config.personas.length,
          composition: this.getCompositionFromPositions(config.personas),
          format: 'png'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        id: result.id,
        url: result.image_url,
        thumbnail: result.thumbnail_url,
        prompt,
        config,
        metadata: {
          generation_time: result.generation_time,
          seed: result.seed,
          model_version: result.model_version
        },
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      throw new Error('Falha na geração da imagem');
    }
  }

  /**
   * Gera múltiplas variações de uma cena
   */
  async generateImageVariations(config: ImageConfig, count: number = 3): Promise<GeneratedImage[]> {
    try {
      const variations = await Promise.all(
        Array.from({ length: count }, () => this.generateSceneImage(config))
      );
      return variations;
    } catch (error) {
      console.error('Erro ao gerar variações:', error);
      throw error;
    }
  }

  /**
   * Salva imagem no Supabase Storage
   */
  async saveImageToStorage(imageUrl: string, metadata: any): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const fileName = `generated-images/${metadata.id}_${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('generated-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      throw new Error('Falha ao salvar imagem');
    }
  }

  /**
   * Salva histórico de geração no banco
   */
  async saveGenerationHistory(image: GeneratedImage, empresaId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_images_history')
        .insert({
          image_id: image.id,
          image_url: image.url,
          prompt: image.prompt,
          config: image.config,
          metadata: image.metadata,
          empresa_id: empresaId,
          created_at: image.created_at
        });

      if (error) {
        throw new Error(`Erro ao salvar histórico: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  }

  /**
   * Constrói prompt otimizado para geração de cena REALISTA
   */
  private buildScenePrompt(config: ImageConfig): string {
    let prompt = `Realistic, authentic, natural photograph, ${config.mood} lighting, ${config.template.aspectRatio} composition. `;
    
    // Enfatizar realismo e diversidade
    prompt += 'Real people, not models, authentic appearance, diverse body types, natural expressions. ';
    
    // Adiciona descrições das personas com foco no realismo
    const personaDescriptions = config.personas.map((persona, index) => {
      const positionText = this.getPositionText(persona.position, index, config.personas.length);
      // Adicionar palavras-chave para realismo
      const realisticDescription = persona.descricao_fisica
        .replace(/modelo/gi, 'pessoa comum')
        .replace(/perfeito/gi, 'natural')
        .replace(/bonito/gi, 'simpático');
      
      return `${positionText}: ${realisticDescription}`;
    }).join('. ');

    prompt += personaDescriptions + '. ';
    
    // Adiciona descrição da cena
    prompt += `Scene: ${config.scene}. `;
    
    // Adicionar configurações de qualidade com foco em naturalidade
    prompt += `Photojournalism style, candid photography, natural lighting, authentic workplace environment, `;
    prompt += `unposed, documentary style, real office workers, diverse team, inclusive workplace, `;
    prompt += `${config.quality === 'ultra' ? '8K resolution' : config.quality === 'high' ? '4K resolution' : 'HD resolution'}, `;
    prompt += `professional but authentic, realistic skin textures, natural hair, diverse ethnicities, `;
    prompt += `different body types represented, age diversity, authentic expressions, not retouched.`;

    return prompt;
  }

  /**
   * Determina composição baseada nas posições das personas
   */
  private getCompositionFromPositions(personas: any[]): string {
    if (personas.length === 1) {
      return personas[0].position === 'center' ? 'portrait' : 'rule-of-thirds';
    }
    
    if (personas.length === 2) {
      return 'two-shot';
    }
    
    if (personas.length >= 3) {
      return 'group-shot';
    }
    
    return 'dynamic';
  }

  /**
   * Converte posição para texto descritivo
   */
  private getPositionText(position: string, index: number, total: number): string {
    const positions = {
      'center': 'In the center of the frame',
      'left': 'On the left side of the frame',
      'right': 'On the right side of the frame',
      'background': 'In the background'
    };

    if (total === 1) {
      return 'Person in the frame';
    }
    
    return positions[position as keyof typeof positions] || `Person ${index + 1}`;
  }

  /**
   * Simula geração de imagem para desenvolvimento
   */
  private async simulateImageGeneration(config: ImageConfig): Promise<GeneratedImage> {
    // Simula tempo de geração
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    
    // URLs de imagens simuladas baseadas no template
    const simulatedImages = {
      '1:1': [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1080&h=1080',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1080&h=1080',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1080&h=1080'
      ],
      '9:16': [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1080&h=1920',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1080&h=1920',
        'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1080&h=1920'
      ],
      '16:9': [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1280&h=720',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1280&h=720',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1280&h=720'
      ],
      '4:5': [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1080&h=1350',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1080&h=1350',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1080&h=1350'
      ]
    };
    
    const aspectRatio = config.template.aspectRatio;
    const availableImages = simulatedImages[aspectRatio] || simulatedImages['1:1'];
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    
    return {
      id: `sim_img_${Date.now()}`,
      url: randomImage,
      thumbnail: randomImage + '&w=300',
      prompt: this.buildScenePrompt(config),
      config,
      metadata: {
        generation_time: 3.5 + Math.random() * 2,
        seed: Math.floor(Math.random() * 1000000),
        model_version: 'stable-diffusion-xl-turbo'
      },
      created_at: new Date().toISOString()
    };
  }

  /**
   * Gera templates de prompt baseados no tipo de mídia social
   */
  generateSocialMediaPrompts(template: any): string[] {
    const prompts = {
      'instagram-post': [
        'Modern Instagram-style photography, bright and vibrant, lifestyle focused',
        'Professional portrait for Instagram feed, clean background, good lighting',
        'Trendy Instagram post style, natural lighting, authentic feel'
      ],
      'instagram-stories': [
        'Vertical Instagram story format, casual and authentic, mobile-first',
        'Dynamic vertical composition for stories, engaging and personal',
        'Instagram stories style, vertical orientation, story-telling focused'
      ],
      'youtube-thumbnail': [
        'Eye-catching YouTube thumbnail, bold and attention-grabbing',
        'Professional YouTube thumbnail, clear text space, high contrast',
        'Engaging YouTube thumbnail style, dramatic lighting, clickable design'
      ],
      'linkedin-post': [
        'Professional LinkedIn post image, business-focused, corporate style',
        'Business professional photography for LinkedIn, clean and authoritative',
        'Corporate LinkedIn post style, professional networking focused'
      ]
    };

    return prompts[template.id as keyof typeof prompts] || prompts['instagram-post'];
  }
}

export const imageGenerationService = new ImageGenerationService();