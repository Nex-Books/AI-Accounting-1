-- ElevAIte Row Level Security Policies
-- All tables are isolated by company_id

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only access their own company
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (true);

-- Users: Can see users in their company
CREATE POLICY "users_select_company" ON users
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (
    id = auth.uid() OR 
    (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner'))
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

-- Accounts: Company isolation
CREATE POLICY "accounts_select" ON accounts
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "accounts_insert" ON accounts
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "accounts_update" ON accounts
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "accounts_delete" ON accounts
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
    AND is_system = false
  );

-- Parties: Company isolation
CREATE POLICY "parties_select" ON parties
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "parties_insert" ON parties
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "parties_update" ON parties
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "parties_delete" ON parties
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

-- Documents: Company isolation
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

-- Journal Entries: Company isolation
CREATE POLICY "journal_entries_select" ON journal_entries
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "journal_entries_insert" ON journal_entries
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "journal_entries_update" ON journal_entries
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "journal_entries_delete" ON journal_entries
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

-- Journal Lines: Company isolation
CREATE POLICY "journal_lines_select" ON journal_lines
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "journal_lines_insert" ON journal_lines
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "journal_lines_update" ON journal_lines
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

CREATE POLICY "journal_lines_delete" ON journal_lines
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'accountant'))
  );

-- Audit Logs: Read-only for all company users
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Chat Messages: Company isolation
CREATE POLICY "chat_messages_select" ON chat_messages
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Webhook Logs: Owners only
CREATE POLICY "webhook_logs_select" ON webhook_logs
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "webhook_logs_insert" ON webhook_logs
  FOR INSERT WITH CHECK (true);

-- Invitations: Company isolation
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );
