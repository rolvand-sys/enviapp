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
            <Link to="/admin/tenant-123" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
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

      {/* Video Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Descubre cómo funciona</h2>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-video bg-gray-900 border-4 border-gray-100">
            {/* Placeholder for Video */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <img src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200" alt="Video Thumbnail" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas en un solo lugar</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Nuestra plataforma está diseñada para simplificar la logística, reducir errores y aumentar tus ganancias.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Rastreo en Tiempo Real</h3>
              <p className="text-gray-600">Monitorea a tus mensajeros en el mapa, asigna rutas eficientes y mantén a tus clientes informados.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Store className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Portales para Tiendas</h3>
              <p className="text-gray-600">Si eres mensajería, dale a cada tienda cliente su propio portal para crear órdenes y ver sus liquidaciones.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Liquidaciones Automáticas</h3>
              <p className="text-gray-600">Olvídate del Excel. El sistema calcula automáticamente cuánto debes pagar a tiendas y mensajeros (Cuadre D+1).</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">App para Mensajeros</h3>
              <p className="text-gray-600">Aplicación web optimizada para móviles donde tus mensajeros pueden ver sus rutas, confirmar entregas y subir fotos.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Control de Efectivo</h3>
              <p className="text-gray-600">Mantén un registro exacto del dinero en mano que tiene cada mensajero por cobros en efectivo (COD).</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestión de Estados</h3>
              <p className="text-gray-600">Flujo de trabajo claro: Creada, Asignada, Recogida, Entregada o Devuelta. Todo con registro de hora y ubicación.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Models Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Dos modelos, una misma plataforma</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Para Empresas de Mensajería</h4>
                  <p className="text-gray-600 mb-4">Afilia múltiples tiendas, asígnales un portal único, gestiona tu flotilla de motorizados y automatiza el cobro de tus comisiones por envío.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Portales ilimitados para clientes</li>
                    <li className="flex items-center text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Liquidación separada (Tienda vs Mensajero)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                  <Store className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Para Tiendas Independientes</h4>
                  <p className="text-gray-600 mb-4">Si tienes tu propia tienda online con repartidores propios. Crea órdenes directamente y controla a tu personal.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Creación rápida de órdenes</li>
                    <li className="flex items-center text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Control de pagos a tu propia flota</li>
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
                    <div className="text-xs text-gray-500">Panel de Control</div>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Activo</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Órdenes Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Mensajeros</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900 mb-2">Últimas Órdenes</p>
                {[
                  { id: 'ORD-001', status: 'Entregada', color: 'bg-green-100 text-green-800', tienda: 'Tienda de Ropa' },
                  { id: 'ORD-002', status: 'En Camino', color: 'bg-blue-100 text-blue-800', tienda: 'Electrónica Express' },
                  { id: 'ORD-003', status: 'Asignada', color: 'bg-orange-100 text-orange-800', tienda: 'Calzados VIP' }
                ].map((orden, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 flex items-center justify-between p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-500" />
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
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Precios simples y transparentes</h2>
          <p className="text-gray-400 mb-12 text-lg">Paga solo por lo que usas. Sin mensualidades ocultas.</p>
          
          <div className="bg-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700 max-w-lg mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg">MÁS POPULAR</div>
            <h3 className="text-2xl font-bold mb-2">Pago por Envío</h3>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl font-extrabold">$10</span>
              <span className="text-gray-400">DOP / orden</span>
            </div>
            <p className="text-gray-400 mb-8">Recarga tu saldo y consume créditos únicamente cuando asignas un mensajero a una orden.</p>
            
            <ul className="space-y-4 text-left mb-8">
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-blue-400 mr-3" /> Tiendas ilimitadas</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-blue-400 mr-3" /> Mensajeros ilimitados</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-blue-400 mr-3" /> Soporte técnico</li>
            </ul>
            
            <Link to="/admin/tenant-123" className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
              Crear Cuenta Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Resuelve tus dudas sobre cómo EnviApp puede transformar tu logística.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: "¿Cómo funciona el cobro por créditos?", a: "Compras un paquete de créditos por adelantado. Cada vez que asignas un mensajero a una orden, se descuenta 1 crédito. Crear órdenes es gratis." },
              { q: "¿Puedo tener múltiples tiendas afiliadas?", a: "Sí, si eres una empresa de mensajería, puedes afiliar tiendas ilimitadas. Cada una tendrá su propio portal para crear órdenes." },
              { q: "¿Los mensajeros necesitan descargar una app?", a: "No, utilizan una aplicación web progresiva (PWA) a la que acceden desde el navegador de su celular. Es rápida y no ocupa espacio." },
              { q: "¿Cómo funcionan las liquidaciones?", a: "El sistema calcula automáticamente cuánto le debes a cada tienda (por los cobros contra entrega) y cuánto le debes a cada mensajero (por sus tarifas de envío)." },
              { q: "¿Puedo usarlo si soy una tienda independiente?", a: "¡Claro! Tenemos un modelo específico para tiendas que manejan su propia flota de repartidores, sin necesidad de afiliar otras tiendas." },
              { q: "¿Qué pasa si me quedo sin créditos?", a: "Las tiendas podrán seguir creando órdenes, pero no podrás asignarles mensajeros hasta que recargues tu saldo." },
              { q: "¿Puedo personalizar las tarifas de envío?", a: "Sí, puedes configurar tarifas de envío base y también tarifas específicas por cada tienda cliente." },
              { q: "¿El sistema rastrea la ubicación en tiempo real?", a: "Sí, cuando el mensajero actualiza el estado de una orden (ej. 'Entregada'), el sistema registra la ubicación GPS exacta." },
              { q: "¿Puedo ver el historial de órdenes?", a: "Sí, tienes acceso a un historial completo de todas las órdenes, con filtros por fecha, tienda, mensajero y estado." },
              { q: "¿Ofrecen soporte técnico?", a: "Sí, todos nuestros planes incluyen soporte técnico para ayudarte a configurar tu cuenta y resolver cualquier inconveniente." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="https://i.imgur.com/fGhOmmV.png" alt="EnviApp" className="h-12" />
          </div>
          <p className="text-gray-500 text-sm text-center md:text-left">
            © 2026 EnviApp. Todos los derechos reservados. <span className="hidden md:inline">|</span><br className="md:hidden" /> Diseñado y desarrollado por <a href="https://impulsapymes.net" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">ImpulsaPymes.net</a>
          </p>
          <div className="flex gap-4">
            <Link to="/t/tienda-ropa-rd" className="text-sm text-gray-500 hover:text-gray-900">Demo Tienda</Link>
            <Link to="/m" className="text-sm text-gray-500 hover:text-gray-900">Demo Mensajero</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
