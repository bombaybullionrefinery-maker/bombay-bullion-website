# Bombay Bullion Refinery — Demo (Node.js + Express + SQLite)

This is a ready-to-run demo for a cloud-ready Buy/Sell accounting app inspired by Hambire Solutions.
It includes:
- Frontend (single-page app) in `/public/index.html`
- Simple REST API and data stored in `data.db` (SQLite)
- Stock management, customers, transactions
- Protected `POST /api/stock` using an admin password (env `ADMIN_PWD`, default `admin123`)

## Quick start (local)
1. Install Node.js (v16+ recommended)
2. Extract the ZIP and open a terminal in the project folder
3. Run:
   ```bash
   npm install
   node server.js
   ```
4. Open http://localhost:3000 in your browser

## Deploy to a cloud host
- **Render / Railway / Fly / DigitalOcean App Platform / Heroku** support Node.js apps.
- Set environment variable `ADMIN_PWD` in the host to change admin password.
- Expose port via the platform (default server listens to `process.env.PORT`).

## Endpoints
- `GET /api/stock` — get current fine stocks
- `POST /api/stock` — set stocks (payload: `{ gold, silver, pwd }`)
- `GET /api/customers` — list customers
- `POST /api/customers` — add customer (payload `{ name, phone }`)
- `GET /api/transactions` — list transactions
- `POST /api/transactions` — save transaction (payload with fields like in UI)

## Notes
- This is a demo scaffold to help you start quickly. For production:
  - Move to PostgreSQL or managed DB
  - Add real authentication (JWT or session-based)
  - Harden admin endpoints, add audit logs, backups
  - Add SSL/HTTPS via host

If you want, I can:
- Convert this into a ZIP you can download (I will provide it here)
- Help deploy it step-by-step to a low-cost host and set up a domain (I can write exact commands)
- Add print templates, invoice design, or POS thermal printer integration