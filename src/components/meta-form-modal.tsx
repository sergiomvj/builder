'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, X, Calendar, DollarSign, User,
  Rocket, Settings, Lightbulb, Leaf, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface MetaGlobal {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'crescimento' | 'operacional' | 'financeira' | 'inovacao' | 'sustentabilidade';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  prazo: string;
  responsavel_principal: string;
  budget_estimado: number;
  roi_esperado: number;
  indicadores_sucesso: string[];
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada';
  progresso: number;
}

interface MetaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meta: Partial<MetaGlobal>) => void;
  metaInicial?: MetaGlobal | null;
}

export function MetaFormModal({ metaInicial, isOpen, onClose, onSave }: MetaFormModalProps) {
  const [formData, setFormData] = useState<Partial<MetaGlobal>>({
    titulo: '',
    descricao: '',
    categoria: 'crescimento',
    prioridade: 'media',
    prazo: '',
    responsavel_principal: '',
    budget_estimado: 0,
    roi_esperado: 0,
    indicadores_sucesso: [],
    status: 'ativa',
    progresso: 0
  });

  const [novoIndicador, setNovoIndicador] = useState('');

  // Resetar formulário quando o modal abrir/fechar ou mudar a meta
  useEffect(() => {
    if (isOpen) {
      if (metaInicial) {
        setFormData(metaInicial);
      } else {
        setFormData({
          titulo: '',
          descricao: '',
          categoria: 'crescimento',
          prioridade: 'media',
          prazo: '',
          responsavel_principal: '',
          budget_estimado: 0,
          roi_esperado: 0,
          indicadores_sucesso: [],
          status: 'ativa',
          progresso: 0
        });
      }
    }
  }, [isOpen, metaInicial]);

  const categorias = [
    { value: 'crescimento', label: 'Crescimento', icon: Rocket, color: 'blue' },
    { value: 'financeira', label: 'Financeira', icon: DollarSign, color: 'green' },
    { value: 'operacional', label: 'Operacional', icon: Settings, color: 'orange' },
    { value: 'inovacao', label: 'Inovação', icon: Lightbulb, color: 'purple' },
    { value: 'sustentabilidade', label: 'Sustentabilidade', icon: Leaf, color: 'emerald' }
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa', color: 'gray' },
    { value: 'media', label: 'Média', color: 'yellow' },
    { value: 'alta', label: 'Alta', color: 'orange' },
    { value: 'critica', label: 'Crítica', color: 'red' }
  ];

  const handleSave = () => {
    console.log('Dados do formulário antes da validação:', formData);
    
    if (!formData.titulo?.trim()) {
      alert('Título da meta é obrigatório');
      return;
    }
    
    if (!formData.responsavel_principal?.trim()) {
      alert('Responsável principal é obrigatório');
      return;
    }
    
    if (!formData.prazo) {
      alert('Prazo é obrigatório');
      return;
    }
    
    console.log('Enviando dados da meta:', formData);
    onSave(formData);
    onClose();
  };

  const adicionarIndicador = () => {
    if (novoIndicador.trim()) {
      setFormData(prev => ({
        ...prev,
        indicadores_sucesso: [...(prev.indicadores_sucesso || []), novoIndicador.trim()]
      }));
      setNovoIndicador('');
    }
  };

  const removerIndicador = (index: number) => {
    setFormData(prev => ({
      ...prev,
      indicadores_sucesso: (prev.indicadores_sucesso || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {metaInicial ? 'Editar Meta Global' : 'Nova Meta Global'}
          </DialogTitle>
          <DialogDescription>
            Configure uma nova meta corporativa com indicadores e responsáveis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título da Meta *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Crescimento de receita 300% em 2026"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva os detalhes e contexto da meta..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    categoria: value as MetaGlobal['categoria'] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade *</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    prioridade: value as MetaGlobal['prioridade'] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioridades.map((prio) => (
                      <SelectItem key={prio.value} value={prio.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${prio.color}-500`} />
                          {prio.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cronograma e Responsabilidade */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prazo">Prazo Final *</Label>
                <Input
                  id="prazo"
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData(prev => ({ ...prev, prazo: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável Principal *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel_principal: e.target.value }))}
                  placeholder="Ex: CEO Maria Silva"
                />
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Informações Financeiras</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget Estimado (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget_estimado}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budget_estimado: Number(e.target.value) 
                  }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="roi">ROI Esperado (%)</Label>
                <Input
                  id="roi"
                  type="number"
                  value={formData.roi_esperado}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    roi_esperado: Number(e.target.value) 
                  }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Indicadores de Sucesso */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Indicadores de Sucesso</h4>
            
            <div className="flex gap-2">
              <Input
                value={novoIndicador}
                onChange={(e) => setNovoIndicador(e.target.value)}
                placeholder="Ex: Aumento de 50% no MRR"
                onKeyPress={(e) => e.key === 'Enter' && adicionarIndicador()}
              />
              <Button type="button" onClick={adicionarIndicador} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {(formData.indicadores_sucesso || []).map((indicador, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1 justify-between">
                    {indicador}
                    <button
                      onClick={() => removerIndicador(index)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Status e Progresso */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    status: value as MetaGlobal['status'] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="progresso">Progresso (%)</Label>
                <Input
                  id="progresso"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progresso}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    progresso: Number(e.target.value) 
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar Meta
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}