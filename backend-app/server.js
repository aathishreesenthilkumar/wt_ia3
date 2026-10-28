const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Restaurant, Order, ORDER_STATUSES, CANCELLABLE_STATUSES } = require("./models");
const menu = require("./menu");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const MONGO_URL = "mongodb://127.0.0.1:27017/food_delivery_db";

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Turn Mongoose / MongoDB errors into one readable message.
function errorMessage(err) {
  if (err.code === 11000) return err.keyValue?.orderId ? "Order ID already exists" : "Restaurant ID already exists";
  if (err.name === "ValidationError") {
    return Object.values(err.errors).map((e) => e.message).join(", ");
  }
  return err.message;
}

// Escape user text before using it inside a regular expression.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

app.get("/", (req, res) => {
  res.json({ message: "Online Food Delivery Management System API" });
});

/* ---------------- Restaurants ---------------- */

// View all restaurants, or search by name or location.
app.get("/api/restaurants", async (req, res) => {
  try {
    const filter = {};
    const search = (req.query.search || "").trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: pattern }, { location: pattern }];
    }
    const restaurants = await Restaurant.find(filter).sort({ restaurantId: 1 });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Find one restaurant by its Restaurant ID.
app.get("/api/restaurants/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ restaurantId: req.params.restaurantId.toUpperCase() });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a new restaurant.
app.post("/api/restaurants", async (req, res) => {
  try {
    const { restaurantId, name, location, contactNumber } = req.body;
    const restaurant = new Restaurant({ restaurantId, name, location, contactNumber });
    await restaurant.save();
    res.status(201).json({ message: "Restaurant added successfully", restaurant });
  } catch (err) {
    res.status(400).json({ message: errorMessage(err) });
  }
});

// Update a restaurant's details.
app.put("/api/restaurants/:restaurantId", async (req, res) => {
  try {
    const { name, location, contactNumber } = req.body;
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: req.params.restaurantId.toUpperCase() },
      { name, location, contactNumber },
      { returnDocument: "after", runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json({ message: "Restaurant updated successfully", restaurant });
  } catch (err) {
    res.status(400).json({ message: errorMessage(err) });
  }
});

// Delete a restaurant (only when it has no active orders).
app.delete("/api/restaurants/:restaurantId", async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId.toUpperCase();
    const activeOrders = await Order.countDocuments({
      restaurantId,
      status: { $in: ["Placed", "Preparing", "Out for Delivery"] }
    });
    if (activeOrders > 0) {
      return res.status(400).json({ message: "Cannot delete: this restaurant has active orders" });
    }
    const restaurant = await Restaurant.findOneAndDelete({ restaurantId });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json({ message: "Restaurant deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ---------------- Menu ---------------- */

app.get("/api/menu", (req, res) => {
  res.json(menu);
});

/* ---------------- Orders ---------------- */

// View all orders, optionally filtered by status or order ID.
app.get("/api/orders", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.orderId) filter.orderId = req.query.orderId.trim().toUpperCase();
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create the next order ID: ORD1001, ORD1002, ...
async function nextOrderId() {
  const last = await Order.findOne().sort({ createdAt: -1 });
  const lastNumber = last ? parseInt(last.orderId.replace("ORD", ""), 10) : 1000;
  return "ORD" + (lastNumber + 1);
}

// Place a new order. The bill is calculated on the server from menu prices.
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerPhone, deliveryAddress, restaurantId, items } = req.body;

    const restaurant = await Restaurant.findOne({ restaurantId: (restaurantId || "").toUpperCase() });
    if (!restaurant) return res.status(400).json({ message: "Select a valid restaurant" });

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Select at least one food item" });
    }

    const orderItems = [];
    for (const item of items) {
      const menuItem = menu.find((m) => m.itemName === item.itemName);
      const quantity = Number(item.quantity);
      if (!menuItem) return res.status(400).json({ message: `Unknown food item: ${item.itemName}` });
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ message: `Quantity for ${item.itemName} must be between 1 and 20` });
      }
      orderItems.push({ itemName: menuItem.itemName, price: menuItem.price, quantity });
    }

    const totalBill = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = new Order({
      orderId: await nextOrderId(),
      customerName,
      customerPhone,
      deliveryAddress,
      restaurantId: restaurant.restaurantId,
      restaurantName: restaurant.name,
      items: orderItems,
      totalBill
    });
    await order.save();
    res.status(201).json({ message: `Order ${order.orderId} placed successfully. Total: Rs. ${totalBill}`, order });
  } catch (err) {
    res.status(400).json({ message: errorMessage(err) });
  }
});

// Update order status. Status can only move forward: Placed -> Preparing -> Out for Delivery -> Delivered.
app.put("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status) || status === "Cancelled") {
      return res.status(400).json({ message: "Choose a valid status" });
    }
    const order = await Order.findOne({ orderId: req.params.orderId.toUpperCase() });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({ message: `Order is already ${order.status}` });
    }
    if (ORDER_STATUSES.indexOf(status) <= ORDER_STATUSES.indexOf(order.status)) {
      return res.status(400).json({ message: `Status cannot go back from ${order.status} to ${status}` });
    }
    order.status = status;
    await order.save();
    res.json({ message: `Order ${order.orderId} is now ${status}`, order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel an order. Only orders that are Placed or Preparing can be cancelled.
app.put("/api/orders/:orderId/cancel", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId.toUpperCase() });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: `Order cannot be cancelled once it is ${order.status}` });
    }
    order.status = "Cancelled";
    await order.save();
    res.json({ message: `Order ${order.orderId} cancelled successfully`, order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
