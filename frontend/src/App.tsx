import { useEffect, useMemo, useState, useCallback } from 'react';
import Calendar from './components/Calendar';
import DayPanel from './components/DayPanel';
import MonthSummary from './components/MonthSummary';
import { Category, Expense, createExpense, deleteExpense, fetchMonth, updateExpense } from './api/expenses';
import { monthLabel as formatMonthLabel, toISODate, toMonthKey } from './dateUtils';

const today = new Date();
const todayISO = toISODate(today);

export default function App() {
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthKey = toMonthKey(cursor);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMonth(monthKey);
      setExpenses(res.expenses);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    load();
  }, [load]);

  const expensesByDay = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [expenses]);

  const selectedExpenses = expensesByDay.get(selectedDate) ?? [];

  const goToMonth = (delta: number) => {
    setCursor(new Date(year, month + delta, 1));
  };

  const handleAdd = async (input: { amount: number; category: Category; description?: string; date: string }) => {
    await createExpense(input);
    await load();
  };

  const handleUpdate = async (
    id: number,
    input: Partial<{ amount: number; category: Category; description: string; date: string }>
  ) => {
    await updateExpense(id, input);
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteExpense(id);
    await load();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Daily Ledger</p>
          <h1>Expense Tracker</h1>
        </div>
        <nav className="month-nav">
          <button type="button" onClick={() => goToMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <span>{formatMonthLabel(year, month)}</span>
          <button type="button" onClick={() => goToMonth(1)} aria-label="Next month">
            ›
          </button>
        </nav>
      </header>

      {error && <div className="app-error">{error}</div>}

      <main className="app-main">
        <section className="app-calendar-col">
          {loading ? (
            <div className="loading-placeholder">Loading…</div>
          ) : (
            <Calendar
              year={year}
              month={month}
              expensesByDay={expensesByDay}
              selectedDate={selectedDate}
              todayISO={todayISO}
              onSelectDate={setSelectedDate}
            />
          )}
          <MonthSummary expenses={expenses} total={total} monthLabel={formatMonthLabel(year, month)} />
        </section>

        <section className="app-day-col">
          <DayPanel
            dateISO={selectedDate}
            expenses={selectedExpenses}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}
