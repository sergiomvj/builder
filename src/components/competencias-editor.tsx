'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Save, 
  Star,
  Code,
  Users,
  Lightbulb,
  Target,
  Edit
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Competencia {
  id: string;
  nome: string;
  categoria: 'tecnica' | 'comportamental' | 'linguagem' | 'ferramenta';
  nivel: number;
  experiencia_anos?: number;
  certificacoes?: string[];
  projetos_relevantes?: string[];
  descricao?: string;
  validada: boolean;
}

interface CompetenciasEditorProps {
  persona: any;
  onUpdate?: (competencias: { tecnicas: Competencia[], comportamentais: Competencia[] }) => void;
  readOnly?: boolean;
}

export function CompetenciasEditor({ 
  persona, 
  onUpdate, 
  readOnly = false 
}: CompetenciasEditorProps) {
  const [competenciasTecnicas, setCompetenciasTecnicas] = useState<Competencia[]>(
    persona.competencias_tecnicas || []
  );
  const [competenciasComportamentais, setCompetenciasComportamentais] = useState<Competencia[]>(
    persona.competencias_comportamentais || []
  );
  const [editingCompetencia, setEditingCompetencia] = useState<Competencia | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompetenciaType, setNewCompetenciaType] = useState<'tecnica' | 'comportamental'>('tecnica');
  
  const { toast } = useToast();

  const nivelLabels = {
    1: { label: 'Iniciante', color: 'bg-red-100 text-red-800' },
    2: { label: 'Básico', color: 'bg-orange-100 text-orange-800' },
    3: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800' },
    4: { label: 'Avançado', color: 'bg-blue-100 text-blue-800' },
    5: { label: 'Expert', color: 'bg-green-100 text-green-800' }
  };

  const categoriaIcons = {
    tecnica: Code,
    comportamental: Users,
    linguagem: Lightbulb,
    ferramenta: Target
  };

  const handleAddCompetencia = (competencia: Omit<Competencia, 'id'>) => {
    const newCompetencia: Competencia = {
      ...competencia,
      id: `comp_${Date.now()}`,
      validada: false
    };

    if (competencia.categoria === 'tecnica' || competencia.categoria === 'linguagem' || competencia.categoria === 'ferramenta') {
      setCompetenciasTecnicas(prev => [...prev, newCompetencia]);
    } else {
      setCompetenciasComportamentais(prev => [...prev, newCompetencia]);
    }

    setShowAddForm(false);
    saveChanges();
    
    toast({
      title: 'Competência adicionada!',
      description: `${competencia.nome} foi adicionada com sucesso.`
    });
  };

  const handleUpdateCompetencia = (id: string, updates: Partial<Competencia>) => {
    const updateList = (list: Competencia[]) => 
      list.map(comp => comp.id === id ? { ...comp, ...updates } : comp);

    setCompetenciasTecnicas(updateList);
    setCompetenciasComportamentais(updateList);
    setEditingCompetencia(null);
    saveChanges();
  };

  const handleDeleteCompetencia = (id: string) => {
    setCompetenciasTecnicas(prev => prev.filter(comp => comp.id !== id));
    setCompetenciasComportamentais(prev => prev.filter(comp => comp.id !== id));
    saveChanges();
    
    toast({
      title: 'Competência removida',
      description: 'A competência foi removida com sucesso.'
    });
  };

  const saveChanges = () => {
    if (onUpdate) {
      onUpdate({
        tecnicas: competenciasTecnicas,
        comportamentais: competenciasComportamentais
      });
    }
  };

  const renderCompetenciaCard = (competencia: Competencia) => {
    const IconComponent = categoriaIcons[competencia.categoria];
    const nivelInfo = nivelLabels[competencia.nivel as keyof typeof nivelLabels];

    return (
      <Card key={competencia.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconComponent size={16} className="text-blue-600" />
              <h4 className="font-medium">{competencia.nome}</h4>
              {competencia.validada && (
                <Badge variant="secondary" className="text-xs">
                  Validada
                </Badge>
              )}
            </div>
            
            {!readOnly && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCompetencia(competencia)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCompetencia(competencia.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={nivelInfo.color}>
                {nivelInfo.label}
              </Badge>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Star
                    key={level}
                    size={14}
                    className={
                      level <= competencia.nivel
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
            </div>

            {competencia.experiencia_anos && (
              <p className="text-sm text-gray-600">
                {competencia.experiencia_anos} anos de experiência
              </p>
            )}

            {competencia.descricao && (
              <p className="text-sm text-gray-700">{competencia.descricao}</p>
            )}

            {competencia.certificacoes && competencia.certificacoes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {competencia.certificacoes.map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cert}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {competenciasTecnicas.length}
            </div>
            <div className="text-sm text-gray-600">Competências Técnicas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {competenciasComportamentais.length}
            </div>
            <div className="text-sm text-gray-600">Competências Comportamentais</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {[...competenciasTecnicas, ...competenciasComportamentais]
                .filter(c => c.validada).length}
            </div>
            <div className="text-sm text-gray-600">Validadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Competências Técnicas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code size={20} />
                Competências Técnicas
              </CardTitle>
              <CardDescription>
                Habilidades técnicas, linguagens de programação, ferramentas
              </CardDescription>
            </div>
            {!readOnly && (
              <Button
                onClick={() => {
                  setNewCompetenciaType('tecnica');
                  setShowAddForm(true);
                }}
                size="sm"
              >
                <Plus size={16} className="mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competenciasTecnicas.map(renderCompetenciaCard)}
            
            {competenciasTecnicas.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhuma competência técnica cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competências Comportamentais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Competências Comportamentais
              </CardTitle>
              <CardDescription>
                Soft skills, liderança, comunicação, trabalho em equipe
              </CardDescription>
            </div>
            {!readOnly && (
              <Button
                onClick={() => {
                  setNewCompetenciaType('comportamental');
                  setShowAddForm(true);
                }}
                size="sm"
              >
                <Plus size={16} className="mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competenciasComportamentais.map(renderCompetenciaCard)}
            
            {competenciasComportamentais.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhuma competência comportamental cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Adição/Edição */}
      {(showAddForm || editingCompetencia) && (
        <CompetenciaFormModal
          competencia={editingCompetencia}
          isOpen={showAddForm || !!editingCompetencia}
          onClose={() => {
            setShowAddForm(false);
            setEditingCompetencia(null);
          }}
          onSave={(competencia) => {
            if (editingCompetencia) {
              handleUpdateCompetencia(editingCompetencia.id, competencia);
            } else {
              handleAddCompetencia({
                ...competencia,
                categoria: newCompetenciaType,
                validada: false
              });
            }
          }}
          defaultType={newCompetenciaType}
        />
      )}
    </div>
  );
}

// Modal para adicionar/editar competências
function CompetenciaFormModal({
  competencia,
  isOpen,
  onClose,
  onSave,
  defaultType = 'tecnica'
}: {
  competencia?: Competencia | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (competencia: Omit<Competencia, 'id' | 'validada'>) => void;
  defaultType?: 'tecnica' | 'comportamental';
}) {
  const [formData, setFormData] = useState({
    nome: competencia?.nome || '',
    categoria: competencia?.categoria || defaultType,
    nivel: competencia?.nivel || 3,
    experiencia_anos: competencia?.experiencia_anos || 0,
    descricao: competencia?.descricao || '',
    certificacoes: competencia?.certificacoes?.join(', ') || '',
    projetos_relevantes: competencia?.projetos_relevantes?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      nome: formData.nome,
      categoria: formData.categoria as any,
      nivel: formData.nivel,
      experiencia_anos: formData.experiencia_anos || undefined,
      descricao: formData.descricao || undefined,
      certificacoes: formData.certificacoes 
        ? formData.certificacoes.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
      projetos_relevantes: formData.projetos_relevantes
        ? formData.projetos_relevantes.split(',').map(s => s.trim()).filter(Boolean)
        : undefined
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-semibold mb-4">
          {competencia ? 'Editar Competência' : 'Nova Competência'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Competência</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: React, Liderança, Python"
                required
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnica">Técnica</SelectItem>
                  <SelectItem value="comportamental">Comportamental</SelectItem>
                  <SelectItem value="linguagem">Linguagem</SelectItem>
                  <SelectItem value="ferramenta">Ferramenta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nível de Proficiência: {formData.nivel}/5</Label>
            <Slider
              value={[formData.nivel]}
              onValueChange={([value]) => setFormData(prev => ({ ...prev, nivel: value }))}
              min={1}
              max={5}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Iniciante</span>
              <span>Expert</span>
            </div>
          </div>

          <div>
            <Label>Anos de Experiência</Label>
            <Input
              type="number"
              value={formData.experiencia_anos}
              onChange={(e) => setFormData(prev => ({ ...prev, experiencia_anos: Number(e.target.value) }))}
              min="0"
              max="50"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva sua experiência e conhecimento..."
              rows={3}
            />
          </div>

          <div>
            <Label>Certificações (separadas por vírgula)</Label>
            <Input
              value={formData.certificacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, certificacoes: e.target.value }))}
              placeholder="AWS Solutions Architect, Scrum Master..."
            />
          </div>

          <div>
            <Label>Projetos Relevantes (separados por vírgula)</Label>
            <Input
              value={formData.projetos_relevantes}
              onChange={(e) => setFormData(prev => ({ ...prev, projetos_relevantes: e.target.value }))}
              placeholder="Sistema de CRM, App Mobile..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              <Save size={16} className="mr-1" />
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}