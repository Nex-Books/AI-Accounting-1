-- Fix infinite recursion in users table RLS policies
-- The issue is that policies reference the users table to check company_id,
-- which triggers the same policies again, causing infinite recursion.

-- Drop existing problematic policies
DROP POLICY IF EXISTS users_select_company ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

-- Create simple, non-recursive policies
-- Users can select their own row (no recursion - just checks auth.uid())
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own row
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Only the user can delete their own row
CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Also fix companies policies to avoid recursion
DROP POLICY IF EXISTS companies_select_own ON public.companies;
DROP POLICY IF EXISTS companies_update_own ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;

-- Simple company policies - any authenticated user can create a company
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- For select/update, we need to check if the user belongs to the company
-- But we can't query users table (recursion). Use a function instead.
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- Companies: users can select/update their own company
CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id());

CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE USING (id = public.get_user_company_id());

-- Fix accounts policies similarly
DROP POLICY IF EXISTS accounts_select ON public.accounts;
DROP POLICY IF EXISTS accounts_insert ON public.accounts;
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_delete ON public.accounts;

CREATE POLICY "accounts_select" ON public.accounts
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "accounts_insert" ON public.accounts
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id() OR company_id IS NOT NULL);

CREATE POLICY "accounts_update" ON public.accounts
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "accounts_delete" ON public.accounts
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Fix journal_entries policies
DROP POLICY IF EXISTS journal_entries_select ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_insert ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_update ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_delete ON public.journal_entries;

CREATE POLICY "journal_entries_select" ON public.journal_entries
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "journal_entries_insert" ON public.journal_entries
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id() OR company_id IS NOT NULL);

CREATE POLICY "journal_entries_update" ON public.journal_entries
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "journal_entries_delete" ON public.journal_entries
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Fix journal_lines policies  
DROP POLICY IF EXISTS journal_lines_select ON public.journal_lines;
DROP POLICY IF EXISTS journal_lines_insert ON public.journal_lines;
DROP POLICY IF EXISTS journal_lines_update ON public.journal_lines;
DROP POLICY IF EXISTS journal_lines_delete ON public.journal_lines;

CREATE POLICY "journal_lines_select" ON public.journal_lines
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "journal_lines_insert" ON public.journal_lines
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id() OR company_id IS NOT NULL);

CREATE POLICY "journal_lines_update" ON public.journal_lines
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "journal_lines_delete" ON public.journal_lines
  FOR DELETE USING (company_id = public.get_user_company_id());
