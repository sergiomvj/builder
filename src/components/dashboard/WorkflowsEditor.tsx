
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Workflow, Plus, Trash2, Save, Filter, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface WorkflowsEditorProps {
  workflows: any[];
  team: any[];
  onUpdate: () => void;
  onSave: (workflows: any[]) => Promise<void>;
  projectId: string;
}

export default function WorkflowsEditor({ workflows, team, onUpdate, onSave, projectId }: WorkflowsEditorProps) {
  const [items, setItems] = useState<any[]>(workflows || []);
  const [filterPersona, setFilterPersona] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItems(workflows || []);
  }, [workflows]);

  const filteredItems = filterPersona === 'all'
    ? items
    : items.filter(w => w.personas?.nome === filterPersona || w.assigned_persona_role === filterPersona);

  const handleAdd = () => {
    setItems([...items, {
      task_title: 'New Workflow',
      task_description: '',
      status: 'identified',
      steps: [],
      tools_involved: [],
      is_new: true
    }]);
    setIsEditing(true);
  };

  const handleRemove = async (index: number) => {
    const newItems = [...items];
    const realIndex = items.findIndex(i => i === filteredItems[index]);
    newItems.splice(realIndex, 1);
    setItems(newItems);
    setIsEditing(true);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const realIndex = items.findIndex(i => i === filteredItems[index]);
    newItems[realIndex] = { ...newItems[realIndex], [field]: value };
    setItems(newItems);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      toast.success('Workflows saved!');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to save workflows');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <Select value={filterPersona} onValueChange={setFilterPersona}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Filter by Persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              {team.map((p, i) => (
                <SelectItem key={i} value={p.nome}>{p.nome} ({p.cargo})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          )}
          <Button size="sm" onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((wf, i) => (
          <Card key={i} className="border-l-4 border-l-orange-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <Input
                    value={wf.task_title}
                    onChange={(e) => handleChange(i, 'task_title', e.target.value)}
                    className="font-bold text-lg border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Workflow Title"
                  />
                  <Textarea
                    value={wf.task_description}
                    onChange={(e) => handleChange(i, 'task_description', e.target.value)}
                    className="text-slate-600 min-h-[60px] resize-none"
                    placeholder="Description"
                  />

                  <div className="flex gap-4 items-center">
                    <Select
                      value={wf.status || 'identified'}
                      onValueChange={(val) => handleChange(i, 'status', val)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="identified">Identified</SelectItem>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="implemented">Implemented</SelectItem>
                      </SelectContent>
                    </Select>

                    {(wf.personas || wf.assigned_persona_role) && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {wf.personas?.nome || team.find((t: any) => t.cargo === wf.assigned_persona_role || t.nome === wf.assigned_persona_role)?.nome || wf.assigned_persona_role}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => handleRemove(i, wf.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            No workflows found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
