const mongoose = require("mongoose");

// Order status values, in the order an order moves through them.
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

// Orders can only be cancelled before they leave the restaurant.
const CANCELLABLE_STATUSES = ["Placed", "Preparing"];

const restaurantSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: [true, "Restaurant ID is required"],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^R\d{3,5}$/, "Restaurant ID must look like R101 (R followed by 3-5 digits)"]
  },
  name: {
    type: String,
    required: [true, "Restaurant name is required"],
    trim: true,
    minlength: [3, "Restaurant name must have at least 3 characters"]
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    match: [/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit mobile number"]
  }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: [1, "Price must be at least 1"] },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    max: [20, "Quantity cannot be more than 20"]
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
    match: [/^[A-Za-z .]{3,50}$/, "Customer name must contain only letters (3-50 characters)"]
  },
  customerPhone: {
    type: String,
    required: [true, "Customer phone is required"],
    match: [/^[6-9]\d{9}$/, "Customer phone must be a valid 10-digit mobile number"]
  },
  deliveryAddress: {
    type: String,
    required: [true, "Delivery address is required"],
    trim: true,
    minlength: [10, "Delivery address must have at least 10 characters"]
  },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  items: {
    type: [orderItemSchema],
    validate: [(items) => items.length > 0, "Select at least one food item"]
  },
  totalBill: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ORDER_STATUSES, default: "Placed" }
}, { timestamps: true });

const Restaurant = mongoose.model("Restaurant", restaurantSchema, "restaurants");
const Order = mongoose.model("Order", orderSchema, "orders");

module.exports = { Restaurant, Order, ORDER_STATUSES, CANCELLABLE_STATUSES };
