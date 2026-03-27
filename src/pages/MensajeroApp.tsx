import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MapPin, Phone, User, Package, Navigation, CheckCircle, Wallet, AlertCircle, Home } from 'lucide-react';

export default function MensajeroApp() {
  const { mensajeroId } = useParams();
  const [mensajero, setMensajero] = useState<any>(null);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  
  // Modal state for delivery confirmation
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, orden: any | null}>({ isOpen: false, orden: null });
  const [montoCobrado, setMontoCobrado] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/mensajeros/${mensajeroId}`);
      const data = await res.json();
      if (!data.error) {
        setMensajero(data.mensajero);
        setOrdenes(data.ordenes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_mensajero', mensajeroId);
    });

    newSocket.on('nueva_asignacion', (orden: any) => {
      setOrdenes(prev => {
        // Check if already exists to avoid duplicates
        if (prev.find(o => o.id === orden.id)) return prev;
        return [orden, ...prev];
      });
      // Vibrate if supported (Mobile PWA feature)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [mensajeroId]);

  const actualizarEstado = async (ordenId: string, nuevoEstado: string, monto?: number) => {
    try {
      const body: any = { estatus: nuevoEstado };
      if (monto !== undefined) body.monto_cobrado = monto;

      const res = await fetch(`/api/ordenes/${ordenId}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        setMensajero(data.mensajero);
        
        if (nuevoEstado === 'Entregado') {
          // Remove from active list
          setOrdenes(prev => prev.filter(o => o.id !== ordenId));
          setConfirmModal({ isOpen: false, orden: null });
        } else {
          // Update in list
          setOrdenes(prev => prev.map(o => o.id === ordenId ? data.orden : o));
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const openMaps = (direccion: string) => {
    // Universal link that works on iOS (Apple Maps) and Android (Google Maps)
    const encodedAddress = encodeURIComponent(direccion);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  };

  const openConfirmModal = (orden: any) => {
    const totalEsperado = orden.monto_mercancia + orden.costo_envio;
    setMontoCobrado(totalEsperado.toString());
    setConfirmModal({ isOpen: true, orden });
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;
  if (!mensajero) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">Mensajero no encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header / Billetera en Vivo */}
      <header className="bg-gray-900 text-white sticky top-0 z-10 shadow-md">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="mr-3 text-gray-400 hover:text-white transition-colors">
              <Home className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">{mensajero.nombre}</h1>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                En línea
              </div>
            </div>
          </div>
          <div className="text-right bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
            <div className="text-xs text-gray-400 flex items-center justify-end mb-1">
              <Wallet className="w-3 h-3 mr-1" />
              Efectivo en mano
            </div>
            <div className="text-xl font-bold text-green-400">
              RD${mensajero.billetera_virtual.toFixed(2)}
            </div>
          </div>
        </div>
      </header>

      {/* Lista de Órdenes */}
      <main className="p-4 space-y-4">
        {ordenes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200 mt-8">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Sin órdenes activas</h2>
            <p className="text-gray-500 mt-2">Espera a que te asignen un nuevo despacho.</p>
          </div>
        ) : (
          ordenes.map(orden => (
            <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className={`px-4 py-3 flex justify-between items-center text-white ${orden.estatus === 'En Ruta' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                <div className="font-bold">
                  {orden.estatus === 'En Ruta' ? 'EN RUTA' : 'NUEVA ASIGNACIÓN'}
                </div>
                <div className="text-sm font-medium bg-white/20 px-2 py-1 rounded">
                  #{orden.id.substring(0, 6)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{orden.cliente_nombre}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      <a href={`tel:${orden.cliente_telefono}`} className="text-blue-600 font-medium">{orden.cliente_telefono}</a>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-bold">A Cobrar</div>
                    <div className="text-2xl font-black text-green-600">
                      RD${(orden.monto_mercancia + orden.costo_envio).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 flex items-start">
                  <MapPin className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-800 text-sm">{orden.destino_direccion}</p>
                </div>

                <div className="text-sm text-gray-500 mb-4 flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  Recoger en: <span className="font-bold text-gray-800 ml-1">{orden.tienda_nombre}</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => openMaps(orden.destino_direccion)}
                    className="flex items-center justify-center bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Mapa
                  </button>

                  {orden.estatus === 'Asignado' ? (
                    <button 
                      onClick={() => actualizarEstado(orden.id, 'En Ruta')}
                      className="flex items-center justify-center bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Truck className="w-5 h-5 mr-2" />
                      Iniciar Ruta
                    </button>
                  ) : (
                    <button 
                      onClick={() => openConfirmModal(orden)}
                      className="flex items-center justify-center bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Entregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal de Confirmación de Entrega */}
      {confirmModal.isOpen && confirmModal.orden && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="bg-green-600 p-6 text-white text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-2" />
              <h2 className="text-2xl font-bold">Confirmar Entrega</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-500 mb-1">Monto total a recibir del cliente:</p>
                <div className="text-4xl font-black text-gray-900">
                  RD${(confirmModal.orden.monto_mercancia + confirmModal.orden.costo_envio).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuánto efectivo recibiste realmente?</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold">RD$</span>
                  </div>
                  <input 
                    type="number" 
                    value={montoCobrado}
                    onChange={(e) => setMontoCobrado(e.target.value)}
                    className="pl-12 w-full text-2xl font-bold border-2 border-gray-200 rounded-xl py-4 px-4 focus:ring-0 focus:border-green-500 outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Este monto se sumará a tu billetera virtual.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, orden: null })}
                  className="py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => actualizarEstado(confirmModal.orden.id, 'Entregado', parseFloat(montoCobrado))}
                  className="py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component since lucide-react doesn't export Truck directly in this version sometimes
function Truck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" />
      <path d="M14 17h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
