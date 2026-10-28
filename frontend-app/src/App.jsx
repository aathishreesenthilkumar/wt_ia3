import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000/api'
const statuses = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']

function App() {
  // Restaurant form
  const [restaurantId, setRestaurantId] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [editId, setEditId] = useState('')
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')

  // Order form
  const [menu, setMenu] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [quantities, setQuantities] = useState({})
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')

  const showError = (err) => {
    window.alert(err.response?.data?.message || 'Unable to connect to the server.')
  }

  const loadRestaurants = () => {
    axios.get(`${API}/restaurants`, { params: { search } })
      .then((res) => setRestaurants(res.data))
      .catch(showError)
  }

  const loadOrders = () => {
    return axios.get(`${API}/orders`, { params: { status: statusFilter } })
      .then((res) => setOrders(res.data))
      .catch(showError)
  }

  // Load everything when the page opens.
  useEffect(() => {
    axios.get(`${API}/restaurants`).then((res) => setRestaurants(res.data))
      .catch(() => window.alert('Unable to load data. Check that the backend is running.'))
    axios.get(`${API}/orders`).then((res) => setOrders(res.data)).catch(() => {})
    axios.get(`${API}/menu`).then((res) => setMenu(res.data)).catch(() => {})
  }, [])

  /* ---------- Restaurants ---------- */

  const resetRestaurantForm = () => {
    setRestaurantId('')
    setName('')
    setLocation('')
    setContactNumber('')
    setEditId('')
  }

  const saveRestaurant = (event) => {
    event.preventDefault()
    const restaurant = { restaurantId, name, location, contactNumber }
    const request = editId
      ? axios.put(`${API}/restaurants/${editId}`, restaurant)
      : axios.post(`${API}/restaurants`, restaurant)
    request
      .then((res) => {
        window.alert(res.data.message)
        resetRestaurantForm()
        loadRestaurants()
      })
      .catch(showError)
  }

  const editRestaurant = (r) => {
    setEditId(r.restaurantId)
    setRestaurantId(r.restaurantId)
    setName(r.name)
    setLocation(r.location)
    setContactNumber(r.contactNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteRestaurant = (id) => {
    if (!window.confirm(`Delete restaurant ${id}?`)) return
    axios.delete(`${API}/restaurants/${id}`)
      .then((res) => {
        window.alert(res.data.message)
        loadRestaurants()
      })
      .catch(showError)
  }

  /* ---------- Orders ---------- */

  const selectedItems = menu
    .filter((m) => quantities[m.itemName] > 0)
    .map((m) => ({ itemName: m.itemName, quantity: Number(quantities[m.itemName]) }))

  const totalBill = menu.reduce((sum, m) => sum + m.price * (Number(quantities[m.itemName]) || 0), 0)

  const placeOrder = (event) => {
    event.preventDefault()
    if (selectedItems.length === 0) {
      window.alert('Select at least one food item')
      return
    }
    const order = { customerName, customerPhone, deliveryAddress, restaurantName, items: selectedItems }
    axios.post(`${API}/orders`, order)
      .then((res) => {
        window.alert(res.data.message)
        setCustomerName('')
        setCustomerPhone('')
        setDeliveryAddress('')
        setRestaurantName('')
        setQuantities({})
        loadOrders()
      })
      .catch(showError)
  }

  // Refresh the table first, then show the message, so the row already shows the new status.
  const nextStatus = (orderId) => {
    axios.put(`${API}/orders/${orderId}/status`)
      .then((res) => loadOrders().then(() => window.alert(res.data.message)))
      .catch(showError)
  }

  const cancelOrder = (orderId) => {
    if (!window.confirm(`Cancel order ${orderId}?`)) return
    axios.put(`${API}/orders/${orderId}/cancel`)
      .then((res) => loadOrders().then(() => window.alert(res.data.message)))
      .catch(showError)
  }

  return (
    <div className="container py-4">
      <h1 className="text-success mb-4">Online Food Delivery Management System</h1>

      {/* Add / Update Restaurant */}
      <div className="card bg-light p-4 mb-4">
        <h2 className="h4">{editId ? 'Update Restaurant' : 'Add New Restaurant'}</h2>
        <form onSubmit={saveRestaurant}>
          <div className="row">
            <div className="col-md-6">
              <label htmlFor="restaurantId" className="form-label">Restaurant ID</label>
              <input id="restaurantId" className="form-control mb-3" required disabled={!!editId}
                value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="name" className="form-label">Restaurant Name</label>
              <input id="name" className="form-control mb-3" required
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="location" className="form-label">Location</label>
              <input id="location" className="form-control mb-3" required
                value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="contactNumber" className="form-label">Contact Number</label>
              <input id="contactNumber" className="form-control mb-3" required
                pattern="[0-9]{10}" title="Enter a 10-digit number"
                value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-success me-2">
            {editId ? 'Update Restaurant' : 'Add Restaurant'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetRestaurantForm}>
            {editId ? 'Cancel Edit' : 'Clear Form'}
          </button>
        </form>
      </div>

      {/* View / Search Restaurants */}
      <h2 className="h4">View All Restaurants</h2>
      <div className="input-group mb-3">
        <input className="form-control" placeholder="Search by name or location"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={loadRestaurants}>Search</button>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr><th>Restaurant ID</th><th>Name</th><th>Location</th><th>Contact Number</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No restaurants to display.</td></tr>
            ) : restaurants.map((r) => (
              <tr key={r._id}>
                <td>{r.restaurantId}</td><td>{r.name}</td><td>{r.location}</td><td>{r.contactNumber}</td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => editRestaurant(r)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRestaurant(r.restaurantId)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-4" />

      {/* Place Order */}
      <div className="card bg-light p-4 mb-4">
        <h2 className="h4">Place Food Order</h2>
        <form onSubmit={placeOrder}>
          <div className="row">
            <div className="col-md-6">
              <label htmlFor="customerName" className="form-label">Customer Name</label>
              <input id="customerName" className="form-control mb-3" required
                value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="customerPhone" className="form-label">Phone Number</label>
              <input id="customerPhone" className="form-control mb-3" required
                pattern="[0-9]{10}" title="Enter a 10-digit number"
                value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="deliveryAddress" className="form-label">Delivery Address</label>
              <input id="deliveryAddress" className="form-control mb-3" required
                value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="restaurantName" className="form-label">Restaurant</label>
              <select id="restaurantName" className="form-select mb-3" required
                value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}>
                <option value="">Select restaurant</option>
                {restaurants.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <table className="table table-bordered align-middle bg-white">
            <thead className="table-light">
              <tr><th>Food Item</th><th>Price (Rs.)</th><th style={{ width: 130 }}>Quantity</th></tr>
            </thead>
            <tbody>
              {menu.map((m) => (
                <tr key={m.itemName}>
                  <td>{m.itemName}</td>
                  <td>{m.price}</td>
                  <td>
                    <input type="number" min="0" max="20" className="form-control form-control-sm"
                      value={quantities[m.itemName] || ''}
                      onChange={(e) => setQuantities({ ...quantities, [m.itemName]: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="h5 mb-3">Total Bill: Rs. {totalBill}</h3>
          <button type="submit" className="btn btn-success">Place Order</button>
        </form>
      </div>

      {/* Track Orders */}
      <h2 className="h4">Track Orders</h2>
      <div className="input-group mb-3">
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" onClick={loadOrders}>View Orders</button>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr><th>Order ID</th><th>Customer</th><th>Restaurant</th><th>Items</th><th>Total (Rs.)</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="7" className="text-center">No orders to display.</td></tr>
            ) : orders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderId}</td>
                <td>{o.customerName}<br /><small>{o.customerPhone}</small></td>
                <td>{o.restaurantName}</td>
                <td>{o.items.map((i) => `${i.itemName} x ${i.quantity}`).join(', ')}</td>
                <td>{o.totalBill}</td>
                <td>{o.status}</td>
                <td>
                  {o.status !== 'Delivered' && o.status !== 'Cancelled' && (
                    <button className="btn btn-sm btn-outline-primary me-2 mb-1" onClick={() => nextStatus(o.orderId)}>Next Status</button>
                  )}
                  {o.status === 'Placed' && (
                    <button className="btn btn-sm btn-outline-danger mb-1" onClick={() => cancelOrder(o.orderId)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
