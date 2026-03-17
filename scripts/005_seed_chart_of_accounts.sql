-- ElevAIte Default Chart of Accounts
-- Standard Indian trading business chart of accounts
-- This function is called during company onboarding

CREATE OR REPLACE FUNCTION seed_default_chart_of_accounts(p_company_id uuid)
RETURNS void AS $$
BEGIN
  -- ASSETS (1xxx)
  -- Current Assets
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '1000', 'Current Assets', 'asset', 'current_asset', true),
  (p_company_id, '1010', 'Cash', 'asset', 'cash', true),
  (p_company_id, '1020', 'Petty Cash', 'asset', 'cash', true),
  (p_company_id, '1100', 'Bank Accounts', 'asset', 'bank', true),
  (p_company_id, '1110', 'Primary Bank Account', 'asset', 'bank', false),
  (p_company_id, '1200', 'Accounts Receivable', 'asset', 'accounts_receivable', true),
  (p_company_id, '1210', 'Trade Receivables', 'asset', 'accounts_receivable', false),
  (p_company_id, '1300', 'Inventory', 'asset', 'inventory', true),
  (p_company_id, '1310', 'Raw Materials', 'asset', 'inventory', false),
  (p_company_id, '1320', 'Finished Goods', 'asset', 'inventory', false),
  (p_company_id, '1400', 'Prepaid Expenses', 'asset', 'prepaid', false),
  (p_company_id, '1410', 'Prepaid Insurance', 'asset', 'prepaid', false),
  (p_company_id, '1420', 'Prepaid Rent', 'asset', 'prepaid', false),
  (p_company_id, '1500', 'GST Input Credit', 'asset', 'tax_asset', true),
  (p_company_id, '1510', 'CGST Input', 'asset', 'tax_asset', false),
  (p_company_id, '1520', 'SGST Input', 'asset', 'tax_asset', false),
  (p_company_id, '1530', 'IGST Input', 'asset', 'tax_asset', false),
  (p_company_id, '1600', 'Advances & Deposits', 'asset', 'advance', false),
  (p_company_id, '1610', 'Advance to Suppliers', 'asset', 'advance', false),
  (p_company_id, '1620', 'Security Deposits', 'asset', 'advance', false);

  -- Fixed Assets
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '1700', 'Fixed Assets', 'asset', 'fixed_asset', true),
  (p_company_id, '1710', 'Land & Building', 'asset', 'fixed_asset', false),
  (p_company_id, '1720', 'Plant & Machinery', 'asset', 'fixed_asset', false),
  (p_company_id, '1730', 'Furniture & Fixtures', 'asset', 'fixed_asset', false),
  (p_company_id, '1740', 'Office Equipment', 'asset', 'fixed_asset', false),
  (p_company_id, '1750', 'Computer Equipment', 'asset', 'fixed_asset', false),
  (p_company_id, '1760', 'Vehicles', 'asset', 'fixed_asset', false),
  (p_company_id, '1800', 'Accumulated Depreciation', 'asset', 'contra_asset', true),
  (p_company_id, '1810', 'Acc. Dep. - Building', 'asset', 'contra_asset', false),
  (p_company_id, '1820', 'Acc. Dep. - Machinery', 'asset', 'contra_asset', false),
  (p_company_id, '1830', 'Acc. Dep. - Furniture', 'asset', 'contra_asset', false),
  (p_company_id, '1840', 'Acc. Dep. - Equipment', 'asset', 'contra_asset', false),
  (p_company_id, '1850', 'Acc. Dep. - Vehicles', 'asset', 'contra_asset', false);

  -- LIABILITIES (2xxx)
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '2000', 'Current Liabilities', 'liability', 'current_liability', true),
  (p_company_id, '2100', 'Accounts Payable', 'liability', 'accounts_payable', true),
  (p_company_id, '2110', 'Trade Payables', 'liability', 'accounts_payable', false),
  (p_company_id, '2200', 'GST Payable', 'liability', 'tax_liability', true),
  (p_company_id, '2210', 'CGST Payable', 'liability', 'tax_liability', false),
  (p_company_id, '2220', 'SGST Payable', 'liability', 'tax_liability', false),
  (p_company_id, '2230', 'IGST Payable', 'liability', 'tax_liability', false),
  (p_company_id, '2300', 'TDS Payable', 'liability', 'tax_liability', false),
  (p_company_id, '2400', 'Employee Payables', 'liability', 'accrued', false),
  (p_company_id, '2410', 'Salaries Payable', 'liability', 'accrued', false),
  (p_company_id, '2420', 'PF Payable', 'liability', 'accrued', false),
  (p_company_id, '2430', 'ESI Payable', 'liability', 'accrued', false),
  (p_company_id, '2500', 'Short-term Borrowings', 'liability', 'short_term_debt', false),
  (p_company_id, '2510', 'Bank Overdraft', 'liability', 'short_term_debt', false),
  (p_company_id, '2520', 'Credit Card Payable', 'liability', 'short_term_debt', false),
  (p_company_id, '2600', 'Advance from Customers', 'liability', 'deferred_revenue', false);

  -- Long-term Liabilities
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '2700', 'Long-term Liabilities', 'liability', 'long_term_liability', true),
  (p_company_id, '2710', 'Term Loans', 'liability', 'long_term_debt', false),
  (p_company_id, '2720', 'Vehicle Loans', 'liability', 'long_term_debt', false),
  (p_company_id, '2730', 'Unsecured Loans', 'liability', 'long_term_debt', false),
  (p_company_id, '2740', 'Loans from Directors', 'liability', 'related_party', false);

  -- EQUITY (3xxx)
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '3000', 'Equity', 'equity', 'equity', true),
  (p_company_id, '3100', 'Capital Account', 'equity', 'capital', true),
  (p_company_id, '3110', 'Owner''s Capital', 'equity', 'capital', false),
  (p_company_id, '3120', 'Partner A Capital', 'equity', 'capital', false),
  (p_company_id, '3130', 'Partner B Capital', 'equity', 'capital', false),
  (p_company_id, '3200', 'Drawings', 'equity', 'drawings', false),
  (p_company_id, '3300', 'Retained Earnings', 'equity', 'retained_earnings', true),
  (p_company_id, '3400', 'Current Year Profit/Loss', 'equity', 'current_earnings', true);

  -- INCOME (4xxx)
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '4000', 'Revenue', 'income', 'operating_revenue', true),
  (p_company_id, '4100', 'Sales', 'income', 'sales', true),
  (p_company_id, '4110', 'Domestic Sales', 'income', 'sales', false),
  (p_company_id, '4120', 'Export Sales', 'income', 'sales', false),
  (p_company_id, '4130', 'Service Revenue', 'income', 'service', false),
  (p_company_id, '4200', 'Sales Returns & Allowances', 'income', 'contra_revenue', false),
  (p_company_id, '4300', 'Discounts Given', 'income', 'contra_revenue', false),
  (p_company_id, '4400', 'Other Income', 'income', 'other_income', true),
  (p_company_id, '4410', 'Interest Income', 'income', 'other_income', false),
  (p_company_id, '4420', 'Dividend Income', 'income', 'other_income', false),
  (p_company_id, '4430', 'Rental Income', 'income', 'other_income', false),
  (p_company_id, '4440', 'Miscellaneous Income', 'income', 'other_income', false);

  -- EXPENSES (5xxx)
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '5000', 'Cost of Goods Sold', 'expense', 'cogs', true),
  (p_company_id, '5100', 'Purchases', 'expense', 'purchases', true),
  (p_company_id, '5110', 'Domestic Purchases', 'expense', 'purchases', false),
  (p_company_id, '5120', 'Import Purchases', 'expense', 'purchases', false),
  (p_company_id, '5200', 'Purchase Returns', 'expense', 'contra_expense', false),
  (p_company_id, '5300', 'Freight Inward', 'expense', 'direct_expense', false),
  (p_company_id, '5400', 'Manufacturing Expenses', 'expense', 'direct_expense', false);

  -- Operating Expenses (6xxx)
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '6000', 'Operating Expenses', 'expense', 'operating', true),
  (p_company_id, '6100', 'Salaries & Wages', 'expense', 'payroll', true),
  (p_company_id, '6110', 'Staff Salaries', 'expense', 'payroll', false),
  (p_company_id, '6120', 'Director Remuneration', 'expense', 'payroll', false),
  (p_company_id, '6130', 'Bonus & Incentives', 'expense', 'payroll', false),
  (p_company_id, '6140', 'Staff Welfare', 'expense', 'payroll', false),
  (p_company_id, '6200', 'Rent Expense', 'expense', 'occupancy', false),
  (p_company_id, '6210', 'Office Rent', 'expense', 'occupancy', false),
  (p_company_id, '6220', 'Warehouse Rent', 'expense', 'occupancy', false),
  (p_company_id, '6300', 'Utilities', 'expense', 'utilities', false),
  (p_company_id, '6310', 'Electricity', 'expense', 'utilities', false),
  (p_company_id, '6320', 'Water', 'expense', 'utilities', false),
  (p_company_id, '6330', 'Telephone & Internet', 'expense', 'utilities', false),
  (p_company_id, '6400', 'Office Expenses', 'expense', 'administrative', false),
  (p_company_id, '6410', 'Stationery', 'expense', 'administrative', false),
  (p_company_id, '6420', 'Printing', 'expense', 'administrative', false),
  (p_company_id, '6430', 'Postage & Courier', 'expense', 'administrative', false),
  (p_company_id, '6500', 'Professional Fees', 'expense', 'professional', false),
  (p_company_id, '6510', 'Legal Fees', 'expense', 'professional', false),
  (p_company_id, '6520', 'Audit Fees', 'expense', 'professional', false),
  (p_company_id, '6530', 'Consulting Fees', 'expense', 'professional', false),
  (p_company_id, '6600', 'Marketing & Advertising', 'expense', 'marketing', false),
  (p_company_id, '6610', 'Advertising', 'expense', 'marketing', false),
  (p_company_id, '6620', 'Sales Promotion', 'expense', 'marketing', false),
  (p_company_id, '6700', 'Travel & Conveyance', 'expense', 'travel', false),
  (p_company_id, '6710', 'Local Conveyance', 'expense', 'travel', false),
  (p_company_id, '6720', 'Travelling Expenses', 'expense', 'travel', false),
  (p_company_id, '6730', 'Vehicle Expenses', 'expense', 'travel', false),
  (p_company_id, '6800', 'Insurance', 'expense', 'insurance', false),
  (p_company_id, '6810', 'Business Insurance', 'expense', 'insurance', false),
  (p_company_id, '6820', 'Vehicle Insurance', 'expense', 'insurance', false),
  (p_company_id, '6900', 'Repairs & Maintenance', 'expense', 'maintenance', false),
  (p_company_id, '6910', 'Building Maintenance', 'expense', 'maintenance', false),
  (p_company_id, '6920', 'Equipment Maintenance', 'expense', 'maintenance', false);

  -- Other Expenses (7xxx)
  INSERT INTO accounts (company_id, code, name, type, sub_type, is_system) VALUES
  (p_company_id, '7000', 'Other Expenses', 'expense', 'other', true),
  (p_company_id, '7100', 'Depreciation', 'expense', 'depreciation', true),
  (p_company_id, '7200', 'Interest Expense', 'expense', 'finance', false),
  (p_company_id, '7210', 'Bank Interest', 'expense', 'finance', false),
  (p_company_id, '7220', 'Loan Interest', 'expense', 'finance', false),
  (p_company_id, '7300', 'Bank Charges', 'expense', 'finance', false),
  (p_company_id, '7400', 'Bad Debts', 'expense', 'other', false),
  (p_company_id, '7500', 'Miscellaneous Expenses', 'expense', 'other', false),
  (p_company_id, '7600', 'Donations', 'expense', 'other', false),
  (p_company_id, '7700', 'Penalties & Fines', 'expense', 'other', false);

  -- Update parent_id references for hierarchy
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1000')
  WHERE company_id = p_company_id AND code IN ('1010', '1020', '1100', '1200', '1300', '1400', '1500', '1600');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1100')
  WHERE company_id = p_company_id AND code = '1110';
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1200')
  WHERE company_id = p_company_id AND code = '1210';
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1300')
  WHERE company_id = p_company_id AND code IN ('1310', '1320');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1400')
  WHERE company_id = p_company_id AND code IN ('1410', '1420');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1500')
  WHERE company_id = p_company_id AND code IN ('1510', '1520', '1530');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1600')
  WHERE company_id = p_company_id AND code IN ('1610', '1620');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1700')
  WHERE company_id = p_company_id AND code IN ('1710', '1720', '1730', '1740', '1750', '1760');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1800')
  WHERE company_id = p_company_id AND code IN ('1810', '1820', '1830', '1840', '1850');

  -- Liability parent updates
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2000')
  WHERE company_id = p_company_id AND code IN ('2100', '2200', '2300', '2400', '2500', '2600');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2100')
  WHERE company_id = p_company_id AND code = '2110';
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2200')
  WHERE company_id = p_company_id AND code IN ('2210', '2220', '2230');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2400')
  WHERE company_id = p_company_id AND code IN ('2410', '2420', '2430');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2500')
  WHERE company_id = p_company_id AND code IN ('2510', '2520');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2700')
  WHERE company_id = p_company_id AND code IN ('2710', '2720', '2730', '2740');

  -- Equity parent updates
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '3000')
  WHERE company_id = p_company_id AND code IN ('3100', '3200', '3300', '3400');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '3100')
  WHERE company_id = p_company_id AND code IN ('3110', '3120', '3130');

  -- Income parent updates
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '4000')
  WHERE company_id = p_company_id AND code IN ('4100', '4200', '4300');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '4100')
  WHERE company_id = p_company_id AND code IN ('4110', '4120', '4130');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '4400')
  WHERE company_id = p_company_id AND code IN ('4410', '4420', '4430', '4440');

  -- Expense parent updates
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '5000')
  WHERE company_id = p_company_id AND code IN ('5100', '5200', '5300', '5400');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '5100')
  WHERE company_id = p_company_id AND code IN ('5110', '5120');

  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6000')
  WHERE company_id = p_company_id AND code IN ('6100', '6200', '6300', '6400', '6500', '6600', '6700', '6800', '6900');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6100')
  WHERE company_id = p_company_id AND code IN ('6110', '6120', '6130', '6140');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6200')
  WHERE company_id = p_company_id AND code IN ('6210', '6220');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6300')
  WHERE company_id = p_company_id AND code IN ('6310', '6320', '6330');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6400')
  WHERE company_id = p_company_id AND code IN ('6410', '6420', '6430');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6500')
  WHERE company_id = p_company_id AND code IN ('6510', '6520', '6530');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6600')
  WHERE company_id = p_company_id AND code IN ('6610', '6620');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6700')
  WHERE company_id = p_company_id AND code IN ('6710', '6720', '6730');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6800')
  WHERE company_id = p_company_id AND code IN ('6810', '6820');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '6900')
  WHERE company_id = p_company_id AND code IN ('6910', '6920');

  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '7000')
  WHERE company_id = p_company_id AND code IN ('7100', '7200', '7300', '7400', '7500', '7600', '7700');
  
  UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '7200')
  WHERE company_id = p_company_id AND code IN ('7210', '7220');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
