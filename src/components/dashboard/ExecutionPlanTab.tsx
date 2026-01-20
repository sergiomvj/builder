
import { useState } from 'react';
import { Project, ProjectModule, ProjectRoadmapPhase, ProjectBacklogItem } from '@/types/project';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import SystemsModulesEditor from './SystemsModulesEditor';
import RoadmapEditor from './RoadmapEditor';
import BacklogEditor from './BacklogEditor';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface ExecutionPlanTabProps {
  project: Project;
  onUpdate: () => void;
}

export default function ExecutionPlanTab({ project, onUpdate }: ExecutionPlanTabProps) {
  const [systems, setSystems] = useState<ProjectModule[]>(project.systems_modules || []);
  const [roadmap, setRoadmap] = useState<ProjectRoadmapPhase[]>(project.roadmap || []);
  const [backlog, setBacklog] = useState<ProjectBacklogItem[]>(project.backlog || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Fetch current metadata first to avoid overwriting other fields
      const { data: currentData, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', project.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedMetadata = {
        ...currentData.metadata,
        systems_and_modules: systems,
        roadmap: roadmap,
        backlog_preview: backlog
      };

      const { error } = await supabase
        .from('projects')
        .update({ metadata: updatedMetadata })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Execution Plan saved successfully!');
      onUpdate(); // Refresh parent
    } catch (error: any) {
      console.error('Error saving execution plan:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          {isSaving ? 'Saving...' : 'Save All Changes'}
          <Save className="w-4 h-4"/>
        </Button>
      </div>

      <SystemsModulesEditor 
        modules={systems} 
        onSave={setSystems} 
        projectId={project.id}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoadmapEditor 
          roadmap={roadmap} 
          onSave={setRoadmap} 
        />
        <BacklogEditor 
          backlog={backlog} 
          onSave={setBacklog} 
        />
      </div>
    </div>
  );
}
