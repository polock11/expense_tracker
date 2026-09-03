import { buildMonthGrid, toISODate, WEEKDAY_LABELS } from '../dateUtils';
import { Expense } from '../api/expenses';
import { categoryColor } from '../categories';

interface Props {
  year: number;
  month: number; // 0-indexed
  expensesByDay: Map<string, Expense[]>;
  selectedDate: string;
  todayISO: string;
  onSelectDate: (iso: string) => void;
}

export default function Calendar({
  year,
  month,
  expensesByDay,
  selectedDate,
  todayISO,
  onSelectDate,
}: Props) {
  const cells = buildMonthGrid(year, month);

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="calendar-cell calendar-cell--empty" />;

          const iso = toISODate(date);
          const dayExpenses = expensesByDay.get(iso) ?? [];
          const dayTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayISO;

          return (
            <button
              key={iso}
              className={[
                'calendar-cell',
                isSelected ? 'calendar-cell--selected' : '',
                isToday ? 'calendar-cell--today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(iso)}
            >
              <span className="calendar-cell-date">{date.getDate()}</span>
              {dayTotal > 0 && (
                <span className="calendar-cell-total">
                  {dayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
              {dayExpenses.length > 0 && (
                <span className="calendar-cell-dots">
                  {dayExpenses.slice(0, 4).map((e) => (
                    <span key={e.id} className="calendar-dot" style={{ background: categoryColor(e.category) }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
