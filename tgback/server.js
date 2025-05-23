// server.js
import express from "express";
import connectDB from "./db.js";
import { config } from "dotenv";
import Category from "./model/categoryModel.js";
import Product from "./model/productModel.js";
import Order from "./model/orderModel.js";
import User from "./model/userModel.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import cors from 'cors'
import adminRoute from './route/adminRoute.js'

config();
connectDB();

const app = express();
app.use(cors())
app.use(express.json());

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT}`;

app.use('/api/admin', adminRoute)

// Get product by ID
app.get("/api/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create a new product and notify subscribers
app.post("/api/products", async (req, res) => {
  const { name, price, category, imageUrl, description } = req.body;

  try {
    const product = new Product({
      name,
      price,
      category,
      imageUrl,
      description,
    });
    const newProduct = await product.save();

    // Fetch all subscribed users
    // const users = await User.find();

    // console.log(users)

    // for (const user of users) {
    //   console.log("Sending to chat_id:", user.userId);

    //   try {
    //     await axios.post(`${TELEGRAM_API}/sendPhoto`, {
    //       chat_id: user.userId,
    //       photo: imageUrl || "https://via.placeholder.com/300.png",
    //       caption: `💫 New Product💫 \nName: ${name}\nPrice: ${price} ETB\n${description}`,
    //       parse_mode: "Markdown",
    //       reply_markup: JSON.stringify({
    //         inline_keyboard: [
    //           [
    //             {
    //               text: "🛒 Order Now",
    //               callback_data: `neworder_${newProduct._id}`, // This will trigger your add_ regex handler
    //             },
    //           ],
    //         ],
    //       }),
    //     });
    //   } catch (error) {
    //     console.error(
    //       `Failed to notify user ${user.chatId}:`,
    //       error.response?.data || error.message
    //     );
    //   }
    // }

    res
      .status(201)
      .json({ message: "Product created and users notified", product });
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Create an order
app.post("/api/orders", async (req, res) => {
  const { userId, productId, productName, price } = req.body;
  try {
    const order = new Order({ userId, productId, productName, price });
    await order.save();
    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Register or update user
app.post("/api/users", async (req, res) => {
  const { userId, firstName, chatId } = req.body; // Add chatId
  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { firstName, chatId, subscribed: true },
      { upsert: true, new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api
  .ping()
  .then(() => console.log("Cloudinary connected successfully"))
  .catch((err) => console.log("Cloudinary connection failed", { error: err }));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
