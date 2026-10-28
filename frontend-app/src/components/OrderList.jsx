import { useState } from 'react'
import { ORDER_STATUSES, CANCELLABLE_STATUSES } from '../api'

const badgeColors = {
  'Placed': 'text-bg-primary',
  'Preparing': 'text-bg-warning',
  'Out for Delivery': 'text-bg-info',
  'Delivered': 'text-bg-success',
  'Cancelled': 'text-bg-danger'
}

// One table row with a status dropdown and a Cancel button.
function OrderRow({ order, onUpdateStatus, onCancel }) {
  const nextStatuses = ORDER_STATUSES.slice(ORDER_STATUSES.indexOf(order.status) + 1)
  const [newStatus, setNewStatus] = useState(nextStatuses[0] || '')
  const finished = order.status === 'Delivered' || order.status === 'Cancelled'

  return (
    <tr>
      <td className="fw-semibold">{order.orderId}</td>
      <td>
        {order.customerName}
        <div className="text-muted small">{order.customerPhone}</div>
      </td>
      <td>{order.restaurantName}</td>
      <td className="small">
        {order.items.map((i) => <div key={i.itemName}>{i.itemName} x {i.quantity}</div>)}
      </td>
      <td className="fw-semibold text-nowrap">Rs. {order.totalBill}</td>
      <td><span className={`badge ${badgeColors[order.status]}`}>{order.status}</span></td>
      <td style={{ minWidth: 230 }}>
        {finished ? (
          <span className="text-muted small">No further action</span>
        ) : (
          <div className="d-flex gap-1">
            <select className="form-select form-select-sm" value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)} aria-label="New status">
              {nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-sm btn-outline-primary text-nowrap"
              onClick={() => onUpdateStatus(order, newStatus)}>Update</button>
            {CANCELLABLE_STATUSES.includes(order.status) && (
              <button className="btn btn-sm btn-outline-danger" onClick={() => onCancel(order)}>Cancel</button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

// Filter bar and table of all orders.
function OrderList({ orders, onFilter, onUpdateStatus, onCancel }) {
  const [status, setStatus] = useState('')
  const [orderId, setOrderId] = useState('')

  const applyFilter = (e) => {
    e.preventDefault()
    onFilter({ status, orderId })
  }

  return (
    <div className="card p-4">
      <h2 className="h5 mb-3"><i className="bi bi-truck me-2"></i>Track and Manage Orders</h2>
      <form className="row g-2 mb-3" onSubmit={applyFilter}>
        <div className="col-md-4">
          <input className="form-control" placeholder="Order ID (e.g. ORD1001)"
            value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status">
            <option value="">All statuses</option>
            {[...ORDER_STATUSES, 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-4 d-flex gap-2">
          <button type="submit" className="btn btn-brand flex-fill"><i className="bi bi-funnel me-1"></i>Filter</button>
          <button type="button" className="btn btn-outline-secondary flex-fill"
            onClick={() => { setStatus(''); setOrderId(''); onFilter({}) }}>Show All</button>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Order ID</th><th>Customer</th><th>Restaurant</th><th>Items</th>
              <th>Total</th><th>Status</th><th>Update / Cancel</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="7" className="text-center text-muted">No orders found.</td></tr>
            ) : orders.map((o) => (
              <OrderRow key={`${o._id}-${o.status}`} order={o}
                onUpdateStatus={onUpdateStatus} onCancel={onCancel} />
            ))}
          </tbody>
        </table>
      </div>
      <small className="text-muted">
        Orders can be cancelled only while they are Placed or Preparing.
      </small>
    </div>
  )
}

export default OrderList
