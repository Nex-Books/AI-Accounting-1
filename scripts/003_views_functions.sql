-- ElevAIte Views and Functions

-- Function to get account balance as of a specific date
CREATE OR REPLACE FUNCTION get_account_balance(p_account_id uuid, p_as_of_date date DEFAULT CURRENT_DATE)
RETURNS numeric AS $$
DECLARE
  v_opening_balance numeric;
  v_total_debits numeric;
  v_total_credits numeric;
  v_account_type text;
BEGIN
  -- Get account type and opening balance
  SELECT type, opening_balance INTO v_account_type, v_opening_balance
  FROM accounts WHERE id = p_account_id;
  
  -- Calculate total debits and credits up to the date
  SELECT 
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO v_total_debits, v_total_credits
  FROM journal_lines jl
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE jl.account_id = p_account_id
    AND je.date <= p_as_of_date;
  
  -- Calculate balance based on account type
  -- Assets and Expenses: Debit increases, Credit decreases
  -- Liabilities, Equity, Income: Credit increases, Debit decreases
  IF v_account_type IN ('asset', 'expense') THEN
    RETURN COALESCE(v_opening_balance, 0) + v_total_debits - v_total_credits;
  ELSE
    RETURN COALESCE(v_opening_balance, 0) + v_total_credits - v_total_debits;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get financial summary for dashboard
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_company_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_total_revenue numeric := 0;
  v_total_expenses numeric := 0;
  v_total_assets numeric := 0;
  v_total_liabilities numeric := 0;
  v_total_equity numeric := 0;
