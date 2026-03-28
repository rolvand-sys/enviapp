import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import admin, { db, auth } from "./src/lib/firebaseAdmin";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Helper to hash PIN
const hashPin = (pin: string) => {
  return crypto.createHash('sha256').update(pin).digest('hex');
};

// --- API ROUTES ---

// Get store details by URL
app.get("/api/tiendas/:url", async (req, res) => {
  try {
    const tiendasSnapshot = await db.collection('tiendas').where('url_despacho', '==', req.params.url).limit(1).get();
    if (tiendasSnapshot.empty) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }
    const tiendaDoc = tiendasSnapshot.docs[0];
    const tiendaData = { id: tiendaDoc.id, ...tiendaDoc.data() };
    
    const { pin, ...data } = tiendaData as any;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno" });
  }
});

// Login for store
app.post("/api/tiendas/:url/login", async (req, res) => {
  const { pin } = req.body;
  try {
    const tiendasSnapshot = await db.collection('tiendas').where('url_despacho', '==', req.params.url).limit(1).get();
    if (tiendasSnapshot.empty) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }
    const tiendaDoc = tiendasSnapshot.docs[0];
    const tienda = { id: tiendaDoc.id, ...tiendaDoc.data() } as any;

    const hashed = hashPin(pin);
    if (tienda.pin !== pin && tienda.pin !== hashed) {
      return res.status(401).json({ error: "PIN incorrecto" });
    }

    res.json({ success: true, tienda });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

// Change store PIN
app.put("/api/tiendas/:id/pin", async (req, res) => {
  const { currentPin, newPin } = req.body;
  const { id } = req.params;

  try {
    const tiendasSnapshot = await db.collection('tiendas').where('id', '==', id).limit(1).get();
    if (tiendasSnapshot.empty) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }
    const tiendaDoc = tiendasSnapshot.docs[0];
    const tienda = tiendaDoc.data() as any;

    const hashedCurrent = hashPin(currentPin);
    if (tienda.pin !== currentPin && tienda.pin !== hashedCurrent) {
      return res.status(401).json({ error: "El PIN actual es incorrecto" });
    }

    const hashedNew = hashPin(newPin);
    await tiendaDoc.ref.update({ pin: hashedNew, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true, message: "PIN actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el PIN" });
  }
});

// Store confirms payment for an order
app.post("/api/ordenes/:id/confirmar-pago", async (req, res) => {
  try {
    const orderRef = db.collection('ordenes').doc(req.params.id);
    await orderRef.update({ pago_confirmado_tienda: 1, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al confirmar pago de la orden" });
  }
});

// Get orders for a store
app.get("/api/tiendas/:id/ordenes", async (req, res) => {
  try {
    const ordenesSnapshot = await db.collection('ordenes')
      .where('tienda_id', '==', req.params.id)
      .orderBy('created_at', 'desc')
      .get();
    
    const ordenes = ordenesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(ordenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener órdenes de la tienda" });
  }
});

// Create order
app.post("/api/ordenes", async (req, res) => {
  const { 
    tienda_id, 
    cliente_nombre, 
    cliente_telefono, 
    destino_direccion, 
    destino_ubicacion_url, 
    destino_latitud, 
    destino_longitud, 
    monto_mercancia, 
    costo_envio,
    sector,
    referencia
  } = req.body;

  try {
    const tiendaSnapshot = await db.collection('tiendas').where('id', '==', tienda_id).limit(1).get();
    if (tiendaSnapshot.empty) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }
    const tiendaDoc = tiendaSnapshot.docs[0];
    const tienda = tiendaDoc.data() as any;

    const tenantRef = db.collection('tenants').doc(tienda.tenant_id);
    const tenantDoc = await tenantRef.get();
    if (!tenantDoc.exists) {
      return res.status(404).json({ error: "Tenant no encontrado" });
    }
    const tenant = tenantDoc.data() as any;

    if (tenant.balance_creditos <= 0) {
      return res.status(400).json({ error: "No tienes créditos suficientes para crear la orden." });
    }

    const ordenId = uuidv4();
    const nuevaOrden = {
      id: ordenId,
      tenant_id: tienda.tenant_id,
      tienda_id: tienda.id,
      tienda_nombre: tienda.nombre,
      cliente_nombre,
      cliente_telefono,
      destino_direccion,
      destino_ubicacion_url,
      destino_latitud: destino_latitud || 0,
      destino_longitud: destino_longitud || 0,
      monto_mercancia,
      costo_envio,
      sector: sector || '',
      referencia: referencia || '',
      estatus: 'Pendiente',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('ordenes').doc(ordenId).set(nuevaOrden);
    io.to(tienda.tenant_id).emit("nueva_orden", nuevaOrden);
    res.status(201).json(nuevaOrden);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la orden" });
  }
});

// Create multiple orders (batch)
app.post("/api/ordenes/batch", async (req, res) => {
  const { tienda_id, ordenes } = req.body;
  if (!Array.isArray(ordenes) || ordenes.length === 0) return res.status(400).json({ error: "No se proporcionaron órdenes válidas" });

  try {
    const tiendaSnapshot = await db.collection('tiendas').where('id', '==', tienda_id).limit(1).get();
    if (tiendaSnapshot.empty) return res.status(404).json({ error: "Tienda no encontrada" });
    const tiendaDoc = tiendaSnapshot.docs[0];
    const tienda = tiendaDoc.data() as any;

    const tenantRef = db.collection('tenants').doc(tienda.tenant_id);
    const tenantDoc = await tenantRef.get();
    const tenant = tenantDoc.data() as any;

    if (tenant.balance_creditos < ordenes.length) {
      return res.status(400).json({ error: `No tienes créditos suficientes. (Requiere ${ordenes.length})` });
    }

    const batch = db.batch();
    const nuevasOrdenes: any[] = [];

    for (const ord of ordenes) {
      const ordenId = uuidv4();
      const nuevaOrden = {
        id: ordenId,
        tenant_id: tienda.tenant_id,
        tienda_id: tienda.id,
        tienda_nombre: tienda.nombre,
        cliente_nombre: ord.cliente_nombre,
        cliente_telefono: ord.cliente_telefono,
        destino_direccion: ord.destino_direccion,
        destino_ubicacion_url: ord.destino_ubicacion_url || '',
        destino_latitud: 0,
        destino_longitud: 0,
        monto_mercancia: ord.monto_mercancia,
        costo_envio: ord.costo_envio,
        sector: ord.sector || '',
        referencia: ord.referencia || '',
        estatus: 'Pendiente',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.set(db.collection('ordenes').doc(ordenId), nuevaOrden);
      nuevasOrdenes.push(nuevaOrden);
    }

    await batch.commit();
    for (const nueva of nuevasOrdenes) {
      io.to(tienda.tenant_id).emit("nueva_orden", nueva);
    }
    res.status(201).json({ success: true, count: nuevasOrdenes.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear las órdenes" });
  }
});

// Tenant Details
app.get("/api/tenants/:id", async (req, res) => {
  try {
    const tenantDoc = await db.collection('tenants').doc(req.params.id).get();
    if (!tenantDoc.exists) return res.status(404).json({ error: "Tenant no encontrado" });
    res.json({ id: tenantDoc.id, ...tenantDoc.data() });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tenant" });
  }
});

// Buy credits (Tenant self-service)
app.post("/api/tenants/:id/comprar-creditos", async (req, res) => {
  const { paquete } = req.body;
  try {
    const tenantRef = db.collection('tenants').doc(req.params.id);
    await tenantRef.update({ 
      balance_creditos: admin.firestore.FieldValue.increment(paquete),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    const tenantDoc = await tenantRef.get();
    res.json({ id: tenantDoc.id, ...tenantDoc.data() });
  } catch (error) {
    res.status(500).json({ error: "Error al procesar la compra" });
  }
});

// Reload request
app.post("/api/tenants/:id/reload-requests", async (req, res) => {
  const { amount_requested, bank_reference, receipt_image_url, bank_name } = req.body;
  try {
    const id = uuidv4();
    await db.collection('tenants').doc(req.params.id).collection('reload_requests').doc(id).set({
      id,
      tenant_id: req.params.id,
      amount_requested,
      bank_reference,
      receipt_image_url,
      bank_name: bank_name || 'No especificado',
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});

// Pending reloads
app.get("/api/tenants/:id/pending-reloads", async (req, res) => {
  try {
    const snap = await db.collection('tenants').doc(req.params.id).collection('reload_requests').where('status', '==', 'pending').get();
    let total = 0;
    snap.forEach(doc => total += doc.data().amount_requested);
    res.json({ pending_amount: total });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener recargas pendientes" });
  }
});

// Tenant Orders
app.get("/api/tenants/:tenantId/ordenes", async (req, res) => {
  try {
    const snap = await db.collection('ordenes')
      .where('tenant_id', '==', req.params.tenantId)
      .orderBy('created_at', 'desc')
      .get();
    const ordenes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(ordenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
});

// Tenant Messengers
app.get("/api/tenants/:tenantId/mensajeros", async (req, res) => {
  try {
    const snap = await db.collection('tenants').doc(req.params.tenantId).collection('mensajeros').get();
    const mensajeros = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(mensajeros);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mensajeros" });
  }
});

// Tenant Shops
app.get("/api/tenants/:tenantId/tiendas", async (req, res) => {
  try {
    const snap = await db.collection('tenants').doc(req.params.tenantId).collection('tiendas').get();
    const tiendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tiendas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tiendas" });
  }
});

// Create Shop for Tenant
app.post("/api/tenants/:tenantId/tiendas", async (req, res) => {
  const { nombre, contacto_nombre, telefono, direccion, ubicacion_url } = req.body;
  try {
    const id = uuidv4();
    const url_despacho = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const nuevaTienda = {
      id, tenant_id: req.params.tenantId, nombre, contacto_nombre, telefono, direccion, ubicacion_url, url_despacho, pin,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('tenants').doc(req.params.tenantId).collection('tiendas').doc(id).set(nuevaTienda);
    res.status(201).json(nuevaTienda);
  } catch (error) {
    res.status(500).json({ error: "Error al crear tienda" });
  }
});

// Get Liquidaciones
app.get("/api/tenants/:tenantId/liquidaciones", async (req, res) => {
  try {
    const snap = await db.collection('tenants').doc(req.params.tenantId).collection('liquidaciones').orderBy('fecha_cierre', 'desc').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: "Error al obtener liquidaciones" });
  }
});

// Liquidate Messenger
app.post("/api/mensajeros/:id/liquidar", async (req, res) => {
  try {
    const snap = await db.collection('mensajeros').where('id', '==', req.params.id).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Messenger not found" });
    const doc = snap.docs[0];
    await doc.ref.update({ billetera_virtual: 0, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    const updated = { ...doc.data(), billetera_virtual: 0 };
    io.to((updated as any).tenant_id).emit("mensajero_actualizado", updated);
    res.json({ success: true, mensajero: updated });
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

// Generate Liquidaciones (Simplificada para Firestore)
app.post("/api/tenants/:tenantId/liquidaciones/generar", async (req, res) => {
  const { fecha_cierre } = req.body;
  const { tenantId } = req.params;
  try {
    const ordersSnap = await db.collection('ordenes').where('tenant_id', '==', tenantId).where('estatus', '==', 'Entregado').get();
    const storesMap = new Map();
    ordersSnap.forEach(doc => {
      const d = doc.data();
      if (!storesMap.has(d.tienda_id)) storesMap.set(d.tienda_id, []);
      storesMap.get(d.tienda_id).push({ id: doc.id, ...d });
    });

    const batch = db.batch();
    for (const [tid, orders] of storesMap.entries()) {
      const id = uuidv4();
      const total_recaudo = orders.reduce((s: any, o: any) => s + (o.monto_mercancia + o.costo_envio), 0);
      batch.set(db.collection('tenants').doc(tenantId).collection('liquidaciones').doc(id), {
        id, tenant_id: tenantId, tienda_id: tid, fecha_cierre, total_recaudo,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      orders.forEach((o: any) => batch.update(db.collection('ordenes').doc(o.id), { estatus: 'Liquidado', liquidacion_id: id }));
    }
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

// Messenger Login
app.post("/api/mensajeros/login", async (req, res) => {
  try {
    const snap = await db.collection('mensajeros').where('telefono', '==', req.body.telefono).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Not found" });
    res.json({ id: snap.docs[0].id });
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

// Assign Order
app.post("/api/ordenes/:id/asignar", async (req, res) => {
  try {
    const orderRef = db.collection('ordenes').doc(req.params.id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });
    const order = orderDoc.data() as any;

    const tenantRef = db.collection('tenants').doc(order.tenant_id);
    await db.runTransaction(async (transaction) => {
      const tDoc = await transaction.get(tenantRef);
      const tData = tDoc.data() as any;
      if (tData.balance_creditos <= 0) throw new Error("Insuficiente balance");
      transaction.update(tenantRef, { balance_creditos: admin.firestore.FieldValue.increment(-1) });
      transaction.update(orderRef, { mensajero_id: req.body.mensajero_id, estatus: 'Asignado' });
    });
    
    const updatedOrder = (await orderRef.get()).data();
    io.to(order.tenant_id).emit("orden_actualizada", updatedOrder);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// VIP Clients: Search by phone
app.get("/api/clientes-vip/:tienda_id", async (req, res) => {
  const { tienda_id } = req.params;
  const { telefono } = req.query;

  if (!telefono) return res.status(400).json({ error: "Teléfono requerido" });

  try {
    const snap = await db.collection('clientes_vip')
      .where('tienda_id', '==', tienda_id)
      .where('telefono', '==', telefono)
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al buscar cliente VIP" });
  }
});

// VIP Clients: Save or update
app.post("/api/clientes-vip", async (req, res) => {
  const { tienda_id, telefono, nombre, direccion, sector, referencia } = req.body;
  if (!tienda_id || !telefono) return res.status(400).json({ error: "Datos incompletos" });

  try {
    const snap = await db.collection('clientes_vip')
      .where('tienda_id', '==', tienda_id)
      .where('telefono', '==', telefono)
      .limit(1)
      .get();

    const data = {
      tienda_id,
      telefono,
      nombre,
      direccion,
      sector: sector || '',
      referencia: referencia || '',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (snap.empty) {
      const id = uuidv4();
      await db.collection('clientes_vip').doc(id).set({
        ...data,
        id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.status(201).json({ success: true, id });
    } else {
      await snap.docs[0].ref.update(data);
      res.json({ success: true, id: snap.docs[0].id });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar cliente VIP" });
  }
});

// Batch Assign Orders
app.post("/api/ordenes/batch-asignar", async (req, res) => {
  const { ordenes_ids, mensajero_id, tenant_id } = req.body;
  
  if (!Array.isArray(ordenes_ids) || !mensajero_id || !tenant_id) {
    return res.status(400).json({ error: "Datos incompletos para asignación masiva" });
  }

  try {
    const tenantRef = db.collection('tenants').doc(tenant_id);
    const tenantDoc = await tenantRef.get();
    if (!tenantDoc.exists) return res.status(404).json({ error: "Tenant no encontrado" });
    const tenantData = tenantDoc.data() as any;

    if (tenantData.balance_creditos < ordenes_ids.length) {
      return res.status(400).json({ error: "Créditos insuficientes para asignar este lote" });
    }

    const batch = db.batch();
    const updatedOrders: any[] = [];

    for (const id of ordenes_ids) {
      const orderRef = db.collection('ordenes').doc(id);
      batch.update(orderRef, {
        mensajero_id,
        estatus: 'Asignado',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    batch.update(tenantRef, {
      balance_creditos: admin.firestore.FieldValue.increment(-ordenes_ids.length),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    // Get updated orders to emit via socket
    const snap = await db.collection('ordenes').where('id', 'in', ordenes_ids).get();
    snap.forEach(doc => {
      const data = doc.data();
      updatedOrders.push(data);
      io.to(tenant_id).emit("orden_actualizada", data);
    });

    res.json({ success: true, count: ordenes_ids.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en asignación masiva" });
  }
});

// --- SUPER ADMIN ROUTES ---

app.post("/api/admin/tenants", async (req, res) => {
  try {
    const id = uuidv4();
    const data = { ...req.body, id, created_at: admin.firestore.FieldValue.serverTimestamp() };
    await db.collection('tenants').doc(id).set(data);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/admin/tenants", async (req, res) => {
  try {
    const snap = await db.collection('tenants').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

// Countries
app.get("/api/admin/countries", async (req, res) => {
  try {
    const snap = await db.collection('countries').get();
    res.json(snap.docs.map(doc => doc.data()));
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/mensajeros/:id", async (req, res) => {
  try {
    const snap = await db.collection('mensajeros').where('id', '==', req.params.id).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Not found" });
    res.json({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/ordenes/:id/estado", async (req, res) => {
  try {
    const { estatus } = req.body;
    const ref = db.collection('ordenes').doc(req.params.id);
    await ref.update({ estatus, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    const order = (await ref.get()).data() as any;
    io.to(order.tenant_id).emit("orden_actualizada", order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
});

// Socket logic
io.on("connection", (socket) => {
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
