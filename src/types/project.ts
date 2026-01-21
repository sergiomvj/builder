export interface ProjectModule {
  module_name: string;
  description: string;
  features: string[];
}

export interface ProjectRoadmapPhase {
  phase: string;
  duration: string;
  deliverables: string[];
}

export interface ProjectBacklogItem {
  title: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  category: string;
}

export interface ProjectAnalysis {
  project_name: string;
  tagline: string;
  executive_summary: string;
  business_potential_diagnosis: {
    market_size: string;
    compelling_reason: string;
    viability_score: number | string;
    viability_analysis: string;
  };
  mission: string;
  vision: string;
  values: string[];
  target_audience: string;
  pain_points: string[];
  marketing_strategy: {
    value_proposition?: string;
    target_audience?: string;
    approach_strategy?: string;
    channels: string[];
    tactics: string[];
    launch_plan_steps: string[];
  };
  lead_generation_strategy: {
    lead_magnets: string[];
    conversion_tactics: string[];
    tools_suggested: string[];
  };
  systems_and_modules: ProjectModule[];
  roadmap: ProjectRoadmapPhase[];
  backlog_preview: ProjectBacklogItem[];
  revenue_streams: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  key_metrics: string[];
  risks_and_gaps: string[];
  improvement_suggestions?: string[];
}

// Interface for the project state in the dashboard, which combines DB fields and Analysis fields
export interface Project extends Partial<ProjectAnalysis> {
  id: string;
  name?: string; // Mapped from project_name
  description?: string; // Mapped from tagline
  objectives?: string[]; // Sometimes used in older mocks
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  
  // Mapped fields for easier UI consumption if needed, 
  // though we should prefer using the raw Analysis structure where possible.
  systems_modules?: ProjectModule[];
  backlog?: ProjectBacklogItem[];
  
  // DB specific
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  
  // Ideas/Original input
  ideas?: {
    title: string;
    description: string;
  };
  
  // V3 specific fields that might be directly accessed
  business_diagnosis?: ProjectAnalysis['business_potential_diagnosis'];
  key_metrics?: string[];
  risks?: string[]; // Mapped from risks_and_gaps
  improvements?: string[]; // Mapped from improvement_suggestions
  lead_generation_strategy?: ProjectAnalysis['lead_generation_strategy'];
}
