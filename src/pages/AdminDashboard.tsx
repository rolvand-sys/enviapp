import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Package, MapPin, DollarSign, User, Phone, Clock, CheckCircle, Truck, AlertCircle, Home, Wallet, CreditCard, Upload, Plus, X, Users, Menu, Store } from 'lucide-react';

export default function AdminDashboard() {
  const { tenantId } = useParams();
  const [activeTab, setActiveTab] = useState('ordenes');
  const [tenant, setTenant] = useState<any>(null);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [mensajeros, setMensajeros] = useState<any[]>([]);
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<any[]>([]);
  const [pendingCredits, setPendingCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom states for modals
  const [verDetalleOrdenesTiendaModalOpen, setVerDetalleOrdenesTiendaModalOpen] = useState(false);
  const [selectedTiendaOrdenes, setSelectedTiendaOrdenes] = useState<any>(null);
  
  const [verDetalleLiquidacionesTiendaModalOpen, setVerDetalleLiquidacionesTiendaModalOpen] = useState(false);
  const [selectedTiendaLiquidaciones, setSelectedTiendaLiquidaciones] = useState<any>(null);

  const groupedOrdenesPorTienda = React.useMemo(() => {
    const map = new Map();
    ordenes.forEach(o => {
      const tId = o.tienda_id || 'unknown';
      if (!map.has(tId)) {
        map.set(tId, {
          tienda_id: tId,
          tienda_nombre: o.tienda_nombre || 'Desconocida',
          cantidad: 0,
          monto_total: 0,
          items: []
        });
      }
      const g = map.get(tId);
      g.cantidad += 1;
      g.monto_total += (o.monto_mercancia || 0) + (o.costo_envio || 0);
      g.items.push(o);
    });
    return Array.from(map.values());
  }, [ordenes]);

  const groupedLiquidacionesPorTienda = React.useMemo(() => {
    const map = new Map();
    liquidaciones.forEach(liq => {
      const tId = liq.tienda_id || 'unknown';
      if (!map.has(tId)) {
        map.set(tId, {
          tienda_id: tId,
          tienda_nombre: liq.tienda_nombre || 'Desconocida',
          cantidad: 0,
          monto_total: 0,
          items: []
        });
      }
      const g = map.get(tId);
      // Here liq is actually a raw liquidation row from DB, so we sum its totals
      g.cantidad += liq.ordenes_ids ? liq.ordenes_ids.length : 0;
      g.monto_total += (liq.total_recaudo || 0);
      g.items.push(liq);
    });
    return Array.from(map.values());
  }, [liquidaciones]);
  // Modal state for buying credits
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(500);
  const [bankReference, setBankReference] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [requestSent, setRequestSent] = useState(false);

  // Modal state for new Mensajero
  const [newMensajeroModalOpen, setNewMensajeroModalOpen] = useState(false);
  const [newTiendaModalOpen, setNewTiendaModalOpen] = useState(false);
  const [newMensajeroForm, setNewMensajeroForm] = useState({
    nombre: '',
    telefono: '',
    cedula: '',
    direccion: '',
    foto_url: ''
  });

  const [newTiendaForm, setNewTiendaForm] = useState({
    nombre: '',
    contacto_nombre: '',
    telefono: '',
    direccion: '',
    ubicacion_url: ''
  });

  const [generarLiquidacionModalOpen, setGenerarLiquidacionModalOpen] = useState(false);
  const [fechaLiquidacion, setFechaLiquidacion] = useState(new Date().toISOString().split('T')[0]);
  
  const [liquidarMensajeroModalOpen, setLiquidarMensajeroModalOpen] = useState(false);
  const [mensajeroALiquidar, setMensajeroALiquidar] = useState<any>(null);

  const [pagarLiquidacionModalOpen, setPagarLiquidacionModalOpen] = useState(false);
  const [pagarMensajeroModalOpen, setPagarMensajeroModalOpen] = useState(false);
  const [liquidacionAPagar, setLiquidacionAPagar] = useState<string | null>(null);
  const [comprobantePago, setComprobantePago] = useState<string | null>(null);
  const [verComprobanteModalOpen, setVerComprobanteModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);

  const banks = [
    'Banco Popular',
    'Banreservas',
    'Banco BHD',
    'APAP',
    'Scotiabank',
    'Banco Promerica',
    'Asociación Cibao',
    'Otro'
  ];

  const fetchLiquidaciones = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/liquidaciones`);
      const data = await res.json();
      setLiquidaciones(data);
    } catch (error) {
      console.error("Error fetching liquidaciones", error);
    }
  };

  useEffect(() => {
    // Fetch initial data
    Promise.all([
      fetch(`/api/tenants/${tenantId}`).then(res => res.json()),
      fetch(`/api/tenants/${tenantId}/ordenes`).then(res => res.json()),
      fetch(`/api/tenants/${tenantId}/mensajeros`).then(res => res.json()),
      fetch(`/api/tenants/${tenantId}/pending-reloads`).then(res => res.json()),
      fetch(`/api/tenants/${tenantId}/liquidaciones`).then(res => res.json())
    ]).then(([tenantData, ordenesData, mensajerosData, pendingData, liquidacionesData]) => {
      setTenant(tenantData);
      setOrdenes(ordenesData);
      setMensajeros(mensajerosData);
      setPendingCredits(pendingData.pending_amount || 0);
      setLiquidaciones(liquidacionesData);
      setLoading(false);
    });

    // Setup WebSocket
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_tenant', tenantId);
    });

    newSocket.on('nueva_orden', (orden: any) => {
      setOrdenes(prev => [orden, ...prev]);
      
      // Play sound notification
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.error("Audio play failed:", e));
    });

    newSocket.on('orden_actualizada', (updatedOrden: any) => {
      setOrdenes(prev => prev.map(o => o.id === updatedOrden.id ? updatedOrden : o));
    });

    newSocket.on('tenant_actualizado', (updatedTenant: any) => {
      setTenant(updatedTenant);
    });

    newSocket.on('mensajero_actualizado', (updatedMensajero: any) => {
      setMensajeros(prev => prev.map(m => m.id === updatedMensajero.id ? updatedMensajero : m));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [tenantId]);

  const asignarMensajero = async (ordenId: string, mensajeroId: string) => {
    if (!mensajeroId) return;
    if (tenant?.balance_creditos <= 0) {
      alert("Saldo insuficiente. Por favor, recarga créditos para continuar despachando.");
      return;
    }
    
    try {
      const res = await fetch(`/api/ordenes/${ordenId}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mensajero_id: mensajeroId })
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Error al asignar');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBuyCredits = async () => {
    if (!bankReference) {
      alert("Por favor, ingresa el número de referencia de la transferencia.");
      return;
    }
    if (!selectedBank) {
      alert("Por favor, selecciona el banco desde donde realizaste la transferencia.");
      return;
    }
    if (!receiptPreview) {
      alert("Por favor, sube el comprobante de la transferencia. Es obligatorio.");
      return;
    }

    try {
      const res = await fetch(`/api/tenants/${tenantId}/reload-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount_requested: selectedPackage,
          bank_reference: bankReference,
          bank_name: selectedBank,
          receipt_image_url: receiptPreview
        })
      });
      
      if (res.ok) {
        setRequestSent(true);
        setTimeout(() => {
          setBuyModalOpen(false);
          setRequestSent(false);
          setBankReference('');
          setSelectedBank('');
          setReceiptFile(null);
          setReceiptPreview('');
          setSelectedPackage(500);
        }, 3000);
      } else {
        alert('Error al enviar la solicitud');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleCreateMensajero = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${tenantId}/mensajeros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMensajeroForm)
      });
      
      if (res.ok) {
        const newMensajero = await res.json();
        setMensajeros([...mensajeros, newMensajero]);
        setNewMensajeroModalOpen(false);
        setNewMensajeroForm({ nombre: '', telefono: '', cedula: '', direccion: '', foto_url: '' });
      } else {
        alert('Error al crear mensajero');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleCreateTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${tenantId}/tiendas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTiendaForm)
      });
      
      if (res.ok) {
        const newTienda = await res.json();
        setTiendas([...tiendas, newTienda]);
        setNewTiendaModalOpen(false);
        setNewTiendaForm({ nombre: '', contacto_nombre: '', telefono: '', direccion: '', ubicacion_url: '' });
      } else {
        alert('Error al crear tienda');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleMensajeroPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMensajeroForm({ ...newMensajeroForm, foto_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Asignado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En Ruta': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Entregado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Liquidado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente': return <Clock className="w-4 h-4 mr-1" />;
      case 'Asignado': return <User className="w-4 h-4 mr-1" />;
      case 'En Ruta': return <Truck className="w-4 h-4 mr-1" />;
      case 'Entregado': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'Cancelado': return <AlertCircle className="w-4 h-4 mr-1" />;
      default: return <Package className="w-4 h-4 mr-1" />;
    }
  };

  const handleGenerarLiquidaciones = async () => {
    if (!fechaLiquidacion) return;

    try {
      const res = await fetch(`/api/tenants/${tenantId}/liquidaciones/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_cierre: fechaLiquidacion })
      });
      
      const data = await res.json();
      if (res.ok) {
        setGenerarLiquidacionModalOpen(false);
        fetchLiquidaciones();
        // Refresh orders to show updated status
        fetch(`/api/tenants/${tenantId}/ordenes`).then(res => res.json()).then(setOrdenes);
      } else {
        console.error(data.error || 'Error al generar liquidaciones');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePagarLiquidacion = async () => {
    if (!liquidacionAPagar) return;
    
    try {
      const res = await fetch(`/api/liquidaciones/${liquidacionAPagar}/pagar-tienda`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comprobante: comprobantePago })
      });
      
      if (res.ok) {
        fetchLiquidaciones();
        setPagarLiquidacionModalOpen(false);
        setLiquidacionAPagar(null);
        setComprobantePago(null);
      } else {
        console.error('Error al actualizar liquidación');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePagarMensajeroLiquidacion = async () => {
    if (!liquidacionAPagar) return;
    
    try {
      const res = await fetch(`/api/liquidaciones/${liquidacionAPagar}/pagar-mensajero`, {
        method: 'POST'
      });
      
      if (res.ok) {
        fetchLiquidaciones();
        setPagarMensajeroModalOpen(false);
        setLiquidacionAPagar(null);
      } else {
        console.error('Error al actualizar liquidación');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePago(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed inset-y-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img src="https://i.imgur.com/fGhOmmV.png" alt="EnviApp" className="h-8 mr-3" />
          <h1 className="text-xl font-bold text-gray-900">EnviApp</h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Panel de Control</div>
          <div className="font-bold text-gray-900 mb-6 truncate">{tenant?.nombre}</div>
          
          <nav className="space-y-1">
            {tenant?.tipo_tenant !== 'tienda_independiente' && (
              <button 
                onClick={() => setActiveTab('tiendas')} 
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tiendas' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Store className="w-5 h-5 mr-3" />
                Tiendas
              </button>
            )}
            <button 
              onClick={() => setActiveTab('ordenes')} 
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ordenes' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Package className="w-5 h-5 mr-3" />
              Órdenes Activas
            </button>
            <button 
              onClick={() => setActiveTab('mensajeros')} 
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'mensajeros' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Users className="w-5 h-5 mr-3" />
              Mis Mensajeros
            </button>
            <button 
              onClick={() => setActiveTab('liquidaciones')} 
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'liquidaciones' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <DollarSign className="w-5 h-5 mr-3" />
              Liquidaciones
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Créditos</span>
              <Wallet className="w-4 h-4 text-gray-500" />
            </div>
            <div className={`text-2xl font-black ${tenant?.balance_creditos <= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {tenant?.balance_creditos?.toFixed(2)}
            </div>
            {pendingCredits > 0 && (
              <div className="text-xs text-yellow-600 font-medium mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                +{pendingCredits} pendientes
              </div>
            )}
            <button 
              onClick={() => setBuyModalOpen(true)} 
              className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Recargar
            </button>
          </div>
          <Link to="/" className="mt-4 flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors px-2">
            <Home className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <img src="https://i.imgur.com/fGhOmmV.png" alt="EnviApp" className="h-8 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">EnviApp</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Panel de Control</div>
          <div className="font-bold text-gray-900 mb-6 truncate">{tenant?.nombre}</div>
          
          <nav className="space-y-1">
            {tenant?.tipo_tenant !== 'tienda_independiente' && (
              <button 
                onClick={() => { setActiveTab('tiendas'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tiendas' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Store className="w-5 h-5 mr-3" />
                Tiendas
              </button>
            )}
            <button 
              onClick={() => { setActiveTab('ordenes'); setMobileMenuOpen(false); }} 
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ordenes' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Package className="w-5 h-5 mr-3" />
              Órdenes Activas
            </button>
            <button 
              onClick={() => { setActiveTab('mensajeros'); setMobileMenuOpen(false); }} 
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'mensajeros' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Users className="w-5 h-5 mr-3" />
              Mis Mensajeros
            </button>
            <button 
              onClick={() => { setActiveTab('liquidaciones'); setMobileMenuOpen(false); }} 
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'liquidaciones' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <DollarSign className="w-5 h-5 mr-3" />
              Liquidaciones
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Créditos</span>
              <Wallet className="w-4 h-4 text-gray-500" />
            </div>
            <div className={`text-2xl font-black ${tenant?.balance_creditos <= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {tenant?.balance_creditos?.toFixed(2)}
            </div>
            {pendingCredits > 0 && (
              <div className="text-xs text-yellow-600 font-medium mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                +{pendingCredits} pendientes
              </div>
            )}
            <button 
              onClick={() => { setBuyModalOpen(true); setMobileMenuOpen(false); }} 
              className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Recargar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 md:hidden sticky top-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setMobileMenuOpen(true)} className="text-gray-500 mr-4">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate">{tenant?.nombre}</h1>
          </div>
          <div className="flex items-center">
            <div className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              En línea
            </div>
          </div>
        </header>

        {/* Desktop Header (Optional, just for status) */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 hidden md:flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Sistema en línea
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {tenant?.balance_creditos <= 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-bold">Saldo Insuficiente</h3>
                <p className="text-red-600 text-sm mt-1">No tienes créditos disponibles. Por favor, recarga tu cuenta para poder asignar mensajeros a las nuevas órdenes.</p>
              </div>
            </div>
          )}

          {activeTab === 'ordenes' && (
            <>
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Órdenes Activas</h2>
                  <p className="text-gray-500 text-sm mt-1">Gestiona los despachos en tiempo real</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                    Total: <span className="font-bold text-gray-900">{ordenes.length}</span>
                  </div>
                  {tenant?.tipo_tenant === 'tienda_independiente' && tiendas.length > 0 && (
                    <Link 
                      to={`/t/${tiendas[0].url_despacho}`}
                      target="_blank"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Orden
                    </Link>
                  )}
                </div>
              </div>

            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órdenes Activas</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupedOrdenesPorTienda.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900">No hay órdenes activas</p>
                    </td>
                  </tr>
                ) : (
                  groupedOrdenesPorTienda.map((group) => (
                    <tr key={group.tienda_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{group.tienda_nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">{group.cantidad}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">${group.monto_total.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => {
                            setSelectedTiendaOrdenes(group);
                            setVerDetalleOrdenesTiendaModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-bold"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

        {activeTab === 'tiendas' && tenant?.tipo_tenant !== 'tienda_independiente' && (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mis Tiendas</h2>
                <p className="text-gray-500 text-sm mt-1">Gestiona las tiendas afiliadas</p>
              </div>
              <button 
                onClick={() => setNewTiendaModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tienda
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiendas.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No hay tiendas registradas</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">Aún no has añadido ninguna tienda. Registra tu primera tienda para comenzar a recibir órdenes.</p>
                  <button 
                    onClick={() => setNewTiendaModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Tienda
                  </button>
                </div>
              ) : (
                tiendas.map((tienda) => (
                  <div key={tienda.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
                            {tienda.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-900">{tienda.nombre}</h3>
                            <p className="text-sm text-gray-500">{tienda.contacto_nombre}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-3 text-gray-400" />
                          {tienda.telefono}
                        </div>
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{tienda.direccion}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Store className="w-4 h-4 mr-3 text-gray-400" />
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {window.location.origin}/tienda/{tienda.url_despacho}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">PIN: <span className="font-mono text-gray-900">{tienda.pin}</span></span>
                      {tienda.ubicacion_url && (
                        <a href={tienda.ubicacion_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                          Ver Mapa <MapPin className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'mensajeros' && (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mis Mensajeros</h2>
                <p className="text-gray-500 text-sm mt-1">Gestiona tu flotilla de entrega</p>
              </div>
              <button 
                onClick={() => setNewMensajeroModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Mensajero
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mensajeros.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-gray-900">No tienes mensajeros</p>
                  <p>Añade tu primer mensajero para empezar a asignar órdenes.</p>
                </div>
              ) : (
                mensajeros.map(mensajero => (
                  <div key={mensajero.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                        {mensajero.foto_url ? (
                          <img src={mensajero.foto_url} alt={mensajero.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{mensajero.nombre}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="w-4 h-4 mr-1 text-gray-400" />
                          {mensajero.telefono}
                        </div>
                        {mensajero.cedula && (
                          <div className="text-xs text-gray-500 mt-1">Cédula: {mensajero.cedula}</div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${mensajero.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {mensajero.estado}
                      </span>
                      <Link to={`/m/${mensajero.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Ver App Mensajero
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        {activeTab === 'liquidaciones' && (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Liquidaciones (Cuadre D+1)</h2>
                <p className="text-gray-500 text-sm mt-1">Gestiona los pagos a las tiendas y comisiones</p>
              </div>
              {tenant?.tipo_tenant !== 'tienda_independiente' && (
                <button 
                  onClick={() => setGenerarLiquidacionModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generar Liquidaciones
                </button>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recaudo de Mensajeros (En Mano)</h3>
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensajero</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinero en Mano</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mensajeros.filter(m => m.billetera_virtual > 0).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No hay mensajeros con dinero pendiente de entregar.
                          </td>
                        </tr>
                      ) : (
                        mensajeros.filter(m => m.billetera_virtual > 0).map((mensajero) => (
                          <tr key={mensajero.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">{mensajero.nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{mensajero.telefono}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-green-600">${mensajero.billetera_virtual?.toFixed(2) || '0.00'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setMensajeroALiquidar(mensajero);
                                  setLiquidarMensajeroModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                              >
                                Recibir Dinero
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {tenant?.tipo_tenant !== 'tienda_independiente' && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Liquidaciones a Tiendas</h3>
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órdenes</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedLiquidacionesPorTienda.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                              No hay liquidaciones registradas.
                            </td>
                          </tr>
                        ) : (
                          groupedLiquidacionesPorTienda.map((group: any) => (
                            <tr 
                              key={group.tienda_id} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900">{group.tienda_nombre}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">{group.cantidad}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-green-600">${group.monto_total.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                  className="text-blue-600 hover:text-blue-900 font-bold"
                                  onClick={() => {
                                    setSelectedTiendaLiquidaciones(group);
                                    setVerDetalleLiquidacionesTiendaModalOpen(true);
                                  }}
                                >
                                  Ver Detalles
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </main>
      </div>

      {/* Modal Nuevo Mensajero */}
      {newMensajeroModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Añadir Mensajero
              </h3>
              <button onClick={() => setNewMensajeroModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateMensajero} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex-shrink-0">
                    {newMensajeroForm.foto_url ? (
                      <img src={newMensajeroForm.foto_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleMensajeroPhotoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={newMensajeroForm.nombre}
                  onChange={e => setNewMensajeroForm({...newMensajeroForm, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Teléfono</label>
                <input 
                  type="tel" 
                  required
                  value={newMensajeroForm.telefono}
                  onChange={e => setNewMensajeroForm({...newMensajeroForm, telefono: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. 809-555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input 
                  type="text" 
                  required
                  value={newMensajeroForm.cedula}
                  onChange={e => setNewMensajeroForm({...newMensajeroForm, cedula: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. 001-1234567-8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea 
                  required
                  value={newMensajeroForm.direccion}
                  onChange={e => setNewMensajeroForm({...newMensajeroForm, direccion: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Dirección residencial"
                  rows={2}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Guardar Mensajero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Tienda */}
      {newTiendaModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Store className="w-5 h-5 mr-2 text-blue-600" />
                Añadir Tienda
              </h3>
              <button onClick={() => setNewTiendaModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTienda} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Tienda</label>
                <input 
                  type="text" 
                  required
                  value={newTiendaForm.nombre}
                  onChange={e => setNewTiendaForm({...newTiendaForm, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. Tienda El Sol"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Dueño o Gerente</label>
                <input 
                  type="text" 
                  required
                  value={newTiendaForm.contacto_nombre}
                  onChange={e => setNewTiendaForm({...newTiendaForm, contacto_nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (Teléfono)</label>
                <input 
                  type="tel" 
                  required
                  value={newTiendaForm.telefono}
                  onChange={e => setNewTiendaForm({...newTiendaForm, telefono: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. 809-555-1234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Física</label>
                <textarea 
                  required
                  rows={2}
                  value={newTiendaForm.direccion}
                  onChange={e => setNewTiendaForm({...newTiendaForm, direccion: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Ej. Calle Principal #123, Sector"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Google Maps <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <input 
                  type="url" 
                  value={newTiendaForm.ubicacion_url}
                  onChange={e => setNewTiendaForm({...newTiendaForm, ubicacion_url: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setNewTiendaModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Guardar Tienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Compra de Créditos (Manual RD) */}
      {buyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Recargar Créditos
              </h3>
              <button onClick={() => setBuyModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            {requestSent ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitud Enviada</h2>
                <p className="text-gray-600">Tu recarga está en proceso de verificación. Los créditos se sumarán a tu balance pronto.</p>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona el paquete de créditos que deseas adquirir. 
                  <br/><span className="font-bold text-gray-900">1 Crédito = RD$10.00</span>
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[100, 500, 1000, 2000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setSelectedPackage(amount)}
                      className={`py-3 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center ${
                        selectedPackage === amount 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{amount}</span>
                      <span className="text-xs font-medium opacity-80 mt-1">Créditos</span>
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                  <h4 className="font-bold text-blue-900 mb-2 text-sm uppercase">Datos de Transferencia</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Banco:</strong> Popular Dominicano</p>
                    <p><strong>Cuenta:</strong> 123456789 (Corriente)</p>
                    <p><strong>Titular:</strong> EnviApp SRL</p>
                    <p><strong>Monto a transferir:</strong> RD${(selectedPackage * 10).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco de Origen</label>
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="" disabled>Selecciona tu banco</option>
                      {banks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencia de Transferencia</label>
                    <input 
                      type="text" 
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="Ej. 987654321"
                      className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (Obligatorio)</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {receiptPreview ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                          <span className="text-sm text-green-600 font-medium">Comprobante adjunto</span>
                          <span className="text-xs text-gray-500 mt-1">{receiptFile?.name}</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500">Haz clic para subir imagen o PDF</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleBuyCredits}
                  disabled={!bankReference || !selectedBank || !receiptPreview}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reportar Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Generar Liquidaciones Modal */}
      {generarLiquidacionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Generar Liquidaciones</h3>
              <button onClick={() => setGenerarLiquidacionModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-sm">
                Selecciona la fecha para generar las liquidaciones a las tiendas. Esto calculará el total recaudado y las comisiones de ese día.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Cierre</label>
                <input 
                  type="date" 
                  value={fechaLiquidacion}
                  onChange={(e) => setFechaLiquidacion(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setGenerarLiquidacionModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleGenerarLiquidaciones}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Generar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liquidar Mensajero Modal */}
      {liquidarMensajeroModalOpen && mensajeroALiquidar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Recibir Dinero</h3>
              <button onClick={() => setLiquidarMensajeroModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 mb-1">Mensajero</p>
                <p className="font-bold text-lg text-blue-900">{mensajeroALiquidar.nombre}</p>
                <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                  <span className="text-sm text-blue-800">Monto a recibir:</span>
                  <span className="font-bold text-2xl text-green-600">${mensajeroALiquidar.billetera_virtual?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Confirmas que has recibido este monto en efectivo o transferencia por parte del mensajero? Esta acción pondrá su balance en mano a $0.00.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setLiquidarMensajeroModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/mensajeros/${mensajeroALiquidar.id}/liquidar`, { method: 'POST' });
                      if (res.ok) {
                        setMensajeros(mensajeros.map(m => m.id === mensajeroALiquidar.id ? { ...m, billetera_virtual: 0 } : m));
                        setLiquidarMensajeroModalOpen(false);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Confirmar Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagar Liquidacion Modal */}
      {pagarLiquidacionModalOpen && liquidacionAPagar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Confirmar Pago a Tienda</h3>
              <button onClick={() => {
                setPagarLiquidacionModalOpen(false);
                setLiquidacionAPagar(null);
                setComprobantePago(null);
              }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-sm">
                ¿Estás seguro de marcar esta liquidación como pagada a la tienda? Esto indicará que ya has transferido el dinero a la tienda.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante de Pago (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {comprobantePago && (
                  <div className="mt-4">
                    <img src={comprobantePago} alt="Comprobante" className="max-h-40 rounded-lg object-contain border border-gray-200" />
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    setPagarLiquidacionModalOpen(false);
                    setLiquidacionAPagar(null);
                    setComprobantePago(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePagarLiquidacion}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagar Mensajero Modal */}
      {pagarMensajeroModalOpen && liquidacionAPagar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Confirmar Pago a Mensajeros</h3>
              <button onClick={() => {
                setPagarMensajeroModalOpen(false);
                setLiquidacionAPagar(null);
              }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-sm">
                ¿Estás seguro de marcar esta liquidación como pagada a los mensajeros? Esto indicará que ya has entregado su porción de las ganancias por estas entregas.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    setPagarMensajeroModalOpen(false);
                    setLiquidacionAPagar(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePagarMensajeroLiquidacion}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Ver Comprobante Modal */}
      {verComprobanteModalOpen && comprobanteUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Comprobante de Pago</h3>
              <button 
                onClick={() => {
                  setVerComprobanteModalOpen(false);
                  setComprobanteUrl(null);
                }} 
                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex justify-center items-center bg-gray-50 rounded-xl p-2">
              <img 
                src={comprobanteUrl} 
                alt="Comprobante" 
                className="max-h-[70vh] object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Órdenes por Tienda */}
      {verDetalleOrdenesTiendaModalOpen && selectedTiendaOrdenes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Órdenes Activas: {selectedTiendaOrdenes.tienda_nombre}</h3>
                <p className="text-sm text-gray-500">Mostrando {selectedTiendaOrdenes.cantidad} órdenes</p>
              </div>
              <button 
                onClick={() => setVerDetalleOrdenesTiendaModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 bg-white shadow-sm border border-gray-200 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Destino</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finanzas</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTiendaOrdenes.items.map((orden: any) => (
                      <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500 font-mono mt-1">#{orden.id.substring(0, 8)}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(orden.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900 font-medium">
                            <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            {orden.cliente_nombre}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            {orden.cliente_telefono}
                          </div>
                          <div className="flex items-start text-sm text-gray-500 mt-1 max-w-xs truncate">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="truncate" title={orden.destino_direccion}>{orden.destino_direccion}</span>
                          </div>
                          {orden.destino_ubicacion_url && (
                            <div className="flex items-start text-sm text-blue-600 mt-1 max-w-xs truncate">
                              <a 
                                href={orden.destino_ubicacion_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="hover:underline flex items-center"
                              >
                                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                Ver ubicación en mapa
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="text-gray-500 mr-1">COD:</span> 
                            <span className="font-bold text-green-600">RD${orden.monto_mercancia.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            <span className="text-gray-500 mr-1">Envío:</span> 
                            RD${orden.costo_envio.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border flex items-center ${getStatusColor(orden.estatus)}`}>
                              {getStatusIcon(orden.estatus)}
                              {orden.estatus}
                            </span>
                            {orden.pago_confirmado_tienda === 1 && (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Confirmado por la Tienda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {orden.estatus === 'Pendiente' ? (
                            <div className="flex items-center space-x-2">
                              <select 
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border disabled:bg-gray-100 disabled:text-gray-400"
                                onChange={(e) => asignarMensajero(orden.id, e.target.value)}
                                defaultValue=""
                                disabled={tenant?.balance_creditos <= 0}
                              >
                                <option value="" disabled>Asignar a...</option>
                                {mensajeros.map(m => (
                                  <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-gray-900">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                {mensajeros.find(m => m.id === orden.mensajero_id)?.nombre.charAt(0) || 'M'}
                              </div>
                              <div>
                                <div className="font-medium">{mensajeros.find(m => m.id === orden.mensajero_id)?.nombre || 'Mensajero'}</div>
                                <div className="text-xs text-gray-500">Asignado</div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setVerDetalleOrdenesTiendaModalOpen(false)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Liquidaciones por Tienda */}
      {verDetalleLiquidacionesTiendaModalOpen && selectedTiendaLiquidaciones && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Liquidaciones: {selectedTiendaLiquidaciones.tienda_nombre}</h3>
                <p className="text-sm text-gray-500">Recaudo Total: ${selectedTiendaLiquidaciones.monto_total.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setVerDetalleLiquidacionesTiendaModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 bg-white shadow-sm border border-gray-200 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Recaudo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensajería</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTiendaLiquidaciones.items.map((group: any) => (
                      <tr 
                        key={`${group.tienda_id}_${group.fecha_cierre}`} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedLiquidacionGroup(group);
                          setVerDetalleLiqModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{group.fecha_cierre}</div>
                          <div className="text-xs text-blue-600 font-medium">{group.ordenes_ids?.length || 0} órdenes</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">${group.total_recaudo.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500">Mensajeros: <span className="text-gray-900 font-medium">${group.pago_mensajeros.toFixed(2)}</span></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-black text-blue-600">${group.pago_tienda.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              group.estatus_pago_tienda === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              Tienda: {group.estatus_pago_tienda}
                            </span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              group.estatus_pago_mensajero === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              Mensajero: {group.estatus_pago_mensajero}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 font-bold">Ver Detalles</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setVerDetalleLiquidacionesTiendaModalOpen(false)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
