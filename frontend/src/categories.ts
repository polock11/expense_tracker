import { Category } from './api/expenses';

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'food', label: 'Food', color: '#A8432E' },
  { value: 'transport', label: 'Transport', color: '#2F5D50' },
  { value: 'bills', label: 'Bills', color: '#4A5A8C' },
  { value: 'shopping', label: 'Shopping', color: '#9C6B30' },
  { value: 'health', label: 'Health', color: '#6B4A8C' },
  { value: 'entertainment', label: 'Entertainment', color: '#2F7D8C' },
  { value: 'other', label: 'Other', color: '#8A8371' },
];

export function categoryColor(category: Category): string {
  return CATEGORIES.find((c) => c.value === category)?.color ?? '#8A8371';
}

export function categoryLabel(category: Category): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
