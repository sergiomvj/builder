
import { useState } from 'react';
import { ProjectModule } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Trash2, Save, FileCode, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SystemsModulesEditorProps {
  modules: ProjectModule[];
  onSave: (modules: ProjectModule[]) => void;
  projectId: string;
}

export default function SystemsModulesEditor({ modules, onSave, projectId }: SystemsModulesEditorProps) {
  const [items, setItems] = useState<ProjectModule[]>(modules || []);
  const [isEditing, setIsEditing] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const handleAdd = () => {
    setItems([...items, { module_name: 'New Module', description: '', features: [] }]);
    setIsEditing(true);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    setIsEditing(true);
  };

  const handleChange = (index: number, field: keyof ProjectModule, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setIsEditing(true);
  };

  const handleFeatureAdd = (index: number) => {
    const newItems = [...items];
    newItems[index].features = [...(newItems[index].features || []), 'New Feature'];
    setItems(newItems);
    setIsEditing(true);
  };

  const handleFeatureChange = (moduleIndex: number, featureIndex: number, value: string) => {
    const newItems = [...items];
    newItems[moduleIndex].features[featureIndex] = value;
    setItems(newItems);
    setIsEditing(true);
  };

  const handleFeatureRemove = (moduleIndex: number, featureIndex: number) => {
    const newItems = [...items];
    newItems[moduleIndex].features.splice(featureIndex, 1);
    setItems(newItems);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(items);
    setIsEditing(false);
    toast.success('Changes saved locally. Click "Save Project" to persist.');
  };

  const generateDevGuidelines = async (module: ProjectModule, index: number) => {
    setGeneratingId(index);
    try {
      const response = await fetch('/api/generate-dev-guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           projectId,
           moduleName: module.module_name,
           moduleDescription: module.description,
           features: module.features
        }),
      });

      if (!response.ok) throw new Error('Failed to generate guidelines');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DEV_GUIDELINES_${module.module_name.replace(/\s+/g, '_').toUpperCase()}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Guidelines generated for ${module.module_name}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate guidelines');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600"/> 
          Systems & Modules Breakdown
        </CardTitle>
        <div className="flex gap-2">
          {isEditing && (
            <Button size="sm" onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4"/> Done Editing
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4"/> Add Module
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((mod, i) => (
            <div key={i} className="p-4 border rounded-lg bg-slate-50 relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                   onClick={() => handleRemove(i)}
                 >
                   <Trash2 className="w-4 h-4"/>
                 </Button>
              </div>

              <div className="space-y-3">
                <Input 
                  value={mod.module_name} 
                  onChange={(e) => handleChange(i, 'module_name', e.target.value)}
                  className="font-bold text-slate-800 bg-white"
                  placeholder="Module Name"
                />
                <Textarea 
                  value={mod.description} 
                  onChange={(e) => handleChange(i, 'description', e.target.value)}
                  className="text-sm text-slate-600 min-h-[80px] bg-white"
                  placeholder="Module Description"
                />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Features</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleFeatureAdd(i)}>
                      <Plus className="w-3 h-3 mr-1"/> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mod.features?.map((f, j) => (
                      <div key={j} className="flex items-center gap-1 bg-white border rounded-full px-2 py-1">
                        <Input 
                           value={f}
                           onChange={(e) => handleFeatureChange(i, j, e.target.value)}
                           className="h-5 w-auto min-w-[60px] max-w-[150px] text-xs border-none focus-visible:ring-0 p-0 shadow-none"
                        />
                        <button onClick={() => handleFeatureRemove(i, j)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3"/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t mt-3">
                   <Button 
                     variant="secondary" 
                     size="sm" 
                     className="w-full gap-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                     onClick={() => generateDevGuidelines(mod, i)}
                     disabled={generatingId === i}
                   >
                     {generatingId === i ? (
                        <Sparkles className="w-4 h-4 animate-spin"/>
                     ) : (
                        <FileCode className="w-4 h-4"/>
                     )}
                     Gerar Guidelines DEV (MD)
                   </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
