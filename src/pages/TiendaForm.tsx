import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, DollarSign, User, Phone, Home, Lock, LogIn, Clock, CheckCircle, Truck, Plus, List, X, Trash2, Upload, FileSpreadsheet, Download, Settings, Key } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TiendaForm() {
  const { url } = useParams();
  const [tienda, setTienda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('nueva'); // 'nueva' | 'historial' | 'ajustes'
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [selectedMensajero, setSelectedMensajero] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comprobanteModalOpen, setComprobanteModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  
  // PIN Change state
  const [pinData, setPinData] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [pinStatus, setPinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pinMessage, setPinMessage] = useState('');
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [creationMode, setCreationMode] = useState<'single' | 'multiple' | 'excel'>('single');
  
  const getEmptyOrder = () => ({
    cliente_nombre: '',
    cliente_telefono: '',
    destino_direccion: '',
    destino_ubicacion_url: '',
    monto_mercancia: '',
    costo_envio: '',
    sector: '',
    referencia: ''
  });

  const [formData, setFormData] = useState(getEmptyOrder());
  const [batchOrders, setBatchOrders] = useState<any[]>([getEmptyOrder()]);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/tiendas/${url}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
        } else {
          setTienda(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [url]);

  const fetchOrdenes = async () => {
    if (!tienda) return;
    try {
      const res = await fetch(`/api/tiendas/${tienda.id}/ordenes`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && tienda) {
      fetchOrdenes();
      // Polling or socket could be added here
      const interval = setInterval(fetchOrdenes, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, tienda]);
  
  // VIP Autocomplete Logic
  useEffect(() => {
    if (!tienda || formData.cliente_telefono.length < 10) return;
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clientes-vip/${tienda.id}?telefono=${formData.cliente_telefono}`);
        if (res.ok) {
          const clientData = await res.json();
          // Solo autocompletar si los campos están vacíos para no sobreescribir edición manual accidentalmente
          setFormData(prev => ({
            ...prev,
            cliente_nombre: prev.cliente_nombre || clientData.nombre,
            destino_direccion: prev.destino_direccion || clientData.direccion,
            sector: prev.sector || clientData.sector,
            referencia: prev.referencia || clientData.referencia
          }));
        }
      } catch (error) {
        console.error("Error fetching VIP client:", error);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.cliente_telefono, tienda]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const res = await fetch(`/api/tiendas/${url}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'PIN incorrecto');
      }
    } catch (error) {
      setLoginError('Error de conexión');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tienda) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tienda_id: tienda.id,
          cliente_nombre: formData.cliente_nombre,
          cliente_telefono: formData.cliente_telefono,
          destino_direccion: formData.destino_direccion,
          destino_ubicacion_url: formData.destino_ubicacion_url,
          destino_latitud: 0,
          destino_longitud: 0,
          monto_mercancia: parseFloat(formData.monto_mercancia) || 0,
          costo_envio: parseFloat(formData.costo_envio) || 0,
          sector: formData.sector,
          referencia: formData.referencia
        })
      });
      
      if (res.ok) {
        // Save to VIP directory automatically
        await fetch('/api/clientes-vip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tienda_id: tienda.id,
            telefono: formData.cliente_telefono,
            nombre: formData.cliente_nombre,
            direccion: formData.destino_direccion,
            sector: formData.sector,
            referencia: formData.referencia
          })
        });

        setSuccess(true);
        setFormData(getEmptyOrder());
        fetchOrdenes(); // Refresh orders
      } else {
        const data = await res.json();
        alert(data.error || 'Error al crear la orden');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBatchRow = () => {
    setBatchOrders([...batchOrders, getEmptyOrder()]);
  };

  const handleRemoveBatchRow = (index: number) => {
    const newBatch = [...batchOrders];
    newBatch.splice(index, 1);
    if (newBatch.length === 0) {
      newBatch.push(getEmptyOrder());
    }
    setBatchOrders(newBatch);
  };

  const handleBatchChange = (index: number, field: string, value: string) => {
    const newBatch = [...batchOrders];
    newBatch[index] = { ...newBatch[index], [field]: value };
    setBatchOrders(newBatch);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tienda) return;

    const validOrders = batchOrders.filter(o => o.cliente_nombre.trim() !== '' && o.destino_direccion.trim() !== '');
    
    if (validOrders.length === 0) {
      alert('Debes agregar al menos una orden válida (con nombre y dirección).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/ordenes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tienda_id: tienda.id,
          ordenes: validOrders.map(o => ({
            ...o,
            monto_mercancia: parseFloat(o.monto_mercancia) || 0,
            costo_envio: parseFloat(o.costo_envio) || 0
          }))
        })
      });
      
      if (res.ok) {
        setSuccess(true);
        setBatchOrders([getEmptyOrder()]);
        fetchOrdenes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al crear las órdenes');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const mapped = data.map((row: any) => ({
          cliente_nombre: row['Nombre Cliente'] || '',
          cliente_telefono: row['Teléfono'] || '',
          destino_direccion: row['Dirección'] || '',
          destino_ubicacion_url: row['URL Ubicación'] || '',
          monto_mercancia: row['Monto Mercancía'] ? String(row['Monto Mercancía']) : '',
          costo_envio: row['Costo Envío'] ? String(row['Costo Envío']) : ''
        })).filter(o => o.cliente_nombre && o.destino_direccion);
        
        setExcelPreview(mapped);
      } catch (err) {
        alert('Error al leer el archivo Excel. Asegúrate de usar la plantilla correcta.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelSubmit = async () => {
    if (excelPreview.length === 0 || !tienda) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/ordenes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tienda_id: tienda.id,
          ordenes: excelPreview.map(o => ({
            ...o,
            monto_mercancia: parseFloat(o.monto_mercancia) || 0,
            costo_envio: parseFloat(o.costo_envio) || 0
          }))
        })
      });
      
      if (res.ok) {
        setSuccess(true);
        setExcelPreview([]);
        fetchOrdenes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al crear las órdenes');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Nombre Cliente': 'Juan Perez',
      'Teléfono': '809-555-1234',
      'Dirección': 'Calle Principal #123, Sector',
      'URL Ubicación': 'https://maps.google.com/...',
      'Monto Mercancía': 1500,
      'Costo Envío': 200
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "Plantilla_Ordenes.xlsx");
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tienda) return;
    
    if (pinData.newPin !== pinData.confirmPin) {
      setPinStatus('error');
      setPinMessage('Los nuevos PINs no coinciden');
      return;
    }

    if (pinData.newPin.length < 4) {
      setPinStatus('error');
      setPinMessage('El nuevo PIN debe tener al menos 4 caracteres');
      return;
    }

    setPinStatus('loading');
    try {
      const res = await fetch(`/api/tiendas/${tienda.id}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPin: pinData.currentPin,
          newPin: pinData.newPin
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPinStatus('success');
        setPinMessage('¡PIN actualizado correctamente!');
        setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      } else {
        setPinStatus('error');
        setPinMessage(data.error || 'Error al actualizar el PIN');
      }
    } catch (error) {
      console.error(error);
      setPinStatus('error');
      setPinMessage('Error de conexión');
    }
  };

  const getStatusBadge = (orden: any) => {
    const status = orden.estatus;
    
    // Si la tienda ya confirmó el pago
    if (orden.pago_confirmado_tienda) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Pago Confirmado</span>;
    }
    
    // Si el admin ya marcó la liquidación como pagada a la tienda
    if (orden.liquidacion_estatus_pago_tienda === 'Pagado') {
      return <div className="bg-[#1d3557] text-white px-3 py-2 rounded-lg text-xs font-bold w-full text-center">Pagado por Admin</div>;
    }

    switch(status) {
      case 'Pendiente': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Pendiente</span>;
      case 'Asignado': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Pendiente</span>;
      case 'En Ruta': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En Ruta</span>;
      case 'Entregado': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Pendiente de Pago</span>;
      case 'Liquidado': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Pendiente de Pago</span>;
      case 'Cancelado': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelada</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const openMensajeroModal = (orden: any) => {
    if (orden.mensajero_nombre) {
      setSelectedMensajero({
        nombre: orden.mensajero_nombre,
        telefono: orden.mensajero_telefono,
        foto: orden.mensajero_foto,
        placa: orden.mensajero_placa
      });
      setIsModalOpen(true);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;
  if (!tienda) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">Tienda no encontrada</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
        <Link to="/" className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors z-10">
          <Home className="w-5 h-5" />
        </Link>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{tienda.nombre}</h1>
            <p className="text-gray-500 mt-2">Ingresa tu PIN de acceso para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PIN de Acceso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center tracking-widest text-lg"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>
              {loginError && <p className="text-red-500 text-sm mt-2 text-center">{loginError}</p>}
              <p className="text-xs text-gray-400 text-center mt-2">El PIN por defecto es 1234</p>
            </div>
            
            <button 
              type="submit" 
              disabled={loginLoading || pin.length < 4}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              {loginLoading ? 'Verificando...' : (
                <>
                  Ingresar <LogIn className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-gray-400 hover:text-blue-600 transition-colors">
              <Home className="w-6 h-6" />
            </Link>
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">{tienda.nombre}</h1>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('nueva')}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'nueva' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-4 h-4 mr-2" />
            Mis Órdenes
          </button>
          <button 
            onClick={() => setActiveTab('ajustes')}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'ajustes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Ajustes
          </button>
        </div>

        {activeTab === 'nueva' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h2 className="text-xl font-bold">Solicitud de Despacho</h2>
              <p className="text-blue-100 text-sm mt-1">Selecciona cómo deseas crear tus órdenes</p>
            </div>
            
            <div className="border-b border-gray-200 bg-gray-50 flex">
              <button 
                onClick={() => setCreationMode('single')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center ${creationMode === 'single' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <User className="w-4 h-4 mr-2" />
                Individual
              </button>
              <button 
                onClick={() => setCreationMode('multiple')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center ${creationMode === 'multiple' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <List className="w-4 h-4 mr-2" />
                Múltiple (Rápida)
              </button>
              <button 
                onClick={() => setCreationMode('excel')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center ${creationMode === 'excel' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar Excel
              </button>
            </div>
            
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">¡Órdenes Creadas!</h2>
                  <p className="text-gray-600 mb-6">El mensajero ha sido notificado y está en camino.</p>
                  <button 
                    onClick={() => {
                      setSuccess(false);
                      setActiveTab('historial');
                    }}
                    className="w-full max-w-md mx-auto bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors block"
                  >
                    Ver mis órdenes
                  </button>
                </div>
              ) : (
                <>
                  {creationMode === 'single' && (
                    <form onSubmit={handleSubmitOrder} className="space-y-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input 
                            type="text" 
                            required
                            value={formData.cliente_nombre}
                            onChange={e => setFormData({...formData, cliente_nombre: e.target.value})}
                            className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej. María Pérez"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input 
                            type="tel" 
                            required
                            value={formData.cliente_telefono}
                            onChange={e => setFormData({...formData, cliente_telefono: e.target.value})}
                            className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej. 809-555-1234"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Entrega</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input 
                            type="text" 
                            required
                            value={formData.destino_direccion}
                            onChange={e => setFormData({...formData, destino_direccion: e.target.value})}
                            className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej. Calle Principal #123, Sector"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sector (Zonificación)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                              type="text" 
                              required
                              value={formData.sector}
                              onChange={e => setFormData({...formData, sector: e.target.value})}
                              className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-blue-700"
                              placeholder="Ej. Piantini, Bella Vista..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Apto / Local</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Home className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                              type="text" 
                              value={formData.referencia}
                              onChange={e => setFormData({...formData, referencia: e.target.value})}
                              className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="Ej. Apto 4B, frente al parque"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación de Google Maps (Opcional)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input 
                            type="url" 
                            value={formData.destino_ubicacion_url}
                            onChange={e => setFormData({...formData, destino_ubicacion_url: e.target.value})}
                            className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Pega el enlace de Google Maps aquí"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">Si el cliente te envió su ubicación por WhatsApp, pégala aquí.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cobro (COD)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                              type="number" 
                              required
                              min="0"
                              step="0.01"
                              value={formData.monto_mercancia}
                              onChange={e => setFormData({...formData, monto_mercancia: e.target.value})}
                              className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Envío</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                              type="number" 
                              required
                              min="0"
                              step="0.01"
                              value={formData.costo_envio}
                              onChange={e => setFormData({...formData, costo_envio: e.target.value})}
                              className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                        >
                          {submitting ? 'Enviando...' : 'Solicitar Mensajero'}
                        </button>
                      </div>
                    </form>
                  )}

                  {creationMode === 'multiple' && (
                    <form onSubmit={handleBatchSubmit} className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                              <th className="px-3 py-2">Cliente</th>
                              <th className="px-3 py-2">Teléfono</th>
                              <th className="px-3 py-2">Dirección</th>
                              <th className="px-3 py-2">Sector</th>
                              <th className="px-3 py-2">REF</th>
                              <th className="px-3 py-2">COD</th>
                              <th className="px-3 py-2">Envío</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchOrders.map((order, index) => (
                              <tr key={index} className="border-b">
                                <td className="px-2 py-2">
                                  <input type="text" required placeholder="Nombre" value={order.cliente_nombre} onChange={(e) => handleBatchChange(index, 'cliente_nombre', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="tel" required placeholder="Teléfono" value={order.cliente_telefono} onChange={(e) => handleBatchChange(index, 'cliente_telefono', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" required placeholder="Dirección" value={order.destino_direccion} onChange={(e) => handleBatchChange(index, 'destino_direccion', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" required placeholder="Sector" value={order.sector} onChange={(e) => handleBatchChange(index, 'sector', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 font-bold text-blue-600" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" placeholder="REF" value={order.referencia} onChange={(e) => handleBatchChange(index, 'referencia', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="number" required min="0" step="0.01" placeholder="0.00" value={order.monto_mercancia} onChange={(e) => handleBatchChange(index, 'monto_mercancia', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="number" required min="0" step="0.01" placeholder="0.00" value={order.costo_envio} onChange={(e) => handleBatchChange(index, 'costo_envio', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button type="button" onClick={() => handleRemoveBatchRow(index)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4">
                        <button type="button" onClick={handleAddBatchRow} className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm">
                          <Plus className="w-4 h-4 mr-1" /> Añadir Fila
                        </button>
                        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70">
                          {submitting ? 'Guardando...' : `Crear ${batchOrders.length} Órdenes`}
                        </button>
                      </div>
                    </form>
                  )}

                  {creationMode === 'excel' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start">
                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-blue-900">Sube tus órdenes desde Excel</h3>
                          <p className="text-sm text-blue-800 mt-1">
                            Descarga nuestra plantilla, llénala con tus pedidos y súbela aquí para crear múltiples órdenes al instante.
                          </p>
                          <button onClick={downloadTemplate} className="mt-3 text-sm bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Plantilla
                          </button>
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                        <input 
                          type="file" 
                          accept=".xlsx, .xls, .csv" 
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="font-medium text-gray-900">Haz clic para subir tu archivo Excel</p>
                        <p className="text-sm text-gray-500 mt-1">o arrástralo y suéltalo aquí</p>
                      </div>

                      {excelPreview.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-bold text-gray-900 mb-3">Vista Previa ({excelPreview.length} órdenes)</h3>
                          <div className="overflow-x-auto border border-gray-200 rounded-xl">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3">Cliente</th>
                                  <th className="px-4 py-3">Dirección</th>
                                  <th className="px-4 py-3">COD</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {excelPreview.slice(0, 5).map((order, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-3">{order.cliente_nombre}</td>
                                    <td className="px-4 py-3 truncate max-w-[200px]">{order.destino_direccion}</td>
                                    <td className="px-4 py-3">RD${order.monto_mercancia}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {excelPreview.length > 5 && (
                              <div className="text-center py-2 text-xs text-gray-500 bg-gray-50">
                                Y {excelPreview.length - 5} órdenes más...
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setExcelPreview([])} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                              Cancelar
                            </button>
                            <button onClick={handleExcelSubmit} disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70">
                              {submitting ? 'Guardando...' : `Confirmar y Crear ${excelPreview.length} Órdenes`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Historial de Órdenes</h2>
              <button onClick={fetchOrdenes} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Actualizar
              </button>
            </div>
            
            {ordenes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No tienes órdenes registradas aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">ID / Fecha</th>
                      <th className="p-4 font-medium">Cliente</th>
                      <th className="p-4 font-medium">Estado</th>
                      <th className="p-4 font-medium">Mensajero</th>
                      <th className="p-4 font-medium text-right">Monto (COD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ordenes.map((orden) => (
                      <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">#{orden.id.substring(0, 6)}</div>
                          <div className="text-xs text-gray-500">{new Date(orden.created_at).toLocaleString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{orden.cliente_nombre}</div>
                          <div className="text-xs text-gray-500">{orden.destino_direccion}</div>
                          {orden.destino_ubicacion_url && (
                            <a 
                              href={orden.destino_ubicacion_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs text-blue-600 hover:underline inline-flex items-center mt-1"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Ver en Mapa
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-2 w-full">
                            {getStatusBadge(orden)}
                            {orden.liquidacion_estatus_pago_tienda === 'Pagado' && !orden.pago_confirmado_tienda && (
                              <div className="flex flex-col gap-2 w-full mt-1">
                                {orden.liquidacion_comprobante_pago_tienda && (
                                  <button 
                                    onClick={() => {
                                      setComprobanteUrl(orden.liquidacion_comprobante_pago_tienda);
                                      setComprobanteModalOpen(true);
                                    }}
                                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors w-full text-center"
                                  >
                                    Ver Comprobante
                                  </button>
                                )}
                                <button 
                                  onClick={async () => {
                                    if (confirm("¿Confirmas que has recibido el pago de esta orden?")) {
                                      try {
                                        const res = await fetch(`/api/ordenes/${orden.id}/confirmar-pago`, { method: 'POST' });
                                        if (res.ok) fetchOrdenes();
                                      } catch (e) { console.error(e); }
                                    }
                                  }}
                                  className="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors w-full text-center"
                                >
                                  Confirmar Pago Realizado
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {orden.mensajero_nombre ? (
                            <div 
                              className="flex items-center cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded-lg transition-colors"
                              onClick={() => openMensajeroModal(orden)}
                            >
                              {orden.mensajero_foto ? (
                                <img src={orden.mensajero_foto} alt={orden.mensajero_nombre} className="w-8 h-8 rounded-full object-cover mr-2" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-2">
                                  {orden.mensajero_nombre.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-blue-600 hover:underline">{orden.mensajero_nombre}</div>
                                <div className="text-xs text-gray-500">{orden.mensajero_telefono}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-bold text-gray-900">${orden.monto_mercancia.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Envío: ${orden.costo_envio.toFixed(2)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ajustes' && (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h2 className="text-xl font-bold">Ajustes de Seguridad</h2>
              <p className="text-blue-100 text-sm mt-1">Cambia tu PIN de acceso</p>
            </div>
            
            <div className="p-6">
              {pinStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{pinMessage}</p>
                </div>
              )}

              {pinStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{pinMessage}</p>
                </div>
              )}

              <form onSubmit={handleChangePin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Actual</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={pinData.currentPin}
                      onChange={e => setPinData({...pinData, currentPin: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ingresa tu PIN actual"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo PIN</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      minLength={4}
                      value={pinData.newPin}
                      onChange={e => setPinData({...pinData, newPin: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Mínimo 4 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nuevo PIN</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      minLength={4}
                      value={pinData.confirmPin}
                      onChange={e => setPinData({...pinData, confirmPin: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Repite el nuevo PIN"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={pinStatus === 'loading'}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                  >
                    {pinStatus === 'loading' ? 'Actualizando...' : 'Actualizar PIN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Mensajero Modal */}
      {isModalOpen && selectedMensajero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative h-64 bg-gray-200">
              {selectedMensajero.foto ? (
                <img 
                  src={selectedMensajero.foto} 
                  alt={selectedMensajero.nombre} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                  <User className="w-24 h-24" />
                </div>
              )}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedMensajero.nombre}</h3>
              <p className="text-gray-500 mb-6 flex items-center justify-center">
                <Phone className="w-4 h-4 mr-2" />
                {selectedMensajero.telefono}
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Placa del Motor</div>
                <div className="text-xl font-mono font-bold text-gray-900">
                  {selectedMensajero.placa || 'No registrada'}
                </div>
              </div>
              
              <a 
                href={`https://wa.me/${selectedMensajero.telefono.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Comprobante Modal */}
      {comprobanteModalOpen && comprobanteUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Comprobante de Pago</h3>
              <button 
                onClick={() => {
                  setComprobanteModalOpen(false);
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
    </div>
  );
}
