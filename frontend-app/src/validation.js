// Client-side validation rules. The backend checks the same rules again.

const phonePattern = /^[6-9]\d{9}$/

export function validateRestaurant(r) {
  const errors = {}
  if (!/^R\d{3,5}$/i.test(r.restaurantId.trim())) {
    errors.restaurantId = 'Use the format R101 (R followed by 3 to 5 digits).'
  }
  if (r.name.trim().length < 3) {
    errors.name = 'Restaurant name must have at least 3 characters.'
  }
  if (r.location.trim().length < 3) {
    errors.location = 'Enter the restaurant location (area, city).'
  }
  if (!phonePattern.test(r.contactNumber.trim())) {
    errors.contactNumber = 'Enter a valid 10-digit mobile number starting with 6-9.'
  }
  return errors
}

export function validateOrder(o, selectedItems) {
  const errors = {}
  if (!/^[A-Za-z .]{3,50}$/.test(o.customerName.trim())) {
    errors.customerName = 'Name must contain only letters and be 3-50 characters long.'
  }
  if (!phonePattern.test(o.customerPhone.trim())) {
    errors.customerPhone = 'Enter a valid 10-digit mobile number starting with 6-9.'
  }
  if (o.deliveryAddress.trim().length < 10) {
    errors.deliveryAddress = 'Address must have at least 10 characters.'
  }
  if (!o.restaurantId) {
    errors.restaurantId = 'Select a restaurant.'
  }
  if (selectedItems.length === 0) {
    errors.items = 'Select at least one food item.'
  } else if (selectedItems.some((i) => i.quantity < 1 || i.quantity > 20)) {
    errors.items = 'Quantity for each item must be between 1 and 20.'
  }
  return errors
}
