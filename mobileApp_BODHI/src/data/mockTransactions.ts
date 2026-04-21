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
  {
    id: 'tx_101',
    amount: 1200.00,
    merchant: 'Blinkit',
    category: 'Groceries',
    date: '2026-04-21T09:20:00Z',
    type: 'DEBIT',
    account_last4: '4589'
  },
  {
    id: 'tx_102',
    amount: 150.00,
    merchant: 'Uber Ride',
    category: 'Transport',
    date: '2026-04-20T18:45:00Z',
    type: 'DEBIT',
    account_last4: 'APP (Wallet)'
  },
  {
    id: 'tx_103',
    amount: 15400.00,
    merchant: 'Rent Transfer (G. Jindal)',
    category: 'Housing',
    date: '2026-04-20T11:00:00Z',
    type: 'DEBIT',
    account_last4: '8821'
  },
  {
    id: 'tx_104',
    amount: 80.00,
    merchant: 'Zepto',
    category: 'Groceries',
    date: '2026-04-19T10:30:00Z',
    type: 'DEBIT',
    account_last4: '4589'
  },
  {
    id: 'tx_105',
    amount: 450.00,
    merchant: 'Swiggy',
    category: 'Food',
    date: '2026-04-18T20:15:00Z',
    type: 'DEBIT',
    account_last4: '4589'
  },
  {
    id: 'tx_106',
    amount: 24900.00,
    merchant: 'Salary (Tech Corp)',
    category: 'Income',
    date: '2026-04-01T09:00:00Z',
    type: 'CREDIT',
    account_last4: '4589'
  },
  {
    id: 'tx_107',
    amount: 2500.00,
    merchant: 'Zerodha Mutual Funds SIP',
    category: 'Investment',
    date: '2026-04-05T08:00:00Z',
    type: 'DEBIT',
    account_last4: '4589'
  },
  {
    id: 'tx_108',
    amount: 600.00,
    merchant: 'Netflix Subscription',
    category: 'Entertainment',
    date: '2026-04-10T12:00:00Z',
    type: 'DEBIT',
    account_last4: '8821'
  }
];