BEGIN
  -- Calculate total revenue (credits to income accounts)
  SELECT COALESCE(SUM(jl.credit - jl.debit), 0) INTO v_total_revenue
  FROM journal_lines jl
  JOIN accounts a ON a.id = jl.account_id
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE a.company_id = p_company_id
    AND a.type = 'income'
    AND je.date BETWEEN p_start_date AND p_end_date;

  -- Calculate total expenses (debits to expense accounts)
  SELECT COALESCE(SUM(jl.debit - jl.credit), 0) INTO v_total_expenses
  FROM journal_lines jl
  JOIN accounts a ON a.id = jl.account_id
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE a.company_id = p_company_id
    AND a.type = 'expense'
    AND je.date BETWEEN p_start_date AND p_end_date;

  -- Calculate total assets as of end date
  SELECT COALESCE(SUM(
    a.opening_balance + COALESCE(sub.net_balance, 0)
  ), 0) INTO v_total_assets
  FROM accounts a
  LEFT JOIN (
    SELECT jl.account_id, SUM(jl.debit - jl.credit) as net_balance
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.date <= p_end_date
    GROUP BY jl.account_id
  ) sub ON sub.account_id = a.id
  WHERE a.company_id = p_company_id AND a.type = 'asset';

  -- Calculate total liabilities as of end date
  SELECT COALESCE(SUM(
    a.opening_balance + COALESCE(sub.net_balance, 0)
  ), 0) INTO v_total_liabilities
  FROM accounts a
  LEFT JOIN (
    SELECT jl.account_id, SUM(jl.credit - jl.debit) as net_balance
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.date <= p_end_date
    GROUP BY jl.account_id
  ) sub ON sub.account_id = a.id
  WHERE a.company_id = p_company_id AND a.type = 'liability';

  -- Calculate total equity as of end date
  SELECT COALESCE(SUM(
    a.opening_balance + COALESCE(sub.net_balance, 0)
  ), 0) INTO v_total_equity
  FROM accounts a
  LEFT JOIN (
    SELECT jl.account_id, SUM(jl.credit - jl.debit) as net_balance
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.date <= p_end_date
    GROUP BY jl.account_id
  ) sub ON sub.account_id = a.id
  WHERE a.company_id = p_company_id AND a.type = 'equity';

  v_result := jsonb_build_object(
    'total_revenue', v_total_revenue,
    'total_expenses', v_total_expenses,
    'net_profit', v_total_revenue - v_total_expenses,
    'total_assets', v_total_assets,
    'total_liabilities', v_total_liabilities,
    'total_equity', v_total_equity,
    'net_worth', v_total_assets - v_total_liabilities
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get receivables aging
CREATE OR REPLACE FUNCTION get_receivables_aging(p_company_id uuid)
RETURNS TABLE (
  party_id uuid,
  party_name text,
  current_amount numeric,
  days_30 numeric,
  days_60 numeric,
  days_90 numeric,
  days_90_plus numeric,
  total numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH receivable_lines AS (
    SELECT 
      p.id as party_id,
      p.name as party_name,
      je.date,
      jl.debit - jl.credit as amount
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    LEFT JOIN parties p ON p.id = jl.party_id
    WHERE a.company_id = p_company_id
      AND a.sub_type = 'accounts_receivable'
  )
  SELECT 
    rl.party_id,
    COALESCE(rl.party_name, 'Unknown') as party_name,
    SUM(CASE WHEN CURRENT_DATE - rl.date <= 30 THEN rl.amount ELSE 0 END) as current_amount,
    SUM(CASE WHEN CURRENT_DATE - rl.date BETWEEN 31 AND 60 THEN rl.amount ELSE 0 END) as days_30,
    SUM(CASE WHEN CURRENT_DATE - rl.date BETWEEN 61 AND 90 THEN rl.amount ELSE 0 END) as days_60,
    SUM(CASE WHEN CURRENT_DATE - rl.date BETWEEN 91 AND 120 THEN rl.amount ELSE 0 END) as days_90,
    SUM(CASE WHEN CURRENT_DATE - rl.date > 120 THEN rl.amount ELSE 0 END) as days_90_plus,
    SUM(rl.amount) as total
  FROM receivable_lines rl
  GROUP BY rl.party_id, rl.party_name
  HAVING SUM(rl.amount) != 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payables aging
CREATE OR REPLACE FUNCTION get_payables_aging(p_company_id uuid)
RETURNS TABLE (
  party_id uuid,
  party_name text,
  current_amount numeric,
  days_30 numeric,
  days_60 numeric,
  days_90 numeric,
  days_90_plus numeric,
  total numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH payable_lines AS (
    SELECT 
      p.id as party_id,
      p.name as party_name,
      je.date,
      jl.credit - jl.debit as amount
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    LEFT JOIN parties p ON p.id = jl.party_id
    WHERE a.company_id = p_company_id
      AND a.sub_type = 'accounts_payable'
  )
  SELECT 
    pl.party_id,
    COALESCE(pl.party_name, 'Unknown') as party_name,
    SUM(CASE WHEN CURRENT_DATE - pl.date <= 30 THEN pl.amount ELSE 0 END) as current_amount,
    SUM(CASE WHEN CURRENT_DATE - pl.date BETWEEN 31 AND 60 THEN pl.amount ELSE 0 END) as days_30,
    SUM(CASE WHEN CURRENT_DATE - pl.date BETWEEN 61 AND 90 THEN pl.amount ELSE 0 END) as days_60,
    SUM(CASE WHEN CURRENT_DATE - pl.date BETWEEN 91 AND 120 THEN pl.amount ELSE 0 END) as days_90,
    SUM(CASE WHEN CURRENT_DATE - pl.date > 120 THEN pl.amount ELSE 0 END) as days_90_plus,
    SUM(pl.amount) as total
  FROM payable_lines pl
  GROUP BY pl.party_id, pl.party_name
  HAVING SUM(pl.amount) != 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ledger with running balance
CREATE OR REPLACE FUNCTION get_ledger(
  p_account_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  date date,
  description text,
  reference_number text,
  debit numeric,
  credit numeric,
  running_balance numeric
) AS $$
DECLARE
  v_opening_balance numeric;
  v_account_type text;
  v_running numeric;
BEGIN
  -- Get account type
  SELECT type, opening_balance INTO v_account_type, v_opening_balance
  FROM accounts WHERE id = p_account_id;
  
  -- Calculate opening balance as of start date
  SELECT 
    CASE 
      WHEN v_account_type IN ('asset', 'expense') THEN
        COALESCE(v_opening_balance, 0) + COALESCE(SUM(jl.debit - jl.credit), 0)
      ELSE
        COALESCE(v_opening_balance, 0) + COALESCE(SUM(jl.credit - jl.debit), 0)
    END
  INTO v_running
  FROM journal_lines jl
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE jl.account_id = p_account_id
    AND je.date < p_start_date;

  v_running := COALESCE(v_running, COALESCE(v_opening_balance, 0));

  RETURN QUERY
  WITH ledger_entries AS (
    SELECT 
      je.date,
      je.description,
      je.reference_number,
      jl.debit,
      jl.credit,
      ROW_NUMBER() OVER (ORDER BY je.date, je.created_at) as rn
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE jl.account_id = p_account_id
      AND je.date BETWEEN p_start_date AND p_end_date
    ORDER BY je.date, je.created_at
  )
  SELECT 
    le.date,
    le.description,
    le.reference_number,
    le.debit,
    le.credit,
    v_running + SUM(
      CASE 
        WHEN v_account_type IN ('asset', 'expense') THEN le.debit - le.credit
        ELSE le.credit - le.debit
      END
    ) OVER (ORDER BY le.rn) as running_balance
  FROM ledger_entries le;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trial balance
CREATE OR REPLACE FUNCTION get_trial_balance(p_company_id uuid, p_as_of_date date)
RETURNS TABLE (
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  total_debit numeric,
  total_credit numeric,
  closing_balance numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as account_id,
    a.code as account_code,
    a.name as account_name,
    a.type as account_type,
    COALESCE(SUM(jl.debit), 0) as total_debit,
    COALESCE(SUM(jl.credit), 0) as total_credit,
    CASE 
      WHEN a.type IN ('asset', 'expense') THEN
        a.opening_balance + COALESCE(SUM(jl.debit - jl.credit), 0)
      ELSE
        a.opening_balance + COALESCE(SUM(jl.credit - jl.debit), 0)
    END as closing_balance
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id AND je.date <= p_as_of_date
  WHERE a.company_id = p_company_id
    AND a.is_active = true
  GROUP BY a.id, a.code, a.name, a.type, a.opening_balance
  ORDER BY a.type, a.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
