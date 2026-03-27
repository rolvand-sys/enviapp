import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Package, DollarSign, Plus, Home, TrendingUp, Activity, Globe, CheckCircle, XCircle, CreditCard, Menu, X, AlertCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [reloadRequests, setReloadRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newTenantModalOpen, setNewTenantModalOpen] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    nombre: '',
    country_code: 'DO',
    tipo_tenant: 'mensajeria_con_tiendas'
  });

  const fetchData = async () => {
    try {
      const [tenantsRes, statsRes, countriesRes, requestsRes] = await Promise.all([
        fetch('/api/superadmin/tenants', { headers: { 'x-superadmin-key': 'antigravity-secret-2026' } }),
        fetch('/api/superadmin/stats', { headers: { 'x-superadmin-key': 'antigravity-secret-2026' } }),
        fetch('/api/superadmin/countries', { headers: { 'x-superadmin-key': 'antigravity-secret-2026' } }),
        fetch('/api/superadmin/reload-requests', { headers: { 'x-superadmin-key': 'antigravity-secret-2026' } })
      ]);

      setTenants(await tenantsRes.json());
      setStats(await statsRes.json());
      setCountries(await countriesRes.json());
      setReloadRequests(await requestsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = sessionStorage.getItem('superadmin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'antigravity-secret-2026') {
      setIsAuthenticated(true);
      setLoginError(false);
      sessionStorage.setItem('superadmin_authenticated', 'true');
      setLoading(true);
      fetchData();
    } else {
      setLoginError(true);
    }
  };

  const handleToggleCountry = async (iso: string) => {
    try {
      const res = await fetch(`/api/superadmin/countries/${iso}/toggle`, {
        method: 'POST',
        headers: { 'x-superadmin-key': 'antigravity-secret-2026' }
      });
      if (res.ok) {
        setCountries(prev => prev.map(c => c.iso_code === iso ? { ...c, is_active: c.is_active ? 0 : 1 } : c));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/superadmin/reload-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'x-superadmin-key': 'antigravity-secret-2026' }
      });
      if (res.ok) {
        fetchData(); // Refresh all data to update tenant balances and request status
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/superadmin/reload-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'x-superadmin-key': 'antigravity-secret-2026' }
      });
      if (res.ok) {
        setReloadRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkSetupPaid = async (tenantId: string) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/setup`, {
        method: 'POST',
        headers: { 'x-superadmin-key': 'antigravity-secret-2026' }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-key': 'antigravity-secret-2026'
        },
        body: JSON.stringify(newTenantForm)
      });
      if (res.ok) {
        setNewTenantModalOpen(false);
        setNewTenantForm({ nombre: '', country_code: 'DO', tipo_tenant: 'mensajeria_con_tiendas' });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Building2 className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">SuperAdmin Access</h2>
            <p className="text-gray-500 text-center mb-8">Ingresa la clave maestra para continuar</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                  autoFocus
                />
              </div>
              {loginError && (
                <div className="flex items-center text-red-600 text-sm mt-1 animate-bounce">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Clave incorrecta. Inténtalo de nuevo.
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
              >
                Acceder al Panel
              </button>
            </form>
          </div>
          <div className="py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando panel de administración...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col fixed inset-y-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Building2 className="w-8 h-8 text-blue-400 mr-3" />
          <h1 className="text-xl font-bold">Super Admin</h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menú Principal</div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tenants' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Building2 className="w-5 h-5 mr-3" />
              Mensajerías
            </button>
            <button
              onClick={() => setActiveTab('recargas')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'recargas' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Recargas
              {reloadRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {reloadRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'config' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Globe className="w-5 h-5 mr-3" />
              Mercados (LatAm)
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-800">
          <Link to="/" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors px-2">
            <Home className="w-5 h-5 mr-3" />
            Volver al Inicio
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-xl font-bold">Super Admin</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menú Principal</div>
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('tenants'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tenants' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Building2 className="w-5 h-5 mr-3" />
              Mensajerías
            </button>
            <button
              onClick={() => { setActiveTab('recargas'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'recargas' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Recargas
              {reloadRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {reloadRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('config'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'config' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Globe className="w-5 h-5 mr-3" />
              Mercados (LatAm)
            </button>
          </nav>
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
            <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 hidden md:flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 flex items-center text-gray-600">
            <Activity className="w-4 h-4 mr-2 text-green-500" />
            Sistema Operativo
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Tenants Activos</h3>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.total_tenants || 0}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Órdenes Totales</h3>
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.total_ordenes || 0}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Mensajeros</h3>
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.total_mensajeros || 0}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Volumen (Entregado)</h3>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">RD${(stats?.total_volumen_envios || 0).toFixed(2)}</div>
            </div>
          </div>

          {/* Tab Content: Tenants */}
          {activeTab === 'tenants' && (
            <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Mensajerías Registradas</h2>
                <button
                  onClick={() => setNewTenantModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Empresa
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Métricas</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setup & Créditos</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                              {tenant.nombre.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{tenant.nombre}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {tenant.id} | País: {tenant.country_code} | Tipo: {tenant.tipo_tenant === 'tienda_independiente' ? 'Tienda' : 'Mensajería'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center mb-1">
                            <Package className="w-4 h-4 text-gray-400 mr-2" />
                            {tenant.total_ordenes} órdenes
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            {tenant.total_mensajeros} mensajeros
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center mb-1">
                            <DollarSign className={`w-4 h-4 mr-1 ${tenant.balance_creditos <= 0 ? 'text-red-500' : 'text-green-500'}`} />
                            <span className={`text-sm font-bold ${tenant.balance_creditos <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {tenant.balance_creditos.toFixed(2)} CR
                            </span>
                          </div>
                          <div>
                            {tenant.setup_paid ? (
                              <span className="text-xs text-green-600 font-medium flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" /> Setup Pagado
                              </span>
                            ) : (
                              <span className="text-xs text-orange-500 font-medium flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Setup Pendiente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {tenant.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!tenant.setup_paid && (
                            <button
                              onClick={() => handleMarkSetupPaid(tenant.id)}
                              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                            >
                              Marcar Setup Pagado (+200 CR)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Recargas */}
          {activeTab === 'recargas' && (
            <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Solicitudes de Recarga Manual (RD)</h2>
                <p className="text-sm text-gray-500 mt-1">Verifica las transferencias bancarias antes de aprobar los créditos.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensajería</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles Transferencia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créditos Solicitados</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reloadRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No hay solicitudes de recarga.
                        </td>
                      </tr>
                    ) : (
                      reloadRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(req.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{req.tenant_nombre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono">Ref: {req.bank_reference}</div>
                            <div className="text-xs text-gray-500">Banco: {req.bank_name}</div>
                            <a href={req.receipt_image_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver Comprobante</a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">+{req.amount_requested} CR</div>
                            <div className="text-xs text-gray-500">RD${(req.amount_requested * 10).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {req.status === 'pending' && (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleApproveRequest(req.id)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-lg transition-colors"
                                  title="Aprobar y sumar créditos"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors"
                                  title="Rechazar"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Configuración Global */}
          {activeTab === 'config' && (
            <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Mercados y Países (LatAm)
                </h2>
                <p className="text-sm text-gray-500 mt-1">Activa o desactiva los países donde EnviApp está operando.</p>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {countries.map((country) => (
                  <div key={country.iso_code} className={`border rounded-xl p-5 transition-all ${country.is_active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700 mr-3">
                          {country.iso_code}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{country.name}</h3>
                          <p className="text-xs text-gray-500">Moneda: {country.currency}</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleCountry(country.iso_code)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${country.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${country.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 text-sm border border-gray-100">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Setup Fee:</span>
                        <span className="font-medium">$97.00 USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor Crédito:</span>
                        <span className="font-medium">
                          {country.iso_code === 'DO' ? 'RD$10.00' : `$${country.credit_price} USD`}
                        </span>
                      </div>
                    </div>

                    {country.is_active && country.iso_code !== 'DO' && (
                      <div className="mt-3 text-xs text-blue-600 flex items-center">
                        <CreditCard className="w-3 h-3 mr-1" />
                        Pasarela de pago automática activada
                      </div>
                    )}
                    {country.is_active && country.iso_code === 'DO' && (
                      <div className="mt-3 text-xs text-orange-600 flex items-center">
                        <Activity className="w-3 h-3 mr-1" />
                        Aprobación manual de pagos activada
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Tenant Modal */}
      {newTenantModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Registrar Nueva Empresa</h3>
              <button onClick={() => setNewTenantModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={newTenantForm.nombre}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: Logística Express"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País / Mercado</label>
                <select
                  value={newTenantForm.country_code}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, country_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {countries.map(c => (
                    <option key={c.iso_code} value={c.iso_code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operación</label>
                <select
                  value={newTenantForm.tipo_tenant}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, tipo_tenant: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="mensajeria_con_tiendas">Mensajería (Múltiples Clientes)</option>
                  <option value="tienda_independiente">Tienda con Flota Propia</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewTenantModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Crear Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
