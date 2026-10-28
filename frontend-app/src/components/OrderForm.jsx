import { useState } from 'react'
import api, { errorText } from '../api'
import { validateOrder } from '../validation'

const emptyCustomer = { customerName: '', customerPhone: '', deliveryAddress: '', restaurantId: '' }

// Record customer details, chosen food items and quantities, and show the total bill.
function OrderForm({ restaurants, menu, onPlaced, notify }) {
  const [customer, setCustomer] = useState(emptyCustomer)
  const [quantities, setQuantities] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const selectedItems = menu
    .filter((m) => quantities[m.itemName] > 0)
    .map((m) => ({ ...m, quantity: quantities[m.itemName] }))
  const totalBill = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const changeQuantity = (itemName, change) => {
    const next = Math.min(20, Math.max(0, (quantities[itemName] || 0) + change))
    setQuantities({ ...quantities, [itemName]: next })
    setErrors({ ...errors, items: undefined })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validateOrder(customer, selectedItems)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    const order = {
      ...customer,
      items: selectedItems.map((i) => ({ itemName: i.itemName, quantity: i.quantity }))
    }
    api.post('/orders', order)
      .then((res) => {
        notify('success', res.data.message)
        setCustomer(emptyCustomer)
        setQuantities({})
        onPlaced()
      })
      .catch((err) => notify('danger', errorText(err)))
      .finally(() => setSaving(false))
  }

  const invalid = (name) => (errors[name] ? 'is-invalid' : '')

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card p-4 h-100">
            <h2 className="h5 mb-3"><i className="bi bi-person-lines-fill me-2"></i>Customer Details</h2>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="customerName" className="form-label">Customer Name</label>
                <input id="customerName" name="customerName" className={`form-control ${invalid('customerName')}`}
                  value={customer.customerName} onChange={handleChange} placeholder="e.g. Priya Kumar" />
                <div className="invalid-feedback">{errors.customerName}</div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="customerPhone" className="form-label">Phone Number</label>
                <input id="customerPhone" name="customerPhone" maxLength={10}
                  className={`form-control ${invalid('customerPhone')}`}
                  value={customer.customerPhone} onChange={handleChange} placeholder="10-digit mobile number" />
                <div className="invalid-feedback">{errors.customerPhone}</div>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="deliveryAddress" className="form-label">Delivery Address</label>
              <textarea id="deliveryAddress" name="deliveryAddress" rows="2"
                className={`form-control ${invalid('deliveryAddress')}`}
                value={customer.deliveryAddress} onChange={handleChange}
                placeholder="House no, street, area, city" />
              <div className="invalid-feedback">{errors.deliveryAddress}</div>
            </div>
            <div className="mb-3">
              <label htmlFor="restaurantId" className="form-label">Restaurant</label>
              <select id="restaurantId" name="restaurantId" className={`form-select ${invalid('restaurantId')}`}
                value={customer.restaurantId} onChange={handleChange}>
                <option value="">Select a restaurant</option>
                {restaurants.map((r) => (
                  <option key={r._id} value={r.restaurantId}>{r.name} ({r.location})</option>
                ))}
              </select>
              <div className="invalid-feedback">{errors.restaurantId}</div>
            </div>

            <h3 className="h6 mt-2">Food Items</h3>
            {errors.items && <div className="alert alert-danger py-2">{errors.items}</div>}
            <div className="row g-2">
              {menu.map((m) => (
                <div className="col-md-6" key={m.itemName}>
                  <div className={`border rounded p-2 d-flex align-items-center ${quantities[m.itemName] ? 'border-warning bg-warning-subtle' : 'bg-white'}`}>
                    <div className="flex-grow-1">
                      <div className="fw-semibold small">{m.itemName}</div>
                      <div className="text-muted small">{m.category} · Rs. {m.price}</div>
                    </div>
                    <div className="btn-group btn-group-sm" role="group" aria-label={`Quantity of ${m.itemName}`}>
                      <button type="button" className="btn btn-outline-secondary"
                        onClick={() => changeQuantity(m.itemName, -1)}>-</button>
                      <span className="btn btn-light disabled px-2">{quantities[m.itemName] || 0}</span>
                      <button type="button" className="btn btn-outline-secondary"
                        onClick={() => changeQuantity(m.itemName, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card p-4">
            <h2 className="h5 mb-3"><i className="bi bi-receipt me-2"></i>Order Summary</h2>
            {selectedItems.length === 0 ? (
              <p className="text-muted">No items selected yet.</p>
            ) : (
              <table className="table table-sm">
                <thead>
                  <tr><th>Item</th><th className="text-center">Qty</th><th className="text-end">Amount</th></tr>
                </thead>
                <tbody>
                  {selectedItems.map((i) => (
                    <tr key={i.itemName}>
                      <td>{i.itemName}<div className="text-muted small">Rs. {i.price} each</div></td>
                      <td className="text-center">{i.quantity}</td>
                      <td className="text-end">Rs. {i.price * i.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="d-flex justify-content-between fs-5 fw-bold border-top pt-2 mb-3">
              <span>Total Bill</span><span>Rs. {totalBill}</span>
            </div>
            <button type="submit" className="btn btn-brand w-100" disabled={saving}>
              <i className="bi bi-bag-check me-2"></i>{saving ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default OrderForm
