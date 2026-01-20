'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Save, 
  Wand2, 
  Eye, 
  Palette,
  Ruler,
  Shirt,
  Smile,
  Camera,
  RefreshCw,
  Copy
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { realisticPersonaGenerator, type PhysicalCharacteristics } from '@/lib/realistic-persona-generator';

interface DescricaoFisicaEditorProps {
  persona: any;
  onUpdate?: (descricao: string) => void;
  showAIGenerate?: boolean;
}

interface CaracteristicasFisicas {
  genero: 'masculino' | 'feminino' | 'outro';
  idade: number;
  altura: 'baixa' | 'média' | 'alta';
  estrutura: 'magra' | 'atlética' | 'média' | 'robusta';
  cor_pele: string;
  cor_cabelo: string;
  tipo_cabelo: 'liso' | 'ondulado' | 'cacheado' | 'crespo';
  cor_olhos: string;
  formato_rosto: 'oval' | 'redondo' | 'quadrado' | 'triangular' | 'alongado';
  caracteristicas_distintas: string;
  estilo_vestimenta: 'formal' | 'casual' | 'esportivo' | 'elegante' | 'criativo';
  acessorios: string;
}

export function DescricaoFisicaEditor({ 
  persona, 
  onUpdate, 
  showAIGenerate = true 
}: DescricaoFisicaEditorProps) {
  const [descricaoText, setDescricaoText] = useState(persona.descricao_fisica || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStructuredEditor, setShowStructuredEditor] = useState(false);
  const [physicalProfile, setPhysicalProfile] = useState<PhysicalCharacteristics | null>(null);
  const [businessSector, setBusinessSector] = useState('tecnologia');
  const [diversityLevel, setDiversityLevel] = useState<'alta' | 'média' | 'baixa'>('alta');
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicasFisicas>({
    genero: 'masculino',
    idade: persona.experiencia_anos ? 25 + persona.experiencia_anos : 30,
    altura: 'média',
    estrutura: 'média',
    cor_pele: 'clara',
    cor_cabelo: 'castanho',
    tipo_cabelo: 'liso',
    cor_olhos: 'castanhos',
    formato_rosto: 'oval',
    caracteristicas_distintas: '',
    estilo_vestimenta: 'formal',
    acessorios: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    setDescricaoText(persona.descricao_fisica || '');
  }, [persona]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(descricaoText);
    }
    
    toast({
      title: 'Descrição física salva!',
      description: 'A descrição foi atualizada com sucesso.'
    });
  };

  const handleGenerateFromStructured = () => {
    const descricaoGerada = gerarDescricaoDetalhada(caracteristicas, persona);
    setDescricaoText(descricaoGerada);
    setShowStructuredEditor(false);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      // Gerar características físicas realistas e diversas
      const sector = businessSector;
      const role = persona.role || persona.cargo || 'funcionário';
      
      const characteristics = realisticPersonaGenerator.generateRealisticCharacteristics(
        sector,
        role,
        undefined,
        diversityLevel
      );
      
      const descricaoGerada = realisticPersonaGenerator.generateDetailedDescription(characteristics);
      
      setPhysicalProfile(characteristics);
      setDescricaoText(descricaoGerada);
      
      if (onUpdate) {
        onUpdate(descricaoGerada);
      }
      
      toast({
        title: 'Descrição realista gerada!',
        description: 'Persona com características físicas autênticas e diversas.'
      });
      
    } catch (error) {
      toast({
        title: 'Erro na geração',
        description: 'Não foi possível gerar a descrição.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(descricaoText);
    toast({
      title: 'Copiado!',
      description: 'Descrição copiada para a área de transferência.'
    });
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getDetailLevel = (text: string) => {
    const wordCount = getWordCount(text);
    if (wordCount < 50) return { level: 'Básica', color: 'bg-red-100 text-red-800' };
    if (wordCount < 100) return { level: 'Boa', color: 'bg-yellow-100 text-yellow-800' };
    if (wordCount < 150) return { level: 'Detalhada', color: 'bg-blue-100 text-blue-800' };
    return { level: 'Muito Detalhada', color: 'bg-green-100 text-green-800' };
  };

  const detailLevel = getDetailLevel(descricaoText);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getWordCount(descricaoText)}
            </div>
            <div className="text-sm text-gray-600">Palavras</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {descricaoText.length}
            </div>
            <div className="text-sm text-gray-600">Caracteres</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className={detailLevel.color}>
              {detailLevel.level}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Nível de Detalhe</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {descricaoText ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Consistência</div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Geração Realista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Configurações para Geração Realista
          </CardTitle>
          <CardDescription>
            Configure o tipo de diversidade física baseado no ramo de negócio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor de Negócio</Label>
              <Select value={businessSector} onValueChange={setBusinessSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="varejo">Varejo</SelectItem>
                  <SelectItem value="industria">Indústria</SelectItem>
                  <SelectItem value="criativo">Criativo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Influencia o tipo físico típico do setor
              </p>
            </div>

            <div className="space-y-2">
              <Label>Nível de Diversidade</Label>
              <Select value={diversityLevel} onValueChange={(value: any) => setDiversityLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta Diversidade</SelectItem>
                  <SelectItem value="média">Diversidade Média</SelectItem>
                  <SelectItem value="baixa">Diversidade Baixa</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Alta: inclui pessoas gordinhas, diferentes idades, etnias variadas
              </p>
            </div>
          </div>

          {physicalProfile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Características Geradas:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="font-medium">Tipo:</span> {physicalProfile.body_type}
                </div>
                <div>
                  <span className="font-medium">Idade:</span> {physicalProfile.age_range}
                </div>
                <div>
                  <span className="font-medium">Altura:</span> {physicalProfile.height}
                </div>
                <div>
                  <span className="font-medium">Etnia:</span> {physicalProfile.ethnicity}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toolbar de ações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              <div>
                <h3 className="font-medium">{persona.full_name || persona.nome}</h3>
                <p className="text-sm text-gray-600">{persona.role || persona.cargo}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {showAIGenerate && (
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="mr-1 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1 h-4 w-4" />
                      Gerar com IA
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() => setShowStructuredEditor(!showStructuredEditor)}
                variant="outline"
                size="sm"
              >
                <Palette className="mr-1 h-4 w-4" />
                Editor Estruturado
              </Button>

              {descricaoText && (
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copiar
                </Button>
              )}

              <Button onClick={handleSave} size="sm">
                <Save className="mr-1 h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Estruturado */}
      {showStructuredEditor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Editor Estruturado de Características
            </CardTitle>
            <CardDescription>
              Configure cada aspecto físico para gerar uma descrição detalhada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Básicas */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                  <User size={16} />
                  Características Básicas
                </h4>
                
                <div>
                  <Label>Gênero</Label>
                  <Select
                    value={caracteristicas.genero}
                    onValueChange={(value: any) => setCaracteristicas(prev => ({ ...prev, genero: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Idade: {caracteristicas.idade} anos</Label>
                  <Input
                    type="range"
                    min="18"
                    max="70"
                    value={caracteristicas.idade}
                    onChange={(e) => setCaracteristicas(prev => ({ ...prev, idade: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label>Altura</Label>
                  <Select
                    value={caracteristicas.altura}
                    onValueChange={(value: any) => setCaracteristicas(prev => ({ ...prev, altura: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa (até 1,65m)</SelectItem>
                      <SelectItem value="média">Média (1,66m - 1,75m)</SelectItem>
                      <SelectItem value="alta">Alta (acima de 1,76m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estrutura Corporal</Label>
                  <Select
                    value={caracteristicas.estrutura}
                    onValueChange={(value: any) => setCaracteristicas(prev => ({ ...prev, estrutura: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="magra">Magra</SelectItem>
                      <SelectItem value="atlética">Atlética</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="robusta">Robusta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aparência */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                  <Eye size={16} />
                  Aparência
                </h4>

                <div>
                  <Label>Cor da Pele</Label>
                  <Input
                    value={caracteristicas.cor_pele}
                    onChange={(e) => setCaracteristicas(prev => ({ ...prev, cor_pele: e.target.value }))}
                    placeholder="Ex: clara, morena, negra, parda..."
                  />
                </div>

                <div>
                  <Label>Cor do Cabelo</Label>
                  <Input
                    value={caracteristicas.cor_cabelo}
                    onChange={(e) => setCaracteristicas(prev => ({ ...prev, cor_cabelo: e.target.value }))}
                    placeholder="Ex: loiro, castanho, preto, ruivo..."
                  />
                </div>

                <div>
                  <Label>Tipo do Cabelo</Label>
                  <Select
                    value={caracteristicas.tipo_cabelo}
                    onValueChange={(value: any) => setCaracteristicas(prev => ({ ...prev, tipo_cabelo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="liso">Liso</SelectItem>
                      <SelectItem value="ondulado">Ondulado</SelectItem>
                      <SelectItem value="cacheado">Cacheado</SelectItem>
                      <SelectItem value="crespo">Crespo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cor dos Olhos</Label>
                  <Input
                    value={caracteristicas.cor_olhos}
                    onChange={(e) => setCaracteristicas(prev => ({ ...prev, cor_olhos: e.target.value }))}
                    placeholder="Ex: castanhos, azuis, verdes, pretos..."
                  />
                </div>

                <div>
                  <Label>Formato do Rosto</Label>
                  <Select
                    value={caracteristicas.formato_rosto}
                    onValueChange={(value: any) => setCaracteristicas(prev => ({ ...prev, formato_rosto: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oval">Oval</SelectItem>
                      <SelectItem value="redondo">Redondo</SelectItem>
                      <SelectItem value="quadrado">Quadrado</SelectItem>
                      <SelectItem value="triangular">Triangular</SelectItem>
                      <SelectItem value="alongado">Alongado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estilo */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                  <Shirt size={16} />
                  Estilo e Acessórios
                </h4>

                <div>
                  <Label>Estilo de Vestimenta</Label>
                  <Select
                    value={caracteristicas.estilo_vestimenta}
                    onValueChange={(value: any) => setCaracteristicas(prev => ({ ...prev, estilo_vestimenta: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal/Executivo</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="esportivo">Esportivo</SelectItem>
                      <SelectItem value="elegante">Elegante</SelectItem>
                      <SelectItem value="criativo">Criativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Características Distintas</Label>
                  <Textarea
                    value={caracteristicas.caracteristicas_distintas}
                    onChange={(e) => setCaracteristicas(prev => ({ ...prev, caracteristicas_distintas: e.target.value }))}
                    placeholder="Ex: óculos, barba, cicatriz, tatuagem, piercing..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Acessórios</Label>
                  <Textarea
                    value={caracteristicas.acessorios}
                    onChange={(e) => setCaracteristicas(prev => ({ ...prev, acessorios: e.target.value }))}
                    placeholder="Ex: relógio, colar, brincos, pulseira..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleGenerateFromStructured} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Gerar Descrição Detalhada
              </Button>
              <Button 
                onClick={() => setShowStructuredEditor(false)} 
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera size={20} />
            Descrição Física Detalhada
            {descricaoText && <Badge variant="secondary">Preenchida</Badge>}
          </CardTitle>
          <CardDescription>
            Descrição minuciosa para garantir consistência em avatares e imagens
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={descricaoText}
              onChange={(e) => setDescricaoText(e.target.value)}
              className="min-h-[300px] text-sm"
              placeholder="Descreva detalhadamente as características físicas da persona...

Exemplo:
João é um homem de 35 anos, com altura média (1,75m) e estrutura corporal atlética. Possui pele clara com um leve bronzeado, cabelos castanhos escuros e curtos, sempre bem penteados. Seus olhos são castanhos expressivos, com formato amendoado. 

Rosto oval com mandíbula definida, nariz proporcional e um sorriso confiante. Usa óculos de armação preta discreta para leitura. Tem uma pequena cicatriz na sobrancelha esquerda, resultado de um acidente na juventude.

Seu estilo é formal-executivo: sempre usa ternos bem cortados em tons sóbrios (azul marinho, cinza, preto), camisas brancas ou azul claro, gravatas discretas. Usa um relógio de pulso de aço escovado e sapatos sociais de couro preto sempre bem engraxados.

Postura ereta e confiante, gestos comedidos mas expressivos, voz grave e pausada..."
            />
            
            {/* Dicas de qualidade */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Para melhor qualidade:</strong> Inclua detalhes sobre cor da pele, cabelo, olhos, formato do rosto, altura, estrutura corporal, estilo de roupa, acessórios, expressões faciais típicas, postura e qualquer característica distintiva. Quanto mais detalhado, melhor a consistência das imagens geradas.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview para Prompts */}
      {descricaoText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview para Geração de Imagens</CardTitle>
            <CardDescription>
              Como esta descrição será usada nos prompts de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
              <div className="text-green-600 font-semibold mb-2">// Prompt Base:</div>
              <div className="text-gray-800">
                "Professional photo of {descricaoText.slice(0, 200)}..."
              </div>
              <div className="text-blue-600 mt-2">+ configurações de cena + estilo + qualidade</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Função para gerar descrição detalhada baseada nas características estruturadas
function gerarDescricaoDetalhada(caracteristicas: CaracteristicasFisicas, persona: any): string {
  const nome = persona.full_name || persona.nome;
  const cargo = persona.role || persona.cargo;
  
  const alturaDescricao = {
    'baixa': 'baixa estatura (aproximadamente 1,60m)',
    'média': 'altura média (cerca de 1,70m)', 
    'alta': 'altura acima da média (aproximadamente 1,80m)'
  };
  
  const estruturaDescricao = {
    'magra': 'estrutura corporal magra e esguia',
    'atlética': 'estrutura corporal atlética e bem definida',
    'média': 'estrutura corporal média e proporcional',
    'robusta': 'estrutura corporal robusta e imponente'
  };
  
  const estiloDescricao = {
    'formal': 'estilo formal e executivo, sempre usando ternos bem cortados',
    'casual': 'estilo casual e descontraído, com roupas confortáveis',
    'esportivo': 'estilo esportivo, com roupas funcionais e modernas',
    'elegante': 'estilo elegante e sofisticado',
    'criativo': 'estilo criativo e autêntico, com peças únicas'
  };

  return `${nome} é ${caracteristicas.genero === 'feminino' ? 'uma mulher' : caracteristicas.genero === 'masculino' ? 'um homem' : 'uma pessoa'} de ${caracteristicas.idade} anos, com ${alturaDescricao[caracteristicas.altura]} e ${estruturaDescricao[caracteristicas.estrutura]}. 

Possui pele ${caracteristicas.cor_pele} e cabelos ${caracteristicas.cor_cabelo} ${caracteristicas.tipo_cabelo}s. Seus olhos são ${caracteristicas.cor_olhos} e tem um rosto de formato ${caracteristicas.formato_rosto}.

${caracteristicas.caracteristicas_distintas ? `Características distintivas: ${caracteristicas.caracteristicas_distintas}.` : ''}

Seu ${estiloDescricao[caracteristicas.estilo_vestimenta]}. ${caracteristicas.acessorios ? `Costuma usar ${caracteristicas.acessorios}.` : ''}

Como ${cargo}, sua postura é profissional e confiante, transmitindo competência e autoridade em sua área de atuação.`;
}

// Função para gerar descrição usando IA simulada
function gerarDescricaoIA(persona: any): string {
  const nome = persona.full_name || persona.nome;
  const cargo = persona.role || persona.cargo;
  const idade = persona.experiencia_anos ? 25 + persona.experiencia_anos : 30;
  
  // Determina características baseadas no nome e cargo
  const genero = determineGender(nome);
  const estiloBaseadoCargo = determineStyle(cargo);
  
  const templates = {
    masculino: {
      formal: `${nome} é um homem de ${idade} anos, com altura média (1,75m) e estrutura corporal atlética. Possui pele clara com um leve bronzeado natural, cabelos castanhos escuros sempre bem penteados em um corte executivo clássico. Seus olhos são castanhos expressivos, com olhar penetrante e confiante.

Rosto de formato oval com mandíbula bem definida, nariz proporcional e um sorriso profissional. Tem sobrancelhas marcantes e uma expressão serena que transmite competência e liderança.

Como ${cargo}, sempre se veste de forma impecável: ternos bem cortados em tons sóbrios (azul marinho, cinza chumbo, preto), camisas brancas ou azul claro sempre passadas, gravatas discretas e elegantes. Usa um relógio de pulso de boa qualidade e sapatos sociais de couro sempre bem cuidados.

Sua postura é ereta e confiante, com gestos comedidos mas expressivos. Tem voz grave e pausada, transmitindo autoridade natural em suas interações profissionais.`,
      
      casual: `${nome} é um homem de ${idade} anos, com altura média (1,73m) e físico em forma, resultado de atividades regulares. Tem pele morena clara, cabelos castanhos médios com um estilo moderno e despojado. Seus olhos são verdes-acinzentados, sempre com uma expressão amigável e criativa.

Rosto angular com barba por fazer bem cuidada, nariz reto e um sorriso genuíno. Tem sobrancelhas naturais e uma expressão descontraída que reflete sua personalidade criativa.

Seu estilo é casual-inteligente: camisetas de qualidade, jeans escuros, tênis ou sapatos casuais. Às vezes usa blazer informal sobre camiseta. Porta um relógio esportivo e uma mochila moderna de qualidade.

Postura relaxada mas atenta, gestos expressivos ao falar, voz clara e entusiasmada, especialmente quando discute projetos em sua área de expertise.`
    },
    
    feminino: {
      formal: `${nome} é uma mulher de ${idade} anos, com altura média (1,68m) e estrutura corporal elegante e proporcional. Possui pele clara com um tom rosado natural, cabelos castanho-escuros longos e bem cuidados, geralmente presos em um coque profissional ou soltos com ondas sutis.

Seus olhos são castanhos escuros expressivos, sempre bem maquiados de forma discreta mas sofisticada. Rosto de formato oval com traços delicados, maçãs do rosto definidas e lábios naturalmente rosados.

Como ${cargo}, seu guarda-roupa é composto por peças clássicas e atemporais: blazers bem cortados, blusas de seda, saias lápis ou calças de alfaiataria em cores neutras e elegantes. Usa sapatos de salto médio confortáveis e acessórios discretos como brincos pequenos e uma bolsa estruturada.

Sua postura é elegante e confiante, com gestos delicados mas determinados. Voz clara e articulada, sempre transmitindo profissionalismo e competência em suas interações.`,
      
      casual: `${nome} é uma mulher de ${idade} anos, com altura média (1,65m) e físico atlético e saudável. Tem pele morena clara com sardas sutis, cabelos loiros médios com luzes naturais, geralmente soltos ou em um rabo de cavalo despojado.

Olhos azuis-esverdeados brilhantes, com uma maquiagem natural e minimalista. Rosto de formato oval com traços harmoniosos, sorriso genuíno e uma expressão sempre amigável e acessível.

Seu estilo é moderno e funcional: blusas casuais de qualidade, jeans ou calças confortáveis, tênis estilosos ou sapatilhas. Usa acessórios contemporâneos como uma bolsa transversal e bijuterias delicadas.

Postura natural e descontraída, gestos expressivos e espontâneos. Voz doce mas determinada, demonstrando paixão por seu trabalho e facilidade para se conectar com diferentes pessoas.`
    }
  };
  
  const estilo = estiloBaseadoCargo === 'corporate' || estiloBaseadoCargo === 'professional' ? 'formal' : 'casual';
  return templates[genero][estilo] || templates.masculino.formal;
}

function determineGender(name: string): 'masculino' | 'feminino' {
  const femaleEndings = ['a', 'ana', 'ina', 'ela', 'isa', 'ara', 'cia', 'lia'];
  const maleEndings = ['o', 'os', 'ão', 'er', 'on', 'al'];
  
  const lowerName = name.toLowerCase();
  
  if (femaleEndings.some(ending => lowerName.endsWith(ending))) {
    return 'feminino';
  }
  if (maleEndings.some(ending => lowerName.endsWith(ending))) {
    return 'masculino';
  }
  
  return 'masculino'; // default
}

function determineStyle(role: string): string {
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