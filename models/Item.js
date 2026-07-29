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
  owner: {
    type: String,
    default: "Campus Renter"
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
