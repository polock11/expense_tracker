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
  amount: string;
  category: Category;
  description: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface MonthResponse {
  expenses: Expense[];
  total: number;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function fetchMonth(month: string): Promise<MonthResponse> {
  return fetch(`${API_URL}/expenses?month=${month}`).then((r) => handle<MonthResponse>(r));
}

export function createExpense(input: {
  amount: number;
  category: Category;
  description?: string;
  date: string;
}): Promise<Expense> {
  return fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => handle<Expense>(r));
}

export function updateExpense(
  id: number,
  input: Partial<{ amount: number; category: Category; description: string; date: string }>
): Promise<Expense> {
  return fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => handle<Expense>(r));
}

export function deleteExpense(id: number): Promise<void> {
  return fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }).then((r) => handle<void>(r));
}
