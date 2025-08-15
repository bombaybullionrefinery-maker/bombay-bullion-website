/**
 * Bombay Bullion Refinery — Demo Server
 * Simple Express API with SQLite (better-sqlite3)
 *
 * Run:
 *   npm install
 *   node server.js
 *
 * The server serves static files from /public and exposes simple REST endpoints:
 * GET  /api/stock
 * POST /api/stock   (protected by ADMIN_PWD env or default 'admin123')
 * GET  /api/customers
 * POST /api/customers
 * GET  /api/transactions
 * POST /api/transactions
 *
 * The server auto-initializes a SQLite database (data.db) on first run.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const ADMIN_PWD = process.env.ADMIN_PWD || 'admin123';
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.db');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ensure DB exists and has tables
function initDb() {
  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      gold_fine REAL DEFAULT 0,
      silver_fine REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mode TEXT,
      product TEXT,
      customer TEXT,
      gross REAL,
      touch REAL,
      sample REAL,
      fine REAL,
      fineAfter REAL,
      givenGold REAL,
      diffGold REAL,
      rate REAL,
      charges REAL,
      finalCash REAL,
      givenCash REAL,
      rtgs TEXT,
      net REAL
    );
  `);

  // ensure a single stock row exists with id = 1
  const row = db.prepare('SELECT COUNT(*) AS c FROM stock').get();
  if(row.c === 0) {
    db.prepare('INSERT INTO stock (id, gold_fine, silver_fine) VALUES (1, 0, 0)').run();
  }
  return db;
}

const db = initDb();

// API: get stock
app.get('/api/stock', (req, res) => {
  const row = db.prepare('SELECT gold_fine AS Gold, silver_fine AS Silver, updated_at FROM stock WHERE id=1').get();
  res.json({ ok: true, stock: row });
});

// API: set stock (protected)
app.post('/api/stock', (req, res) => {
  const { gold, silver, pwd } = req.body || {};
  if(pwd !== ADMIN_PWD) return res.status(403).json({ ok:false, error: 'wrong password' });
  const stmt = db.prepare('UPDATE stock SET gold_fine = ?, silver_fine = ?, updated_at=CURRENT_TIMESTAMP WHERE id=1');
  stmt.run(Number(gold)||0, Number(silver)||0);
  const row = db.prepare('SELECT gold_fine AS Gold, silver_fine AS Silver, updated_at FROM stock WHERE id=1').get();
  res.json({ ok:true, stock: row });
});

// Customers
app.get('/api/customers', (req, res) => {
  const rows = db.prepare('SELECT id, name, phone, created_at FROM customers ORDER BY id DESC LIMIT 200').all();
  res.json({ ok:true, customers: rows });
});
app.post('/api/customers', (req, res) => {
  const { name, phone } = req.body || {};
  if(!name) return res.status(400).json({ ok:false, error:'name required' });
  const info = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name, phone||null);
  const row = db.prepare('SELECT id, name, phone, created_at FROM customers WHERE id=?').get(info.lastInsertRowid);
  res.json({ ok:true, customer: row });
});

// Transactions
app.get('/api/transactions', (req, res) => {
  const rows = db.prepare('SELECT * FROM transactions ORDER BY id DESC LIMIT 500').all();
  res.json({ ok:true, transactions: rows });
});
app.post('/api/transactions', (req, res) => {
  const tx = req.body || {};
  // basic validation / sanitization
  const insert = db.prepare(`INSERT INTO transactions 
    (tx_id, mode, product, customer, gross, touch, sample, fine, fineAfter, givenGold, diffGold, rate, charges, finalCash, givenCash, rtgs, net)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = insert.run(
    tx.tx_id || ('TX' + Date.now()),
    tx.mode || 'BUY',
    tx.product || 'Gold',
    tx.customer || null,
    Number(tx.gross) || 0,
    Number(tx.touch) || 0,
    Number(tx.sample) || 0,
    Number(tx.fine) || 0,
    Number(tx.fineAfter) || 0,
    Number(tx.givenGold) || 0,
    Number(tx.diffGold) || 0,
    Number(tx.rate) || 0,
    Number(tx.charges) || 0,
    Number(tx.finalCash) || 0,
    Number(tx.givenCash) || 0,
    tx.rtgs || null,
    Number(tx.net) || 0
  );

  // update stock accordingly
  const last = db.prepare('SELECT gold_fine AS Gold, silver_fine AS Silver FROM stock WHERE id=1').get();
  let newGold = last.Gold, newSilver = last.Silver;
  if(tx.product === 'Gold') {
    newGold = newGold + (tx.mode === 'BUY' ? Number(tx.fineAfter) : -Number(tx.fineAfter));
  } else {
    newSilver = newSilver + (tx.mode === 'BUY' ? Number(tx.fineAfter) : -Number(tx.fineAfter));
  }
  db.prepare('UPDATE stock SET gold_fine = ?, silver_fine = ?, updated_at=CURRENT_TIMESTAMP WHERE id=1').run(newGold, newSilver);

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
  res.json({ ok:true, transaction: row });
});

// serve index.html for all other routes (SPA friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});