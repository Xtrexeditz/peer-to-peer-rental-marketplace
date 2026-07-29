require("dotenv").config();
const express = require("express"), cors = require("cors");
const connectDB = require("./config/db"), User = require("./models/User"), Item = require("./models/Item"), Booking = require("./models/Booking");
const app = express();

app.use(cors(), express.json({ limit: "10mb" }), express.urlencoded({ limit: "10mb", extended: true }), express.static(__dirname));
connectDB();

const mongoose = require("mongoose");
mongoose.connection.once("open", async () => {
  // Update existing default items (lenders) in database from legacy defaults to user's name
  await Item.updateMany({ owner: "Campus Renter" }, { owner: "Ram Mandloi" });

  if (await Item.countDocuments() === 0) {
    await Item.insertMany([
      { name: "High-Performance Laptop", price: 25, category: "Electronics", image: "./images/laptop.png", description: "Powerful Core i7 laptop with 16GB RAM and 512GB SSD. Perfect for coding, project presentation, and campus assignments.", location: "Block C, Room 102", phone: "7894195751", owner: "Ram Mandloi" },
      { name: "DSLR Canon Camera", price: 18, category: "Electronics", image: "./images/camera.png", description: "Canon DSLR with 18-55mm lens, battery, and 64GB memory card. Ideal for photography projects, campus festivals, and vlog shoots.", location: "Hostel 3, Room 304", phone: "9876543210", owner: "Rahul Sharma" },
      { name: "Power Drill Machine", price: 8, category: "Tools", image: "./images/drill.png", description: "Multi-functional impact power drill machine with a complete bit-set. Perfect for student room assembly and DIY campus engineering tasks.", location: "Block D, Room 205", phone: "8765432109", owner: "Aman Gupta" },
      { name: "Mountain Bicycle", price: 5, category: "Vehicles", image: "./images/bicycle.png", description: "18-speed hybrid gear mountain bicycle in excellent condition. Comes with safety helmet and lock. Great for quick campus commutes.", location: "Block C Cycle Stand", phone: "7654321098", owner: "Rohan Verma" }
    ]);
  }
});

app.get("/api/health", (req, res) => res.json({ status: "OK", dbState: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" }));

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) return res.status(400).json({ error: "All fields required" });
    if (await User.findOne({ email })) return res.status(400).json({ error: "Email already exists" });
    const user = await User.create({ name, email, password, address });
    res.status(201).json({ user: { name: user.name, email: user.email, address: user.address } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ user: { name: user.name, email: user.email, address: user.address } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/items", async (req, res) => {
  try {
    const q = req.query.category && req.query.category !== "All" ? { category: req.query.category } : {};
    res.json(await Item.find(q).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/items", async (req, res) => {
  try {
    const { name, price, category, image, description, location, phone, owner } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: "Missing fields" });
    const img = image || (category === "Tools" ? "./images/drill.png" : category === "Vehicles" ? "./images/bicycle.png" : category === "Electronics" ? "./images/camera.png" : "./images/laptop.png");
    res.status(201).json(await Item.create({ name, price: Number(price), category, image: img, description, location, phone, owner }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const { userName, userAddress, userPhone, itemName, rentalDays, totalPrice } = req.body;
    if (!userName || !userAddress || !userPhone || !itemName || !rentalDays || !totalPrice) return res.status(400).json({ error: "Missing fields" });
    const booking = await Booking.create({ userName, userAddress, userPhone, itemName, rentalDays: Number(rentalDays), totalPrice: Number(totalPrice) });
    res.status(201).json({ message: "Success", booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/bookings", async (req, res) => {
  try { res.json(await Booking.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

if (require.main === module) {
  app.listen(process.env.PORT || 5000, () => console.log(`[Server] Running on port ${process.env.PORT || 5000}`));
}
module.exports = app;
