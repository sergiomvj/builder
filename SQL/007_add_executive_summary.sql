-- Add JSONB column for structured Executive Summary
-- Required for the new Elite Consultancy Framework output

ALTER TABLE projects ADD COLUMN IF NOT EXISTS executive_summary JSONB;

-- Comment on column using standard Postgres syntax
COMMENT ON COLUMN projects.executive_summary IS 'Stores the structured Executive Summary (Opportunity, Solution, Market, Investment Thesis) as JSON.';
