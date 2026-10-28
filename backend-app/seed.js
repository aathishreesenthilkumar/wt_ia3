// Adds sample restaurants so the app has data to show. Run with: npm run seed
const mongoose = require("mongoose");
const { Restaurant } = require("./models");

const restaurants = [
  { restaurantId: "R101", name: "Annapoorna Veg Restaurant", location: "Gandhipuram, Coimbatore", contactNumber: "9876543210" },
  { restaurantId: "R102", name: "Spice Garden", location: "RS Puram, Coimbatore", contactNumber: "9123456780" },
  { restaurantId: "R103", name: "Dragon Wok", location: "Peelamedu, Coimbatore", contactNumber: "9988776655" },
  { restaurantId: "R104", name: "Pizza Point", location: "Saibaba Colony, Coimbatore", contactNumber: "8899001122" },
  { restaurantId: "R105", name: "Hotel Saravana Bhavan", location: "T Nagar, Chennai", contactNumber: "9445566778" }
];

async function seed() {
  await mongoose.connect("mongodb://127.0.0.1:27017/food_delivery_db");
  for (const r of restaurants) {
    await Restaurant.updateOne({ restaurantId: r.restaurantId }, r, { upsert: true });
  }
  console.log(`Added ${restaurants.length} sample restaurants`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.log(err);
  process.exit(1);
});
