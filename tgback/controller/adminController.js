import Order from "../model/orderModel.js";
import Product from "../model/productModel.js";
import Category from "../model/categoryModel.js";
import User from "../model/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import { Telegraf } from "telegraf";
import { config } from "dotenv";
import axios from "axios";
config();

import { sendTelegramNotification } from "../utils/telegramSender.js";
const bot = new Telegraf(process.env.BOT);

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT}`;

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("productId", "name price imageUrl") // Only populate specific fields
      .lean();

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const orders = await Order.findById(id)
      .populate("productId", "name price imageUrl") // Only populate specific fields
      .lean();

    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    res.status(200).json({
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res, next) => {
  const { name, price, category, description } = req.body;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images uploaded" });
  }

  try {

    const imageUrls = [];

    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "products", // optional folder in Cloudinary
        resource_type: "auto",
      });

      imageUrls.push(result.secure_url);
    }

    const product = new Product({
      name,
      price,
      category,
      imageUrl: imageUrls, // This will be an array of URLs
      description,
    });

    const newProduct = await product.save();

    if (imageUrls.length > 0) {
      const mediaGroup = imageUrls.map((url, index) => ({
        type: "photo",
        media: url,
        caption:
          index === 0
            ? `💫 New Product💫 \nName: ${name}\nPrice: ${price} ETB\n${description}`
            : undefined,
        parse_mode: "Markdown",
      }));

      const users = await User.find();

      for (const user of users) {
        console.log("Sending to chat_id:", user.userId);

        await axios.post(`${TELEGRAM_API}/sendMediaGroup`, {
          chat_id: user.userId,
          media: mediaGroup,
        });

        // Send buttons separately since media group can't have reply_markup
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: user.userId,
          text: "Order this product now!",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                {
                  text: "🛒 Order Now",
                  callback_data: `neworder_${newProduct._id}`,
                },
              ],
            ],
          }),
        });
      }
    }

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const processOrder = async (req, res, next) => {
  const { id } = req.params;
  const { action, description, orderId, phone } = req.body;
  try {
    const order = await Order.findById(orderId).populate(
      "productId",
      "name price imageUrl"
    );
    // console.log(order)
    await sendTelegramNotification(id, action, description, order, phone);

    res.status(200).json({
      message: "Order processed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addCategory = async (req, res, next) => {
  try {
    await new Category(req.body).save();
    res.status(201).json({
      message: "Category created successfully",
    });
  } catch (err) {
    next(err);
  }
};
