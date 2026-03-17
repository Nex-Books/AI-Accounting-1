-- Fix RLS policies so onboarding can create a company and update the user record

-- 1. Companies: allow authenticated users to insert (they will become owner)
DROP POLICY IF EXISTS companies_insert ON companies;
CREATE POLICY companies_insert ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Users: allow upsert - user can insert/update their own row
DROP POLICY IF EXISTS users_insert_own ON users;
CREATE POLICY users_insert_own ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Accounts: allow company owner to insert during onboarding
-- (policy already checks company membership - ensure it works for new companies)
DROP POLICY IF EXISTS accounts_insert ON accounts;
CREATE POLICY accounts_insert ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
    OR
    -- Allow during onboarding when user row is being created
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_id
    )
  );
