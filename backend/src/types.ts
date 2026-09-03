export type Category =
  | 'food'
  | 'transport'
  | 'bills'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'other';

export interface Expense {
  id: number;
  amount: string; // numeric comes back from pg as a string
  category: Category;
  description: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  category: Category;
  description?: string | null;
  date: string; // YYYY-MM-DD
}

export interface UpdateExpenseInput {
  amount?: number;
  category?: Category;
  description?: string | null;
  date?: string;
}
