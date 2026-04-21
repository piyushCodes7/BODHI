export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  account_last4?: string;
}

// Ensure the most recent dates are at the top depending on how your app sorts!
export const MOCK_TRANSACTIONS: Transaction[] = [
  // --- APRIL 2026 ---
  { id: 'tx_401', amount: 150.00, merchant: 'Uber Ride', category: 'Transport', date: '2026-04-21T18:45:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_401b', amount: 8500.00, merchant: 'CoinDCX (Bitcoin)', category: 'Investment', date: '2026-04-12T14:30:00Z', type: 'DEBIT', account_last4: 'APP (Wallet)' },
  { id: 'tx_402', amount: 1200.00, merchant: 'Blinkit', category: 'Groceries', date: '2026-04-20T09:20:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_403', amount: 450.00, merchant: 'Swiggy', category: 'Food', date: '2026-04-18T20:15:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_404', amount: 12000.00, merchant: 'Rent Transfer (G. Jindal)', category: 'Housing', date: '2026-04-05T11:00:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_405', amount: 40000.00, merchant: 'Salary (Tech Corp)', category: 'Income', date: '2026-04-01T09:00:00Z', type: 'CREDIT', account_last4: '4589' },

  // --- MARCH 2026 ---
  { id: 'tx_301', amount: 2500.00, merchant: 'Zerodha Mutual Funds SIP', category: 'Investment', date: '2026-03-25T08:00:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_302', amount: 890.00, merchant: 'JioFiber Broadband', category: 'Utilities', date: '2026-03-20T10:15:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_303', amount: 350.00, merchant: 'Zomato', category: 'Food', date: '2026-03-18T21:30:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_304', amount: 1800.00, merchant: 'Electricity Bill (BSES)', category: 'Utilities', date: '2026-03-15T09:40:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_304b', amount: 15000.00, merchant: 'Groww (Reliance Ind. Shares)', category: 'Investment', date: '2026-03-12T10:15:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_305', amount: 649.00, merchant: 'Netflix Subscription', category: 'Entertainment', date: '2026-03-10T12:00:00Z', type: 'DEBIT', account_last4: 'APP (Wallet)' },
  { id: 'tx_306', amount: 4500.00, merchant: 'Myntra Shopping', category: 'Shopping', date: '2026-03-08T16:20:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_307', amount: 12000.00, merchant: 'Rent Transfer (G. Jindal)', category: 'Housing', date: '2026-03-05T11:00:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_308', amount: 40000.00, merchant: 'Salary (Tech Corp)', category: 'Income', date: '2026-03-01T09:00:00Z', type: 'CREDIT', account_last4: '4589' },

  // --- FEBRUARY 2026 ---
  { id: 'tx_201', amount: 2500.00, merchant: 'Zerodha Mutual Funds SIP', category: 'Investment', date: '2026-02-25T08:00:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_202', amount: 1100.00, merchant: 'BookMyShow (Movie Tickets)', category: 'Entertainment', date: '2026-02-22T20:00:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_203', amount: 3200.00, merchant: 'Starbucks (Coffee Run)', category: 'Food', date: '2026-02-18T09:30:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_204', amount: 890.00, merchant: 'JioFiber Broadband', category: 'Utilities', date: '2026-02-15T10:15:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_205', amount: 649.00, merchant: 'Netflix Subscription', category: 'Entertainment', date: '2026-02-10T12:00:00Z', type: 'DEBIT', account_last4: 'APP (Wallet)' },
  { id: 'tx_206', amount: 12000.00, merchant: 'Rent Transfer (G. Jindal)', category: 'Housing', date: '2026-02-05T11:00:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_206b', amount: 5000.00, merchant: 'NPS Tier 1 Contribution', category: 'Investment', date: '2026-02-04T09:10:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_207', amount: 1560.00, merchant: 'Amazon India', category: 'Shopping', date: '2026-02-03T14:45:00Z', type: 'DEBIT', account_last4: '4589' },
  { id: 'tx_208', amount: 40000.00, merchant: 'Salary (Tech Corp)', category: 'Income', date: '2026-02-01T09:00:00Z', type: 'CREDIT', account_last4: '4589' },
];
