'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { realisticPersonaGenerator, type PhysicalCharacteristics } from '@/lib/realistic-persona-generator';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Wand2, 
  RefreshCw, 
  Download,
  Save,
  Loader2
} from 'lucide-react';

interface GeneratedPersona {
  id: string;
  nome: string;
  cargo: string;
  caracteristicas: PhysicalCharacteristics;
  descricao_completa: string;
}

interface EquipeDiversaGeneratorProps {
  onTeamGenerated?: (team: GeneratedPersona[]) => void;
  empresaSetor?: string;
  empresaId: string;
  empresaNome: string;
  onClose?: () => void;
}

export function EquipeDiversaGeneratorSafe({ 
  onTeamGenerated, 
  empresaSetor = 'tecnologia',
  empresaId,
  empresaNome,
  onClose
}: EquipeDiversaGeneratorProps) {
  const [sector, setSector] = useState(empresaSetor);
  const [teamSize, setTeamSize] = useState(8);
  const [generatedTeam, setGeneratedTeam] = useState<GeneratedPersona[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const nomesBrasileiros = {
    masculinos: [
      'João Silva', 'Carlos Santos', 'Pedro Oliveira', 'Rafael Costa', 'André Lima',
      'Bruno Ferreira', 'Ricardo Pereira', 'Fernando Alves', 'Diego Souza', 'Thiago Rodrigues',
      'Lucas Martins', 'Gabriel Nascimento', 'Felipe Araújo', 'Henrique Barbosa', 'Mateus Carvalho'
    ],
    femininos: [
      'Maria Oliveira', 'Ana Silva', 'Juliana Santos', 'Fernanda Costa', 'Camila Lima',
      'Mariana Ferreira', 'Larissa Pereira', 'Beatriz Alves', 'Vanessa Souza', 'Patricia Rodrigues',
      'Daniela Martins', 'Renata Nascimento', 'Carla Araújo', 'Priscila Barbosa', 'Tatiane Carvalho',
      'Simone Dias', 'Claudia Pereira', 'Monica Ribeiro', 'Sandra Gomes'
    ]
  };

  const cargosPorSetor = {
    tecnologia: [
      'Desenvolvedor Frontend', 'Desenvolvedor Backend', 'DevOps Engineer', 'UX/UI Designer',
      'Product Manager', 'Data Scientist', 'QA Engineer', 'Tech Lead'
    ],
    saude: [
      'Médico Clínico', 'Enfermeiro', 'Fisioterapeuta', 'Nutricionista',
      'Psicólogo', 'Farmacêutico', 'Técnico em Radiologia', 'Administrador Hospitalar'
    ],
    educacao: [
      'Professor de Matemática', 'Professor de Português', 'Coordenador Pedagógico', 'Psicólogo Educacional',
      'Bibliotecário', 'Professor de Educação Física', 'Orientador Educacional', 'Diretor Acadêmico'
    ],
    financeiro: [
      'Analista Financeiro', 'Contador', 'Auditor', 'Gerente de Investimentos',
      'Controller', 'Analista de Crédito', 'Consultor Tributário', 'CFO'
    ]
  };

  const handleTeamGeneration = async () => {
    setIsGenerating(true);
    try {
      const cargos = cargosPorSetor[sector as keyof typeof cargosPorSetor] || cargosPorSetor.tecnologia;
      const cargosSelecionados = cargos.slice(0, teamSize);
      
      const caracteristicasTime = realisticPersonaGenerator.generateDiverseTeam(
        sector, 
        teamSize, 
        cargosSelecionados
      );
      
      const equipe: GeneratedPersona[] = caracteristicasTime.map((caracteristicas, index) => {
        const cargo = cargosSelecionados[index];
        
        // Selecionar nome baseado em gênero implícito ou aleatório
        const nomes = Math.random() > 0.5 ? nomesBrasileiros.femininos : nomesBrasileiros.masculinos;
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        
        const descricao = realisticPersonaGenerator.generateDetailedDescription(caracteristicas);
        
        return {
          id: `persona_${Date.now()}_${index}`,
          nome,
          cargo,
          caracteristicas,
          descricao_completa: descricao
        };
      });
      
      setGeneratedTeam(equipe);
      
      if (onTeamGenerated) {
        onTeamGenerated(equipe);
      }
      
      toast({
        title: 'Equipe gerada com sucesso!',
        description: `${equipe.length} personas criadas com diversidade física autêntica`
      });
      
    } catch (error) {
      console.error('Erro na geração da equipe:', error);
      toast({
        title: 'Erro na geração',
        description: 'Não foi possível gerar a equipe diversa'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePersonaRegeneration = (index: number) => {
    // Regenerar persona específica mantendo o mesmo cargo
    const cargo = generatedTeam[index].cargo;
    const novaCaracteristica = realisticPersonaGenerator.generateDiverseTeam(sector, 1, [cargo])[0];
    const nomes = Math.random() > 0.5 ? nomesBrasileiros.femininos : nomesBrasileiros.masculinos;
    const novoNome = nomes[Math.floor(Math.random() * nomes.length)];
    
    const novaDescricao = realisticPersonaGenerator.generateDetailedDescription(novaCaracteristica);
    
    const novaPersona: GeneratedPersona = {
      id: `persona_${Date.now()}_${index}`,
      nome: novoNome,
      cargo,
      caracteristicas: novaCaracteristica,
      descricao_completa: novaDescricao
    };
    
    const novaEquipe = [...generatedTeam];
    novaEquipe[index] = novaPersona;
    setGeneratedTeam(novaEquipe);
  };

  const handleSaveTeamToDatabase = async () => {
    if (!generatedTeam.length) {
      toast({
        title: 'Erro',
        description: 'Nenhuma equipe foi gerada ainda'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Preparar dados das personas para salvar no banco
      const personasToSave = generatedTeam.map(persona => ({
        persona_code: `${empresaNome.replace(/\s+/g, '')}_${persona.nome.replace(/\s+/g, '')}_${Date.now()}`.toLowerCase(),
        full_name: persona.nome,
        role: persona.cargo,
        department: sector,
        email: `${persona.nome.toLowerCase().replace(/\s+/g, '.')}@${empresaNome.toLowerCase().replace(/\s+/g, '')}.com`,
        whatsapp: `+55${Math.floor(Math.random() * 90000000) + 10000000}`,
        empresa_id: empresaId,
        biografia_completa: persona.descricao_completa,
        descricao_fisica: persona.descricao_completa, // CRÍTICO: Salvar descrição física para consistência dos avatares
        personalidade: persona.caracteristicas || {},
        experiencia_anos: Math.floor(Math.random() * 20) + 5,
        status: 'active'
      }));

      // Inserir personas no banco de dados
      const { data, error } = await supabase
        .from('personas')
        .insert(personasToSave)
        .select();

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `${personasToSave.length} personas salvas no banco de dados com descrição física completa`
      });

      console.log('Personas salvas com descrição física:', data);
      
      // Fechar modal após salvamento
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Erro ao salvar equipe no banco:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar equipe no banco de dados'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    const dados = {
      setor: sector,
      total_personas: teamSize,
      data_geracao: new Date().toISOString(),
      equipe: generatedTeam.map(persona => ({
        nome: persona.nome,
        cargo: persona.cargo,
        descricao_fisica: persona.descricao_completa,
        caracteristicas_estruturadas: persona.caracteristicas
      }))
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equipe-diversa-${sector}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Gerador de Equipe Diversa e Realista (Versão Segura)
          </CardTitle>
          <CardDescription>
            Crie automaticamente personas com diversidade física autêntica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Setor de Negócio</Label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="tecnologia">Tecnologia</option>
                <option value="saude">Saúde</option>
                <option value="educacao">Educação</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho da Equipe</Label>
              <Input
                type="number"
                min="3"
                max="20"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleTeamGeneration}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Gerar Equipe
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipe Gerada */}
      {generatedTeam.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Equipe Diversa Gerada</span>
              <Badge variant="secondary">
                {generatedTeam.length} personas
              </Badge>
            </CardTitle>
            <CardDescription>
              Personas realistas com diversidade física autêntica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedTeam.map((persona, index) => (
                <Card key={persona.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{persona.nome}</h4>
                        <p className="text-sm text-gray-600">{persona.cargo}</p>
                      </div>
                      <Button
                        onClick={() => handlePersonaRegeneration(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">
                          {persona.caracteristicas.body_type}
                        </Badge>
                        <Badge variant="outline">
                          {persona.caracteristicas.age_range}
                        </Badge>
                        <Badge variant="outline">
                          {persona.caracteristicas.height}
                        </Badge>
                        <Badge variant="outline">
                          {persona.caracteristicas.ethnicity.split(' ')[0]}
                        </Badge>
                      </div>
                      
                      <Textarea
                        value={persona.descricao_completa}
                        readOnly
                        className="h-24 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleDownloadJSON}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar JSON
              </Button>
              
              <Button
                onClick={handleSaveTeamToDatabase}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar no Banco'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da Diversidade */}
      {generatedTeam.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Diversidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(generatedTeam.map(p => p.caracteristicas.body_type)).size}
                </div>
                <div className="text-sm text-gray-600">Tipos Corporais</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(generatedTeam.map(p => p.caracteristicas.age_range)).size}
                </div>
                <div className="text-sm text-gray-600">Faixas Etárias</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(generatedTeam.map(p => p.caracteristicas.ethnicity)).size}
                </div>
                <div className="text-sm text-gray-600">Etnias</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {generatedTeam.filter(p => p.caracteristicas.body_type === 'sobrepeso' || p.caracteristicas.body_type === 'obeso').length}
                </div>
                <div className="text-sm text-gray-600">Pessoas Gordinhas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}