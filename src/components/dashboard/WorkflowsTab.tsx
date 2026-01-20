
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Workflow, MessageSquare } from 'lucide-react';
import WorkflowsEditor from './WorkflowsEditor';
import HRManagerChat from './HRManagerChat';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface WorkflowsTabProps {
  workflows: any[];
  team: any[];
  projectId: string;
  onUpdate: () => void;
}

export default function WorkflowsTab({ workflows, team, projectId, onUpdate }: WorkflowsTabProps) {
  const [showFlows, setShowFlows] = useState(true);

  const handleSaveWorkflows = async (updatedWorkflows: any[]) => {
    try {
      // Fetch current metadata
      const { data: currentData, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;

      const updatedMetadata = {
        ...currentData.metadata,
        workflows: updatedWorkflows // Save as 'workflows' in metadata
      };

      const { error } = await supabase
        .from('projects')
        .update({ metadata: updatedMetadata })
        .eq('id', projectId);

      if (error) throw error;
      
    } catch (error) {
      console.error('Error saving workflows:', error);
      throw error; // Let Editor handle the toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Workflow className="w-6 h-6 text-orange-600"/> Automation & Operations
         </h2>
         <Button 
           variant={showFlows ? "secondary" : "default"}
           onClick={() => setShowFlows(!showFlows)}
           className="gap-2"
         >
           {showFlows ? <MessageSquare className="w-4 h-4"/> : <Workflow className="w-4 h-4"/>}
           {showFlows ? 'Focus on Chat' : 'Ver Fluxos'}
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Chat - Always visible or takes full width if flows hidden */}
        <div className={`${showFlows ? 'lg:col-span-1' : 'lg:col-span-3'} h-full transition-all duration-300`}>
           <HRManagerChat 
             projectId={projectId} 
             mode="workflows" 
             onUpdate={onUpdate} 
             currentData={{ workflows, team }}
           />
        </div>

        {/* Workflows List - Visible only if showFlows is true */}
        {showFlows && (
           <div className="lg:col-span-2 h-full overflow-y-auto pr-2">
              <WorkflowsEditor 
                workflows={workflows} 
                team={team} 
                projectId={projectId} 
                onUpdate={onUpdate}
                onSave={handleSaveWorkflows}
              />
           </div>
        )}
      </div>
    </div>
  );
}
