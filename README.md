# Online Food Delivery Management System

IA3 project for **Web Technology (23CS2048)**. A full stack web application to manage restaurants and food orders: add, view, search, update and delete restaurants; place orders with an automatically calculated bill; track order status; and cancel eligible orders.

## Technologies

- Frontend: React (Vite), Bootstrap 5, Bootstrap Icons, Axios
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose

## Features

| Feature | Description |
| --- | --- |
| Add New Restaurant | Restaurant ID, name, location and contact number, validated on both client and server |
| View All Restaurants | Table of all registered restaurants with Edit and Delete actions |
| Search Restaurants | Case-insensitive search by restaurant name or location |
| Place Food Orders | Customer details, food items and quantities; the total bill is calculated on the server |
| Track Order Status | Placed → Preparing → Out for Delivery → Delivered (status can only move forward) |
| Cancel Orders | Allowed only while an order is Placed or Preparing; the order is kept and marked Cancelled |

## Run

Install Node.js 22.12+ and MongoDB. Start MongoDB locally on port `27017`.

Start the backend:

```sh
cd backend-app
npm install
npm run seed     # optional: adds 5 sample restaurants
npm run dev
```

In another terminal, start the frontend:

```sh
cd frontend-app
npm install
npm run dev
```

Open `http://localhost:5173`. The backend runs at `http://localhost:5000`.

## Project structure

```
backend-app/
  server.js        Express app and REST API routes
  models.js        Mongoose schemas (Restaurant, Order)
  menu.js          Food items and prices
  seed.js          Sample restaurant data
frontend-app/src/
  App.jsx          Layout, tabs, dashboard counts, API calls
  api.js           Axios instance and shared constants
  validation.js    Client-side validation rules
  components/      RestaurantForm, RestaurantList, OrderForm, OrderList
```

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/restaurants?search=` | View all / search restaurants by name or location |
| GET | `/api/restaurants/:restaurantId` | Get one restaurant |
| POST | `/api/restaurants` | Add a restaurant |
| PUT | `/api/restaurants/:restaurantId` | Update a restaurant |
| DELETE | `/api/restaurants/:restaurantId` | Delete a restaurant (blocked if it has active orders) |
| GET | `/api/menu` | List food items and prices |
| GET | `/api/orders?status=&orderId=` | View / filter orders |
| POST | `/api/orders` | Place an order |
| PUT | `/api/orders/:orderId/status` | Update order status |
| PUT | `/api/orders/:orderId/cancel` | Cancel an eligible order |

## Schema

Database: `food_delivery_db`

Collection `restaurants`

| Field | Type | Rules |
| --- | --- | --- |
| `restaurantId` | String | Required, unique, format `R101` |
| `name` | String | Required, at least 3 characters |
| `location` | String | Required |
| `contactNumber` | String | Required, 10-digit mobile number |

Collection `orders`

| Field | Type | Rules |
| --- | --- | --- |
| `orderId` | String | Generated, unique (`ORD1001`, `ORD1002`, ...) |
| `customerName` | String | Letters only, 3-50 characters |
| `customerPhone` | String | 10-digit mobile number |
| `deliveryAddress` | String | At least 10 characters |
| `restaurantId`, `restaurantName` | String | Must refer to an existing restaurant |
| `items` | Array | `{ itemName, price, quantity }`, quantity 1-20, at least one item |
| `totalBill` | Number | Calculated on the server from menu prices |
| `status` | String | `Placed`, `Preparing`, `Out for Delivery`, `Delivered`, `Cancelled` |

Both collections also store `createdAt` and `updatedAt` timestamps. MongoDB adds `_id` automatically.
