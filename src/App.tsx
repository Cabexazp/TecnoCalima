import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, ChevronDown, Menu, Minus, Package, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2, UserRound, X } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './supabase'
import { initialOrders, initialProducts } from './data'
import type { CartItem, Order, Product } from './types'
import './App.css'

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  category: 'Accesorios',
  price: 0,
  stock: 0,
  image: '',
  description: '',
  featured: false,
}

function App() {
  const [view, setView] = useState<'shop' | 'admin'>('shop')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<(Omit<Product, 'id'> & { id?: number })>(emptyProduct)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string }>>([])

  const showNotification = (title: string, message: string) => {
    const id = Date.now()
    setNotifications((current) => [{ id, title, message }, ...current].slice(0, 4))
    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id))
    }, 6000)

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message })
    }
  }

  const enableBrowserNotifications = async () => {
    if (!('Notification' in window)) return
    await Notification.requestPermission()
  }

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('products').select('*').order('id'),
      supabase.from('orders').select('*').order('id', { ascending: false }),
    ]).then(([productsResult, ordersResult]) => {
      if (!productsResult.error && productsResult.data?.length) setProducts(productsResult.data as Product[])
      if (!ordersResult.error && ordersResult.data) setOrders(ordersResult.data as Order[])
    })

    const channel = supabase
      .channel('store-live-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
        const product = payload.new as Product
        setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)])
        showNotification('Nuevo producto', `${product.name} ya esta disponible`)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        const product = payload.new as Product
        setProducts((current) => current.map((item) => item.id === product.id ? product : item))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload) => {
        const oldProduct = payload.old as { id: number }
        setProducts((current) => current.filter((item) => item.id !== oldProduct.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const order = payload.new as Order
        setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)])
        showNotification('Nuevo pedido', `Pedido #${order.id} de ${order.customer_name} por ${money(order.total)}`)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const order = payload.new as Order
        setOrders((current) => current.map((item) => item.id === order.id ? order : item))
      })
      .subscribe()

    return () => {
      void supabase?.removeChannel(channel)
    }
  }, [])

  const categories = ['Todos', ...Array.from(new Set(products.map((product) => product.category)))]
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Todos' || product.category === category
    const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }), [products, category, search])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const changeQuantity = (id: number, amount: number) => {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item))
  }

  const openNewProduct = () => {
    setEditingProduct(emptyProduct)
    setProductModal(true)
  }

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault()
    if (editingProduct.id) {
      const updated = { ...editingProduct, id: editingProduct.id } as Product
      setProducts((current) => current.map((product) => product.id === updated.id ? updated : product))
      if (supabase) await supabase.from('products').update(updated).eq('id', updated.id)
    } else {
      const nextId = products.length ? Math.max(...products.map((product) => product.id)) + 1 : 1
      const created = { ...editingProduct, id: nextId } as Product
      setProducts((current) => [created, ...current])
      if (supabase) await supabase.from('products').insert(created)
    }
    setProductModal(false)
  }

  const deleteProduct = async (id: number) => {
    setProducts((current) => current.filter((product) => product.id !== id))
    if (supabase) await supabase.from('products').delete().eq('id', id)
  }

  const updateOrderStatus = async (id: number, status: Order['status']) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order))
    if (supabase) await supabase.from('orders').update({ status }).eq('id', id)
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const order: Order = {
      id: orders.length ? Math.max(...orders.map((item) => item.id)) + 1 : 1001,
      customer_name: String(form.get('name')),
      customer_email: String(form.get('email')),
      customer_phone: String(form.get('phone')),
      address: String(form.get('address')),
      total: subtotal,
      status: 'pending',
      items: cart,
      created_at: new Date().toISOString(),
    }
    setOrders((current) => [order, ...current])
    setCart([])
    setCheckoutOpen(false)
    setCartOpen(false)
    if (supabase) await supabase.from('orders').insert(order)
  }

  return (
    <div className="app">
      <header className="header">
        <button className="brand" onClick={() => setView('shop')} aria-label="Ir al inicio">
          <span className="brand-mark"><span></span></span>
          <span>NEX<span>ORA</span></span>
        </button>
        <nav className={mobileMenu ? 'nav open' : 'nav'}>
          <button onClick={() => setView('shop')}>Tienda</button>
          <button onClick={() => { setCategory('Laptops'); setView('shop') }}>Laptops</button>
          <button onClick={() => { setCategory('Telefonos'); setView('shop') }}>Telefonos</button>
          <button onClick={() => setView('admin')}>Administracion</button>
        </nav>
        <div className="header-actions">
          <button className="notification-button" onClick={enableBrowserNotifications} aria-label="Activar notificaciones">
            <span className="notification-dot"></span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button className="icon-button search-button" aria-label="Buscar" onClick={() => document.querySelector<HTMLInputElement>('.search-input')?.focus()}><Search size={20} /></button>
          <button className="icon-button" aria-label="Perfil" onClick={() => setView('admin')}><UserRound size={20} /></button>
          <button className="cart-button" aria-label="Abrir carrito" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} /><span>{cartCount}</span>
          </button>
          <button className="icon-button menu-button" aria-label="Menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={22} /></button>
        </div>
      </header>

      {view === 'shop' ? (
        <main>
          <section className="hero-section">
            <div className="hero-copy">
              <span className="eyebrow">Nueva generacion</span>
              <h1>Tecnologia que impulsa tu vida</h1>
              <p>Descubre dispositivos seleccionados para trabajar, crear y disfrutar sin limites.</p>
              <button className="primary-button" onClick={() => document.querySelector('.catalog')?.scrollIntoView({ behavior: 'smooth' })}>
                Comprar ahora <ArrowRight size={18} />
              </button>
            </div>
            <div className="hero-image">
              <div className="hero-glow"></div>
              <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1100&q=90" alt="Laptop tecnologica" />
              <div className="floating-card">
                <span>MacBook Air</span><strong>Desde {money(1299)}</strong>
              </div>
            </div>
          </section>

          <section className="catalog">
            <div className="catalog-heading">
              <div>
                <span className="eyebrow">Explora</span>
                <h2>Productos destacados</h2>
              </div>
              <div className="catalog-tools">
                <label className="search-box">
                  <Search size={18} />
                  <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos" />
                </label>
                <button className="filter-button"><SlidersHorizontal size={18} /> Filtrar</button>
              </div>
            </div>

            <div className="category-row">
              {categories.map((item) => (
                <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>

            <div className="product-grid">
              {visibleProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    {product.featured && <span className="badge">Destacado</span>}
                    <img src={product.image} alt={product.name} />
                    <button className="quick-add" onClick={() => addToCart(product)} aria-label={`Agregar ${product.name} al carrito`}>
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="product-info">
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-bottom">
                      <strong>{money(product.price)}</strong>
                      <button onClick={() => addToCart(product)}>Agregar <Plus size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="admin">
          <aside className="admin-sidebar">
            <div className="admin-brand"><Package size={20} /> Panel</div>
            <button className="active"><Package size={18} /> Productos</button>
            <button onClick={() => document.querySelector('.orders-section')?.scrollIntoView({ behavior: 'smooth' })}><ShoppingBag size={18} /> Pedidos</button>
          </aside>
          <section className="admin-content">
            <div className="admin-heading">
              <div><span className="eyebrow">Panel de control</span><h1>Productos</h1></div>
              <button className="primary-button" onClick={openNewProduct}><Plus size={18} /> Nuevo producto</button>
            </div>
            <div className="stat-grid">
              <div><span>Productos</span><strong>{products.length}</strong><small>En catalogo</small></div>
              <div><span>Pedidos</span><strong>{orders.length}</strong><small>{orders.filter((order) => order.status === 'pending').length} pendientes</small></div>
              <div><span>Ventas</span><strong>{money(orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0))}</strong><small>Valor total</small></div>
              <div><span>Inventario</span><strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong><small>Unidades</small></div>
            </div>

            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>Producto</th><th>Categoria</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td><div className="table-product"><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>{product.description}</small></div></div></td>
                      <td>{product.category}</td><td>{money(product.price)}</td>
                      <td><span className={product.stock < 6 ? 'stock low' : 'stock'}>{product.stock} unidades</span></td>
                      <td><div className="row-actions">
                        <button onClick={() => { setEditingProduct(product); setProductModal(true) }}>Editar</button>
                        <button className="delete" onClick={() => deleteProduct(product.id)} aria-label={`Eliminar ${product.name}`}><Trash2 size={16} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="orders-section">
              <div className="section-title"><h2>Pedidos recientes</h2><button onClick={() => setOrders(initialOrders)}>Ver todos</button></div>
              <div className="admin-table-wrap">
                <table>
                  <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>#{order.id}</strong></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                        <td>{money(order.total)}</td>
                        <td><label className={`status ${order.status}`}><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as Order['status'])}>
                          <option value="pending">Pendiente</option><option value="processing">Procesando</option><option value="completed">Completado</option><option value="cancelled">Cancelado</option>
                        </select><ChevronDown size={14} /></label></td>
                        <td>{new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </main>
      )}

      {cartOpen && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
          <aside className="cart-drawer">
            <div className="drawer-header"><div><span>Tu carrito</span><h2>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</h2></div><button onClick={() => setCartOpen(false)}><X size={22} /></button></div>
            <div className="cart-items">
              {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={42} /><h3>Tu carrito esta vacio</h3><p>Explora nuestros productos y encuentra tu favorito.</p></div> : cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info"><span>{item.category}</span><strong>{item.name}</strong><small>{money(item.price)}</small></div>
                  <div className="quantity"><button onClick={() => changeQuantity(item.id, -1)}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}><Plus size={14} /></button></div>
                </div>
              ))}
            </div>
            {cart.length > 0 && <div className="cart-footer">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <button className="checkout-button" onClick={() => setCheckoutOpen(true)}>Continuar al pago <ArrowRight size={18} /></button>
            </div>}
          </aside>
        </div>
      )}

      {productModal && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setProductModal(false) }}>
          <form className="modal" onSubmit={saveProduct}>
            <div className="drawer-header"><div><span>Catalogo</span><h2>{editingProduct.id ? 'Editar producto' : 'Nuevo producto'}</h2></div><button type="button" onClick={() => setProductModal(false)}><X size={22} /></button></div>
            <div className="form-grid">
              <label className="full">Nombre<input required value={editingProduct.name} onChange={(event) => setEditingProduct({ ...editingProduct, name: event.target.value })} /></label>
              <label>Categoria<select value={editingProduct.category} onChange={(event) => setEditingProduct({ ...editingProduct, category: event.target.value })}><option>Accesorios</option><option>Laptops</option><option>Telefonos</option><option>Audio</option><option>Wearables</option><option>Monitores</option><option>Gaming</option><option>Drones</option></select></label>
              <label>Precio<input required type="number" min="0" value={editingProduct.price} onChange={(event) => setEditingProduct({ ...editingProduct, price: Number(event.target.value) })} /></label>
              <label>Stock<input required type="number" min="0" value={editingProduct.stock} onChange={(event) => setEditingProduct({ ...editingProduct, stock: Number(event.target.value) })} /></label>
              <label>URL de imagen<input required type="url" value={editingProduct.image} onChange={(event) => setEditingProduct({ ...editingProduct, image: event.target.value })} /></label>
              <label className="full">Descripcion<textarea required value={editingProduct.description} onChange={(event) => setEditingProduct({ ...editingProduct, description: event.target.value })} /></label>
              <label className="checkbox full"><input type="checkbox" checked={editingProduct.featured} onChange={(event) => setEditingProduct({ ...editingProduct, featured: event.target.checked })} /> Marcar como destacado</label>
            </div>
            <div className="modal-actions"><button type="button" onClick={() => setProductModal(false)}>Cancelar</button><button className="primary-button" type="submit">Guardar producto</button></div>
          </form>
        </div>
      )}

      {checkoutOpen && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false) }}>
          <form className="modal checkout" onSubmit={submitOrder}>
            <div className="drawer-header"><div><span>Finalizar compra</span><h2>Datos de entrega</h2></div><button type="button" onClick={() => setCheckoutOpen(false)}><X size={22} /></button></div>
            <div className="form-grid">
              <label className="full">Nombre completo<input name="name" required /></label>
              <label>Email<input name="email" type="email" required /></label>
              <label>Telefono<input name="phone" required /></label>
              <label className="full">Direccion<input name="address" required /></label>
            </div>
            <div className="checkout-total"><span>Total a pagar</span><strong>{money(subtotal)}</strong></div>
            <button className="checkout-button" type="submit">Crear pedido <ArrowRight size={18} /></button>
          </form>
        </div>
      )}

      <div className="notification-stack" aria-live="polite">
        {notifications.map((notification) => (
          <button
            className="live-notification"
            key={notification.id}
            onClick={() => {
              setNotifications((current) => current.filter((item) => item.id !== notification.id))
              setView('admin')
            }}
          >
            <span className="live-notification-icon">
              <Package size={18} />
            </span>
            <span>
              <strong>{notification.title}</strong>
              <small>{notification.message}</small>
            </span>
            <X size={16} />
          </button>
        ))}
      </div>

      {!isSupabaseConfigured && <div className="demo-ribbon">Modo demostracion · Conecta Supabase con las variables de entorno</div>}
    </div>
  )
}

export default App
