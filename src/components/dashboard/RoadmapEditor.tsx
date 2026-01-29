
import { useState } from 'react';
import { ProjectRoadmapPhase } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RoadmapEditorProps {
  roadmap: ProjectRoadmapPhase[];
  onSave: (roadmap: ProjectRoadmapPhase[]) => void;
}

export default function RoadmapEditor({ roadmap, onSave }: RoadmapEditorProps) {
  const [items, setItems] = useState<ProjectRoadmapPhase[]>(roadmap || []);
  const [isEditing, setIsEditing] = useState(false);

  const handleAdd = () => {
    setItems([...items, { phase: 'New Phase', duration: '1 month', deliverables: [] }]);
    setIsEditing(true);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    setIsEditing(true);
  };

  const handleChange = (index: number, field: keyof ProjectRoadmapPhase, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setIsEditing(true);
  };

  const handleDeliverableAdd = (index: number) => {
    const newItems = [...items];
    // Default to object structure now
    newItems[index].deliverables = [...(newItems[index].deliverables || []), { area: 'General', task: 'New Deliverable' }];
    setItems(newItems);
    setIsEditing(true);
  };

  const handleDeliverableChange = (phaseIndex: number, delIndex: number, value: string) => {
    const newItems = [...items];
    newItems[phaseIndex].deliverables[delIndex] = value;
    setItems(newItems);
    setIsEditing(true);
  };

  const handleDeliverableTaskChange = (phaseIndex: number, delIndex: number, value: string) => {
    const newItems = [...items];
    const item = newItems[phaseIndex].deliverables[delIndex];
    if (typeof item !== 'string') {
      newItems[phaseIndex].deliverables[delIndex] = { ...item, task: value };
      setItems(newItems);
      setIsEditing(true);
    }
  };

  const handleDeliverableRemove = (phaseIndex: number, delIndex: number) => {
    const newItems = [...items];
    newItems[phaseIndex].deliverables.splice(delIndex, 1);
    setItems(newItems);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(items);
    setIsEditing(false);
    toast.success('Roadmap updated locally.');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Roadmap
        </CardTitle>
        <div className="flex gap-2">
          {isEditing && (
            <Button size="sm" onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" /> Done
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Phase
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 relative border-l-2 border-blue-100 ml-3 pl-6 py-2">
          {items.map((phase, i) => (
            <div key={i} className="relative group">
              <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />

              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemove(i)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex gap-2 items-center mb-2">
                <Input
                  value={phase.phase}
                  onChange={(e) => handleChange(i, 'phase', e.target.value)}
                  className="font-bold text-slate-900 w-1/2"
                  placeholder="Phase Name"
                />
                <Input
                  value={phase.duration}
                  onChange={(e) => handleChange(i, 'duration', e.target.value)}
                  className="text-sm font-normal text-slate-500 w-1/3"
                  placeholder="Duration"
                />
              </div>

              <div className="pl-2 border-l-2 border-slate-100 ml-1">
                <ul className="space-y-2">
                  {phase.deliverables?.map((d: any, j) => (
                    <li key={j} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      {typeof d === 'string' ? (
                        <Input
                          value={d}
                          onChange={(e) => handleDeliverableChange(i, j, e.target.value)}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <div className="flex gap-1 w-full">
                          <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1 rounded h-7 flex items-center">{d.area}</span>
                          <Input
                            value={d.task}
                            onChange={(e) => handleDeliverableTaskChange(i, j, e.target.value)}
                            className="h-7 text-sm flex-1"
                            placeholder="Task description"
                          />
                        </div>
                      )}
                      <button onClick={() => handleDeliverableRemove(i, j)} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-600" onClick={() => handleDeliverableAdd(i)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Deliverable
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
