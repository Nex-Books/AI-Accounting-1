-- Remove the plan check constraint to allow any plan value
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_plan_check;

-- Also remove plan_status constraint if it exists
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_plan_status_check;
