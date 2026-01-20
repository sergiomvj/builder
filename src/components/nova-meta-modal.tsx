'use client';

import { useState } from 'react';
import { X, Save, Target, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface NovaMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (metaData: any) => void;
  selectedPersona?: string;
}

export function NovaMetaModal({ isOpen, onClose, onSave, selectedPersona }: NovaMetaModalProps) {
  const [metaData, setMetaData] = useState({
    titulo: '',
    descricao: '',
    data_limite: '',
    status: 'pendente',
    tipo: 'desenvolvimento',
    progresso: 0
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setMetaData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!metaData.titulo.trim()) {
      alert('Título é obrigatório');
      return;
    }

    onSave?.({
      ...metaData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      persona_id: selectedPersona || 'geral'
    });
    
    // Reset form
    setMetaData({
      titulo: '',
      descricao: '',
      data_limite: '',
      status: 'pendente',
      tipo: 'desenvolvimento',
      progresso: 0
    });
    
    setHasChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('Existem alterações não salvas. Deseja continuar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nova Meta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              <span className="flex items-center gap-2">
                <FileText size={16} />
                Título da Meta *
              </span>
            </Label>
            <Input
              id="titulo"
              value={metaData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ex: Aumentar produtividade em 25%"
              className="w-full"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição Detalhada</Label>
            <Textarea
              id="descricao"
              value={metaData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descreva os detalhes da meta, como será medida e quais são os critérios de sucesso..."
              className="min-h-[100px]"
            />
          </div>

          {/* Data Limite e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-limite">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Data Limite
                </span>
              </Label>
              <Input
                id="data-limite"
                type="date"
                value={metaData.data_limite}
                onChange={(e) => handleChange('data_limite', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Inicial</Label>
              <select
                id="status"
                value={metaData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="pendente">Pendente</option>
                <option value="em_progresso">Em Progresso</option>
                <option value="concluida">Concluída</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>
          </div>

          {/* Tipo e Progresso */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Categoria</Label>
              <select
                id="tipo"
                value={metaData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="desenvolvimento">Desenvolvimento</option>
                <option value="performance">Performance</option>
                <option value="qualidade">Qualidade</option>
                <option value="inovacao">Inovação</option>
                <option value="colaboracao">Colaboração</option>
                <option value="lideranca">Liderança</option>
                <option value="financeiro">Financeiro</option>
                <option value="estrategico">Estratégico</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progresso">
                <span className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Progresso Inicial (%)
                </span>
              </Label>
              <Input
                id="progresso"
                type="number"
                min="0"
                max="100"
                value={metaData.progresso}
                onChange={(e) => handleChange('progresso', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Preview da Meta */}
          {metaData.titulo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Preview da Meta:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Título:</strong> {metaData.titulo}</div>
                {metaData.descricao && (
                  <div><strong>Descrição:</strong> {metaData.descricao.substring(0, 100)}{metaData.descricao.length > 100 ? '...' : ''}</div>
                )}
                <div><strong>Categoria:</strong> {metaData.tipo}</div>
                <div><strong>Status:</strong> {metaData.status}</div>
                {metaData.data_limite && (
                  <div><strong>Data Limite:</strong> {new Date(metaData.data_limite).toLocaleDateString('pt-BR')}</div>
                )}
                <div><strong>Progresso:</strong> {metaData.progresso}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedPersona ? 'Meta será atribuída à persona selecionada' : 'Meta será criada como objetivo geral'}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!metaData.titulo.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Criar Meta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}