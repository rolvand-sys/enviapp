const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'database.sqlite'));

const tenants = [
    { id: 'tenant-alpha', nombre: 'Logística Alpha' },
    { id: 'tenant-beta', nombre: 'Logística Beta' },
    { id: 'tenant-gamma', nombre: 'Logística Gamma' }
];

tenants.forEach(t => {
    // Create Tenant
    try {
        db.prepare('INSERT INTO tenants (id, nombre, balance_creditos, tipo_tenant, setup_paid, country_code) VALUES (?, ?, ?, ?, ?, ?)').run(
            t.id, t.nombre, 1000.00, 'mensajeria', 1, 'DO'
        );
        console.log(`Created tenant: ${t.nombre}`);

        // Create 3 Tiendas per tenant
        for (let i = 1; i <= 3; i++) {
            const tiendaId = `tienda-${t.id}-${i}`;
            const tiendaUrl = `tienda-${t.id}-${i}-url`;
            db.prepare('INSERT INTO tiendas (id, tenant_id, nombre, url_despacho, pin) VALUES (?, ?, ?, ?, ?)').run(
                tiendaId, t.id, `Tienda ${i} de ${t.nombre}`, tiendaUrl, '1234'
            );
            console.log(`  Created tienda: ${tiendaId}`);
        }

        // Create 3 Mensajeros per tenant
        for (let i = 1; i <= 3; i++) {
            const mensajeroId = `mensajero-${t.id}-${i}`;
            db.prepare('INSERT INTO mensajeros (id, tenant_id, nombre, telefono, placa_moto) VALUES (?, ?, ?, ?, ?)').run(
                mensajeroId, t.id, `Mensajero ${i} de ${t.nombre}`, `809555${t.id.slice(-1)}${i}`, `M-ALPHA-${i}`
            );
            console.log(`  Created mensajero: ${mensajeroId}`);
        }
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            console.log(`Tenant ${t.nombre} already exists, skipping...`);
        } else {
            console.error(e);
        }
    }
});

console.log('Seeding complete.');
db.close();
