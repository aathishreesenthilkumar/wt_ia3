import { useState } from 'react'
import api, { errorText } from '../api'
import { validateRestaurant } from '../validation'

const emptyForm = { restaurantId: '', name: '', location: '', contactNumber: '' }

// Add a new restaurant, or edit the one passed in as `editing`.
function RestaurantForm({ editing, onSaved, onCancel, notify }) {
  const [form, setForm] = useState(editing || emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validateRestaurant(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    const request = editing
      ? api.put(`/restaurants/${editing.restaurantId}`, form)
      : api.post('/restaurants', form)

    request
      .then((res) => {
        notify('success', res.data.message)
        setForm(emptyForm)
        onSaved()
      })
      .catch((err) => notify('danger', errorText(err)))
      .finally(() => setSaving(false))
  }

  const field = (name, label, props = {}) => (
    <div className="col-md-6 mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input id={name} name={name} className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        value={form[name]} onChange={handleChange} {...props} />
      <div className="invalid-feedback">{errors[name]}</div>
    </div>
  )

  return (
    <div className="card p-4 mb-4">
      <h2 className="h5 mb-3">
        <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-shop'} me-2`}></i>
        {editing ? `Update Restaurant ${editing.restaurantId}` : 'Add New Restaurant'}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          {field('restaurantId', 'Restaurant ID', { placeholder: 'e.g. R101', disabled: !!editing })}
          {field('name', 'Restaurant Name', { placeholder: 'e.g. Spice Garden' })}
          {field('location', 'Location', { placeholder: 'e.g. RS Puram, Coimbatore' })}
          {field('contactNumber', 'Contact Number', { placeholder: '10-digit mobile number', maxLength: 10 })}
        </div>
        <button type="submit" className="btn btn-brand me-2" disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Update Restaurant' : 'Add Restaurant'}
        </button>
        <button type="button" className="btn btn-outline-secondary"
          onClick={() => { setForm(emptyForm); setErrors({}); onCancel() }}>
          {editing ? 'Cancel Edit' : 'Clear Form'}
        </button>
      </form>
    </div>
  )
}

export default RestaurantForm
