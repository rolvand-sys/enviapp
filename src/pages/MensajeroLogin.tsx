import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, User } from 'lucide-react';

export default function MensajeroLogin() {
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeros, setMensajeros] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/mensajeros')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMensajeros(data);
        }
      })
      .catch(err => console.error("Error fetching mensajeros", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono) {
      setError('Por favor ingresa tu número de teléfono');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mensajeros/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono })
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/m/${data.id}`);
      } else {
        setError(data.error || 'Número de teléfono no encontrado');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loginAs = (id: string) => {
    navigate(`/m/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold">App Mensajero</h1>
          <p className="text-blue-100 mt-2">Ingresa para ver tus despachos</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Número de Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 8095551234"
                  className="pl-12 w-full text-lg border-2 border-gray-200 rounded-xl py-3 px-4 focus:ring-0 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-400"
            >
              {loading ? 'Verificando...' : 'Entrar'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>
          </form>

          {mensajeros.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="text-center text-sm text-gray-500 mb-4 font-medium">O selecciona un mensajero (Modo Prueba):</p>
              <div className="space-y-3">
                {mensajeros.map(m => (
                  <button
                    key={m.id}
                    onClick={() => loginAs(m.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt={m.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{m.nombre}</div>
                        <div className="text-xs text-gray-500">{m.telefono}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
