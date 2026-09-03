import { Expense } from '../api/expenses';
import { CATEGORIES, categoryColor, categoryLabel } from '../categories';

interface Props {
  expenses: Expense[];
  total: number;
  monthLabel: string;
}

export default function MonthSummary({ expenses, total, monthLabel }: Props) {
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
  }

  const breakdown = CATEGORIES.map((c) => ({ ...c, amount: byCategory.get(c.value) ?? 0 })).filter(
    (c) => c.amount > 0
  );

  return (
    <div className="month-summary">
      <header className="month-summary-header">
        <h2>{monthLabel}</h2>
        <span className="month-summary-total">€{total.toFixed(2)}</span>
      </header>

      {breakdown.length === 0 ? (
        <p className="month-summary-empty">No expenses logged this month yet.</p>
      ) : (
        <ul className="month-breakdown">
          {breakdown
            .sort((a, b) => b.amount - a.amount)
            .map((c) => (
              <li key={c.value}>
                <span className="expense-dot" style={{ background: c.color }} />
                <span className="month-breakdown-label">{c.label}</span>
                <span className="month-breakdown-bar-track">
                  <span
                    className="month-breakdown-bar-fill"
                    style={{
                      width: `${total > 0 ? (c.amount / total) * 100 : 0}%`,
                      background: c.color,
                    }}
                  />
                </span>
                <span className="month-breakdown-amount">€{c.amount.toFixed(2)}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
