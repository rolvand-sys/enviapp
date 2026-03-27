-- ETAPA 1: ARQUITECTURA DE DATOS (EL MOTOR FINANCIERO)

-- Extensión para UUIDs (Recomendado para seguridad en URLs y referencias)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla Tenants (Mensajerías)
-- Representa a cada empresa de mensajería que usa el SaaS.
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    logo_url TEXT,
    balance_creditos DECIMAL(10, 2) DEFAULT 0.00, -- Balance en RD$ para el cobro del SaaS
    estado VARCHAR(50) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Bloqueado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla Tiendas
-- Clientes de las mensajerías (quienes envían los paquetes).
CREATE TABLE tiendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    url_despacho VARCHAR(255) UNIQUE NOT NULL, -- URL única para el formulario público de la tienda
    telefono VARCHAR(50),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla Mensajeros
-- Los motoristas que trabajan para una mensajería específica.
CREATE TABLE mensajeros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    placa_moto VARCHAR(50),
    billetera_virtual DECIMAL(10, 2) DEFAULT 0.00, -- Efectivo (RD$) en poder del mensajero en su turno actual
    estado VARCHAR(50) DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Ocupado', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla Ordenes
-- El corazón operativo de la plataforma.
CREATE TABLE ordenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    mensajero_id UUID REFERENCES mensajeros(id) ON DELETE SET NULL,
    
    -- Datos del cliente final y destino
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(50) NOT NULL,
    destino_direccion TEXT NOT NULL,
    destino_latitud DECIMAL(10, 8),
    destino_longitud DECIMAL(11, 8),
    
    -- Datos financieros
    monto_mercancia DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Cash on Delivery (COD) a cobrar al cliente
    costo_envio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,     -- Costo del servicio de delivery
    
    -- Estado de la orden
    estatus VARCHAR(50) DEFAULT 'Pendiente' CHECK (estatus IN ('Pendiente', 'Asignado', 'En Ruta', 'Entregado', 'Liquidado', 'Cancelado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla Liquidaciones (El Cuadre D+1)
-- Registro financiero del "Día Después" para el cuadre automático.
CREATE TABLE liquidaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    
    fecha_cierre DATE NOT NULL,
    
    total_recaudo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,   -- Total cobrado (Mercancía + Envío)
    pago_mensajeros DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Porción que corresponde al mensajero
    comision_saas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,   -- RD$10 por entrega para el dueño de la App
    pago_tienda DECIMAL(10, 2) NOT NULL DEFAULT 0.00,     -- Monto final a transferir a la tienda
    
    estatus VARCHAR(50) DEFAULT 'Pendiente' CHECK (estatus IN ('Pendiente', 'Pagado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas por tenant (Aislamiento Multi-tenant)
CREATE INDEX idx_tiendas_tenant ON tiendas(tenant_id);
CREATE INDEX idx_mensajeros_tenant ON mensajeros(tenant_id);
CREATE INDEX idx_ordenes_tenant ON ordenes(tenant_id);
CREATE INDEX idx_liquidaciones_tenant ON liquidaciones(tenant_id);
