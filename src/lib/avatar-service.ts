// Avatar Service - Integração com Nano Banana API
import { supabase } from './supabase';

export interface AvatarConfig {
  gender: 'masculino' | 'feminino';
  age: number;
  role: string;
  style: 'professional' | 'casual' | 'corporate' | 'creative';
  background: 'office' | 'studio' | 'transparent' | 'gradient';
}

export interface GeneratedAvatar {
  id: string;
  url: string;
  thumbnail: string;
  prompt: string;
  config: AvatarConfig;
  created_at: string;
}

class AvatarService {
  private readonly baseUrl = 'https://api.nanobana.com';
  private readonly apiKey = process.env.NEXT_PUBLIC_NANOBANA_API_KEY;

  constructor() {
    if (!this.apiKey && process.env.NODE_ENV !== 'development') {
      console.warn('Nano Banana API key não configurada - usando modo simulado');
    }
  }

  /**
   * Gera um avatar baseado na configuração da persona
   */
  async generateAvatar(config: AvatarConfig): Promise<GeneratedAvatar> {
    try {
      // Se não há API key, simula geração para desenvolvimento
      if (!this.apiKey) {
        return this.simulateAvatarGeneration(config);
      }

      const prompt = this.buildPrompt(config);
      
      const response = await fetch(`${this.baseUrl}/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style: config.style,
          size: '512x512',
          quality: 'high',
          background: config.background,
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
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao gerar avatar:', error);
      throw new Error('Falha na geração do avatar');
    }
  }

  /**
   * Salva o avatar no Supabase Storage
   */
  async saveAvatarToStorage(avatarUrl: string, personaId: string): Promise<string> {
    try {
      // Download da imagem
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      
      // Upload para Supabase Storage
      const fileName = `avatars/${personaId}_${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('persona-avatars')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      // Gerar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('persona-avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      throw new Error('Falha ao salvar avatar');
    }
  }

  /**
   * Atualiza a persona com o avatar gerado
   */
  async updatePersonaAvatar(personaId: string, avatarUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('personas')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId);

      if (error) {
        throw new Error(`Erro ao atualizar persona: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar persona:', error);
      throw error;
    }
  }

  /**
   * Workflow completo: gera avatar e salva na persona
   */
  async generateAndSaveAvatar(personaId: string, config: AvatarConfig): Promise<string> {
    try {
      // 1. Gerar avatar
      const generatedAvatar = await this.generateAvatar(config);
      
      // 2. Salvar no storage
      const storageUrl = await this.saveAvatarToStorage(generatedAvatar.url, personaId);
      
      // 3. Atualizar persona
      await this.updatePersonaAvatar(personaId, storageUrl);
      
      return storageUrl;
    } catch (error) {
      console.error('Erro no workflow de avatar:', error);
      throw error;
    }
  }

  /**
   * Gera configuração automática baseada na persona
   */
  generateConfigFromPersona(persona: any): AvatarConfig {
    // Determinar gênero baseado no nome ou configuração
    const gender = this.determineGender(persona.full_name || persona.nome);
    
    // Determinar idade baseada na experiência
    const baseAge = 25;
    const experienceAge = (persona.experiencia_anos || 3) * 1.2;
    const age = Math.min(65, Math.max(22, baseAge + experienceAge));
    
    // Determinar estilo baseado no cargo/departamento
    const style = this.determineStyle(persona.role || persona.cargo);
    
    return {
      gender,
      age: Math.round(age),
      role: persona.role || persona.cargo || 'professional',
      style,
      background: 'office'
    };
  }

  /**
   * Constrói prompt otimizado para geração
   */
  private buildPrompt(config: AvatarConfig): string {
    const genderTerm = config.gender === 'masculino' ? 'man' : 'woman';
    const ageRange = config.age < 30 ? 'young' : config.age < 50 ? 'middle-aged' : 'mature';
    
    return `Professional headshot of a ${ageRange} ${genderTerm}, ${config.role} role, ${config.style} style, high quality, business attire, confident expression, looking directly at camera, clean ${config.background} background`;
  }

  /**
   * Determina gênero baseado no nome (heurística simples)
   */
  private determineGender(name: string): 'masculino' | 'feminino' {
    const femaleEndings = ['a', 'ana', 'ina', 'ela', 'isa', 'ara'];
    const maleEndings = ['o', 'os', 'ão', 'er', 'on'];
    
    const lowerName = name.toLowerCase();
    
    if (femaleEndings.some(ending => lowerName.endsWith(ending))) {
      return 'feminino';
    }
    if (maleEndings.some(ending => lowerName.endsWith(ending))) {
      return 'masculino';
    }
    
    // Default para masculino se não determinar
    return 'masculino';
  }

  /**
   * Determina estilo baseado no cargo
   */
  private determineStyle(role: string): 'professional' | 'casual' | 'corporate' | 'creative' {
    const lowerRole = role.toLowerCase();
    
    if (lowerRole.includes('ceo') || lowerRole.includes('diretor') || lowerRole.includes('presidente')) {
      return 'corporate';
    }
    if (lowerRole.includes('design') || lowerRole.includes('creative') || lowerRole.includes('marketing')) {
      return 'creative';
    }
    if (lowerRole.includes('tech') || lowerRole.includes('dev') || lowerRole.includes('engineer')) {
      return 'casual';
    }
    
    return 'professional';
  }

  /**
   * Simula geração de avatar para desenvolvimento (sem API)
   */
  private async simulateAvatarGeneration(config: AvatarConfig): Promise<GeneratedAvatar> {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // URLs de avatares simulados baseados no gênero
    const maleAvatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300'
    ];
    
    const femaleAvatars = [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
    ];
    
    const avatars = config.gender === 'masculino' ? maleAvatars : femaleAvatars;
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    return {
      id: `sim_${Date.now()}`,
      url: randomAvatar,
      thumbnail: randomAvatar,
      prompt: this.buildPrompt(config),
      config,
      created_at: new Date().toISOString()
    };
  }
}

export const avatarService = new AvatarService();