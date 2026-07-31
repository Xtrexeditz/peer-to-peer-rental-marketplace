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
    const item = await Item.findOne({ name: itemName });
    const ownerName = item ? item.owner : "Ram Mandloi";
    const booking = await Booking.create({ userName, userAddress, userPhone, itemName, rentalDays: Number(rentalDays), totalPrice: Number(totalPrice), ownerName });
    res.status(201).json({ message: "Success", booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/bookings", async (req, res) => {
  try {
    let q = {};
    if (req.query.userName) {
      q.userName = req.query.userName;
    } else if (req.query.ownerName) {
      q.ownerName = req.query.ownerName;
    }
    res.json(await Booking.find(q).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/bookings/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (status === "Confirmed") await Item.findOneAndUpdate({ name: booking.itemName }, { available: false });
    if (status === "Cancelled") await Item.findOneAndUpdate({ name: booking.itemName }, { available: true });
    res.json({ message: "Success", booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

if (require.main === module) {
  app.listen(process.env.PORT || 5000, () => console.log(`[Server] Running on port ${process.env.PORT || 5000}`));
}
module.exports = app;
