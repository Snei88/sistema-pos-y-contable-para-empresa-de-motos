//src\main\database\migrations\init.ts
import { getSqlite } from '../connection'

// ============================================================
// INICIALIZACIÓN — Crea todas las tablas si no existen
// Se ejecuta al arrancar la app (idempotente)
// ============================================================

export function runMigrations(): void {
  const db = getSqlite()
  console.log('[DB] Ejecutando migraciones...')

  db.exec(`
    -- USUARIOS
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      full_name     TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'cajero' CHECK(role IN ('admin','cajero','mecanico','supervisor')),
      is_active     INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);

    -- CATEGORÍAS
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      description TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- PROVEEDORES
    CREATE TABLE IF NOT EXISTS suppliers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      nit        TEXT,
      contact    TEXT,
      phone      TEXT,
      email      TEXT,
      address    TEXT,
      notes      TEXT,
      is_active  INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
    CREATE INDEX IF NOT EXISTS idx_suppliers_nit  ON suppliers(nit);

    -- PRODUCTOS
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT    NOT NULL UNIQUE,
      barcode     TEXT,
      name        TEXT    NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      cost_price  REAL    NOT NULL DEFAULT 0,
      sale_price  REAL    NOT NULL DEFAULT 0,
      stock       REAL    NOT NULL DEFAULT 0,
      min_stock   REAL    NOT NULL DEFAULT 3,
      unit        TEXT    NOT NULL DEFAULT 'und',
      status      TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      image_path  TEXT,
      deleted_at  TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_code     ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_barcode  ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);

    -- MOVIMIENTOS DE INVENTARIO (KARDEX)
    CREATE TABLE IF NOT EXISTS stock_movements (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id   INTEGER NOT NULL REFERENCES products(id),
      type         TEXT    NOT NULL CHECK(type IN ('entrada','salida','ajuste_suma','ajuste_resta','devolucion','venta','compra')),
      quantity     REAL    NOT NULL,
      cost_price   REAL,
      sale_price   REAL,
      stock_before REAL    NOT NULL,
      stock_after  REAL    NOT NULL,
      reference    TEXT,
      reference_id INTEGER,
      notes        TEXT,
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_movements_product   ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_movements_type      ON stock_movements(type);
    CREATE INDEX IF NOT EXISTS idx_movements_date      ON stock_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_movements_reference ON stock_movements(reference);

    -- CLIENTES
    CREATE TABLE IF NOT EXISTS clients (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      document_type TEXT CHECK(document_type IN ('cedula','nit','pasaporte','otro')),
      document      TEXT,
      name          TEXT    NOT NULL,
      phone         TEXT,
      email         TEXT,
      address       TEXT,
      notes         TEXT,
      credit_limit  REAL    NOT NULL DEFAULT 0,
      discount      REAL    NOT NULL DEFAULT 0,
      is_active     INTEGER NOT NULL DEFAULT 1,
      deleted_at    TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_clients_name     ON clients(name);
    CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
    CREATE INDEX IF NOT EXISTS idx_clients_phone    ON clients(phone);

    -- SESIONES DE CAJA
    CREATE TABLE IF NOT EXISTS cash_sessions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL REFERENCES users(id),
      status           TEXT    NOT NULL DEFAULT 'abierta' CHECK(status IN ('abierta','cerrada')),
      opening_balance  REAL    NOT NULL DEFAULT 0,
      closing_balance  REAL,
      expected_balance REAL,
      difference       REAL,
      opened_at        TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      closed_at        TEXT,
      notes            TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_cash_status ON cash_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_cash_user   ON cash_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_cash_opened ON cash_sessions(opened_at);

    -- VENTAS
    CREATE TABLE IF NOT EXISTS sales (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number  TEXT    NOT NULL UNIQUE,
      client_id       INTEGER REFERENCES clients(id),
      client_name     TEXT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      cash_session_id INTEGER REFERENCES cash_sessions(id),
      work_order_id   INTEGER,
      status          TEXT    NOT NULL DEFAULT 'completada' CHECK(status IN ('completada','pendiente','anulada')),
      payment_status  TEXT    NOT NULL DEFAULT 'pagado' CHECK(payment_status IN ('pagado','pendiente','parcial')),
      subtotal        REAL    NOT NULL DEFAULT 0,
      discount        REAL    NOT NULL DEFAULT 0,
      tax             REAL    NOT NULL DEFAULT 0,
      total           REAL    NOT NULL DEFAULT 0,
      paid            REAL    NOT NULL DEFAULT 0,
      change          REAL    NOT NULL DEFAULT 0,
      notes           TEXT,
      cancel_reason   TEXT,
      canceled_by     INTEGER REFERENCES users(id),
      canceled_at     TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_sales_invoice        ON sales(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_sales_client         ON sales(client_id);
    CREATE INDEX IF NOT EXISTS idx_sales_user           ON sales(user_id);
    CREATE INDEX IF NOT EXISTS idx_sales_status         ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
    CREATE INDEX IF NOT EXISTS idx_sales_date           ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_cash_session   ON sales(cash_session_id);

    -- ITEMS DE VENTA
    CREATE TABLE IF NOT EXISTS sale_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id      INTEGER NOT NULL REFERENCES sales(id),
      product_id   INTEGER REFERENCES products(id),
      product_name TEXT    NOT NULL,
      product_code TEXT,
      quantity     REAL    NOT NULL,
      unit_price   REAL    NOT NULL,
      cost_price   REAL    NOT NULL DEFAULT 0,
      discount     REAL    NOT NULL DEFAULT 0,
      subtotal     REAL    NOT NULL,
      is_manual    INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

    -- PAGOS DE VENTA
    CREATE TABLE IF NOT EXISTS sale_payments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id    INTEGER NOT NULL REFERENCES sales(id),
      method     TEXT    NOT NULL CHECK(method IN ('efectivo','tarjeta','transferencia','nequi','daviplata','credito','otro')),
      amount     REAL    NOT NULL,
      reference  TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_payments_sale   ON sale_payments(sale_id);
    CREATE INDEX IF NOT EXISTS idx_payments_method ON sale_payments(method);

    -- COMPRAS
    CREATE TABLE IF NOT EXISTS purchases (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id    INTEGER NOT NULL REFERENCES suppliers(id),
      user_id        INTEGER NOT NULL REFERENCES users(id),
      invoice_number TEXT,
      status         TEXT    NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','recibida','parcial','anulada')),
      payment_status TEXT    NOT NULL DEFAULT 'pendiente' CHECK(payment_status IN ('pagado','pendiente','parcial')),
      subtotal       REAL    NOT NULL DEFAULT 0,
      tax            REAL    NOT NULL DEFAULT 0,
      total          REAL    NOT NULL DEFAULT 0,
      paid           REAL    NOT NULL DEFAULT 0,
      due_date       TEXT,
      notes          TEXT,
      received_at    TEXT,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_status   ON purchases(status);
    CREATE INDEX IF NOT EXISTS idx_purchases_date     ON purchases(created_at);
    CREATE INDEX IF NOT EXISTS idx_purchases_due      ON purchases(due_date);

    -- ITEMS DE COMPRA
    CREATE TABLE IF NOT EXISTS purchase_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id  INTEGER NOT NULL REFERENCES purchases(id),
      product_id   INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT    NOT NULL,
      quantity     REAL    NOT NULL,
      unit_cost    REAL    NOT NULL,
      subtotal     REAL    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_product  ON purchase_items(product_id);

    -- MOTOS
    CREATE TABLE IF NOT EXISTS motorcycles (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id      INTEGER REFERENCES clients(id),
      plate          TEXT    NOT NULL,
      brand          TEXT    NOT NULL,
      model          TEXT    NOT NULL,
      year           INTEGER,
      color          TEXT,
      engine_number  TEXT,
      chassis_number TEXT,
      notes          TEXT,
      deleted_at     TEXT,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_motos_plate  ON motorcycles(plate);
    CREATE INDEX IF NOT EXISTS idx_motos_client ON motorcycles(client_id);
    CREATE INDEX IF NOT EXISTS idx_motos_brand  ON motorcycles(brand);

    -- MECÁNICOS
    CREATE TABLE IF NOT EXISTS mechanics (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER REFERENCES users(id),
      name       TEXT    NOT NULL,
      document   TEXT,
      phone      TEXT,
      specialty  TEXT,
      patio_fee  REAL    NOT NULL DEFAULT 0,
      is_active  INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_mechanics_name ON mechanics(name);

    -- ÓRDENES DE TRABAJO
    CREATE TABLE IF NOT EXISTS work_orders (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number       TEXT    NOT NULL UNIQUE,
      motorcycle_id      INTEGER NOT NULL REFERENCES motorcycles(id),
      client_id          INTEGER REFERENCES clients(id),
      client_name        TEXT,
      mechanic_id        INTEGER REFERENCES mechanics(id),
      user_id            INTEGER NOT NULL REFERENCES users(id),
      status             TEXT    NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','en_proceso','finalizado','entregado','anulado')),
      description        TEXT    NOT NULL,
      diagnosis          TEXT,
      labor_cost         REAL    NOT NULL DEFAULT 0,
      parts_cost         REAL    NOT NULL DEFAULT 0,
      total              REAL    NOT NULL DEFAULT 0,
      estimated_delivery TEXT,
      delivered_at       TEXT,
      notes              TEXT,
      deleted_at         TEXT,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at         TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_wo_number   ON work_orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_wo_moto     ON work_orders(motorcycle_id);
    CREATE INDEX IF NOT EXISTS idx_wo_mechanic ON work_orders(mechanic_id);
    CREATE INDEX IF NOT EXISTS idx_wo_status   ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_wo_date     ON work_orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_wo_client   ON work_orders(client_id);

    -- ITEMS DE ORDEN DE TRABAJO
    CREATE TABLE IF NOT EXISTS work_order_items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
      type          TEXT    NOT NULL CHECK(type IN ('repuesto','mano_obra','otro')),
      product_id    INTEGER REFERENCES products(id),
      description   TEXT    NOT NULL,
      quantity      REAL    NOT NULL DEFAULT 1,
      unit_price    REAL    NOT NULL DEFAULT 0,
      subtotal      REAL    NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_wo_items_order   ON work_order_items(work_order_id);
    CREATE INDEX IF NOT EXISTS idx_wo_items_product ON work_order_items(product_id);

    -- LIQUIDACIONES MECÁNICOS
    CREATE TABLE IF NOT EXISTS mechanic_settlements (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      mechanic_id      INTEGER NOT NULL REFERENCES mechanics(id),
      date             TEXT    NOT NULL,
      total_generated  REAL    NOT NULL DEFAULT 0,
      patio_fee        REAL    NOT NULL DEFAULT 0,
      net_amount       REAL    NOT NULL DEFAULT 0,
      is_patio_paid    INTEGER NOT NULL DEFAULT 0,
      patio_paid_amount REAL   NOT NULL DEFAULT 0,
      is_settled       INTEGER NOT NULL DEFAULT 0,
      settled_amount   REAL    NOT NULL DEFAULT 0,
      settled_by       INTEGER REFERENCES users(id),
      notes            TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_settlements_mechanic ON mechanic_settlements(mechanic_id);
    CREATE INDEX IF NOT EXISTS idx_settlements_date     ON mechanic_settlements(date);

    -- CRÉDITOS / CARTERA
    CREATE TABLE IF NOT EXISTS credits (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id       INTEGER NOT NULL REFERENCES clients(id),
      sale_id         INTEGER REFERENCES sales(id),
      work_order_id   INTEGER REFERENCES work_orders(id),
      invoice_number  TEXT    NOT NULL,
      original_amount REAL    NOT NULL,
      paid_amount     REAL    NOT NULL DEFAULT 0,
      balance         REAL    NOT NULL,
      due_date        TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'al_dia' CHECK(status IN ('al_dia','proximo','vencido')),
      notes           TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_credits_client ON credits(client_id);
    CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
    CREATE INDEX IF NOT EXISTS idx_credits_due    ON credits(due_date);
    CREATE INDEX IF NOT EXISTS idx_credits_sale   ON credits(sale_id);

    -- PAGOS DE CRÉDITO
    CREATE TABLE IF NOT EXISTS credit_payments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      credit_id  INTEGER NOT NULL REFERENCES credits(id),
      amount     REAL    NOT NULL,
      method     TEXT    NOT NULL CHECK(method IN ('efectivo','tarjeta','transferencia','nequi','daviplata','credito','otro')),
      reference  TEXT,
      notes      TEXT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_credit_payments_credit ON credit_payments(credit_id);
    CREATE INDEX IF NOT EXISTS idx_credit_payments_date   ON credit_payments(created_at);

    -- PLAN DE CUENTAS PUC
    CREATE TABLE IF NOT EXISTS accounting_accounts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      code            TEXT    NOT NULL UNIQUE,
      name            TEXT    NOT NULL,
      type            TEXT    NOT NULL CHECK(type IN ('activo','pasivo','patrimonio','ingreso','gasto','costo')),
      parent_code     TEXT,
      is_active       INTEGER NOT NULL DEFAULT 1,
      allows_movement INTEGER NOT NULL DEFAULT 1,
      description     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_code   ON accounting_accounts(code);
    CREATE INDEX IF NOT EXISTS idx_accounts_type   ON accounting_accounts(type);
    CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounting_accounts(parent_code);

    -- ASIENTOS CONTABLES
    CREATE TABLE IF NOT EXISTS journal_entries (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_number   TEXT    NOT NULL UNIQUE,
      date           TEXT    NOT NULL,
      description    TEXT    NOT NULL,
      reference      TEXT,
      reference_type TEXT,
      reference_id   INTEGER,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_journal_date     ON journal_entries(date);
    CREATE INDEX IF NOT EXISTS idx_journal_ref      ON journal_entries(reference);
    CREATE INDEX IF NOT EXISTS idx_journal_ref_type ON journal_entries(reference_type);

    -- LÍNEAS DE ASIENTO
    CREATE TABLE IF NOT EXISTS journal_lines (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id     INTEGER NOT NULL REFERENCES journal_entries(id),
      account_code TEXT    NOT NULL REFERENCES accounting_accounts(code),
      debit        REAL    NOT NULL DEFAULT 0,
      credit       REAL    NOT NULL DEFAULT 0,
      description  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_journal_lines_entry   ON journal_lines(entry_id);
    CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_code);

    -- AUDITORÍA
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      user_name  TEXT    NOT NULL,
      action     TEXT    NOT NULL,
      module     TEXT    NOT NULL,
      record_id  INTEGER,
      before     TEXT,
      after      TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

    -- CONFIGURACIÓN
    CREATE TABLE IF NOT EXISTS settings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key        TEXT NOT NULL UNIQUE,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- BACKUPS
    CREATE TABLE IF NOT EXISTS backup_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name  TEXT    NOT NULL,
      file_path  TEXT    NOT NULL,
      file_size  INTEGER NOT NULL DEFAULT 0,
      type       TEXT    NOT NULL DEFAULT 'manual' CHECK(type IN ('auto','manual')),
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `)

  console.log('[DB] Migraciones completadas')
}