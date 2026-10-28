import axios from 'axios'

// All requests go to the Express backend.
const api = axios.create({ baseURL: 'http://localhost:5000/api' })

export const ORDER_STATUSES = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered']
export const CANCELLABLE_STATUSES = ['Placed', 'Preparing']

export function errorText(err) {
  return err.response?.data?.message || 'Unable to connect to the server. Check that the backend is running.'
}

export default api
