import { useState } from 'react'

// Search box and table of restaurants with Edit / Delete buttons.
function RestaurantList({ restaurants, onSearch, onEdit, onDelete }) {
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(search)
  }

  return (
    <div className="card p-4">
      <h2 className="h5 mb-3"><i className="bi bi-list-ul me-2"></i>All Restaurants</h2>
      <form className="row g-2 mb-3" onSubmit={handleSearch}>
        <div className="col-md-8">
          <input className="form-control" placeholder="Search by restaurant name or location"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="col-md-4 d-flex gap-2">
          <button type="submit" className="btn btn-brand flex-fill">
            <i className="bi bi-search me-1"></i>Search
          </button>
          <button type="button" className="btn btn-outline-secondary flex-fill"
            onClick={() => { setSearch(''); onSearch('') }}>Show All</button>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Restaurant ID</th><th>Name</th><th>Location</th>
              <th>Contact Number</th><th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr><td colSpan="5" className="text-center text-muted">No restaurants found.</td></tr>
            ) : restaurants.map((r) => (
              <tr key={r._id}>
                <td><span className="badge text-bg-secondary">{r.restaurantId}</span></td>
                <td>{r.name}</td>
                <td>{r.location}</td>
                <td>{r.contactNumber}</td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEdit(r)}>
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(r)}>
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small className="text-muted">{restaurants.length} restaurant(s) shown</small>
    </div>
  )
}

export default RestaurantList
