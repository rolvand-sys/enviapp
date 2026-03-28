import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, Store, Zap, Shield, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://i.imgur.com/fGhOmmV.png" alt="EnviApp" className="h-16" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/tenant-123" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Iniciar Sesión
            </Link>
            <Link to="/admin/tenant-123" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10">
              Comenzar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
              El software definitivo para <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                gestionar tus entregas
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Ya seas una empresa de mensajería con múltiples clientes o una tienda con tu propia flota de repartidores. Toma el control total de tus despachos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/admin/tenant-123" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center group">
                Soy una Mensajería
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/admin/tenant-tienda-789" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-full font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center">
                Soy una Tienda Independiente
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[2.5rem] transform rotate-3 scale-105"></div>
            <img 
              src="https://i.imgur.com/ag08aTn.png" 
              alt="Mensajero motorizado" 
              className="relative rounded-[2rem] shadow-2xl object-cover h-[500px] w-full"
              referrerPolicy="no-referrer"
            />
            {/* Floating UI Element */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Orden Entregada</p>
                <p className="text-xs text-gray-500">Hace 2 minutos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section: Logística en 3 Movimientos */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Logística en 3 Movimientos</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Control total desde la creación hasta el cobro final. Así es el flujo de EnviAPP.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-500 group">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:bg-indigo-600 transition-colors duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">1</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Integración Digital</h3>
              <p className="text-gray-600 leading-relaxed">
                Carga tus órdenes de forma masiva o manual. En segundos, tu inventario logístico está mapeado y listo para arrancar.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-500 group">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:bg-indigo-600 transition-colors duration-300">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">2</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Asignación Inteligente</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualiza el mapa y elige al mensajero ideal con un clic. Rutas optimizadas para que el motor nunca se detenga.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-500 group">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:bg-indigo-600 transition-colors duration-300">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">3</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cierre y Liquidación</h3>
              <p className="text-gray-600 leading-relaxed">
                Control total de ingresos y cobros (D+1). El sistema liquida automáticamente tus ganancias y pagos a mensajeros sin fallos.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas en un solo lugar</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">Nuestra plataforma está diseñada para simplificar la logística, reducir errores y aumentar tus ganancias.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: "Rastreo Tiempo Real", desc: "Monitorea a tus mensajeros en el mapa, asigna rutas eficientes y mantén a tus clientes informados.", color: "bg-blue-50" },
              { icon: Store, title: "Portales para Tiendas", desc: "Si eres mensajería, dale a cada tienda cliente su propio portal para crear órdenes y ver sus liquidaciones.", color: "bg-indigo-50" },
              { icon: Zap, title: "Liquidaciones Automáticas", desc: "Olvídate del Excel. El sistema calcula automáticamente cuánto debes pagar a tiendas y mensajeros (Cuadre D+1).", color: "bg-emerald-50" },
              { icon: Smartphone, title: "App para Mensajeros", desc: "Aplicación web optimizada para móviles donde tus mensajeros pueden ver sus rutas, confirmar entregas y subir fotos.", color: "bg-orange-50" },
              { icon: Shield, title: "Control de Efectivo", desc: "Mantén un registro exacto del dinero en mano que tiene cada mensajero por cobros en efectivo (COD).", color: "bg-purple-50" },
              { icon: Package, title: "Gestión de Estados", desc: "Flujo de trabajo claro: Creada, Asignada, Recogida, Entregada o Devuelta. Todo con registro de hora y ubicación.", color: "bg-teal-50" }
            ].map((feature, i) => (
              <div key={i} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300`}>
                  <feature.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Models Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Dos modelos, una misma plataforma</h2>
            <div className="space-y-8">
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mt-1 group-hover:bg-blue-600 transition-colors duration-300">
                  <Truck className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2 text-gray-900">Para Empresas de Mensajería</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">Afilia múltiples tiendas, asígnales un portal único, gestiona tu flotilla y automatiza el cobro de tus comisiones.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700 font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Portales ilimitados para clientes</li>
                    <li className="flex items-center text-sm text-gray-700 font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Liquidación separada (Tienda vs Mensajero)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mt-1 group-hover:bg-indigo-600 transition-colors duration-300">
                  <Store className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2 text-gray-900">Para Tiendas Independientes</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">Si tienes tu propia flota de repartidores. Crea órdenes directamente y controla a tu personal con un panel dedicado.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700 font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Creación rápida de órdenes</li>
                    <li className="flex items-center text-sm text-gray-700 font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Control de pagos a tu propia flota</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl transform rotate-3"></div>
            <div className="relative bg-white border border-gray-200 rounded-3xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">MR</div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Mensajería Rápida</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Panel de Control</div>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">ACTIVO</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Órdenes Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Mensajeros</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Últimas Órdenes</p>
                {[
                  { id: 'ORD-001', status: 'Entregada', color: 'bg-green-100 text-green-800', tienda: 'Tienda de Ropa' },
                  { id: 'ORD-002', status: 'En Camino', color: 'bg-blue-100 text-blue-800', tienda: 'Electrónica Express' },
                  { id: 'ORD-003', status: 'Asignada', color: 'bg-orange-100 text-orange-800', tienda: 'Calzados VIP' }
                ].map((orden, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-50 flex items-center justify-between p-3 shadow-sm group hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Package className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{orden.id}</div>
                        <div className="text-xs text-gray-500">{orden.tienda}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${orden.color}`}>
                      {orden.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-900 text-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4">Precios simples y transparentes</h2>
          <p className="text-gray-400 mb-12 text-lg">Paga solo por lo que usas. Sin mensualidades ocultas.</p>
          
          <div className="bg-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700 max-w-lg mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">MÁS POPULAR</div>
            <h3 className="text-2xl font-bold mb-2 text-blue-400 uppercase tracking-widest">Pago por Envío</h3>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl font-extrabold text-white">$10</span>
              <span className="text-gray-400 font-bold">DOP / orden</span>
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed">Recarga tu saldo y consume créditos únicamente cuando asignas un mensajero a una orden.</p>
            
            <ul className="space-y-4 text-left mb-8">
              <li className="flex items-center text-gray-300"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-3" /> Tiendas y clientes ilimitados</li>
              <li className="flex items-center text-gray-300"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-3" /> Mensajeros y portales ilimitados</li>
              <li className="flex items-center text-gray-300"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-3" /> Soporte técnico especializado</li>
            </ul>
            
            <Link to="/admin/tenant-123" className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
              Crear Cuenta Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">Resuelve tus dudas sobre cómo EnviAPP puede transformar tu logística operativa hoy mismo.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: "¿Cómo funciona el cobro por créditos?", a: "Compras un paquete de créditos por adelantado. Cada vez que asignas un mensajero a una orden, se descuenta 1 crédito. Crear órdenes es gratis." },
              { q: "¿Puedo tener múltiples tiendas afiliadas?", a: "Sí, si eres una empresa de mensajería, puedes afiliar tiendas ilimitadas. Cada una tendrá su propio portal para crear órdenes." },
              { q: "¿Los mensajeros necesitan descargar una app?", a: "No, utilizan una PWA ultra-ligera. Es rápida, segura y funciona en cualquier smartphone sin ocupar espacio." },
              { q: "¿Cómo funcionan las liquidaciones?", a: "El sistema calcula automáticamente cuánto le debes a cada tienda (COD) y cuánto le debes a cada mensajero (tarifas de envío) en tiempo real." },
              { q: "¿Puedo usarlo si soy una tienda independiente?", a: "¡Absolutamente! EnviAPP es perfecto para tiendas que manejan su propia flota de motorizados y buscan optimizar sus procesos." },
              { q: "¿Qué pasa si me quedo sin créditos?", a: "Las tiendas podrán seguir creando órdenes, pero no podrás asignarles mensajeros hasta que realices una recarga de saldo." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <h4 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img src="https://i.imgur.com/fGhOmmV.png" alt="EnviApp" className="h-12" />
          </div>
          <p className="text-gray-500 text-sm text-center md:text-left font-medium">
            © 2026 EnviApp. Todos los derechos reservados. <span className="hidden md:inline">|</span><br className="md:hidden" /> Desarrollado por <a href="https://impulsapymes.net" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transiton-colors">ImpulsaPymes.net</a>
          </p>
          <div className="flex gap-6">
            <Link to="/t/tienda-ropa-rd" className="text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors">Demo Tienda</Link>
            <Link to="/m" className="text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors">Demo Mensajero</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
