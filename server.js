require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const User = require("./models/User");
const Item = require("./models/Item");
const Booking = require("./models/Booking");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Connect Database
connectDB();

// Seed initial items if collection is empty
const seedDefaultItems = async () => {
  try {
    const count = await Item.countDocuments();
    if (count === 0) {
      const defaultItems = [
        { name: "High-Performance Laptop", price: 25, category: "Electronics", image: "./images/laptop.png" },
        { name: "DSLR Canon Camera", price: 18, category: "Electronics", image: "./images/camera.png" },
        { name: "Power Drill Machine", price: 8, category: "Tools", image: "./images/drill.png" },
        { name: "Mountain Bicycle", price: 5, category: "Vehicles", image: "./images/bicycle.png" }
      ];
      await Item.insertMany(defaultItems);
      console.log("[MongoDB] Default items seeded successfully.");
    }
  } catch (err) {
    console.error("[MongoDB Seed Error]:", err.message);
  }
};

// Seed on startup (once mongoose finishes connecting)
const mongoose = require("mongoose");
mongoose.connection.once("open", () => {
  seedDefaultItems();
});

// --- API ROUTES ---

// Health Check / DB Status
app.get("/api/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: "OK",
    dbState: isConnected ? "Connected to MongoDB" : "Disconnected",
    timestamp: new Date()
  });
});

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const user = new User({ name, email, password, address });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: { name: user.name, email: user.email, address: user.address }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: { name: user.name, email: user.email, address: user.address }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Items Routes
app.get("/api/items", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== "All") {
      query.category = category;
    }
    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: "Name, price, and category are required" });
    }

    let img = image;
    if (!img) {
      img = "./images/laptop.png";
      if (category === "Tools") img = "./images/drill.png";
      if (category === "Vehicles") img = "./images/bicycle.png";
      if (category === "Electronics") img = "./images/camera.png";
    }

    const newItem = new Item({
      name,
      price: Number(price),
      category,
      image: img
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookings Routes
app.post("/api/bookings", async (req, res) => {
  try {
    const { userName, userAddress, itemName, rentalDays, totalPrice } = req.body;
    if (!userName || !userAddress || !itemName || !rentalDays || !totalPrice) {
      return res.status(400).json({ error: "All booking fields are required" });
    }

    const booking = new Booking({
      userName,
      userAddress,
      itemName,
      rentalDays: Number(rentalDays),
      totalPrice: Number(totalPrice)
    });

    await booking.save();
    res.status(201).json({ message: "Booking recorded successfully in MongoDB", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[RentEasy Server] Running on http://localhost:${PORT}`);
});
