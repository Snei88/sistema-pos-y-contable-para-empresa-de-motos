//src\main\database\seeds\index.ts
import { getSqlite } from '../connection'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function runSeeds(): void {
  const db = getSqlite()
  console.log('[DB] Verificando seeds...')

  // Admin por defecto
  const adminExists = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get()
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, is_active)
      VALUES ('admin', ?, 'Administrador', 'admin', 1)
    `).run(hashPassword('admin123'))
    console.log('[DB] Usuario admin creado — user: admin / pass: admin123')
  }

  // Categorías base
  const catCount = db.prepare(`SELECT COUNT(*) as c FROM categories`).get() as { c: number }
  if (catCount.c === 0) {
    const cats = [
      'Frenos', 'Motor', 'Suspensión', 'Transmisión', 'Eléctrico',
      'Carrocería', 'Aceites y Lubricantes', 'Llantas', 'Filtros', 'Varios'
    ]
    const stmt = db.prepare(`INSERT INTO categories (name) VALUES (?)`)
    cats.forEach(name => stmt.run(name))
    console.log('[DB] Categorías base creadas')
  }

  // Configuración inicial
  const configs: [string, string][] = [
    ['empresa_nombre',   'Manuel Motos'],
    ['empresa_nit',      'N/D'],
    ['empresa_direccion','N/D'],
    ['empresa_telefono', 'N/D'],
    ['empresa_ciudad',   'Colombia'],
    ['empresa_email',    ''],
    ['empresa_encargado',''],
    ['iva_rate',         '0.19'],
    ['moneda',           'COP'],
    ['backup_intervalo', '6'],
    ['invoice_sequence', '0'],
    ['workorder_sequence','0'],
  ]
  const settingStmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  configs.forEach(([key, value]) => settingStmt.run(key, value))

  // PUC Colombia — cuentas mínimas necesarias
  const pucCount = db.prepare(`SELECT COUNT(*) as c FROM accounting_accounts`).get() as { c: number }
  if (pucCount.c === 0) {
    const accounts = [
      // ACTIVOS
      ['1',    'ACTIVOS',                          'activo',    null,   0],
      ['11',   'EFECTIVO Y EQUIVALENTES',          'activo',    '1',    0],
      ['1105', 'Caja General',                     'activo',    '11',   1],
      ['1110', 'Bancos',                           'activo',    '11',   1],
      ['13',   'DEUDORES',                         'activo',    '1',    0],
      ['1305', 'Clientes',                         'activo',    '13',   1],
      ['1330', 'Anticipos y Avances',              'activo',    '13',   1],
      ['14',   'INVENTARIOS',                      'activo',    '1',    0],
      ['1435', 'Mercancías no Fabricadas',         'activo',    '14',   1],
      ['15',   'PROPIEDADES Y EQUIPO',             'activo',    '1',    0],
      ['1524', 'Equipo de Oficina',                'activo',    '15',   1],
      // PASIVOS
      ['2',    'PASIVOS',                          'pasivo',    null,   0],
      ['21',   'OBLIGACIONES FINANCIERAS',         'pasivo',    '2',    0],
      ['22',   'PROVEEDORES',                      'pasivo',    '2',    0],
      ['2205', 'Proveedores Nacionales',           'pasivo',    '22',   1],
      ['24',   'CUENTAS POR PAGAR',                'pasivo',    '2',    0],
      ['2408', 'Impuesto IVA por Pagar',           'pasivo',    '24',   1],
      ['2365', 'Retención en la Fuente',           'pasivo',    '24',   1],
      // PATRIMONIO
      ['3',    'PATRIMONIO',                       'patrimonio',null,   0],
      ['31',   'CAPITAL SOCIAL',                   'patrimonio','3',    0],
      ['3105', 'Capital',                          'patrimonio','31',   1],
      ['36',   'RESULTADOS DEL EJERCICIO',         'patrimonio','3',    0],
      ['3605', 'Utilidad del Ejercicio',           'patrimonio','36',   1],
      // INGRESOS
      ['4',    'INGRESOS',                         'ingreso',   null,   0],
      ['41',   'OPERACIONALES',                    'ingreso',   '4',    0],
      ['4135', 'Comercio al por Mayor y Menor',    'ingreso',   '41',   1],
      ['4175', 'Servicios de Taller',              'ingreso',   '41',   1],
      ['42',   'NO OPERACIONALES',                 'ingreso',   '4',    0],
      ['4210', 'Ingresos Diversos',                'ingreso',   '42',   1],
      // COSTOS
      ['6',    'COSTOS DE VENTAS',                 'costo',     null,   0],
      ['61',   'COSTOS DE MERCANCÍA VENDIDA',      'costo',     '6',    0],
      ['6135', 'Costo de Ventas - Repuestos',      'costo',     '61',   1],
      ['6175', 'Costo de Servicios',               'costo',     '61',   1],
      // GASTOS
      ['5',    'GASTOS OPERACIONALES',             'gasto',     null,   0],
      ['51',   'ADMINISTRACIÓN',                   'gasto',     '5',    0],
      ['5105', 'Gastos de Personal',               'gasto',     '51',   1],
      ['5110', 'Honorarios',                       'gasto',     '51',   1],
      ['5115', 'Impuestos',                        'gasto',     '51',   1],
      ['5120', 'Arrendamientos',                   'gasto',     '51',   1],
      ['5135', 'Servicios Públicos',               'gasto',     '51',   1],
      ['5145', 'Mantenimiento y Reparaciones',     'gasto',     '51',   1],
      ['5195', 'Gastos Diversos',                  'gasto',     '51',   1],
    ]

    const stmt = db.prepare(`
      INSERT INTO accounting_accounts (code, name, type, parent_code, allows_movement)
      VALUES (?, ?, ?, ?, ?)
    `)
    accounts.forEach(([code, name, type, parent, allows]) => {
      stmt.run(code, name, type, parent, allows)
    })
    console.log('[DB] PUC Colombia creado')
  }

  console.log('[DB] Seeds completados')
}
