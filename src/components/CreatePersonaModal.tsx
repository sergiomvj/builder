'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

interface CreatePersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  empresas: any[];
}

export default function CreatePersonaModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  empresas 
}: CreatePersonaModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  // Estados para dados básicos
  const [basicData, setBasicData] = useState({
    full_name: '',
    role: '',
    department: '',
    specialty: '',
    email: '',
    whatsapp: '',
    empresa_id: '',
    status: 'active' as 'active' | 'inactive',
    experiencia_anos: 0,
    temperatura_ia: 0.7
  });

  // Estados para biografia
  const [biografiaData, setBiografiaData] = useState({
    biografia: '',
    objetivos_profissionais: '',
    motivacoes: '',
    desafios: ''
  });

  // Estados para competências
  const [competencias, setCompetencias] = useState<Array<{
    tipo: 'tecnica' | 'comportamental';
    nome: string;
    nivel: number;
    descricao: string;
  }>>([]);

  // Estados para tech specs
  const [techSpecs, setTechSpecs] = useState({
    linguagens_programacao: [] as string[],
    frameworks: [] as string[],
    ferramentas: [] as string[]
  });

  // Estados temporários para adicionar itens
  const [newCompetencia, setNewCompetencia] = useState({
    tipo: 'tecnica' as 'tecnica' | 'comportamental',
    nome: '',
    nivel: 1,
    descricao: ''
  });

  const [newTech, setNewTech] = useState('');
  const [newTechType, setNewTechType] = useState<'linguagens_programacao' | 'frameworks' | 'ferramentas'>('linguagens_programacao');

  const addCompetencia = () => {
    if (newCompetencia.nome.trim()) {
      setCompetencias([...competencias, { ...newCompetencia }]);
      setNewCompetencia({
        tipo: 'tecnica',
        nome: '',
        nivel: 1,
        descricao: ''
      });
    }
  };

  const removeCompetencia = (index: number) => {
    setCompetencias(competencias.filter((_, i) => i !== index));
  };

  const addTech = () => {
    if (newTech.trim()) {
      setTechSpecs({
        ...techSpecs,
        [newTechType]: [...techSpecs[newTechType], newTech.trim()]
      });
      setNewTech('');
    }
  };

  const removeTech = (type: keyof typeof techSpecs, index: number) => {
    setTechSpecs({
      ...techSpecs,
      [type]: techSpecs[type].filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    if (!basicData.full_name || !basicData.role || !basicData.empresa_id) {
      toast({
        title: 'Erro',
        description: 'Nome, cargo e empresa são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Criar persona
      const persona = await DatabaseService.createPersona({
        ...basicData,
        persona_code: `${basicData.full_name.replace(/\s+/g, '').toLowerCase()}_${Date.now()}`
      });

      // Criar biografia se preenchida
      if (biografiaData.biografia) {
        await DatabaseService.createPersonaBiografia({
          persona_id: persona.id,
          ...biografiaData
        });
      }

      // Criar competências
      for (const comp of competencias) {
        await DatabaseService.createCompetencia({
          persona_id: persona.id,
          ...comp
        });
      }

      // Criar tech specs se preenchidas
      if (techSpecs.linguagens_programacao.length || 
          techSpecs.frameworks.length || 
          techSpecs.ferramentas.length) {
        await DatabaseService.createPersonaTechSpecs({
          persona_id: persona.id,
          ...techSpecs
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Persona criada com sucesso!'
      });

      onSuccess();
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error('Erro ao criar persona:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar persona',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBasicData({
      full_name: '',
      role: '',
      department: '',
      specialty: '',
      email: '',
      whatsapp: '',
      empresa_id: '',
      status: 'active',
      experiencia_anos: 0,
      temperatura_ia: 0.7
    });
    setBiografiaData({
      biografia: '',
      objetivos_profissionais: '',
      motivacoes: '',
      desafios: ''
    });
    setCompetencias([]);
    setTechSpecs({
      linguagens_programacao: [],
      frameworks: [],
      ferramentas: []
    });
    setActiveTab('basic');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Persona</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="bio">Biografia</TabsTrigger>
            <TabsTrigger value="skills">Competências</TabsTrigger>
            <TabsTrigger value="tech">Tech Specs</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={basicData.full_name}
                  onChange={(e) => setBasicData({...basicData, full_name: e.target.value})}
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <Label htmlFor="role">Cargo *</Label>
                <Input
                  id="role"
                  value={basicData.role}
                  onChange={(e) => setBasicData({...basicData, role: e.target.value})}
                  placeholder="Ex: CEO, CTO, SDR Manager"
                />
              </div>

              <div>
                <Label htmlFor="empresa">Empresa *</Label>
                <Select value={basicData.empresa_id} onValueChange={(value) => setBasicData({...basicData, empresa_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome} ({empresa.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Departamento</Label>
                <Select value={basicData.department} onValueChange={(value) => setBasicData({...basicData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executivo">Executivo</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="operacoes">Operações</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  value={basicData.specialty}
                  onChange={(e) => setBasicData({...basicData, specialty: e.target.value})}
                  placeholder="Ex: Vendas B2B, Machine Learning"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={basicData.status} onValueChange={(value: 'active' | 'inactive') => setBasicData({...basicData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={basicData.email}
                  onChange={(e) => setBasicData({...basicData, email: e.target.value})}
                  placeholder="Ex: maria@empresa.com"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={basicData.whatsapp}
                  onChange={(e) => setBasicData({...basicData, whatsapp: e.target.value})}
                  placeholder="Ex: +55 11 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="experiencia">Anos de Experiência</Label>
                <Input
                  id="experiencia"
                  type="number"
                  min="0"
                  value={basicData.experiencia_anos}
                  onChange={(e) => setBasicData({...basicData, experiencia_anos: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label htmlFor="temperatura">Temperatura IA (0-1)</Label>
                <Input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={basicData.temperatura_ia}
                  onChange={(e) => setBasicData({...basicData, temperatura_ia: parseFloat(e.target.value) || 0.7})}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bio" className="space-y-4">
            <div>
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea
                id="biografia"
                rows={4}
                value={biografiaData.biografia}
                onChange={(e) => setBiografiaData({...biografiaData, biografia: e.target.value})}
                placeholder="Descreva a história profissional e pessoal da persona..."
              />
            </div>

            <div>
              <Label htmlFor="objetivos">Objetivos Profissionais</Label>
              <Textarea
                id="objetivos"
                rows={3}
                value={biografiaData.objetivos_profissionais}
                onChange={(e) => setBiografiaData({...biografiaData, objetivos_profissionais: e.target.value})}
                placeholder="Quais são os objetivos de carreira?"
              />
            </div>

            <div>
              <Label htmlFor="motivacoes">Motivações</Label>
              <Textarea
                id="motivacoes"
                rows={3}
                value={biografiaData.motivacoes}
                onChange={(e) => setBiografiaData({...biografiaData, motivacoes: e.target.value})}
                placeholder="O que motiva esta pessoa?"
              />
            </div>

            <div>
              <Label htmlFor="desafios">Desafios</Label>
              <Textarea
                id="desafios"
                rows={3}
                value={biografiaData.desafios}
                onChange={(e) => setBiografiaData({...biografiaData, desafios: e.target.value})}
                placeholder="Quais são os principais desafios?"
              />
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            {/* Adicionar competência */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Adicionar Competência</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newCompetencia.tipo} onValueChange={(value: 'tecnica' | 'comportamental') => setNewCompetencia({...newCompetencia, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnica">Técnica</SelectItem>
                      <SelectItem value="comportamental">Comportamental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nome</Label>
                  <Input
                    value={newCompetencia.nome}
                    onChange={(e) => setNewCompetencia({...newCompetencia, nome: e.target.value})}
                    placeholder="Ex: React, Liderança"
                  />
                </div>

                <div>
                  <Label>Nível (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={newCompetencia.nivel}
                    onChange={(e) => setNewCompetencia({...newCompetencia, nivel: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={newCompetencia.descricao}
                    onChange={(e) => setNewCompetencia({...newCompetencia, descricao: e.target.value})}
                    placeholder="Breve descrição"
                  />
                </div>
              </div>
              <Button onClick={addCompetencia} className="mt-3">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Lista de competências */}
            <div>
              <h4 className="font-medium mb-3">Competências ({competencias.length})</h4>
              <div className="space-y-2">
                {competencias.map((comp, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{comp.nome}</span>
                      <Badge variant={comp.tipo === 'tecnica' ? 'default' : 'secondary'} className="ml-2">
                        {comp.tipo}
                      </Badge>
                      <span className="ml-2 text-sm text-gray-600">Nível {comp.nivel}/5</span>
                      {comp.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{comp.descricao}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCompetencia(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tech" className="space-y-4">
            {/* Adicionar tecnologia */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Adicionar Tecnologia</h4>
              <div className="flex gap-3">
                <Select value={newTechType} onValueChange={(value: any) => setNewTechType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linguagens_programacao">Linguagens</SelectItem>
                    <SelectItem value="frameworks">Frameworks</SelectItem>
                    <SelectItem value="ferramentas">Ferramentas</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="Ex: JavaScript, React, Docker"
                  onKeyPress={(e) => e.key === 'Enter' && addTech()}
                />
                <Button onClick={addTech}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Listas de tecnologias */}
            {Object.entries(techSpecs).map(([key, values]) => (
              <div key={key}>
                <h4 className="font-medium mb-2 capitalize">
                  {key.replace('_', ' ')} ({values.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {values.map((tech, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tech}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTech(key as keyof typeof techSpecs, index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            {activeTab !== 'basic' && (
              <Button variant="outline" onClick={() => {
                const tabs = ['basic', 'bio', 'skills', 'tech'];
                const currentIndex = tabs.indexOf(activeTab);
                setActiveTab(tabs[currentIndex - 1]);
              }}>
                Anterior
              </Button>
            )}
            {activeTab !== 'tech' ? (
              <Button onClick={() => {
                const tabs = ['basic', 'bio', 'skills', 'tech'];
                const currentIndex = tabs.indexOf(activeTab);
                setActiveTab(tabs[currentIndex + 1]);
              }}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Persona'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}