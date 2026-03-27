const Database = require('better-sqlite3');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to SQLite
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Path to Firebase JSON
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('ERROR: No se encontró firebase-service-account.json en la raíz.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function migrate() {
  console.log('--- EMPEZANDO MIGRACIÓN SQLITE -> FIRESTORE ---');

  // 1. Migrar Tenants
  const tenants = db.prepare('SELECT * FROM tenants').all();
  for (const t of tenants) {
    await firestore.collection('tenants').doc(t.id).set(t);
    console.log(`Migrado Tenant: ${t.nombre}`);
  }

  // 2. Migrar Tiendas
  const tiendas = db.prepare('SELECT * FROM tiendas').all();
  for (const td of tiendas) {
    // Save in sub-collection (for tenant view)
    await firestore.collection('tenants').doc(td.tenant_id).collection('tiendas').doc(td.id).set(td);
    // Save in root collection (for global search/login)
    await firestore.collection('tiendas').doc(td.id).set(td);
    console.log(`Migrada Tienda: ${td.nombre}`);
  }

  // 3. Migrar Mensajeros
  const mensajeros = db.prepare('SELECT * FROM mensajeros').all();
  for (const m of mensajeros) {
    // Save in sub-collection
    await firestore.collection('tenants').doc(m.tenant_id).collection('mensajeros').doc(m.id).set(m);
    // Save in root collection
    await firestore.collection('mensajeros').doc(m.id).set(m);
    console.log(`Migrado Mensajero: ${m.nombre}`);
  }

  // 4. Migrar Ordenes
  const ordenes = db.prepare('SELECT * FROM ordenes').all();
  for (const o of ordenes) {
    await firestore.collection('ordenes').doc(o.id).set(o);
    console.log(`Migrada Orden: ${o.id}`);
  }

  // 5. Migrar Liquidaciones
  const liquidaciones = db.prepare('SELECT * FROM liquidaciones').all();
  for (const l of liquidaciones) {
    await firestore.collection('tenants').doc(l.tenant_id).collection('liquidaciones').doc(l.id).set(l);
    console.log(`Migrada Liquidación: ${l.id}`);
  }

  console.log('--- MIGRACIÓN COMPLETADA ---');
}

migrate().catch(console.error).finally(() => process.exit());
