const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ====== ORDER MODEL ======
const orderSchema = new mongoose.Schema({
  orderId: String,
  items: [String],
  total: Number,
  name: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// ====== USER MODEL ======
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model("User", userSchema);

// ====== ADMIN LOGIN ======
app.post("/api/login", async (req,res)=>{
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if(!user) return res.status(401).json({ message:"Invalid" });
  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.status(401).json({ message:"Invalid" });
  const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:"12h"});
  res.json({ token });
});

// ====== CREATE ORDER ======
app.post("/api/order", async (req,res)=>{
  const order = new Order(req.body);
  await order.save();
  res.json({ message:"Order saved" });
});

// ====== GET ORDERS (PROTECTED) ======
app.get("/api/orders", async (req,res)=>{
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({ message:"Unauthorized" });
  try{
    jwt.verify(token, process.env.JWT_SECRET);
    const orders = await Order.find().sort({ createdAt:-1 });
    res.json(orders);
  }catch(e){
    res.status(401).json({ message:"Unauthorized" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log("Server running on port "+PORT));
