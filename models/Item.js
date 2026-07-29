const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true,
    enum: ["Electronics", "Tools", "Vehicles", "Other"],
    default: "Other"
  },
  image: {
    type: String,
    default: "./images/laptop.png"
  },
  description: {
    type: String,
    default: "No description provided."
  },
  location: {
    type: String,
    default: "Campus"
  },
  phone: {
    type: String,
    default: "N/A"
  },
  owner: {
    type: String,
    default: "Ram Mandloi"
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Item", itemSchema);
