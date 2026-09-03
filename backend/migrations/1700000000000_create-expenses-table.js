/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('expenses', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    category: {
      type: 'varchar(50)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    date: {
      type: 'date',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Speeds up the "GET /api/expenses?month=YYYY-MM" query
  pgm.createIndex('expenses', 'date');
};

exports.down = (pgm) => {
  pgm.dropTable('expenses');
};
