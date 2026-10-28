const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/food_delivery_db")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const restaurantSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  contactNumber: { type: String, required: true, match: [/^\d{10}$/, "Contact number must have 10 digits"] }
});
const Restaurant = mongoose.model("Restaurant", restaurantSchema, "restaurants");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true, match: [/^\d{10}$/, "Phone number must have 10 digits"] },
  deliveryAddress: { type: String, required: true },
  restaurantName: { type: String, required: true },
  items: [{ itemName: String, price: Number, quantity: Number }],
  totalBill: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Placed"
  }
});
const Order = mongoose.model("Order", orderSchema, "orders");

// Food items that can be ordered, with prices in rupees.
const menu = [
  { itemName: "Veg Biryani", price: 180 },
  { itemName: "Chicken Biryani", price: 240 },
  { itemName: "Masala Dosa", price: 90 },
  { itemName: "Veg Noodles", price: 150 },
  { itemName: "Margherita Pizza", price: 260 },
  { itemName: "Fresh Lime Soda", price: 60 }
];

// Order status moves forward in this order.
const statusFlow = ["Placed", "Preparing", "Out for Delivery", "Delivered"];

app.get("/", (req, res) => {
  res.json({ message: "Online Food Delivery Management System API" });
});

// View all restaurants, or search by name or location.
app.get("/api/restaurants", async (req, res) => {
  try {
    let restaurants;
    if (req.query.search) {
      const pattern = new RegExp(req.query.search, "i");
      restaurants = await Restaurant.find({ $or: [{ name: pattern }, { location: pattern }] });
    } else {
      restaurants = await Restaurant.find();
    }
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a restaurant.
app.post("/api/restaurants", async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.json({ message: "Restaurant added successfully" });
  } catch (err) {
    res.status(400).json({ message: err.code === 11000 ? "Restaurant ID already exists" : err.message });
  }
});

// Update a restaurant using its Restaurant ID.
app.put("/api/restaurants/:restaurantId", async (req, res) => {
  try {
    const { name, location, contactNumber } = req.body;
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: req.params.restaurantId },
      { name, location, contactNumber },
      { runValidators: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ message: "Restaurant updated successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a restaurant using its Restaurant ID.
app.delete("/api/restaurants/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({ restaurantId: req.params.restaurantId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ message: "Restaurant deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List the food items.
app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// View all orders (newest first), or only orders with one status.
app.get("/api/orders", async (req, res) => {
  try {
    let orders;
    if (req.query.status) {
      orders = await Order.find({ status: req.query.status }).sort({ _id: -1 });
    } else {
      orders = await Order.find().sort({ _id: -1 });
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Place an order. The total bill is calculated here from the menu prices.
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerPhone, deliveryAddress, restaurantName, items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Select at least one food item" });
    }

    const orderItems = [];
    let totalBill = 0;
    for (const item of items) {
      const food = menu.find((m) => m.itemName === item.itemName);
      if (!food) {
        return res.status(400).json({ message: "Invalid food item" });
      }
      orderItems.push({ itemName: food.itemName, price: food.price, quantity: item.quantity });
      totalBill += food.price * item.quantity;
    }

    const count = await Order.countDocuments();
    const order = new Order({
      orderId: "ORD" + (1001 + count),
      customerName, customerPhone, deliveryAddress, restaurantName,
      items: orderItems,
      totalBill
    });
    await order.save();
    res.json({ message: `Order ${order.orderId} placed. Total bill: Rs. ${totalBill}` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Move an order to its next status.
app.put("/api/orders/:orderId/status", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({ message: `Order is already ${order.status}` });
    }
    order.status = statusFlow[statusFlow.indexOf(order.status) + 1];
    await order.save();
    res.json({ message: `Order ${order.orderId} is now ${order.status}` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel an order. Only Placed orders can be cancelled.
app.put("/api/orders/:orderId/cancel", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "Placed") {
      return res.status(400).json({ message: `Order cannot be cancelled once it is ${order.status}` });
    }
    order.status = "Cancelled";
    await order.save();
    res.json({ message: `Order ${order.orderId} cancelled` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
