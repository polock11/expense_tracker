import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { CreateExpenseInput, UpdateExpenseInput } from '../types';

const router = Router();

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CATEGORIES = [
  'food',
  'transport',
  'bills',
  'shopping',
  'health',
  'entertainment',
  'other',
];

// GET /api/expenses?month=YYYY-MM  -> list expenses for a month, plus the total
router.get('/', async (req: Request, res: Response) => {
  const { month } = req.query;

  if (typeof month !== 'string' || !MONTH_RE.test(month)) {
    return res.status(400).json({ error: 'Query param "month" is required in YYYY-MM format' });
  }

  try {
    const result = await pool.query(
      `SELECT id, amount, category, description, to_char(date, 'YYYY-MM-DD') AS date, created_at
       FROM expenses
       WHERE to_char(date, 'YYYY-MM') = $1
       ORDER BY date ASC, id ASC`,
      [month]
    );

    const total = result.rows.reduce((sum, row) => sum + Number(row.amount), 0);

    res.json({ expenses: result.rows, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses -> create a new expense
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as CreateExpenseInput;

  if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
    return res.status(400).json({ error: '"amount" must be a positive number' });
  }
  if (!VALID_CATEGORIES.includes(body.category)) {
    return res.status(400).json({ error: `"category" must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (typeof body.date !== 'string' || !DATE_RE.test(body.date)) {
    return res.status(400).json({ error: '"date" must be in YYYY-MM-DD format' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (amount, category, description, date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, amount, category, description, to_char(date, 'YYYY-MM-DD') AS date, created_at`,
      [body.amount, body.category, body.description ?? null, body.date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id -> update an existing expense
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  const body = req.body as UpdateExpenseInput;

  if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
    return res.status(400).json({ error: '"amount" must be a positive number' });
  }
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    return res.status(400).json({ error: `"category" must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (body.date !== undefined && !DATE_RE.test(body.date)) {
    return res.status(400).json({ error: '"date" must be in YYYY-MM-DD format' });
  }

  try {
    const result = await pool.query(
      `UPDATE expenses SET
         amount = COALESCE($1, amount),
         category = COALESCE($2, category),
         description = COALESCE($3, description),
         date = COALESCE($4, date)
       WHERE id = $5
       RETURNING id, amount, category, description, to_char(date, 'YYYY-MM-DD') AS date, created_at`,
      [body.amount, body.category, body.description, body.date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id -> delete an expense
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
