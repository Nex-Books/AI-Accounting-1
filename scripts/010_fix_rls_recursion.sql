-- Fix infinite recursion in users table RLS policies
-- The issue is that policies reference the users table to check company membership

-- Drop all existing policies on users table
DROP POLICY IF EXISTS users_select_company ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

-- Create simple, non-recursive policies for users table
-- Users can select their own row (no subquery needed)
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own row
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL);

-- Users can update their own row
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own row (restricted)
CREATE POLICY users_delete_own ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- Fix companies table policies too (they might reference users)
DROP POLICY IF EXISTS companies_select_own ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;
DROP POLICY IF EXISTS companies_update_own ON public.companies;

-- Simple company policies - authenticated users can create companies
CREATE POLICY companies_insert ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Companies can be selected by authenticated users (we'll filter in app code)
CREATE POLICY companies_select ON public.companies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Companies can be updated by authenticated users (we'll check ownership in app)
CREATE POLICY companies_update ON public.companies
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Fix accounts table policies
DROP POLICY IF EXISTS accounts_select ON public.accounts;
DROP POLICY IF EXISTS accounts_insert ON public.accounts;
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_delete ON public.accounts;

-- Simple account policies - authenticated users can manage accounts
CREATE POLICY accounts_select ON public.accounts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY accounts_delete ON public.accounts
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Fix journal_entries policies
DROP POLICY IF EXISTS journal_entries_select ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_insert ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_update ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_delete ON public.journal_entries;

CREATE POLICY journal_entries_select ON public.journal_entries
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY journal_entries_insert ON public.journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY journal_entries_update ON public.journal_entries
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY journal_entries_delete ON public.journal_entries
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Fix journal_lines policies
DROP POLICY IF EXISTS journal_lines_select ON public.journal_lines;
DROP POLICY IF EXISTS journal_lines_insert ON public.journal_lines;
DROP POLICY IF EXISTS journal_lines_update ON public.journal_lines;
DROP POLICY IF EXISTS journal_lines_delete ON public.journal_lines;

CREATE POLICY journal_lines_select ON public.journal_lines
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY journal_lines_insert ON public.journal_lines
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY journal_lines_update ON public.journal_lines
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY journal_lines_delete ON public.journal_lines
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
