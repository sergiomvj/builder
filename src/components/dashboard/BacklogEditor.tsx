
import { useState } from 'react';
import { ProjectBacklogItem } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BacklogEditorProps {
  backlog: ProjectBacklogItem[];
  onSave: (backlog: ProjectBacklogItem[]) => void;
}

export default function BacklogEditor({ backlog, onSave }: BacklogEditorProps) {
  const [items, setItems] = useState<ProjectBacklogItem[]>(backlog || []);
  const [isEditing, setIsEditing] = useState(false);

  const handleAdd = () => {
    setItems([...items, { title: 'New Task', priority: 'Medium', category: 'General' }]);
    setIsEditing(true);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    setIsEditing(true);
  };

  const handleChange = (index: number, field: keyof ProjectBacklogItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(items);
    setIsEditing(false);
    toast.success('Backlog updated locally.');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-600"/> 
          Backlog Preview
        </CardTitle>
        <div className="flex gap-2">
          {isEditing && (
            <Button size="sm" onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4"/> Done
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4"/> Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((task, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white border rounded shadow-sm group">
              <div className="flex-1 mr-4">
                <Input 
                  value={task.title}
                  onChange={(e) => handleChange(i, 'title', e.target.value)}
                  className="font-medium text-sm text-slate-800 border-none shadow-none p-0 h-auto focus-visible:ring-0"
                  placeholder="Task Title"
                />
                <Input 
                  value={task.category}
                  onChange={(e) => handleChange(i, 'category', e.target.value)}
                  className="text-[10px] mt-1 text-slate-500 h-5 border-none shadow-none p-0 focus-visible:ring-0"
                  placeholder="Category"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Select 
                  value={task.priority} 
                  onValueChange={(val) => handleChange(i, 'priority', val)}
                >
                  <SelectTrigger className={`w-[90px] h-8 text-xs ${
                    task.priority === 'High' ? 'bg-red-50 text-red-800 border-red-200' : 
                    task.priority === 'Medium' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-slate-50 text-slate-800 border-slate-200'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => handleRemove(i)}>
                   <Trash2 className="w-4 h-4"/>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
