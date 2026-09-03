import { FormEvent, useState } from 'react';
import { Category, Expense } from '../api/expenses';
import { CATEGORIES, categoryColor, categoryLabel } from '../categories';

interface Props {
  dateISO: string;
  expenses: Expense[];
  onAdd: (input: { amount: number; category: Category; description?: string; date: string }) => Promise<void>;
  onUpdate: (id: number, input: Partial<{ amount: number; category: Category; description: string; date: string }>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const dateLabel = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

export default function DayPanel({ dateISO, expenses, onAdd, onUpdate, onDelete }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setAmount('');
    setCategory('food');
    setDescription('');
    setEditingId(null);
  };

  const startEdit = (e: Expense) => {
    setEditingId(e.id);
    setAmount(e.amount);
    setCategory(e.category);
    setDescription(e.description ?? '');
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    const parsed = Number(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, { amount: parsed, category, description });
      } else {
        await onAdd({ amount: parsed, category, description: description || undefined, date: dateISO });
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const dayTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="day-panel">
      <header className="day-panel-header">
        <h2>{dateLabel(dateISO)}</h2>
        {dayTotal > 0 && <span className="day-panel-total">€{dayTotal.toFixed(2)}</span>}
      </header>

      <ul className="expense-list">
        {expenses.length === 0 && <li className="expense-list-empty">No expenses logged for this day.</li>}
        {expenses.map((e) => (
          <li key={e.id} className="expense-row">
            <span className="expense-dot" style={{ background: categoryColor(e.category) }} />
            <div className="expense-row-main">
              <span className="expense-row-category">{categoryLabel(e.category)}</span>
              {e.description && <span className="expense-row-desc">{e.description}</span>}
            </div>
            <span className="expense-row-amount">€{Number(e.amount).toFixed(2)}</span>
            <div className="expense-row-actions">
              <button type="button" onClick={() => startEdit(e)} aria-label="Edit expense">
                Edit
              </button>
              <button type="button" onClick={() => onDelete(e.id)} aria-label="Delete expense" className="danger">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form className="expense-form" onSubmit={handleSubmit}>
        <h3>{editingId !== null ? 'Edit expense' : 'Add expense'}</h3>
        <div className="expense-form-row">
          <label>
            Amount
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Description (optional)
          <input
            type="text"
            placeholder="e.g. Groceries at the market"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="expense-form-actions">
          {editingId !== null && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={submitting}>
            {editingId !== null ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
