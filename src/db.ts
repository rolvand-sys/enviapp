import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema (SQLite version of the PostgreSQL schema)
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      logo_url TEXT,
      balance_creditos REAL DEFAULT 0.00,
      estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Bloqueado')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tiendas (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      url_despacho TEXT UNIQUE NOT NULL,
      telefono TEXT,
      direccion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mensajeros (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      placa_moto TEXT,
      billetera_virtual REAL DEFAULT 0.00,
      estado TEXT DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Ocupado', 'Inactivo')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ordenes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      tienda_id TEXT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
      mensajero_id TEXT REFERENCES mensajeros(id) ON DELETE SET NULL,
      
      cliente_nombre TEXT NOT NULL,
      cliente_telefono TEXT NOT NULL,
      destino_direccion TEXT NOT NULL,
      destino_latitud REAL,
      destino_longitud REAL,
      
      monto_mercancia REAL NOT NULL DEFAULT 0.00,
      costo_envio REAL NOT NULL DEFAULT 0.00,
      
      estatus TEXT DEFAULT 'Pendiente' CHECK (estatus IN ('Pendiente', 'Asignado', 'En Ruta', 'Entregado', 'Liquidado', 'Cancelado')),
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS liquidaciones (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      tienda_id TEXT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
      
      fecha_cierre DATE NOT NULL,
      
      total_recaudo REAL NOT NULL DEFAULT 0.00,
      pago_mensajeros REAL NOT NULL DEFAULT 0.00,
      comision_saas REAL NOT NULL DEFAULT 0.00,
      pago_tienda REAL NOT NULL DEFAULT 0.00,
      
      estatus TEXT DEFAULT 'Pendiente' CHECK (estatus IN ('Pendiente', 'Pagado')),
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS countries (
      iso_code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 0,
      credit_price REAL NOT NULL,
      currency TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reload_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      amount_requested INTEGER NOT NULL,
      bank_reference TEXT,
      receipt_image_url TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add new columns to existing tables safely
try { db.exec("ALTER TABLE tenants ADD COLUMN country_code TEXT DEFAULT 'DO'"); } catch (e) {}
try { db.exec("ALTER TABLE tenants ADD COLUMN setup_paid BOOLEAN DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE tenants ADD COLUMN tipo_tenant TEXT DEFAULT 'mensajeria' CHECK (tipo_tenant IN ('mensajeria', 'tienda_independiente'))"); } catch (e) {}
try { db.exec("ALTER TABLE reload_requests ADD COLUMN bank_name TEXT DEFAULT 'No especificado'"); } catch (e) {}
try { db.exec("ALTER TABLE mensajeros ADD COLUMN direccion TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE mensajeros ADD COLUMN cedula TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE mensajeros ADD COLUMN foto_url TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tiendas ADD COLUMN pin TEXT DEFAULT '1234'"); } catch (e) {}
try { db.exec("ALTER TABLE liquidaciones ADD COLUMN estatus_pago_tienda TEXT DEFAULT 'Pendiente'"); } catch (e) {}
try { db.exec("ALTER TABLE liquidaciones ADD COLUMN estatus_pago_mensajero TEXT DEFAULT 'Pendiente'"); } catch (e) {}
try { db.exec("ALTER TABLE liquidaciones ADD COLUMN comprobante_pago_tienda TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE liquidaciones ADD COLUMN tienda_confirma_pago BOOLEAN DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE ordenes ADD COLUMN liquidacion_id TEXT REFERENCES liquidaciones(id) ON DELETE SET NULL"); } catch (e) {}
try { db.exec("ALTER TABLE ordenes ADD COLUMN pago_confirmado_tienda BOOLEAN DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE ordenes ADD COLUMN destino_ubicacion_url TEXT"); } catch (e) {}

// Seed countries
const countryCount = db.prepare('SELECT COUNT(*) as count FROM countries').get() as { count: number };
if (countryCount.count === 0) {
  const insertCountry = db.prepare('INSERT INTO countries (iso_code, name, is_active, credit_price, currency) VALUES (?, ?, ?, ?, ?)');
  insertCountry.run('DO', 'República Dominicana', 1, 10.00, 'DOP');
  insertCountry.run('MX', 'México', 0, 0.18, 'USD');
  insertCountry.run('CO', 'Colombia', 0, 0.18, 'USD');
  insertCountry.run('CL', 'Chile', 0, 0.18, 'USD');
  insertCountry.run('PE', 'Perú', 0, 0.18, 'USD');
  insertCountry.run('AR', 'Argentina', 0, 0.18, 'USD');
}

// Seed initial data for testing
const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number };
if (tenantCount.count === 0) {
  const tenantId = 'tenant-123';
  db.prepare('INSERT INTO tenants (id, nombre, balance_creditos, tipo_tenant) VALUES (?, ?, ?, ?)').run(tenantId, 'Mensajería Rápida RD', 500.00, 'mensajeria');
  
  const tiendaId = 'tienda-456';
  db.prepare('INSERT INTO tiendas (id, tenant_id, nombre, url_despacho) VALUES (?, ?, ?, ?)').run(tiendaId, tenantId, 'Tienda de Ropa', 'tienda-ropa-rd');
  
  db.prepare('INSERT INTO mensajeros (id, tenant_id, nombre, telefono, placa_moto) VALUES (?, ?, ?, ?, ?)').run('mensajero-1', tenantId, 'Juan Pérez', '809-555-0001', 'K001234');
  db.prepare('INSERT INTO mensajeros (id, tenant_id, nombre, telefono, placa_moto) VALUES (?, ?, ?, ?, ?)').run('mensajero-2', tenantId, 'Pedro Gómez', '809-555-0002', 'K005678');

  // Seed a tienda_independiente
  const tiendaIndependienteId = 'tenant-tienda-789';
  db.prepare('INSERT INTO tenants (id, nombre, balance_creditos, tipo_tenant) VALUES (?, ?, ?, ?)').run(tiendaIndependienteId, 'Mi Tienda Propia', 100.00, 'tienda_independiente');
  
  const tiendaPropiaId = 'tienda-propia-1';
  db.prepare('INSERT INTO tiendas (id, tenant_id, nombre, url_despacho) VALUES (?, ?, ?, ?)').run(tiendaPropiaId, tiendaIndependienteId, 'Mi Tienda Propia', 'mi-tienda-propia');
  
  db.prepare('INSERT INTO mensajeros (id, tenant_id, nombre, telefono, placa_moto) VALUES (?, ?, ?, ?, ?)').run('mensajero-3', tiendaIndependienteId, 'Luis El Propio', '849-555-0003', 'K009999');
}

export default db;
