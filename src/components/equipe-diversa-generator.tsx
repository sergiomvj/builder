'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { realisticPersonaGenerator, type PhysicalCharacteristics } from '@/lib/realistic-persona-generator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Wand2, 
  RefreshCw, 
  Save, 
  Eye,
  Download,
  Shuffle
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
}

export function EquipeDiversaGenerator({ 
  onTeamGenerated, 
  empresaSetor = 'tecnologia' 
}: EquipeDiversaGeneratorProps) {
  const [sector, setSector] = useState(empresaSetor);
  const [teamSize, setTeamSize] = useState(8);
  const [generatedTeam, setGeneratedTeam] = useState<GeneratedPersona[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [diversityLevel, setDiversityLevel] = useState<'alta' | 'média' | 'baixa'>('alta');
  
  const { toast } = useToast();

  // Cargos típicos por setor
  const cargosPorSetor = {
    tecnologia: [
      'CEO', 'CTO', 'Desenvolvedor Senior', 'UX Designer', 
      'Product Manager', 'DevOps Engineer', 'Analista de Dados',
      'Desenvolvedor Frontend', 'Desenvolvedor Backend', 'QA Engineer'
    ],
    saude: [
      'Diretor Médico', 'Enfermeiro Chefe', 'Médico Clínico', 'Fisioterapeuta',
      'Técnico em Enfermagem', 'Recepcionista', 'Administrador Hospitalar',
      'Farmacêutico', 'Nutricionista', 'Psicólogo'
    ],
    educacao: [
      'Diretor Pedagógico', 'Coordenador Acadêmico', 'Professor Senior',
      'Professor Junior', 'Bibliotecário', 'Secretário Escolar',
      'Orientador Educacional', 'Professor de Educação Física',
      'Professor de Arte', 'Auxiliar Administrativo'
    ],
    financeiro: [
      'CEO', 'CFO', 'Gerente de Investimentos', 'Analista Financeiro',
      'Contador Senior', 'Auditor', 'Gerente de Relacionamento',
      'Assistente Financeiro', 'Caixa', 'Consultor Financeiro'
    ],
    varejo: [
      'Gerente Geral', 'Supervisor de Vendas', 'Vendedor Experiente',
      'Caixa', 'Estoquista', 'Visual Merchandiser',
      'Atendente', 'Operador de Loja', 'Coordenador de Logística',
      'Auxiliar de Limpeza'
    ],
    industria: [
      'Diretor Industrial', 'Engenheiro de Produção', 'Supervisor de Linha',
      'Operador de Máquina', 'Técnico de Manutenção', 'Controlador de Qualidade',
      'Auxiliar de Produção', 'Engenheiro de Segurança', 'Almoxarife',
      'Operador de Empilhadeira'
    ]
  };

  const nomesBrasileiros = {
    masculinos: [
      'José Carlos', 'Antonio Silva', 'João Pedro', 'Carlos Eduardo',
      'Rafael Santos', 'Lucas Oliveira', 'Felipe Costa', 'Bruno Almeida',
      'Rodrigo Lima', 'Marcelo Ferreira', 'André Barbosa', 'Paulo Henrique',
      'Ricardo Souza', 'Gustavo Rocha', 'Daniel Martins', 'Fernando Dias'
    ],
    femininos: [
      'Maria Silva', 'Ana Paula', 'Juliana Santos', 'Patricia Oliveira',
      'Fernanda Costa', 'Carla Almeida', 'Mariana Lima', 'Luciana Ferreira',
      'Gabriela Barbosa', 'Renata Souza', 'Cristina Rocha', 'Vanessa Martins',
      'Simone Dias', 'Claudia Pereira', 'Monica Ribeiro', 'Sandra Gomes'
    ]
  };

  const gerarEquipeDiversa = useCallback(async () => {
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
      
      toast({
        title: 'Equipe diversa gerada!',
        description: `${teamSize} personas realistas criadas para o setor ${sector}.`
      });
      
      if (onTeamGenerated) {
        onTeamGenerated(equipe);
      }
      
    } catch (error) {
      toast({
        title: 'Erro na geração',
        description: 'Não foi possível gerar a equipe diversa.'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [sector, teamSize, diversityLevel, toast, onTeamGenerated]);

  const regenerarPersona = useCallback(async (index: number) => {
    try {
      const persona = generatedTeam[index];
      const novasCaracteristicas = realisticPersonaGenerator.generateRealisticCharacteristics(
        sector,
        persona.cargo,
        undefined,
        diversityLevel
      );
      
      const novaDescricao = realisticPersonaGenerator.generateDetailedDescription(novasCaracteristicas);
      
      const equipeAtualizada = [...generatedTeam];
      equipeAtualizada[index] = {
        ...persona,
        caracteristicas: novasCaracteristicas,
        descricao_completa: novaDescricao
      };
      
      setGeneratedTeam(equipeAtualizada);
      
      toast({
        title: 'Persona atualizada!',
        description: `${persona.nome} teve suas características renovadas.`
      });
      
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível regenerar a persona.'
      });
    }
  }, [sector, diversityLevel, generatedTeam, toast]);

  const exportarEquipe = () => {
    const dados = {
      setor: sector,
      nivel_diversidade: diversityLevel,
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
    document.body.removeChild(link);
    
    toast({
      title: 'Equipe exportada!',
      description: 'Arquivo JSON baixado com sucesso.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Gerador de Equipe Diversa e Realista
          </CardTitle>
          <CardDescription>
            Crie automaticamente personas com diversidade física autêntica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Setor de Negócio</Label>
              <Select value={sector} onValueChange={setSector}>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho da Equipe</Label>
              <Input
                type="number"
                value={teamSize.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setTeamSize(Math.max(1, Math.min(20, value)));
                  }
                }}
                min={1}
                max={20}
              />
            </div>

            <div className="space-y-2">
              <Label>Nível de Diversidade</Label>
              <Select value={diversityLevel} onValueChange={(value) => setDiversityLevel(value as 'alta' | 'média' | 'baixa')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta (Máxima variação)</SelectItem>
                  <SelectItem value="média">Média (Balanceada)</SelectItem>
                  <SelectItem value="baixa">Baixa (Mais uniforme)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={gerarEquipeDiversa} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Equipe...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Gerar Equipe Diversa
                </>
              )}
            </Button>

            {generatedTeam.length > 0 && (
              <Button onClick={exportarEquipe} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            )}
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
                        onClick={() => regenerarPersona(index)}
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
                        className="text-sm"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
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