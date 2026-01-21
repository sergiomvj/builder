export interface SavedAnalysis {
    id: string;
    empresa_id: string;
    title: string;
    summary: string;
    content: any; // Can be a complex object containing the metrics/insights at save time
    analysis_type: 'strategic' | 'financial' | 'operational' | 'technical';
    author_persona_id?: string;
    created_at: string;
    updated_at: string;
}
