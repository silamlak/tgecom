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

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
}

export const addProduct = async (req, res, next) => {
  const { name, price, category, description } = req.body;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images uploaded" });
  }

  try {
    const imageUrls = [];

    // Upload images to Cloudinary
    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "products",
        resource_type: "auto",
      });

      // Validate the URL
      if (!result.secure_url || !isValidUrl(result.secure_url)) {
        throw new Error(
          `Invalid Cloudinary URL generated for file: ${file.originalname}`
        );
      }
      imageUrls.push(result.secure_url);
    }

    // Create product in database
    const product = new Product({
      name,
      price,
      category,
      imageUrl: imageUrls,
      description,
    });

    const newProduct = await product.save();

    if (imageUrls.length > 0) {
      const users = await User.find({ userId: { $exists: true } }); // Only users with userId
      const safeName = escapeMarkdown(name);
      const safeDescription = escapeMarkdown(description);
      // Prepare media group (first 10 images)
      const mediaGroup = imageUrls.slice(0, 10).map((url, index) => ({
        type: "photo",
        media: url,
        caption:
          index === 0
            ? `💫 New Product 💫\nName: ${safeName}\nPrice: ${price} ETB\n${safeDescription.substring(
                0,
                2000
              )}`
            : undefined,
        parse_mode: "MarkdownV2",
      }));

      // Send to each user with error handling
      for (const user of users) {
        try {
          // Validate chat_id
          if (!user.userId || isNaN(user.userId)) {
            console.warn(`Invalid user ID for ${user._id}: ${user.userId}`);
            continue;
          }

          console.log(`Processing user ${user.userId}`);

          // Send media group
          const mediaResponse = await axios
            .post(`${TELEGRAM_API}/sendMediaGroup`, {
              chat_id: user.userId,
              media: mediaGroup,
            })
            .catch((err) => {
              console.error(
                `MediaGroup error for ${user.userId}:`,
                err.response?.data || err.message
              );
              throw err;
            });

          // Send buttons message
          await axios
            .post(`${TELEGRAM_API}/sendMessage`, {
              chat_id: user.userId,
              text: "Order this product now!",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🛒 Order Now",
                      callback_data: `neworder_${newProduct._id}`,
                    },
                  ],
                ],
              },
            })
            .catch((err) => {
              console.error(
                `Message error for ${user.userId}:`,
                err.response?.data || err.message
              );
            });

          // Small delay between users to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to notify user ${user.userId}:`, error.message);
          continue; // Continue with next user
        }
      }
    }

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    next(error);
  }
};

// Helper function to validate URLs
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

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
