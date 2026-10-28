import { useCallback, useEffect, useState } from 'react'
import api, { errorText } from './api'
import RestaurantForm from './components/RestaurantForm'
import RestaurantList from './components/RestaurantList'
import OrderForm from './components/OrderForm'
import OrderList from './components/OrderList'

const tabs = [
  { key: 'restaurants', label: 'Restaurants', icon: 'bi-shop' },
  { key: 'place-order', label: 'Place Order', icon: 'bi-cart-plus' },
  { key: 'orders', label: 'Track Orders', icon: 'bi-truck' }
]

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return tabs.some((t) => t.key === hash) ? hash : 'restaurants'
  })
  const [restaurants, setRestaurants] = useState([])
  const [allRestaurants, setAllRestaurants] = useState([])
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [menu, setMenu] = useState([])
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const [restaurantSearch, setRestaurantSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState({})

  const notify = useCallback((type, text) => {
    setToast({ type, text, id: Date.now() })
  }, [])

  // Hide the message after 4 seconds.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const loadRestaurants = useCallback((search = restaurantSearch) => {
    api.get('/restaurants', { params: { search } })
      .then((res) => setRestaurants(res.data))
      .catch((err) => notify('danger', errorText(err)))
    api.get('/restaurants')
      .then((res) => setAllRestaurants(res.data))
      .catch(() => {})
  }, [restaurantSearch, notify])

  const loadOrders = useCallback((filter = orderFilter) => {
    api.get('/orders', { params: filter })
      .then((res) => setOrders(res.data))
      .catch((err) => notify('danger', errorText(err)))
    api.get('/orders')
      .then((res) => setAllOrders(res.data))
      .catch(() => {})
  }, [orderFilter, notify])

  // Load data once when the page opens.
  useEffect(() => {
    loadRestaurants('')
    loadOrders({})
    api.get('/menu').then((res) => setMenu(res.data)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openTab = (key) => {
    setActiveTab(key)
    window.history.replaceState(null, '', `#${key}`)
  }

  const searchRestaurants = (search) => {
    setRestaurantSearch(search)
    loadRestaurants(search)
  }

  const deleteRestaurant = (r) => {
    if (!window.confirm(`Delete restaurant ${r.restaurantId} - ${r.name}?`)) return
    api.delete(`/restaurants/${r.restaurantId}`)
      .then((res) => {
        notify('success', res.data.message)
        if (editing?.restaurantId === r.restaurantId) setEditing(null)
        loadRestaurants()
      })
      .catch((err) => notify('danger', errorText(err)))
  }

  const filterOrders = (filter) => {
    setOrderFilter(filter)
    loadOrders(filter)
  }

  const updateStatus = (order, status) => {
    api.put(`/orders/${order.orderId}/status`, { status })
      .then((res) => { notify('success', res.data.message); loadOrders() })
      .catch((err) => notify('danger', errorText(err)))
  }

  const cancelOrder = (order) => {
    if (!window.confirm(`Cancel order ${order.orderId}?`)) return
    api.put(`/orders/${order.orderId}/cancel`)
      .then((res) => { notify('success', res.data.message); loadOrders() })
      .catch((err) => notify('danger', errorText(err)))
  }

  const activeCount = allOrders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length
  const revenue = allOrders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalBill, 0)
  const stats = [
    { label: 'Restaurants', value: allRestaurants.length, icon: 'bi-shop', color: 'text-primary' },
    { label: 'Total Orders', value: allOrders.length, icon: 'bi-bag', color: 'text-success' },
    { label: 'Active Orders', value: activeCount, icon: 'bi-hourglass-split', color: 'text-warning' },
    { label: 'Revenue', value: `Rs. ${revenue}`, icon: 'bi-currency-rupee', color: 'text-danger' }
  ]

  return (
    <>
      <nav className="navbar navbar-dark brand-bar shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">
            <i className="bi bi-basket2-fill me-2"></i>FoodExpress
          </span>
          <span className="navbar-text text-white small">Online Food Delivery Management System</span>
        </div>
      </nav>

      {toast && (
        <div className="toast-area">
          <div className={`alert alert-${toast.type} alert-dismissible shadow mb-0`} role="alert">
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
            {toast.text}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setToast(null)}></button>
          </div>
        </div>
      )}

      <div className="container py-4">
        <div className="row g-3 mb-4">
          {stats.map((s) => (
            <div className="col-6 col-lg-3" key={s.label}>
              <div className="card stat-card p-3 h-100">
                <div className="d-flex align-items-center">
                  <i className={`bi ${s.icon} fs-2 me-3 ${s.color}`}></i>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="text-muted small">{s.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ul className="nav nav-pills mb-4 gap-2">
          {tabs.map((t) => (
            <li className="nav-item" key={t.key}>
              <button className={`nav-link ${activeTab === t.key ? 'active' : ''}`} onClick={() => openTab(t.key)}>
                <i className={`bi ${t.icon} me-1`}></i>{t.label}
              </button>
            </li>
          ))}
        </ul>

        {activeTab === 'restaurants' && (
          <>
            <RestaurantForm key={editing?.restaurantId || 'new'} editing={editing} notify={notify}
              onSaved={() => { setEditing(null); loadRestaurants() }}
              onCancel={() => setEditing(null)} />
            <RestaurantList restaurants={restaurants} onSearch={searchRestaurants}
              onEdit={(r) => { setEditing(r); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              onDelete={deleteRestaurant} />
          </>
        )}

        {activeTab === 'place-order' && (
          <OrderForm restaurants={allRestaurants} menu={menu} notify={notify}
            onPlaced={() => loadOrders()} />
        )}

        {activeTab === 'orders' && (
          <OrderList orders={orders} onFilter={filterOrders}
            onUpdateStatus={updateStatus} onCancel={cancelOrder} />
        )}
      </div>

      <footer className="text-center text-muted small py-3">
        Online Food Delivery Management System · React, Bootstrap, Node.js, Express and MongoDB
      </footer>
    </>
  )
}

export default App
