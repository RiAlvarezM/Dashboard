-- Dashboard Financiero — D1 Schema
-- Run with: wrangler d1 execute dashboard-financiero-db --remote --file=db/schema.sql

CREATE TABLE IF NOT EXISTS cuentas (
  categoria      TEXT NOT NULL,
  nombre_cuenta  TEXT PRIMARY KEY,
  monto_objetivo REAL DEFAULT 0,
  incluir        INTEGER DEFAULT 1,
  ultimo_valor   REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS networth (
  fecha      TEXT PRIMARY KEY,
  ahorro     REAL DEFAULT 0,
  inversion  REAL DEFAULT 0,
  jubilacion REAL DEFAULT 0,
  deuda      REAL DEFAULT 0,
  prestamo   REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS flows (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,
  name         TEXT NOT NULL,
  amount       REAL DEFAULT 0,
  frequency    TEXT NOT NULL,
  start_date   TEXT,
  end_date     TEXT,
  day_of_month REAL,
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS puntos (
  fecha     TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor     REAL DEFAULT 0,
  PRIMARY KEY (fecha, categoria)
);

CREATE TABLE IF NOT EXISTS propiedades (
  propiedad    TEXT PRIMARY KEY,
  valor_avaluo REAL DEFAULT 0,
  fecha_avaluo TEXT
);
