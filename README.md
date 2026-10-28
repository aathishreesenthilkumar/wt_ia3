# Online Food Delivery Management System

IA3 project for **Web Technology (23CS2048)**. A simple full stack app to manage restaurants and food orders: add, view, search, update and delete restaurants; place orders with an automatically calculated bill; track order status; and cancel orders.

## Technologies

- Frontend: React (Vite), Bootstrap, Axios
- Backend: Node.js, Express
- Database: MongoDB, Mongoose

## Features

| Feature | Description |
| --- | --- |
| Add New Restaurant | Restaurant ID, name, location and 10-digit contact number |
| View / Search Restaurants | Table of all restaurants; search by name or location |
| Update / Delete Restaurant | Edit and Delete buttons on each row |
| Place Food Orders | Customer details, restaurant, food items and quantities; the total bill is calculated on the server |
| Track Order Status | Placed → Preparing → Out for Delivery → Delivered, using the Next Status button |
| Cancel Orders | Allowed only while an order is Placed |

## Run

Install Node.js 22.12+ and MongoDB. Start MongoDB locally on port `27017`.

Start the backend:

```sh
cd backend-app
npm install
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
  server.js      Express app, Mongoose schemas, menu and REST API routes
frontend-app/src/
  main.jsx       Loads Bootstrap and renders App
  App.jsx        The whole user interface
```

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/restaurants?search=` | View all / search restaurants by name or location |
| POST | `/api/restaurants` | Add a restaurant |
| PUT | `/api/restaurants/:restaurantId` | Update a restaurant |
| DELETE | `/api/restaurants/:restaurantId` | Delete a restaurant |
| GET | `/api/menu` | List food items and prices |
| GET | `/api/orders?status=` | View all orders, or one status |
| POST | `/api/orders` | Place an order |
| PUT | `/api/orders/:orderId/status` | Move an order to its next status |
| PUT | `/api/orders/:orderId/cancel` | Cancel an order (Placed only) |

## Schema

Database: `food_delivery_db`

Collection `restaurants`

| Field | Type | Rules |
| --- | --- | --- |
| `restaurantId` | String | Required, unique |
| `name` | String | Required |
| `location` | String | Required |
| `contactNumber` | String | Required, 10 digits |

Collection `orders`

| Field | Type | Rules |
| --- | --- | --- |
| `orderId` | String | Generated, unique (`ORD1001`, `ORD1002`, ...) |
| `customerName` | String | Required |
| `customerPhone` | String | Required, 10 digits |
| `deliveryAddress` | String | Required |
| `restaurantName` | String | Required |
| `items` | Array | `{ itemName, price, quantity }` |
| `totalBill` | Number | Calculated on the server from menu prices |
| `status` | String | `Placed`, `Preparing`, `Out for Delivery`, `Delivered`, `Cancelled` |

MongoDB adds `_id` automatically.
